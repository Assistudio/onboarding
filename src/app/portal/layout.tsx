import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { signOut } from '@/lib/auth';
import { Shield, FileText, MessageSquare, LayoutDashboard, LogOut } from 'lucide-react';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'CLIENT') {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navbar */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900">Assistudio Vigevano</span>
          </div>
          <nav className="hidden sm:flex items-center gap-1">
            <Link href="/portal" className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
              <LayoutDashboard className="w-4 h-4" /> Le mie polizze
            </Link>
            <Link href="/portal/documents" className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
              <FileText className="w-4 h-4" /> Documenti
            </Link>
            <Link href="/portal/requests" className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
              <MessageSquare className="w-4 h-4" /> Richieste
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:block">{session.user.name}</span>
            <form action={async () => { 'use server'; await signOut({ redirectTo: '/login' }); }}>
              <button type="submit" className="btn-secondary px-2 py-1.5 text-xs">
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Esci</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
