"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch,
  FiMapPin,
  FiBriefcase,
  FiCalendar,
  FiDollarSign,
  FiClock,
  FiExternalLink,
  FiFilter,
  FiX,
  FiRefreshCw,
  FiChevronDown,
  FiShield,
  FiShieldOff,
  FiAlertTriangle,
  FiZap,
  FiCpu,
} from "react-icons/fi";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 260, damping: 20 },
  },
};

const heroVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden animate-pulse">
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-zinc-200" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-zinc-200 rounded w-3/4" />
            <div className="h-3 bg-zinc-100 rounded w-1/2" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-6 bg-zinc-100 rounded-md w-16" />
          <div className="h-6 bg-zinc-100 rounded-md w-20" />
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-zinc-100 rounded w-full" />
          <div className="h-3 bg-zinc-100 rounded w-2/3" />
        </div>
        <div className="flex gap-1.5">
          <div className="h-5 bg-zinc-100 rounded w-14" />
          <div className="h-5 bg-zinc-100 rounded w-16" />
          <div className="h-5 bg-zinc-100 rounded w-12" />
        </div>
      </div>
    </div>
  );
}

function FilterDropdown({ icon, options, value, onChange, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = React.useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
          value !== "All"
            ? "bg-blue-50 border-blue-300 text-blue-700"
            : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
        }`}
      >
        <span className="text-zinc-400">{icon}</span>
        <span className="truncate max-w-[120px]">{value === "All" ? placeholder : value}</span>
        <FiChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-56 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 overflow-hidden"
          >
            <div className="p-2 max-h-60 overflow-y-auto">
              <button
                onClick={() => { onChange("All"); setIsOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  value === "All" ? "bg-blue-50 text-blue-700 font-medium" : "text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                All {placeholder}
              </button>
              {options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => { onChange(opt); setIsOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    value === opt ? "bg-blue-50 text-blue-700 font-medium" : "text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DeadlineCountdown({ deadline }) {
  const [timeLeft, setTimeLeft] = React.useState(null);

  React.useEffect(() => {
    if (!deadline) return;
    function calc() {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) return { expired: true, text: "Deadline passed", urgent: true, percent: 0, color: 'red' };
      const totalDays = 30;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const percent = Math.min(100, Math.max(2, (diff / (totalDays * 24 * 60 * 60 * 1000)) * 100));
      if (days > 7) return { expired: false, text: `${days} days remaining`, urgent: false, percent, color: 'green' };
      if (days > 0) return { expired: false, text: `${days}d ${hours}h remaining`, urgent: days <= 2, percent, color: days <= 2 ? 'amber' : 'green' };
      if (hours > 0) return { expired: false, text: `${hours}h ${mins}m remaining`, urgent: true, percent, color: 'amber' };
      return { expired: false, text: `${mins}m remaining`, urgent: true, percent: 2, color: 'red' };
    }
    setTimeLeft(calc());
    const interval = setInterval(() => setTimeLeft(calc()), 60000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (!timeLeft) return null;

  const barColors = {
    green: 'from-emerald-400 to-emerald-500',
    amber: 'from-amber-400 to-orange-500',
    red: 'from-red-400 to-red-500',
  };

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${
          timeLeft.expired ? 'text-red-500' : timeLeft.urgent ? 'text-amber-600' : 'text-emerald-600'
        }`}>
          {timeLeft.expired ? '⏰ Expired' : '⏱ Apply Now'}
        </span>
        <span className={`text-[10px] font-bold ${
          timeLeft.expired ? 'text-red-500' : timeLeft.urgent ? 'text-amber-600' : 'text-emerald-600'
        }`}>
          {timeLeft.text}
        </span>
      </div>
      <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${timeLeft.percent}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full bg-gradient-to-r ${barColors[timeLeft.color]}`}
        />
      </div>
    </div>
  );
}

function TrustScoreRing({ score, size = 32 }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={3} />
        <motion.circle
          cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[8px] font-extrabold" style={{ color }}>{score}</span>
      </div>
    </div>
  );
}

function JobVerificationBadge({ verification }) {
  if (!verification) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-50 border border-zinc-200 border-dashed">
        <FiShield className="w-3 h-3 text-zinc-400" />
        <span className="text-[10px] font-semibold text-zinc-400">Not verified</span>
      </div>
    );
  }

  const { badge, trustScore, linkStatus } = verification;
  const config = {
    Verified: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', glow: 'shadow-emerald-100', label: 'AI Verified' },
    Unverified: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', glow: 'shadow-amber-100', label: 'Needs Review' },
    Suspicious: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', glow: 'shadow-red-100', label: 'Suspicious' },
  };
  const c = config[badge] || config.Unverified;

  return (
    <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${c.bg} border ${c.border} shadow-sm ${c.glow}`}>
      <TrustScoreRing score={trustScore} size={28} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <FiZap className="w-3 h-3 text-blue-500" />
          <span className={`text-[10px] font-bold ${c.text}`}>{c.label}</span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          {linkStatus === 'valid' && (
            <span className="text-[9px] font-semibold text-emerald-600 flex items-center gap-0.5">
              <FiCheckCircle className="w-2.5 h-2.5" /> Link OK
            </span>
          )}
          {linkStatus === 'invalid' && (
            <span className="text-[9px] font-semibold text-red-500 flex items-center gap-0.5">
              <FiAlertTriangle className="w-2.5 h-2.5" /> Link broken
            </span>
          )}
          {linkStatus === 'email' && (
            <span className="text-[9px] font-semibold text-blue-500">Email only</span>
          )}
        </div>
      </div>
    </div>
  );
}

