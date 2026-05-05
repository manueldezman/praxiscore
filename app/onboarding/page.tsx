'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { supabase } from '@/lib/db/supabase';

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

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
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Praxicore</h1>
          <p className="text-gray-600">Let's set up your automated financial rules</p>
        </div>

        {/* Step 1: NL Rule Input */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Step 1: Define Your Rules</h2>
          <p className="text-gray-600 mb-4">
            Describe how you want your money allocated in plain English.
          </p>
          <button
            onClick={() => router.push('/onboarding/step1')}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition"
          >
            Start
          </button>
        </div>

        {/* Step 2: Wallet Linking */}
        <div className="bg-white rounded-lg shadow p-6 mb-6 opacity-50">
          <h2 className="text-xl font-semibold mb-4">Step 2: Link Your Wallets</h2>
          <p className="text-gray-600">
            Connect external wallets for each bucket or let us manage them.
          </p>
        </div>

        {/* Step 3: Trigger Selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-6 opacity-50">
          <h2 className="text-xl font-semibold mb-4">Step 3: Choose Triggers</h2>
          <p className="text-gray-600">
            Decide when your rules should execute.
          </p>
        </div>

        {/* Step 4: Review */}
        <div className="bg-white rounded-lg shadow p-6 opacity-50">
          <h2 className="text-xl font-semibold mb-4">Step 4: Review & Confirm</h2>
          <p className="text-gray-600">
            Review your setup and start automating.
          </p>
        </div>
      </div>
    </div>
  );
}
