'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { authClient } from '@/lib/auth-client';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';
import {
  FiUsers, FiUserCheck, FiBriefcase, FiFileText, FiCalendar,
  FiAlertTriangle, FiShield, FiActivity, FiTrendingUp, FiArrowRight,
} from 'react-icons/fi';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' },
  }),
};

export default function AdminOverview() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const user = session?.user;
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isPending) return;
    if (!user || user.role?.toLowerCase() !== 'admin') {
      router.push('/dashboard');
      return;
    }

    async function load() {
      try {
        const data = await apiFetch('/api/admin/stats');
        setStats(data);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, isPending, router]);

  if (isPending || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-500">Failed to load dashboard data.</p>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Alumni', value: stats.stats.totalAlumni, icon: FiUserCheck, color: 'from-blue-500 to-indigo-600', glow: 'shadow-blue-500/20' },
    { label: 'Total Students', value: stats.stats.totalStudents, icon: FiUsers, color: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-500/20' },
    { label: 'Total Jobs', value: stats.stats.totalJobs, icon: FiBriefcase, color: 'from-amber-500 to-orange-600', glow: 'shadow-amber-500/20' },
    { label: 'Total Users', value: stats.stats.totalUsers, icon: FiShield, color: 'from-violet-500 to-purple-600', glow: 'shadow-violet-500/20' },
    { label: 'Notices', value: stats.stats.totalNotices, icon: FiFileText, color: 'from-rose-500 to-pink-600', glow: 'shadow-rose-500/20' },
    { label: 'Events', value: stats.stats.totalEvents, icon: FiCalendar, color: 'from-cyan-500 to-blue-600', glow: 'shadow-cyan-500/20' },
  ];

  const quickActions = [
    { label: 'Manage Users', href: '/dashboard/admin/users', icon: FiUsers, color: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
    { label: 'Add Notice', href: '/dashboard/admin/notices', icon: FiFileText, color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' },
    { label: 'Reports', href: '/dashboard/admin/reports', icon: FiAlertTriangle, color: 'bg-amber-50 text-amber-600 hover:bg-amber-100' },
    { label: 'Events', href: '/dashboard/admin/reunion', icon: FiCalendar, color: 'bg-violet-50 text-violet-600 hover:bg-violet-100' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Welcome back, {user?.name || 'Admin'}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-bold">
          <FiShield className="w-3.5 h-3.5" />
          Admin
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{card.label}</p>
                  <p className="text-3xl font-black text-zinc-900 dark:text-white mt-1">{card.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color} shadow-lg ${card.glow}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <FiTrendingUp className="w-4 h-4 text-violet-500" />
            <h2 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => router.push(action.href)}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${action.color}`}
                >
                  <Icon className="w-4 h-4" />
                  {action.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <FiActivity className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Recent Activity</h2>
          </div>
          <div className="space-y-3">
            {stats.recentActivity.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-4">No recent activity</p>
            ) : (
              stats.recentActivity.slice(0, 8).map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-zinc-50 dark:border-zinc-800 last:border-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                    item.type === 'alumni' ? 'bg-blue-500' : 'bg-emerald-500'
                  }`}>
                    {item.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 truncate">{item.name}</p>
                    <p className="text-[10px] text-zinc-400">{item.type === 'alumni' ? 'Alumni' : 'Student'} · {item.email}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    item.type === 'alumni' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {item.type}
                  </span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Role Breakdown */}
      {stats.stats.roles && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6"
        >
          <h2 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-4">User Roles</h2>
          <div className="flex gap-4">
            {Object.entries(stats.stats.roles).map(([role, count]) => (
              <div key={role} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  role === 'Admin' ? 'bg-violet-500' : role === 'Alumni' ? 'bg-blue-500' : 'bg-emerald-500'
                }`} />
                <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">{role || 'Unknown'}</span>
                <span className="text-sm font-black text-zinc-900 dark:text-white">{count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
