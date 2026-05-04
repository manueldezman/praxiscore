'use client';

import { useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { usePhaseOrchestrator } from '@/lib/hooks/usePhaseOrchestrator';
import SimulateZone from './SimulateZone';
import FlowAnimation from '@/components/animation/FlowAnimation';
import BucketCard from '@/components/buckets/BucketCard';
import type { AllocationResult, BucketDefinition } from '@/lib/types';
import { DEFAULT_BUCKETS, BUCKET_COLOR_PALETTE } from '@/lib/types';
import styles from './HeroSection.module.css';

function getBucketDef(bucketType: string, userBuckets: BucketDefinition[]): BucketDefinition {
  const all = [...DEFAULT_BUCKETS, ...userBuckets];
  const found = all.find(b => b.type === bucketType || b.id === bucketType);
  if (found) return found;
  const idx = Math.abs(bucketType.charCodeAt(0)) % BUCKET_COLOR_PALETTE.length;
  return {
    id: bucketType,
    label: bucketType.toUpperCase(),
    type: bucketType,
    colorVar: BUCKET_COLOR_PALETTE[idx].colorVar,
    colorRgbVar: BUCKET_COLOR_PALETTE[idx].colorRgbVar,
    token: 'USDC',
  };
}

export default function HeroSection() {
  const {
    simulation,
    isExecuting,
    setExecuting,
    setExecutionResult,
    startSimulation,
    buckets,
  } = useAppStore();

  const { replay } = usePhaseOrchestrator();

  const handleSimulate = useCallback(async (amount: number, allocationResult: AllocationResult) => {
    setExecuting(true);

    // Start animation immediately
    startSimulation(amount, allocationResult.rules);

    // Fire off Cloak execution in background
    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inflowAmount: amount,
          allocations: allocationResult.rules,
          simulate: true, // use simulate=true for demo; remove for mainnet
        }),
      });
      const data = await res.json();
      setExecutionResult(data);
    } catch {
      setExecutionResult({ success: false, txSignatures: [], error: 'Network error' });
    } finally {
      setExecuting(false);
    }
  }, [setExecuting, startSimulation, setExecutionResult]);

  const handleReplay = () => {
    replay();
  };

  const isActive = simulation.phase !== 'idle';
  const showBuckets = ['settle', 'reveal', 'complete'].includes(simulation.phase);
  const showReplay = simulation.phase === 'complete' || simulation.phase === 'reveal';

  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        {/* Centered text content */}
        <div className={styles.textContent}>
          <p className={styles.eyebrow}>PRIVATE FINANCIAL EXECUTION</p>

          <h1 className={styles.headline}>
            Your money behaves<br />
            the way you{' '}
            <span className={styles.accentWord}>planned.</span>
          </h1>

          <p className={styles.subtext}>
            Define rules once. Every payment is split, allocated, and
            privately executed — the moment funds arrive.
          </p>
        </div>

        {/* Simulate zone */}
        <div className={styles.simulateWrapper} data-simulate-zone>
          <SimulateZone onSimulate={handleSimulate} isExecuting={isExecuting} />
        </div>

        {/* Animation showcase */}
        <div className={styles.animationWrapper}>
          <div className={styles.animationCard}>
            <FlowAnimation
              phase={simulation.phase}
              inflowAmount={simulation.inflowAmount}
              allocations={simulation.allocations}
            />

            {/* Replay button */}
            {showReplay && (
              <button onClick={handleReplay} className={styles.replayBtn}>
                ↺ Replay transaction
              </button>
            )}
          </div>

          {/* Settled bucket cards */}
          {showBuckets && simulation.allocations.length > 0 && (
            <div className={styles.bucketRow}>
              {simulation.allocations.map((alloc, i) => {
                const bucketDef = getBucketDef(alloc.bucket, buckets);
                return (
                  <BucketCard
                    key={alloc.bucket + i}
                    bucket={bucketDef}
                    allocation={alloc}
                    state={simulation.phase === 'settle' ? 'filling' : 'settled'}
                    animationDelay={i * 80}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
