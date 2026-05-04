import styles from './StatsBar.module.css';

const STATS = [
  { value: '< 2s', label: 'Execution time per paycheck' },
  { value: '100%', label: 'Amounts hidden on-chain' },
  { value: '4+', label: 'Bucket types supported' },
];

export default function StatsBar() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {STATS.map((stat) => (
          <div key={stat.label} className={styles.stat}>
            <span className={styles.value}>{stat.value}</span>
            <span className={styles.label}>{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
