'use client';

import styles from './ExecutionHistory.module.css';

export interface Execution {
  id: string;
  amount: number;
  token: string;
  destination: string;
  tx_signatures: string[];
  executed_at: string;
  status: 'success' | 'failed' | 'capped';
}

interface ExecutionHistoryProps {
  executions: Execution[];
}

export default function ExecutionHistory({ executions }: ExecutionHistoryProps) {
  if (executions.length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Execution History</h3>
        <p className={styles.empty}>No executions yet</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Execution History</h3>
      <div className={styles.list}>
        {executions.map((execution) => (
          <div key={execution.id} className={styles.item}>
            <div className={styles.info}>
              <span className={styles.amount}>
                {execution.amount.toFixed(2)} {execution.token}
              </span>
              <span className={styles.destination}>
                → {execution.destination.slice(0, 8)}...{execution.destination.slice(-8)}
              </span>
              <span className={styles.date}>
                {new Date(execution.executed_at).toLocaleString()}
              </span>
            </div>
            <span className={`${styles.status} ${styles[execution.status]}`}>
              {execution.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
