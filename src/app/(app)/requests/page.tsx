import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { formatDate, contactRequestStatusLabel } from '@/lib/utils';
import { ContactRequestStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

const statusColors: Record<ContactRequestStatus, string> = {
  RECEIVED: 'badge-yellow',
  IN_PROGRESS: 'badge-blue',
  CLOSED: 'badge-gray',
};

export default async function RequestsPage() {
  const requests = await prisma.contactRequest.findMany({
    include: {
      client: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Richieste clienti</h1>
        <p className="text-sm text-gray-500 mt-1">{requests.length} richieste</p>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Cliente</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Oggetto</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Stato</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">Nessuna richiesta</td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/clients/${req.client.id}`} className="text-blue-600 hover:text-blue-700">
                      {req.client.lastName} {req.client.firstName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{req.subject}</p>
                    <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{req.body}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={statusColors[req.status]}>{contactRequestStatusLabel(req.status)}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(req.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
