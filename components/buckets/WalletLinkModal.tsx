'use client';

import { useState } from 'react';
import { validateSolanaAddress } from '@/lib/utils/validateAddress';
import styles from './WalletLinkModal.module.css';

interface WalletLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  bucketId: string;
  bucketLabel: string;
  onSave: (address: string) => void;
  currentAddress?: string;
}

export default function WalletLinkModal({
  isOpen,
  onClose,
  bucketId,
  bucketLabel,
  onSave,
  currentAddress = '',
}: WalletLinkModalProps) {
  const [address, setAddress] = useState(currentAddress);
  const [error, setError] = useState('');

  const handleSave = () => {
    if (address && !validateSolanaAddress(address)) {
      setError('Invalid Solana address');
      return;
    }

    setError('');
    onSave(address);
    onClose();
  };

  const handleSkip = () => {
    onSave('');
    onClose();
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

        <div className={styles.content}>
          <h2 className={styles.title}>Link Wallet</h2>
          <p className={styles.subtitle}>
            Connect an external wallet for <strong>{bucketLabel}</strong>
          </p>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Solana Address</label>
            <input
              type="text"
              value={address}
              onChange={e => {
                setAddress(e.target.value);
                setError('');
              }}
              placeholder="Paste your Solana address..."
              className={`${styles.input} ${error ? styles.inputError : ''}`}
            />
            {error && <p className={styles.errorText}>{error}</p>}
          </div>

          <div className={styles.actions}>
            <button onClick={handleSkip} className={styles.skipBtn}>
              Skip for now
            </button>
            <button onClick={handleSave} className={styles.saveBtn}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
