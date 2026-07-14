"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  FiMenu, FiX, FiBell, FiMessageSquare, 
  FiUser, FiLogOut, FiBriefcase, FiUsers, 
  FiCompass, FiBookOpen, FiGrid, FiMail
} from 'react-icons/fi';
import { authClient } from '@/lib/auth-client';
import toast from 'react-hot-toast';

const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  
  const { 
    data: session, 
    isPending, 
    error, 
    refetch 
  } = authClient.useSession();
  
  const user = session?.user;
  console.log(user)

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push('/');
    toast.success('Successfully logged out');
  };

  // 1. PUBLIC LINKS (Visible to all visitors)
  const publicLinks = [
    { label: 'Home', href: '/', icon: <FiCompass /> },
    { label: 'Alumni Directory', href: '/alumni-directory', icon: <FiUsers /> },
    { label: 'Contact Us', href: '/contact', icon: <FiMail /> },
  ];

  // 2. PRIVATE LINKS (Visible ONLY to logged-in students/alumni/admins)
  const privateLinks = [
    { label: 'Job Board', href: '/jobs', icon: <FiBriefcase /> },
    { label: 'Notice Board', href: '/notices', icon: <FiBookOpen /> },
  ];

  // Utility to match styling on active links
  const isActive = (path) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* BRAND LOGO */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-wide">
              NUB Bridge
            </Link>
          </div>

          {/* DESKTOP NAV LINKS */}
          <div className="hidden md:flex space-x-1 items-center">
            {/* Render Public Links */}
            {publicLinks.map((link) => (
              <Link 
                key={link.label} 
                href={link.href} 
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.href) 
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400" 
                    : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                }`}
              >
                <span className="text-zinc-400 dark:text-zinc-500">{link.icon}</span>
                {link.label}
              </Link>
            ))}

            {/* Conditionally Render Private Links if Authenticated */}
            {user && privateLinks.map((link) => (
              <Link 
                key={link.label} 
                href={link.href} 
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.href) 
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400" 
                    : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                }`}
              >
                <span className="text-zinc-400 dark:text-zinc-500">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>

          {/* RIGHT SIDE CONDITIONAL ENDING */}
          <div className="hidden md:flex items-center space-x-4">
            {!user ? (
              /* LOGGED OUT STATE */
              <div className="flex items-center gap-3">
                <Link href="/signin" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-blue-600 transition-colors">
                  Login
                </Link>
                <Link href="/signup" className="text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition-all hover:shadow-blue-500/10">
                  Get Started
                </Link>
              </div>
            ) : (
              /* LOGGED IN STATE */
              <div className="flex items-center space-x-3 relative">
                
                {/* Real-time Interaction Badges */}
              
                {user?.role?.toLowerCase() === 'student' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-md font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    Student
                  </span>
                )}
                {user?.role?.toLowerCase() === 'alumni' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-md font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Alumni
                  </span>
                )}

                {/* Avatar & Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-semibold text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950 transition-all"
                  >
                    {user?.image ? (
                      <img src={user?.image} alt="Profile" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      user?.name?.charAt(0)
                    )}
                  </button>

                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-56 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl py-2 z-50">
                      <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{user?.name}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 capitalize">{user?.role}</p>
                      </div>
                      
                      <Link href="/profile" className="flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                        <FiUser className="w-4 h-4 text-zinc-400" /> My Profile
                      </Link>
                      
                      <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                        <FiGrid className="w-4 h-4 text-zinc-400" /> Dashboard
                      </Link>

                      <div className="border-t border-zinc-100 dark:border-zinc-800 mt-1">
                        <button 
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left"
                        >
                          <FiLogOut className="w-4 h-4" /> Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

          {/* MOBILE MENU TOGGLE */}
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

      {/* MOBILE EXPANDED MENU */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 space-y-1 shadow-lg">
          {/* Public Mobile Links */}
          {publicLinks.map((link) => (
            <Link 
              key={link.label} 
              href={link.href} 
              onClick={() => setIsMobileMenuOpen(false)} 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium ${
                isActive(link.href) 
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400" 
                  : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              }`}
            >
              <span className="text-zinc-400">{link.icon}</span>
              {link.label}
            </Link>
          ))}

          {/* Private Mobile Links */}
          {user && privateLinks.map((link) => (
            <Link 
              key={link.label} 
              href={link.href} 
              onClick={() => setIsMobileMenuOpen(false)} 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium ${
                isActive(link.href) 
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400" 
                  : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              }`}
            >
              <span className="text-zinc-400">{link.icon}</span>
              {link.label}
            </Link>
          ))}

          {/* Mobile Conditional Ending Section */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-2">
            {!user ? (
              <>
                <Link href="/signin" onClick={() => setIsMobileMenuOpen(false)} className="w-full text-center py-2.5 rounded-lg text-base font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900">
                  Login
                </Link>
                <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)} className="w-full text-center py-2.5 rounded-lg text-base font-medium bg-blue-600 text-white shadow-sm">
                  Sign Up
                </Link>
              </>
            ) : (
              <div className="space-y-1">
                {/* Mobile Identity Badge Display */}
                <div className="px-3 py-2 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 mb-2">
                  <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Signed in as:</span>
                  {user?.role?.toLowerCase() === 'student' && (
                    <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">Student</span>
                  )}
                  {user?.role?.toLowerCase() === 'alumni' && (
                    <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">Alumni</span>
                  )}
                </div>

                <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900">
                  <FiUser className="text-zinc-400" /> My Profile
                </Link>
                <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900">
                  <FiGrid className="text-zinc-400" /> Dashboard
                </Link>
                <button 
                  onClick={() => { 
                    handleSignOut(); // Fixed execution bug here!
                    setIsMobileMenuOpen(false); 
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 mt-2 rounded-lg text-base font-medium text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400"
                >
                  <FiLogOut /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;