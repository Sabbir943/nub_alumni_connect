'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { FiBriefcase, FiMapPin, FiClock, FiDollarSign, FiArrowRight, FiExternalLink } from 'react-icons/fi';
import { apiFetch } from '@/lib/api';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', stiffness: 100, damping: 18 }
  }
};

const tagColors = {
  'Full-time': 'bg-blue-50 text-blue-700 border-blue-200',
  'Part-time': 'bg-purple-50 text-purple-700 border-purple-200',
  'Contract': 'bg-amber-50 text-amber-700 border-amber-200',
  'Internship': 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const workplaceColors = {
  'On-site': 'bg-rose-50 text-rose-700 border-rose-200',
  'Remote': 'bg-teal-50 text-teal-700 border-teal-200',
  'Hybrid': 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

const gradientPairs = [
  'from-blue-500 to-cyan-500',
  'from-violet-500 to-purple-500',
  'from-emerald-500 to-teal-500',
  'from-rose-500 to-pink-500',
  'from-amber-500 to-orange-500',
  'from-indigo-500 to-blue-500',
];

function timeAgo(dateString) {
  if (!dateString) return '';
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function SkeletonCard() {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 overflow-hidden animate-pulse">
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-slate-200" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-slate-200 rounded w-3/4" />
            <div className="h-3 bg-slate-100 rounded w-1/2" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-6 bg-slate-100 rounded-md w-16" />
          <div className="h-6 bg-slate-100 rounded-md w-20" />
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-slate-100 rounded w-full" />
          <div className="h-3 bg-slate-100 rounded w-2/3" />
        </div>
        <div className="flex gap-2">
          <div className="h-5 bg-slate-100 rounded w-14" />
          <div className="h-5 bg-slate-100 rounded w-16" />
        </div>
      </div>
    </div>
  );
}

export default function LatestJobOpenings() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/api/jobs?limit=6');
      if (data.success) {
        setJobs(data.jobs);
      } else {
        setError('Failed to load jobs');
      }
    } catch {
      setError('Unable to connect to server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return (
    <section className="relative py-20 sm:py-28 overflow-hidden bg-white">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 -right-32 w-[28rem] h-[28rem] bg-blue-100/40 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-32 -left-32 w-[24rem] h-[24rem] bg-emerald-100/30 rounded-full blur-3xl"
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-50/60 via-transparent to-transparent" />
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
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 text-blue-700 text-xs font-bold uppercase tracking-wider mb-5 shadow-sm">
            <FiBriefcase className="w-3.5 h-3.5" />
            <span>Latest Opportunities</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Featured{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Job Openings
            </span>
          </h2>
          <p className="mt-3 text-slate-500 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            Exclusive opportunities posted by alumni and network members, updated daily.
          </p>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60"
          >
            <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
              <FiBriefcase className="w-8 h-8 text-rose-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-1">Unable to load jobs</h3>
            <p className="text-sm text-slate-400 mb-4">{error}</p>
            <button
              onClick={fetchJobs}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-blue-600/20"
            >
              Try Again
            </button>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && !error && jobs.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60"
          >
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <FiBriefcase className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-1">No openings yet</h3>
            <p className="text-sm text-slate-400 mb-4">Jobs posted by alumni will appear here.</p>
            <Link
              href="/job-portal"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-blue-600/20"
            >
              Browse All Jobs <FiArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        )}

        {/* Job Cards */}
        {!loading && !error && jobs.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          >
            {jobs.slice(0, 6).map((job, index) => (
              <motion.div
                key={job._id}
                variants={cardVariants}
                whileHover={{ y: -8, transition: { type: 'spring', stiffness: 200 } }}
                className="group relative flex flex-col bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-lg hover:shadow-2xl transition-shadow duration-500 overflow-hidden"
              >
                {/* Gradient hover overlay */}
                <div className={`absolute inset-0 bg-gradient-to-b ${gradientPairs[index % gradientPairs.length]} opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none`} />
                <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="p-5 flex flex-col flex-1 relative z-10">
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradientPairs[index % gradientPairs.length]} flex items-center justify-center shadow-md shrink-0`}>
                      <FiBriefcase className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                        {job.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium truncate">{job.company}</p>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {job.jobType && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-semibold border ${tagColors[job.jobType] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                        {job.jobType}
                      </span>
                    )}
                    {job.workplaceType && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-semibold border ${workplaceColors[job.workplaceType] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                        {job.workplaceType}
                      </span>
                    )}
                    {job.salary && (
                      <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <FiDollarSign className="w-2.5 h-2.5" />
                        {job.salary}
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <FiMapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{job.location || 'Location not specified'}</span>
                    </div>
                  </div>

                  {/* Skills */}
                  {job.skills && job.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {job.skills.slice(0, 3).map((skill, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium">
                          {skill}
                        </span>
                      ))}
                      {job.skills.length > 3 && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-medium">
                          +{job.skills.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <FiClock className="w-3 h-3" />
                      <span>{timeAgo(job.createdAt)}</span>
                    </div>
                    <Link
                      href={`/job-portal/${job._id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      Apply <FiExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* View All */}
        {!loading && !error && jobs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center mt-10"
          >
            <Link
              href="/job-portal"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30"
            >
              View All Jobs <FiArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}
