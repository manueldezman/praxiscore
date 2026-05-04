'use client';

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { truncateAddress } from '@/lib/wallet/walletService';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { data: session } = useSession();
  const walletPubkey = (session?.user as { walletPublicKey?: string })?.walletPublicKey;

  return (
    <nav className={styles.navbar}>
      <div className={styles.inner}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <svg width="28" height="28" viewBox="0 0 100 60" fill="none" className={styles.logoIcon}>
            <path d="M5 30 C15 15, 30 10, 45 30 C55 45, 70 45, 95 30" stroke="var(--inflow)" strokeWidth="5" strokeLinecap="round" fill="none"/>
            <path d="M5 30 C15 20, 35 18, 50 30 C65 42, 80 42, 95 30" stroke="var(--savings)" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
            <path d="M5 30 C20 38, 40 42, 60 30 C75 20, 85 18, 95 30" stroke="var(--invest)" strokeWidth="3" strokeLinecap="round" fill="none"/>
            <circle cx="5" cy="30" r="4" fill="var(--text-muted)"/>
            <circle cx="95" cy="22" r="3" fill="var(--savings)"/>
            <circle cx="95" cy="30" r="3" fill="var(--inflow)"/>
            <circle cx="95" cy="38" r="3" fill="var(--invest)"/>
          </svg>
          <span className={styles.logoText}>PRAXICORE</span>
        </Link>

        {/* Nav links - hidden on mobile */}
        <div className={styles.navLinks}>
          <Link href="/#how-it-works" className={styles.navLink}>How it works</Link>
          <Link href="/#features" className={styles.navLink}>Features</Link>
          <Link href="/#privacy" className={styles.navLink}>Privacy</Link>
        </div>

        {/* Right side */}
        <div className={styles.navRight}>
          <ThemeToggle />

          {session ? (
            <div className={styles.sessionArea}>
              {walletPubkey && (
                <span className={styles.walletAddress}>
                  {truncateAddress(walletPubkey, 4)}
                </span>
              )}
              <Link href="/app" className={styles.ctaBtn}>Open App</Link>
              <button onClick={() => signOut()} className={styles.signOutBtn}>
                Sign out
              </button>
            </div>
          ) : (
            <button onClick={() => signIn('google')} className={styles.ctaBtn}>
              Get Started
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
