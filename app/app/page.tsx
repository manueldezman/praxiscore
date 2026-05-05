'use client';

import { useSession, signIn } from 'next-auth/react';
import { useState, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { usePhaseOrchestrator } from '@/lib/hooks/usePhaseOrchestrator';
import Navbar from '@/components/layout/Navbar';
import SimulateZone from '@/components/hero/SimulateZone';
import FlowAnimation from '@/components/animation/FlowAnimation';
import BucketCard from '@/components/buckets/BucketCard';
import LoginModal from '@/components/auth/LoginModal';
import TaxPanel from '@/components/tax/TaxPanel';
import type { AllocationResult, BucketDefinition } from '@/lib/types';
import { DEFAULT_BUCKETS, BUCKET_COLOR_PALETTE } from '@/lib/types';
import styles from './AppPage.module.css';

function getBucketDef(bucketType: string, userBuckets: BucketDefinition[]): BucketDefinition {
  const all = [...DEFAULT_BUCKETS, ...userBuckets];
  const found = all.find(b => b.type === bucketType || b.id === bucketType);
  if (found) return found;
  const idx = Math.abs(bucketType.charCodeAt(0)) % BUCKET_COLOR_PALETTE.length;
  return {
    id: bucketType, label: bucketType.toUpperCase(), type: bucketType,
    colorVar: BUCKET_COLOR_PALETTE[idx].colorVar,
    colorRgbVar: BUCKET_COLOR_PALETTE[idx].colorRgbVar,
    token: 'USDC',
  };
}

export default function AppPage() {
  const { data: session, status } = useSession();
  const {
    simulation, isExecuting, executionResult,
    setExecuting, setExecutionResult, startSimulation,
    buckets,
  } = useAppStore();
  const { replay } = usePhaseOrchestrator();
  const [activeTab, setActiveTab] = useState<'execute' | 'compliance'>('execute');
  const [complianceData, setComplianceData] = useState<{ summary: string } | null>(null);
  const [loadingCompliance, setLoadingCompliance] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const walletPubkey = (session?.user as { walletPublicKey?: string })?.walletPublicKey;

  const handleSimulate = useCallback(async (amount: number, allocationResult: AllocationResult) => {
    setExecuting(true);
    startSimulation(amount, allocationResult.rules);
    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inflowAmount: amount,
          allocations: allocationResult.rules,
          simulate: !session, // real execution if authed
        }),
      });
      const data = await res.json();
      setExecutionResult(data);
    } catch {
      setExecutionResult({ success: false, txSignatures: [], error: 'Network error' });
    } finally {
      setExecuting(false);
    }
  }, [setExecuting, startSimulation, setExecutionResult, session]);

  const loadCompliance = async () => {
    setLoadingCompliance(true);
    try {
      const res = await fetch('/api/compliance');
      const data = await res.json();
      setComplianceData(data);
    } catch {
      setComplianceData({ summary: 'Unable to load compliance data' });
    } finally {
      setLoadingCompliance(false);
    }
  };

  const showBuckets = ['settle', 'reveal', 'complete'].includes(simulation.phase);
  const showReplay = simulation.phase === 'complete' || simulation.phase === 'reveal';

  // Unauthenticated state
  if (status === 'loading') {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingDot} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Navbar />

      <div className={styles.layout}>
        {/* Left sidebar */}
        <aside className={styles.sidebar}>
          {/* Account info */}
          <div className={styles.accountCard}>
            {session ? (
              <>
                <div className={styles.accountAvatar}>
                  {session.user?.image
                    ? <img src={session.user.image} alt="avatar" className={styles.avatarImg} />
                    : <span className={styles.avatarFallback}>{session.user?.name?.[0] ?? 'P'}</span>
                  }
                </div>
                <div className={styles.accountInfo}>
                  <p className={styles.accountName}>Your account</p>
                  {walletPubkey && (
                    <button
                      className={styles.walletCopy}
                      onClick={() => navigator.clipboard.writeText(walletPubkey)}
                      title="Click to copy"
                    >
                      {walletPubkey.slice(0, 6)}...{walletPubkey.slice(-4)}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className={styles.signInPrompt}>
                <p className={styles.signInText}>Sign in for real private execution</p>
                <button onClick={() => setLoginModalOpen(true)} className={styles.signInBtn}>
                  Continue with Google
                </button>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'execute' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('execute')}
            >
              Execute
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'compliance' ? styles.tabActive : ''}`}
              onClick={() => { setActiveTab('compliance'); if (!complianceData) loadCompliance(); }}
            >
              Compliance
            </button>
          </div>

          {activeTab === 'execute' && (
            <>
              <SimulateZone onSimulate={handleSimulate} isExecuting={isExecuting} />
              {session && <TaxPanel />}
            </>
          )}

          {activeTab === 'compliance' && (
            <div className={styles.compliancePanel}>
              <p className={styles.complianceLabel}>Viewing Key Report</p>
              {loadingCompliance ? (
                <div className={styles.complianceLoading}>Scanning transactions...</div>
              ) : complianceData ? (
                <div className={styles.complianceSummary}>
                  <p className={styles.complianceSummaryText}>{complianceData.summary}</p>
                  <div className={styles.viewingKeyRow}>
                    <span className={styles.viewingKeyLabel}>Viewing key</span>
                    <span className={styles.viewingKeyValue}>nk••••••••</span>
                  </div>
                  <p className={styles.complianceNote}>
                    Share this key with your accountant or auditor. They see your history — the public ledger sees nothing.
                  </p>
                </div>
              ) : (
                <button onClick={loadCompliance} className={styles.loadComplianceBtn}>
                  Load compliance report
                </button>
              )}
            </div>
          )}

          {/* Execution result */}
          {executionResult && (
            <div className={`${styles.execResult} ${executionResult.success ? styles.execSuccess : styles.execError}`}>
              {executionResult.success ? (
                <>
                  <span className={styles.execIcon}>✓</span>
                  <span>Private execution complete</span>
                  {executionResult.txSignatures?.length > 0 && (
                    <span className={styles.execSigCount}>
                      {executionResult.txSignatures.length} tx{executionResult.txSignatures.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span className={styles.execIcon}>⚠</span>
                  <span>{executionResult.error ?? 'Execution failed'}</span>
                </>
              )}
            </div>
          )}
        </aside>

        {/* Main area */}
        <main className={styles.main}>
          {/* Flow animation */}
          <div className={styles.animationCard}>
            <FlowAnimation
              phase={simulation.phase}
              inflowAmount={simulation.inflowAmount}
              allocations={simulation.allocations}
            />
            {showReplay && (
              <button onClick={replay} className={styles.replayBtn}>
                ↺ Replay transaction
              </button>
            )}
          </div>

          {/* Bucket cards */}
          {showBuckets && simulation.allocations.length > 0 && (
            <>
              <p className={styles.bucketsHeading}>Allocation summary</p>
              <div className={styles.bucketsGrid}>
                {simulation.allocations.map((alloc, i) => {
                  const bucketDef = getBucketDef(alloc.bucket, buckets);
                  return (
                    <BucketCard
                      key={alloc.bucket + i}
                      bucket={bucketDef}
                      allocation={alloc}
                      state={simulation.phase === 'settle' ? 'filling' : 'settled'}
                      animationDelay={i * 80}
                    />
                  );
                })}
              </div>
            </>
          )}

          {simulation.phase === 'idle' && (
            <div className={styles.idleState}>
              <div className={styles.idleIcon}>◎</div>
              <p className={styles.idleText}>Enter an amount and a rule to simulate your next paycheck</p>
            </div>
          )}
        </main>
      </div>

      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />
    </div>
  );
}
