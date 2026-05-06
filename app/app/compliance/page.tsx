'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/db/supabase';
import TaxPanel from '@/components/tax/TaxPanel';
import TaxWithdrawModal from '@/components/tax/TaxWithdrawModal';
import styles from './CompliancePage.module.css';

type ViewMode = 'freelancer' | 'business';

export default function CompliancePage() {
  const { data: session } = useSession();
  const [viewMode, setViewMode] = useState<ViewMode>('freelancer');
  const [complianceData, setComplianceData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);

  const accountType = (session?.user as any)?.accountType || 'personal';

  // Set view mode based on account type
  useState(() => {
    if (accountType === 'business') {
      setViewMode('business');
    }
  });

  const loadComplianceReport = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/compliance');
      const data = await res.json();
      setComplianceData(data);
    } catch (error) {
      console.error('Failed to load compliance report:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAuditorAccess = async () => {
    // Generate time-scoped viewing key for auditor
    // This would call an API endpoint to create a scoped key
    alert('Auditor access link generated (not implemented yet)');
  };

  const exportReport = (format: 'pdf' | 'csv') => {
    // Export compliance report
    alert(`Exporting as ${format.toUpperCase()} (not implemented yet)`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tax & Compliance</h1>
          <p className="text-gray-600">
            View your tax liabilities and generate compliance reports.
          </p>
        </div>

        {/* View Mode Toggle (for testing) */}
        {accountType === 'business' && (
          <div className={styles.viewToggle}>
            <button
              className={`${styles.toggleBtn} ${viewMode === 'freelancer' ? styles.toggleBtnActive : ''}`}
              onClick={() => setViewMode('freelancer')}
            >
              Freelancer View
            </button>
            <button
              className={`${styles.toggleBtn} ${viewMode === 'business' ? styles.toggleBtnActive : ''}`}
              onClick={() => setViewMode('business')}
            >
              Business View
            </button>
          </div>
        )}

        {/* Freelancer Mode */}
        {viewMode === 'freelancer' && (
          <div className="space-y-6">
            {/* Tax Panel */}
            <TaxPanel onWithdraw={() => setWithdrawModalOpen(true)} />

            {/* Compliance Report */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Compliance Report</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => exportReport('csv')}
                    className={styles.exportBtn}
                  >
                    Export CSV
                  </button>
                  <button
                    onClick={() => exportReport('pdf')}
                    className={styles.exportBtn}
                  >
                    Export PDF
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                </div>
              ) : complianceData ? (
                <div className={styles.complianceContent}>
                  <div className={styles.summarySection}>
                    <h3 className={styles.summaryTitle}>Summary</h3>
                    <p className={styles.summaryText}>{complianceData.summary}</p>
                  </div>

                  <div className={styles.viewingKeySection}>
                    <h3 className={styles.viewingKeyTitle}>Viewing Key</h3>
                    <div className={styles.viewingKeyDisplay}>
                      <span className={styles.viewingKeyLabel}>nk••••••••</span>
                      <button
                        onClick={generateAuditorAccess}
                        className={styles.shareBtn}
                      >
                        Share with Accountant
                      </button>
                    </div>
                    <p className={styles.viewingKeyHint}>
                      Share this key with your accountant or auditor. They see your history — the public ledger sees nothing.
                    </p>
                  </div>
                </div>
              ) : (
                <button
                  onClick={loadComplianceReport}
                  className={styles.loadBtn}
                >
                  Load Compliance Report
                </button>
              )}
            </div>
          </div>
        )}

        {/* Business Mode */}
        {viewMode === 'business' && (
          <div className="space-y-6">
            {/* Payroll Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Payroll Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={styles.statCard}>
                  <p className={styles.statLabel}>This Month</p>
                  <p className={styles.statValue}>••••••••</p>
                </div>
                <div className={styles.statCard}>
                  <p className={styles.statLabel}>Year to Date</p>
                  <p className={styles.statValue}>••••••••</p>
                </div>
              </div>
            </div>

            {/* Per-Employee Tax Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Employee Tax Withholding</h2>
              <p className="text-gray-600">
                Per-employee tax withholding summary will appear here.
              </p>
            </div>

            {/* Compliance Report */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Company Compliance Report</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => exportReport('csv')}
                    className={styles.exportBtn}
                  >
                    Export Per-Employee CSV
                  </button>
                  <button
                    onClick={() => exportReport('pdf')}
                    className={styles.exportBtn}
                  >
                    Export Company PDF
                  </button>
                </div>
              </div>

              <button
                onClick={generateAuditorAccess}
                className={styles.auditorBtn}
              >
                Generate Auditor Access
              </button>
            </div>
          </div>
        )}

        {/* Tax Withdraw Modal */}
        {withdrawModalOpen && (
          <TaxWithdrawModal
            isOpen={withdrawModalOpen}
            onClose={() => setWithdrawModalOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
