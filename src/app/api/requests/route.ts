import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const createRequestSchema = z.object({
  subject: z.string().min(1).max(200),
  body: z.string().min(1),
  attachmentUrl: z.string().url().optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const page = parseInt(new URL(req.url).searchParams.get('page') ?? '1', 10);
  const pageSize = 25;

  if (session.user.role === 'CLIENT') {
    return NextResponse.redirect(new URL('/api/requests/mine', req.url));
  }

  const [requests, total] = await Promise.all([
    prisma.contactRequest.findMany({
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.contactRequest.count(),
  ]);

  return NextResponse.json({ requests, total, page, pageSize });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'CLIENT') {
    return NextResponse.json({ error: 'Solo i clienti possono inviare richieste' }, { status: 403 });
  }

  const client = await prisma.client.findUnique({
    where: { userId: session.user.id },
  });

  if (!client) {
    return NextResponse.json({ error: 'Profilo cliente non trovato' }, { status: 404 });
  }

  const body = await req.json();
  const parsed = createRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dati non validi', issues: parsed.error.issues }, { status: 400 });
  }

  const request = await prisma.contactRequest.create({
    data: {
      ...parsed.data,
      clientId: client.id,
    },
  });

  // Email notification to assigned agents (non-blocking)
  notifyAgents(client.id, parsed.data.subject).catch(console.error);

  return NextResponse.json(request, { status: 201 });
}

async function notifyAgents(clientId: string, subject: string) {
  const clientAgents = await prisma.clientAgent.findMany({
    where: { clientId },
    include: { agent: { select: { email: true, name: true } } },
  });

  if (clientAgents.length === 0) return;

  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  for (const ca of clientAgents) {
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'noreply@assistudiovigevano.it',
      to: ca.agent.email,
      subject: `Nuova richiesta cliente: ${subject}`,
      html: `<p>Caro ${ca.agent.name},</p><p>Un cliente ha inviato una nuova richiesta: <strong>${subject}</strong>.</p><p>Accedi al portale per visualizzarla.</p>`,
    });
  }
}
