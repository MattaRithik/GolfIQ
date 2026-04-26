'use client';

import { Users, ShieldCheck, User } from 'lucide-react';

// MVP — these are the seeded local users from src/lib/auth.ts.
// Replace with a backend-backed user store before production.
const MVP_USERS = [
  { golfiq_id: 'admin', display_name: 'Admin User', role: 'admin' as const },
  { golfiq_id: 'demo', display_name: 'Demo Golfer', role: 'customer' as const },
];

export default function AdminUsersPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Users size={26} className="text-green-400" />
          Users
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Local seeded users (MVP). Replace with a backend user store before production.
        </p>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/3 text-xs text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3 font-medium">GolfIQ ID</th>
              <th className="text-left px-5 py-3 font-medium">Display Name</th>
              <th className="text-left px-5 py-3 font-medium">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {MVP_USERS.map(u => (
              <tr key={u.golfiq_id}>
                <td className="px-5 py-3 font-mono text-white">{u.golfiq_id}</td>
                <td className="px-5 py-3 text-slate-300">{u.display_name}</td>
                <td className="px-5 py-3">
                  <span
                    className={
                      u.role === 'admin'
                        ? 'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 text-xs font-medium'
                        : 'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/15 text-green-300 text-xs font-medium'
                    }
                  >
                    {u.role === 'admin' ? <ShieldCheck size={12} /> : <User size={12} />}
                    {u.role}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-slate-500">
        Note: GolfIQ does not yet have signup, password reset, or session expiry. Local sessions are
        stored in <code className="text-slate-400">localStorage</code> for development only.
      </div>
    </div>
  );
}
