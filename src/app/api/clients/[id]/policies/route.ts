import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PolicyCategory } from '@prisma/client';

const createPolicySchema = z.object({
  policyNumber: z.string().min(1),
  insuranceCompany: z.string().min(1),
  category: z.nativeEnum(PolicyCategory),
  premiumCents: z.number().int().positive(),
  startDate: z.string().datetime(),
  renewalDate: z.string().datetime(),
  notes: z.string().optional(),
});

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role === 'CLIENT') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const policies = await prisma.policy.findMany({
    where: { clientId: params.id },
    orderBy: { renewalDate: 'asc' },
  });

  return NextResponse.json(policies);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role === 'CLIENT') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const client = await prisma.client.findUnique({ where: { id: params.id } });
  if (!client) {
    return NextResponse.json({ error: 'Cliente non trovato' }, { status: 404 });
  }

  const body = await req.json();
  const parsed = createPolicySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dati non validi', issues: parsed.error.issues }, { status: 400 });
  }

  const policy = await prisma.policy.create({
    data: {
      ...parsed.data,
      startDate: new Date(parsed.data.startDate),
      renewalDate: new Date(parsed.data.renewalDate),
      clientId: params.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'CREATE',
      entityType: 'Policy',
      entityId: policy.id,
      meta: { clientId: params.id },
    },
  });

  return NextResponse.json(policy, { status: 201 });
}
