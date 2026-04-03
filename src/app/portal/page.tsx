import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { formatDate, formatCurrency, daysUntilRenewal, policyCategoryLabel, policyStatusLabel } from '@/lib/utils';
import { PolicyStatus } from '@prisma/client';
import { FileText, MessageSquare, Clock, Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

const statusColors: Record<PolicyStatus, string> = {
  ACTIVE: 'badge-green',
  EXPIRING: 'badge-yellow',
  RENEWED: 'badge-blue',
  CANCELLED: 'badge-gray',
};

export default async function PortalPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'CLIENT') redirect('/login');

  const client = await prisma.client.findUnique({
    where: { userId: session.user.id },
    include: {
      policies: { orderBy: { renewalDate: 'asc' } },
      requests: { orderBy: { createdAt: 'desc' }, take: 3 },
    },
  });

  if (!client) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Profilo cliente non trovato. Contatta l&apos;agenzia.</p>
      </div>
    );
  }

  const activePolicies = client.policies.filter((p) => p.status !== 'CANCELLED');
  const expiringPolicies = activePolicies.filter((p) => {
    const days = daysUntilRenewal(p.renewalDate);
    return days >= 0 && days <= 30;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Benvenuto, {client.firstName}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Ecco un riepilogo delle tue polizze e richieste
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mx-auto mb-2">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{activePolicies.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Polizze attive</p>
        </div>
        <div className="card text-center">
          <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center mx-auto mb-2">
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{expiringPolicies.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">In scadenza (30 gg)</p>
        </div>
        <div className="card text-center">
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center mx-auto mb-2">
            <MessageSquare className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{client.requests.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Richieste recenti</p>
        </div>
      </div>

      {/* Policies list */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Le mie polizze</h2>
        {activePolicies.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">Nessuna polizza attiva</p>
        ) : (
          <div className="space-y-3">
            {activePolicies.map((policy) => {
              const days = daysUntilRenewal(policy.renewalDate);
              return (
                <div
                  key={policy.id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {policyCategoryLabel(policy.category)} — {policy.insuranceCompany}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {policy.policyNumber} · scade il {formatDate(policy.renewalDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {days >= 0 && days <= 30 && (
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          days <= 7 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {days} gg
                      </span>
                    )}
                    <span className={statusColors[policy.status]}>
                      {policyStatusLabel(policy.status)}
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      {formatCurrency(policy.premiumCents)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent requests */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Ultime richieste</h2>
          <Link
            href="/portal/requests/new"
            className="btn-primary text-xs px-3 py-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Nuova richiesta
          </Link>
        </div>
        {client.requests.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">Nessuna richiesta</p>
        ) : (
          <div className="space-y-3">
            {client.requests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{req.subject}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(req.createdAt)}</p>
                </div>
                <span
                  className={
                    req.status === 'RECEIVED'
                      ? 'badge-yellow'
                      : req.status === 'IN_PROGRESS'
                        ? 'badge-blue'
                        : 'badge-gray'
                  }
                >
                  {req.status === 'RECEIVED'
                    ? 'Ricevuta'
                    : req.status === 'IN_PROGRESS'
                      ? 'In lavorazione'
                      : 'Chiusa'}
                </span>
              </div>
            ))}
          </div>
        )}
        <Link href="/portal/requests" className="text-sm text-blue-600 hover:text-blue-700 mt-3 inline-block">
          Vedi tutte →
        </Link>
      </div>
    </div>
  );
}
