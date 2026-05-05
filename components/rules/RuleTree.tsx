'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import styles from './RuleTree.module.css';

export interface Rule {
  id: string;
  name: string;
  trigger_type: 'on_income' | 'scheduled' | 'one_off';
  allocation_type: 'percent' | 'fixed' | 'remainder';
  percent?: number;
  fixed_amount?: number;
  token: string;
  is_active: boolean;
  parent_rule_id?: string; // Used for building hierarchy, not displayed
  children?: Rule[];
  conditionProgress?: {
    annualCap?: number;
    annualUsed?: number;
    monthlyCap?: number;
    monthlyUsed?: number;
  };
}

interface RuleTreeProps {
  rules: Rule[];
}

export default function RuleTree({ rules }: RuleTreeProps) {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Your Rules</h2>
      <div className={styles.tree}>
        {rules.map(rule => (
          <RuleNode key={rule.id} rule={rule} level={0} />
        ))}
      </div>
    </div>
  );
}

interface RuleNodeProps {
  rule: Rule;
  level: number;
}

function RuleNode({ rule, level }: RuleNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = rule.children && rule.children.length > 0;

  return (
    <div className={styles.node}>
      <div
        className={styles.nodeHeader}
        style={{ paddingLeft: `${level * 20}px` }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren && (
          <span className={styles.expandIcon}>
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
        )}
        <span className={`${styles.ruleName} ${!rule.is_active ? styles.inactive : ''}`}>
          {rule.name}
        </span>
        <span className={styles.ruleTrigger}>
          {rule.trigger_type === 'on_income' && '💰'}
          {rule.trigger_type === 'scheduled' && '📅'}
          {rule.trigger_type === 'one_off' && '⏰'}
        </span>
        <span className={styles.ruleAllocation}>
          {rule.allocation_type === 'percent' && `${rule.percent}%`}
          {rule.allocation_type === 'fixed' && `$${rule.fixed_amount}`}
          {rule.allocation_type === 'remainder' && 'Remainder'}
        </span>
        <span className={styles.ruleToken}>{rule.token}</span>
        {!rule.is_active && <span className={styles.pausedBadge}>Paused</span>}
      </div>

      {expanded && hasChildren && (
        <div className={styles.children}>
          {rule.children?.map(child => (
            <RuleNode key={child.id} rule={child} level={level + 1} />
          ))}
        </div>
      )}

      {expanded && rule.conditionProgress && (
        <div className={styles.conditionProgress}>
          {rule.conditionProgress.annualCap && (
            <ConditionProgress
              label="Annual"
              used={rule.conditionProgress.annualUsed || 0}
              cap={rule.conditionProgress.annualCap}
            />
          )}
          {rule.conditionProgress.monthlyCap && (
            <ConditionProgress
              label="Monthly"
              used={rule.conditionProgress.monthlyUsed || 0}
              cap={rule.conditionProgress.monthlyCap}
            />
          )}
        </div>
      )}
    </div>
  );
}

interface ConditionProgressProps {
  label: string;
  used: number;
  cap: number;
}

function ConditionProgress({ label, used, cap }: ConditionProgressProps) {
  const percentage = Math.min((used / cap) * 100, 100);
  const isNearCap = percentage >= 80;

  return (
    <div className={styles.progressContainer}>
      <div className={styles.progressLabel}>
        <span className={styles.progressLabelName}>{label}</span>
        <span className={styles.progressLabelValue}>
          ${used.toFixed(0)} / ${cap.toFixed(0)}
        </span>
      </div>
      <div className={styles.progressBar}>
        <div
          className={`${styles.progressFill} ${isNearCap ? styles.progressFillWarning : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
