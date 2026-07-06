"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  FiUserPlus, FiUsers, FiBriefcase, FiMessageSquare, FiEdit, 
  FiFileText, FiCheckSquare, FiShield, FiAlertTriangle, 
  FiPlusCircle, FiCalendar, FiLogOut, FiMenu, FiX, FiGrid, FiBookOpen 
} from 'react-icons/fi';

const DashboardLayout = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  /* Better Auth / Role Context Simulation:
    Toggle between 'alumni' | 'student' | 'admin' to inspect structural changes.
  */
  const [userSession, setUserSession] = useState({
    email: "admin@nub.edu", // Fixed admin email rule validator
    role: "alumni", 
    name: "Sabbir Ahmad"
  });

  // ==========================================
  // NAVIGATION ROLE MAP DEFINITIONS
  // ==========================================
  
  const alumniLinks = [
    { label: 'Overview', href: '/dashboard', icon: <FiGrid /> },
    { label: 'Create Profile', href: '/dashboard/alumni/create', icon: <FiUserPlus /> },
    { label: 'Edit Profile', href: '/dashboard/alumni/edit', icon: <FiEdit /> },
    { label: 'My Connections', href: '/dashboard/alumni/connections', icon: <FiUsers /> },
    { label: 'Post Jobs/Internships', href: '/dashboard/alumni/post-job', icon: <FiBriefcase /> },
    { label: 'Messages', href: '/dashboard/alumni/messages', icon: <FiMessageSquare />, badge: 2 },
    /* Suggestion Add: */
    { label: 'Mentorship Hub', href: '/dashboard/alumni/mentorship', icon: <FiBookOpen /> }
  ];

  const studentLinks = [
    { label: 'Overview', href: '/dashboard', icon: <FiGrid /> },
    { label: 'Talk to Alumni (Chat)', href: '/dashboard/student/chat', icon: <FiMessageSquare />, badge: 5 },
    { label: 'Upload Resume', href: '/dashboard/student/resume', icon: <FiFileText /> },
    { label: 'Apply for Jobs', href: '/dashboard/student/jobs', icon: <FiBriefcase /> },
    { label: 'My Applications', href: '/dashboard/student/applications', icon: <FiCheckSquare /> }
  ];

  const adminLinks = [
    { label: 'Admin Dashboard', href: '/dashboard', icon: <FiGrid /> },
    { label: 'Manage Users', href: '/dashboard/admin/users', icon: <FiShield /> },
    { label: 'Reported Content', href: '/dashboard/admin/reports', icon: <FiAlertTriangle />, badge: 12 },
    { label: 'Add Notices', href: '/dashboard/admin/notices', icon: <FiPlusCircle /> },
    { label: 'Reunion & Events', href: '/dashboard/admin/reunion', icon: <FiCalendar /> }
  ];

  // Pick the correct nav links group
  const currentLinks = 
    userSession.role === 'admin' ? adminLinks : 
    userSession.role === 'alumni' ? alumniLinks : studentLinks;

  const handleLogout = () => {
    router.push('/signin');
  };

  const isActive = (path) => pathname === path;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 flex flex-col md:flex-row transition-colors duration-300">
      
      {/* MOBILE RESPONSIVE TOP HEADER */}
      <div className="md:hidden flex items-center justify-between bg-white dark:bg-zinc-900 px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 z-50">
        <span className="text-sm font-black tracking-wider uppercase bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          {userSession.role} Workspace
        </span>
        <button 
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400 focus:outline-none"
        >
          {isMobileOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
        </button>
      </div>

      {/* DETACHABLE SIDE NAVIGATION WORKSPACE BAR */}
      <aside className={`
        fixed inset-y-0 left-0 transform ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:relative md:flex flex-col w-64 lg:w-72 bg-white dark:bg-zinc-900 
        border-r border-zinc-200 dark:border-zinc-800 p-5 z-40 transition-transform duration-300 ease-in-out
      `}>
        {/* Profile Card Header Segment */}
        <div className="pb-5 mb-5 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center shadow-md">
              {userSession.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <h3 className="text-sm font-bold truncate text-zinc-900 dark:text-zinc-100">{userSession.name}</h3>
              <span className="inline-block px-2 py-0.5 mt-0.5 rounded text-[10px] uppercase tracking-wide font-extrabold bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                {userSession.role}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Mapping Route Block */}
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {currentLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                isActive(link.href)
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/15'
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

        {/* Fixed Sign Out Control Trigger */}
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left"
          >
            <FiLogOut className="text-base" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Screen Backdrop Glass Mask Layer for Mobile Drawer */}
      {isMobileOpen && (
        <div onClick={() => setIsMobileOpen(false)} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 md:hidden" />
      )}

      {/* DASHBOARD COMPONENT RENDER PORTAL */}
      <main className="flex-1 p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full overflow-x-hidden">
        {children}
      </main>

    </div>
  );
};

export default DashboardLayout;