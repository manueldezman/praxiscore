'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import styles from './Sidebar.module.css';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  businessOnly?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    title: 'Personal',
    items: [
      { label: 'Dashboard', path: '/app', icon: '◉' },
      { label: 'Rules & Automation', path: '/app/rules', icon: '⚡' },
      { label: 'Pay', path: '/app/pay', icon: '💸' },
      { label: 'History', path: '/app/history', icon: '📋' },
    ],
  },
  {
    title: 'Business',
    items: [
      { label: 'Payroll', path: '/app/payroll', icon: '💰', businessOnly: true },
      { label: 'Batch Disbursement', path: '/app/batch', icon: '📦', businessOnly: true },
      { label: 'Teams', path: '/app/teams', icon: '👥', businessOnly: true },
    ],
  },
  {
    title: 'Finance',
    items: [
      { label: 'Tax & Compliance', path: '/app/compliance', icon: '🔒' },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Settings', path: '/app/settings', icon: '⚙️' },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const accountType = (session?.user as any)?.accountType || 'personal';
  const walletAddress = (session?.user as any)?.walletPublicKey || '';

  const truncateAddress = (address: string) => {
    if (!address) return 'Not connected';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
    }
  };

  const isActive = (path: string) => {
    if (path === '/app') {
      return pathname === '/app';
    }
    return pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        className={styles.mobileMenuBtn}
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
      </button>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div className={styles.overlay} onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isMobileOpen ? styles.sidebarOpen : ''}`}>
        {/* Logo */}
        <div className={styles.logo}>
          <h1 className={styles.logoText}>PRAXICORE</h1>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {SECTIONS.map((section) => {
            // Skip business section for personal accounts
            if (section.title === 'Business' && accountType !== 'business') {
              return null;
            }

            return (
              <div key={section.title} className={styles.section}>
                <h3 className={styles.sectionTitle}>{section.title}</h3>
                <ul className={styles.sectionList}>
                  {section.items.map((item) => (
                    <li key={item.path}>
                      <Link
                        href={item.path}
                        className={`${styles.navItem} ${isActive(item.path) ? styles.navItemActive : ''}`}
                        onClick={() => setIsMobileOpen(false)}
                      >
                        <span className={styles.navIcon}>{item.icon}</span>
                        <span className={styles.navLabel}>{item.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* Wallet Info */}
        <div className={styles.walletInfo}>
          <button
            className={styles.walletAddress}
            onClick={copyAddress}
            title="Click to copy"
          >
            <span className={styles.walletLabel}>WALLET ADDRESS:</span>
            <span className={styles.walletValue}>{truncateAddress(walletAddress)}</span>
            <svg className={styles.copyIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
          <div className={styles.networkBadge}>
            <span className={styles.networkDot} />
            <span className={styles.networkText}>DEVNET</span>
          </div>
        </div>
      </aside>
    </>
  );
}
