"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMenu, FiX, FiBell, FiMessageSquare,
  FiUser, FiLogOut, FiBriefcase, FiUsers,
  FiCompass, FiBookOpen, FiGrid,
  FiChevronDown, FiFileText
} from 'react-icons/fi';
import { GraduationCap } from 'lucide-react';
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
    error,
    refetch
  } = authClient.useSession();

  const user = session?.user;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
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

  const handleSignOut = async () => {
    await authClient.signOut();
    setIsProfileDropdownOpen(false);
    setIsMobileMenuOpen(false);
    router.push('/');
    toast.success('Successfully logged out');
  };

  const publicLinks = [
    { label: 'Home', href: '/', icon: <FiCompass className="w-4 h-4" /> },
    { label: 'Alumni Directory', href: '/alumni-directory', icon: <FiUsers className="w-4 h-4" /> },
    { label: 'Student Directory', href: '/student-directory', icon: <GraduationCap className="w-4 h-4" /> },
  ];

  const privateLinks = [
    { label: 'Job Board', href: '/job-portal', icon: <FiBriefcase className="w-4 h-4" /> },
    { label: 'Notice Board', href: '/notice', icon: <FiBookOpen className="w-4 h-4" /> },
    { label: 'Blog', href: '/blog', icon: <FiFileText className="w-4 h-4" /> },
  ];

  const isActive = (path) => pathname === path;

  if (pathname.startsWith('/dashboard')) return null;

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      isScrolled
        ? 'bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-lg shadow-black/5 border-b border-zinc-200/50 dark:border-zinc-800/50'
        : 'bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">

          {/* BRAND LOGO */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all duration-300 group-hover:scale-105">
              <span className="text-white font-extrabold text-sm tracking-tight">N</span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight tracking-tight">
                NUB Bridge
              </span>
              <span className="text-[9px] font-medium text-zinc-400 dark:text-zinc-500 tracking-widest uppercase leading-none hidden sm:block">
                Alumni Network
              </span>
            </div>
          </Link>

          {/* DESKTOP NAV LINKS */}
          <div className="hidden lg:flex items-center gap-1">
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
                    className="absolute inset-0 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/50"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
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
                    className="absolute inset-0 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/50"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{link.icon}</span>
                <span className="relative z-10">{link.label}</span>
              </Link>
            ))}
          </div>

          {/* RIGHT SIDE */}
          <div className="hidden lg:flex items-center gap-3">
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
                  className="relative px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 overflow-hidden group"
                >
                  <span className="relative z-10">Get Started</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2" ref={profileDropdownRef}>
                {user?.role?.toLowerCase() === 'student' && (
                  <span className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200/60 dark:from-blue-950/40 dark:to-indigo-950/40 dark:text-blue-300 dark:border-blue-800/60">
                    <GraduationCap className="w-3 h-3" />
                    Student
                  </span>
                )}
                {user?.role?.toLowerCase() === 'alumni' && (
                  <span className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200/60 dark:from-emerald-950/40 dark:to-teal-950/40 dark:text-emerald-300 dark:border-emerald-800/60">
                    <FiUsers className="w-3 h-3" />
                    Alumni
                  </span>
                )}

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center gap-2 p-1 pr-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all duration-200 group"
                  >
                    <div className="relative">
                      {user?.image ? (
                        <img
                          src={user?.image}
                          alt="Profile"
                          className="w-9 h-9 rounded-xl object-cover ring-2 ring-zinc-200 dark:ring-zinc-700 group-hover:ring-blue-400 dark:group-hover:ring-blue-500 transition-all duration-200"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center ring-2 ring-zinc-200 dark:ring-zinc-700 group-hover:ring-blue-400 dark:group-hover:ring-blue-500 transition-all duration-200">
                          <span className="text-white font-bold text-sm">
                            {user?.name?.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-950" />
                    </div>
                    <FiChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isProfileDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute right-0 mt-2 w-64 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl shadow-black/10 overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-900">
                          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{user?.name}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{user?.email}</p>
                        </div>

                        <div className="p-2">
                          <Link
                            href={user?.role?.toLowerCase() === 'alumni' ? '/dashboard/alumni/profile' : '/dashboard/students/create-profile'}
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
              <div className="relative">
                {user?.image ? (
                  <img
                    src={user?.image}
                    alt="Profile"
                    className="w-8 h-8 rounded-lg object-cover ring-2 ring-zinc-200 dark:ring-zinc-700"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">
                      {user?.name?.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 focus:outline-none transition-colors"
            >
              {isMobileMenuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
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
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="lg:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {publicLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive(link.href)
                      ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50"
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
                      ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50"
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
                      className="block w-full text-center py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 transition-colors"
                    >
                      Get Started
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {user?.role?.toLowerCase() === 'student' && (
                      <div className="px-4 py-2 flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
                          Student
                        </span>
                      </div>
                    )}
                    {user?.role?.toLowerCase() === 'alumni' && (
                      <div className="px-4 py-2 flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                          Alumni
                        </span>
                      </div>
                    )}

                    <Link
                      href={user?.role?.toLowerCase() === 'alumni' ? '/dashboard/alumni/profile' : '/dashboard/students/create-profile'}
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
