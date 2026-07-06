"use client";
import React from 'react';
import Link from 'next/link';
import { FiGithub, FiLinkedin, FiMail, FiGlobe, FiChevronRight } from 'react-icons/fi';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const platformLinks = [
    { label: 'Home / Feed', href: '/' },
    { label: 'Alumni Directory', href: '/directory' },
    { label: 'Job Board', href: '/jobs' },
    { label: 'Notice Board', href: '/notices' },
  ];

  const communityLinks = [
    { label: 'Mentorship Program', href: '/mentorship' },
    { label: 'Discussion Forums', href: '/forums' },
    { label: 'Success Stories', href: '/stories' },
    { label: 'Contact Us', href: '/contact' },
  ];

  return (
    <footer className="bg-zinc-950 text-zinc-400 border-t border-zinc-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        
        {/* Main Grid Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          
          {/* Column 1: Brand & University Identity */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="text-xl font-black bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent tracking-wide">
              NUB Nexus
            </Link>
            <p className="text-sm text-zinc-500 leading-relaxed">
              The official networking and career acceleration ecosystem for current students and graduates of Northern University Bangladesh.
            </p>
            {/* Social Profile Links */}
            <div className="flex space-x-3 pt-2">
              <a href="https://github.com/Sabbir943" target="_blank" rel="noopener noreferrer" className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-all" aria-label="GitHub Profile">
                <FiGithub className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-blue-400 rounded-xl transition-all" aria-label="LinkedIn Network">
                <FiLinkedin className="w-4 h-4" />
              </a>
              <a href="mailto:support@nub.edu" className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 rounded-xl transition-all" aria-label="Email Support">
                <FiMail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Core Platform Utilities */}
          <div>
            <h3 className="text-sm font-bold text-zinc-200 tracking-wider uppercase mb-4">Platform</h3>
            <ul className="space-y-2.5 text-sm">
              {platformLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="flex items-center gap-1 hover:text-zinc-200 transition-colors group">
                    <FiChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-blue-500 transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Community Resource Ecosystem */}
          <div>
            <h3 className="text-sm font-bold text-zinc-200 tracking-wider uppercase mb-4">Community</h3>
            <ul className="space-y-2.5 text-sm">
              {communityLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="flex items-center gap-1 hover:text-zinc-200 transition-colors group">
                    <FiChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-blue-500 transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: University Info / Notice Hub Location */}
          <div className="space-y-3 text-sm">
            <h3 className="text-sm font-bold text-zinc-200 tracking-wider uppercase mb-4">Campus Hub</h3>
            <p className="text-zinc-500 leading-relaxed">
              Northern University Bangladesh<br />
              Department of Computer Science & Engineering (CSE)
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs text-zinc-500">
              <FiGlobe className="w-4 h-4 text-zinc-600" />
              <a href="https://nub.ac.bd" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-zinc-300">
                Official NUB Portal
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Metadata & Copyright Bar */}
        <div className="mt-12 pt-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-600">
          <p>© {currentYear} NUB Bridge. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with Next.js, Better Auth & Tailwind CSS
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;