'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './BentoGrid.module.css';

// ─── BentoCard ────────────────────────────────────────────────────────────────

interface BentoCardProps {
  label: string;
  title: string;
  descriptor: string;
  children?: React.ReactNode;
  wide?: boolean;
  fullWidth?: boolean;
  dark?: boolean;
  className?: string;
}

export function BentoCard({
  label, title, descriptor, children, wide, fullWidth, dark, className = '',
}: BentoCardProps) {
  return (
    <div className={`${styles.card} ${wide ? styles.wide : ''} ${fullWidth ? styles.fullWidth : ''} ${dark ? styles.dark : ''} ${className}`}>
      <p className={styles.cardLabel}>{label}</p>
      <h3 className={styles.cardTitle}>{title}</h3>
      <p className={styles.cardDescriptor}>{descriptor}</p>
      {children && <div className={styles.cardDiagram}>{children}</div>}
    </div>
  );
}

// ─── Micro diagrams ───────────────────────────────────────────────────────────

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

function TokensMicroDiagram() {
  const tokens = [
    { sym: '◎', label: 'SOL', color: 'var(--invest)' },
    { sym: '$', label: 'USDC', color: 'var(--savings)' },
    { sym: 'Ξ', label: 'ETH', color: 'var(--spend)' },
  ];
  const buckets = ['SPEND', 'SAVE', 'INVEST', 'TAX'];
  return (
    <div className={styles.tokensGrid}>
      <div className={styles.tokensList}>
        {tokens.map(t => (
          <div key={t.sym} className={styles.tokenPill} style={{ color: t.color, borderColor: t.color }}>
            <span>{t.sym}</span>
            <span>{t.label}</span>
          </div>
        ))}
      </div>
      <div className={styles.arrowRight}>→</div>
      <div className={styles.bucketsList}>
        {buckets.map((b, i) => {
          const colors = ['var(--spend)', 'var(--savings)', 'var(--invest)', 'var(--tax)'];
          return (
            <div key={b} className={styles.microBucket} style={{ borderColor: colors[i] }}>
              {b}
            </div>
          );
        })}
      </div>
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

// ─── BentoGrid ────────────────────────────────────────────────────────────────

export default function BentoGrid() {
  return (
    <section id="features" className={styles.section}>
      <div className={styles.grid}>
        {/* Card 1 — Rules, wide */}
        <BentoCard
          wide
          label="Natural Language"
          title="Rules in plain language"
          descriptor="Type how you want money to move. Praxicore handles the rest — splitting, routing, and executing instantly."
        >
          <RulesMicroDiagram />
        </BentoCard>

        {/* Card 2 — Privacy */}
        <BentoCard
          label="Privacy First"
          title="Private by default"
          descriptor="Amounts stay hidden until you choose to see them. The public ledger shows nothing."
        >
          <PrivacyMicroDiagram />
        </BentoCard>

        {/* Card 3 — Execution */}
        <BentoCard
          label="Zero Delay"
          title="Works the moment money arrives"
          descriptor="Rules trigger on inflow. No manual steps, no app to open."
        >
          <TimelineMicroDiagram />
        </BentoCard>

        {/* Card 4 — Tokens */}
        <BentoCard
          wide
          label="Multi-token"
          title="Any token, any split"
          descriptor="SOL, USDC, USDT — route each bucket to the asset that makes sense. Swaps happen privately via Orca."
        >
          <TokensMicroDiagram />
        </BentoCard>

        {/* Card 5 — Tax */}
        <BentoCard
          label="Tax-aware"
          title="Built-in tax bucket"
          descriptor="Automatically set aside your tax obligation the moment you're paid. No year-end surprises."
        />

        {/* Card 6 — CTA full width */}
        <BentoCard
          fullWidth
          dark
          label="Get Started"
          title="Start automating your next paycheck."
          descriptor="Sign in with Google. Your private wallet is created automatically — no seed phrases, no crypto setup."
        />
      </div>
    </section>
  );
}
