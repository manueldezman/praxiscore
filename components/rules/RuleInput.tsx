'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ParsedPreview from '@/components/rules/ParsedPreview';
import type { AllocationResult, ParsedRule } from '@/lib/types';
import styles from './RuleInput.module.css';

const PLACEHOLDERS = [
  'Send 30% to savings, 20% tax, invest the rest in SOL',
  'Split equally: emergency fund, USDC savings, and ETH',
  '40% spend, 20% save, 20% tax, 20% auto-buy SOL',
];

const PRESETS = [
  { name: '50/30/20 Split', rule: '50% spend, 30% save, 20% invest' },
  { name: 'Freelancer Default', rule: '30% tax, 40% save, 30% spend' },
  { name: 'Pay Yourself First', rule: '20% invest, 10% save, 70% spend' },
  { name: 'Aggressive Saver', rule: '50% save, 20% tax, 30% spend' },
];

interface RuleInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidChange?: (isValid: boolean) => void;
  amount?: number;
  showPresets?: boolean;
  showSimulateButton?: boolean;
  onSimulate?: (amount: number, allocation: AllocationResult) => void;
  isExecuting?: boolean;
}

export default function RuleInput({
  value,
  onChange,
  onValidChange,
  amount = 5000,
  showPresets = true,
  showSimulateButton = false,
  onSimulate,
  isExecuting = false,
}: RuleInputProps) {
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [placeholderVisible, setPlaceholderVisible] = useState(true);
  const [isParsing, setIsParsing] = useState(false);
  const [localAllocation, setLocalAllocation] = useState<AllocationResult | null>(null);
  const [localWarnings, setLocalWarnings] = useState<string[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
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
      onValidChange?.(false);
      return;
    }

    setIsParsing(true);
    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleText,
          inflowAmount: inflowAmt,
        }),
      });
      const data = await res.json();
      setLocalAllocation(data.allocationResult);
      setLocalWarnings(data.allocationResult?.warnings ?? []);
      onValidChange?.(!!data.allocationResult?.rules?.length);
    } catch {
      setLocalWarnings(['Could not parse rule — check your connection']);
      onValidChange?.(false);
    } finally {
      setIsParsing(false);
    }
  }, [onValidChange]);

  const handleChange = (val: string) => {
    onChange(val);
    setRuleError('');
    setSelectedPreset(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      parseRule(val, amount);
    }, 300);
  };

  const handlePresetClick = (presetName: string, presetRule: string) => {
    setSelectedPreset(presetName);
    onChange(presetRule);
    setRuleError('');

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      parseRule(presetRule, amount);
    }, 100);
  };

  const handleSimulate = () => {
    if (localAllocation && onSimulate) {
      onSimulate(amount, localAllocation);
    }
  };

  return (
    <div className={styles.container}>
      {/* Rule textarea */}
      <div className={styles.ruleWrapper}>
        <textarea
          value={value}
          onChange={e => handleChange(e.target.value)}
          placeholder={placeholderVisible ? PLACEHOLDERS[placeholderIdx] : ''}
          className={`${styles.ruleTextarea} ${ruleError ? styles.inputError : ''}`}
          rows={3}
        />
        {ruleError && <p className={styles.errorText}>{ruleError}</p>}
      </div>

      {/* Parsed preview */}
      {(localAllocation || isParsing) && (
        <ParsedPreview
          allocations={localAllocation?.rules ?? []}
          warnings={localWarnings}
          isLoading={isParsing}
        />
      )}

      {/* Preset buttons */}
      {showPresets && (
        <div className={styles.presets}>
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              className={`${styles.presetBtn} ${selectedPreset === preset.name ? styles.presetBtnSelected : ''}`}
              onClick={() => handlePresetClick(preset.name, preset.rule)}
            >
              {preset.name}
            </button>
          ))}
        </div>
      )}

      {/* Simulate button */}
      {showSimulateButton && (
        <button
          onClick={handleSimulate}
          disabled={isExecuting || isParsing || !localAllocation}
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
      )}
    </div>
  );
}
