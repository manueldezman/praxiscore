'use client';

import { useAppStore } from '@/store/useAppStore';
import styles from './PresetRules.module.css';

const PRESETS = [
  {
    name: '50/30/20 Split',
    rule: '50% spend, 30% save, 20% invest',
    description: 'Classic budgeting rule',
  },
  {
    name: 'Freelancer Default',
    rule: '30% tax, 40% save, 30% spend',
    description: 'Tax-aware for contractors',
  },
  {
    name: 'Pay Yourself First',
    rule: '20% invest, 10% save, 70% spend',
    description: 'Prioritize investing',
  },
  {
    name: 'Aggressive Saver',
    rule: '50% save, 20% tax, 30% spend',
    description: 'Maximize savings',
  },
];

export default function PresetRules() {
  const { setRuleText, setInflowAmount } = useAppStore();

  const handlePresetClick = (rule: string) => {
    setRuleText(rule);
    setInflowAmount(5000);

    // Scroll to SimulateZone
    const simulateZone = document.querySelector('[data-simulate-zone]');
    if (simulateZone) {
      simulateZone.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Trigger parse after a short delay
    setTimeout(() => {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        const event = new Event('input', { bubbles: true });
        textarea.dispatchEvent(event);
      }
    }, 500);
  };

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.heading}>Start from a preset</h2>
        <p className={styles.subtext}>Click a template to get started instantly</p>
        <div className={styles.grid}>
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              className={styles.card}
              onClick={() => handlePresetClick(preset.rule)}
            >
              <h3 className={styles.name}>{preset.name}</h3>
              <p className={styles.rule}>{preset.rule}</p>
              <span className={styles.description}>{preset.description}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
