'use client';

import { useState } from 'react';
import styles from './ConditionForm.module.css';

export interface RuleCondition {
  annualCap?: number;
  monthlyCap?: number;
  redirectBucket?: string;
  resetPeriod: 'calendar_year' | 'rolling_12';
  pauseIfBelow?: number;
}

interface ConditionFormProps {
  value: RuleCondition;
  onChange: (value: RuleCondition) => void;
  availableBuckets?: string[];
}

export default function ConditionForm({ value, onChange, availableBuckets = [] }: ConditionFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleChange = (field: keyof RuleCondition, newValue: any) => {
    onChange({
      ...value,
      [field]: newValue,
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Conditions</h3>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={styles.toggleBtn}
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced
        </button>
      </div>

      {/* Annual Cap */}
      <div className={styles.field}>
        <label className={styles.label}>
          Annual Cap
          <span className={styles.labelHint}>(optional)</span>
        </label>
        <div className={styles.inputGroup}>
          <span className={styles.currencySign}>$</span>
          <input
            type="number"
            value={value.annualCap || ''}
            onChange={e => handleChange('annualCap', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="No limit"
            className={styles.input}
          />
        </div>
        {value.annualCap && (
          <div className={styles.redirectSection}>
            <label className={styles.subLabel}>Redirect when cap reached:</label>
            <select
              value={value.redirectBucket || ''}
              onChange={e => handleChange('redirectBucket', e.target.value || undefined)}
              className={styles.select}
            >
              <option value="">Keep in original bucket</option>
              {availableBuckets.map(bucket => (
                <option key={bucket} value={bucket}>{bucket}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Monthly Cap */}
      <div className={styles.field}>
        <label className={styles.label}>
          Monthly Cap
          <span className={styles.labelHint}>(optional)</span>
        </label>
        <div className={styles.inputGroup}>
          <span className={styles.currencySign}>$</span>
          <input
            type="number"
            value={value.monthlyCap || ''}
            onChange={e => handleChange('monthlyCap', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="No limit"
            className={styles.input}
          />
        </div>
      </div>

      {/* Advanced Options */}
      {showAdvanced && (
        <div className={styles.advanced}>
          {/* Reset Period */}
          <div className={styles.field}>
            <label className={styles.label}>Cap Reset Period</label>
            <div className={styles.toggleGroup}>
              <button
                className={`${styles.toggleOption} ${value.resetPeriod === 'calendar_year' ? styles.toggleOptionActive : ''}`}
                onClick={() => handleChange('resetPeriod', 'calendar_year')}
              >
                Calendar Year
              </button>
              <button
                className={`${styles.toggleOption} ${value.resetPeriod === 'rolling_12' ? styles.toggleOptionActive : ''}`}
                onClick={() => handleChange('resetPeriod', 'rolling_12')}
              >
                Rolling 12 Months
              </button>
            </div>
          </div>

          {/* Pause Threshold */}
          <div className={styles.field}>
            <label className={styles.label}>
              Pause if balance below
              <span className={styles.labelHint}>(optional)</span>
            </label>
            <div className={styles.inputGroup}>
              <span className={styles.currencySign}>$</span>
              <input
                type="number"
                value={value.pauseIfBelow || ''}
                onChange={e => handleChange('pauseIfBelow', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Never pause"
                className={styles.input}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
