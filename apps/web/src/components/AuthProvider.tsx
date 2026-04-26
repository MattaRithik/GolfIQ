'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getSession, login as doLogin, logout as doLogout, type User } from '@/lib/auth';

interface AuthContextValue {
  user: User | null;
  ready: boolean;
  login: (id: string, password: string) => User | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const PUBLIC_ROUTES = new Set(['/login']);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setUser(getSession());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const isPublic = PUBLIC_ROUTES.has(pathname);
    if (!user && !isPublic) {
      router.replace('/login');
      return;
    }
    if (user && pathname.startsWith('/admin') && user.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [ready, user, pathname, router]);

  const login = useCallback((id: string, password: string) => {
    const u = doLogin(id, password);
    if (u) setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    doLogout();
    setUser(null);
    router.replace('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
