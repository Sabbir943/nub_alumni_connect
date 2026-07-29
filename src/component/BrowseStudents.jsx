"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiMapPin,
  FiBookOpen,
  FiX,
  FiUsers,
  FiRefreshCw,
  FiUserPlus,
  FiCheck,
  FiEye,
  FiLinkedin,
  FiPhone,
  FiMail,
  FiGlobe,
  FiFileText,
  FiUser,
  FiHash,
  FiExternalLink,
  FiGithub,
  FiShield,
  FiShieldOff,
  FiAlertTriangle,
  FiZap,
  FiCpu,
} from "react-icons/fi";
import { GraduationCap } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { apiFetch } from "@/lib/api";

const DEPARTMENT_OPTIONS = [
  "CSE",
  "EEE",
  "BBA",
  "English",
  "MBA",
];

const LOCATION_OPTIONS = [
  "Dhaka, Bangladesh",
  "Chittagong, Bangladesh",
  "Sylhet, Bangladesh",
  "Rajshahi, Bangladesh",
  "Khulna, Bangladesh",
  "Rangpur, Bangladesh",
  "Barishal, Bangladesh",
  "Mymensingh, Bangladesh",
  "New York, USA",
  "London, UK",
  "Toronto, Canada",
  "Dubai, UAE",
  "Singapore",
  "Sydney, Australia",
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "name_asc", label: "Name (A-Z)" },
  { value: "name_desc", label: "Name (Z-A)" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 260, damping: 20 },
  },
  exit: { opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.2 } },
};

const filterBarVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const heroVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

function VerificationBadge({ verification, size = "sm" }) {
  if (!verification) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 text-[10px] font-semibold border border-zinc-200">
        <FiShield className="w-3 h-3" />
        Not Verified
      </span>
    );
  }

  const { badge, trustScore } = verification;
  const config = {
    Verified: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      icon: <FiShield className="w-3 h-3" />,
      label: `Verified (${trustScore}%)`,
    },
    Unverified: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      icon: <FiAlertTriangle className="w-3 h-3" />,
      label: `Unverified (${trustScore}%)`,
    },
    Suspicious: {
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
      icon: <FiShieldOff className="w-3 h-3" />,
      label: `Suspicious (${trustScore}%)`,
    },
  };

  const c = config[badge] || config.Unverified;
  const sizeClasses = size === "lg"
    ? "px-3 py-1.5 text-xs"
    : "px-2 py-0.5 text-[10px]";

  return (
    <span className={`inline-flex items-center gap-1 ${sizeClasses} rounded-full ${c.bg} ${c.text} font-semibold border ${c.border}`}>
      {c.icon}
      {c.label}
    </span>
  );
}

