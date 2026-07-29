'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { FiUsers, FiMapPin, FiBriefcase, FiCalendar, FiArrowRight, FiAward, FiShield, FiShieldOff, FiAlertTriangle } from 'react-icons/fi';
import { apiFetch } from '@/lib/api';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.9 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', stiffness: 100, damping: 16 }
  }
};

const gradientBgs = [
  'from-blue-600 to-indigo-700',
  'from-emerald-600 to-teal-700',
  'from-violet-600 to-purple-700',
  'from-rose-600 to-pink-700',
];

function SkeletonCard() {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 overflow-hidden animate-pulse">
      <div className="h-32 bg-slate-200" />
      <div className="p-5 space-y-3">
        <div className="flex justify-center -mt-12">
          <div className="w-20 h-20 rounded-full border-4 border-white bg-slate-200" />
        </div>
        <div className="space-y-2 text-center">
          <div className="h-4 bg-slate-200 rounded w-2/3 mx-auto" />
          <div className="h-3 bg-slate-100 rounded w-1/2 mx-auto" />
        </div>
        <div className="flex gap-2 justify-center pt-2">
          <div className="h-5 bg-slate-100 rounded w-20" />
          <div className="h-5 bg-slate-100 rounded w-24" />
        </div>
      </div>
    </div>
  );
}

export default function FeaturedAlumni() {
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAlumni = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/api/alumni-directory?limit=8');
      if (data.profiles) {
        setAlumni(data.profiles);
      } else {
        setError('Failed to load alumni');
      }
    } catch {
      setError('Unable to connect to server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlumni();
  }, [fetchAlumni]);

  return (
    <section className="relative py-20 sm:py-28 overflow-hidden bg-gradient-to-b from-slate-50 to-white">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.15, 1], rotate: [0, 45, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-1/3 -right-1/4 w-[35rem] h-[35rem] bg-gradient-to-br from-indigo-100/40 via-violet-100/20 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.1, 1, 1.1], rotate: [0, -60, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
          className="absolute -bottom-1/3 -left-1/4 w-[30rem] h-[30rem] bg-gradient-to-tr from-emerald-100/30 via-teal-100/20 to-transparent rounded-full blur-3xl"
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-slate-50/50 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200/60 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-5 shadow-sm">
            <FiAward className="w-3.5 h-3.5" />
            <span>Network Highlights</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Meet Our{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Featured Alumni
            </span>
          </h2>
          <p className="mt-3 text-slate-500 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            Connect with accomplished graduates who are shaping the industry worldwide.
          </p>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60"
          >
            <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
              <FiUsers className="w-8 h-8 text-rose-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-1">Unable to load alumni</h3>
            <p className="text-sm text-slate-400 mb-4">{error}</p>
            <button
              onClick={fetchAlumni}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-blue-600/20"
            >
              Try Again
            </button>
          </motion.div>
        )}

        {/* Empty */}
        {!loading && !error && alumni.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60"
          >
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <FiUsers className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-1">No alumni featured yet</h3>
            <p className="text-sm text-slate-400 mb-4">Alumni profiles will appear here once they join.</p>
            <Link
              href="/alumni-directory"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-blue-600/20"
            >
              Browse Directory <FiArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        )}

        {/* Alumni Grid */}
        {!loading && !error && alumni.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
          >
            {alumni.slice(0, 8).map((person, index) => (
              <motion.div
                key={person._id || index}
                variants={cardVariants}
                whileHover={{ y: -8, transition: { type: 'spring', stiffness: 200 } }}
                className="group relative bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-lg hover:shadow-2xl transition-shadow duration-500 overflow-hidden"
              >
                {/* Gradient hover overlay */}
                <div className={`absolute inset-0 bg-gradient-to-b ${gradientBgs[index % gradientBgs.length]} opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none`} />
                <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Cover Image */}
                <div className={`h-28 bg-gradient-to-br ${gradientBgs[index % gradientBgs.length]} relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/10" />
                  <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
                  <div className="absolute -top-4 -left-4 w-16 h-16 bg-white/5 rounded-full blur-xl" />
                </div>

                {/* Avatar */}
                <div className="relative flex justify-center -mt-10 mb-3">
                  <div className="relative">
                    <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${gradientBgs[index % gradientBgs.length]} opacity-0 group-hover:opacity-60 blur-md transition-opacity duration-500`} />
                    {person.profilePictureUrl ? (
                      <img
                        src={person.profilePictureUrl}
                        alt={person.fullName}
                        className="relative w-20 h-20 rounded-full border-4 border-white object-cover shadow-lg group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className={`relative w-20 h-20 rounded-full border-4 border-white bg-gradient-to-br ${gradientBgs[index % gradientBgs.length]} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                        <span className="text-2xl font-bold text-white">
                          {person.fullName?.charAt(0) || '?'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="px-5 pb-5 text-center">
                  <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                    {person.fullName}
                  </h3>
                  {person.verification && (
                    <span className={`inline-flex items-center gap-0.5 mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${
                      person.verification.badge === 'Verified' ? 'bg-emerald-50 text-emerald-600' :
                      person.verification.badge === 'Suspicious' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {person.verification.badge === 'Verified' ? <FiShield className="w-2.5 h-2.5" /> :
                       person.verification.badge === 'Suspicious' ? <FiShieldOff className="w-2.5 h-2.5" /> :
                       <FiAlertTriangle className="w-2.5 h-2.5" />}
                      {person.verification.trustScore}%
                    </span>
                  )}
                  {person.jobTitle && (
                    <p className="text-xs text-blue-600 font-semibold truncate mt-0.5">{person.jobTitle}</p>
                  )}
                  {person.organization && (
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{person.organization}</p>
                  )}

                  {/* Quick badges */}
                  <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
                    {person.graduationYear && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-semibold">
                        <FiCalendar className="w-2.5 h-2.5" />
                        {person.graduationYear}
                      </span>
                    )}
                    {person.currentLocation && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-semibold">
                        <FiMapPin className="w-2.5 h-2.5" />
                        {person.currentLocation.split(',')[0]}
                      </span>
                    )}
                    {person.degree && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-semibold">
                        {person.degree.includes('(') ? person.degree.split('(')[0].trim() : person.degree.split(' ').slice(0, 2).join(' ')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Hover link overlay */}
                <Link
                  href="/alumni-directory"
                  className="absolute inset-0 z-10"
                  aria-label={`View ${person.fullName}'s profile`}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* View All */}
        {!loading && !error && alumni.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center mt-10"
          >
            <Link
              href="/alumni-directory"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-600/20 hover:shadow-xl hover:shadow-indigo-600/30"
            >
              View All Alumni <FiArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}
