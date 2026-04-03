'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Qualcosa è andato storto</h1>
        <p className="text-sm text-gray-500 mb-6">
          Si è verificato un errore imprevisto. Il problema è stato segnalato automaticamente.
        </p>
        {error.digest && (
          <p className="text-xs font-mono text-gray-400 mb-4">ID: {error.digest}</p>
        )}
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="btn-primary">
            Riprova
          </button>
          <Link href="/" className="btn-secondary">
            Torna alla home
          </Link>
        </div>
      </div>
    </div>
  );
}
