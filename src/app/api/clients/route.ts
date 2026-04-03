import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const createClientSchema = z.object({
  codiceFiscale: z.string().min(16).max(16).toUpperCase(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role === 'CLIENT') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  const includeArchived = searchParams.get('archived') === 'true';
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const pageSize = 25;

  const where = {
    ...(includeArchived ? {} : { archivedAt: null }),
    ...(q
      ? {
          OR: [
            { firstName: { contains: q, mode: 'insensitive' as const } },
            { lastName: { contains: q, mode: 'insensitive' as const } },
            { codiceFiscale: { contains: q.toUpperCase() } },
            { email: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      include: {
        agents: { include: { agent: { select: { id: true, name: true } } } },
        _count: { select: { policies: true, documents: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    }),
    prisma.client.count({ where }),
  ]);

  return NextResponse.json({ clients, total, page, pageSize });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role === 'CLIENT') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createClientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dati non validi', issues: parsed.error.issues }, { status: 400 });
  }

  const existing = await prisma.client.findUnique({
    where: { codiceFiscale: parsed.data.codiceFiscale },
  });
  if (existing) {
    return NextResponse.json({ error: 'Codice fiscale già presente' }, { status: 409 });
  }

  const client = await prisma.client.create({
    data: {
      ...parsed.data,
      email: parsed.data.email || null,
      agents: {
        create: { agentId: session.user.id },
      },
    },
    include: {
      agents: { include: { agent: { select: { id: true, name: true } } } },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'CREATE',
      entityType: 'Client',
      entityId: client.id,
    },
  });

  logger.info({ clientId: client.id, agentId: session.user.id }, 'client created');

  return NextResponse.json(client, { status: 201 });
}
