'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import styles from './WalletDisplay.module.css';

export default function WalletDisplay() {
  const { data: session } = useSession();
  const [copied, setCopied] = useState(false);

  const walletPubkey = (session?.user as { walletPublicKey?: string })?.walletPublicKey;

  if (!walletPubkey) {
    return null;
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(walletPubkey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.container}>
      <span className={styles.label}>Your Wallet</span>
      <button
        onClick={handleCopy}
        className={styles.addressBtn}
        title="Click to copy"
      >
        {walletPubkey.slice(0, 8)}...{walletPubkey.slice(-8)}
        {copied && <span className={styles.copied}>Copied!</span>}
      </button>
      <a
        href={`https://solscan.io/account/${walletPubkey}?cluster=devnet`}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.solscanLink}
      >
        View on Solscan
      </a>
    </div>
  );
}
