import { client } from '@trigger.dev/sdk/nextjs';
import { supabaseAdmin } from '@/lib/db/supabase';
import { checkConditions } from '@/lib/engine/conditionEngine';

function calculateNextRun(cronExpression: string): string {
  // Simple cron parser - in production use a proper cron library
  const now = new Date();
  const nextRun = new Date(now);

  // Default to next day at midnight
  nextRun.setDate(nextRun.getDate() + 1);
  nextRun.setHours(0, 0, 0, 0);

  return nextRun.toISOString();
}

// Process scheduled rules job
export const processScheduledRules = client.defineJob({
  id: 'process-scheduled-rules',
  name: 'Process Scheduled Rules',
  version: '0.0.1',
  trigger: client.interval({
    every: 60 * 60, // Every hour
  }),
  run: async () => {
    // Get all due scheduled rules
    const now = new Date();
    const { data: schedules, error } = await supabaseAdmin
      .from('schedules')
      .select('*, rules(*)')
      .lte('next_run_at', now.toISOString())
      .is('rules.is_active', true);

    if (error || !schedules || schedules.length === 0) {
      return { success: true, message: 'No scheduled rules due' };
    }

    const results = [];

    for (const schedule of schedules) {
      const rule = schedule.rules;
      if (!rule) continue;

      // Check conditions
      const conditionCheck = await checkConditions(rule.id, rule.user_id, 0);

      if (!conditionCheck.shouldExecute) {
        console.log(`[Trigger] Rule ${rule.id} skipped: ${conditionCheck.reason}`);
        continue;
      }

      // Execute rule
      console.log(`[Trigger] Executing scheduled rule ${rule.id}`);

      // Update last_run_at and calculate next_run_at
      const nextRun = calculateNextRun(rule.cron_expression || '');
      await supabaseAdmin
        .from('schedules')
        .update({
          last_run_at: now.toISOString(),
          next_run_at: nextRun,
        })
        .eq('id', schedule.id);

      results.push({
        ruleId: rule.id,
        executed: true,
      });
    }

    return { success: true, results };
  },
});

// Process one-off rules job
export const processOneOffRules = client.defineJob({
  id: 'process-one-off-rules',
  name: 'Process One-Off Rules',
  version: '0.0.1',
  trigger: client.event({
    name: 'one-off-rule.due',
  }),
  run: async ({ event }) => {
    const { ruleId } = event.data;

    const { data: rule, error } = await supabaseAdmin
      .from('rules')
      .select('*')
      .eq('id', ruleId)
      .single();

    if (error || !rule) {
      return { success: false, error: 'Rule not found' };
    }

    // Execute rule
    console.log(`[Trigger] Executing one-off rule ${ruleId}`);

    // Mark rule as inactive after execution
    await supabaseAdmin
      .from('rules')
      .update({ is_active: false })
      .eq('id', ruleId);

    return { success: true, ruleId };
  },
});

// Reconcile cap totals job
export const reconcileCapTotals = client.defineJob({
  id: 'reconcile-cap-totals',
  name: 'Reconcile Cap Totals',
  version: '0.0.1',
  trigger: client.interval({
    every: 24 * 60 * 60, // Daily at midnight
  }),
  run: async () => {
    // For each user, scan Cloak transactions and compare with DB totals
    // TODO: Integrate with Cloak SDK's scanTransactions()

    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id');

    if (error || !users) {
      return { success: false, error: 'Failed to fetch users' };
    }

    const results = [];

    for (const user of users) {
      // Get DB totals
      const { data: dbExecutions } = await supabaseAdmin
        .from('rule_executions')
        .select('rule_id, amount')
        .eq('user_id', user.id)
        .eq('status', 'success');

      // Get Cloak totals (TODO)
      // const cloakTotals = await cloak.scanTransactions(user.id);

      // Compare and correct if needed
      // if (dbTotals !== cloakTotals) {
      //   await supabaseAdmin.from('rule_executions').update(...)
      // }

      results.push({
        userId: user.id,
        reconciled: true,
      });
    }

    return { success: true, results };
  },
});
