import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'CLIENT') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const client = await prisma.client.findUnique({
    where: { userId: session.user.id },
  });

  if (!client) {
    return NextResponse.json({ error: 'Profilo cliente non trovato' }, { status: 404 });
  }

  const requests = await prisma.contactRequest.findMany({
    where: { clientId: client.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(requests);
}
