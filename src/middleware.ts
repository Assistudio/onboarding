import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default auth((req: NextRequest & { auth: { user?: { role?: string } } | null }) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Public routes
  const publicPaths = ['/login', '/api/auth'];
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Not authenticated → redirect to login
  if (!session?.user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const role = session.user.role;

  // CLIENT role can only access /portal
  if (role === 'CLIENT' && !pathname.startsWith('/portal')) {
    return NextResponse.redirect(new URL('/portal', req.url));
  }

  // AGENT/ADMIN cannot access /portal
  if ((role === 'ADMIN' || role === 'AGENT') && pathname.startsWith('/portal')) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)'],
};
