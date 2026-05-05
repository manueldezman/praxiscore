'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/db/supabase';
import { getBalance } from '@/lib/wallet/subAccountService';
import styles from './TaxPanel.module.css';

export default function TaxPanel() {
  const { data: session } = useSession();
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  useEffect(() => {
    loadTaxData();
  }, [session]);

  const loadTaxData = async () => {
    if (!session?.user?.userId) return;

    setLoading(true);

    try {
      // Get tax sub-account
      const { data: subAccount } = await supabase
        .from('sub_accounts')
        .select('*')
        .eq('user_id', session.user.userId)
        .eq('bucket_type', 'tax')
        .single();

      if (subAccount) {
        // Get balance from blockchain
        const solBalance = await getBalance(subAccount.public_key);
        setBalance(solBalance / 1e9); // Convert lamports to SOL
      }

      // Get deposit history
      const { data: executions } = await supabase
        .from('rule_executions')
        .select('*')
        .eq('user_id', session.user.userId)
        .eq('destination', 'tax')
        .order('executed_at', { ascending: false })
        .limit(10);

      setHistory(executions || []);
    } catch (error) {
      console.error('Failed to load tax data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatSOL = (lamports: number) => {
    return (lamports / 1e9).toFixed(4);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Tax Account</h2>
        <button
          onClick={() => setShowWithdrawModal(true)}
          className={styles.withdrawBtn}
        >
          Withdraw Tax Funds
        </button>
      </div>

      {/* Balance */}
      <div className={styles.balanceCard}>
        <span className={styles.balanceLabel}>Running Balance</span>
        {loading ? (
          <div className={styles.loading}>Loading...</div>
        ) : (
          <div className={styles.balanceAmount}>
            <span className={styles.balanceValue}>{balance.toFixed(4)}</span>
            <span className={styles.balanceToken}>SOL</span>
          </div>
        )}
      </div>

      {/* History */}
      <div className={styles.historySection}>
        <h3 className={styles.historyTitle}>Deposit History</h3>
        {history.length === 0 ? (
          <p className={styles.emptyText}>No deposits yet</p>
        ) : (
          <div className={styles.historyList}>
            {history.map((execution) => (
              <div key={execution.id} className={styles.historyItem}>
                <div className={styles.historyInfo}>
                  <span className={styles.historyAmount}>
                    {formatSOL(execution.amount)} SOL
                  </span>
                  <span className={styles.historyDate}>
                    {new Date(execution.executed_at).toLocaleDateString()}
                  </span>
                </div>
                <span className={`${styles.statusBadge} ${styles.statusSuccess}`}>
                  {execution.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className={styles.modalOverlay} onClick={() => setShowWithdrawModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Withdraw Tax Funds</h3>

            <div className={styles.withdrawOptions}>
              <button className={styles.withdrawOption}>
                <span className={styles.optionIcon}>🏦</span>
                <span className={styles.optionLabel}>Pre-linked Offramp</span>
              </button>
              <button className={styles.withdrawOption}>
                <span className={styles.optionIcon}>📝</span>
                <span className={styles.optionLabel}>One-time Address</span>
              </button>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className={styles.withdrawOption}
              >
                <span className={styles.optionIcon}>💰</span>
                <span className={styles.optionLabel}>Keep Accumulating</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
