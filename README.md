# Praxicore — Private Financial Execution Engine

> "Your money behaves the way you planned — automatically and privately."

## The Problem

Remote workers and contractors paid in crypto face a painful manual loop: receive funds, manually split to savings, pay tax reserves, buy target assets. Every transfer is permanently public on-chain — salaries get indexed, spending patterns get parsed.

**Praxicore closes this gap.** Define rules once in plain language. Every incoming payment is automatically split and privately routed to Spend, Save, Invest, and Tax buckets — the moment funds arrive — with zero public trail.

## How Cloak SDK Is Used

Privacy is **load-bearing** in Praxicore. Without Cloak the product doesn't work — every split would be publicly visible on-chain.

### Three capabilities integrated (deep, not shallow)

**1. Private Transfers** — Every disbursement runs through `transact()`. Inflow is shielded into the Cloak UTXO pool first, then fanned out. Amounts and destinations are hidden on-chain.

**2. Batch Disbursement Pattern** — `partialWithdraw()` for the Save bucket (keeps change shielded), `fullWithdraw()` for Spend, Tax, Invest, and custom buckets. Complete private payroll fan-out from one shielded pool.

**3. Viewing Keys for Compliance** — `generateUtxoKeypair()` + `getNkFromUtxoPrivateKey()` derive `nk` per user. `scanTransactions()` + `toComplianceReport()` produce structured audit histories. Users share `nk` with accountants — the public ledger shows nothing.

## Setup

```bash
git clone <repo>
cd praxicore
npm install
cp .env.example .env.local
# Fill in .env.local (see .env.example)
npm run dev
```

## Environment Variables

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<openssl rand -base64 32>
GOOGLE_CLIENT_ID=<Google Cloud Console>
GOOGLE_CLIENT_SECRET=<Google Cloud Console>
WALLET_ENCRYPTION_KEY=<exactly 32 characters>
SOLANA_RPC_URL=https://api.devnet.solana.com
NVIDIA_API_KEY=<optional — GLM 4.7 parser fallback>
```

## Bucket System

| Bucket | Color  | Token | Purpose                  |
|--------|--------|-------|--------------------------|
| SPEND  | Amber  | USDC  | Day-to-day expenses      |
| SAVE   | Green  | USDC  | Emergency fund / savings |
| INVEST | Purple | SOL   | Auto-buy target asset    |
| TAX    | Blue   | USDC  | Automatic tax reserve    |
| Custom | Dynamic| USDC  | User-defined buckets     |

## Tech Stack

- Next.js 14, TypeScript, Framer Motion, Zustand, TailwindCSS
- NextAuth.js (Google OAuth), @solana/web3.js
- @cloak.dev/sdk — transact, partialWithdraw, fullWithdraw, scanTransactions, viewingKeys
- GLM 4.7 via NVIDIA NIM with deterministic regex fallback parser
