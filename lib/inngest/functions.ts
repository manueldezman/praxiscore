import { Inngest } from 'inngest';
import { supabaseAdmin } from '@/lib/db/supabase';
import { checkConditions } from '@/lib/engine/conditionEngine';

// Create Inngest client
export const inngest = new Inngest({ id: 'praxicore' });

/**
 * Triggered when income arrives at user's wallet
 */
export const onIncomeArrival = inngest.createFunction(
  {
    id: 'on-income-arrival',
    triggers: [{ event: 'inflow/arrived' }],
  },
  async ({ event, step }) => {
    const { userId, amount, token, txSignature } = event.data;

    // Load user's active rules
    const { data: rules, error: rulesError } = await supabaseAdmin
      .from('rules')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .eq('trigger_type', 'on_income');

    if (rulesError || !rules || rules.length === 0) {
      console.log('[Inngest] No active rules for user:', userId);
      return { success: true, message: 'No rules to execute' };
    }

    const results = [];

    for (const rule of rules) {
      // Check conditions before execution
      const conditionCheck = await checkConditions(rule.id, userId, amount);

      if (!conditionCheck.shouldExecute) {
        console.log(`[Inngest] Rule ${rule.id} skipped: ${conditionCheck.reason}`);
        results.push({
          ruleId: rule.id,
          skipped: true,
          reason: conditionCheck.reason,
        });
        continue;
      }

      // Execute Cloak disbursement
      // TODO: Integrate with Cloak SDK
      console.log(`[Inngest] Executing rule ${rule.id}: ${rule.name}`);

      // Write execution record
      const now = new Date();
      const { error: execError } = await supabaseAdmin.from('rule_executions').insert({
        rule_id: rule.id,
        user_id: userId,
        amount,
        token,
        destination: conditionCheck.redirectBucket || rule.bucket,
        tx_signatures: [txSignature],
        executed_at: now.toISOString(),
        period_year: now.getFullYear(),
        period_month: now.getMonth() + 1,
        status: 'success',
      });

      if (execError) {
        console.error('[Inngest] Failed to record execution:', execError);
      }

      results.push({
        ruleId: rule.id,
        executed: true,
        redirect: conditionCheck.redirectBucket,
      });
    }

    // Check for nested rules and trigger them
    const parentRules = rules.filter(r => r.parent_rule_id);
    if (parentRules.length > 0) {
      await step.sendEvent('execute-nested-rules', {
        name: 'nested-rules/execute',
        data: {
          userId,
          parentExecutions: results,
        },
      });
    }

    return { success: true, results };
  }
);

/**
 * Execute nested rules after parent rule execution
 */
export const executeNestedRules = inngest.createFunction(
  {
    id: 'execute-nested-rules',
    triggers: [{ event: 'nested-rules/execute' }],
  },
  async ({ event }) => {
    const { userId, parentExecutions } = event.data;

    // Load nested rules
    const { data: nestedRules, error } = await supabaseAdmin
      .from('rules')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .not('parent_rule_id', 'is', null);

    if (error || !nestedRules || nestedRules.length === 0) {
      return { success: true, message: 'No nested rules to execute' };
    }

    const results = [];

    for (const rule of nestedRules) {
      // Find parent execution result
      const parentResult = parentExecutions.find((r: any) => r.ruleId === rule.parent_rule_id);
      if (!parentResult || !parentResult.executed) {
        continue;
      }

      // Execute nested rule
      console.log(`[Inngest] Executing nested rule ${rule.id}`);

      results.push({
        ruleId: rule.id,
        executed: true,
      });
    }

    return { success: true, results };
  }
);
