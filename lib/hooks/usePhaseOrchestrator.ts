'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import type { PhaseState, ResolvedAllocation } from '@/lib/types';

const PHASE_SEQUENCE: Array<{ phase: PhaseState; duration: number }> = [
  { phase: 'inflow',  duration: 600  },
  { phase: 'tension', duration: 450  },
  { phase: 'split',   duration: 600  },
  { phase: 'emerge',  duration: 400  },
  { phase: 'settle',  duration: 500  },
  { phase: 'reveal',  duration: 3000 }, // stays in reveal until inactivity
  { phase: 'complete',duration: 0    },
];

export function usePhaseOrchestrator() {
  const { simulation, setPhase, resetSimulation } = useAppStore();
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAll = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  useEffect(() => {
    if (simulation.phase !== 'inflow') return;

    // Clear any previous sequence
    clearAll();

    let elapsed = 0;
    for (let i = 0; i < PHASE_SEQUENCE.length; i++) {
      const { phase, duration } = PHASE_SEQUENCE[i];
      const delay = elapsed;

      const t = setTimeout(() => {
        setPhase(phase);
      }, delay);

      timeoutsRef.current.push(t);
      elapsed += duration;
    }

    return clearAll;
  }, [simulation.startedAt]); // re-run when simulation starts

  const replay = () => {
    clearAll();
    resetSimulation();
  };

  return { replay };
}
