'use client';

import { useSession, signIn } from 'next-auth/react';
import { useState, useCallback, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { usePhaseOrchestrator } from '@/lib/hooks/usePhaseOrchestrator';
import { supabase } from '@/lib/db/supabase';
import Navbar from '@/components/layout/Navbar';
import SimulateZone from '@/components/hero/SimulateZone';
import FlowAnimation from '@/components/animation/FlowAnimation';
import BucketCard from '@/components/buckets/BucketCard';
import LoginModal from '@/components/auth/LoginModal';
import TaxPanel from '@/components/tax/TaxPanel';
import WalletDisplay from '@/components/layout/WalletDisplay';
import RuleTree, { Rule as RuleTreeRule } from '@/components/rules/RuleTree';
import ExecutionHistory from '@/components/rules/ExecutionHistory';
import type { Execution } from '@/components/rules/ExecutionHistory';
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
  const [rules, setRules] = useState<RuleTreeRule[]>([]);
  const [recentExecutions, setRecentExecutions] = useState<Execution[]>([]);
  const [loadingRules, setLoadingRules] = useState(true);

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
          simulate: false, // Always real execution in app
        }),
      });
      const data = await res.json();
      setExecutionResult(data);
    } catch {
      setExecutionResult({ success: false, txSignatures: [], error: 'Network error' });
    } finally {
      setExecuting(false);
    }
  }, [setExecuting, startSimulation, setExecutionResult]);

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

  // Load rules and setup Realtime subscription
  useEffect(() => {
    if (!session?.user?.userId) return;
    const userId = session.user.userId;

    const loadRules = async () => {
      setLoadingRules(true);
      try {
        // Load rules with conditions
        const { data: rulesData } = await supabase
          .from('rules')
          .select(`
            *,
            rule_conditions (*)
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        // Transform to RuleTree format
        const transformedRules: RuleTreeRule[] = (rulesData || []).map(rule => ({
          id: rule.id,
          name: rule.name,
          trigger_type: rule.trigger_type,
          allocation_type: rule.allocation_type,
          percent: rule.percent,
          fixed_amount: rule.fixed_amount,
          token: rule.token,
          is_active: rule.is_active,
          parent_rule_id: rule.parent_rule_id,
          conditionProgress: rule.rule_conditions ? {
            annualCap: rule.rule_conditions.annual_cap,
            annualUsed: 0, // TODO: calculate from executions
            monthlyCap: rule.rule_conditions.monthly_cap,
            monthlyUsed: 0, // TODO: calculate from executions
          } : undefined,
        }));

        // Build parent-child relationships
        const ruleMap = new Map<string, RuleTreeRule>();
        const roots: RuleTreeRule[] = [];

        transformedRules.forEach(rule => {
          ruleMap.set(rule.id, { ...rule, children: [] });
        });

        transformedRules.forEach(rule => {
          const ruleWithChildren = ruleMap.get(rule.id)!;
          if (rule.parent_rule_id) {
            const parent = ruleMap.get(rule.parent_rule_id);
            if (parent) {
              parent.children = parent.children || [];
              parent.children.push(ruleWithChildren);
            }
          } else {
            roots.push(ruleWithChildren);
          }
        });

        setRules(roots);

        // Load recent executions
        const { data: executions } = await supabase
          .from('rule_executions')
          .select('*')
          .eq('user_id', userId)
          .order('executed_at', { ascending: false })
          .limit(10);

        setRecentExecutions((executions || []).map(exec => ({
          id: exec.id,
          amount: exec.amount,
          token: exec.token,
          destination: exec.destination,
          tx_signatures: exec.tx_signatures,
          executed_at: exec.executed_at,
          status: exec.status as 'success' | 'failed' | 'capped',
        })));
      } catch (error) {
        console.error('Failed to load rules:', error);
      } finally {
        setLoadingRules(false);
      }
    };

    loadRules();

    // Setup Realtime subscription for rule_executions
    const subscription = supabase
      .channel('rule_executions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rule_executions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newExecution: Execution = {
            id: payload.new.id,
            amount: payload.new.amount,
            token: payload.new.token,
            destination: payload.new.destination,
            tx_signatures: payload.new.tx_signatures,
            executed_at: payload.new.executed_at,
            status: payload.new.status as 'success' | 'failed' | 'capped',
          };
          setRecentExecutions(prev => [newExecution, ...prev].slice(0, 10));
          refreshRules(userId); // Refresh condition progress
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [session]);

  const refreshRules = async (userId: string) => {
    const { data: rulesData } = await supabase
      .from('rules')
      .select(`
        *,
        rule_conditions (*)
      `)
      .eq('user_id', userId);

    // Same transformation logic as above
    const transformedRules: RuleTreeRule[] = (rulesData || []).map(rule => ({
      id: rule.id,
      name: rule.name,
      trigger_type: rule.trigger_type,
      allocation_type: rule.allocation_type,
      percent: rule.percent,
      fixed_amount: rule.fixed_amount,
      token: rule.token,
      is_active: rule.is_active,
      conditionProgress: rule.rule_conditions ? {
        annualCap: rule.rule_conditions.annual_cap,
        annualUsed: 0,
        monthlyCap: rule.rule_conditions.monthly_cap,
        monthlyUsed: 0,
      } : undefined,
    }));

    const ruleMap = new Map<string, RuleTreeRule>();
    const roots: RuleTreeRule[] = [];

    transformedRules.forEach(rule => {
      ruleMap.set(rule.id, { ...rule, children: [] });
    });

    transformedRules.forEach(rule => {
      const ruleWithChildren = ruleMap.get(rule.id)!;
      if (rule.parent_rule_id) {
        const parent = ruleMap.get(rule.parent_rule_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(ruleWithChildren);
        }
      } else {
        roots.push(ruleWithChildren);
      }
    });

    setRules(roots);
  };

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
                  <WalletDisplay />
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

          {/* Dashboard - Rules and Execution History */}
          {session && !loadingRules && (
            <div className={styles.dashboardGrid}>
              <RuleTree rules={rules} />
              <ExecutionHistory executions={recentExecutions} />
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
