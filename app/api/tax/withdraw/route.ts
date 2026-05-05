import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getWalletForUser } from '@/lib/wallet/walletService';

export async function POST(req: NextRequest) {
  try {
    const { destination, amount } = await req.json();

    if (!destination) {
      return NextResponse.json(
        { error: 'Destination address is required' },
        { status: 400 }
      );
    }

    // Get session from NextAuth
    const session = await req.json().then(data => data.session);
    if (!session?.user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.userId;

    // Get tax sub-account
    const { data: subAccount, error: subError } = await supabaseAdmin
      .from('sub_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('bucket_type', 'tax')
      .single();

    if (subError || !subAccount) {
      return NextResponse.json({ error: 'Tax sub-account not found' }, { status: 404 });
    }

    // Get wallet keypair (decrypt)
    const wallet = getWalletForUser(userId);
    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    // TODO: Integrate with Cloak SDK for withdrawal
    // const cloak = new Cloak(wallet.secretKey);
    // const result = amount
    //   ? await cloak.partialWithdraw(subAccount.publicKey, destination, amount)
    //   : await cloak.fullWithdraw(subAccount.publicKey, destination);

    console.log('[TaxWithdraw] Withdrawal requested:', {
      userId,
      destination,
      amount,
      subAccount: subAccount.public_key,
    });

    // Write execution record
    const now = new Date();
    const { error: execError } = await supabaseAdmin.from('rule_executions').insert({
      rule_id: 'tax-withdrawal',
      user_id: userId,
      amount: amount || 0,
      token: 'SOL',
      destination,
      tx_signatures: [], // TODO: Get from Cloak
      executed_at: now.toISOString(),
      period_year: now.getFullYear(),
      period_month: now.getMonth() + 1,
      status: 'success',
    });

    if (execError) {
      console.error('[TaxWithdraw] Failed to record execution:', execError);
    }

    // Update sub-account balance
    // TODO: Get actual balance after withdrawal
    // const newBalance = await getBalance(subAccount.public_key);
    // await supabaseAdmin.from('sub_accounts')
    //   .update({ balance_lamports: newBalance })
    //   .eq('id', subAccount.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[/api/tax/withdraw]', error);
    return NextResponse.json({ error: 'Withdrawal failed' }, { status: 500 });
  }
}
