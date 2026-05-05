import NextAuth, { type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { generateWallet } from '@/lib/wallet/walletService';
import { supabaseAdmin } from '@/lib/db/supabase';
import { Connection, PublicKey } from '@solana/web3.js';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      try {
        // Ensure user exists in Supabase
        const { data: existingUser, error: userError } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single();

        if (userError && userError.code === 'PGRST116') {
          // User doesn't exist, create them
          const { error: insertError } = await supabaseAdmin
            .from('users')
            .insert({
              id: user.id,
              email: user.email ?? '',
              name: user.name ?? '',
              image: user.image ?? '',
            });

          if (insertError) {
            console.error('[Auth] Failed to create user:', insertError);
            return false;
          }
        }

        // Check if wallet exists
        const { data: existingWallet, error: walletError } = await supabaseAdmin
          .from('wallets')
          .select('public_key')
          .eq('user_id', user.id)
          .single();

        if (walletError && walletError.code === 'PGRST116') {
          // Wallet doesn't exist, generate one
          const wallet = generateWallet();

          // Encrypt and store wallet
          const { error: insertWalletError } = await supabaseAdmin
            .from('wallets')
            .insert({
              user_id: user.id,
              public_key: wallet.publicKey,
              encrypted_secret_key: wallet.encryptedSecretKey,
            });

          if (insertWalletError) {
            console.error('[Auth] Failed to create wallet:', insertWalletError);
            return false;
          }

          console.log(`[Auth] Generated wallet for ${user.id}: ${wallet.publicKey}`);

          // Airdrop 2 SOL on devnet
          if (process.env.SOLANA_RPC_URL?.includes('devnet')) {
            try {
              const connection = new Connection(process.env.SOLANA_RPC_URL);
              const publicKey = new PublicKey(wallet.publicKey);
              const signature = await connection.requestAirdrop(publicKey, 2 * 1e9); // 2 SOL
              await connection.confirmTransaction(signature);
              console.log(`[Auth] Airdropped 2 SOL to ${wallet.publicKey}`);
            } catch (airdropError) {
              console.error('[Auth] Airdrop failed:', airdropError);
              // Don't fail auth if airdrop fails
            }
          }
        }

        return true;
      } catch (error) {
        console.error('[Auth] signIn error:', error);
        return false;
      }
    },

    async jwt({ token, user }) {
      if (user?.id) {
        const { data: wallet } = await supabaseAdmin
          .from('wallets')
          .select('public_key')
          .eq('user_id', user.id)
          .single();

        if (wallet) {
          token.walletPublicKey = wallet.public_key;
          token.userId = user.id;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token.walletPublicKey) {
        (session.user as { walletPublicKey?: string }).walletPublicKey = token.walletPublicKey as string;
        (session.user as { userId?: string }).userId = token.userId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET ?? 'praxicore-dev-secret',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
