'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/db/supabase';
import { validateSolanaAddress } from '@/lib/utils/validateAddress';
import styles from './TaxWithdrawModal.module.css';

interface TaxWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TaxWithdrawModal({ isOpen, onClose }: TaxWithdrawModalProps) {
  const { data: session } = useSession();
  const [option, setOption] = useState<'prelinked' | 'onetime' | 'keep'>('prelinked');
  const [selectedWallet, setSelectedWallet] = useState('');
  const [onetimeAddress, setOnetimeAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleWithdraw = async () => {
    if (!session?.user?.userId) return;

    setError('');

    if (option === 'onetime' && !validateSolanaAddress(onetimeAddress)) {
      setError('Invalid Solana address');
      return;
    }

    setLoading(true);

    try {
      const destination = option === 'prelinked' ? selectedWallet : onetimeAddress;
      const withdrawAmount = amount ? parseFloat(amount) : null;

      // Call withdrawal API
      const res = await fetch('/api/tax/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination,
          amount: withdrawAmount,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Withdrawal failed');
        return;
      }

      onClose();
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <h2 className={styles.title}>Withdraw Tax Funds</h2>

        {/* Option Selection */}
        <div className={styles.options}>
          <button
            onClick={() => setOption('prelinked')}
            className={`${styles.optionBtn} ${option === 'prelinked' ? styles.optionBtnSelected : ''}`}
          >
            <span className={styles.optionIcon}>🏦</span>
            <span className={styles.optionLabel}>Pre-linked Wallet</span>
          </button>
          <button
            onClick={() => setOption('onetime')}
            className={`${styles.optionBtn} ${option === 'onetime' ? styles.optionBtnSelected : ''}`}
          >
            <span className={styles.optionIcon}>📝</span>
            <span className={styles.optionLabel}>One-time Address</span>
          </button>
          <button
            onClick={() => setOption('keep')}
            className={`${styles.optionBtn} ${option === 'keep' ? styles.optionBtnSelected : ''}`}
          >
            <span className={styles.optionIcon}>💰</span>
            <span className={styles.optionLabel}>Keep Accumulating</span>
          </button>
        </div>

        {/* Pre-linked wallet selection */}
        {option === 'prelinked' && (
          <div className={styles.inputGroup}>
            <label className={styles.label}>Select Wallet</label>
            <select
              value={selectedWallet}
              onChange={e => setSelectedWallet(e.target.value)}
              className={styles.select}
            >
              <option value="">Choose a wallet...</option>
              {/* TODO: Load from bucket_wallets */}
            </select>
          </div>
        )}

        {/* One-time address input */}
        {option === 'onetime' && (
          <div className={styles.inputGroup}>
            <label className={styles.label}>Destination Address</label>
            <input
              type="text"
              value={onetimeAddress}
              onChange={e => setOnetimeAddress(e.target.value)}
              placeholder="Paste Solana address..."
              className={`${styles.input} ${error ? styles.inputError : ''}`}
            />
          </div>
        )}

        {/* Amount input */}
        {option !== 'keep' && (
          <div className={styles.inputGroup}>
            <label className={styles.label}>Amount (SOL)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Leave empty for full withdrawal"
              className={styles.input}
            />
          </div>
        )}

        {error && <p className={styles.errorText}>{error}</p>}

        {/* Actions */}
        {option !== 'keep' && (
          <div className={styles.actions}>
            <button onClick={onClose} className={styles.cancelBtn}>
              Cancel
            </button>
            <button
              onClick={handleWithdraw}
              disabled={loading}
              className={styles.withdrawBtn}
            >
              {loading ? 'Withdrawing...' : 'Withdraw'}
            </button>
          </div>
        )}

        {option === 'keep' && (
          <div className={styles.actions}>
            <button onClick={onClose} className={styles.closeActionBtn}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
