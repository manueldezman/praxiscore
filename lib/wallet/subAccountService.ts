import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

/**
 * Get SOL balance for a public key
 */
export async function getBalance(publicKey: string): Promise<number> {
  try {
    const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com');
    const pubKey = new PublicKey(publicKey);
    const balance = await connection.getBalance(pubKey);
    return balance;
  } catch (error) {
    console.error('[SubAccountService] Failed to get balance:', error);
    return 0;
  }
}

/**
 * Get token balance for a specific mint
 */
export async function getTokenBalance(
  publicKey: string,
  mintAddress: string
): Promise<number> {
  try {
    const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com');
    const pubKey = new PublicKey(publicKey);
    const mintPubKey = new PublicKey(mintAddress);

    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubKey, {
      mint: mintPubKey,
    });

    if (tokenAccounts.value.length === 0) {
      return 0;
    }

    const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.amount;
    return Number(balance);
  } catch (error) {
    console.error('[SubAccountService] Failed to get token balance:', error);
    return 0;
  }
}

/**
 * Get all token balances for a wallet
 */
export async function getAllTokenBalances(publicKey: string): Promise<Record<string, number>> {
  try {
    const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com');
    const pubKey = new PublicKey(publicKey);

    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubKey);

    const balances: Record<string, number> = {};

    for (const account of tokenAccounts.value) {
      const mint = account.account.data.parsed.info.mint;
      const amount = account.account.data.parsed.info.tokenAmount.amount;
      balances[mint] = Number(amount);
    }

    return balances;
  } catch (error) {
    console.error('[SubAccountService] Failed to get all token balances:', error);
    return {};
  }
}
