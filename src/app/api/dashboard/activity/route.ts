import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role === 'CLIENT') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const logs = await prisma.auditLog.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true } },
    },
  });

  return NextResponse.json(logs);
}
