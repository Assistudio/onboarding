import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const updateClientSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role === 'CLIENT') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      agents: { include: { agent: { select: { id: true, name: true, email: true } } } },
      policies: { orderBy: { renewalDate: 'asc' } },
      documents: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' } },
      requests: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!client) {
    return NextResponse.json({ error: 'Cliente non trovato' }, { status: 404 });
  }

  return NextResponse.json(client);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role === 'CLIENT') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const body = await req.json();

  // Handle archive/unarchive
  if ('archived' in body) {
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo gli admin possono archiviare' }, { status: 403 });
    }
    const client = await prisma.client.update({
      where: { id: params.id },
      data: { archivedAt: body.archived ? new Date() : null },
    });
    return NextResponse.json(client);
  }

  const parsed = updateClientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dati non validi', issues: parsed.error.issues }, { status: 400 });
  }

  const client = await prisma.client.update({
    where: { id: params.id },
    data: { ...parsed.data, email: parsed.data.email || null },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'UPDATE',
      entityType: 'Client',
      entityId: client.id,
    },
  });

  return NextResponse.json(client);
}
