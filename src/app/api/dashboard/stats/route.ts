import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role === 'CLIENT') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [
    totalClients,
    activePolicies,
    expiringPolicies,
    openRequests,
  ] = await Promise.all([
    prisma.client.count({ where: { archivedAt: null } }),
    prisma.policy.count({ where: { status: { in: ['ACTIVE', 'EXPIRING'] } } }),
    prisma.policy.count({
      where: {
        renewalDate: { gte: now, lte: in30Days },
        status: { in: ['ACTIVE', 'EXPIRING'] },
      },
    }),
    prisma.contactRequest.count({
      where: { status: { in: ['RECEIVED', 'IN_PROGRESS'] } },
    }),
  ]);

  return NextResponse.json({
    totalClients,
    activePolicies,
    expiringPolicies,
    openRequests,
  });
}
