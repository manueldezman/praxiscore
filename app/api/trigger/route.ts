// TODO: Update trigger.dev integration for v4 SDK
// import { serve } from '@trigger.dev/sdk';
// import { processScheduledRules, processOneOffRules, reconcileCapTotals } from '@/lib/trigger/jobs';

// Create Trigger.dev server
// export const { GET, POST, PUT } = serve({
//   id: 'praxicore',
//   jobs: [processScheduledRules, processOneOffRules, reconcileCapTotals],
// });

export async function GET() {
  return new Response('Trigger.dev integration pending update for v4 SDK', { status: 501 });
}

export async function POST() {
  return new Response('Trigger.dev integration pending update for v4 SDK', { status: 501 });
}
