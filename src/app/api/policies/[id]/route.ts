import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PolicyStatus } from '@prisma/client';

const updatePolicySchema = z.object({
  insuranceCompany: z.string().min(1).optional(),
  premiumCents: z.number().int().positive().optional(),
  startDate: z.string().datetime().optional(),
  renewalDate: z.string().datetime().optional(),
  status: z.nativeEnum(PolicyStatus).optional(),
  notes: z.string().optional(),
});

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role === 'CLIENT') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const policy = await prisma.policy.findUnique({
    where: { id: params.id },
    include: {
      client: { select: { id: true, firstName: true, lastName: true } },
      documents: { where: { deletedAt: null } },
    },
  });

  if (!policy) {
    return NextResponse.json({ error: 'Polizza non trovata' }, { status: 404 });
  }

  return NextResponse.json(policy);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role === 'CLIENT') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const policy = await prisma.policy.findUnique({ where: { id: params.id } });
  if (!policy) {
    return NextResponse.json({ error: 'Polizza non trovata' }, { status: 404 });
  }

  if (policy.status === 'CANCELLED') {
    return NextResponse.json({ error: 'Polizza cancellata — sola lettura' }, { status: 400 });
  }

  const body = await req.json();
  const parsed = updatePolicySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dati non validi', issues: parsed.error.issues }, { status: 400 });
  }

  const updated = await prisma.policy.update({
    where: { id: params.id },
    data: {
      ...parsed.data,
      ...(parsed.data.startDate ? { startDate: new Date(parsed.data.startDate) } : {}),
      ...(parsed.data.renewalDate ? { renewalDate: new Date(parsed.data.renewalDate) } : {}),
    },
  });

  return NextResponse.json(updated);
}
