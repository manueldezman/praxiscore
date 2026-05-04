import type {
  ParsedRule,
  AllocationResult,
  ResolvedAllocation,
  BucketDefinition,
  SupportedToken,
} from '../types';
import { DEFAULT_BUCKETS, BUCKET_COLOR_PALETTE } from '../types';

// ─── Bucket registry ─────────────────────────────────────────────────────────

export function resolveBucketDefinition(
  bucketId: string,
  userBuckets: BucketDefinition[],
  label?: string,
): BucketDefinition {
  // Check user buckets first
  const found = userBuckets.find(b => b.id === bucketId || b.type === bucketId);
  if (found) return found;

  // Check defaults
  const def = DEFAULT_BUCKETS.find(b => b.type === bucketId || b.id === bucketId);
  if (def) return def;

  // Dynamic: create a new bucket definition with next available color
  const colorIndex = Math.min(userBuckets.length + DEFAULT_BUCKETS.length, BUCKET_COLOR_PALETTE.length - 1);
  const palette = BUCKET_COLOR_PALETTE[colorIndex] ?? BUCKET_COLOR_PALETTE[BUCKET_COLOR_PALETTE.length - 1];

  return {
    id: bucketId,
    label: label ?? bucketId.toUpperCase(),
    type: bucketId,
    colorVar: palette.colorVar,
    colorRgbVar: palette.colorRgbVar,
    token: 'USDC',
  };
}

// ─── Main engine ─────────────────────────────────────────────────────────────

export function computeAllocations(
  inflowAmount: number,
  parsedRules: ParsedRule[],
  userBuckets: BucketDefinition[] = [],
): AllocationResult {
  const warnings: string[] = [];

  if (!inflowAmount || inflowAmount <= 0) {
    return { rules: [], totalPercent: 0, isValid: false, warnings: ['Inflow amount must be greater than 0'] };
  }

  if (!parsedRules.length) {
    return { rules: [], totalPercent: 0, isValid: false, warnings: ['No rules parsed'] };
  }

  // Separate fixed vs percent vs remainder
  const fixedRules = parsedRules.filter(r => r.allocationType === 'fixed');
  const percentRules = parsedRules.filter(r => r.allocationType === 'percent');
  const remainderRules = parsedRules.filter(r => r.allocationType === 'remainder');

  // Compute fixed allocations first (convert to percent)
  let usedPercent = 0;
  let usedAmount = 0;
  const resolved: ResolvedAllocation[] = [];

  for (const rule of fixedRules) {
    const amount = rule.fixedAmount ?? 0;
    const percent = (amount / inflowAmount) * 100;
    usedAmount += amount;
    usedPercent += percent;

    const bucketDef = resolveBucketDefinition(rule.bucket, userBuckets, rule.label);
    resolved.push({
      bucket: rule.bucket,
      bucketLabel: bucketDef.label,
      percent,
      amount,
      token: rule.token ?? bucketDef.token ?? 'USDC',
      walletAddress: bucketDef.walletAddress,
    });
  }

  // Add percent allocations
  for (const rule of percentRules) {
    const percent = rule.percent ?? 0;
    usedPercent += percent;
    const amount = (percent / 100) * inflowAmount;
    usedAmount += amount;

    const bucketDef = resolveBucketDefinition(rule.bucket, userBuckets, rule.label);
    resolved.push({
      bucket: rule.bucket,
      bucketLabel: bucketDef.label,
      percent,
      amount,
      token: rule.token ?? bucketDef.token ?? 'USDC',
      walletAddress: bucketDef.walletAddress,
    });
  }

  // Clamp to 100%
  if (usedPercent > 100) {
    warnings.push(`Allocations exceed 100% — clamped to fit`);
    const scale = 100 / usedPercent;
    for (const r of resolved) {
      r.percent *= scale;
      r.amount = (r.percent / 100) * inflowAmount;
    }
    usedPercent = 100;
    usedAmount = inflowAmount;
  }

  // Remainder allocations
  const remainingPercent = Math.max(0, 100 - usedPercent);
  const remainingAmount = Math.max(0, inflowAmount - usedAmount);

  if (remainderRules.length === 0 && remainingPercent > 0.01) {
    warnings.push(`${remainingPercent.toFixed(0)}% unallocated — assigned to SPEND`);
    const defaultBucket = resolveBucketDefinition('spend', userBuckets);
    resolved.push({
      bucket: 'spend',
      bucketLabel: 'SPEND',
      percent: remainingPercent,
      amount: remainingAmount,
      token: 'USDC',
      walletAddress: defaultBucket.walletAddress,
    });
  } else if (remainderRules.length > 0) {
    const perRemainder = remainingPercent / remainderRules.length;
    const perAmount = remainingAmount / remainderRules.length;
    for (const rule of remainderRules) {
      const bucketDef = resolveBucketDefinition(rule.bucket, userBuckets, rule.label);
      resolved.push({
        bucket: rule.bucket,
        bucketLabel: bucketDef.label,
        percent: perRemainder,
        amount: perAmount,
        token: rule.token ?? bucketDef.token ?? 'USDC',
        walletAddress: bucketDef.walletAddress,
      });
    }
  }

  const totalPercent = resolved.reduce((s, r) => s + r.percent, 0);

  return {
    rules: resolved,
    totalPercent,
    isValid: warnings.length === 0,
    warnings,
  };
}
