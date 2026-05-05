import { NextRequest, NextResponse } from 'next/server';
import { parseRule } from '@/lib/parser/nlParser';
import { computeAllocations } from '@/lib/engine/ruleEngine';
import { DEFAULT_BUCKETS } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { ruleText, inflowAmount, existingBucketLabels } = await req.json();

    if (!ruleText?.trim()) {
      return NextResponse.json({ rules: [], allocationResult: null, source: 'deterministic', conditions: null });
    }

    const { rules, source, conditions } = await parseRule(ruleText, existingBucketLabels ?? []);

    const allocationResult = inflowAmount > 0
      ? computeAllocations(inflowAmount, rules, DEFAULT_BUCKETS)
      : null;

    return NextResponse.json({ rules, allocationResult, source, conditions });
  } catch (err) {
    console.error('[/api/parse]', err);
    return NextResponse.json({ error: 'Parse failed' }, { status: 500 });
  }
}
