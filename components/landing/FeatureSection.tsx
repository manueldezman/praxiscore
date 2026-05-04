'use client';

import { useEffect, useState } from 'react';
import styles from './FeatureSection.module.css';

// ─── Micro diagrams (extracted from BentoGrid) ───────────────────────────────

function RulesMicroDiagram() {
  const text = 'Save 30%, pay tax 20%, invest rest in SOL';
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const iv = setInterval(() => {
      setDisplayed(text.slice(0, ++i));
      if (i >= text.length) { clearInterval(iv); setDone(true); }
    }, 55);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => { setDone(false); setDisplayed(''); }, 3000);
    return () => clearTimeout(t);
  }, [done]);

  return (
    <div className={styles.ruleInput}>
      <span className={styles.ruleText}>{displayed}</span>
      <span className={`${styles.ruleCursor} animate-cursor-blink`}>_</span>
    </div>
  );
}

function PrivacyMicroDiagram() {
  const [revealed, setRevealed] = useState(false);

  const handleClick = () => {
    setRevealed(true);
    setTimeout(() => setRevealed(false), 2000);
  };

  return (
    <div className={styles.privacyDemo} onClick={handleClick}>
      <span className={styles.privacyIcon}>🔒</span>
      <span
        className={styles.privacyAmount}
        style={{
          filter: revealed ? 'blur(0)' : 'blur(5px)',
          opacity: revealed ? 1 : 0.6,
          transition: 'filter 200ms ease, opacity 200ms ease',
        }}
      >
        {revealed ? '$4,200.00' : '•••.••'}
      </span>
      <span className={styles.privacyHint}>{revealed ? 'Revealed ✓' : 'Tap to reveal'}</span>
    </div>
  );
}

function TimelineMicroDiagram() {
  const steps = [
    { label: 'Receive', icon: '↓', color: 'var(--inflow)' },
    { label: 'Execute', icon: '⚡', color: 'var(--invest)' },
    { label: 'Done', icon: '✓', color: 'var(--savings)' },
  ];
  return (
    <div className={styles.timeline}>
      {steps.map((s, i) => (
        <div key={s.label} className={styles.timelineStep}>
          <div className={styles.timelineNode} style={{ borderColor: s.color, color: s.color }}>
            {s.icon}
          </div>
          <div className={styles.timelineLabel}>{s.label}</div>
          {i < steps.length - 1 && <div className={styles.timelineConnector} />}
        </div>
      ))}
    </div>
  );
}

// ─── Feature Section ─────────────────────────────────────────────────────────

const FEATURES = [
  {
    title: 'Rules in plain language',
    description: 'Type how you want money to move. Praxicore handles the rest — splitting, routing, and executing instantly.',
    diagram: <RulesMicroDiagram />,
    align: 'left',
  },
  {
    title: 'Private by default',
    description: 'Amounts stay hidden until you choose to see them. The public ledger shows nothing.',
    diagram: <PrivacyMicroDiagram />,
    align: 'right',
  },
  {
    title: 'Works the moment money arrives',
    description: 'Rules trigger on inflow. No manual steps, no app to open.',
    diagram: <TimelineMicroDiagram />,
    align: 'left',
  },
];

export default function FeatureSection() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {FEATURES.map((feature, index) => (
          <div
            key={feature.title}
            className={`${styles.row} ${feature.align === 'right' ? styles.alignRight : ''}`}
          >
            <div className={styles.content}>
              <h3 className={styles.title}>{feature.title}</h3>
              <p className={styles.description}>{feature.description}</p>
            </div>
            <div className={styles.diagram}>{feature.diagram}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
