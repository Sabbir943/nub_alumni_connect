"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMenu, FiX, FiBell, FiMessageSquare,
  FiUser, FiLogOut, FiBriefcase, FiUsers,
  FiCompass, FiBookOpen, FiGrid,
  FiChevronDown, FiFileText, FiSearch,
  FiShield, FiArrowRight
} from 'react-icons/fi';
import { GraduationCap, Sparkles } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import toast from 'react-hot-toast';

const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const profileDropdownRef = useRef(null);

  const {
    data: session,
    isPending,
  } = authClient.useSession();

  const user = session?.user;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setIsProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileDropdownOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await authClient.signOut();
    setIsProfileDropdownOpen(false);
    setIsMobileMenuOpen(false);
    router.push('/');
    toast.success('Successfully logged out');
  };

  const profileHref = user?.role?.toLowerCase() === 'alumni'
    ? '/dashboard/alumni/profile'
    : '/dashboard/students/create-profile';

  const publicLinks = [
    { label: 'Home', href: '/', icon: <FiCompass className="w-4 h-4" /> },
    { label: 'Alumni', href: '/alumni-directory', icon: <FiUsers className="w-4 h-4" /> },
    { label: 'Students', href: '/student-directory', icon: <GraduationCap className="w-4 h-4" /> },
  ];

  const privateLinks = [
    { label: 'Jobs', href: '/job-portal', icon: <FiBriefcase className="w-4 h-4" /> },
    { label: 'Notices', href: '/notice', icon: <FiBookOpen className="w-4 h-4" /> },
    { label: 'Blog', href: '/blog', icon: <FiFileText className="w-4 h-4" /> },
  ];

  const isActive = (path) => pathname === path;

  if (pathname.startsWith('/dashboard')) return null;

  const roleBadge =
    user?.role?.toLowerCase() === 'student' ? (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-300 ring-1 ring-inset ring-blue-500/20">
        <GraduationCap className="w-3 h-3" />
        Student
      </span>
    ) : user?.role?.toLowerCase() === 'alumni' ? (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-300 ring-1 ring-inset ring-emerald-500/20">
        <FiUsers className="w-3 h-3" />
        Alumni
      </span>
    ) : user?.role?.toLowerCase() === 'admin' ? (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10 text-purple-600 dark:text-purple-300 ring-1 ring-inset ring-purple-500/20">
        <FiShield className="w-3 h-3" />
        Admin
      </span>
    ) : null;

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      isScrolled
        ? 'bg-white/85 dark:bg-zinc-950/85 backdrop-blur-xl shadow-[0_8px_30px_-12px_rgba(0,0,0,0.15)] border-b border-zinc-200/60 dark:border-zinc-800/60'
        : 'bg-white/70 dark:bg-zinc-950/60 backdrop-blur-md border-b border-transparent'
    }`}>
      {/* Top accent line */}
      <div className={`h-0.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 transition-opacity duration-300 ${isScrolled ? 'opacity-100' : 'opacity-0'}`} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 lg:h-[68px] items-center">

          {/* BRAND LOGO */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="relative">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 opacity-40 blur-md group-hover:opacity-70 transition-opacity duration-300" />
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/30 transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3">
                <span className="text-white font-extrabold text-base tracking-tight">N</span>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="flex items-center gap-1.5 text-lg font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight tracking-tight">
                NUB Bridge
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </span>
              <span className="text-[9px] font-semibold text-zinc-400 dark:text-zinc-500 tracking-[0.2em] uppercase leading-none hidden sm:block">
                Alumni Network
              </span>
            </div>
          </Link>

          {/* DESKTOP NAV LINKS */}
          <div className="hidden lg:flex items-center gap-1 bg-zinc-100/70 dark:bg-zinc-900/60 p-1 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50">
            {publicLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
                  isActive(link.href)
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                {isActive(link.href) && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-xl shadow-sm shadow-black/5 border border-zinc-200/60 dark:border-zinc-700/60"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{link.icon}</span>
                <span className="relative z-10">{link.label}</span>
              </Link>
            ))}

            {user && privateLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
                  isActive(link.href)
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                {isActive(link.href) && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-xl shadow-sm shadow-black/5 border border-zinc-200/60 dark:border-zinc-700/60"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{link.icon}</span>
                <span className="relative z-10">{link.label}</span>
              </Link>
            ))}
          </div>

          {/* RIGHT SIDE */}
          <div className="hidden lg:flex items-center gap-2">
            {!user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/signin"
                  className="px-4 py-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all duration-200"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="relative group px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-px transition-all duration-300 overflow-hidden inline-flex items-center gap-1.5"
                >
                  <span className="relative z-10">Get Started</span>
                  <FiArrowRight className="relative z-10 w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2.5" ref={profileDropdownRef}>
                {/* Quick actions */}
                <Link
                  href="/job-portal"
                  title="Browse Jobs"
                  className="relative hidden xl:flex items-center justify-center w-10 h-10 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all duration-200"
                >
                  <FiSearch className="w-[18px] h-[18px]" />
                </Link>

                <Link
                  href="/dashboard/alumni/text"
                  title="Messages"
                  className="hidden md:flex items-center justify-center w-10 h-10 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all duration-200"
                >
                  <FiMessageSquare className="w-[18px] h-[18px]" />
                </Link>

                <Link
                  href="/dashboard/alumni/notifications"
                  title="Notifications"
                  className="relative flex items-center justify-center w-10 h-10 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all duration-200"
                >
                  <FiBell className="w-[18px] h-[18px]" />
                  <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-zinc-950 animate-pulse" />
                </Link>

                <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800" />

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center gap-2.5 p-1.5 pl-1.5 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all duration-200 group"
                  >
                    <div className="relative">
                      {user?.image ? (
                        <img
                          src={user?.image}
                          alt="Profile"
                          className="w-9 h-9 rounded-xl object-cover ring-2 ring-zinc-200 dark:ring-zinc-700 group-hover:ring-blue-400 dark:group-hover:ring-blue-500 group-hover:shadow-md group-hover:shadow-blue-500/20 transition-all duration-200"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center ring-2 ring-zinc-200 dark:ring-zinc-700 group-hover:ring-blue-400 dark:group-hover:ring-blue-500 transition-all duration-200 shadow-md shadow-indigo-500/20">
                          <span className="text-white font-bold text-sm">
                            {user?.name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-950">
                        <span className="absolute inset-0 rounded-full bg-emerald-400/70 animate-ping" />
                      </div>
                    </div>
                    <div className="hidden xl:block text-left leading-tight">
                      <p className="text-[13px] font-bold text-zinc-800 dark:text-zinc-100 max-w-[120px] truncate">{user?.name?.split(' ')[0]}</p>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">{user?.role}</span>
                    </div>
                    <FiChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isProfileDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.97 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="absolute right-0 mt-2 w-64 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl shadow-black/10 overflow-hidden"
                      >
                        <div className="px-4 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-800/60 dark:to-zinc-900">
                          <div className="flex items-center gap-3">
                            {user?.image ? (
                              <img src={user?.image} alt="Profile" className="w-11 h-11 rounded-xl object-cover ring-2 ring-white dark:ring-zinc-700 shadow-md" />
                            ) : (
                              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/25 ring-2 ring-white dark:ring-zinc-700">
                                <span className="text-white font-bold">{user?.name?.charAt(0)?.toUpperCase()}</span>
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{user?.name}</p>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{user?.email}</p>
                            </div>
                          </div>
                          <div className="mt-3">{roleBadge}</div>
                        </div>

                        <div className="p-2">
                          <Link
                            href={profileHref}
                            onClick={() => setIsProfileDropdownOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          >
                            <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                              <FiUser className="w-4 h-4 text-zinc-500" />
                            </div>
                            My Profile
                          </Link>

                          <Link
                            href="/dashboard"
                            onClick={() => setIsProfileDropdownOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          >
                            <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                              <FiGrid className="w-4 h-4 text-zinc-500" />
                            </div>
                            Dashboard
                          </Link>
                        </div>

                        <div className="p-2 border-t border-zinc-100 dark:border-zinc-800">
                          <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                          >
                            <div className="p-1.5 bg-red-100 dark:bg-red-950/30 rounded-lg">
                              <FiLogOut className="w-4 h-4 text-red-500" />
                            </div>
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>

          {/* MOBILE MENU TOGGLE */}
          <div className="lg:hidden flex items-center gap-2">
            {user && (
              <Link href="/dashboard/alumni/notifications" className="relative flex items-center justify-center w-9 h-9 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
                <FiBell className="w-5 h-5" />
                <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-zinc-950" />
              </Link>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 focus:outline-none transition-colors"
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={isMobileMenuOpen ? 'close' : 'open'}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="block"
                >
                  {isMobileMenuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>

        </div>
      </div>

      {/* MOBILE EXPANDED MENU */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="lg:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl overflow-hidden shadow-lg shadow-black/5"
          >
            <div className="px-4 py-4 space-y-1">
              {publicLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive(link.href)
                      ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 text-blue-600 dark:text-blue-400 ring-1 ring-inset ring-blue-200/60 dark:ring-blue-800/60"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  }`}
                >
                  <span className={`${isActive(link.href) ? "text-blue-500" : "text-zinc-400"}`}>{link.icon}</span>
                  {link.label}
                </Link>
              ))}

              {user && privateLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive(link.href)
                      ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 text-blue-600 dark:text-blue-400 ring-1 ring-inset ring-blue-200/60 dark:ring-blue-800/60"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  }`}
                >
                  <span className={`${isActive(link.href) ? "text-blue-500" : "text-zinc-400"}`}>{link.icon}</span>
                  {link.label}
                </Link>
              ))}

              <div className="pt-3 mt-2 border-t border-zinc-200 dark:border-zinc-800">
                {!user ? (
                  <div className="space-y-2">
                    <Link
                      href="/signin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full text-center py-3 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition-colors"
                    >
                      Log in
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full text-center py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25 transition-transform active:scale-[0.99]"
                    >
                      Get Started
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="px-4 py-2 flex items-center gap-2 mb-1">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {user?.image ? (
                          <img src={user?.image} alt="Profile" className="w-9 h-9 rounded-xl object-cover ring-2 ring-zinc-200 dark:ring-zinc-700" />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
                            <span className="text-white font-bold text-sm">{user?.name?.charAt(0)?.toUpperCase()}</span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 truncate">{user?.name}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{user?.email}</p>
                        </div>
                      </div>
                    </div>

                    <Link
                      href={profileHref}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                    >
                      <FiUser className="w-4 h-4 text-zinc-400" /> My Profile
                    </Link>
                    <Link
                      href="/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                    >
                      <FiGrid className="w-4 h-4 text-zinc-400" /> Dashboard
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center justify-center gap-2 py-3 mt-2 rounded-xl text-sm font-semibold text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400 border border-red-100 dark:border-red-900/30 transition-colors"
                    >
                      <FiLogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;