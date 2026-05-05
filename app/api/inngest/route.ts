import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/functions';
import { onIncomeArrival, executeNestedRules } from '@/lib/inngest/functions';

// Create Inngest server
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [onIncomeArrival, executeNestedRules],
});
