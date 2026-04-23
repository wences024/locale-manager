import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { readDb } from '@/lib/db';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

// Forza rendering dinamico — legge dal db ad ogni richiesta, mai dalla cache
export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Se non ci sono utenti → primo avvio, vai al setup
  const db = readDb();
  if (db.users.length === 0) redirect('/setup');

  const user = await getSession();
  if (!user) redirect('/login');

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
