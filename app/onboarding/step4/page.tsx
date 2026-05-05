'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/db/supabase';
import { generateWallet } from '@/lib/wallet/walletService';
import styles from './ReviewSummary.module.css';

export default function OnboardingStep4() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    // Load all saved data from sessionStorage
    const savedRules = sessionStorage.getItem('onboardingRules');
    const savedWallets = sessionStorage.getItem('onboardingWallets');
    const savedTrigger = sessionStorage.getItem('onboardingTrigger');

    if (!savedRules || !savedWallets || !savedTrigger) {
      router.push('/onboarding/step1');
      return;
    }

    setSummary({
      rules: JSON.parse(savedRules),
      wallets: JSON.parse(savedWallets),
      trigger: JSON.parse(savedTrigger),
    });
  }, [router]);

  const handleStart = async () => {
    if (!summary || !session?.user?.userId) return;

    setLoading(true);

    try {
      const userId = session.user.userId;

      // Save rules to Supabase
      for (const rule of summary.rules.allocationResult.rules) {
        const { data: ruleData, error: ruleError } = await supabase
          .from('rules')
          .insert({
            user_id: userId,
            name: rule.bucket,
            rule_text: summary.rules.ruleText,
            bucket: rule.bucket,
            allocation_type: rule.type,
            percent: rule.type === 'percent' ? rule.percent : null,
            fixed_amount: rule.type === 'fixed' ? rule.amount : null,
            token: 'USDC',
            trigger_type: summary.trigger.type,
            cron_expression: summary.trigger.recurrence ? getCronExpression(summary.trigger.recurrence) : null,
            run_at: summary.trigger.runAt ? new Date(summary.trigger.runAt).toISOString() : null,
            is_active: true,
          })
          .select()
          .single();

        if (ruleError) {
          console.error('Failed to save rule:', ruleError);
          continue;
        }

        // Create tax sub-account if this is a tax bucket
        if (rule.bucket.toLowerCase() === 'tax') {
          const taxWallet = generateWallet();

          await supabase.from('sub_accounts').insert({
            user_id: userId,
            bucket_type: 'tax',
            public_key: taxWallet.publicKey,
            encrypted_secret_key: taxWallet.encryptedSecretKey,
            balance_lamports: 0,
          });
        }
      }

      // Clear sessionStorage
      sessionStorage.removeItem('onboardingRules');
      sessionStorage.removeItem('onboardingWallets');
      sessionStorage.removeItem('onboardingTrigger');

      // Redirect to app
      router.push('/app');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCronExpression = (recurrence: string): string => {
    switch (recurrence) {
      case 'daily':
        return '0 0 * * *';
      case 'weekly':
        return '0 0 * * 0';
      case 'monthly':
        return '0 0 1 * *';
      default:
        return '0 0 * * *';
    }
  };

  const handleBack = () => {
    router.push('/onboarding/step3');
  };

  if (!summary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button onClick={handleBack} className="text-gray-600 hover:text-gray-900">
              ← Back
            </button>
            <span className="text-sm text-gray-500">Step 4 of 4</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Review & Confirm</h1>
          <p className="text-gray-600">
            Review your setup and start automating.
          </p>
        </div>

        {/* Rule Summary */}
        <div className={styles.summarySection}>
          <h2 className={styles.sectionTitle}>Your Rules</h2>
          <div className={styles.ruleText}>
            "{summary.rules.ruleText}"
          </div>
          <div className={styles.allocations}>
            {summary.rules.allocationResult.rules.map((rule: any, index: number) => (
              <div key={index} className={styles.allocationItem}>
                <span className={styles.allocationBucket}>{rule.bucket}</span>
                <span className={styles.allocationAmount}>
                  {rule.type === 'percent' ? `${rule.percent}%` : `$${rule.amount}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Wallet Summary */}
        <div className={styles.summarySection}>
          <h2 className={styles.sectionTitle}>Linked Wallets</h2>
          <div className={styles.walletList}>
            {summary.wallets.map((wallet: any) => (
              <div key={wallet.bucketId} className={styles.walletItem}>
                <span className={styles.walletLabel}>{wallet.label}</span>
                {wallet.isManaged ? (
                  <span className={styles.managedBadge}>Managed</span>
                ) : wallet.address ? (
                  <span className={styles.walletAddress}>
                    {wallet.address.slice(0, 8)}...{wallet.address.slice(-8)}
                  </span>
                ) : (
                  <span className={styles.walletSkipped}>Skipped</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Trigger Summary */}
        <div className={styles.summarySection}>
          <h2 className={styles.sectionTitle}>Trigger</h2>
          <div className={styles.triggerInfo}>
            <span className={styles.triggerType}>
              {summary.trigger.type === 'on_income' && 'On Income Arrival'}
              {summary.trigger.type === 'scheduled' && `Scheduled (${summary.trigger.recurrence})`}
              {summary.trigger.type === 'one_off' && `One-Time (${new Date(summary.trigger.runAt).toLocaleString()})`}
            </span>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleStart}
            disabled={loading}
            className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Setting up...' : 'Start Automating →'}
          </button>
        </div>
      </div>
    </div>
  );
}
