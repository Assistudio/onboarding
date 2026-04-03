import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role === 'CLIENT') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const expiring = searchParams.get('expiring');
  const category = searchParams.get('category');
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const pageSize = 25;

  const now = new Date();

  const where = {
    client: { archivedAt: null },
    ...(expiring
      ? {
          renewalDate: {
            gte: now,
            lte: new Date(now.getTime() + parseInt(expiring, 10) * 24 * 60 * 60 * 1000),
          },
          status: { in: ['ACTIVE', 'EXPIRING'] as const },
        }
      : {}),
    ...(category ? { category: category as any } : {}),
    ...(status ? { status: status as any } : {}),
  };

  const [policies, total] = await Promise.all([
    prisma.policy.findMany({
      where,
      include: {
        client: { select: { id: true, firstName: true, lastName: true, codiceFiscale: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { renewalDate: 'asc' },
    }),
    prisma.policy.count({ where }),
  ]);

  return NextResponse.json({ policies, total, page, pageSize });
}
