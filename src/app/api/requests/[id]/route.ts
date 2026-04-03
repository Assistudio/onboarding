import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ContactRequestStatus } from '@prisma/client';

const updateRequestSchema = z.object({
  status: z.nativeEnum(ContactRequestStatus),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role === 'CLIENT') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dati non validi' }, { status: 400 });
  }

  const request = await prisma.contactRequest.update({
    where: { id: params.id },
    data: { status: parsed.data.status },
  });

  return NextResponse.json(request);
}
