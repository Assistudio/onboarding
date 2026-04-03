import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import { FileText, Download } from 'lucide-react';

export const dynamic = 'force-dynamic';

const docTypeLabels: Record<string, string> = {
  POLIZZA: 'Polizza',
  CERTIFICATO: 'Certificato',
  FATTURA: 'Fattura',
  SINISTRO: 'Sinistro',
  ALTRO: 'Altro',
};

export default async function PortalDocumentsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'CLIENT') redirect('/login');

  const client = await prisma.client.findUnique({
    where: { userId: session.user.id },
    include: {
      policies: { select: { id: true, policyNumber: true } },
    },
  });

  if (!client) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Profilo cliente non trovato. Contatta l&apos;agenzia.</p>
      </div>
    );
  }

  const policyIds = client.policies.map((p) => p.id);
  const policyMap = Object.fromEntries(client.policies.map((p) => [p.id, p.policyNumber]));

  const documents = await prisma.document.findMany({
    where: {
      deletedAt: null,
      OR: [{ clientId: client.id }, { policyId: { in: policyIds } }],
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">I miei documenti</h1>
        <p className="text-sm text-gray-500 mt-1">{documents.length} documenti disponibili</p>
      </div>

      {documents.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nessun documento disponibile</p>
          <p className="text-sm text-gray-400 mt-1">
            I documenti caricati dal tuo agente appariranno qui
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {documents.map((doc) => (
            <div key={doc.id} className="card flex items-start gap-4 p-4">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{doc.fileName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="badge-gray text-xs">{docTypeLabels[doc.docType] ?? doc.docType}</span>
                  {doc.policyId && (
                    <span className="text-xs text-gray-400">
                      Polizza {policyMap[doc.policyId] ?? doc.policyId}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">{formatDate(doc.createdAt)}</p>
              </div>
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary px-2 py-1.5 flex-shrink-0"
                title="Scarica"
              >
                <Download className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
