'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/db/supabase';

type AccountType = 'personal' | 'business';

interface AccountTypeOption {
  type: AccountType;
  title: string;
  description: string;
  features: string[];
  icon: string;
}

const ACCOUNT_TYPES: AccountTypeOption[] = [
  {
    type: 'personal',
    title: 'Personal / Freelancer',
    description: 'For individuals managing personal finances and freelance income',
    features: [
      'Automated savings and investing',
      'Tax reserve management',
      'Private spending buckets',
      'Single wallet management',
    ],
    icon: '👤',
  },
  {
    type: 'business',
    title: 'Business / Team',
    description: 'For companies running payroll, creators distributing rewards, DAOs disbursing grants',
    features: [
      'Payroll management',
      'Batch disbursements',
      'Team member access',
      'Multi-sig approvals',
    ],
    icon: '🏢',
  },
];

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<AccountType | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  const handleSelect = async (type: AccountType) => {
    setSelectedType(type);
    setLoading(true);

    try {
      // Update user's account_type in Supabase
      if (session?.user?.userId) {
        await supabase
          .from('users')
          .update({ account_type: type })
          .eq('id', session.user.userId);
      }

      // Store in sessionStorage for later steps
      sessionStorage.setItem('accountType', type);

      // Redirect to step 1
      router.push('/onboarding/step1');
    } catch (error) {
      console.error('Failed to save account type:', error);
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Praxicore</h1>
          <p className="text-xl text-gray-600 mb-2">
            Your money behaves the way you planned — automatically and privately.
          </p>
          <p className="text-gray-500">
            Choose how you'll use Praxicore to get started.
          </p>
        </div>

        {/* Account Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {ACCOUNT_TYPES.map((option) => (
            <button
              key={option.type}
              onClick={() => handleSelect(option.type)}
              disabled={loading}
              className={`
                bg-white rounded-xl shadow-lg p-8 text-left transition-all
                hover:shadow-xl hover:scale-[1.02] border-2
                ${selectedType === option.type ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent'}
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              <div className="text-4xl mb-4">{option.icon}</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{option.title}</h2>
              <p className="text-gray-600 mb-6">{option.description}</p>

              <ul className="space-y-2">
                {option.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-gray-700">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        {/* Progress Overview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Setup Overview</h3>
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold mr-3">
                1
              </div>
              <span className="text-gray-700">Define your rules in plain language</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center font-semibold mr-3">
                2
              </div>
              <span className="text-gray-500">Link wallets for each bucket</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center font-semibold mr-3">
                3
              </div>
              <span className="text-gray-500">Choose when rules should execute</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center font-semibold mr-3">
                4
              </div>
              <span className="text-gray-500">Review and start automating</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
