'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/db/supabase';
import styles from './AuditorPage.module.css';

export default function AuditorPage() {
  const params = useParams();
  const viewingKey = params.key as string;
  const [loading, setLoading] = useState(true);
  const [complianceData, setComplianceData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadComplianceData();
  }, [viewingKey]);

  const loadComplianceData = async () => {
    setLoading(true);
    try {
      // Validate viewing key and load compliance data
      const res = await fetch(`/api/audit/${viewingKey}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid viewing key');
      }

      setComplianceData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Viewing Key</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className={styles.auditorBadge}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Auditor View
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Compliance Report</h1>
          <p className="text-gray-600">
            Time-scoped view of transactions for audit purposes.
          </p>
        </div>

        {/* Report Details */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className={styles.reportHeader}>
            <div>
              <h2 className={styles.reportTitle}>Report Summary</h2>
              <p className={styles.reportPeriod}>
                Period: {complianceData?.period || 'Not specified'}
              </p>
            </div>
            <div className={styles.reportMeta}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Generated:</span>
                <span className={styles.metaValue}>
                  {new Date().toLocaleString()}
                </span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Viewing Key:</span>
                <span className={styles.metaValue}>
                  nk••••{viewingKey.slice(-4)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Transactions</h2>

          {complianceData?.transactions && complianceData.transactions.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Token</th>
                  <th>Status</th>
                  <th>Transaction</th>
                </tr>
              </thead>
              <tbody>
                {complianceData.transactions.map((tx: any, index: number) => (
                  <tr key={index}>
                    <td className={styles.dateCell}>
                      {new Date(tx.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles.badgeType}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className={styles.amountCell}>{tx.amount}</td>
                    <td>{tx.token}</td>
                    <td>
                      <span className={`${styles.badge} ${styles.badgeStatus}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td>
                      {tx.signature && (
                        <a
                          href={`https://solscan.io/tx/${tx.signature}?cluster=devnet`}
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
          ) : (
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>No transactions found for this period</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className={styles.footerText}>
            This report is generated using a time-scoped viewing key.
            Only transactions within the specified period are visible.
          </p>
          <p className={styles.footerSubtext}>
            Powered by Praxicore • Private Financial Execution Engine
          </p>
        </div>
      </div>
    </div>
  );
}
