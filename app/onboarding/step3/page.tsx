'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styles from './TriggerSelector.module.css';

type TriggerType = 'on_income' | 'scheduled' | 'one_off';

interface TriggerConfig {
  type: TriggerType;
  label: string;
  description: string;
  icon: string;
}

const TRIGGERS: TriggerConfig[] = [
  {
    type: 'on_income',
    label: 'On Income Arrival',
    description: 'Execute automatically when funds arrive at your wallet',
    icon: '💰',
  },
  {
    type: 'scheduled',
    label: 'Scheduled',
    description: 'Execute on a recurring schedule (daily, weekly, monthly)',
    icon: '📅',
  },
  {
    type: 'one_off',
    label: 'One-Time',
    description: 'Execute once at a specific date and time',
    icon: '⏰',
  },
];

export default function OnboardingStep3() {
  const router = useRouter();
  const { data: session } = useSession();
  const [selectedTrigger, setSelectedTrigger] = useState<TriggerType>('on_income');
  const [recurrence, setRecurrence] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [runAt, setRunAt] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if we have saved data from previous steps
    const savedRules = sessionStorage.getItem('onboardingRules');
    const savedWallets = sessionStorage.getItem('onboardingWallets');

    if (!savedRules || !savedWallets) {
      router.push('/onboarding/step1');
    }
  }, [router]);

  const handleNext = async () => {
    setLoading(true);

    try {
      // Save trigger config to sessionStorage
      const triggerConfig = {
        type: selectedTrigger,
        recurrence: selectedTrigger === 'scheduled' ? recurrence : null,
        runAt: selectedTrigger === 'one_off' ? runAt : null,
      };

      sessionStorage.setItem('onboardingTrigger', JSON.stringify(triggerConfig));
      router.push('/onboarding/step4');
    } catch (error) {
      console.error('Failed to save trigger:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/onboarding/step2');
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
            <span className="text-sm text-gray-500">Step 3 of 4</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }} />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Trigger</h1>
          <p className="text-gray-600">
            Decide when your rules should execute.
          </p>
        </div>

        {/* Trigger cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {TRIGGERS.map((trigger) => (
            <button
              key={trigger.type}
              onClick={() => setSelectedTrigger(trigger.type)}
              className={`${styles.triggerCard} ${selectedTrigger === trigger.type ? styles.triggerCardSelected : ''}`}
            >
              <div className={styles.triggerIcon}>{trigger.icon}</div>
              <h3 className={styles.triggerLabel}>{trigger.label}</h3>
              <p className={styles.triggerDescription}>{trigger.description}</p>
            </button>
          ))}
        </div>

        {/* Scheduled options */}
        {selectedTrigger === 'scheduled' && (
          <div className={styles.optionsPanel}>
            <h3 className={styles.optionsTitle}>Recurrence</h3>
            <div className={styles.recurrenceOptions}>
              {(['daily', 'weekly', 'monthly'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setRecurrence(option)}
                  className={`${styles.recurrenceBtn} ${recurrence === option ? styles.recurrenceBtnSelected : ''}`}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* One-time options */}
        {selectedTrigger === 'one_off' && (
          <div className={styles.optionsPanel}>
            <h3 className={styles.optionsTitle}>Execution Date & Time</h3>
            <input
              type="datetime-local"
              value={runAt}
              onChange={e => setRunAt(e.target.value)}
              className={styles.datetimeInput}
            />
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleNext}
            disabled={loading || (selectedTrigger === 'one_off' && !runAt)}
            className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
