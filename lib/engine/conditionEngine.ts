import { supabaseAdmin } from '@/lib/db/supabase';

export interface CapCheckResult {
  capped: boolean;
  remaining: number;
  redirectBucket?: string;
}

export interface ConditionCheckResult {
  shouldExecute: boolean;
  reason?: string;
  redirectBucket?: string;
}

/**
 * Check if a rule has reached its annual cap
 */
export async function checkAnnualCap(ruleId: string, userId: string): Promise<CapCheckResult> {
  const currentYear = new Date().getFullYear();

  const { data: executions, error } = await supabaseAdmin
    .from('rule_executions')
    .select('amount')
    .eq('rule_id', ruleId)
    .eq('user_id', userId)
    .eq('period_year', currentYear)
    .eq('status', 'success');

  if (error) {
    console.error('[ConditionEngine] Failed to check annual cap:', error);
    return { capped: false, remaining: Infinity };
  }

  const totalExecuted = executions?.reduce((sum, exec) => sum + Number(exec.amount), 0) || 0;

  // Get the rule's annual cap
  const { data: condition } = await supabaseAdmin
    .from('rule_conditions')
    .select('annual_cap, redirect_bucket')
    .eq('rule_id', ruleId)
    .single();

  if (!condition || !condition.annual_cap) {
    return { capped: false, remaining: Infinity };
  }

  const remaining = condition.annual_cap - totalExecuted;
  const capped = remaining <= 0;

  return {
    capped,
    remaining: Math.max(0, remaining),
    redirectBucket: capped ? condition.redirect_bucket : undefined,
  };
}

/**
 * Check if a rule has reached its monthly cap
 */
export async function checkMonthlyCap(ruleId: string, userId: string): Promise<CapCheckResult> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const { data: executions, error } = await supabaseAdmin
    .from('rule_executions')
    .select('amount')
    .eq('rule_id', ruleId)
    .eq('user_id', userId)
    .eq('period_year', currentYear)
    .eq('period_month', currentMonth)
    .eq('status', 'success');

  if (error) {
    console.error('[ConditionEngine] Failed to check monthly cap:', error);
    return { capped: false, remaining: Infinity };
  }

  const totalExecuted = executions?.reduce((sum, exec) => sum + Number(exec.amount), 0) || 0;

  // Get the rule's monthly cap
  const { data: condition } = await supabaseAdmin
    .from('rule_conditions')
    .select('monthly_cap, redirect_bucket')
    .eq('rule_id', ruleId)
    .single();

  if (!condition || !condition.monthly_cap) {
    return { capped: false, remaining: Infinity };
  }

  const remaining = condition.monthly_cap - totalExecuted;
  const capped = remaining <= 0;

  return {
    capped,
    remaining: Math.max(0, remaining),
    redirectBucket: capped ? condition.redirect_bucket : undefined,
  };
}

/**
 * Resolve redirect bucket if cap is reached
 */
export function resolveRedirect(_ruleId: string, capResult: CapCheckResult): string | null {
  if (!capResult.capped) {
    return null;
  }
  return capResult.redirectBucket || null;
}

/**
 * Check if rule should pause based on balance threshold
 */
export async function shouldPause(ruleId: string, balance: number): Promise<boolean> {
  const { data: condition } = await supabaseAdmin
    .from('rule_conditions')
    .select('pause_if_below')
    .eq('rule_id', ruleId)
    .single();

  if (!condition || !condition.pause_if_below) {
    return false;
  }

  return balance < condition.pause_if_below;
}

/**
 * Run all condition checks for a rule
 */
export async function checkConditions(
  ruleId: string,
  userId: string,
  _amount: number,
  balance?: number
): Promise<ConditionCheckResult> {
  // Check annual cap
  const annualResult = await checkAnnualCap(ruleId, userId);
  if (annualResult.capped) {
    return {
      shouldExecute: false,
      reason: 'Annual cap reached',
      redirectBucket: annualResult.redirectBucket,
    };
  }

  // Check monthly cap
  const monthlyResult = await checkMonthlyCap(ruleId, userId);
  if (monthlyResult.capped) {
    return {
      shouldExecute: false,
      reason: 'Monthly cap reached',
      redirectBucket: monthlyResult.redirectBucket,
    };
  }

  // Check pause threshold
  if (balance !== undefined) {
    const pause = await shouldPause(ruleId, balance);
    if (pause) {
      return {
        shouldExecute: false,
        reason: 'Balance below threshold',
      };
    }
  }

  return {
    shouldExecute: true,
  };
}

/**
 * Get reset period for cap tracking
 */
export function getResetPeriod(resetPeriod: 'calendar_year' | 'rolling_12'): {
  start: Date;
  end: Date;
} {
  const now = new Date();

  if (resetPeriod === 'calendar_year') {
    return {
      start: new Date(now.getFullYear(), 0, 1),
      end: new Date(now.getFullYear(), 11, 31, 23, 59, 59),
    };
  } else {
    // Rolling 12 months
    return {
      start: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
      end: now,
    };
  }
}
