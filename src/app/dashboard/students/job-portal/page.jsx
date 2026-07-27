"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
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
  FiBookOpen,
} from "react-icons/fi";
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
      </div>
    </div>
  );
}

function JobCard({ job }) {
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

  const isInternship = job.jobType === "Internship";

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:shadow-xl hover:shadow-zinc-200/50 transition-shadow duration-300 flex flex-col"
    >
      <div className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md shrink-0 ${
            isInternship
              ? "bg-gradient-to-br from-amber-500 to-orange-500"
              : "bg-gradient-to-br from-blue-500 to-indigo-500"
          }`}>
            {isInternship ? (
              <FiBookOpen className="w-5 h-5 text-white" />
            ) : (
              <FiBriefcase className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-zinc-900 truncate">{job.title}</h3>
            <p className="text-xs text-zinc-500 font-medium truncate">{job.company}</p>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-semibold border ${
            isInternship
              ? "bg-amber-50 text-amber-700 border-amber-100"
              : "bg-blue-50 text-blue-700 border-blue-100"
          }`}>
            {job.jobType}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
            {job.workplaceType}
          </span>
          {job.salaryRange && (
            <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-100">
              <FiDollarSign className="w-2.5 h-2.5" />
              {job.salaryRange}
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

        <div className="flex-1" />

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] text-zinc-400">
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
  );
}

export default function StudentJobPortalPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [jobType, setJobType] = useState("All");
  const [workplaceType, setWorkplaceType] = useState("All");
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

  const hasActiveFilters = jobType !== "All" || workplaceType !== "All";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <FiBriefcase className="w-5 h-5 text-blue-600" />
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Job Portal</h1>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Browse job and internship opportunities posted by alumni.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by title, company, or skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
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
                ? "bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400"
                : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300"
            }`}
          >
            <FiFilter className="w-4 h-4" />
            Filters
          </button>

          {hasActiveFilters && (
            <button
              onClick={() => { setJobType("All"); setWorkplaceType("All"); }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors font-medium"
            >
              <FiRefreshCw className="w-3.5 h-3.5" />
              Clear
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
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  className="px-3 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-600 dark:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
                >
                  <option value="All">All Job Types</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
                <select
                  value={workplaceType}
                  onChange={(e) => setWorkplaceType(e.target.value)}
                  className="px-3 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-600 dark:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
                >
                  <option value="All">All Workplaces</option>
                  <option value="On-site">On-site</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-rose-200 dark:border-rose-800">
          <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center mx-auto mb-4">
            <FiRefreshCw className="w-8 h-8 text-rose-400" />
          </div>
          <h3 className="text-base font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Connection Error</h3>
          <p className="text-sm text-zinc-500 mb-4 max-w-md mx-auto">{error}</p>
          <button
            onClick={fetchJobs}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && jobs.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <FiBriefcase className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />
          </div>
          <h3 className="text-base font-semibold text-zinc-700 dark:text-zinc-300 mb-1">No jobs available</h3>
          <p className="text-sm text-zinc-400">Check back later for new opportunities.</p>
        </div>
      )}

      {/* Job Cards */}
      {!loading && jobs.length > 0 && (
        <motion.div
          key={`${searchTerm}-${jobType}-${workplaceType}`}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          {jobs.map((job) => (
            <JobCard key={job._id} job={job} />
          ))}
        </motion.div>
      )}
    </div>
  );
}
