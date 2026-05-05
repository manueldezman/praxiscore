import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { getComplianceReport, generateWalletViewingKey } from '@/lib/cloak/cloakService';
import { recoverKeypair } from '@/lib/wallet/walletService';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { userId?: string })?.userId;

    if (!userId) {
      return NextResponse.json({ summary: 'Sign in to access compliance reports', transactions: [] });
    }

    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('encrypted_secret_key')
      .eq('user_id', userId)
      .single();

    if (walletError || !wallet) {
      return NextResponse.json({ summary: 'Wallet not found', transactions: [] });
    }

    const keypair = recoverKeypair(wallet.encrypted_secret_key);
    const nk = await generateWalletViewingKey(keypair);
    const report = await getComplianceReport(nk);

    return NextResponse.json(report);
  } catch (err) {
    console.error('[/api/compliance]', err);
    return NextResponse.json({ summary: 'Compliance data unavailable', transactions: [] });
  }
}
