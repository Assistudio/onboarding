'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send } from 'lucide-react';

export default function NewRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = {
      subject: formData.get('subject') as string,
      body: formData.get('body') as string,
    };

    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    setLoading(false);

    if (!res.ok) {
      const err = await res.json();
      setError(err.error ?? 'Errore durante l\'invio della richiesta');
      return;
    }

    router.push('/portal/requests');
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/portal/requests" className="btn-secondary px-2 py-1.5">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nuova richiesta</h1>
      </div>

      <div className="card">
        <p className="text-sm text-gray-600 mb-5">
          Usa questo modulo per contattare il tuo agente per segnalazioni, sinistri, cambi di dati
          o qualsiasi altra necessità.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="subject" className="label">
              Oggetto *
            </label>
            <input
              id="subject"
              name="subject"
              type="text"
              required
              maxLength={200}
              className="input"
              placeholder="es. Segnalazione sinistro auto, Aggiornamento indirizzo..."
            />
          </div>

          <div>
            <label htmlFor="body" className="label">
              Descrizione *
            </label>
            <textarea
              id="body"
              name="body"
              required
              rows={6}
              className="input resize-y"
              placeholder="Descrivi la tua richiesta nel dettaglio..."
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="btn-primary">
              <Send className="w-4 h-4" />
              {loading ? 'Invio in corso...' : 'Invia richiesta'}
            </button>
            <Link href="/portal/requests" className="btn-secondary">
              Annulla
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
