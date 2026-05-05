'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/db/supabase';
import { validateSolanaAddress } from '@/lib/utils/validateAddress';
import styles from './WalletLinkForm.module.css';

interface BucketWallet {
  bucketId: string;
  label: string;
  category: 'needs' | 'wants' | 'savings' | 'generosity';
  address: string;
  isManaged: boolean;
}

const CATEGORIES = {
  needs: {
    label: 'Needs',
    suggestions: ['Rent/Housing', 'Utilities', 'Offramp', 'Debt Repayment', 'Insurance'],
  },
  wants: {
    label: 'Wants',
    suggestions: ['Subscriptions', 'Entertainment', 'Sinking Funds', 'Dining'],
  },
  savings: {
    label: 'Savings & Investments',
    suggestions: ['Emergency Fund', 'Trading Account', 'Long-term Cold Wallet', 'DCA Wallet', 'Staking Wallet'],
  },
  generosity: {
    label: 'Generosity',
    suggestions: ['Giving/Donations', 'Family Support', 'Community Fund', 'Tithe'],
  },
};

export default function OnboardingStep2() {
  const router = useRouter();
  const { data: session } = useSession();
  const [bucketWallets, setBucketWallets] = useState<BucketWallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Load saved rules from sessionStorage
    const saved = sessionStorage.getItem('onboardingRules');
    if (!saved) {
      router.push('/onboarding/step1');
      return;
    }

    const { allocationResult } = JSON.parse(saved);
    if (!allocationResult?.rules) {
      router.push('/onboarding/step1');
      return;
    }

    // Initialize bucket wallets from parsed rules
    const initialWallets: BucketWallet[] = allocationResult.rules.map((rule: any) => ({
      bucketId: rule.bucket,
      label: rule.bucket,
      category: getCategoryForBucket(rule.bucket),
      address: '',
      isManaged: rule.bucket.toLowerCase() === 'tax',
    }));

    setBucketWallets(initialWallets);
  }, [router]);

  const getCategoryForBucket = (bucket: string): 'needs' | 'wants' | 'savings' | 'generosity' => {
    const lower = bucket.toLowerCase();
    if (lower.includes('tax') || lower.includes('bill')) return 'needs';
    if (lower.includes('save') || lower.includes('invest') || lower.includes('emergency')) return 'savings';
    if (lower.includes('give') || lower.includes('donat') || lower.includes('charity')) return 'generosity';
    return 'wants';
  };

  const handleAddressChange = (bucketId: string, address: string) => {
    setBucketWallets(prev =>
      prev.map(bw => bw.bucketId === bucketId ? { ...bw, address } : bw)
    );
    setErrors(prev => ({ ...prev, [bucketId]: '' }));
  };

  const handleSkip = (bucketId: string) => {
    setBucketWallets(prev =>
      prev.map(bw => bw.bucketId === bucketId ? { ...bw, address: '' } : bw)
    );
  };

  const handleNext = async () => {
    const newErrors: Record<string, string> = {};

    // Validate addresses
    bucketWallets.forEach(bw => {
      if (!bw.isManaged && bw.address && !validateSolanaAddress(bw.address)) {
        newErrors[bw.bucketId] = 'Invalid Solana address';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      // Save bucket wallets to Supabase
      const walletsToSave = bucketWallets.filter(bw => bw.address && !bw.isManaged);

      for (const wallet of walletsToSave) {
        await supabase.from('bucket_wallets').insert({
          user_id: session?.user?.userId,
          bucket_id: wallet.bucketId,
          label: wallet.label,
          address: wallet.address,
          category: wallet.category,
          network: 'solana',
        });
      }

      // Save to sessionStorage for next step
      sessionStorage.setItem('onboardingWallets', JSON.stringify(bucketWallets));
      router.push('/onboarding/step3');
    } catch (error) {
      console.error('Failed to save wallets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/onboarding/step1');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button onClick={handleBack} className="text-gray-600 hover:text-gray-900">
              ← Back
            </button>
            <span className="text-sm text-gray-500">Step 2 of 4</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '50%' }} />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Link Your Wallets</h1>
          <p className="text-gray-600">
            Connect external wallets for each bucket or let us manage them.
          </p>
        </div>

        <div className="space-y-6">
          {bucketWallets.map((bucketWallet) => (
            <div key={bucketWallet.bucketId} className={styles.bucketCard}>
              <div className={styles.bucketHeader}>
                <h3 className={styles.bucketName}>{bucketWallet.label}</h3>
                {bucketWallet.isManaged && (
                  <span className={styles.managedBadge}>Managed by Praxicore</span>
                )}
              </div>

              {bucketWallet.isManaged ? (
                <p className={styles.managedText}>
                  Funds will be held in a secure sub-account managed by Praxicore.
                </p>
              ) : (
                <div className={styles.addressInput}>
                  <input
                    type="text"
                    placeholder="Paste Solana address..."
                    value={bucketWallet.address}
                    onChange={e => handleAddressChange(bucketWallet.bucketId, e.target.value)}
                    className={`${styles.input} ${errors[bucketWallet.bucketId] ? styles.inputError : ''}`}
                  />
                  {errors[bucketWallet.bucketId] && (
                    <p className={styles.errorText}>{errors[bucketWallet.bucketId]}</p>
                  )}
                  <button
                    onClick={() => handleSkip(bucketWallet.bucketId)}
                    className={styles.skipBtn}
                  >
                    Skip for now
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleNext}
            disabled={loading}
            className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
