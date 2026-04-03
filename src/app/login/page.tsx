'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';

type Mode = 'credentials' | 'magic';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [magicSent, setMagicSent] = useState(false);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError('Email o password non corretti.');
    } else {
      router.push('/dashboard');
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await signIn('email', {
      email,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError('Errore nell\'invio del link. Riprova.');
    } else {
      setMagicSent(true);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 shadow-lg mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Assistudio Vigevano</h1>
          <p className="text-sm text-gray-500 mt-1">Gestione Agenzia Assicurativa</p>
        </div>

        <div className="card">
          {/* Tab switcher */}
          <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
            <button
              onClick={() => { setMode('credentials'); setError(''); }}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                mode === 'credentials'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Agente / Admin
            </button>
            <button
              onClick={() => { setMode('magic'); setError(''); }}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                mode === 'magic'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Portale Clienti
            </button>
          </div>

          {mode === 'credentials' ? (
            <form onSubmit={handleCredentials} className="space-y-4">
              <div>
                <label htmlFor="email" className="label">Email</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="mario.rossi@assistudiovigevano.it"
                />
              </div>
              <div>
                <label htmlFor="password" className="label">Password</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                {loading ? 'Accesso in corso...' : 'Accedi'}
              </button>
            </form>
          ) : (
            <>
              {magicSent ? (
                <div className="text-center py-4">
                  <div className="text-4xl mb-3">📧</div>
                  <h3 className="font-medium text-gray-900 mb-1">Link inviato!</h3>
                  <p className="text-sm text-gray-600">
                    Controlla la tua email <strong>{email}</strong> e clicca il link per accedere.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleMagicLink} className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Inserisci la tua email. Ti invieremo un link per accedere al portale clienti.
                  </p>
                  <div>
                    <label htmlFor="magic-email" className="label">Email</label>
                    <input
                      id="magic-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input"
                      placeholder="mario.bianchi@gmail.com"
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>
                  )}

                  <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                    {loading ? 'Invio in corso...' : 'Invia link di accesso'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