function JobCard({ job, onVerified }) {
  const [verifying, setVerifying] = React.useState(false);
  const [verification, setVerification] = React.useState(job.verification || null);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const timeAgo = (dateString) => {
    if (!dateString) return "";
    const diff = Date.now() - new Date(dateString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return formatDate(dateString);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (verifying) return;
    setVerifying(true);
    try {
      const data = await apiFetch(`/api/jobs/verify/${job._id}`, { method: 'POST' });
      if (data.verification) {
        setVerification(data.verification);
        if (onVerified) onVerified(job._id, data.verification);
      }
    } catch {
      // ignore
    } finally {
      setVerifying(false);
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:shadow-xl hover:shadow-zinc-200/50 transition-shadow duration-300 flex flex-col"
    >
      {/* AI Verification Strip */}
      <div className={`px-4 py-2 flex items-center justify-between ${
        verification?.badge === 'Verified' ? 'bg-gradient-to-r from-emerald-500 to-green-500' :
        verification?.badge === 'Suspicious' ? 'bg-gradient-to-r from-red-500 to-rose-500' :
        verification?.badge === 'Unverified' ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
        'bg-gradient-to-r from-zinc-100 to-zinc-200'
      }`}>
        <div className="flex items-center gap-1.5">
          {verification ? (
            <>
              <FiZap className={`w-3.5 h-3.5 ${verification.badge === 'Verified' ? 'text-white' : verification.badge === 'Suspicious' ? 'text-white' : 'text-white'}`} />
              <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                {verification.badge === 'Verified' ? 'AI Verified' :
                 verification.badge === 'Suspicious' ? 'Flagged by AI' : 'Under AI Review'}
              </span>
              <span className="text-[10px] font-bold text-white/80">({verification.trustScore}%)</span>
            </>
          ) : (
            <>
              <FiShield className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Click to AI Verify</span>
            </>
          )}
        </div>
        {verification && (
          <TrustScoreRing score={verification.trustScore} size={26} />
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-md shrink-0">
            <FiBriefcase className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-zinc-900 truncate">{job.title}</h3>
            <p className="text-xs text-zinc-500 font-medium truncate">{job.company}</p>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
            {job.jobType}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
            {job.workplaceType}
          </span>
          {job.salary && (
            <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-100">
              <FiDollarSign className="w-2.5 h-2.5" />
              {job.salary}
            </span>
          )}
        </div>

        {/* Details */}
        <div className="mt-3 space-y-1.5 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <FiMapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="truncate">{job.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <FiCalendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span>Deadline: {formatDate(job.applicationDeadline)}</span>
          </div>
          <DeadlineCountdown deadline={job.applicationDeadline} />
        </div>

        {/* Skills */}
        {job.skills && job.skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {job.skills.slice(0, 4).map((skill, i) => (
              <span key={i} className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 text-[10px] font-medium">
                {skill}
              </span>
            ))}
            {job.skills.length > 4 && (
              <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-500 text-[10px] font-medium">
                +{job.skills.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-zinc-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1 text-[11px] text-zinc-400">
              <FiClock className="w-3 h-3" />
              <span>{timeAgo(job.createdAt)}</span>
            </div>
            <Link
              href={`/job-portal/${job?._id}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              View Details <FiExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleVerify}
            disabled={verifying}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold transition-all duration-300 bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-60"
          >
            {verifying ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                  <FiCpu className="w-3.5 h-3.5" />
                </motion.div>
                <span>AI is analyzing this job...</span>
                <motion.div className="w-12 h-1 bg-white/30 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-white rounded-full"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </motion.div>
              </>
            ) : verification ? (
              <>
                <FiRefreshCw className="w-3.5 h-3.5" />
                Re-verify with AI
              </>
            ) : (
              <>
                <FiZap className="w-3.5 h-3.5" />
                Verify this job with AI
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default function JobPortalPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [jobType, setJobType] = useState("All");
  const [workplaceType, setWorkplaceType] = useState("All");
  const [postedDateFilter, setPostedDateFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);
      if (jobType !== "All") params.set("jobType", jobType);
      if (workplaceType !== "All") params.set("workplaceType", workplaceType);
      params.set("limit", "50");

      const data = await apiFetch(`/api/jobs?${params.toString()}`);
      if (data.success) {
        setJobs(data.jobs);
      }
    } catch (err) {
      console.error("Error loading jobs:", err);
      setError("Failed to connect to server. Please make sure the backend is running on port 5000.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, jobType, workplaceType]);

  useEffect(() => {
    const timer = setTimeout(() => fetchJobs(), 300);
    return () => clearTimeout(timer);
  }, [fetchJobs]);

  useEffect(() => {
    setSearchTerm("");
    setJobType("All");
    setWorkplaceType("All");
    setPostedDateFilter("all");
  }, []);

  const handleVerifyComplete = (jobId, verification) => {
    setJobs((prev) => prev.map((j) => j._id === jobId ? { ...j, verification } : j));
  };

  const filteredJobs = jobs.filter((job) => {
    if (postedDateFilter === "all") return true;
    const diff = (Date.now() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (postedDateFilter === "24h") return diff <= 1;
    if (postedDateFilter === "7d") return diff <= 7;
    if (postedDateFilter === "30d") return diff <= 30;
    return true;
  });

  const hasActiveFilters = jobType !== "All" || workplaceType !== "All" || postedDateFilter !== "all";

  return (
    <div className="min-h-screen bg-zinc-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero */}
        <motion.div variants={heroVariants} initial="hidden" animate="visible" className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold tracking-wide uppercase mb-4"
          >
            <FiBriefcase className="w-3.5 h-3.5" />
            Career Portal
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-900 tracking-tight">
            Alumni{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Job Portal
            </span>
          </h1>
          <p className="mt-3 text-zinc-500 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Discover opportunities posted directly by fellow alumni and network members.
          </p>
        </motion.div>

        {/* Search & Filters */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-zinc-200 space-y-4">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by title, company, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
                showFilters || hasActiveFilters
                  ? "bg-blue-50 border-blue-300 text-blue-700"
                  : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
              }`}
            >
              <FiFilter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                  {[jobType, workplaceType, postedDateFilter].filter((v) => v !== "All" && v !== "all").length}
                </span>
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={() => { setJobType("All"); setWorkplaceType("All"); setPostedDateFilter("all"); }}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors font-medium"
              >
                <FiRefreshCw className="w-3.5 h-3.5" />
                Clear All
              </button>
            )}
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-3 pt-2">
                  <FilterDropdown
                    icon={<FiBriefcase className="w-4 h-4" />}
                    options={["Full-time", "Part-time", "Contract", "Internship"]}
                    value={jobType}
                    onChange={setJobType}
                    placeholder="Job Type"
                  />
                  <FilterDropdown
                    icon={<FiMapPin className="w-4 h-4" />}
                    options={["On-site", "Remote", "Hybrid"]}
                    value={workplaceType}
                    onChange={setWorkplaceType}
                    placeholder="Workplace"
                  />
                  <FilterDropdown
                    icon={<FiClock className="w-4 h-4" />}
                    options={["24h", "7d", "30d"]}
                    value={postedDateFilter}
                    onChange={setPostedDateFilter}
                    placeholder="Posted Date"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results Count */}
        {!loading && (
          <p className="text-sm text-zinc-500">
            {filteredJobs.length === 0
              ? "No jobs found"
              : `Showing ${filteredJobs.length} job${filteredJobs.length !== 1 ? "s" : ""}`}
          </p>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 bg-white rounded-2xl border border-rose-200"
          >
            <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
              <FiRefreshCw className="w-10 h-10 text-rose-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-700 mb-1">Connection Error</h3>
            <p className="text-sm text-zinc-500 mb-4 max-w-md mx-auto">{error}</p>
            <button
              onClick={fetchJobs}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Try Again
            </button>
          </motion.div>
        )}

        {/* Empty */}
        {!loading && filteredJobs.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 bg-white rounded-2xl border border-zinc-200"
          >
            <div className="w-20 h-20 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4">
              <FiBriefcase className="w-10 h-10 text-zinc-300" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-700 mb-1">No jobs found</h3>
            <p className="text-sm text-zinc-400 mb-4">Try adjusting your search or filters</p>
            <button
              onClick={() => { setSearchTerm(""); setJobType("All"); setWorkplaceType("All"); setPostedDateFilter("all"); }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Clear Filters
            </button>
          </motion.div>
        )}

        {/* Job Cards */}
        {!loading && filteredJobs.length > 0 && (
          <motion.div
            key={`${searchTerm}-${jobType}-${workplaceType}-${postedDateFilter}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredJobs.map((job) => (
              <JobCard key={job._id} job={job} onVerified={handleVerifyComplete} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
