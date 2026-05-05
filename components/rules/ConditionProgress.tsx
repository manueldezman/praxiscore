'use client';

import styles from './ConditionProgress.module.css';

export interface ConditionProgressProps {
  label: string;
  used: number;
  cap: number;
  redirectBucket?: string;
}

export default function ConditionProgress({
  label,
  used,
  cap,
  redirectBucket,
}: ConditionProgressProps) {
  const percentage = Math.min((used / cap) * 100, 100);
  const isNearCap = percentage >= 80;
  const isCapped = percentage >= 100;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        <span className={`${styles.value} ${isCapped ? styles.valueCapped : ''}`}>
          ${used.toFixed(0)} / ${cap.toFixed(0)}
        </span>
      </div>
      <div className={styles.progressBar}>
        <div
          className={`${styles.progressFill} ${isNearCap ? styles.progressFillWarning : ''} ${isCapped ? styles.progressFillCapped : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {redirectBucket && isCapped && (
        <p className={styles.redirectText}>
          Redirecting to <strong>{redirectBucket}</strong>
        </p>
      )}
    </div>
  );
}
