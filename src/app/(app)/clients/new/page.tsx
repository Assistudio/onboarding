'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    setLoading(false);

    if (!res.ok) {
      const err = await res.json();
      setError(err.error ?? 'Errore durante la creazione del cliente');
      return;
    }

    const client = await res.json();
    router.push(`/clients/${client.id}`);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/clients" className="btn-secondary px-2 py-1.5">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nuovo cliente</h1>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nome *</label>
              <input name="firstName" type="text" required className="input" />
            </div>
            <div>
              <label className="label">Cognome *</label>
              <input name="lastName" type="text" required className="input" />
            </div>
          </div>

          <div>
            <label className="label">Codice Fiscale *</label>
            <input
              name="codiceFiscale"
              type="text"
              required
              minLength={16}
              maxLength={16}
              pattern="[A-Za-z0-9]{16}"
              className="input font-mono"
              placeholder="BNCMRA80A01F205X"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Email</label>
              <input name="email" type="email" className="input" />
            </div>
            <div>
              <label className="label">Telefono</label>
              <input name="phone" type="tel" className="input" placeholder="+39 0382 123456" />
            </div>
          </div>

          <div>
            <label className="label">Indirizzo</label>
            <input name="address" type="text" className="input" />
          </div>

          <div>
            <label className="label">Note</label>
            <textarea name="notes" rows={3} className="input resize-none" />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Salvataggio...' : 'Crea cliente'}
            </button>
            <Link href="/clients" className="btn-secondary">Annulla</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
