import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Credentials from 'next-auth/providers/credentials';
import Email from 'next-auth/providers/email';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import type { Role } from '@/lib/prisma-enums';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';

declare module 'next-auth' {
  interface User {
    role: Role;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
    };
  }
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const resendApiKey = process.env.RESEND_API_KEY;
const magicLinkEnabled = Boolean(resendApiKey && resendApiKey !== 're_...' && !resendApiKey.includes('['));

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    // Email/password for ADMIN and AGENT
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user || !user.passwordHash) return null;
        if (user.role === 'CLIENT') return null; // clients use magic link

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role as Role };
      },
    }),
    ...(magicLinkEnabled
      ? [
          // Magic-link for CLIENT users
          Email({
            server: {
              host: 'smtp.resend.com',
              port: 465,
              auth: {
                user: 'resend',
                pass: resendApiKey,
              },
            },
            from: process.env.EMAIL_FROM ?? 'noreply@assistudiovigevano.it',
          }),
        ]
      : []),
  ],
});
