"use client";
import React, { useState, useEffect, useCallback } from "react";
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
} from "react-icons/fi";
import { authClient } from "@/lib/auth-client";

const API_BASE = "http://localhost:5000";

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
          <div className="h-3 bg-zinc-100 rounded w-full" />
          <div className="h-3 bg-zinc-100 rounded w-3/4 mx-auto" />
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
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const isOwnProfile = currentUserEmail && targetEmail === currentUserEmail;

  useEffect(() => {
    if (!currentUserEmail || !targetEmail || isOwnProfile) {
      setChecking(false);
      return;
    }
    async function checkStatus() {
      try {
        const res = await fetch(
          `${API_BASE}/api/follow/status?followerEmail=${encodeURIComponent(currentUserEmail)}&targetEmail=${encodeURIComponent(targetEmail)}`
        );
        if (res.ok) {
          const data = await res.json();
          setIsFollowing(data.isFollowing);
        }
      } catch {
        // ignore
      } finally {
        setChecking(false);
      }
    }
    checkStatus();
  }, [currentUserEmail, targetEmail, isOwnProfile]);

  const toggleFollow = async () => {
    if (!currentUserEmail || loading) return;
    setLoading(true);
    try {
      if (isFollowing) {
        const res = await fetch(`${API_BASE}/api/follow`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            followerEmail: currentUserEmail,
            targetEmail,
          }),
        });
        if (res.ok) setIsFollowing(false);
      } else {
        const res = await fetch(`${API_BASE}/api/follow`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            followerEmail: currentUserEmail,
            targetEmail,
          }),
        });
        if (res.ok) setIsFollowing(true);
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

  const fetchProfiles = useCallback(async () => {
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

      const res = await fetch(`${API_BASE}/api/alumni-directory?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch alumni");
      const data = await res.json();
      setProfiles(data.profiles || []);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, degree, graduationYear, location, sortBy, page]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  useEffect(() => {
    setPage(1);
  }, [search, degree, graduationYear, location, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProfiles();
  };

  const clearFilters = () => {
    setSearch("");
    setDegree("");
    setGraduationYear("");
    setLocation("");
    setSortBy("newest");
    setPage(1);
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
              onClick={fetchProfiles}
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
                    <h3 className="text-base font-bold text-zinc-900 truncate">
                      {profile.fullName}
                    </h3>
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
                  <div className="mt-4">
                    <FollowButton
                      targetEmail={profile.email}
                      currentUserEmail={currentUser?.email}
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
    </div>
  );
}
