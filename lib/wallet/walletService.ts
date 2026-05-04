import { Keypair } from '@solana/web3.js';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY ?? 'praxicore-dev-key-32-bytes-long!!';

// ─── AES-256 encryption ───────────────────────────────────────────────────────

function encrypt(data: string): string {
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '!').slice(0, 32));
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(data: string): string {
  const [ivHex, encryptedHex] = data.split(':');
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '!').slice(0, 32));
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

// ─── Wallet generation ────────────────────────────────────────────────────────

export interface GeneratedWallet {
  publicKey: string;
  encryptedSecretKey: string; // AES-256 encrypted, store server-side only
}

export function generateWallet(): GeneratedWallet {
  const keypair = Keypair.generate();
  const secretKeyArray = Array.from(keypair.secretKey);
  const encryptedSecretKey = encrypt(JSON.stringify(secretKeyArray));

  return {
    publicKey: keypair.publicKey.toBase58(),
    encryptedSecretKey,
  };
}

export function recoverKeypair(encryptedSecretKey: string): Keypair {
  const decrypted = decrypt(encryptedSecretKey);
  const secretKeyArray = JSON.parse(decrypted) as number[];
  return Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));
}

// ─── Display helpers ──────────────────────────────────────────────────────────

export function truncateAddress(address: string, chars = 4): string {
  if (!address || address.length < chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