function VerificationDetails({ verification }) {
  if (!verification) return null;

  const { trustScore, badge, breakdown, analysis, flags, verifiedAt } = verification;
  const barColor = badge === 'Verified' ? 'bg-emerald-500' : badge === 'Suspicious' ? 'bg-red-500' : 'bg-amber-500';

  return (
    <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
      <div className="flex items-center gap-2 mb-3">
        <FiShield className="w-4 h-4 text-slate-400" />
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Verification</h4>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <VerificationBadge verification={verification} size="lg" />
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-[10px] font-semibold text-slate-500 mb-1">
          <span>Trust Score</span>
          <span>{trustScore}/100</span>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${trustScore}%` }} />
        </div>
      </div>

      {breakdown && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          {Object.entries(breakdown).map(([key, val]) => (
            <div key={key} className="flex justify-between text-[10px] text-slate-500">
              <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
              <span className="font-semibold">{val}/25</span>
            </div>
          ))}
        </div>
      )}

      {analysis && (
        <p className="text-xs text-slate-600 leading-relaxed mb-2">{analysis}</p>
      )}

      {flags && flags.length > 0 && (
        <div className="mt-2">
          <p className="text-[10px] font-semibold text-amber-600 uppercase mb-1">Flags</p>
          <ul className="space-y-1">
            {flags.map((flag, i) => (
              <li key={i} className="text-[10px] text-amber-700 flex items-start gap-1">
                <FiAlertTriangle className="w-2.5 h-2.5 mt-0.5 flex-shrink-0" />
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {verifiedAt && (
        <p className="text-[9px] text-slate-400 mt-2">
          Verified: {new Date(verifiedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}

function ProfileDetailModal({ profile, isOpen, onClose }) {
  if (!profile || !isOpen) return null;

  const skills = profile.skills
    ? Array.isArray(profile.skills)
      ? profile.skills
      : profile.skills.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden"
          >
            <div className="relative h-32 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.15),transparent)]" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/10" />
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/5" />
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <div className="relative px-6 pb-6 -mt-14 overflow-y-auto max-h-[calc(85vh-8rem)]">
              <div className="relative w-24 h-24 mx-auto">
                {profile.profilePictureUrl ? (
                  <img
                    src={profile.profilePictureUrl}
                    alt={profile.fullName}
                    className="w-24 h-24 rounded-full border-4 border-white object-cover shadow-xl"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full border-4 border-white bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl">
                    <span className="text-3xl font-bold text-white">
                      {profile.fullName?.charAt(0) || "?"}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 text-center">
                <h2 className="text-xl font-extrabold text-slate-900">{profile.fullName}</h2>
                {profile.studentId && (
                  <p className="text-sm text-emerald-600 font-semibold mt-1 flex items-center justify-center gap-1">
                    <FiHash className="w-3.5 h-3.5" />
                    {profile.studentId}
                  </p>
                )}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {profile.department && (
                  <div className="flex items-center gap-2.5 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <FiBookOpen className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-emerald-400 font-semibold uppercase">Department</p>
                      <p className="text-sm font-bold text-emerald-700">{profile.department}</p>
                    </div>
                  </div>
                )}
                {profile.semester && (
                  <div className="flex items-center gap-2.5 p-3 bg-teal-50 rounded-xl border border-teal-100">
                    <div className="p-2 bg-teal-100 rounded-lg">
                      <GraduationCap className="w-4 h-4 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-teal-400 font-semibold uppercase">Semester</p>
                      <p className="text-sm font-bold text-teal-700">{profile.semester}</p>
                    </div>
                  </div>
                )}
                {profile.location && (
                  <div className="flex items-center gap-2.5 p-3 bg-cyan-50 rounded-xl border border-cyan-100">
                    <div className="p-2 bg-cyan-100 rounded-lg">
                      <FiMapPin className="w-4 h-4 text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-cyan-400 font-semibold uppercase">Location</p>
                      <p className="text-sm font-bold text-cyan-700">{profile.location}</p>
                    </div>
                  </div>
                )}
                {profile.batch && (
                  <div className="flex items-center gap-2.5 p-3 bg-purple-50 rounded-xl border border-purple-100">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FiUsers className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-purple-400 font-semibold uppercase">Batch</p>
                      <p className="text-sm font-bold text-purple-700">{profile.batch}</p>
                    </div>
                  </div>
                )}
              </div>

              {profile.bio && (
                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <FiFileText className="w-4 h-4 text-slate-400" />
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">About</h4>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{profile.bio}</p>
                </div>
              )}

              {/* AI Verification */}
              <VerificationDetails verification={profile.verification} />

              {skills.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((skill, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 text-xs font-semibold border border-emerald-100"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5 space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Connect</h4>
                <div className="grid grid-cols-1 gap-2">
                  {profile.linkedinUrl && (
                    <a
                      href={profile.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-2.5 bg-[#0A66C2]/5 hover:bg-[#0A66C2]/10 rounded-xl border border-[#0A66C2]/10 transition-colors group"
                    >
                      <FiLinkedin className="w-4 h-4 text-[#0A66C2]" />
                      <span className="text-sm font-medium text-[#0A66C2]">LinkedIn Profile</span>
                      <FiExternalLink className="w-3 h-3 text-[#0A66C2]/50 ml-auto group-hover:text-[#0A66C2] transition-colors" />
                    </a>
                  )}
                  {profile.githubUrl && (
                    <a
                      href={profile.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors group"
                    >
                      <FiGithub className="w-4 h-4 text-slate-700" />
                      <span className="text-sm font-medium text-slate-700">GitHub Profile</span>
                      <FiExternalLink className="w-3 h-3 text-slate-400 ml-auto group-hover:text-slate-700 transition-colors" />
                    </a>
                  )}
                  {profile.phone && (
                    <a
                      href={`tel:${profile.phone}`}
                      className="flex items-center gap-3 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-100 transition-colors group"
                    >
                      <FiPhone className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-700">{profile.phone}</span>
                      <FiExternalLink className="w-3 h-3 text-emerald-400 ml-auto group-hover:text-emerald-600 transition-colors" />
                    </a>
                  )}
                  {profile.email && (
                    <a
                      href={`mailto:${profile.email}`}
                      className="flex items-center gap-3 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-100 transition-colors group"
                    >
                      <FiMail className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">{profile.email}</span>
                      <FiExternalLink className="w-3 h-3 text-blue-400 ml-auto group-hover:text-blue-600 transition-colors" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden animate-pulse">
      <div className="h-24 bg-gradient-to-r from-emerald-100 to-teal-100" />
      <div className="px-5 pb-5 -mt-10">
        <div className="w-20 h-20 rounded-full bg-zinc-200 border-4 border-white mx-auto" />
        <div className="mt-3 space-y-2 text-center">
          <div className="h-4 bg-zinc-200 rounded w-32 mx-auto" />
          <div className="h-3 bg-zinc-100 rounded w-24 mx-auto" />
          <div className="h-3 bg-zinc-100 rounded w-40 mx-auto" />
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-9 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-xl w-full" />
          <div className="h-9 bg-zinc-100 rounded-xl w-full" />
        </div>
      </div>
    </div>
  );
}

function FilterDropdown({ label, icon, options, value, onChange, placeholder }) {
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
          value
            ? "bg-emerald-50 border-emerald-300 text-emerald-700"
            : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
        }`}
      >
        <span className="text-zinc-400">{icon}</span>
        <span className="truncate max-w-[120px]">{value || placeholder}</span>
        <FiChevronDown
          className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-64 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 overflow-hidden"
          >
            <div className="p-2 max-h-60 overflow-y-auto">
              <button
                onClick={() => {
                  onChange("");
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  !value
                    ? "bg-emerald-50 text-emerald-700 font-medium"
                    : "text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                All {placeholder}
              </button>
              {options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    value === opt
                      ? "bg-emerald-50 text-emerald-700 font-medium"
                      : "text-zinc-600 hover:bg-zinc-50"
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

function FollowButton({ targetEmail, currentUserEmail }) {
  const isOwnProfile = currentUserEmail && targetEmail === currentUserEmail;
  const shouldFetch = currentUserEmail && targetEmail && !isOwnProfile;

  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(shouldFetch);

  useEffect(() => {
    if (!shouldFetch) return;

    let cancelled = false;
    async function checkStatus() {
      try {
        const data = await apiFetch(
          `/api/follow/status?followerEmail=${encodeURIComponent(currentUserEmail)}&targetEmail=${encodeURIComponent(targetEmail)}`
        );
        if (!cancelled) {
          setIsFollowing(data.isFollowing);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setChecking(false);
      }
    }
    checkStatus();
    return () => { cancelled = true; };
  }, [currentUserEmail, targetEmail, shouldFetch]);

  const toggleFollow = async () => {
    if (!currentUserEmail || loading) return;
    setLoading(true);
    try {
      if (isFollowing) {
        await apiFetch("/api/follow", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            followerEmail: currentUserEmail,
            targetEmail,
          }),
        });
        setIsFollowing(false);
      } else {
        await apiFetch("/api/follow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            followerEmail: currentUserEmail,
            targetEmail,
          }),
        });
        setIsFollowing(true);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (isOwnProfile) return null;

  if (!currentUserEmail) {
    return (
      <button
        disabled
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-100 text-zinc-400 border border-zinc-200 rounded-xl text-xs font-semibold cursor-not-allowed"
      >
        <FiUserPlus className="w-3.5 h-3.5" />
        Login to Follow
      </button>
    );
  }

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={toggleFollow}
      disabled={loading || checking}
      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 border ${
        isFollowing
          ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
          : "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 hover:border-emerald-700 shadow-sm shadow-emerald-600/10"
      } disabled:opacity-50`}
    >
      {checking ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : isFollowing ? (
        <>
          <FiCheck className="w-3.5 h-3.5" />
          Following
        </>
      ) : (
        <>
          <FiUserPlus className="w-3.5 h-3.5" />
          Follow
        </>
      )}
    </motion.button>
  );
}

function AIVerifyButton({ profile, type, onVerified }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const hasVerification = profile.verification && profile.verification.trustScore;

  const handleVerify = async () => {
    if (loading) return;
    setLoading(true);
    setResult(null);
    setShowResult(false);

    try {
      const data = await apiFetch("/api/verify-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, type }),
      });
      if (data.verification) {
        setResult(data.verification);
        setShowResult(true);
        if (onVerified) onVerified(profile.email, data.verification);
      }
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const badgeColors = {
    Verified: "from-emerald-500 to-green-500",
    Unverified: "from-amber-500 to-orange-500",
    Suspicious: "from-red-500 to-rose-500",
  };

  const scoreColor =
    result?.trustScore >= 70
      ? "text-emerald-600"
      : result?.trustScore >= 40
      ? "text-amber-600"
      : "text-red-600";

  return (
    <div className="w-full">
      {!showResult ? (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleVerify}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 border border-dashed border-emerald-300 bg-emerald-50/50 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-400 disabled:opacity-60"
        >
          {loading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <FiCpu className="w-3.5 h-3.5" />
              </motion.div>
              <span>Analyzing...</span>
              <motion.div
                className="w-16 h-1 bg-emerald-200 rounded-full overflow-hidden"
              >
                <motion.div
                  className="h-full bg-emerald-500 rounded-full"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.div>
            </>
          ) : hasVerification ? (
            <>
              <FiRefreshCw className="w-3.5 h-3.5" />
              Re-verify with AI
            </>
          ) : (
            <>
              <FiZap className="w-3.5 h-3.5" />
              Verify with AI
            </>
          )}
        </motion.button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="w-full"
        >
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <div className={`h-1 bg-gradient-to-r ${badgeColors[result?.badge] || "from-zinc-400 to-zinc-500"}`} />

            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
                  >
                    <FiShield className={`w-4 h-4 ${
                      result?.badge === "Verified" ? "text-emerald-500" :
                      result?.badge === "Suspicious" ? "text-red-500" : "text-amber-500"
                    }`} />
                  </motion.div>
                  <span className={`text-xs font-bold ${
                    result?.badge === "Verified" ? "text-emerald-600" :
                    result?.badge === "Suspicious" ? "text-red-600" : "text-amber-600"
                  }`}>
                    {result?.badge}
                  </span>
                </div>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className={`text-sm font-extrabold ${scoreColor}`}
                >
                  {result?.trustScore}%
                </motion.span>
              </div>

              <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${result?.trustScore || 0}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                  className={`h-full rounded-full bg-gradient-to-r ${
                    result?.trustScore >= 70 ? "from-emerald-500 to-green-500" :
                    result?.trustScore >= 40 ? "from-amber-500 to-orange-500" :
                    "from-red-500 to-rose-500"
                  }`}
                />
              </div>

              {result?.analysis && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-[10px] text-zinc-500 leading-relaxed line-clamp-2"
                >
                  {result.analysis}
                </motion.p>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-center gap-1 mt-2 pt-2 border-t border-zinc-100"
              >
                <FiZap className="w-2.5 h-2.5 text-emerald-400" />
                <span className="text-[9px] text-zinc-400 font-medium uppercase tracking-wider">
                  Verified by AI
                </span>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function BrowseStudents() {
  const { data: session } = authClient.useSession();
  const currentUser = session?.user;

  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [location, setLocation] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    pageSize: 6,
    hasNext: false,
    hasPrevious: false,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const prevFiltersRef = useRef({ search, department, graduationYear, location, sortBy });

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (department) params.set("degree", department);
      if (graduationYear) params.set("graduationYear", graduationYear);
      if (location) params.set("location", location);
      params.set("sortBy", sortBy);
      params.set("page", String(page));
      params.set("limit", "6");

      const data = await apiFetch(`/api/student-directory?${params.toString()}`);
      setProfiles(data.profiles || []);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, department, graduationYear, location, sortBy, page]);

  useEffect(() => {
    const prev = prevFiltersRef.current;
    const filtersChanged = prev.search !== undefined && (
      prev.search !== search || prev.department !== department ||
      prev.graduationYear !== graduationYear || prev.location !== location || prev.sortBy !== sortBy
    );
    prevFiltersRef.current = { search, department, graduationYear, location, sortBy };

    if (filtersChanged) {
      setPage(1);
    }
  }, [search, department, graduationYear, location, sortBy]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (department) params.set("degree", department);
        if (graduationYear) params.set("graduationYear", graduationYear);
        if (location) params.set("location", location);
        params.set("sortBy", sortBy);
        params.set("page", String(page));
        params.set("limit", "6");

        const data = await apiFetch(`/api/student-directory?${params.toString()}`);
        if (!cancelled) {
          setProfiles(data.profiles || []);
          setPagination(data.pagination);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [search, department, graduationYear, location, sortBy, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setDepartment("");
    setGraduationYear("");
    setLocation("");
    setSortBy("newest");
    setPage(1);
  };

  const handleVerifyComplete = (email, verification) => {
    setProfiles((prev) =>
      prev.map((p) => (p.email === email ? { ...p, verification } : p))
    );
  };

  const hasActiveFilters = department || graduationYear || location || sortBy !== "newest";

  const yearOptions = [];
  for (let y = new Date().getFullYear(); y >= 2000; y--) {
    yearOptions.push(String(y));
  }

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        variants={heroVariants}
        initial="hidden"
        animate="visible"
        className="text-center mb-10"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold tracking-wide uppercase mb-4"
        >
          <GraduationCap className="w-3.5 h-3.5" />
          Student Network
        </motion.div>

        <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-900 tracking-tight">
          Browse{" "}
          <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Student Directory
          </span>
        </h1>
        <p className="mt-3 text-zinc-500 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          Discover and connect with current students from Northern University
          Bangladesh. Search by name, skill, or department.
        </p>
      </motion.div>

      <motion.div
        variants={filterBarVariants}
        initial="hidden"
        animate="visible"
        className="mb-8"
      >
        <form onSubmit={handleSearchSubmit} className="relative mb-4">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, student ID, or skills..."
              className="w-full pl-12 pr-32 py-3.5 bg-white border border-zinc-200 rounded-2xl text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all shadow-sm"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                >
                  <FiX className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
              >
                Search
              </button>
            </div>
          </div>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
              showFilters || hasActiveFilters
                ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
            }`}
          >
            <FiFilter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center">
                {[department, graduationYear, location].filter(Boolean).length}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-zinc-400 hidden sm:inline">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 cursor-pointer transition-all"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
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
              <div className="mt-4 p-4 bg-white border border-zinc-200 rounded-2xl shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <FilterDropdown
                    label="Department"
                    icon={<FiBookOpen className="w-4 h-4" />}
                    options={DEPARTMENT_OPTIONS}
                    value={department}
                    onChange={setDepartment}
                    placeholder="Department"
                  />

                  <FilterDropdown
                    label="Year"
                    icon={<GraduationCap className="w-4 h-4" />}
                    options={yearOptions}
                    value={graduationYear}
                    onChange={setGraduationYear}
                    placeholder="Year"
                  />

                  <FilterDropdown
                    label="Location"
                    icon={<FiMapPin className="w-4 h-4" />}
                    options={LOCATION_OPTIONS}
                    value={location}
                    onChange={setLocation}
                    placeholder="Location"
                  />

                  {hasActiveFilters && (
                    <motion.button
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      onClick={clearFilters}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors font-medium"
                    >
                      <FiRefreshCw className="w-3.5 h-3.5" />
                      Clear All
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {!loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between mb-6"
        >
          <p className="text-sm text-zinc-500">
            {pagination.total === 0
              ? "No students found"
              : `Showing ${profiles.length} of ${pagination.total} students`}
          </p>
        </motion.div>
      )}

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-8 p-6 bg-red-50 border border-red-200 rounded-2xl text-center"
          >
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={fetchProfiles}
              className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!loading && !error && profiles.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20"
        >
          <div className="w-20 h-20 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-10 h-10 text-zinc-300" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-700 mb-1">
            No students found
          </h3>
          <p className="text-sm text-zinc-400 mb-4">
            Try adjusting your search or filter criteria
          </p>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Clear Filters
          </button>
        </motion.div>
      )}

      {!loading && profiles.length > 0 && (
        <motion.div
          key={`${page}-${sortBy}-${department}-${graduationYear}-${location}-${search}`}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {profiles.map((profile) => (
              <motion.div
                key={profile._id}
                variants={cardVariants}
                layout
                className="group bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:shadow-xl hover:shadow-emerald-500/5 transition-shadow duration-300"
              >
                <div className="relative h-24 bg-gradient-to-r from-emerald-600 to-teal-600 overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
                  <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-sm text-white uppercase tracking-wider">
                      {profile.semester || "N/A"}
                    </span>
                  </div>
                  {profile.verification?.badge === "Verified" && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/90 backdrop-blur-sm text-white"
                    >
                      <FiZap className="w-2.5 h-2.5" />
                      <span className="text-[9px] font-bold uppercase tracking-wider">AI Verified</span>
                    </motion.div>
                  )}
                </div>

                <div className="px-5 pb-5 -mt-10 relative">
                  <div className="relative w-20 h-20 mx-auto">
                    {profile.profilePictureUrl ? (
                      <img
                        src={profile.profilePictureUrl}
                        alt={profile.fullName}
                        className="w-20 h-20 rounded-full border-4 border-white object-cover shadow-md group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full border-4 border-white bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                        <span className="text-2xl font-bold text-white">
                          {profile.fullName?.charAt(0) || "?"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <h3 className="text-base font-bold text-zinc-900 truncate">
                        {profile.fullName}
                      </h3>
                    </div>
                    <div className="mt-1">
                      <VerificationBadge verification={profile.verification} />
                    </div>
                    {profile.studentId && (
                      <p className="text-xs text-emerald-600 font-medium truncate mt-0.5 flex items-center justify-center gap-1">
                        <FiHash className="w-3 h-3" />
                        {profile.studentId}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                    {profile.department && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-100">
                        {profile.department}
                      </span>
                    )}
                    {profile.location && (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 text-[10px] font-semibold border border-teal-100">
                        <FiMapPin className="w-2.5 h-2.5" />
                        {profile.location}
                      </span>
                    )}
                  </div>

                  {profile.skills && profile.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap justify-center gap-1">
                      {(Array.isArray(profile.skills)
                        ? profile.skills
                        : profile.skills.split(",").map((s) => s.trim())
                      )
                        .slice(0, 3)
                        .map((skill, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 text-[10px] font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      {(Array.isArray(profile.skills)
                        ? profile.skills.length
                        : profile.skills.split(",").length) > 3 && (
                        <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-500 text-[10px] font-medium">
                          +{(Array.isArray(profile.skills) ? profile.skills.length : profile.skills.split(",").length) - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSelectedProfile(profile)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-200"
                    >
                      <FiEye className="w-3.5 h-3.5" />
                      View Details
                    </motion.button>
                  </div>
                  <div className="mt-2">
                    <FollowButton
                      targetEmail={profile.email}
                      currentUserEmail={currentUser?.email}
                    />
                  </div>
                  <div className="mt-2">
                    <AIVerifyButton
                      profile={profile}
                      type="student"
                      onVerified={handleVerifyComplete}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {!loading && pagination.totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-10 flex items-center justify-center gap-2"
        >
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!pagination.hasPrevious}
            className="flex items-center gap-1 px-3 py-2 rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <FiChevronLeft className="w-4 h-4" />
            Prev
          </button>

          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
            .filter((p) => {
              const cp = pagination.currentPage;
              return p === 1 || p === pagination.totalPages || Math.abs(p - cp) <= 1;
            })
            .reduce((acc, p, i, arr) => {
              if (i > 0 && p - arr[i - 1] > 1) {
                acc.push("...");
              }
              acc.push(p);
              return acc;
            }, [])
            .map((item, i) =>
              item === "..." ? (
                <span key={`ellipsis-${i}`} className="px-2 text-zinc-400 text-sm">
                  ...
                </span>
              ) : (
                <button
                  key={item}
                  onClick={() => setPage(item)}
                  className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    pagination.currentPage === item
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                      : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  {item}
                </button>
              )
            )}

          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!pagination.hasNext}
            className="flex items-center gap-1 px-3 py-2 rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Next
            <FiChevronRight className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      <ProfileDetailModal
        profile={selectedProfile}
        isOpen={!!selectedProfile}
        onClose={() => setSelectedProfile(null)}
      />
    </div>
  );
}
