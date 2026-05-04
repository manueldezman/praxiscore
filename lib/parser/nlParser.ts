import type { ParsedRule, BucketType, SupportedToken } from '../types';
import { deterministicParse } from './deterministicParser';

// ─── GLM 4.7 via NVIDIA NIM ──────────────────────────────────────────────────

const GLM_API_BASE = 'https://integrate.api.nvidia.com/v1';
const GLM_MODEL = 'nvidia_nim/z-ai/glm4.7';

async function parseWithGLM(input: string, existingBucketLabels: string[]): Promise<ParsedRule[]> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    console.warn('[nlParser] No NVIDIA_API_KEY — skipping GLM fallback');
    return [];
  }

  const systemPrompt = `You are a financial rule parser for a crypto payment app called Praxicore.
Parse the user's natural language financial rule into structured JSON.

Known bucket types: spend, save, invest, tax. Custom bucket labels are allowed.
Known tokens: SOL, USDC, USDT, ETH, BTC.
Existing user buckets: ${existingBucketLabels.join(', ') || 'none yet'}.

Return ONLY a valid JSON array, no markdown, no explanation.
Each item must follow this schema exactly:
{
  "bucket": "spend" | "save" | "invest" | "tax" | "<custom-label>",
  "allocationType": "percent" | "fixed" | "remainder",
  "percent": <number 0-100> | null,
  "fixedAmount": <number> | null,
  "token": "SOL" | "USDC" | "USDT" | "ETH" | "BTC" | null,
  "label": "<human label>" | null,
  "raw": "<original fragment>",
  "ambiguous": <boolean>
}

Rules:
- Percentages must not exceed 100 total
- Only one item may have allocationType "remainder"
- If the user mentions a custom bucket name (e.g. "emergency", "mortgage", "vacation fund"), use it as the bucket value
- Never invent buckets not mentioned`;

  try {
    const response = await fetch(`${GLM_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GLM_MODEL,
        max_tokens: 1000,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: input },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.warn('[nlParser] GLM API error:', response.status);
      return [];
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';

    // Strip markdown fences if present
    const clean = content.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    if (!Array.isArray(parsed)) return [];

    return parsed.map((item: Record<string, unknown>) => ({
      bucket: (item.bucket as BucketType) ?? 'spend',
      allocationType: (item.allocationType as 'percent' | 'fixed' | 'remainder') ?? 'remainder',
      percent: typeof item.percent === 'number' ? item.percent : undefined,
      fixedAmount: typeof item.fixedAmount === 'number' ? item.fixedAmount : undefined,
      token: item.token as SupportedToken | undefined,
      label: item.label as string | undefined,
      raw: (item.raw as string) ?? input,
      ambiguous: Boolean(item.ambiguous),
    }));
  } catch (err) {
    console.warn('[nlParser] GLM parse failed:', err);
    return [];
  }
}

// ─── Heuristic: should we try GLM? ───────────────────────────────────────────

function needsGLM(input: string, deterministicResult: ParsedRule[]): boolean {
  // If all fragments are ambiguous → try GLM
  const allAmbiguous = deterministicResult.length > 0 && deterministicResult.every(r => r.ambiguous);
  // If result is empty but input is non-trivial
  const noResult = deterministicResult.length === 0 && input.trim().length > 5;
  // If input has words that look like custom bucket names not in our keyword list
  const hasCustomBucket = /mortgage|vacation|education|business|medical|charity|wedding|home|car loan|student|loan/i.test(input);

  return allAmbiguous || noResult || hasCustomBucket;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function parseRule(
  input: string,
  existingBucketLabels: string[] = [],
): Promise<{ rules: ParsedRule[]; source: 'deterministic' | 'glm' }> {
  if (!input.trim()) {
    return { rules: [], source: 'deterministic' };
  }

  const deterministicResult = deterministicParse(input);

  if (needsGLM(input, deterministicResult)) {
    const glmResult = await parseWithGLM(input, existingBucketLabels);
    if (glmResult.length > 0) {
      return { rules: glmResult, source: 'glm' };
    }
  }

  return { rules: deterministicResult, source: 'deterministic' };
}
