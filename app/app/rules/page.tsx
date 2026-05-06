'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/db/supabase';
import RuleTree from '@/components/rules/RuleTree';
import RuleInput from '@/components/rules/RuleInput';
import ParsedPreview from '@/components/rules/ParsedPreview';
import ConditionForm from '@/components/rules/ConditionForm';
import TriggerSelector from '@/components/rules/TriggerSelector';
import ExecutionHistory from '@/components/rules/ExecutionHistory';
import styles from './RulesPage.module.css';

type Tab = 'active' | 'schedules' | 'add';

export default function RulesPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>('active');
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load rules on mount
  // (In a real app, this would use useEffect and Supabase Realtime)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Rules & Automation</h1>
          <p className="text-gray-600">
            Define how your money moves automatically and privately.
          </p>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'active' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Active Rules
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'schedules' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('schedules')}
          >
            Schedules
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'add' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('add')}
          >
            Add New Rule
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'active' && (
          <div className={styles.tabContent}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Rules</h2>
                <RuleTree rules={rules} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Executions</h2>
                <ExecutionHistory executions={[]} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'schedules' && (
          <div className={styles.tabContent}>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Executions</h2>
              <p className="text-gray-600">
                No scheduled executions yet. Add a rule with a scheduled trigger to see upcoming runs here.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'add' && (
          <div className={styles.tabContent}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Rule Builder */}
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Define Your Rule</h2>
                  <RuleInput
                    value=""
                    onChange={() => {}}
                    onValidChange={() => {}}
                  />
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Conditions</h2>
                  <ConditionForm
                    onSave={() => {}}
                  />
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Trigger</h2>
                  <TriggerSelector
                    selected="on_income"
                    onSelect={() => {}}
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Preview</h2>
                <ParsedPreview
                  allocations={[]}
                  warnings={[]}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
