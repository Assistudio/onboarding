import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { formatDate, contactRequestStatusLabel } from '@/lib/utils';
import { type ContactRequestStatus } from '@/lib/prisma-enums';
import { Plus, MessageSquare } from 'lucide-react';

export const dynamic = 'force-dynamic';

const statusColors: Record<ContactRequestStatus, string> = {
  RECEIVED: 'badge-yellow',
  IN_PROGRESS: 'badge-blue',
  CLOSED: 'badge-gray',
};

export default async function PortalRequestsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'CLIENT') redirect('/login');

  const client = await prisma.client.findUnique({
    where: { userId: session.user.id },
  });

  if (!client) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Profilo cliente non trovato. Contatta l&apos;agenzia.</p>
      </div>
    );
  }

  const requests = await prisma.contactRequest.findMany({
    where: { clientId: client.id },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Le mie richieste</h1>
          <p className="text-sm text-gray-500 mt-1">{requests.length} richieste totali</p>
        </div>
        <Link href="/portal/requests/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          Nuova richiesta
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="card text-center py-12">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nessuna richiesta inviata</p>
          <p className="text-sm text-gray-400 mt-1">
            Usa il pulsante qui sopra per inviare una nuova richiesta
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{req.subject}</p>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{req.body}</p>
                  <p className="text-xs text-gray-400 mt-2">{formatDate(req.createdAt)}</p>
                </div>
                <span className={`${statusColors[req.status]} flex-shrink-0`}>
                  {contactRequestStatusLabel(req.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
