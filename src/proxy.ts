import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const { auth } = NextAuth(authConfig);

export default auth((req: NextRequest & { auth: { user?: { role?: string } } | null }) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Route pubbliche
  const publicPaths = ['/login', '/api/auth'];
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Non autenticato → redirect a login
  if (!session?.user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const role = session.user.role;

  // CLIENT può accedere solo a /portal
  if (role === 'CLIENT' && !pathname.startsWith('/portal')) {
    return NextResponse.redirect(new URL('/portal', req.url));
  }

  // AGENT/ADMIN non possono accedere a /portal
  if ((role === 'ADMIN' || role === 'AGENT') && pathname.startsWith('/portal')) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)'],
};
