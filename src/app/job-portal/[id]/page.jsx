"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiBriefcase,
  FiMapPin,
  FiDollarSign,
  FiCalendar,
  FiClock,
  FiGlobe,
  FiExternalLink,
  FiArrowLeft,
  FiShare2,
  FiCopy,
  FiCheck,
  FiUsers,
  FiBookOpen,
  FiSend,
  FiAlertCircle,
  FiLoader,
  FiLinkedin,
  FiHome,
  FiLink,
  FiChevronRight,
} from "react-icons/fi";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 20 },
  },
};

function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="animate-pulse">
        <div className="h-64 bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100" />
        <div className="max-w-5xl mx-auto px-4 -mt-20">
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-xl p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-20 h-20 rounded-2xl bg-zinc-200" />
              <div className="space-y-3 flex-1">
                <div className="h-6 bg-zinc-200 rounded w-3/4" />
                <div className="h-4 bg-zinc-100 rounded w-1/2" />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-zinc-100 rounded-2xl" />
              ))}
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-zinc-100 rounded w-full" />
              <div className="h-4 bg-zinc-100 rounded w-5/6" />
              <div className="h-4 bg-zinc-100 rounded w-4/6" />
              <div className="h-4 bg-zinc-100 rounded w-full" />
              <div className="h-4 bg-zinc-100 rounded w-3/4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotFoundState() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md"
      >
        <div className="w-24 h-24 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-6">
          <FiBriefcase className="w-12 h-12 text-zinc-300" />
        </div>
        <h1 className="text-2xl font-extrabold text-zinc-900 mb-2">Job Not Found</h1>
        <p className="text-zinc-500 text-sm mb-6">
          The job posting you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <button
          onClick={() => router.push("/job-portal")}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-lg shadow-blue-600/20"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to Job Portal
        </button>
      </motion.div>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md"
      >
        <div className="w-24 h-24 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-6">
          <FiAlertCircle className="w-12 h-12 text-rose-400" />
        </div>
        <h1 className="text-2xl font-extrabold text-zinc-900 mb-2">Something Went Wrong</h1>
        <p className="text-zinc-500 text-sm mb-6">{message}</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-semibold text-sm rounded-xl transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id;

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchJob = async () => {
    if (!jobId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/jobs/${jobId}`);
      const data = await res.json();
      if (data.success && data.job) {
        setJob(data.job);
      } else {
        setError(data.message || "Job not found");
      }
    } catch (err) {
      setError("Failed to connect to server. Please make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const timeAgo = (dateString) => {
    if (!dateString) return "";
    const diff = Date.now() - new Date(dateString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return formatDate(dateString);
  };

  const daysUntilDeadline = (dateString) => {
    if (!dateString) return null;
    const diff = new Date(dateString).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const isApplicationUrl = (val) => {
    if (!val) return false;
    return val.startsWith("http://") || val.startsWith("https://");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareLinkedIn = () => {
    const url = window.location.href;
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(linkedinUrl, "_blank", "noopener,noreferrer");
  };

  if (loading) return <DetailSkeleton />;
  if (error || !job) return <NotFoundState />;

  const deadlineDays = daysUntilDeadline(job.applicationDeadline);
  const isDeadlinePassed = deadlineDays !== null && deadlineDays < 0;
  const isDeadlineSoon = deadlineDays !== null && deadlineDays >= 0 && deadlineDays <= 7;

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative h-72 sm:h-80 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-800" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.08),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.06),transparent)]" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-purple-400/10 blur-2xl" />

        {/* Floating shapes */}
        <motion.div
          animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-16 right-[15%] w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10"
        />
        <motion.div
          animate={{ y: [0, 10, 0], rotate: [0, -8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-24 left-[10%] w-12 h-12 rounded-xl bg-white/5 border border-white/5"
        />
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute bottom-20 right-[30%] w-6 h-6 rounded-full bg-white/10"
        />

        {/* Back Button */}
        <div className="absolute top-6 left-6 z-10">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/job-portal")}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 backdrop-blur-md border border-white/20 text-white text-sm font-medium rounded-xl hover:bg-white/25 transition-all"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back
          </motion.button>
        </div>

        {/* Share Buttons */}
        <div className="absolute top-6 right-6 z-10 flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleShareLinkedIn}
            className="p-2.5 bg-white/15 backdrop-blur-md border border-white/20 text-white rounded-xl hover:bg-[#0A66C2]/40 transition-all"
            title="Share on LinkedIn"
          >
            <FiLinkedin className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopyLink}
            className="p-2.5 bg-white/15 backdrop-blur-md border border-white/20 text-white rounded-xl hover:bg-white/25 transition-all"
            title="Copy link"
          >
            {copied ? <FiCheck className="w-4 h-4 text-emerald-300" /> : <FiShare2 className="w-4 h-4" />}
          </motion.button>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 px-6 sm:px-10 pb-8">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex items-end gap-5"
            >
              {/* Company Icon */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white shadow-xl flex items-center justify-center shrink-0">
                <span className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-br from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {job.company?.charAt(0) || "C"}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight"
                >
                  {job.title}
                </motion.h1>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center gap-3 mt-2 text-blue-100"
                >
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    <FiHome className="w-3.5 h-3.5" />
                    {job.company}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-blue-300" />
                  <span className="flex items-center gap-1.5 text-sm">
                    <FiMapPin className="w-3.5 h-3.5" />
                    {job.location}
                  </span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-6 relative z-10 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Info Cards */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
              <motion.div
                variants={staggerItem}
                className="bg-white rounded-2xl border border-zinc-200 p-4 text-center shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-2">
                  <FiBriefcase className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Type</p>
                <p className="text-sm font-bold text-zinc-900 mt-0.5">{job.jobType}</p>
              </motion.div>

              <motion.div
                variants={staggerItem}
                className="bg-white rounded-2xl border border-zinc-200 p-4 text-center shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-2">
                  <FiGlobe className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Workplace</p>
                <p className="text-sm font-bold text-zinc-900 mt-0.5">{job.workplaceType}</p>
              </motion.div>

              <motion.div
                variants={staggerItem}
                className="bg-white rounded-2xl border border-zinc-200 p-4 text-center shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-2">
                  <FiDollarSign className="w-5 h-5 text-amber-600" />
                </div>
                <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Salary</p>
                <p className="text-sm font-bold text-zinc-900 mt-0.5 truncate">{job.salaryRange || "Negotiable"}</p>
              </motion.div>

              <motion.div
                variants={staggerItem}
                className="bg-white rounded-2xl border border-zinc-200 p-4 text-center shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center mx-auto mb-2">
                  <FiClock className="w-5 h-5 text-violet-600" />
                </div>
                <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Posted</p>
                <p className="text-sm font-bold text-zinc-900 mt-0.5">{timeAgo(job.createdAt)}</p>
              </motion.div>
            </motion.div>

            {/* Job Description */}
            <motion.div
              variants={fadeInUp}
              custom={1}
              initial="hidden"
              animate="visible"
              className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden"
            >
              <div className="px-6 sm:px-8 py-5 border-b border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-xl">
                    <FiBookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-lg font-extrabold text-zinc-900">Job Description</h2>
                </div>
              </div>
              <div className="px-6 sm:px-8 py-6">
                <div className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap">
                  {job.description || "No description provided."}
                </div>
              </div>
            </motion.div>

            {/* Requirements */}
            {job.requirements && (
              <motion.div
                variants={fadeInUp}
                custom={2}
                initial="hidden"
                animate="visible"
                className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden"
              >
                <div className="px-6 sm:px-8 py-5 border-b border-zinc-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-50 rounded-xl">
                      <FiCheck className="w-5 h-5 text-violet-600" />
                    </div>
                    <h2 className="text-lg font-extrabold text-zinc-900">Requirements & Qualifications</h2>
                  </div>
                </div>
                <div className="px-6 sm:px-8 py-6">
                  <div className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap">
                    {job.requirements}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Skills */}
            {job.skills && job.skills.length > 0 && (
              <motion.div
                variants={fadeInUp}
                custom={3}
                initial="hidden"
                animate="visible"
                className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden"
              >
                <div className="px-6 sm:px-8 py-5 border-b border-zinc-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 rounded-xl">
                      <FiLink className="w-5 h-5 text-amber-600" />
                    </div>
                    <h2 className="text-lg font-extrabold text-zinc-900">Required Skills</h2>
                    <span className="ml-auto px-2.5 py-0.5 bg-zinc-100 text-zinc-500 text-xs font-semibold rounded-full">
                      {job.skills.length} skill{job.skills.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <div className="px-6 sm:px-8 py-6">
                  <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-wrap gap-2"
                  >
                    {job.skills.map((skill, i) => (
                      <motion.span
                        key={i}
                        variants={staggerItem}
                        whileHover={{ scale: 1.05, y: -2 }}
                        className="inline-flex items-center px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 text-xs font-semibold border border-blue-100 hover:shadow-md hover:shadow-blue-100/50 transition-shadow cursor-default"
                      >
                        {skill}
                      </motion.span>
                    ))}
                  </motion.div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Apply Card */}
            <motion.div
              variants={fadeInUp}
              custom={1}
              initial="hidden"
              animate="visible"
              className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden sticky top-6"
            >
              <div className="p-6">
                <h3 className="text-sm font-extrabold text-zinc-900 uppercase tracking-wider mb-4">Apply Now</h3>

                {/* Deadline */}
                {job.applicationDeadline && (
                  <div className={`mb-4 p-3.5 rounded-2xl border ${
                    isDeadlinePassed
                      ? "bg-rose-50 border-rose-200"
                      : isDeadlineSoon
                      ? "bg-amber-50 border-amber-200"
                      : "bg-blue-50 border-blue-100"
                  }`}>
                    <div className="flex items-center gap-2">
                      <FiCalendar className={`w-4 h-4 ${
                        isDeadlinePassed ? "text-rose-500" : isDeadlineSoon ? "text-amber-600" : "text-blue-600"
                      }`} />
                      <span className={`text-xs font-bold uppercase tracking-wider ${
                        isDeadlinePassed ? "text-rose-600" : isDeadlineSoon ? "text-amber-700" : "text-blue-600"
                      }`}>
                        {isDeadlinePassed ? "Deadline Passed" : isDeadlineSoon ? `${deadlineDays} day${deadlineDays !== 1 ? "s" : ""} left` : "Application Deadline"}
                      </span>
                    </div>
                    <p className={`text-sm font-semibold mt-1 ${
                      isDeadlinePassed ? "text-rose-700" : isDeadlineSoon ? "text-amber-800" : "text-blue-800"
                    }`}>
                      {formatDate(job.applicationDeadline)}
                    </p>
                  </div>
                )}

                {/* Apply Button */}
                {job.applicationUrlOrEmail ? (
                  isApplicationUrl(job.applicationUrlOrEmail) ? (
                    <motion.a
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      href={job.applicationUrlOrEmail}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-bold shadow-lg transition-all duration-200 ${
                        isDeadlinePassed
                          ? "bg-zinc-300 text-zinc-500 cursor-not-allowed shadow-none"
                          : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/25 hover:shadow-blue-500/40"
                      }`}
                      onClick={(e) => isDeadlinePassed && e.preventDefault()}
                    >
                      <FiSend className="w-4 h-4" />
                      {isDeadlinePassed ? "Deadline Passed" : "Apply Now"}
                      {!isDeadlinePassed && <FiExternalLink className="w-3.5 h-3.5" />}
                    </motion.a>
                  ) : (
                    <motion.a
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      href={`mailto:${job.applicationUrlOrEmail}?subject=Application for ${encodeURIComponent(job.title)} at ${encodeURIComponent(job.company)}`}
                      className={`w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-bold shadow-lg transition-all duration-200 ${
                        isDeadlinePassed
                          ? "bg-zinc-300 text-zinc-500 cursor-not-allowed shadow-none"
                          : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/25 hover:shadow-blue-500/40"
                      }`}
                      onClick={(e) => isDeadlinePassed && e.preventDefault()}
                    >
                      <FiSend className="w-4 h-4" />
                      {isDeadlinePassed ? "Deadline Passed" : "Apply via Email"}
                    </motion.a>
                  )
                ) : (
                  <button
                    disabled
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-zinc-100 text-zinc-400 rounded-xl text-sm font-bold cursor-not-allowed"
                  >
                    <FiAlertCircle className="w-4 h-4" />
                    No Application Link Provided
                  </button>
                )}

                {/* Application Contact */}
                {job.applicationUrlOrEmail && (
                  <div className="mt-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                    <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mb-1">Contact</p>
                    <p className="text-xs text-zinc-700 font-medium break-all">{job.applicationUrlOrEmail}</p>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="h-px bg-zinc-100 mx-6" />

              {/* Job Meta */}
              <div className="p-6 space-y-4">
                <h3 className="text-sm font-extrabold text-zinc-900 uppercase tracking-wider">Job Details</h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400 flex items-center gap-1.5">
                      <FiBriefcase className="w-3.5 h-3.5" />
                      Employment
                    </span>
                    <span className="text-xs font-semibold text-zinc-700">{job.jobType}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400 flex items-center gap-1.5">
                      <FiGlobe className="w-3.5 h-3.5" />
                      Workplace
                    </span>
                    <span className="text-xs font-semibold text-zinc-700">{job.workplaceType}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400 flex items-center gap-1.5">
                      <FiMapPin className="w-3.5 h-3.5" />
                      Location
                    </span>
                    <span className="text-xs font-semibold text-zinc-700 text-right max-w-[180px] truncate">{job.location}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400 flex items-center gap-1.5">
                      <FiDollarSign className="w-3.5 h-3.5" />
                      Salary
                    </span>
                    <span className="text-xs font-semibold text-zinc-700">{job.salaryRange || "Negotiable"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400 flex items-center gap-1.5">
                      <FiCalendar className="w-3.5 h-3.5" />
                      Deadline
                    </span>
                    <span className="text-xs font-semibold text-zinc-700">
                      {job.applicationDeadline ? formatDate(job.applicationDeadline) : "Open"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-zinc-100 mx-6" />

              {/* Posted By */}
              <div className="p-6">
                <h3 className="text-sm font-extrabold text-zinc-900 uppercase tracking-wider mb-3">Posted By</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                    <FiUsers className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-zinc-900 truncate">{job.postedBy || "Anonymous Alumni"}</p>
                    <p className="text-[11px] text-zinc-400">Alumni Network</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
