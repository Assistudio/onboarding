import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(req: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const { id } = await params;
  const document = await prisma.document.findUnique({
    where: { id, deletedAt: null },
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

export async function DELETE(req: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Solo admin possono eliminare documenti' }, { status: 403 });
  }

  const { id } = await params;
  const document = await prisma.document.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json(document);
}
