import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Phone, Mail, MapPin, FileText, MessageSquare } from 'lucide-react';
import { formatDate, formatCurrency, daysUntilRenewal, policyCategoryLabel, policyStatusLabel } from '@/lib/utils';
import { PolicyStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

const statusColors: Record<PolicyStatus, string> = {
  ACTIVE: 'badge-green',
  EXPIRING: 'badge-yellow',
  RENEWED: 'badge-blue',
  CANCELLED: 'badge-gray',
};

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      agents: { include: { agent: { select: { id: true, name: true, email: true } } } },
      policies: { orderBy: { renewalDate: 'asc' } },
      documents: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' } },
      requests: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  });

  if (!client) notFound();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/clients" className="btn-secondary px-2 py-1.5 mt-1">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {client.lastName} {client.firstName}
            </h1>
            {client.archivedAt && <span className="badge-gray">archiviato</span>}
          </div>
          <p className="text-sm font-mono text-gray-500 mt-1">{client.codiceFiscale}</p>
        </div>
        <Link href={`/clients/${client.id}/edit`} className="btn-secondary">
          Modifica
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Info card */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Informazioni</h2>

          {client.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="w-4 h-4 text-gray-400" />
              <a href={`mailto:${client.email}`} className="hover:text-blue-600">{client.email}</a>
            </div>
          )}
          {client.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4 text-gray-400" />
              <a href={`tel:${client.phone}`} className="hover:text-blue-600">{client.phone}</a>
            </div>
          )}
          {client.address && (
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
              <span>{client.address}</span>
            </div>
          )}

          {client.agents.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Agenti assegnati</p>
              <div className="space-y-1">
                {client.agents.map((ca) => (
                  <div key={ca.agentId} className="text-sm text-gray-700">{ca.agent.name}</div>
                ))}
              </div>
            </div>
          )}

          {client.notes && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Note</p>
              <p className="text-sm text-gray-600">{client.notes}</p>
            </div>
          )}

          <p className="text-xs text-gray-400">Creato il {formatDate(client.createdAt)}</p>
        </div>

        {/* Policies */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">
              Polizze <span className="text-gray-400 font-normal">({client.policies.length})</span>
            </h2>
            <Link href={`/clients/${client.id}/policies/new`} className="btn-primary text-xs px-3 py-1.5">
              + Nuova polizza
            </Link>
          </div>

          {client.policies.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">Nessuna polizza</p>
          ) : (
            <div className="space-y-3">
              {client.policies.map((policy) => {
                const days = daysUntilRenewal(policy.renewalDate);
                return (
                  <div key={policy.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{policy.policyNumber}</span>
                        <span className={statusColors[policy.status]}>{policyStatusLabel(policy.status)}</span>
                        <span className="badge-gray">{policyCategoryLabel(policy.category)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {policy.insuranceCompany} · Scadenza: {formatDate(policy.renewalDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(policy.premiumCents)}</p>
                      {days >= 0 && days <= 30 && (
                        <span className={`text-xs ${days <= 7 ? 'text-red-600' : 'text-yellow-600'}`}>
                          {days} giorni
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Documents */}
      {client.documents.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">
            Documenti <span className="text-gray-400 font-normal">({client.documents.length})</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {client.documents.map((doc) => (
              <a
                key={doc.id}
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
              >
                <FileText className="w-8 h-8 text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{doc.fileName}</p>
                  <p className="text-xs text-gray-400">{doc.docType} · {formatDate(doc.createdAt)}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
