import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { formatDate, formatCurrency, daysUntilRenewal, policyCategoryLabel, policyStatusLabel } from '@/lib/utils';
import { PolicyStatus, PolicyCategory } from '@prisma/client';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: { category?: string; status?: string; expiring?: string; page?: string };
}

const statusColors: Record<PolicyStatus, string> = {
  ACTIVE: 'badge-green',
  EXPIRING: 'badge-yellow',
  RENEWED: 'badge-blue',
  CANCELLED: 'badge-gray',
};

export default async function PoliciesPage({ searchParams }: Props) {
  const page = parseInt(searchParams.page ?? '1', 10);
  const pageSize = 25;
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const where = {
    client: { archivedAt: null },
    ...(searchParams.expiring
      ? {
          renewalDate: { gte: now, lte: in30Days },
          status: { in: ['ACTIVE', 'EXPIRING'] as PolicyStatus[] },
        }
      : {}),
    ...(searchParams.category ? { category: searchParams.category as PolicyCategory } : {}),
    ...(searchParams.status ? { status: searchParams.status as PolicyStatus } : {}),
  };

  const [policies, total] = await Promise.all([
    prisma.policy.findMany({
      where,
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { renewalDate: 'asc' },
    }),
    prisma.policy.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);
  const isExpiringFilter = !!searchParams.expiring;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Polizze</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} polizze{isExpiringFilter ? ' in scadenza nei prossimi 30 giorni' : ''}
          </p>
        </div>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-3">
        <select name="status" defaultValue={searchParams.status ?? ''} className="input w-auto">
          <option value="">Tutti gli stati</option>
          {(['ACTIVE', 'EXPIRING', 'RENEWED', 'CANCELLED'] as PolicyStatus[]).map((s) => (
            <option key={s} value={s}>{policyStatusLabel(s)}</option>
          ))}
        </select>
        <select name="category" defaultValue={searchParams.category ?? ''} className="input w-auto">
          <option value="">Tutte le categorie</option>
          {(Object.values(PolicyCategory)).map((c) => (
            <option key={c} value={c}>{policyCategoryLabel(c)}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" name="expiring" value="30" defaultChecked={isExpiringFilter} className="rounded" />
          Solo in scadenza (30 gg)
        </label>
        <button type="submit" className="btn-secondary">Filtra</button>
        <Link href="/policies" className="btn-secondary">Reset</Link>
      </form>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Polizza</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Cliente</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Categoria</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Stato</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Scadenza</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Premio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {policies.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">Nessuna polizza trovata</td>
              </tr>
            ) : (
              policies.map((policy) => {
                const days = daysUntilRenewal(policy.renewalDate);
                return (
                  <tr key={policy.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{policy.policyNumber}</p>
                      <p className="text-xs text-gray-400">{policy.insuranceCompany}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/clients/${policy.client.id}`} className="text-blue-600 hover:text-blue-700">
                        {policy.client.lastName} {policy.client.firstName}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge-blue">{policyCategoryLabel(policy.category)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={statusColors[policy.status]}>{policyStatusLabel(policy.status)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900">{formatDate(policy.renewalDate)}</p>
                      {days >= 0 && days <= 30 && (
                        <p className={`text-xs font-medium ${days <= 7 ? 'text-red-600' : 'text-yellow-600'}`}>
                          {days} giorni
                        </p>
                      )}
                      {days < 0 && <p className="text-xs text-red-600">Scaduta</p>}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatCurrency(policy.premiumCents)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Pagina {page} di {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/policies?page=${page - 1}`} className="btn-secondary px-3 py-1 text-xs">Precedente</Link>
            )}
            {page < totalPages && (
              <Link href={`/policies?page=${page + 1}`} className="btn-secondary px-3 py-1 text-xs">Successiva</Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
