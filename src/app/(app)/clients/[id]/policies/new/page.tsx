'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const categories = [
  { value: 'AUTO', label: 'Auto' },
  { value: 'CASA', label: 'Casa' },
  { value: 'VITA', label: 'Vita' },
  { value: 'SALUTE', label: 'Salute' },
  { value: 'INFORTUNI', label: 'Infortuni' },
  { value: 'IMPRESA', label: 'Impresa' },
  { value: 'TUTELA_LEGALE', label: 'Tutela Legale' },
  { value: 'VIAGGIO', label: 'Viaggio' },
  { value: 'ALTRO', label: 'Altro' },
];

export default function NewPolicyPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const premiumEur = parseFloat(formData.get('premiumEur') as string);

    const data = {
      policyNumber: formData.get('policyNumber'),
      insuranceCompany: formData.get('insuranceCompany'),
      category: formData.get('category'),
      premiumCents: Math.round(premiumEur * 100),
      startDate: new Date(formData.get('startDate') as string).toISOString(),
      renewalDate: new Date(formData.get('renewalDate') as string).toISOString(),
      notes: formData.get('notes') || undefined,
    };

    const res = await fetch(`/api/clients/${clientId}/policies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    setLoading(false);

    if (!res.ok) {
      const err = await res.json();
      setError(err.error ?? 'Errore durante la creazione della polizza');
      return;
    }

    router.push(`/clients/${clientId}`);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/clients/${clientId}`} className="btn-secondary px-2 py-1.5">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nuova polizza</h1>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Numero polizza *</label>
              <input name="policyNumber" type="text" required className="input" placeholder="AXA-2024-001234" />
            </div>
            <div>
              <label className="label">Compagnia *</label>
              <input name="insuranceCompany" type="text" required className="input" placeholder="AXA Assicurazioni" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Categoria *</label>
              <select name="category" required className="input">
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Premio annuo (€) *</label>
              <input name="premiumEur" type="number" min="0" step="0.01" required className="input" placeholder="895.00" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Data decorrenza *</label>
              <input name="startDate" type="date" required className="input" />
            </div>
            <div>
              <label className="label">Data scadenza *</label>
              <input name="renewalDate" type="date" required className="input" />
            </div>
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
              {loading ? 'Salvataggio...' : 'Crea polizza'}
            </button>
            <Link href={`/clients/${clientId}`} className="btn-secondary">Annulla</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
