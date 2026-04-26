'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldCheck,
  Database,
  Brain,
  Users,
  HeartPulse,
  LogOut,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from './AuthProvider';

const navLinks = [
  { href: '/admin', label: 'Admin Dashboard', icon: ShieldCheck },
  { href: '/admin/data', label: 'Data Management', icon: Database },
  { href: '/admin/model', label: 'Model Status', icon: Brain },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/health', label: 'System Health', icon: HeartPulse },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-[#0a0f1e] border-r border-white/5 flex flex-col z-50">
      <div className="px-6 py-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-500 flex items-center justify-center shadow-lg">
            <ShieldCheck className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-white font-bold text-lg leading-none">GolfIQ</div>
            <div className="text-purple-400 text-xs font-medium tracking-wider mt-0.5">ADMIN</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || (href !== '/admin' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-purple-500/15 text-purple-300 border border-purple-500/20'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              )}
            >
              <Icon
                className={cn(
                  'flex-shrink-0 transition-colors',
                  isActive ? 'text-purple-300' : 'text-slate-500 group-hover:text-slate-300'
                )}
                size={18}
              />
              {label}
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-300" />}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-white/5 space-y-2">
        <Link
          href="/dashboard"
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
        >
          <ArrowLeft size={16} />
          Back to Customer App
        </Link>
        {user && (
          <div className="px-3 py-2 rounded-lg bg-white/3 border border-white/5">
            <div className="text-xs text-slate-500">Signed in as</div>
            <div className="text-sm text-white font-medium truncate">{user.display_name}</div>
            <div className="text-[10px] text-purple-300 uppercase tracking-wider">{user.role}</div>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
