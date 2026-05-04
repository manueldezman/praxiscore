import type { ParsedRule, BucketType, SupportedToken, AllocationType } from '../types';

// ─── Keyword maps ────────────────────────────────────────────────────────────

const BUCKET_KEYWORDS: Record<string, BucketType> = {
  // spend
  spend: 'spend', spending: 'spend', expenses: 'spend', expense: 'spend',
  living: 'spend', rent: 'spend', bills: 'spend', food: 'spend',
  // save
  save: 'save', saving: 'save', savings: 'save', emergency: 'save',
  'emergency fund': 'save', reserve: 'save',
  // invest
  invest: 'invest', investing: 'invest', investment: 'invest',
  sol: 'invest', eth: 'invest', btc: 'invest', crypto: 'invest',
  // tax
  tax: 'tax', taxes: 'tax', 'tax reserve': 'tax', irs: 'tax',
  withholding: 'tax', 'tax fund': 'tax',
};

const TOKEN_KEYWORDS: Record<string, SupportedToken> = {
  sol: 'SOL', solana: 'SOL',
  usdc: 'USDC',
  usdt: 'USDT', tether: 'USDT',
  eth: 'ETH', ethereum: 'ETH',
  btc: 'BTC', bitcoin: 'BTC',
};

const REMAINDER_WORDS = ['rest', 'remainder', 'remaining', 'leftover', 'left', 'the rest', 'whatever is left'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function detectToken(fragment: string): SupportedToken | undefined {
  const lower = fragment.toLowerCase();
  for (const [kw, token] of Object.entries(TOKEN_KEYWORDS)) {
    if (lower.includes(kw)) return token;
  }
  return undefined;
}

function detectBucket(fragment: string): BucketType | undefined {
  const lower = fragment.toLowerCase();
  // multi-word first
  for (const [kw, bucket] of Object.entries(BUCKET_KEYWORDS)) {
    if (kw.includes(' ') && lower.includes(kw)) return bucket;
  }
  for (const [kw, bucket] of Object.entries(BUCKET_KEYWORDS)) {
    if (lower.includes(kw)) return bucket;
  }
  return undefined;
}

function isRemainder(fragment: string): boolean {
  const lower = fragment.toLowerCase();
  return REMAINDER_WORDS.some(w => lower.includes(w));
}

// ─── Main parser ─────────────────────────────────────────────────────────────

export function deterministicParse(input: string): ParsedRule[] {
  if (!input.trim()) return [];

  const results: ParsedRule[] = [];

  // Split on comma, semicolon, "and" as delimiter
  const fragments = input
    .split(/,|;|\band\b/)
    .map(f => f.trim())
    .filter(Boolean);

  for (const fragment of fragments) {
    const lower = fragment.toLowerCase();

    // Check remainder first
    if (isRemainder(lower)) {
      const bucket = detectBucket(lower) ?? 'spend';
      const token = detectToken(lower);
      results.push({
        bucket,
        allocationType: 'remainder',
        token,
        raw: fragment,
      });
      continue;
    }

    // Percent pattern: "40% to savings" / "save 30%" / "20 percent invest"
    const percentMatch = fragment.match(/(\d+(?:\.\d+)?)\s*%/);
    if (percentMatch) {
      const percent = parseFloat(percentMatch[1]);
      const bucket = detectBucket(lower) ?? 'spend';
      const token = detectToken(lower);
      results.push({
        bucket,
        allocationType: 'percent',
        percent: Math.min(percent, 100),
        token,
        raw: fragment,
      });
      continue;
    }

    // Percent written out: "20 percent"
    const percentWordMatch = fragment.match(/(\d+(?:\.\d+)?)\s*percent/i);
    if (percentWordMatch) {
      const percent = parseFloat(percentWordMatch[1]);
      const bucket = detectBucket(lower) ?? 'spend';
      const token = detectToken(lower);
      results.push({
        bucket,
        allocationType: 'percent',
        percent: Math.min(percent, 100),
        token,
        raw: fragment,
        ambiguous: false,
      });
      continue;
    }

    // Fixed amount: "$1,200" / "1200 USDC" / "pay rent $1,200"
    const fixedMatch = fragment.match(/\$?([\d,]+(?:\.\d+)?)\s*(?:USD|USDC|USDT|SOL|ETH|BTC)?/i);
    if (fixedMatch && parseFloat(fixedMatch[1].replace(/,/g, '')) > 0) {
      const amount = parseFloat(fixedMatch[1].replace(/,/g, ''));
      const bucket = detectBucket(lower) ?? 'spend';
      const token = detectToken(lower) ?? 'USDC';
      results.push({
        bucket,
        allocationType: 'fixed',
        fixedAmount: amount,
        token,
        raw: fragment,
      });
      continue;
    }

    // Equal split: "split equally" / "split evenly"
    if (lower.includes('equally') || lower.includes('evenly') || lower.includes('equal split')) {
      results.push({
        bucket: 'spend',
        allocationType: 'percent',
        percent: 33.33,
        token: undefined,
        raw: fragment,
        ambiguous: true,
      });
      continue;
    }

    // Fallback — bucket detected but no amount
    const bucket = detectBucket(lower);
    if (bucket) {
      results.push({
        bucket,
        allocationType: 'remainder',
        token: detectToken(lower),
        raw: fragment,
        ambiguous: true,
      });
    } else {
      // Truly ambiguous
      results.push({
        bucket: 'spend',
        allocationType: 'remainder',
        raw: fragment,
        ambiguous: true,
      });
    }
  }

  return results;
}
