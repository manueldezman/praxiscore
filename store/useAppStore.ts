import { create } from 'zustand';
import type {
  ParsedRule,
  AllocationResult,
  ResolvedAllocation,
  PhaseState,
  BucketDefinition,
  SimulationState,
} from '@/lib/types';
import { DEFAULT_BUCKETS } from '@/lib/types';

interface AppState {
  // Theme
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  toggleTheme: () => void;

  // Buckets (user can add custom)
  buckets: BucketDefinition[];
  addBucket: (bucket: BucketDefinition) => void;
  removeBucket: (id: string) => void;

  // Rule input
  ruleText: string;
  inflowAmount: number;
  setRuleText: (t: string) => void;
  setInflowAmount: (a: number) => void;

  // Parsed state
  parsedRules: ParsedRule[];
  allocationResult: AllocationResult | null;
  parseWarnings: string[];
  setParsedRules: (r: ParsedRule[], result: AllocationResult | null) => void;

  // Simulation
  simulation: SimulationState;
  setPhase: (phase: PhaseState) => void;
  startSimulation: (amount: number, allocations: ResolvedAllocation[]) => void;
  resetSimulation: () => void;

  // Execution
  isExecuting: boolean;
  executionResult: { success: boolean; txSignatures: string[]; error?: string } | null;
  setExecuting: (v: boolean) => void;
  setExecutionResult: (r: { success: boolean; txSignatures: string[]; error?: string } | null) => void;

  // Revealed bucket values (privacy)
  revealedBuckets: Set<string>;
  revealBucket: (id: string) => void;
  hideBucket: (id: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Theme
  theme: 'light',
  setTheme: (t) => {
    set({ theme: t });
    document.documentElement.setAttribute('data-theme', t);
  },
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },

  // Buckets
  buckets: DEFAULT_BUCKETS,
  addBucket: (bucket) => set(s => ({ buckets: [...s.buckets, bucket] })),
  removeBucket: (id) => set(s => ({ buckets: s.buckets.filter(b => b.id !== id) })),

  // Rule input
  ruleText: '',
  inflowAmount: 0,
  setRuleText: (t) => set({ ruleText: t }),
  setInflowAmount: (a) => set({ inflowAmount: a }),

  // Parsed state
  parsedRules: [],
  allocationResult: null,
  parseWarnings: [],
  setParsedRules: (r, result) => set({
    parsedRules: r,
    allocationResult: result,
    parseWarnings: result?.warnings ?? [],
  }),

  // Simulation
  simulation: {
    phase: 'idle',
    inflowAmount: 0,
    allocations: [],
    startedAt: null,
  },
  setPhase: (phase) => set(s => ({ simulation: { ...s.simulation, phase } })),
  startSimulation: (amount, allocations) => set({
    simulation: {
      phase: 'inflow',
      inflowAmount: amount,
      allocations,
      startedAt: Date.now(),
    },
  }),
  resetSimulation: () => set({
    simulation: { phase: 'idle', inflowAmount: 0, allocations: [], startedAt: null },
    revealedBuckets: new Set(),
  }),

  // Execution
  isExecuting: false,
  executionResult: null,
  setExecuting: (v) => set({ isExecuting: v }),
  setExecutionResult: (r) => set({ executionResult: r }),

  // Privacy
  revealedBuckets: new Set(),
  revealBucket: (id) => set(s => ({ revealedBuckets: new Set([...s.revealedBuckets, id]) })),
  hideBucket: (id) => set(s => {
    const next = new Set(s.revealedBuckets);
    next.delete(id);
    return { revealedBuckets: next };
  }),
}));
