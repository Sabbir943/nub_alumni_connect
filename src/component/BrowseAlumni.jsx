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
  FiBriefcase,
  FiCalendar,
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
  FiMessageCircle,
  FiShield,
  FiShieldOff,
  FiAlertTriangle,
  FiZap,
  FiCpu,
} from "react-icons/fi";
import { authClient } from "@/lib/auth-client";
import { apiFetch } from "@/lib/api";

const DEGREE_OPTIONS = [
  "B.Sc. in CSE",
  "B.Sc. in EEE",
  "BBA",
  "B.A. in English",
  "MBA",
  "M.Sc. in CSE",
  "MBA (Executive)",
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
  { value: "year_asc", label: "Year (Oldest)" },
  { value: "year_desc", label: "Year (Newest)" },
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
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 text-[10px] font-semibold border border-zinc-200`}>
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
            {/* Header Banner */}
            <div className="relative h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 overflow-hidden">
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

            {/* Profile Content */}
            <div className="relative px-6 pb-6 -mt-14 overflow-y-auto max-h-[calc(85vh-8rem)]">
              {/* Avatar */}
              <div className="relative w-24 h-24 mx-auto">
                {profile.profilePictureUrl ? (
                  <img
                    src={profile.profilePictureUrl}
                    alt={profile.fullName}
                    className="w-24 h-24 rounded-full border-4 border-white object-cover shadow-xl"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full border-4 border-white bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl">
                    <span className="text-3xl font-bold text-white">
                      {profile.fullName?.charAt(0) || "?"}
                    </span>
                  </div>
                )}
              </div>

              {/* Name & Title */}
              <div className="mt-4 text-center">
                <h2 className="text-xl font-extrabold text-slate-900">{profile.fullName}</h2>
                {profile.jobTitle && (
                  <p className="text-sm text-blue-600 font-semibold mt-1">{profile.jobTitle}</p>
                )}
                {profile.organization && (
                  <p className="text-sm text-slate-500 flex items-center justify-center gap-1 mt-1">
                    <FiBriefcase className="w-3.5 h-3.5 text-slate-400" />
                    {profile.organization}
                  </p>
                )}
              </div>

              {/* Quick Info Cards */}
              <div className="mt-5 grid grid-cols-2 gap-3">
                {profile.graduationYear && (
                  <div className="flex items-center gap-2.5 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <FiCalendar className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-indigo-400 font-semibold uppercase">Graduation</p>
                      <p className="text-sm font-bold text-indigo-700">Batch of {profile.graduationYear}</p>
                    </div>
                  </div>
                )}
                {profile.degree && (
                  <div className="flex items-center gap-2.5 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FiBookOpen className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-blue-400 font-semibold uppercase">Degree</p>
                      <p className="text-sm font-bold text-blue-700">{profile.degree}</p>
                    </div>
                  </div>
                )}
                {profile.studentId && (
                  <div className="flex items-center gap-2.5 p-3 bg-violet-50 rounded-xl border border-violet-100">
                    <div className="p-2 bg-violet-100 rounded-lg">
                      <FiHash className="w-4 h-4 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-violet-400 font-semibold uppercase">Student ID</p>
                      <p className="text-sm font-bold text-violet-700">{profile.studentId}</p>
                    </div>
                  </div>
                )}
                {profile.currentLocation && (
                  <div className="flex items-center gap-2.5 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <FiMapPin className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-emerald-400 font-semibold uppercase">Location</p>
                      <p className="text-sm font-bold text-emerald-700">{profile.currentLocation}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Bio */}
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

              {/* Skills */}
              {skills.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((skill, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 text-xs font-semibold border border-blue-100"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Links */}
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
                  {profile.contactNumber && (
                    <a
                      href={`tel:${profile.contactNumber}`}
                      className="flex items-center gap-3 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-100 transition-colors group"
                    >
                      <FiPhone className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-700">{profile.contactNumber}</span>
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
                  {profile.facebookUrl && (
                    <a
                      href={profile.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-2.5 bg-[#1877F2]/5 hover:bg-[#1877F2]/10 rounded-xl border border-[#1877F2]/10 transition-colors group"
                    >
                      <FiGlobe className="w-4 h-4 text-[#1877F2]" />
                      <span className="text-sm font-medium text-[#1877F2]">Facebook</span>
                      <FiExternalLink className="w-3 h-3 text-[#1877F2]/50 ml-auto group-hover:text-[#1877F2] transition-colors" />
                    </a>
                  )}
                  {profile.twitterUrl && (
                    <a
                      href={profile.twitterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-2.5 bg-black/5 hover:bg-black/10 rounded-xl border border-black/10 transition-colors group"
                    >
                      <FiGlobe className="w-4 h-4 text-black" />
                      <span className="text-sm font-medium text-black">Twitter / X</span>
                      <FiExternalLink className="w-3 h-3 text-black/40 ml-auto group-hover:text-black transition-colors" />
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
      <div className="h-24 bg-gradient-to-r from-blue-100 to-indigo-100" />
      <div className="px-5 pb-5 -mt-10">
        <div className="w-20 h-20 rounded-full bg-zinc-200 border-4 border-white mx-auto" />
        <div className="mt-3 space-y-2 text-center">
          <div className="h-4 bg-zinc-200 rounded w-32 mx-auto" />
          <div className="h-3 bg-zinc-100 rounded w-24 mx-auto" />
          <div className="h-3 bg-zinc-100 rounded w-40 mx-auto" />
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-9 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl w-full" />
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
            ? "bg-blue-50 border-blue-300 text-blue-700"
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
            className="absolute top-full left-0 mt-2 w-56 sm:w-64 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 overflow-hidden"
          >
            <div className="p-2 max-h-60 overflow-y-auto">
              <button
                onClick={() => {
                  onChange("");
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  !value
                    ? "bg-blue-50 text-blue-700 font-medium"
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
                      ? "bg-blue-50 text-blue-700 font-medium"
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
          ? "bg-blue-50 text-blue-600 border-blue-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
          : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:border-blue-700 shadow-sm shadow-blue-600/10"
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
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 border border-dashed border-blue-300 bg-blue-50/50 text-blue-600 hover:bg-blue-50 hover:border-blue-400 disabled:opacity-60"
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
                className="w-16 h-1 bg-blue-200 rounded-full overflow-hidden"
              >
                <motion.div
                  className="h-full bg-blue-500 rounded-full"
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
            {/* Gradient top bar */}
            <div className={`h-1 bg-gradient-to-r ${badgeColors[result?.badge] || "from-zinc-400 to-zinc-500"}`} />

            <div className="p-3">
              {/* Badge + Score row */}
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

              {/* Trust score bar */}
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

              {/* Analysis text */}
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

              {/* AI powered label */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-center gap-1 mt-2 pt-2 border-t border-zinc-100"
              >
                <FiZap className="w-2.5 h-2.5 text-blue-400" />
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

export default function BrowseAlumni() {
  const { data: session } = authClient.useSession();
  const currentUser = session?.user;

  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [degree, setDegree] = useState("");
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
  const prevFiltersRef = useRef({ search, degree, graduationYear, location, sortBy });

  useEffect(() => {
    const prev = prevFiltersRef.current;
    const filtersChanged = prev.search !== undefined && (
      prev.search !== search || prev.degree !== degree ||
      prev.graduationYear !== graduationYear || prev.location !== location || prev.sortBy !== sortBy
    );
    prevFiltersRef.current = { search, degree, graduationYear, location, sortBy };
    if (filtersChanged) setPage(1);
  }, [search, degree, graduationYear, location, sortBy]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (degree) params.set("degree", degree);
        if (graduationYear) params.set("graduationYear", graduationYear);
        if (location) params.set("location", location);
        params.set("sortBy", sortBy);
        params.set("page", String(page));
        params.set("limit", "6");

        const data = await apiFetch(`/api/alumni-directory?${params.toString()}`);
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
  }, [search, degree, graduationYear, location, sortBy, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setDegree("");
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

  const hasActiveFilters = degree || graduationYear || location || sortBy !== "newest";

  const yearOptions = [];
  for (let y = new Date().getFullYear(); y >= 2000; y--) {
    yearOptions.push(String(y));
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
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
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold tracking-wide uppercase mb-4"
        >
          <FiUsers className="w-3.5 h-3.5" />
          Alumni Network
        </motion.div>

        <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-900 tracking-tight">
          Browse{" "}
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Alumni Directory
          </span>
        </h1>
        <p className="mt-3 text-zinc-500 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          Discover and connect with talented graduates from Northern University
          Bangladesh. Search by name, skill, company, or graduation year.
        </p>
      </motion.div>

      {/* Search & Filter Bar */}
      <motion.div
        variants={filterBarVariants}
        initial="hidden"
        animate="visible"
        className="mb-8"
      >
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative mb-4">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, job title, organization, or skills..."
              className="w-full pl-12 pr-32 py-3.5 bg-white border border-zinc-200 rounded-2xl text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all shadow-sm"
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
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
              >
                Search
              </button>
            </div>
          </div>
        </form>

        {/* Filter Toggle & Sort */}
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
                {[degree, graduationYear, location].filter(Boolean).length}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-zinc-400 hidden sm:inline">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 cursor-pointer transition-all"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Expanded Filters */}
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
                    label="Degree"
                    icon={<FiBookOpen className="w-4 h-4" />}
                    options={DEGREE_OPTIONS}
                    value={degree}
                    onChange={setDegree}
                    placeholder="Degree"
                  />

                  <FilterDropdown
                    label="Year"
                    icon={<FiCalendar className="w-4 h-4" />}
                    options={yearOptions}
                    value={graduationYear}
                    onChange={setGraduationYear}
                    placeholder="Graduation Year"
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

      {/* Results Count */}
      {!loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between mb-6"
        >
          <p className="text-sm text-zinc-500">
            {pagination.total === 0
              ? "No alumni found"
              : `Showing ${profiles.length} of ${pagination.total} alumni`}
          </p>
        </motion.div>
      )}

      {/* Error State */}
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
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && profiles.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20"
        >
          <div className="w-20 h-20 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4">
            <FiUsers className="w-10 h-10 text-zinc-300" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-700 mb-1">
            No alumni found
          </h3>
          <p className="text-sm text-zinc-400 mb-4">
            Try adjusting your search or filter criteria
          </p>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Clear Filters
          </button>
        </motion.div>
      )}

      {/* Alumni Cards Grid */}
      {!loading && profiles.length > 0 && (
        <motion.div
          key={`${page}-${sortBy}-${degree}-${graduationYear}-${location}-${search}`}
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
                className="group bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:shadow-xl hover:shadow-blue-500/5 transition-shadow duration-300"
              >
                {/* Banner */}
                <div className="relative h-24 bg-gradient-to-r from-blue-600 to-indigo-600 overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
                  <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-sm text-white uppercase tracking-wider">
                      {profile.graduationYear || "N/A"}
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

                {/* Profile Content */}
                <div className="px-5 pb-5 -mt-10 relative">
                  {/* Avatar */}
                  <div className="relative w-20 h-20 mx-auto">
                    {profile.profilePictureUrl ? (
                      <img
                        src={profile.profilePictureUrl}
                        alt={profile.fullName}
                        className="w-20 h-20 rounded-full border-4 border-white object-cover shadow-md group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full border-4 border-white bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                        <span className="text-2xl font-bold text-white">
                          {profile.fullName?.charAt(0) || "?"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="mt-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <h3 className="text-base font-bold text-zinc-900 truncate">
                        {profile.fullName}
                      </h3>
                    </div>
                    <div className="mt-1">
                      <VerificationBadge verification={profile.verification} />
                    </div>
                    {profile.jobTitle && (
                      <p className="text-xs text-blue-600 font-medium truncate mt-0.5">
                        {profile.jobTitle}
                      </p>
                    )}
                    {profile.organization && (
                      <p className="text-xs text-zinc-500 flex items-center justify-center gap-1 mt-1 truncate">
                        <FiBriefcase className="w-3 h-3 text-zinc-400 flex-shrink-0" />
                        {profile.organization}
                      </p>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                    {profile.degree && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-100">
                        {profile.degree}
                      </span>
                    )}
                    {profile.currentLocation && (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-100">
                        <FiMapPin className="w-2.5 h-2.5" />
                        {profile.currentLocation}
                      </span>
                    )}
                  </div>

                  {/* Skills */}
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

                  {/* Action */}
                  <div className="mt-4 flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSelectedProfile(profile)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-200"
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
                      type="alumni"
                      onVerified={handleVerifyComplete}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Pagination */}
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
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
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

      {/* Profile Detail Modal */}
      <ProfileDetailModal
        profile={selectedProfile}
        isOpen={!!selectedProfile}
        onClose={() => setSelectedProfile(null)}
      />
    </div>
  );
}
