'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/db/supabase';
import { validateSolanaAddress } from '@/lib/utils/validateAddress';
import styles from './BatchPage.module.css';

type DistributionType = 'equal' | 'custom' | 'percentage' | 'tiered';
type Token = 'SOL' | 'USDC';

export default function BatchPage() {
  const { data: session } = useSession();
  const [distributionType, setDistributionType] = useState<DistributionType>('equal');
  const [title, setTitle] = useState('');
  const [token, setToken] = useState<Token>('USDC');
  const [totalAmount, setTotalAmount] = useState('');
  const [recipients, setRecipients] = useState<any[]>([]);
  const [isShielded, setIsShielded] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const accountType = (session?.user as any)?.accountType || 'personal';

  // Redirect if not business account
  if (accountType !== 'business') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Business Feature</h1>
          <p className="text-gray-600">
            This feature is only available for business accounts.
          </p>
        </div>
      </div>
    );
  }

  const addRecipient = () => {
    setRecipients([...recipients, { name: '', address: '', amount: '' }]);
  };

  const updateRecipient = (index: number, field: string, value: string) => {
    const updated = [...recipients];
    updated[index] = { ...updated[index], [field]: value };
    setRecipients(updated);
  };

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const handleExecute = async () => {
    setError('');
    setResult(null);

    // Validate
    if (!title) {
      setError('Please enter a title for this batch');
      return;
    }

    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      setError('Please enter a valid total amount');
      return;
    }

    if (recipients.length === 0) {
      setError('Please add at least one recipient');
      return;
    }

    // Validate addresses
    for (const recipient of recipients) {
      if (!recipient.address || !validateSolanaAddress(recipient.address)) {
        setError(`Invalid address for ${recipient.name || 'recipient'}`);
        return;
      }
    }

    setLoading(true);

    try {
      const res = await fetch('/api/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          distributionType,
          token,
          totalAmount: parseFloat(totalAmount),
          recipients,
          isShielded,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Batch execution failed');
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
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Batch Disbursement</h1>
          <p className="text-gray-600">
            Distribute funds to multiple recipients privately in a single transaction.
          </p>
        </div>

        {/* Batch Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className={styles.label}>Batch Title</label>
              <input
                type="text"
                placeholder="e.g., Q2 Hackathon Winners"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={styles.input}
              />
            </div>

            {/* Distribution Type */}
            <div>
              <label className={styles.label}>Distribution Type</label>
              <div className={styles.distributionTypes}>
                {(['equal', 'custom', 'percentage', 'tiered'] as DistributionType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setDistributionType(type)}
                    className={`${styles.typeBtn} ${distributionType === type ? styles.typeBtnActive : ''}`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Total Amount */}
            <div>
              <label className={styles.label}>Total Amount</label>
              <div className={styles.amountInput}>
                <input
                  type="number"
                  placeholder="0.00"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
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

            {/* Recipients */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className={styles.label}>Recipients</label>
                <div className="flex gap-2">
                  <button
                    onClick={addRecipient}
                    className={styles.addBtn}
                  >
                    Add Recipient
                  </button>
                  <button className={styles.uploadBtn}>
                    Upload CSV
                  </button>
                </div>
              </div>

              {recipients.length === 0 ? (
                <div className={styles.emptyRecipients}>
                  <p className={styles.emptyText}>No recipients added</p>
                </div>
              ) : (
                <div className={styles.recipientsList}>
                  {recipients.map((recipient, index) => (
                    <div key={index} className={styles.recipientRow}>
                      <input
                        type="text"
                        placeholder="Name"
                        value={recipient.name}
                        onChange={(e) => updateRecipient(index, 'name', e.target.value)}
                        className={styles.recipientInput}
                      />
                      <input
                        type="text"
                        placeholder="Wallet address"
                        value={recipient.address}
                        onChange={(e) => updateRecipient(index, 'address', e.target.value)}
                        className={styles.recipientInput}
                      />
                      {distributionType === 'custom' && (
                        <input
                          type="number"
                          placeholder="Amount"
                          value={recipient.amount}
                          onChange={(e) => updateRecipient(index, 'amount', e.target.value)}
                          className={styles.recipientInput}
                        />
                      )}
                      <button
                        onClick={() => removeRecipient(index)}
                        className={styles.removeBtn}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
                All amounts and recipients hidden on-chain
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className={styles.error}>
                {error}
              </div>
            )}

            {/* Execute Button */}
            <button
              onClick={handleExecute}
              disabled={loading}
              className={styles.executeBtn}
            >
              {loading ? 'Executing...' : 'Execute Privately'}
            </button>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className={styles.result}>
            <div className={styles.resultHeader}>
              <span className={styles.resultIcon}>✓</span>
              <h2 className={styles.resultTitle}>Batch Complete</h2>
            </div>
            <div className={styles.resultDetails}>
              <div className={styles.resultItem}>
                <span className={styles.resultLabel}>Recipients</span>
                <span className={styles.resultValue}>{recipients.length}</span>
              </div>
              <div className={styles.resultItem}>
                <span className={styles.resultLabel}>Total</span>
                <span className={styles.resultValue}>••••••••</span>
              </div>
              <div className={styles.resultItem}>
                <span className={styles.resultLabel}>Viewing Key</span>
                <span className={styles.resultValue}>Generated</span>
              </div>
            </div>
            <div className={styles.proofLink}>
              <p className={styles.proofText}>
                Shareable proof link: <span className={styles.proofUrl}>praxicore.app/audit/{result.viewingKey}</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
