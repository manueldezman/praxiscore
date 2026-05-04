'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './RedactedValue.module.css';

interface RedactedValueProps {
  value: string;
  revealDuration?: number; // ms, default 3000
  className?: string;
}

export default function RedactedValue({
  value,
  revealDuration = 3000,
  className = '',
}: RedactedValueProps) {
  const [revealed, setRevealed] = useState(false);
  const [animState, setAnimState] = useState<'hidden' | 'revealing' | 'visible' | 'hiding'>('hidden');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    setAnimState('hiding');
    setTimeout(() => {
      setRevealed(false);
      setAnimState('hidden');
    }, 300);
  }, []);

  const reveal = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setRevealed(true);
    setAnimState('revealing');
    setTimeout(() => setAnimState('visible'), 200);

    timerRef.current = setTimeout(() => {
      hide();
    }, revealDuration);
  }, [revealDuration, hide]);

  const handleClick = () => {
    if (revealed) {
      // reset timer on interaction
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(hide, revealDuration);
    } else {
      reveal();
    }
  };

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  // Estimate pill width to prevent layout shift
  const estimatedWidth = `${Math.max(value.length * 14 + 24, 80)}px`;

  return (
    <button
      onClick={handleClick}
      className={`${styles.wrapper} ${className}`}
      aria-label={revealed ? `Value: ${value}. Click to hide.` : 'Tap to reveal amount'}
      style={{ minWidth: estimatedWidth }}
    >
      {!revealed && (
        <span className={styles.lockIcon}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </span>
      )}

      <span
        className={`${styles.value} ${revealed ? styles.valueRevealed : styles.valueHidden}`}
        style={{
          filter: animState === 'revealing' || animState === 'visible'
            ? 'blur(0px)'
            : 'blur(8px)',
          opacity: animState === 'hiding' ? 0.4 :
                   animState === 'revealing' ? 0.7 : 1,
          transition: revealed
            ? 'filter 200ms ease, opacity 200ms ease'
            : 'filter 300ms ease, opacity 300ms ease',
        }}
      >
        {revealed ? value : '•••.••'}
      </span>
    </button>
  );
}
