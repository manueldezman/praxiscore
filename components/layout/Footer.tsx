import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.name}>PRAXICORE</span>
          <span className={styles.tagline}>Private financial execution on Solana</span>
        </div>
        <div className={styles.links}>
          <a href="https://docs.cloak.ag" target="_blank" rel="noreferrer" className={styles.link}>
            Powered by Cloak
          </a>
          <span className={styles.divider}>·</span>
          <a href="https://solana.com" target="_blank" rel="noreferrer" className={styles.link}>
            Built on Solana
          </a>
        </div>
        <p className={styles.trust}>
          No one sees your income, your rules, or your allocations.
        </p>
      </div>
    </footer>
  );
}
