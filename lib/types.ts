// ─── Praxicore Core Types ────────────────────────────────────────────────────

export type CoreBucketType = 'spend' | 'save' | 'invest' | 'tax';

export type BucketType = CoreBucketType | string; // string = user-defined bucket

export interface BucketDefinition {
  id: string;
  label: string;          // display name
  type: BucketType;
  colorVar: string;       // CSS var name e.g. '--savings'
  colorRgbVar: string;    // CSS var name e.g. '--savings-rgb'
  token: SupportedToken;
  walletAddress?: string; // destination wallet
}

export type SupportedToken = 'SOL' | 'USDC' | 'USDT' | 'ETH' | 'BTC';

export type AllocationType = 'percent' | 'fixed' | 'remainder';

export interface ParsedRule {
  bucket: BucketType;
  allocationType: AllocationType;
  percent?: number;       // 0–100
  fixedAmount?: number;   // USD
  token?: SupportedToken;
  label?: string;
  raw: string;            // original fragment
  ambiguous?: boolean;
  // New fields for rule engine v2
  trigger?: 'on_income' | 'scheduled' | 'one_off';
  cronExpression?: string;
  runAt?: string;
  conditions?: RuleCondition;
  nested?: ParsedRule[];
  parentRuleId?: string;
}

export interface RuleCondition {
  annualCap?: number;
  monthlyCap?: number;
  redirectBucket?: string;
  resetPeriod: 'calendar_year' | 'rolling_12';
  pauseIfBelow?: number;
}

export interface AllocationResult {
  rules: ResolvedAllocation[];
  totalPercent: number;
  isValid: boolean;
  warnings: string[];
}

export interface ResolvedAllocation {
  bucket: BucketType;
  bucketLabel: string;
  percent: number;        // always resolved to %
  amount: number;         // computed from inflow
  token: SupportedToken;
  walletAddress?: string;
}

export type PhaseState =
  | 'idle'
  | 'inflow'
  | 'tension'
  | 'split'
  | 'emerge'
  | 'settle'
  | 'reveal'
  | 'redacting'
  | 'complete';

export interface SimulationState {
  phase: PhaseState;
  inflowAmount: number;
  allocations: ResolvedAllocation[];
  startedAt: number | null;
}

export interface BucketCardState {
  bucketId: string;
  revealed: boolean;
  revealTimer: ReturnType<typeof setTimeout> | null;
  filled: boolean;
  amount: number;
}

export interface UserSession {
  id: string;
  email: string;
  name: string;
  image?: string;
  walletPublicKey: string;
  viewingKeyNk?: string;
}

export interface CloakExecutionResult {
  success: boolean;
  txSignatures: string[];
  error?: string;
}

// Bucket color palette for dynamic user-created buckets
export const BUCKET_COLOR_PALETTE: Array<{ colorVar: string; colorRgbVar: string; label: string }> = [
  { colorVar: '--savings',  colorRgbVar: '--savings-rgb',  label: 'green'      },
  { colorVar: '--invest',   colorRgbVar: '--invest-rgb',   label: 'purple'     },
  { colorVar: '--spend',    colorRgbVar: '--spend-rgb',    label: 'amber'      },
  { colorVar: '--tax',      colorRgbVar: '--tax-rgb',      label: 'blue'       },
  { colorVar: '--bucket-5', colorRgbVar: '--bucket-5-rgb', label: 'rose'       },
  { colorVar: '--bucket-6', colorRgbVar: '--bucket-6-rgb', label: 'amber-dark' },
  { colorVar: '--bucket-7', colorRgbVar: '--bucket-7-rgb', label: 'teal'       },
  { colorVar: '--bucket-8', colorRgbVar: '--bucket-8-rgb', label: 'violet'     },
  { colorVar: '--bucket-9', colorRgbVar: '--bucket-9-rgb', label: 'crimson'    },
  { colorVar: '--bucket-10',colorRgbVar: '--bucket-10-rgb',label: 'forest'     },
];

export const DEFAULT_BUCKETS: BucketDefinition[] = [
  { id: 'spend',  label: 'SPEND',  type: 'spend',  colorVar: '--spend',   colorRgbVar: '--spend-rgb',   token: 'USDC' },
  { id: 'save',   label: 'SAVE',   type: 'save',   colorVar: '--savings', colorRgbVar: '--savings-rgb', token: 'USDC' },
  { id: 'invest', label: 'INVEST', type: 'invest', colorVar: '--invest',  colorRgbVar: '--invest-rgb',  token: 'SOL'  },
  { id: 'tax',    label: 'TAX',    type: 'tax',    colorVar: '--tax',     colorRgbVar: '--tax-rgb',     token: 'USDC' },
];
