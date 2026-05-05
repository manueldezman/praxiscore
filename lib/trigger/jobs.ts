// TODO: Update trigger.dev integration for v4 SDK
// The v4 SDK has a different API structure. This file needs to be updated
// to use the new client.defineJob() syntax.

import { supabaseAdmin } from '@/lib/db/supabase';
import { checkConditions } from '@/lib/engine/conditionEngine';

// Placeholder exports - pending v4 SDK update
export const processScheduledRules = null;
export const processOneOffRules = null;
export const reconcileCapTotals = null;

/*
// Original implementation for v3 SDK - to be updated for v4

function calculateNextRun(cronExpression: string): string {
  const now = new Date();
  const nextRun = new Date(now);
  nextRun.setDate(nextRun.getDate() + 1);
  nextRun.setHours(0, 0, 0, 0);
  return nextRun.toISOString();
}

export const processScheduledRules = client.defineJob({
  id: 'process-scheduled-rules',
  name: 'Process Scheduled Rules',
  version: '0.0.1',
  trigger: client.interval({ every: 60 * 60 }),
  run: async () => {
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

      const conditionCheck = await checkConditions(rule.id, rule.user_id, 0);
      if (!conditionCheck.shouldExecute) {
        continue;
      }

      const nextRun = calculateNextRun(rule.cron_expression || '');
      await supabaseAdmin
        .from('schedules')
        .update({ last_run_at: now.toISOString(), next_run_at: nextRun })
        .eq('id', schedule.id);

      results.push({ ruleId: rule.id, executed: true });
    }

    return { success: true, results };
  },
});

export const processOneOffRules = client.defineJob({
  id: 'process-one-off-rules',
  name: 'Process One-Off Rules',
  version: '0.0.1',
  trigger: client.event({ name: 'one-off-rule.due' }),
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

    await supabaseAdmin
      .from('rules')
      .update({ is_active: false })
      .eq('id', ruleId);

    return { success: true, ruleId };
  },
});

export const reconcileCapTotals = client.defineJob({
  id: 'reconcile-cap-totals',
  name: 'Reconcile Cap Totals',
  version: '0.0.1',
  trigger: client.interval({ every: 24 * 60 * 60 }),
  run: async () => {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id');

    if (error || !users) {
      return { success: false, error: 'Failed to fetch users' };
    }

    const results = [];
    for (const user of users) {
      const { data: dbExecutions } = await supabaseAdmin
        .from('rule_executions')
        .select('rule_id, amount')
        .eq('user_id', user.id)
        .eq('status', 'success');

      results.push({ userId: user.id, reconciled: true });
    }

    return { success: true, results };
  },
});
*/
