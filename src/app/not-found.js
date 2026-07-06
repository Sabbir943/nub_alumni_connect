"use client";
import React from 'react';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';

const NotFoundPage = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-white dark:bg-zinc-950 px-4 transition-colors duration-300">
      <div className="text-center space-y-8 max-w-lg">
        
        {/* Massive Neon Grid 404 Text */}
        <div className="relative select-none">
          <h1 className="text-[120px] md:text-[160px] font-black leading-none bg-gradient-to-b from-blue-600 via-indigo-600 to-zinc-200 dark:to-zinc-900 bg-clip-text text-transparent tracking-tighter">
            404
          </h1>
          <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-zinc-950 via-transparent to-transparent h-full w-full bottom-0" />
        </div>

        {/* Catchy Visual Subtext */}
        <div className="space-y-3">
          <h2 className="text-2xl md:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Looks like this link graduated.
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto text-sm md:text-base">
            The page you are looking for doesn&apos;t exist, or it skipped class and went off the grid.
          </p>
        </div>

        {/* Minimal High-Contrast Button */}
        <div className="pt-4">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-semibold px-6 py-3 rounded-xl shadow-lg transition-all duration-200 hover:-translate-y-0.5"
          >
            <FiArrowLeft className="w-4 h-4 stroke-[3]" />
            Back to Network
          </Link>
        </div>

      </div>
    </div>
  );
};

export default NotFoundPage;