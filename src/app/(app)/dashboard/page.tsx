import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Users, FileText, Clock, MessageSquare, Plus, ArrowRight } from 'lucide-react';
import { formatDate, formatCurrency, daysUntilRenewal } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function getStats() {
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [totalClients, activePolicies, expiringPolicies, openRequests] =
    await Promise.all([
      prisma.client.count({ where: { archivedAt: null } }),
      prisma.policy.count({ where: { status: { in: ['ACTIVE', 'EXPIRING'] } } }),
      prisma.policy.count({
        where: {
          renewalDate: { gte: now, lte: in30Days },
          status: { in: ['ACTIVE', 'EXPIRING'] },
        },
      }),
      prisma.contactRequest.count({
        where: { status: { in: ['RECEIVED', 'IN_PROGRESS'] } },
      }),
    ]);

  return { totalClients, activePolicies, expiringPolicies, openRequests };
}

async function getExpiringPolicies() {
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return prisma.policy.findMany({
    where: {
      renewalDate: { gte: now, lte: in30Days },
      status: { in: ['ACTIVE', 'EXPIRING'] },
    },
    include: {
      client: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { renewalDate: 'asc' },
    take: 8,
  });
}

async function getRecentActivity() {
  return prisma.auditLog.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true } } },
  });
}

function actionLabel(action: string, entityType: string): string {
  const verbs: Record<string, string> = { CREATE: 'ha creato', UPDATE: 'ha aggiornato', DELETE: 'ha eliminato' };
  const entities: Record<string, string> = { Client: 'un cliente', Policy: 'una polizza', Document: 'un documento', ContactRequest: 'una richiesta' };
  return `${verbs[action] ?? action} ${entities[entityType] ?? entityType}`;
}

export default async function DashboardPage() {
  const session = await auth();
  const [stats, expiringPolicies, activity] = await Promise.all([
    getStats(),
    getExpiringPolicies(),
    getRecentActivity(),
  ]);

  const statCards = [
    { label: 'Clienti attivi', value: stats.totalClients, icon: Users, color: 'bg-blue-50 text-blue-600', href: '/clients' },
    { label: 'Polizze attive', value: stats.activePolicies, icon: FileText, color: 'bg-green-50 text-green-600', href: '/policies' },
    { label: 'In scadenza (30gg)', value: stats.expiringPolicies, icon: Clock, color: 'bg-yellow-50 text-yellow-600', href: '/policies?expiring=30' },
    { label: 'Richieste aperte', value: stats.openRequests, icon: MessageSquare, color: 'bg-purple-50 text-purple-600', href: '/requests' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Benvenuto, {session?.user?.name}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/clients/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            Nuovo cliente
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href} className="card hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Expiring policies */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Polizze in scadenza (30 gg)</h2>
            <Link href="/policies?expiring=30" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Vedi tutte <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {expiringPolicies.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">Nessuna polizza in scadenza</p>
          ) : (
            <div className="space-y-3">
              {expiringPolicies.map((policy) => {
                const days = daysUntilRenewal(policy.renewalDate);
                return (
                  <div key={policy.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {policy.client.firstName} {policy.client.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{policy.policyNumber} · {policy.insuranceCompany}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${days <= 7 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {days} gg
                      </span>
                      <p className="text-xs text-gray-400 mt-0.5">{formatCurrency(policy.premiumCents)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Attività recente</h2>
          {activity.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">Nessuna attività recente</p>
          ) : (
            <div className="space-y-3">
              {activity.map((log) => (
                <div key={log.id} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600 flex-shrink-0">
                    {log.user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">{log.user.name}</span>{' '}
                      {actionLabel(log.action, log.entityType)}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(log.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
