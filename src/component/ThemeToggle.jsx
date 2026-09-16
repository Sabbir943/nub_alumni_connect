'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSun, FiMoon, FiMonitor } from 'react-icons/fi';

const THEMES = [
  { key: 'light', icon: FiSun, label: 'Light' },
  { key: 'dark', icon: FiMoon, label: 'Dark' },
  { key: 'system', icon: FiMonitor, label: 'System' },
];

export default function ThemeToggle({ variant = 'default' }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // eslint-disable-line react-hooks/set-state-in-effect -- standard hydration gate
  }, []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
    );
  }

  const activeIndex = THEMES.findIndex((t) => t.key === theme);
  const current = THEMES[activeIndex === -1 ? 0 : activeIndex];
  const Icon = current.icon;

  const cycle = () => {
    const nextIdx = (activeIndex === -1 ? 0 : activeIndex + 1) % THEMES.length;
    setTheme(THEMES[nextIdx].key);
  };

  if (variant === 'pill') {
    return (
      <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
        {THEMES.map((t) => {
          const TIcon = t.icon;
          const active = theme === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTheme(t.key)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                active
                  ? 'text-zinc-900 dark:text-white'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="theme-pill"
                  className="absolute inset-0 bg-white dark:bg-zinc-700 rounded-lg shadow-sm"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <TIcon size={14} />
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <button
      onClick={cycle}
      title={`Theme: ${current.label}`}
      className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors overflow-hidden group"
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={theme}
          initial={{ y: -20, opacity: 0, rotate: -90 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: 20, opacity: 0, rotate: 90 }}
          transition={{ duration: 0.2 }}
          className="absolute"
        >
          <Icon size={18} />
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
