import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: { q?: string; archived?: string; page?: string };
}

export default async function ClientsPage({ searchParams }: Props) {
  const q = searchParams.q ?? '';
  const includeArchived = searchParams.archived === 'true';
  const page = parseInt(searchParams.page ?? '1', 10);
  const pageSize = 25;

  const where = {
    ...(includeArchived ? {} : { archivedAt: null }),
    ...(q
      ? {
          OR: [
            { firstName: { contains: q, mode: 'insensitive' as const } },
            { lastName: { contains: q, mode: 'insensitive' as const } },
            { codiceFiscale: { contains: q.toUpperCase() } },
            { email: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      include: {
        agents: { include: { agent: { select: { name: true } } } },
        _count: { select: { policies: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    }),
    prisma.client.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clienti</h1>
          <p className="text-sm text-gray-500 mt-1">{total} clienti trovati</p>
        </div>
        <Link href="/clients/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          Nuovo cliente
        </Link>
      </div>

      {/* Search */}
      <form className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Cerca per nome, cognome, codice fiscale..."
            className="input pl-9"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            name="archived"
            value="true"
            defaultChecked={includeArchived}
            className="rounded"
          />
          Mostra archiviati
        </label>
        <button type="submit" className="btn-secondary">Cerca</button>
      </form>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Cliente</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Cod. Fiscale</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Agente</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Polizze</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Creato</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clients.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Nessun cliente trovato
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/clients/${client.id}`}
                      className="font-medium text-blue-600 hover:text-blue-700"
                    >
                      {client.lastName} {client.firstName}
                    </Link>
                    {client.archivedAt && (
                      <span className="ml-2 badge-gray text-xs">archiviato</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{client.codiceFiscale}</td>
                  <td className="px-4 py-3 text-gray-600">{client.email ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {client.agents.map((ca) => ca.agent.name).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge-blue">{client._count.policies}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(client.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Pagina {page} di {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/clients?q=${q}&page=${page - 1}`}
                className="btn-secondary px-3 py-1 text-xs"
              >
                Precedente
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/clients?q=${q}&page=${page + 1}`}
                className="btn-secondary px-3 py-1 text-xs"
              >
                Successiva
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
