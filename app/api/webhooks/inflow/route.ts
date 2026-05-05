import { NextRequest, NextResponse } from 'next/server';
import { inngest } from '@/lib/inngest/functions';

/**
 * Webhook endpoint for income arrival notifications
 * This is called by external services when funds arrive at a user's wallet
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, amount, token, txSignature } = await req.json();

    if (!userId || !amount || !txSignature) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, amount, txSignature' },
        { status: 400 }
      );
    }

    // Send event to Inngest to trigger rule execution
    await inngest.send({
      name: 'inflow/arrived',
      data: {
        userId,
        amount: Number(amount),
        token: token || 'USDC',
        txSignature,
      },
    });

    return NextResponse.json({ success: true, message: 'Event sent' });
  } catch (error) {
    console.error('[/api/webhooks/inflow]', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}
