import { serve } from 'inngest/next';
import { onIncomeArrival, executeNestedRules } from '@/lib/inngest/functions';

// Create Inngest server
export const { GET, POST, PUT } = serve('praxicore', [onIncomeArrival, executeNestedRules]);
