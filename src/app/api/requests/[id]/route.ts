import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { contactRequestStatuses } from '@/lib/prisma-enums';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const updateRequestSchema = z.object({
  status: z.enum(contactRequestStatuses),
});

export async function PATCH(req: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user || session.user.role === 'CLIENT') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dati non validi' }, { status: 400 });
  }

  const { id } = await params;
  const request = await prisma.contactRequest.update({
    where: { id },
    data: { status: parsed.data.status },
  });

  return NextResponse.json(request);
}
