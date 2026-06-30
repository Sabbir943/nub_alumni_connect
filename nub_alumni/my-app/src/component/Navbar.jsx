"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { 
  FiMenu, FiX, FiBell, FiMessageSquare, 
  FiUser, FiLogOut, FiBriefcase, FiUsers, 
  FiCompass, FiBookOpen, FiGrid
} from 'react-icons/fi';

const Navbar = () => {
  // Mobile responsive menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // User profile dropdown state
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  /* 
    Better Auth Simulation:
    Change status to: 'guest', 'user' (Student/Alumni), or 'admin' to see the shift.
  */
  const [authState, setAuthState] = useState({
    status: 'user', // options: 'guest' | 'user' | 'admin'
    user: {
      name: 'Md Sabbir Ahmad',
      role: 'Student', // or 'Alumni'
      avatar: null // falling back to icon
    }
  });

  // Nav links mapping based on user state
  const guestLinks = [
    { label: 'Home', href: '/' },
    { label: 'Events', href: '/events' },
    { label: 'About Us', href: '/about' },
  ];

  const userLinks = [
    { label: 'Feed', href: '/feed', icon: <FiCompass /> },
    { label: 'Directory', href: '/directory', icon: <FiUsers /> },
    { label: 'Jobs', href: '/jobs', icon: <FiBriefcase /> },
    { label: 'Forums', href: '/forums', icon: <FiBookOpen /> },
  ];

  const adminLinks = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: <FiGrid /> },
    { label: 'Verify Users', href: '/admin/verify', icon: <FiUsers /> },
    { label: 'Notices', href: '/admin/notices', icon: <FiBookOpen /> },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* 1. BRAND LOGO */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
             NUB Bridge
            </Link>
          </div>

          {/* 2. DESKTOP NAVIGATION LINKS */}
          <div className="hidden md:flex space-x-1 items-center">
            {authState.status === 'guest' && guestLinks.map((link) => (
              <Link key={link.label} href={link.href} className="px-3 py-2 rounded-md text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
                {link.label}
              </Link>
            ))}

            {authState.status === 'user' && userLinks.map((link) => (
              <Link key={link.label} href={link.href} className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
                <span className="text-zinc-500">{link.icon}</span>
                {link.label}
              </Link>
            ))}

            {authState.status === 'admin' && adminLinks.map((link) => (
              <Link key={link.label} href={link.href} className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-zinc-900 transition-colors">
                <span>{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>

          {/* 3. RIGHT CONTROLS / AUTH BUTTONS */}
          <div className="hidden md:flex items-center space-x-4">
            {authState.status === 'guest' ? (
              <>
                <Link href="/signin" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-blue-600 transition-colors">
                  Sign In
                </Link>
                <Link href="/signup" className="text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition-all">
                  Register
                </Link>
              </>
            ) : (
              /* Authenticated actions */
              <div className="flex items-center space-x-3 relative">
                {/* Real-time Interactions */}
                <button className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full relative transition-colors">
                  <FiMessageSquare className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-blue-500 rounded-full ring-2 ring-white dark:ring-zinc-950"></span>
                </button>

                <button className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full relative transition-colors">
                  <FiBell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-zinc-950"></span>
                </button>

                {/* Profile Avatar Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-medium shadow-inner focus:outline-none"
                  >
                    {authState.user.avatar ? (
                      <img src={authState.user.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      authState.user.name.charAt(0)
                    )}
                  </button>

                  {/* Dropdown Menu block */}
                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-56 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl py-2 z-50">
                      <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{authState.user.name}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{authState.user.role}</p>
                      </div>
                      <Link href="/profile" className="flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                        <FiUser className="w-4 h-4" /> My Profile
                      </Link>
                      <button 
                        onClick={() => setAuthState({ status: 'guest', user: null })}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left"
                      >
                        <FiLogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 4. MOBILE HAMBURGER BUTTON */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 focus:outline-none"
            >
              {isMobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* 5. MOBILE DROPDOWN MENU */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 space-y-1 shadow-inner animate-fade-in">
          {authState.status === 'guest' && guestLinks.map((link) => (
            <Link key={link.label} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-base font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900">
              {link.label}
            </Link>
          ))}

          {authState.status === 'user' && userLinks.map((link) => (
            <Link key={link.label} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900">
              <span className="text-zinc-500">{link.icon}</span>
              {link.label}
            </Link>
          ))}

          {authState.status === 'admin' && adminLinks.map((link) => (
            <Link key={link.label} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-zinc-900">
              <span>{link.icon}</span>
              {link.label}
            </Link>
          ))}

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-2">
            {authState.status === 'guest' ? (
              <>
                <Link href="/signin" onClick={() => setIsMobileMenuOpen(false)} className="w-full text-center py-2.5 rounded-lg text-base font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900">
                  Sign In
                </Link>
                <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)} className="w-full text-center py-2.5 rounded-lg text-base font-medium bg-blue-600 text-white shadow-sm">
                  Register
                </Link>
              </>
            ) : (
              <button 
                onClick={() => { setAuthState({ status: 'guest', user: null }); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-base font-medium text-red-600 bg-red-50 dark:bg-red-950/20"
              >
                <FiLogOut /> Logout
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;