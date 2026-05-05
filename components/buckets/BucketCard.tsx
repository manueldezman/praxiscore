'use client';

import { useEffect, useRef, useState } from 'react';
import RedactedValue from '@/components/privacy/RedactedValue';
import type { ResolvedAllocation, BucketDefinition } from '@/lib/types';
import styles from './BucketCard.module.css';

interface BucketCardProps {
  bucket: BucketDefinition;
  allocation?: ResolvedAllocation;
  state: 'empty' | 'filling' | 'settled' | 'revealed' | 're-redacting';
  animationDelay?: number; // ms
  showAmount?: boolean; // If false, show amount directly without redaction
}

const TOKEN_ICONS: Record<string, string> = {
  SOL: '◎',
  USDC: '$',
  USDT: '₮',
  ETH: 'Ξ',
  BTC: '₿',
};

export default function BucketCard({ bucket, allocation, state, animationDelay = 0, showAmount = true }: BucketCardProps) {
  const [fillHeight, setFillHeight] = useState(0);
  const [showFill, setShowFill] = useState(false);
  const fillRef = useRef<HTMLDivElement>(null);

  const colorVar = bucket.colorVar;
  const colorRgbVar = bucket.colorRgbVar;

  const percent = allocation?.percent ?? 0;
  const amount = allocation?.amount ?? 0;
  const token = allocation?.token ?? bucket.token;

  useEffect(() => {
    if (state === 'filling') {
      const t = setTimeout(() => {
        setShowFill(true);
        requestAnimationFrame(() => {
          setFillHeight(percent);
        });
      }, animationDelay);
      return () => clearTimeout(t);
    }
  }, [state, percent, animationDelay]);

  const isEmpty = state === 'empty';
  const isSettled = state === 'settled' || state === 'revealed' || state === 're-redacting';

  return (
    <div
      className={`${styles.card} ${isEmpty ? styles.empty : styles.active}`}
      style={{
        '--bucket-color': `var(${colorVar})`,
        '--bucket-rgb': `var(${colorRgbVar})`,
      } as React.CSSProperties}
    >
      {/* Label */}
      <div className={styles.label}>{bucket.label}</div>

      {/* Fill bar */}
      <div className={styles.fillTrack}>
        <div
          ref={fillRef}
          className={styles.fillBar}
          style={{
            width: showFill ? `${Math.min(percent, 100)}%` : '0%',
            transition: showFill
              ? `width var(--duration-settle) var(--ease-settle) ${animationDelay}ms`
              : 'none',
          }}
        />
        {isSettled && (
          <span className={styles.fillPercent}>
            {percent.toFixed(0)}%
          </span>
        )}
      </div>

      {/* Amount */}
      <div className={styles.amountRow}>
        <span className={styles.tokenIcon}>{TOKEN_ICONS[token] ?? '◎'}</span>
        {isSettled ? (
          showAmount ? (
            <RedactedValue
              value={`${amount.toFixed(2)} ${token}`}
              className={styles.redactedAmount}
            />
          ) : (
            <span className={styles.amount}>
              {amount.toFixed(2)} {token}
            </span>
          )
        ) : (
          <span className={styles.emptyAmount}>
            {isEmpty ? '— —' : '•••.••'}
          </span>
        )}
      </div>

      {/* Hint */}
      {isEmpty && (
        <span className={styles.emptyHint}>Waiting for funds</span>
      )}

      {isSettled && (
        <span className={styles.tapHint}>Tap amount to reveal</span>
      )}
    </div>
  );
}
