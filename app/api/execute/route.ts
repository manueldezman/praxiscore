import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, getWalletForUser } from '../auth/[...nextauth]/route';
import { recoverKeypair } from '@/lib/wallet/walletService';
import { executePrivateDisbursement } from '@/lib/cloak/cloakService';
import { computeAllocations } from '@/lib/engine/ruleEngine';
import { parseRule } from '@/lib/parser/nlParser';
import type { ResolvedAllocation } from '@/lib/types';

// Convert SOL to lamports
function solToLamports(sol: number): bigint {
  return BigInt(Math.floor(sol * 1_000_000_000));
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { userId?: string })?.userId;

    const { inflowAmount, ruleText, allocations: clientAllocations, simulate } = await req.json();

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
    const walletData = getWalletForUser(userId);
    if (!walletData) {
      return NextResponse.json({ error: 'Wallet not found for user' }, { status: 404 });
    }

    const signerKeypair = recoverKeypair(walletData.encryptedSecretKey);
    const lamports = solToLamports(inflowAmount);

    const result = await executePrivateDisbursement(
      lamports,
      finalAllocations,
      signerKeypair,
    );

    return NextResponse.json({ ...result, allocations: finalAllocations });
  } catch (err) {
    console.error('[/api/execute]', err);
    return NextResponse.json({ error: 'Execution failed' }, { status: 500 });
  }
}
