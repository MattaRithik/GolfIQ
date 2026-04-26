'use client';

import Link from 'next/link';
import { Database, Brain, Users, HeartPulse, ChevronRight } from 'lucide-react';

const cards = [
  {
    href: '/admin/data',
    title: 'Data Management',
    description: 'Seed/raw/processed datasets, uploads, database stats.',
    icon: Database,
    accent: 'text-blue-400',
  },
  {
    href: '/admin/model',
    title: 'Model Status',
    description: 'ML model metrics, retraining, versioning.',
    icon: Brain,
    accent: 'text-purple-400',
  },
  {
    href: '/admin/users',
    title: 'Users',
    description: 'View and manage GolfIQ users and roles.',
    icon: Users,
    accent: 'text-green-400',
  },
  {
    href: '/admin/health',
    title: 'System Health',
    description: 'Backend health, environment, runtime status.',
    icon: HeartPulse,
    accent: 'text-orange-400',
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">
          Internal operations — not visible to customer accounts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map(({ href, title, description, icon: Icon, accent }) => (
          <Link
            key={href}
            href={href}
            className="glass-card p-6 hover:border-white/15 border border-white/5 transition-all flex items-start gap-4 group"
          >
            <div className="p-2.5 rounded-lg bg-white/5">
              <Icon size={20} className={accent} />
            </div>
            <div className="flex-1">
              <div className="text-white font-semibold flex items-center gap-2">
                {title}
                <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-300 transition-colors" />
              </div>
              <p className="text-slate-400 text-sm mt-1">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
