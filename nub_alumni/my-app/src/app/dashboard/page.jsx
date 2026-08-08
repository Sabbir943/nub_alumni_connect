'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { authClient } from '@/lib/auth-client';
import { FiGrid, FiUsers, FiBriefcase, FiShield } from 'react-icons/fi';

export default function DashboardPage() {
  const { data: session, isPending } = authClient.useSession();
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
      const timer = setTimeout(() => window.location.replace(target), 800);
      return () => clearTimeout(timer);
    }
  }, [role, isPending]);

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
    <div className="min-h-[70vh] flex items-center justify-center relative overflow-hidden">
      {/* Background Orbs */}
      <motion.div
        className="absolute w-96 h-96 bg-blue-400/15 rounded-full blur-3xl"
        animate={{ y: [0, -30, 0, 30, 0], x: [0, 20, 0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        style={{ top: '-10%', left: '-10%' }}
      />
      <motion.div
        className="absolute w-80 h-80 bg-violet-400/15 rounded-full blur-3xl"
        animate={{ y: [0, 20, 0, -20, 0], x: [0, -15, 0, 15, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        style={{ bottom: '-10%', right: '-10%' }}
      />

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex flex-col items-center gap-6"
      >
        {/* Avatar + Role Badge */}
        <div className="relative">
          {user?.image ? (
            <motion.img
              src={user.image}
              alt={user.name}
              className="w-20 h-20 rounded-2xl object-cover shadow-2xl ring-4 ring-white dark:ring-zinc-800"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
            />
          ) : (
            <motion.div
              className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-white text-2xl font-black shadow-2xl ${config.glow}`}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
            >
              {getInitials(user?.name)}
            </motion.div>
          )}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.3 }}
            className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}
          >
            <RoleIcon className="w-4 h-4 text-white" />
          </motion.div>
          <motion.div
            className="absolute -inset-3 rounded-3xl border-2 border-blue-400/20"
            animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.2, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* Welcome Text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center space-y-2"
        >
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white">
            Welcome, {user?.name || 'User'}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {isPending ? 'Verifying your session...' : `Redirecting to your ${config.label} dashboard...`}
          </p>
        </motion.div>

        {/* Loading Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-3"
        >
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${config.gradient}`}
                animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </div>
          <span className="text-xs font-semibold text-zinc-400 ml-2">
            {isPending ? 'Loading...' : 'Almost there...'}
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}
