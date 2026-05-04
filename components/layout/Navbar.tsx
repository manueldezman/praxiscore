'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { truncateAddress } from '@/lib/wallet/walletService';
import styles from './Navbar.module.css';

interface NavDropdownProps {
  label: string;
  children: React.ReactNode;
}

function NavDropdown({ label, children }: NavDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={styles.dropdown}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className={styles.dropdownTrigger}>
        {label}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={styles.dropdownArrow}>
          <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {isOpen && <div className={styles.dropdownMenu}>{children}</div>}
    </div>
  );
}

export default function Navbar() {
  const { data: session } = useSession();
  const walletPubkey = (session?.user as { walletPublicKey?: string })?.walletPublicKey;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
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
            <NavDropdown label="How it Works">
              <Link href="/#how-it-works" className={styles.dropdownLink}>Overview</Link>
              <Link href="/#simulate" className={styles.dropdownLink}>Simulate</Link>
              <Link href="/#features" className={styles.dropdownLink}>Features</Link>
            </NavDropdown>

            <Link href="/#features" className={styles.navLink}>Features</Link>

            <NavDropdown label="Privacy">
              <Link href="/#privacy" className={styles.dropdownLink}>Privacy First</Link>
              <a href="https://docs.cloak.ag" target="_blank" rel="noreferrer" className={styles.dropdownLink}>Cloak Docs</a>
              <a href="https://github.com" target="_blank" rel="noreferrer" className={styles.dropdownLink}>GitHub</a>
            </NavDropdown>
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
              <>
                <Link href="/app" className={styles.loginLink}>Log in</Link>
                <button onClick={() => signIn('google')} className={styles.ctaBtn}>
                  Get Started
                </button>
              </>
            )}

            {/* Mobile menu button */}
            <button
              className={styles.mobileMenuBtn}
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className={styles.mobileOverlay} onClick={() => setMobileMenuOpen(false)}>
          <div className={styles.mobileMenu} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.mobileCloseBtn}
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>

            <div className={styles.mobileLinks}>
              <Link href="/#how-it-works" className={styles.mobileLink} onClick={() => setMobileMenuOpen(false)}>
                How it Works
              </Link>
              <Link href="/#features" className={styles.mobileLink} onClick={() => setMobileMenuOpen(false)}>
                Features
              </Link>
              <Link href="/#privacy" className={styles.mobileLink} onClick={() => setMobileMenuOpen(false)}>
                Privacy
              </Link>
              <a href="https://docs.cloak.ag" target="_blank" rel="noreferrer" className={styles.mobileLink}>
                Cloak Docs
              </a>
              <a href="https://github.com" target="_blank" rel="noreferrer" className={styles.mobileLink}>
                GitHub
              </a>
            </div>

            <div className={styles.mobileActions}>
              {session ? (
                <>
                  {walletPubkey && (
                    <span className={styles.mobileWalletAddress}>
                      {truncateAddress(walletPubkey, 4)}
                    </span>
                  )}
                  <Link href="/app" className={styles.mobileCtaBtn} onClick={() => setMobileMenuOpen(false)}>
                    Open App
                  </Link>
                  <button
                    onClick={() => { signOut(); setMobileMenuOpen(false); }}
                    className={styles.mobileSignOutBtn}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/app" className={styles.mobileLink} onClick={() => setMobileMenuOpen(false)}>
                    Log in
                  </Link>
                  <button
                    onClick={() => { signIn('google'); setMobileMenuOpen(false); }}
                    className={styles.mobileCtaBtn}
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
