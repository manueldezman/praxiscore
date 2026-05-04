import styles from './Footer.module.css';

const FOOTER_LINKS = {
  product: [
    { label: 'How it Works', href: '#how-it-works' },
    { label: 'Simulate', href: '#simulate' },
    { label: 'App', href: '/app' },
  ],
  privacy: [
    { label: 'Viewing Keys', href: 'https://docs.cloak.ag', target: true },
    { label: 'Cloak Docs', href: 'https://docs.cloak.ag', target: true },
    { label: 'GitHub', href: 'https://github.com', target: true },
  ],
  legal: [
    { label: 'Terms of Service', href: '#terms' },
    { label: 'Privacy Policy', href: '#privacy' },
    { label: 'Cookie Policy', href: '#cookies' },
  ],
};

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.grid}>
          {/* Column 1: Brand */}
          <div className={styles.column}>
            <div className={styles.brand}>
              <span className={styles.name}>PRAXICORE</span>
              <span className={styles.tagline}>Private financial execution on Solana</span>
            </div>
            <div className={styles.badges}>
              <span className={styles.badge}>Built on Solana</span>
              <span className={styles.badge}>Powered by Cloak</span>
            </div>
          </div>

          {/* Column 2: Product */}
          <div className={styles.column}>
            <h4 className={styles.columnHeader}>Product</h4>
            <ul className={styles.linkList}>
              {FOOTER_LINKS.product.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className={styles.link}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Privacy */}
          <div className={styles.column}>
            <h4 className={styles.columnHeader}>Privacy</h4>
            <ul className={styles.linkList}>
              {FOOTER_LINKS.privacy.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className={styles.link}
                    target={link.target ? '_blank' : undefined}
                    rel={link.target ? 'noreferrer' : undefined}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div className={styles.column}>
            <h4 className={styles.columnHeader}>Legal</h4>
            <ul className={styles.linkList}>
              {FOOTER_LINKS.legal.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className={styles.link}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
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
