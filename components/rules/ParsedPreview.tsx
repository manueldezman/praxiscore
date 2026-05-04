'use client';

import type { ResolvedAllocation } from '@/lib/types';
import styles from './ParsedPreview.module.css';

interface ParsedPreviewProps {
  allocations: ResolvedAllocation[];
  warnings: string[];
  isLoading?: boolean;
}

const BUCKET_COLOR_CLASS: Record<string, string> = {
  spend: 'colorSpend',
  save: 'colorSave',
  invest: 'colorInvest',
  tax: 'colorTax',
};

function getBucketColorClass(bucket: string): string {
  return BUCKET_COLOR_CLASS[bucket] ?? 'colorCustom';
}

export default function ParsedPreview({ allocations, warnings, isLoading }: ParsedPreviewProps) {
  if (isLoading) {
    return (
      <div className={styles.preview}>
        <div className={styles.loading}>
          <span className={styles.dot} />
          <span className={styles.dot} style={{ animationDelay: '0.15s' }} />
          <span className={styles.dot} style={{ animationDelay: '0.3s' }} />
        </div>
      </div>
    );
  }

  if (!allocations.length) return null;

  return (
    <div className={styles.preview}>
      <div className={styles.previewLabel}>Parsed preview</div>

      <div className={styles.tree}>
        {allocations.map((alloc, i) => {
          const isLast = i === allocations.length - 1;
          const colorClass = getBucketColorClass(alloc.bucket);
          return (
            <div key={alloc.bucket + i} className={styles.treeRow}>
              <span className={styles.connector}>
                {isLast ? '└──' : '├──'}
              </span>
              <span className={`${styles.percent} ${styles[colorClass] ?? styles.colorCustom}`}>
                {alloc.percent.toFixed(0)}%
              </span>
              <span className={styles.arrow}>→</span>
              <span className={`${styles.bucketLabel} ${styles[colorClass] ?? styles.colorCustom}`}>
                {alloc.bucketLabel}
              </span>
              <span className={styles.token}>({alloc.token})</span>
            </div>
          );
        })}
      </div>

      {warnings.length > 0 && (
        <div className={styles.warnings}>
          {warnings.map((w, i) => (
            <div key={i} className={styles.warning}>
              <span className={styles.warningIcon}>⚠</span>
              {w}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
