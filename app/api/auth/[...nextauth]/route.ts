import NextAuth, { type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { generateWallet } from '@/lib/wallet/walletService';

// In-memory wallet store for demo (replace with DB in production)
const walletStore = new Map<string, { publicKey: string; encryptedSecretKey: string }>();

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Generate wallet on first sign-in
      if (user.id && !walletStore.has(user.id)) {
        const wallet = generateWallet();
        walletStore.set(user.id, wallet);
        console.log(`[Auth] Generated wallet for ${user.id}: ${wallet.publicKey}`);
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user?.id) {
        const wallet = walletStore.get(user.id);
        if (wallet) {
          token.walletPublicKey = wallet.publicKey;
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

// Export wallet store accessor for API routes
export function getWalletForUser(userId: string) {
  return walletStore.get(userId);
}

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
