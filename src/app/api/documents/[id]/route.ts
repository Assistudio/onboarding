import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const document = await prisma.document.findUnique({
    where: { id: params.id, deletedAt: null },
  });

  if (!document) {
    return NextResponse.json({ error: 'Documento non trovato' }, { status: 404 });
  }

  // CLIENT can only access documents linked to their own profile
  if (session.user.role === 'CLIENT') {
    const client = await prisma.client.findUnique({
      where: { userId: session.user.id },
    });
    if (!client || (document.clientId !== client.id && document.policyId === null)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }
  }

  return NextResponse.json({ url: document.fileUrl, document });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Solo admin possono eliminare documenti' }, { status: 403 });
  }

  const document = await prisma.document.update({
    where: { id: params.id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json(document);
}
