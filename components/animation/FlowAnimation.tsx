'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ResolvedAllocation, PhaseState, BucketDefinition } from '@/lib/types';
import { BUCKET_COLOR_PALETTE, DEFAULT_BUCKETS } from '@/lib/types';
import styles from './FlowAnimation.module.css';

interface FlowAnimationProps {
  phase: PhaseState;
  inflowAmount: number;
  allocations: ResolvedAllocation[];
  onPhaseComplete?: (phase: PhaseState) => void;
  compact?: boolean; // for bento card mini version
}

interface StreamConfig {
  bucket: string;
  bucketLabel: string;
  percent: number;
  colorVar: string;
  pathD: string;
  endX: number;
  endY: number;
  strokeWidth: number;
  delay: number;
}

const PHASE_DURATIONS: Record<string, number> = {
  inflow:  600,
  tension: 450,
  split:   600,
  emerge:  400,
  settle:  500,
  reveal:  400,
};

function getBucketColorVar(bucketType: string, userBuckets?: BucketDefinition[]): string {
  const core: Record<string, string> = {
    spend: '--spend', save: '--savings', invest: '--invest', tax: '--tax',
  };
  if (core[bucketType]) return core[bucketType];
  const allBuckets = [...DEFAULT_BUCKETS, ...(userBuckets ?? [])];
  const found = allBuckets.find(b => b.type === bucketType || b.id === bucketType);
  if (found) return found.colorVar;
  const idx = Math.abs(bucketType.charCodeAt(0)) % BUCKET_COLOR_PALETTE.length;
  return BUCKET_COLOR_PALETTE[idx].colorVar;
}

