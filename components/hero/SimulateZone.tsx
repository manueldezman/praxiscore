'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import ParsedPreview from '@/components/rules/ParsedPreview';
import type { AllocationResult, ParsedRule } from '@/lib/types';
import styles from './SimulateZone.module.css';

const PLACEHOLDERS = [
  'Send 30% to savings, 20% tax, invest the rest in SOL',
  'Split equally: emergency fund, USDC savings, and ETH',
  '40% spend, 20% save, 20% tax, 20% auto-buy SOL',
];

interface SimulateZoneProps {
  onSimulate: (amount: number, allocations: AllocationResult) => void;
  isExecuting: boolean;
}

export default function SimulateZone({ onSimulate, isExecuting }: SimulateZoneProps) {
  const { setRuleText, setInflowAmount, setParsedRules, buckets } = useAppStore();

  const [amount, setAmount] = useState('');
  const [rule, setRule] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [placeholderVisible, setPlaceholderVisible] = useState(true);
  const [isParsingLocal, setIsParsingLocal] = useState(false);
  const [localAllocation, setLocalAllocation] = useState<AllocationResult | null>(null);
  const [localWarnings, setLocalWarnings] = useState<string[]>([]);
  const [amountError, setAmountError] = useState('');
  const [ruleError, setRuleError] = useState('');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Rotate placeholders every 4s
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderVisible(false);
      setTimeout(() => {
        setPlaceholderIdx(i => (i + 1) % PLACEHOLDERS.length);
        setPlaceholderVisible(true);
      }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Parse rule via API with 300ms debounce
  const parseRule = useCallback(async (ruleText: string, inflowAmt: number) => {
    if (!ruleText.trim()) {
      setLocalAllocation(null);
      setLocalWarnings([]);
      setParsedRules([], null);
      return;
    }

    setIsParsingLocal(true);
    try {
      const bucketLabels = buckets.map(b => b.label);
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleText,
          inflowAmount: inflowAmt,
          existingBucketLabels: bucketLabels,
        }),
      });
      const data = await res.json();
      setLocalAllocation(data.allocationResult);
      setLocalWarnings(data.allocationResult?.warnings ?? []);
      setParsedRules(data.rules ?? [], data.allocationResult);
    } catch {
      setLocalWarnings(['Could not parse rule — check your connection']);
    } finally {
      setIsParsingLocal(false);
    }
  }, [buckets, setParsedRules]);

  const handleRuleChange = (val: string) => {
    setRule(val);
    setRuleText(val);
    setRuleError('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const numAmt = parseFloat(amount.replace(/,/g, '')) || 0;
      parseRule(val, numAmt);
    }, 300);
  };

  const handleAmountChange = (val: string) => {
    // Allow only numbers and decimal
    const clean = val.replace(/[^0-9.]/g, '');
    setAmount(clean);
    setAmountError('');
    const num = parseFloat(clean) || 0;
    setInflowAmount(num);
    if (rule.trim() && debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => parseRule(rule, num), 300);
    }
  };

  const handleSimulate = async () => {
    let valid = true;
    const numAmount = parseFloat(amount.replace(/,/g, '')) || 0;

    if (!numAmount || numAmount <= 0) {
      setAmountError('Enter an amount greater than 0');
      valid = false;
    }
    if (!rule.trim()) {
      setRuleError('Enter a rule to simulate');
      valid = false;
    }
    if (!valid) return;

    // Parse once more to make sure allocation is fresh
    let allocation = localAllocation;
    if (!allocation) {
      setIsParsingLocal(true);
      try {
        const res = await fetch('/api/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ruleText: rule, inflowAmount: numAmount }),
        });
        const data = await res.json();
        allocation = data.allocationResult;
        setParsedRules(data.rules ?? [], data.allocationResult);
      } finally {
        setIsParsingLocal(false);
      }
    }

    if (!allocation || !allocation.rules.length) {
      setRuleError("Couldn't parse your rule — try being more specific");
      return;
    }

    onSimulate(numAmount, allocation);
  };

  return (
    <div className={styles.zone}>
      {/* Amount row */}
      <div className={styles.amountRow}>
        <span className={styles.amountLabel}>I get paid</span>
        <div className={styles.amountInputWrapper}>
          <span className={styles.currencySign}>$</span>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={e => handleAmountChange(e.target.value)}
            placeholder="0.00"
            className={`${styles.amountInput} ${amountError ? styles.inputError : ''}`}
          />
        </div>
        <span className={styles.amountLabel}>in SOL</span>
      </div>
      {amountError && <p className={styles.errorText}>{amountError}</p>}

      {/* Rule textarea */}
      <div className={styles.ruleWrapper}>
        <textarea
          value={rule}
          onChange={e => handleRuleChange(e.target.value)}
          placeholder={placeholderVisible ? PLACEHOLDERS[placeholderIdx] : ''}
          className={`${styles.ruleTextarea} ${ruleError ? styles.inputError : ''}`}
          rows={3}
        />
        {ruleError && <p className={styles.errorText}>{ruleError}</p>}
      </div>

      {/* Parsed preview */}
      {(localAllocation || isParsingLocal) && (
        <ParsedPreview
          allocations={localAllocation?.rules ?? []}
          warnings={localWarnings}
          isLoading={isParsingLocal}
        />
      )}

      {/* Simulate button */}
      <button
        onClick={handleSimulate}
        disabled={isExecuting || isParsingLocal}
        className={styles.simulateBtn}
      >
        {isExecuting ? (
          <span className={styles.executing}>
            <span className={styles.executingDot} />
            Executing privately...
          </span>
        ) : (
          'Simulate your next paycheck →'
        )}
      </button>

      {/* Trust line */}
      <p className={styles.trustLine}>
        No one sees your income, your rules, or your allocations.
      </p>
    </div>
  );
}
