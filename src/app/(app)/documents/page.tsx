import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function DocumentsPage() {
  const documents = await prisma.document.findMany({
    where: { deletedAt: null },
    include: {
      client: { select: { id: true, firstName: true, lastName: true } },
      policy: { select: { policyNumber: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Documenti</h1>
        <p className="text-sm text-gray-500 mt-1">{documents.length} documenti</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-gray-500">
            Nessun documento caricato
          </div>
        ) : (
          documents.map((doc) => (
            <a
              key={doc.id}
              href={doc.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="card flex items-start gap-4 hover:shadow-md transition-shadow group p-4"
            >
              <FileText className="w-10 h-10 text-gray-300 group-hover:text-blue-400 flex-shrink-0 mt-0.5 transition-colors" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{doc.fileName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="badge-gray text-xs">{doc.docType}</span>
                  {doc.mimeType === 'application/pdf' && (
                    <span className="badge-red text-xs">PDF</span>
                  )}
                </div>
                {doc.client && (
                  <p className="text-xs text-gray-500 mt-1">
                    {doc.client.lastName} {doc.client.firstName}
                    {doc.policy && ` · ${doc.policy.policyNumber}`}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(doc.createdAt)}</p>
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
