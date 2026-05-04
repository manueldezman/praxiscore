import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import type { ResolvedAllocation, CloakExecutionResult } from '../types';

const SOLANA_RPC = process.env.SOLANA_RPC_URL ?? 'https://api.devnet.solana.com';
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

async function getCloakSDK() {
  return await import('@cloak.dev/sdk');
}

export async function executePrivateDisbursement(
  inflowAmountLamports: bigint,
  allocations: ResolvedAllocation[],
  signerKeypair: Keypair,
): Promise<CloakExecutionResult> {
  try {
    const {
      CLOAK_PROGRAM_ID,
      generateUtxoKeypair,
      getNkFromUtxoPrivateKey,
      createUtxo,
      transact,
      partialWithdraw,
      fullWithdraw,
    } = await getCloakSDK();

    const connection = new Connection(SOLANA_RPC, 'confirmed');
    const utxoOwner = await generateUtxoKeypair();
    const nk = getNkFromUtxoPrivateKey(utxoOwner.privateKey);

    const baseOptions = {
      connection,
      programId: CLOAK_PROGRAM_ID,
      depositorKeypair: signerKeypair,
      walletPublicKey: signerKeypair.publicKey,
      chainNoteViewingKeyNk: nk,
    };

    // Shield inflow into Cloak pool
    const depositUtxo = await createUtxo(inflowAmountLamports, utxoOwner);
    const depositResult = await transact(
      {
        inputUtxos: [],
        outputUtxos: [depositUtxo],
        externalAmount: inflowAmountLamports,
        depositor: signerKeypair.publicKey,
      },
      baseOptions,
    );

    const txSignatures: string[] = [depositResult.signature];
    let remainingUtxos = depositResult.outputUtxos ?? [depositUtxo];

    // Disburse to each bucket
    for (const allocation of allocations) {
      const allocationLamports = BigInt(Math.floor(allocation.amount * 1_000_000_000));
      if (allocationLamports <= BigInt(0)) continue;

      const recipientPubkey = allocation.walletAddress
        ? new PublicKey(allocation.walletAddress)
        : signerKeypair.publicKey;

      // Save bucket uses partial withdraw (keeps change shielded)
      if (allocation.bucket === 'save') {
        const result = await partialWithdraw(
          remainingUtxos,
          recipientPubkey,
          allocationLamports,
          baseOptions,
        );
        txSignatures.push(result.signature);
        if (result.outputUtxos?.length) remainingUtxos = result.outputUtxos;
        continue;
      }

      // All other buckets (spend, invest, tax, custom) — full withdraw slice
      const result = await fullWithdraw(remainingUtxos, recipientPubkey, baseOptions);
      txSignatures.push(result.signature);
    }

    return { success: true, txSignatures };
  } catch (error) {
    console.error('[CloakService] Execution failed:', error);
    return {
      success: false,
      txSignatures: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getComplianceReport(nk: Uint8Array): Promise<{
  summary: string;
  transactions: Array<{ txType: string; amount: number; fee: number; netAmount: number }>;
}> {
  try {
    const { CLOAK_PROGRAM_ID, scanTransactions, toComplianceReport } = await getCloakSDK();
    const connection = new Connection(SOLANA_RPC, 'confirmed');

    const scan = await scanTransactions({
      connection,
      programId: CLOAK_PROGRAM_ID,
      viewingKeyNk: nk,
    });

    const report = toComplianceReport(scan);
    return {
      summary: `${scan.transactions.length} private transaction(s) found. Net flow: ${report.transactions.reduce((s, t) => s + t.netAmount, 0).toFixed(4)} SOL`,
      transactions: report.transactions,
    };
  } catch (err) {
    console.error('[CloakService] Compliance scan failed:', err);
    return { summary: 'Compliance data unavailable', transactions: [] };
  }
}

export async function generateWalletViewingKey(signerKeypair: Keypair): Promise<Uint8Array> {
  const { generateUtxoKeypair, getNkFromUtxoPrivateKey } = await getCloakSDK();
  const utxoOwner = await generateUtxoKeypair();
  return getNkFromUtxoPrivateKey(utxoOwner.privateKey);
}
