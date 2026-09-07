"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUserPlus, FiUsers, FiBriefcase, FiMessageSquare,
  FiFileText, FiShield, FiAlertTriangle,
  FiPlusCircle, FiCalendar, FiLogOut, FiMenu, FiX, FiGrid, FiBookOpen,
  FiBell, FiUser, FiHome, FiChevronDown, FiArrowUpRight
} from 'react-icons/fi';
import { Sparkles } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { apiFetch } from '@/lib/api';
import toast from 'react-hot-toast';

const CallProvider = dynamic(() => import('@/component/CallContext').then(m => m.CallProvider), { ssr: false });
const GlobalIncomingCall = dynamic(() => import('@/component/GlobalIncomingCall'), { ssr: false });
const PushNotificationManager = dynamic(() => import('@/component/PushNotificationManager'), { ssr: false });

const DashboardLayout = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const profileRef = useRef(null);

  const {
    data: session,
    isPending,
  } = authClient.useSession();

  const user = session?.user;
  const email = user?.email;
  const role = user?.role?.toLowerCase();

  useEffect(() => {
    if (!email) return;
    const fetchUnread = async () => {
      try {
        const data = await apiFetch(`/api/notifications/${email}?unread=true`);
        setUnreadNotifCount(data.unreadCount || 0);
      } catch (e) {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [email]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
    setIsProfileOpen(false);
  }, [pathname]);

  // ==========================================
  // NAVIGATION ROLE MAP DEFINITIONS
  // ==========================================
  const alumniLinks = [
    { label: 'Overview', href: '/dashboard', icon: <FiGrid /> },
    { label: 'Notifications', href: '/dashboard/alumni/notifications', icon: <FiBell />, badge: unreadNotifCount || null },
    { label: 'Create Profile', href: '/dashboard/alumni/profile', icon: <FiUserPlus /> },
    { label: 'My Connections', href: '/dashboard/alumni/my-connection', icon: <FiUsers /> },
    { label: 'Post Jobs/Internships', href: '/dashboard/alumni/jobPost', icon: <FiBriefcase /> },
    { label: 'ChatBox', href: '/dashboard/alumni/text', icon: <FiMessageSquare /> },
    { label: 'Manage Jobs', href: '/dashboard/alumni/manage-job', icon: <FiBookOpen /> },
    { label: 'Mentorship Hub', href: '/dashboard/alumni/mentorshipHub', icon: <FiBookOpen /> },
    { label: 'Blog', href: '/blog', icon: <FiFileText /> }
  ];

  const studentLinks = [
    { label: 'Overview', href: '/dashboard', icon: <FiGrid /> },
    { label: 'Notifications', href: '/dashboard/students/notifications', icon: <FiBell />, badge: unreadNotifCount || null },
    { label: 'My Connection', href: '/dashboard/students/my-connection', icon: <FiUsers /> },
    { label: 'Job Portal', href: '/dashboard/students/job-portal', icon: <FiBriefcase /> },
    { label: 'Create Profile', href: '/dashboard/students/create-profile', icon: <FiUserPlus /> },
    { label: 'ChatBox', href: '/dashboard/students/text-box', icon: <FiMessageSquare /> },
    { label: 'My Mentorship', href: '/dashboard/students/my-mentorship', icon: <FiBookOpen /> },
    { label: 'Blog', href: '/blog', icon: <FiFileText /> }
  ];

  const adminLinks = [
    { label: 'Admin Dashboard', href: '/dashboard', icon: <FiGrid /> },
    { label: 'Manage Users', href: '/dashboard/admin/users', icon: <FiShield /> },
    { label: 'Reported Content', href: '/dashboard/admin/reports', icon: <FiAlertTriangle /> },
    { label: 'Add Notices', href: '/dashboard/admin/notices', icon: <FiPlusCircle /> },
    { label: 'Reunion & Events', href: '/dashboard/admin/reunion', icon: <FiCalendar /> }
  ];

  const getNavLinks = () => {
    if (role === 'admin') return adminLinks;
    if (role === 'alumni') return alumniLinks;
    return studentLinks;
  };

  const currentLinks = getNavLinks();
  const activeLink = currentLinks.find((l) => pathname === l.href);
  const pageLabel = activeLink?.label || 'Overview';

  const notifHref = role === 'admin'
    ? '/dashboard'
    : role === 'alumni'
    ? '/dashboard/alumni/notifications'
    : '/dashboard/students/notifications';

  const chatHref = role === 'alumni'
    ? '/dashboard/alumni/text'
    : '/dashboard/students/text-box';

  const quickAction = role === 'admin'
    ? { href: '/dashboard/admin/notices', label: 'New Notice', grad: 'from-violet-500 to-purple-600' }
    : role === 'alumni'
    ? { href: '/dashboard/alumni/jobPost', label: 'Post Job', grad: 'from-blue-600 to-indigo-600' }
    : { href: '/dashboard/students/create-profile', label: 'Create Profile', grad: 'from-emerald-600 to-teal-600' };

  const profileHref = role === 'alumni'
    ? '/dashboard/alumni/profile'
    : '/dashboard/students/create-profile';

  const accent =
    role === 'admin' ? 'from-violet-600 via-purple-600 to-fuchsia-600'
    : role === 'alumni' ? 'from-blue-600 via-indigo-600 to-purple-600'
    : 'from-emerald-500 via-teal-500 to-cyan-600';

  const handleLogout = async () => {
    await authClient.signOut();
    toast.success('Successfully logged out!');
    router.push('/signin');
  };

  const isActive = (path) => pathname === path;

  if (isPending) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <CallProvider email={email}>
      <PushNotificationManager email={email} />
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 flex flex-col transition-colors duration-300">
        {/* Global Incoming Call Popup */}
        <GlobalIncomingCall />

        {/* ========== TOP DASHBOARD NAVBAR ========== */}
        <header className={`sticky top-0 z-50 transition-all duration-300 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-xl ${
          isScrolled
            ? 'shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] border-b border-zinc-200/60 dark:border-zinc-800/60'
            : 'border-b border-zinc-200/60 dark:border-zinc-800/60'
        }`}>
          {/* Top accent line */}
          <div className={`h-0.5 bg-gradient-to-r ${accent} transition-opacity duration-300 ${isScrolled ? 'opacity-100' : 'opacity-60'}`} />

          <div className="flex items-center justify-between px-4 sm:px-6 h-16 transition-all duration-300">
            {/* Left: Mobile menu toggle + Brand + page context */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="p-2 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors lg:hidden shrink-0"
                aria-label="Toggle menu"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={isMobileOpen ? 'close' : 'open'}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="block"
                  >
                    {isMobileOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
                  </motion.span>
                </AnimatePresence>
              </button>

              <Link href="/dashboard" className="flex items-center gap-2.5 group min-w-0">
                <div className="relative shrink-0">
                  <div className={`absolute -inset-1 rounded-xl bg-gradient-to-br ${accent} opacity-40 blur group-hover:opacity-70 transition-opacity duration-300`} />
                  <div className={`relative w-9 h-9 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center shadow-lg shadow-indigo-500/25 transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3`}>
                    <span className="text-white font-extrabold text-sm">N</span>
                  </div>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="flex items-center gap-1.5 text-sm font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight whitespace-nowrap dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
                    NUB Bridge
                    <Sparkles className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                  </span>
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 tracking-wide whitespace-nowrap capitalize">
                    {pageLabel}
                  </span>
                </div>
              </Link>

              {/* Breadcrumb (desktop) */}
              <div className="hidden xl:flex items-center gap-1.5 ml-2 text-[13px] font-semibold text-zinc-400 dark:text-zinc-500">
                <FiHome className="w-3.5 h-3.5" />
                <span>/</span>
                <span className="text-zinc-600 dark:text-zinc-300 capitalize">{pageLabel}</span>
              </div>
            </div>

            {/* Right: Quick actions + Profile */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Back to site */}
              <Link
                href="/"
                title="View public site"
                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all duration-200"
              >
                <FiHome className="w-4 h-4" />
                <span className="hidden lg:inline">Site</span>
              </Link>

              {/* Chat shortcut (alumni/student) */}
              {chatHref && role !== 'admin' && (
                <Link
                  href={chatHref}
                  title="ChatBox"
                  className="relative flex items-center justify-center w-10 h-10 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all duration-200"
                >
                  <FiMessageSquare className="w-[18px] h-[18px]" />
                </Link>
              )}

              {/* Notifications with live count */}
              <Link
                href={notifHref}
                title="Notifications"
                className="relative flex items-center justify-center w-10 h-10 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all duration-200"
              >
                <FiBell className="w-[18px] h-[18px]" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-zinc-900 shadow-sm shadow-red-500/30">
                    {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                  </span>
                )}
              </Link>

              {/* Quick action */}
              <Link
                href={quickAction.href}
                className={`relative group hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold text-white bg-gradient-to-r ${quickAction.grad} shadow-lg hover:-translate-y-px transition-all duration-300 overflow-hidden shrink-0`}
              >
                <FiPlusCircle className="w-4 h-4" />
                <span className="relative z-10">{quickAction.label}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </Link>

              <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />

              {/* Profile dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2.5 p-1 pr-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 group"
                >
                  <div className="relative">
                    {user?.image ? (
                      <img
                        src={user.image}
                        alt="Profile"
                        className="w-9 h-9 rounded-xl object-cover ring-2 ring-zinc-200 dark:ring-zinc-700 group-hover:ring-blue-400 dark:group-hover:ring-blue-500 transition-all duration-200"
                      />
                    ) : (
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center ring-2 ring-zinc-200 dark:ring-zinc-700 group-hover:ring-blue-400 dark:group-hover:ring-blue-500 transition-all duration-200 shadow-md`}>
                        <span className="text-white font-bold text-sm">
                          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-900" />
                  </div>
                  <div className="hidden sm:block text-left leading-tight">
                    <p className="text-[13px] font-bold text-zinc-800 dark:text-zinc-100 max-w-[110px] truncate">
                      {user?.name?.split(' ')[0] || ''}
                    </p>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold capitalize">{user?.role}</span>
                  </div>
                  <FiChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''} hidden sm:block`} />
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
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
                            <img src={user.image} alt="Profile" className="w-11 h-11 rounded-xl object-cover ring-2 ring-white dark:ring-zinc-700 shadow-md" />
                          ) : (
                            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center shadow-md ring-2 ring-white dark:ring-zinc-700`}>
                              <span className="text-white font-bold">{user?.name?.charAt(0)?.toUpperCase()}</span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{user?.name}</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{user?.email}</p>
                          </div>
                        </div>
                        <span className="inline-block mt-3 px-2.5 py-1 rounded-full text-[11px] font-bold bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-300 ring-1 ring-inset ring-blue-500/20 capitalize">
                          {user?.role}
                        </span>
                      </div>

                      <div className="p-2">
                        <Link
                          href={profileHref}
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                            <FiUser className="w-4 h-4 text-zinc-500" />
                          </div>
                          My Profile
                        </Link>
                        <Link
                          href="/"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                            <FiArrowUpRight className="w-4 h-4 text-zinc-500" />
                          </div>
                          View Public Site
                        </Link>
                      </div>

                      <div className="p-2 border-t border-zinc-100 dark:border-zinc-800">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                        >
                          <div className="p-1.5 bg-red-100 dark:bg-red-950/30 rounded-lg">
                            <FiLogOut className="w-4 h-4 text-red-500" />
                          </div>
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* ========== BODY: SIDEBAR + CONTENT ========== */}
        <div className="flex flex-1 overflow-hidden">

          {/* SIDEBAR - Desktop: always visible, Mobile: drawer */}
          <aside className={`
            fixed inset-y-0 left-0 top-14 lg:top-16 transform ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} 
            lg:translate-x-0 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] flex flex-col w-60 lg:w-64 
            bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 p-4 z-40 
            transition-transform duration-300 ease-in-out overflow-y-auto
          `}>
            {/* Profile Card */}
            <div className="pb-4 mb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                {user?.image ? (
                  <img src={user.image} alt="Profile" className="w-11 h-11 rounded-xl object-cover ring-2 ring-zinc-200 dark:ring-zinc-700 shadow-md" />
                ) : (
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${accent} text-white font-bold flex items-center justify-center shadow-md`}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div className="overflow-hidden">
                  <h3 className="text-sm font-bold truncate text-zinc-900 dark:text-zinc-100">{user?.name || 'Anonymous'}</h3>
                  <span className={`inline-block px-2 py-0.5 mt-1 rounded-md text-[10px] uppercase tracking-wide font-extrabold ${
                    role === 'admin'
                      ? 'bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400'
                      : role === 'alumni'
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                      : 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
                  }`}>
                    {user?.role || 'Guest'}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 space-y-1">
              {currentLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                    isActive(link.href)
                      ? role === 'admin'
                        ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-600/20'
                        : role === 'alumni'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-base ${isActive(link.href) ? 'text-white' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600'}`}>
                      {link.icon}
                    </span>
                    <span>{link.label}</span>
                  </div>

                  {link.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive(link.href) ? 'bg-white text-blue-600' : 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400'}`}>
                      {link.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>

            {/* Logout */}
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-4">
              <Link
                href="/"
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
              >
                <FiHome className="text-base" />
                <span>View Site</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left mt-1"
              >
                <FiLogOut className="text-base" />
                <span>Logout</span>
              </button>
            </div>
          </aside>

          {/* Mobile backdrop */}
          {isMobileOpen && (
            <div onClick={() => setIsMobileOpen(false)} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 lg:hidden" />
          )}

          {/* Main content */}
          <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </CallProvider>
  );
};

export default DashboardLayout;