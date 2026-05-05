'use client';

import { useState } from 'react';
import styles from './TriggerSelector.module.css';

export type TriggerType = 'on_income' | 'scheduled' | 'one_off';

interface TriggerSelectorProps {
  value: TriggerType;
  onChange: (value: TriggerType) => void;
  recurrence?: 'daily' | 'weekly' | 'monthly';
  onRecurrenceChange?: (value: 'daily' | 'weekly' | 'monthly') => void;
  runAt?: string;
  onRunAtChange?: (value: string) => void;
}

const TRIGGERS = [
  {
    type: 'on_income' as const,
    label: 'On Income Arrival',
    description: 'Execute automatically when funds arrive at your wallet',
    icon: '💰',
  },
  {
    type: 'scheduled' as const,
    label: 'Scheduled',
    description: 'Execute on a recurring schedule (daily, weekly, monthly)',
    icon: '📅',
  },
  {
    type: 'one_off' as const,
    label: 'One-Time',
    description: 'Execute once at a specific date and time',
    icon: '⏰',
  },
];

export default function TriggerSelector({
  value,
  onChange,
  recurrence = 'monthly',
  onRecurrenceChange,
  runAt = '',
  onRunAtChange,
}: TriggerSelectorProps) {
  return (
    <div className={styles.container}>
      <div className={styles.triggerCards}>
        {TRIGGERS.map((trigger) => (
          <button
            key={trigger.type}
            onClick={() => onChange(trigger.type)}
            className={`${styles.triggerCard} ${value === trigger.type ? styles.triggerCardSelected : ''}`}
          >
            <div className={styles.triggerIcon}>{trigger.icon}</div>
            <h3 className={styles.triggerLabel}>{trigger.label}</h3>
            <p className={styles.triggerDescription}>{trigger.description}</p>
          </button>
        ))}
      </div>

      {/* Scheduled options */}
      {value === 'scheduled' && onRecurrenceChange && (
        <div className={styles.optionsPanel}>
          <h3 className={styles.optionsTitle}>Recurrence</h3>
          <div className={styles.recurrenceOptions}>
            {(['daily', 'weekly', 'monthly'] as const).map((option) => (
              <button
                key={option}
                onClick={() => onRecurrenceChange(option)}
                className={`${styles.recurrenceBtn} ${recurrence === option ? styles.recurrenceBtnSelected : ''}`}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* One-time options */}
      {value === 'one_off' && onRunAtChange && (
        <div className={styles.optionsPanel}>
          <h3 className={styles.optionsTitle}>Execution Date & Time</h3>
          <input
            type="datetime-local"
            value={runAt}
            onChange={e => onRunAtChange(e.target.value)}
            className={styles.datetimeInput}
          />
        </div>
      )}
    </div>
  );
}