function computeStreams(allocations: ResolvedAllocation[], svgW: number, svgH: number): StreamConfig[] {
  if (!allocations.length) return [];

  const count = allocations.length;
  const capsuleX = svgW / 2;
  const capsuleY = svgH * 0.35;
  const bucketY = svgH * 0.82;
  const spread = Math.min(svgW * 0.85, count * 160);
  const startX = capsuleX - spread / 2 + spread / (count * 2);

  const MIN_STROKE = 3;
  const MAX_STROKE = 14;

  return allocations.map((alloc, i) => {
    const endX = startX + (spread / count) * i;
    const ctrlY = capsuleY + (bucketY - capsuleY) * 0.55;
    const ctrlX1 = capsuleX + (endX - capsuleX) * 0.1;
    const ctrlX2 = endX - (endX - capsuleX) * 0.1;
    const pathD = `M ${capsuleX} ${capsuleY + 22} C ${ctrlX1} ${ctrlY} ${ctrlX2} ${ctrlY} ${endX} ${bucketY - 30}`;
    const strokeWidth = MIN_STROKE + ((alloc.percent / 100) * (MAX_STROKE - MIN_STROKE));
    const colorVar = getBucketColorVar(alloc.bucket);

    return {
      bucket: alloc.bucket,
      bucketLabel: alloc.bucketLabel,
      percent: alloc.percent,
      colorVar,
      pathD,
      endX,
      endY: bucketY,
      strokeWidth,
      delay: 0, // all streams simultaneous
    };
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SourceCapsule({ phase, isDark }: { phase: PhaseState; isDark: boolean }) {
  const isIdle = phase === 'idle';
  const isTension = phase === 'tension';
  const isActive = !isIdle;

  return (
    <motion.div
      className={styles.capsule}
      animate={
        isTension
          ? { x: [0, -1, 1, -1, 1, 0], scale: 1 }
          : isIdle
          ? { scale: [1, 1.01, 1], x: 0 }
          : { scale: 1, x: 0 }
      }
      transition={
        isTension
          ? { duration: 0.04, repeat: 11, repeatType: 'loop' }
          : isIdle
          ? { duration: 2.5, repeat: Infinity, repeatType: 'loop', ease: 'easeInOut' }
          : { duration: 0.2 }
      }
      style={{
        boxShadow: isDark && isIdle
          ? '0 0 16px rgba(var(--accent-rgb), 0.15)'
          : undefined,
      }}
    >
      <span className={styles.capsuleLabel}>
        {phase === 'idle' ? '•••.•• SOL' : phase === 'inflow' ? 'Receiving...' : 'Routing...'}
      </span>
    </motion.div>
  );
}

function InflowStream({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className={styles.inflowStream}
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          exit={{ scaleY: 0, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
          style={{ transformOrigin: 'top' }}
        />
      )}
    </AnimatePresence>
  );
}

function RippleRings({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <div className={styles.rippleContainer}>
          {[0, 80, 160].map((delay) => (
            <motion.div
              key={delay}
              className={styles.rippleRing}
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 2.4, opacity: 0 }}
              transition={{ duration: 0.4, delay: delay / 1000, ease: 'easeOut' }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

function TypewriterText({ active }: { active: boolean }) {
  const text = 'Executing your plan...';
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    if (!active) { setDisplayed(''); return; }
    let i = 0;
    const iv = setInterval(() => {
      setDisplayed(text.slice(0, ++i));
      if (i >= text.length) clearInterval(iv);
    }, 300 / text.length);
    return () => clearInterval(iv);
  }, [active]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className={styles.typewriterText}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {displayed}
          <span className={styles.cursor}>_</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StreamPaths({
  streams,
  active,
  svgW,
  svgH,
}: {
  streams: StreamConfig[];
  active: boolean;
  svgW: number;
  svgH: number;
}) {
  return (
    <svg
      className={styles.streamSvg}
      viewBox={`0 0 ${svgW} ${svgH}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {streams.map((s, i) => (
        <motion.path
          key={s.bucket + i}
          d={s.pathD}
          stroke={`var(${s.colorVar})`}
          strokeWidth={s.strokeWidth}
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={active ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
          transition={{
            pathLength: { duration: 0.5, ease: [0.33, 1, 0.68, 1], delay: s.delay / 1000 },
            opacity: { duration: 0.1 },
          }}
          style={{
            filter: `drop-shadow(0 0 4px var(${s.colorVar}))`,
          }}
        />
      ))}
    </svg>
  );
}

function BucketEmergence({
  streams,
  active,
  allocations,
  svgW,
}: {
  streams: StreamConfig[];
  active: boolean;
  allocations: ResolvedAllocation[];
  svgW: number;
}) {
  const bucketW = 110;
  const bucketH = 72;

  return (
    <AnimatePresence>
      {active && (
        <div className={styles.bucketsRow}>
          {streams.map((s, i) => {
            const alloc = allocations[i];
            return (
              <motion.div
                key={s.bucket + i}
                className={styles.emergeBucket}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: 0.05 * i,
                  ease: [0.33, 1, 0.68, 1],
                }}
                style={{
                  '--bucket-color': `var(${s.colorVar})`,
                  borderColor: `var(${s.colorVar})`,
                } as React.CSSProperties}
              >
                <div className={styles.emergeBucketLabel}>{s.bucketLabel}</div>
                {alloc && (
                  <motion.div
                    className={styles.emergeFill}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{
                      duration: 0.3,
                      delay: 0.1 + 0.05 * i,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    style={{
                      height: `${Math.min(alloc.percent, 100)}%`,
                      background: `var(${s.colorVar})`,
                      transformOrigin: 'bottom',
                    }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
}

function CounterValue({ target, active }: { target: number; active: boolean }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!active) { setCurrent(0); return; }
    const duration = 400;
    const steps = 30;
    const increment = target / steps;
    let step = 0;
    const iv = setInterval(() => {
      step++;
      setCurrent(Math.min(increment * step, target));
      if (step >= steps) clearInterval(iv);
    }, duration / steps);
    return () => clearInterval(iv);
  }, [active, target]);

  return <span>{current.toFixed(2)}</span>;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FlowAnimation({
  phase,
  inflowAmount,
  allocations,
  compact = false,
}: FlowAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 520, h: 360 });
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
    const obs = new MutationObserver(() => {
      setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width > 0) setDims({ w: width, h: compact ? 220 : Math.min(height, 380) });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [compact]);

  const streams = computeStreams(allocations, dims.w, dims.h);

  const showInflow  = phase === 'inflow';
  const showRipple  = phase === 'tension';
  const showTension = phase === 'tension';
  const showStreams  = ['split', 'emerge', 'settle', 'reveal', 'complete'].includes(phase);
  const showBuckets = ['emerge', 'settle', 'reveal', 'complete'].includes(phase);
  const showReveal  = ['reveal', 'complete'].includes(phase);

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${compact ? styles.compact : ''}`}
    >
      {/* Capsule */}
      <div className={styles.capsuleWrapper}>
        <InflowStream active={showInflow} />
        <RippleRings active={showRipple} />
        <SourceCapsule phase={phase} isDark={isDark} />
        <TypewriterText active={showTension} />
      </div>

      {/* SVG stream paths */}
      {streams.length > 0 && (
        <div className={styles.svgWrapper}>
          <StreamPaths
            streams={streams}
            active={showStreams}
            svgW={dims.w}
            svgH={dims.h}
          />
        </div>
      )}

      {/* Emerging buckets */}
      <BucketEmergence
        streams={streams}
        active={showBuckets}
        allocations={allocations}
        svgW={dims.w}
      />

      {/* Phase indicator */}
      {phase !== 'idle' && phase !== 'complete' && (
        <div className={styles.phaseLabel}>
          {phase === 'inflow'  && 'Receiving funds...'}
          {phase === 'tension' && 'Executing your plan...'}
          {phase === 'split'   && 'Splitting...'}
          {phase === 'emerge'  && 'Routing to buckets...'}
          {phase === 'settle'  && 'Settling...'}
          {phase === 'reveal'  && 'Complete ✓'}
        </div>
      )}
    </div>
  );
}
