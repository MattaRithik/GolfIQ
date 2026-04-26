'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import CustomerSidebar from './CustomerSidebar';
import AdminSidebar from './AdminSidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, ready } = useAuth();

  const isLogin = pathname === '/login';
  const isAdmin = pathname.startsWith('/admin');

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">
        Loading...
      </div>
    );
  }

  if (isLogin || !user) {
    return <main className="min-h-screen">{children}</main>;
  }

  if (isAdmin && user.role !== 'admin') {
    return (
      <main className="min-h-screen flex items-center justify-center text-slate-300">
        Redirecting…
      </main>
    );
  }

  const Sidebar = isAdmin ? AdminSidebar : CustomerSidebar;

  return (
    <>
      <Sidebar />
      <main className="ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto p-8">{children}</div>
      </main>
    </>
  );
}
