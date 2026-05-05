'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/db/supabase';
import { truncateAddress } from '@/lib/utils/validateAddress';
import styles from './SettingsPage.module.css';

interface BucketWallet {
  id: string;
  bucket_id: string;
  label: string;
  address: string;
  category: string;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [bucketWallets, setBucketWallets] = useState<BucketWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWallet, setNewWallet] = useState({
    bucket_id: '',
    label: '',
    address: '',
    category: 'needs' as 'needs' | 'wants' | 'savings' | 'generosity',
  });

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    if (!session?.user?.userId) return;

    const { data, error } = await supabase
      .from('bucket_wallets')
      .select('*')
      .eq('user_id', session.user.userId);

    if (error) {
      console.error('Failed to load wallets:', error);
    } else {
      setBucketWallets(data || []);
    }

    setLoading(false);
  };

  const handleAddWallet = async () => {
    if (!session?.user?.userId) return;

    const { error } = await supabase.from('bucket_wallets').insert({
      user_id: session.user.userId,
      bucket_id: newWallet.bucket_id,
      label: newWallet.label,
      address: newWallet.address,
      category: newWallet.category,
      network: 'solana',
    });

    if (error) {
      console.error('Failed to add wallet:', error);
      return;
    }

    setShowAddModal(false);
    setNewWallet({
      bucket_id: '',
      label: '',
      address: '',
      category: 'needs',
    });
    loadWallets();
  };

  const handleDeleteWallet = async (id: string) => {
    const { error } = await supabase
      .from('bucket_wallets')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete wallet:', error);
      return;
    }

    loadWallets();
  };

  const groupedWallets = {
    needs: bucketWallets.filter(w => w.category === 'needs'),
    wants: bucketWallets.filter(w => w.category === 'wants'),
    savings: bucketWallets.filter(w => w.category === 'savings'),
    generosity: bucketWallets.filter(w => w.category === 'generosity'),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

        {/* Wallet Management */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Linked Wallets</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className={styles.addBtn}
            >
              + Add Wallet
            </button>
          </div>

          {Object.entries(groupedWallet).map(([category, wallets]) => (
            <div key={category} className={styles.category}>
              <h3 className={styles.categoryTitle}>{category.charAt(0).toUpperCase() + category.slice(1)}</h3>
              {wallets.length === 0 ? (
                <p className={styles.emptyText}>No wallets linked</p>
              ) : (
                <div className={styles.walletList}>
                  {wallets.map((wallet) => (
                    <div key={wallet.id} className={styles.walletItem}>
                      <div className={styles.walletInfo}>
                        <span className={styles.walletLabel}>{wallet.label}</span>
                        <span className={styles.walletAddress}>
                          {truncateAddress(wallet.address, 8)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteWallet(wallet.id)}
                        className={styles.deleteBtn}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Wallet Modal */}
        {showAddModal && (
          <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
              <h2 className={styles.modalTitle}>Add Wallet</h2>

              <div className={styles.formGroup}>
                <label className={styles.label}>Bucket ID</label>
                <input
                  type="text"
                  value={newWallet.bucket_id}
                  onChange={e => setNewWallet({ ...newWallet, bucket_id: e.target.value })}
                  className={styles.input}
                  placeholder="e.g., emergency-fund"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Label</label>
                <input
                  type="text"
                  value={newWallet.label}
                  onChange={e => setNewWallet({ ...newWallet, label: e.target.value })}
                  className={styles.input}
                  placeholder="e.g., Emergency Fund"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Address</label>
                <input
                  type="text"
                  value={newWallet.address}
                  onChange={e => setNewWallet({ ...newWallet, address: e.target.value })}
                  className={styles.input}
                  placeholder="Paste Solana address..."
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Category</label>
                <select
                  value={newWallet.category}
                  onChange={e => setNewWallet({ ...newWallet, category: e.target.value as any })}
                  className={styles.select}
                >
                  <option value="needs">Needs</option>
                  <option value="wants">Wants</option>
                  <option value="savings">Savings & Investments</option>
                  <option value="generosity">Generosity</option>
                </select>
              </div>

              <div className={styles.modalActions}>
                <button
                  onClick={() => setShowAddModal(false)}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddWallet}
                  className={styles.saveBtn}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
