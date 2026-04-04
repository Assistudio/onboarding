import type { NextAuthConfig } from 'next-auth';

// In sviluppo lasciamo che Auth.js inferisca host/origin dalla request reale.
// Questo evita mismatch tra NEXTAUTH_URL e l'host effettivo usato nel browser
// quando il sito viene aperto via localhost, IP LAN o dominio locale diverso.
if (process.env.NODE_ENV !== 'production') {
  delete process.env.AUTH_URL;
  delete process.env.NEXTAUTH_URL;
}

// Edge-safe auth config: no Prisma, no bcrypt, no Node.js-only modules.
// Used by proxy.ts (middleware) which runs in the Edge Runtime.
export const authConfig = {
  trustHost: true,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: { strategy: 'jwt' as const, maxAge: 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
