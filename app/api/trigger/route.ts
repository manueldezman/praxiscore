import { serve } from '@trigger.dev/sdk/nextjs';
import { processScheduledRules, processOneOffRules, reconcileCapTotals } from '@/lib/trigger/jobs';

// Create Trigger.dev server
export const { GET, POST, PUT } = serve({
  id: 'praxicore',
  jobs: [processScheduledRules, processOneOffRules, reconcileCapTotals],
});
