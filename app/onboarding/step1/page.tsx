'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import RuleInput from '@/components/rules/RuleInput';
import ParsedPreview from '@/components/rules/ParsedPreview';

export default function OnboardingStep1() {
  const router = useRouter();
  const { ruleText, parsedRules, allocationResult, setRuleText, setInflowAmount } = useAppStore();
  const [isValid, setIsValid] = useState(false);

  const handleNext = () => {
    if (isValid && allocationResult) {
      // Store the parsed rules for next step
      sessionStorage.setItem('onboardingRules', JSON.stringify({
        ruleText,
        parsedRules,
        allocationResult,
      }));
      router.push('/onboarding/step2');
    }
  };

  const handleBack = () => {
    router.push('/onboarding');
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
            <span className="text-sm text-gray-500">Step 1 of 4</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '25%' }} />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Define Your Rules</h1>
          <p className="text-gray-600">
            Describe how you want your money allocated in plain English.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <RuleInput
            value={ruleText}
            onChange={setRuleText}
            onValidChange={setIsValid}
          />

          {parsedRules.length > 0 && allocationResult && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Preview</h3>
              <ParsedPreview
                allocations={allocationResult.rules}
                warnings={allocationResult.warnings}
              />
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleNext}
              disabled={!isValid}
              className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
