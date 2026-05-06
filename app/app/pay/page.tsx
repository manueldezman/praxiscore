'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { validateSolanaAddress } from '@/lib/utils/validateAddress';
import styles from './PayPage.module.css';

type Token = 'SOL' | 'USDC';

export default function PayPage() {
  const { data: session } = useSession();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState<Token>('USDC');
  const [memo, setMemo] = useState('');
  const [isShielded, setIsShielded] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleSend = async () => {
    setError('');
    setResult(null);

    // Validate
    if (!recipient || !validateSolanaAddress(recipient)) {
      setError('Invalid recipient address');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Invalid amount');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient,
          amount: parseFloat(amount),
          token,
          memo,
          isShielded,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Payment failed');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Send Private Payment</h1>
          <p className="text-gray-600">
            Send funds privately using Cloak shielded transfers.
          </p>
        </div>

        {/* Payment Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="space-y-6">
            {/* Recipient */}
            <div>
              <label className={styles.label}>Recipient Address</label>
              <input
                type="text"
                placeholder="Paste Solana address..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className={styles.input}
              />
            </div>

            {/* Amount */}
            <div>
              <label className={styles.label}>Amount</label>
              <div className={styles.amountInput}>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={styles.input}
                />
                <select
                  value={token}
                  onChange={(e) => setToken(e.target.value as Token)}
                  className={styles.tokenSelect}
                >
                  <option value="SOL">SOL</option>
                  <option value="USDC">USDC</option>
                </select>
              </div>
            </div>

            {/* Memo */}
            <div>
              <label className={styles.label}>Encrypted Memo (Optional)</label>
              <input
                type="text"
                placeholder="Add a private note..."
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className={styles.input}
              />
              <p className={styles.hint}>
                Only visible with viewing key
              </p>
            </div>

            {/* Privacy Toggle */}
            <div className={styles.privacyToggle}>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={isShielded}
                  onChange={(e) => setIsShielded(e.target.checked)}
                  className={styles.toggleCheckbox}
                />
                <span>Shielded via Cloak</span>
              </label>
              <p className={styles.privacyHint}>
                Amount and recipient hidden on-chain
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className={styles.error}>
                {error}
              </div>
            )}

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={loading}
              className={styles.sendBtn}
            >
              {loading ? 'Sending...' : isShielded ? 'Send Privately' : 'Send'}
            </button>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className={styles.result}>
            <div className={styles.resultHeader}>
              <span className={styles.resultIcon}>✓</span>
              <h2 className={styles.resultTitle}>Payment Sent</h2>
            </div>
            <div className={styles.resultDetails}>
              <div className={styles.resultItem}>
                <span className={styles.resultLabel}>Amount hidden</span>
                <span className={styles.resultValue}>✓</span>
              </div>
              <div className={styles.resultItem}>
                <span className={styles.resultLabel}>Recipient hidden</span>
                <span className={styles.resultValue}>✓</span>
              </div>
              <div className={styles.resultItem}>
                <span className={styles.resultLabel}>Viewing key generated</span>
                <span className={styles.resultValue}>✓</span>
              </div>
            </div>
            {result.txSignature && (
              <a
                href={`https://solscan.io/tx/${result.txSignature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.solscanLink}
              >
                View on Solscan →
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
