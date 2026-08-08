'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import {
  FiShield,
  FiShieldOff,
  FiAlertTriangle,
  FiZap,
  FiCpu,
  FiCheckCircle,
  FiClock,
  FiLink,
  FiExternalLink,
} from 'react-icons/fi';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

function Skeleton() {
  return (
    <div className="min-h-screen bg-[#f3f2ef]">
      <div className="max-w-5xl mx-auto px-4 py-6 animate-pulse">
        <div className="h-4 bg-white rounded w-48 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          <div className="space-y-2">
            <div className="bg-white rounded-lg p-6 space-y-4">
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-[#e0dfdc] rounded" />
                <div className="space-y-2 flex-1">
                  <div className="h-6 bg-[#e0dfdc] rounded w-3/4" />
                  <div className="h-4 bg-[#e0dfdc] rounded w-1/2" />
                  <div className="h-4 bg-[#e0dfdc] rounded w-1/3" />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-8 bg-[#e0dfdc] rounded w-24" />
                <div className="h-8 bg-[#e0dfdc] rounded w-24" />
              </div>
              <div className="space-y-2 pt-4">
                <div className="h-4 bg-[#e0dfdc] rounded w-full" />
                <div className="h-4 bg-[#e0dfdc] rounded w-5/6" />
                <div className="h-4 bg-[#e0dfdc] rounded w-4/6" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="bg-white rounded-lg p-6 space-y-4">
              <div className="h-5 bg-[#e0dfdc] rounded w-24" />
              <div className="h-12 bg-[#0a66c2]/10 rounded w-full" />
              <div className="space-y-3 pt-2">
                <div className="h-4 bg-[#e0dfdc] rounded" />
                <div className="h-4 bg-[#e0dfdc] rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotFound() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[#f3f2ef] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-5">
          <svg className="w-10 h-10 text-[#666]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-[#191919] mb-1">Job not found</h1>
        <p className="text-sm text-[#666] mb-6">This position may have been filled or removed.</p>
        <button onClick={() => router.push('/job-portal')} className="px-5 py-2.5 bg-[#0a66c2] hover:bg-[#004182] text-white text-sm font-semibold rounded-full transition-colors">
          Browse all jobs
        </button>
      </motion.div>
    </div>
  );
}

function JobTag({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-[#eaf3fd] text-[#0a66c2]',
    green: 'bg-[#e4f5e4] text-[#057642]',
    amber: 'bg-[#fff7e5] text-[#b65700]',
    purple: 'bg-[#f0e8ff] text-[#6f42c1]',
    rose: 'bg-[#ffe8e8] text-[#d11124]',
    teal: 'bg-[#e0f5f4] text-[#008a7a]',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded text-[11px] font-semibold ${variants[variant] || variants.default}`}>
      {children}
    </span>
  );
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id;

  const [job, setJob] = useState(null);
  const [similarJobs, setSimilarJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verification, setVerification] = useState(null);
  const fetchJob = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    setError(null);
    try {
      const [jobData, similarData] = await Promise.all([
        apiFetch(`/api/jobs/${jobId}`),
        apiFetch('/api/jobs?limit=6'),
      ]);

      if (jobData.success && jobData.job) {
        setJob(jobData.job);
        setVerification(jobData.job.verification || null);
        if (similarData.success) {

          const currentId = String(jobId);
    setSimilarJobs(similarData.jobs.filter((j) => String(j._id) !== currentId).slice(0, 4));
  }
      } else {
        setError(jobData.message || 'Job not found');
      }
    } catch {
      setError('Failed to connect to server.');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const formatDate = (d) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const timeAgo = (d) => {
    if (!d) return '';
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return formatDate(d);
  };

  const daysUntil = (d) => {
    if (!d) return null;
    return Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const isUrl = (v) => v && (v.startsWith('http://') || v.startsWith('https://'));

  const handleVerify = async () => {
    if (verifying || !job) return;
    setVerifying(true);
    try {
      const data = await apiFetch(`/api/jobs/verify/${job._id}`, { method: 'POST' });
      if (data.verification) {
        setVerification(data.verification);
        setJob((prev) => prev ? { ...prev, verification: data.verification } : prev);
      }
    } catch {
      // ignore
    } finally {
      setVerifying(false);
    }
  };

  if (loading) return <Skeleton />;
  if (error || !job) return <NotFound />;

  const deadlineDays = daysUntil(job.applicationDeadline);
  const expired = deadlineDays !== null && deadlineDays < 0;
  const urgent = deadlineDays !== null && deadlineDays >= 0 && deadlineDays <= 7;

  const jobTypeColor = {
    'Full-time': 'green',
    'Part-time': 'purple',
    'Contract': 'amber',
    'Internship': 'teal',
    'On-site': 'rose',
    'Remote': 'teal',
    'Hybrid': 'purple',
  };

  return (
    <div className="min-h-screen bg-[#f3f2ef]">
      {/* Top banner bar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border-b border-[#e0dfdc] sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => router.push('/job-portal')} className="flex items-center gap-2 text-sm font-semibold text-[#666] hover:text-[#191919] transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back to jobs
          </button>
        </div>
      </motion.div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

          {/* LEFT COLUMN */}
          <div className="space-y-2">

            {/* Job Header Card */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" className="bg-white rounded-lg border border-[#e0dfdc] p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-[#0a66c2] to-[#004182] flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-sm">
                  {job.company?.charAt(0) || 'C'}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-[#191919] leading-tight">{job.title}</h1>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-sm text-[#666]">
                    <span className="font-semibold text-[#191919] hover:text-[#0a66c2] cursor-pointer">{job.company}</span>
                    <span className="hidden sm:inline text-[#bfbfbf]">&middot;</span>
                    <span>{job.location}</span>
                    <span className="hidden sm:inline text-[#bfbfbf]">&middot;</span>
                    <span>{timeAgo(job.createdAt)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <JobTag variant={jobTypeColor[job.jobType] || 'default'}>{job.jobType}</JobTag>
                    <JobTag variant={jobTypeColor[job.workplaceType] || 'default'}>{job.workplaceType}</JobTag>
                    {job.salary && <JobTag variant="amber">{job.salary}</JobTag>}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Quick Stats Bar */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" className="bg-white rounded-lg border border-[#e0dfdc] p-4">
              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <span className="text-[#666] text-xs">Employment</span>
                  <p className="font-semibold text-[#191919]">{job.jobType}</p>
                </div>
                <div>
                  <span className="text-[#666] text-xs">Workplace</span>
                  <p className="font-semibold text-[#191919]">{job.workplaceType}</p>
                </div>
                <div>
                  <span className="text-[#666] text-xs">Location</span>
                  <p className="font-semibold text-[#191919]">{job.location}</p>
                </div>
                {job.salary && (
                  <div>
                    <span className="text-[#666] text-xs">Salary</span>
                    <p className="font-semibold text-[#191919]">{job.salary}</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Company Section */}
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="bg-white rounded-lg border border-[#e0dfdc] overflow-hidden">
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0a66c2] to-[#004182] flex items-center justify-center text-white text-sm font-bold">
                    {job.company?.charAt(0) || 'C'}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#191919] text-sm">About the company</h3>
                    <p className="text-xs text-[#666]">{job.company} &middot; Alumni Network</p>
                  </div>
                </div>
                <p className="text-sm text-[#666] leading-relaxed">
                  {job.company} is looking for talented professionals through the NUB Alumni Connect network.
                </p>
              </div>
            </motion.div>

            {/* Description */}
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="bg-white rounded-lg border border-[#e0dfdc] overflow-hidden">
              <div className="p-5">
                <h3 className="font-bold text-[#191919] mb-3">About the job</h3>
                <div className="text-sm text-[#666] leading-[1.7] whitespace-pre-wrap">
                  {job.description || 'No description provided.'}
                </div>
              </div>
            </motion.div>

            {/* Requirements */}
            {job.requirements && (
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="bg-white rounded-lg border border-[#e0dfdc] overflow-hidden">
                <div className="p-5">
                  <h3 className="font-bold text-[#191919] mb-3">Qualifications</h3>
                  <div className="text-sm text-[#666] leading-[1.7] whitespace-pre-wrap">{job.requirements}</div>
                </div>
              </motion.div>
            )}

            {/* Skills */}
            {job.skills && job.skills.length > 0 && (
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="bg-white rounded-lg border border-[#e0dfdc] overflow-hidden">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-[#191919]">Skills</h3>
                    <span className="text-xs text-[#666]">{job.skills.length} skill{job.skills.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.04 }}
                        whileHover={{ scale: 1.05 }}
                        className="px-3 py-1.5 rounded-full bg-[#eaf3fd] text-[#0a66c2] text-xs font-semibold hover:shadow-sm transition-shadow cursor-default"
                      >
                        {skill}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Similar Jobs */}
            {similarJobs.length > 0 && (
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="bg-white rounded-lg border border-[#e0dfdc] overflow-hidden">
                <div className="p-5">
                  <h3 className="font-bold text-[#191919] mb-4">Similar jobs</h3>
                  <div className="space-y-3">
                    {similarJobs.map((sj, i) => (
                      <motion.div key={sj._id} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                        <Link href={`/job-portal/${sj._id}`} className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#f3f2ef] transition-colors group">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0a66c2] to-[#004182] flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {sj.company?.charAt(0) || 'C'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-[#191919] group-hover:text-[#0a66c2] transition-colors truncate">{sj.title}</p>
                            <p className="text-xs text-[#666] truncate">{sj.company} &middot; {sj.location}</p>
                            <div className="flex gap-1.5 mt-1">
                              {sj.jobType && <span className="text-[10px] font-semibold text-[#666]">{sj.jobType}</span>}
                              {sj.workplaceType && <><span className="text-[#bfbfbf] text-[10px]">&middot;</span><span className="text-[10px] font-semibold text-[#666]">{sj.workplaceType}</span></>}
                            </div>
                          </div>
                          <svg className="w-4 h-4 text-[#bfbfbf] mt-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </Link>
                        {i < similarJobs.length - 1 && <div className="h-px bg-[#e0dfdc] ml-12" />}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-2">

            {/* Apply Card */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" className="bg-white rounded-lg border border-[#e0dfdc] overflow-hidden">
              <div className="p-5">
                <h3 className="font-bold text-[#191919] text-sm mb-4">Apply now</h3>

                {job.applicationDeadline && (
                  <div className={`mb-4 p-3 rounded-lg border text-sm ${
                    expired ? 'bg-[#fff5f5] border-[#ffd5d5]' : urgent ? 'bg-[#fffdf5] border-[#ffe6a8]' : 'bg-[#fafafa] border-[#e0dfdc]'
                  }`}>
                    <div className="flex items-center gap-2">
                      <svg className={`w-4 h-4 ${expired ? 'text-[#d11124]' : urgent ? 'text-[#b65700]' : 'text-[#666]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                      <span className={`font-semibold text-xs ${expired ? 'text-[#d11124]' : urgent ? 'text-[#b65700]' : 'text-[#666]'}`}>
                        {expired ? 'Deadline passed' : urgent ? `${deadlineDays} day${deadlineDays !== 1 ? 's' : ''} left to apply` : formatDate(job.applicationDeadline)}
                      </span>
                    </div>
                  </div>
                )}

                {job.applicationUrlOrEmail ? (isUrl(job.applicationUrlOrEmail) ? (
                  <motion.a whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    href={job.applicationUrlOrEmail} target="_blank" rel="noopener noreferrer"
                    onClick={(e) => expired && e.preventDefault()}
                    className={`w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                      expired ? 'bg-[#e0dfdc] text-[#999] cursor-not-allowed' : 'bg-[#0a66c2] hover:bg-[#004182] text-white shadow-sm'
                    }`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
                    </svg>
                    {expired ? 'No longer accepting' : 'Apply on external site'}
                  </motion.a>
                ) : (
                  <motion.a whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    href={`mailto:${job.applicationUrlOrEmail}?subject=Application for ${encodeURIComponent(job.title)} at ${encodeURIComponent(job.company)}`}
                    onClick={(e) => expired && e.preventDefault()}
                    className={`w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                      expired ? 'bg-[#e0dfdc] text-[#999] cursor-not-allowed' : 'bg-[#0a66c2] hover:bg-[#004182] text-white shadow-sm'
                    }`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                    {expired ? 'No longer accepting' : 'Apply via email'}
                  </motion.a>
                )) : (
                  <button disabled className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#e0dfdc] text-[#999] text-sm font-bold cursor-not-allowed">
                    No application link
                  </button>
                )}

                {job.applicationUrlOrEmail && (
                  <div className="mt-3 p-3 bg-[#fafafa] rounded-lg border border-[#e0dfdc]">
                    <p className="text-[10px] text-[#666] font-semibold uppercase tracking-wider">Contact</p>
                    <p className="text-xs text-[#191919] font-medium break-all">{job.applicationUrlOrEmail}</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* AI Verification Card */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" className="bg-white rounded-lg border border-[#e0dfdc] overflow-hidden">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[#191919] text-sm flex items-center gap-2">
                    <FiShield className="w-4 h-4 text-[#0a66c2]" />
                    AI Verification
                  </h3>
                  <button
                    onClick={handleVerify}
                    disabled={verifying}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold border border-dashed border-[#0a66c2]/30 bg-[#eaf3fd] text-[#0a66c2] hover:bg-[#d6e8fa] hover:border-[#0a66c2]/50 disabled:opacity-50 transition-all"
                  >
                    {verifying ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                        <FiCpu className="w-3 h-3" />
                      </motion.div>
                    ) : (
                      <FiZap className="w-3 h-3" />
                    )}
                    {verification ? 'Re-verify' : 'Verify with AI'}
                  </button>
                </div>

                {verification ? (
                  <div>
                    {/* Badge & Score */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {verification.badge === 'Verified' ? (
                          <FiCheckCircle className="w-5 h-5 text-[#057642]" />
                        ) : verification.badge === 'Suspicious' ? (
                          <FiShieldOff className="w-5 h-5 text-[#d11124]" />
                        ) : (
                          <FiAlertTriangle className="w-5 h-5 text-[#b65700]" />
                        )}
                        <span className={`text-sm font-bold ${
                          verification.badge === 'Verified' ? 'text-[#057642]' :
                          verification.badge === 'Suspicious' ? 'text-[#d11124]' : 'text-[#b65700]'
                        }`}>
                          {verification.badge}
                        </span>
                      </div>
                      <span className="text-lg font-extrabold text-[#191919]">{verification.trustScore}%</span>
                    </div>

                    {/* Score Bar */}
                    <div className="w-full h-2 bg-[#f3f2ef] rounded-full overflow-hidden mb-3">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${verification.trustScore}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={`h-full rounded-full ${
                          verification.trustScore >= 70 ? 'bg-[#057642]' :
                          verification.trustScore >= 40 ? 'bg-[#b65700]' : 'bg-[#d11124]'
                        }`}
                      />
                    </div>

                    {/* Link Status */}
                    {verification.linkStatus && (
                      <div className={`p-2.5 rounded-lg mb-3 text-xs font-medium flex items-center gap-2 ${
                        verification.linkStatus === 'valid' ? 'bg-[#e4f5e4] text-[#057642]' :
                        verification.linkStatus === 'invalid' ? 'bg-[#ffe8e8] text-[#d11124]' :
                        verification.linkStatus === 'email' ? 'bg-[#eaf3fd] text-[#0a66c2]' :
                        'bg-[#f3f2ef] text-[#666]'
                      }`}>
                        <FiLink className="w-3.5 h-3.5" />
                        {verification.linkDetail || verification.linkStatus}
                      </div>
                    )}

                    {/* Breakdown */}
                    {verification.breakdown && (
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {Object.entries(verification.breakdown).map(([key, val]) => (
                          <div key={key} className="flex justify-between text-[10px] text-[#666]">
                            <span className="capitalize">{key}</span>
                            <span className="font-semibold">{val}/25</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Analysis */}
                    {verification.analysis && (
                      <p className="text-xs text-[#666] leading-relaxed mb-2">{verification.analysis}</p>
                    )}

                    {/* Flags */}
                    {verification.flags && verification.flags.length > 0 && (
                      <div className="space-y-1">
                        {verification.flags.map((flag, i) => (
                          <p key={i} className="text-[10px] text-[#b65700] flex items-start gap-1">
                            <FiAlertTriangle className="w-2.5 h-2.5 mt-0.5 flex-shrink-0" />
                            {flag}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* AI Powered Label */}
                    <div className="flex items-center justify-center gap-1 mt-3 pt-3 border-t border-[#e0dfdc]">
                      <FiZap className="w-2.5 h-2.5 text-[#0a66c2]" />
                      <span className="text-[9px] text-[#999] font-medium uppercase tracking-wider">Powered by AI</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <FiShield className="w-8 h-8 text-[#e0dfdc] mx-auto mb-2" />
                    <p className="text-xs text-[#666]">Click verify to analyze this job posting</p>
                    <p className="text-[10px] text-[#999] mt-1">AI checks link validity, completeness & quality</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Company Card */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" className="bg-white rounded-lg border border-[#e0dfdc] overflow-hidden">
              <div className="p-5">
                <h3 className="font-bold text-[#191919] text-sm mb-4">About the company</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#0a66c2] to-[#004182] flex items-center justify-center text-white text-lg font-bold shadow-sm">
                    {job.company?.charAt(0) || 'C'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[#191919] text-sm truncate">{job.company}</p>
                    <p className="text-xs text-[#666]">Alumni Network</p>
                  </div>
                </div>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[#666] text-xs">Industry</span>
                    <span className="font-semibold text-[#191919] text-xs">Technology</span>
                  </div>
                  <div className="h-px bg-[#e0dfdc]" />
                  <div className="flex items-center justify-between">
                    <span className="text-[#666] text-xs">Company size</span>
                    <span className="font-semibold text-[#191919] text-xs">NUB Alumni</span>
                  </div>
                  <div className="h-px bg-[#e0dfdc]" />
                  <div className="flex items-center justify-between">
                    <span className="text-[#666] text-xs">Posted by</span>
                    <span className="font-semibold text-[#191919] text-xs truncate max-w-[140px]">{job.postedBy || 'Anonymous'}</span>
                  </div>
                </div>
                <Link href="/job-portal" className="mt-4 w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-full border border-[#0a66c2] text-[#0a66c2] text-sm font-semibold hover:bg-[#eaf3fd] transition-colors">
                  View all jobs
                </Link>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}
