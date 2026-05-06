import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { recoverKeypair } from '@/lib/wallet/walletService';
import { executePrivateDisbursement } from '@/lib/cloak/cloakService';
import { computeAllocations } from '@/lib/engine/ruleEngine';
import { parseRule } from '@/lib/parser/nlParser';
import { checkConditions } from '@/lib/engine/conditionEngine';
import { supabaseAdmin } from '@/lib/db/supabase';
import type { ResolvedAllocation } from '@/lib/types';

// Convert SOL to lamports
function solToLamports(sol: number): bigint {
  return BigInt(Math.floor(sol * 1_000_000_000));
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { userId?: string })?.userId;

    const { inflowAmount, ruleText, allocations: clientAllocations, simulate, currency = 'USDC' } = await req.json();

    if (!inflowAmount || inflowAmount <= 0) {
      return NextResponse.json({ error: 'Invalid inflow amount' }, { status: 400 });
    }

    // Resolve allocations (use provided or re-parse)
    let finalAllocations: ResolvedAllocation[] = clientAllocations ?? [];
    if (!finalAllocations.length && ruleText) {
      const { rules } = await parseRule(ruleText);
      const result = computeAllocations(inflowAmount, rules);
      finalAllocations = result.rules;
    }

    if (!finalAllocations.length) {
      return NextResponse.json({ error: 'No valid allocations' }, { status: 400 });
    }

    // Simulation mode — don't execute on-chain
    if (simulate || !userId) {
      await new Promise(r => setTimeout(r, 600)); // simulate latency
      return NextResponse.json({
        success: true,
        txSignatures: finalAllocations.map(a => `sim_${a.bucket}_${Date.now()}`),
        simulated: true,
        allocations: finalAllocations,
      });
    }

    // Real execution via Cloak SDK
    // Load wallet from Supabase
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (walletError || !wallet) {
      return NextResponse.json({ error: 'Wallet not found for user' }, { status: 404 });
    }

    const signerKeypair = recoverKeypair(wallet.encrypted_secret_key);
    const lamports = solToLamports(inflowAmount);

    // Load bucket destinations from bucket_wallets table
    const { data: bucketWallets } = await supabaseAdmin
      .from('bucket_wallets')
      .select('*')
      .eq('user_id', userId);

    // Load sub-accounts
    const { data: subAccounts } = await supabaseAdmin
      .from('sub_accounts')
      .select('*')
      .eq('user_id', userId);

    // Map bucket IDs to destinations
    const bucketDestinations = new Map<string, string>();
    const bucketSubAccounts = new Map<string, string>();

    if (bucketWallets) {
      for (const bw of bucketWallets) {
        bucketDestinations.set(bw.bucket_id, bw.address);
      }
    }

    if (subAccounts) {
      for (const sa of subAccounts) {
        bucketSubAccounts.set(sa.bucket_type, sa.public_key);
      }
    }

    // Update allocations with destinations
    const resolvedAllocations = finalAllocations.map(alloc => {
      const destination = bucketDestinations.get(alloc.bucket) || bucketSubAccounts.get(alloc.bucket);
      return { ...alloc, walletAddress: destination };
    });

    // Check conditions for each allocation
    const now = new Date();
    const results = [];

    for (const alloc of resolvedAllocations) {
      // Get rule ID for this bucket (simplified - in production would match by bucket)
      const { data: rule } = await supabaseAdmin
        .from('rules')
        .select('id')
        .eq('user_id', userId)
        .eq('bucket', alloc.bucket)
        .single();

      if (!rule) {
        // No rule found, skip condition check
        continue;
      }

      // Check conditions
      const conditionCheck = await checkConditions(rule.id, userId, inflowAmount);

      if (!conditionCheck.shouldExecute) {
        results.push({
          bucket: alloc.bucket,
          skipped: true,
          reason: conditionCheck.reason,
          redirect: conditionCheck.redirectBucket,
        });
        continue;
      }

      // Execute Cloak disbursement
      const result = await executePrivateDisbursement(
        lamports,
        [alloc],
        signerKeypair,
      );

      results.push({
        bucket: alloc.bucket,
        executed: true,
        redirect: conditionCheck.redirectBucket,
        txSignature: result.txSignatures[0],
      });

      // Write execution record
      await supabaseAdmin.from('rule_executions').insert({
        rule_id: rule.id,
        user_id: userId,
        amount: alloc.amount,
        token: currency,
        destination: conditionCheck.redirectBucket || alloc.bucket,
        tx_signatures: result.txSignatures,
        executed_at: now.toISOString(),
        period_year: now.getFullYear(),
        period_month: now.getMonth() + 1,
        status: 'success',
      });
    }

    return NextResponse.json({
      success: true,
      txSignatures: results.flatMap(r => r.txSignature ? [r.txSignature] : []),
      allocations: resolvedAllocations,
      results,
    });
  } catch (err) {
    console.error('[/api/execute]', err);
    return NextResponse.json({ error: 'Execution failed' }, { status: 500 });
  }
}
