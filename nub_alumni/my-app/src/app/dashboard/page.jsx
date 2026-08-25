'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { FiUsers, FiBriefcase, FiShield } from 'react-icons/fi';

export default function DashboardPage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const user = session?.user;
  const role = user?.role?.toLowerCase();

  useEffect(() => {
    if (isPending || !role) return;

    const routes = {
      alumni: '/dashboard/alumni/overview',
      student: '/dashboard/students/overview',
      admin: '/dashboard/admin',
    };

    const target = routes[role];
    if (target) {
      const timer = setTimeout(() => router.push(target), 300);
      return () => clearTimeout(timer);
    }
  }, [role, isPending, router]);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const roleConfig = {
    alumni: { icon: FiUsers, label: 'Alumni', gradient: 'from-blue-500 to-indigo-600', glow: 'shadow-blue-500/30' },
    student: { icon: FiBriefcase, label: 'Student', gradient: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-500/30' },
    admin: { icon: FiShield, label: 'Admin', gradient: 'from-violet-500 to-purple-600', glow: 'shadow-violet-500/30' },
  };

  const config = roleConfig[role] || roleConfig.alumni;
  const RoleIcon = config.icon;

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          {user?.image ? (
            <img
              src={user.image}
              alt={user.name}
              className="w-20 h-20 rounded-2xl object-cover shadow-2xl ring-4 ring-white dark:ring-zinc-800"
            />
          ) : (
            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-white text-2xl font-black shadow-2xl ${config.glow}`}>
              {getInitials(user?.name)}
            </div>
          )}
          <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}>
            <RoleIcon className="w-4 h-4 text-white" />
          </div>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white">
            Welcome, {user?.name || 'User'}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {isPending ? 'Verifying your session...' : `Redirecting to your ${config.label} dashboard...`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${config.gradient} animate-bounce`}
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <span className="text-xs font-semibold text-zinc-400 ml-2">
            {isPending ? 'Loading...' : 'Almost there...'}
          </span>
        </div>
      </div>
    </div>
  );
}
