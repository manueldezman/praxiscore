'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/db/supabase';
import styles from './HistoryPage.module.css';

type FilterType = 'all' | 'rule' | 'manual' | 'payroll' | 'batch';

export default function HistoryPage() {
  const { data: session } = useSession();
  const [filter, setFilter] = useState<FilterType>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [executions, setExecutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load executions on mount
  // (In a real app, this would use useEffect and Supabase)

  const filteredExecutions = executions.filter((exec) => {
    if (filter === 'all') return true;
    return exec.type === filter;
  });

  const exportCSV = () => {
    // Export filtered results to CSV
    const headers = ['Date', 'Type', 'Amount', 'Token', 'Destination', 'Status', 'Tx Signature'];
    const rows = filteredExecutions.map((exec) => [
      exec.executed_at,
      exec.type,
      exec.amount,
      exec.token,
      exec.destination,
      exec.status,
      exec.tx_signatures?.[0] || '',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `praxicore-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Execution History</h1>
          <p className="text-gray-600">
            View all your past transactions and rule executions.
          </p>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Type</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
              className={styles.filterSelect}
            >
              <option value="all">All Types</option>
              <option value="rule">Rule Execution</option>
              <option value="manual">Manual Payment</option>
              <option value="payroll">Payroll</option>
              <option value="batch">Batch Disbursement</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>From</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className={styles.filterInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>To</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className={styles.filterInput}
            />
          </div>

          <button
            onClick={exportCSV}
            className={styles.exportBtn}
          >
            Export CSV
          </button>
        </div>

        {/* Execution List */}
        <div className={styles.executionList}>
          {filteredExecutions.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>No executions found</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Token</th>
                  <th>Destination</th>
                  <th>Status</th>
                  <th>Transaction</th>
                </tr>
              </thead>
              <tbody>
                {filteredExecutions.map((exec) => (
                  <tr key={exec.id}>
                    <td className={styles.dateCell}>
                      {new Date(exec.executed_at).toLocaleString()}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles.badgeType}`}>
                        {exec.type}
                      </span>
                    </td>
                    <td className={styles.amountCell}>
                      {exec.amount}
                    </td>
                    <td>{exec.token}</td>
                    <td className={styles.addressCell}>
                      {exec.destination.slice(0, 8)}...{exec.destination.slice(-8)}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles.badgeStatus}`}>
                        {exec.status}
                      </span>
                    </td>
                    <td>
                      {exec.tx_signatures?.[0] && (
                        <a
                          href={`https://solscan.io/tx/${exec.tx_signatures[0]}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.txLink}
                        >
                          View
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
