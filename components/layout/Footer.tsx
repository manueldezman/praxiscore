import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        {/* Brand column only */}
        <div className={styles.brand}>
          <span className={styles.name}>PRAXICORE</span>
          <span className={styles.tagline}>Private financial execution on Solana</span>
          <div className={styles.badges}>
            <span className={styles.badge}>Built on Solana</span>
            <span className={styles.badge}>Powered by Cloak</span>
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © 2026 Praxicore. All rights reserved.
          </p>
          <p className={styles.trust}>
            No one sees your income, your rules, or your allocations.
          </p>
        </div>
      </div>
    </footer>
  );
}
