'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/db/supabase';
import styles from './PayrollPage.module.css';

type Tab = 'overview' | 'recipients' | 'rules' | 'run';

export default function PayrollPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [recipients, setRecipients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payroll Management</h1>
          <p className="text-gray-600">
            Manage payroll, recipients, and automated disbursements.
          </p>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'overview' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'recipients' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('recipients')}
          >
            Recipients
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'rules' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('rules')}
          >
            Rules
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'run' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('run')}
          >
            Run Payroll
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className={styles.tabContent}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className={styles.statCard}>
                <p className={styles.statLabel}>Next Payroll Date</p>
                <p className={styles.statValue}>June 1, 2026</p>
              </div>
              <div className={styles.statCard}>
                <p className={styles.statLabel}>Estimated Total</p>
                <p className={styles.statValue}>••••••••</p>
              </div>
              <div className={styles.statCard}>
                <p className={styles.statLabel}>Recipients</p>
                <p className={styles.statValue}>{recipients.length}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Payroll Runs</h2>
              <p className="text-gray-600">
                No payroll runs yet. Set up recipients and run your first payroll.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'recipients' && (
          <div className={styles.tabContent}>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Recipients</h2>
                <div className="flex gap-2">
                  <button className={styles.actionBtn}>
                    Add Manually
                  </button>
                  <button className={styles.actionBtn}>
                    Upload CSV
                  </button>
                </div>
              </div>

              {recipients.length === 0 ? (
                <div className={styles.emptyState}>
                  <p className={styles.emptyText}>No recipients added yet</p>
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Wallet Address</th>
                      <th>Salary/Rate</th>
                      <th>Token</th>
                      <th>Tax %</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recipients.map((recipient) => (
                      <tr key={recipient.id}>
                        <td>{recipient.label}</td>
                        <td className={styles.addressCell}>
                          {recipient.wallet_address.slice(0, 8)}...{recipient.wallet_address.slice(-8)}
                        </td>
                        <td>{recipient.amount}</td>
                        <td>{recipient.token}</td>
                        <td>{recipient.tax_withholding_percent}%</td>
                        <td>
                          <button className={styles.editBtn}>Edit</button>
                          <button className={styles.deleteBtn}>Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className={styles.tabContent}>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Payroll Rules</h2>

              <div className={styles.ruleSection}>
                <h3 className={styles.ruleTitle}>Schedule</h3>
                <div className={styles.ruleContent}>
                  <label className={styles.ruleLabel}>Run on</label>
                  <select className={styles.ruleSelect}>
                    <option>1st of every month</option>
                    <option>15th of every month</option>
                    <option>Last day of month</option>
                    <option>Custom</option>
                  </select>
                </div>
              </div>

              <div className={styles.ruleSection}>
                <h3 className={styles.ruleTitle}>Execution Mode</h3>
                <div className={styles.ruleContent}>
                  <label className={styles.toggleLabel}>
                    <input type="checkbox" defaultChecked />
                    <span>Auto-run on schedule</span>
                  </label>
                  <p className={styles.ruleHint}>
                    Payroll will execute automatically on the scheduled date. Disable to require manual approval.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'run' && (
          <div className={styles.tabContent}>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Run Payroll</h2>

              {recipients.length === 0 ? (
                <div className={styles.emptyState}>
                  <p className={styles.emptyText}>
                    Add recipients before running payroll
                  </p>
                  <button
                    onClick={() => setActiveTab('recipients')}
                    className={styles.primaryBtn}
                  >
                    Add Recipients
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className={styles.summary}>
                    <h3 className={styles.summaryTitle}>Summary</h3>
                    <div className={styles.summaryRow}>
                      <span className={styles.summaryLabel}>Recipients</span>
                      <span className={styles.summaryValue}>{recipients.length}</span>
                    </div>
                    <div className={styles.summaryRow}>
                      <span className={styles.summaryLabel}>Total Amount</span>
                      <span className={styles.summaryValue}>••••••••</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {/* Execute payroll */}}
                    disabled={loading}
                    className={styles.executeBtn}
                  >
                    {loading ? 'Executing...' : 'Execute Privately'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
