"use client";
import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser, FiUsers, FiBriefcase, FiBookOpen, FiMapPin, FiCalendar,
  FiArrowRight, FiTrendingUp, FiMessageSquare, FiEdit3, FiGlobe,
  FiStar, FiClock, FiCheckCircle, FiAlertCircle, FiUserPlus,
  FiSearch, FiHeart, FiZap, FiChevronRight, FiActivity, FiAward,
} from "react-icons/fi";
import { authClient } from "@/lib/auth-client";
import { apiFetch } from "@/lib/api";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: (i = 0) => ({
    opacity: 1, scale: 1,
    transition: { delay: i * 0.08, type: "spring", stiffness: 300, damping: 24 },
  }),
};

const slideRight = {
  hidden: { opacity: 0, x: -30 },
  visible: (i = 0) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

function AnimatedCounter({ value, duration = 1200 }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const end = Number(value) || 0;
    if (end === 0) return;
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <span>{count}</span>;
}

function FloatingOrb({ className, delay = 0 }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl opacity-20 pointer-events-none ${className}`}
      animate={{
        y: [0, -20, 0, 20, 0],
        x: [0, 10, 0, -10, 0],
        scale: [1, 1.1, 1, 0.9, 1],
      }}
      transition={{ duration: 8, repeat: Infinity, delay, ease: "easeInOut" }}
    />
  );
}

function GlassCard({ children, className = "", hover = true }) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, scale: 1.01 } : {}}
      transition={{ duration: 0.2 }}
      className={`bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-white/40 dark:border-zinc-800/60 rounded-3xl shadow-xl shadow-zinc-200/20 dark:shadow-zinc-900/40 ${className}`}
    >
      {children}
    </motion.div>
  );
}

function StatCard({ icon: Icon, label, value, color, index, trend }) {
  const gradients = {
    emerald: "from-emerald-500 via-teal-500 to-cyan-600",
    teal: "from-teal-500 via-cyan-500 to-blue-600",
    blue: "from-blue-500 via-indigo-500 to-violet-600",
    violet: "from-violet-500 via-purple-500 to-fuchsia-600",
    amber: "from-amber-500 via-orange-500 to-rose-500",
    rose: "from-rose-500 via-pink-500 to-red-500",
  };
  const glows = {
    emerald: "shadow-emerald-500/30",
    teal: "shadow-teal-500/30",
    blue: "shadow-blue-500/30",
    violet: "shadow-violet-500/30",
    amber: "shadow-amber-500/30",
    rose: "shadow-rose-500/30",
  };

  return (
    <motion.div
      variants={scaleIn}
      custom={index}
      whileHover={{ y: -6, scale: 1.03 }}
      className={`relative overflow-hidden bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl border border-white/50 dark:border-zinc-800/60 p-5 shadow-lg ${glows[color]} hover:shadow-2xl transition-all duration-300 group cursor-default`}
    >
      <div className={`absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br ${gradients[color]} rounded-full opacity-10 group-hover:opacity-20 group-hover:scale-125 transition-all duration-500`} />
      <div className="relative">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradients[color]} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="mt-4">
          <p className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
            <AnimatedCounter value={value} />
          </p>
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-1 uppercase tracking-widest">{label}</p>
        </div>
        {trend && (
          <div className="absolute top-0 right-0">
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <FiTrendingUp className="w-3 h-3" />{trend}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function QuickActionCard({ icon: Icon, label, description, href, color, index }) {
  const gradients = {
    emerald: "from-emerald-500 to-teal-600",
    teal: "from-teal-500 to-cyan-600",
    blue: "from-blue-500 to-indigo-600",
    violet: "from-violet-500 to-purple-600",
    amber: "from-amber-500 to-orange-500",
    rose: "from-rose-500 to-pink-500",
  };
  const bgs = {
    emerald: "bg-emerald-50 dark:bg-emerald-950/30",
    teal: "bg-teal-50 dark:bg-teal-950/30",
    blue: "bg-blue-50 dark:bg-blue-950/30",
    violet: "bg-violet-50 dark:bg-violet-950/30",
    amber: "bg-amber-50 dark:bg-amber-950/30",
    rose: "bg-rose-50 dark:bg-rose-950/30",
  };

  return (
    <motion.div variants={fadeUp} custom={index}>
      <Link href={href} className="group flex items-center gap-4 p-4 rounded-2xl bg-white/60 dark:bg-zinc-900/60 backdrop-blur-lg border border-white/40 dark:border-zinc-800/50 hover:bg-white/90 dark:hover:bg-zinc-900/90 hover:shadow-xl hover:shadow-zinc-200/30 dark:hover:shadow-zinc-900/50 transition-all duration-300">
        <div className={`w-12 h-12 rounded-2xl ${bgs[color]} flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${gradients[color]} flex items-center justify-center shadow-md`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{label}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{description}</p>
        </div>
        <FiChevronRight className="w-5 h-5 text-zinc-300 dark:text-zinc-600 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all duration-300" />
      </Link>
    </motion.div>
  );
}

function ProfileCompletionCard({ completion, user, hasProfile }) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (completion / 100) * circumference;

  return (
    <GlassCard className="p-6" hover={false}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <FiAward className="w-4 h-4 text-emerald-500" />
          Profile Strength
        </h3>
        <span className="text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 px-3 py-1 rounded-full shadow-md shadow-emerald-500/25">{completion}%</span>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative shrink-0">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" className="text-zinc-100 dark:text-zinc-800" />
            <motion.circle
              cx="50" cy="50" r="45" fill="none" stroke="url(#grad)" strokeWidth="6"
              strokeLinecap="round" strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
            />
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#0d9488" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-zinc-900 dark:text-white">{completion}</span>
            <span className="text-[9px] font-bold text-zinc-400 uppercase">percent</span>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          {[
            { label: "Basic Info", done: hasProfile, icon: FiUser },
            { label: "Academic Details", done: hasProfile, icon: FiBookOpen },
            { label: "Skills & Links", done: hasProfile, icon: FiGlobe },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.15 }}
              className="flex items-center gap-3"
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${item.done ? 'bg-emerald-100 dark:bg-emerald-950/40' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                {item.done ? (
                  <FiCheckCircle className="w-4 h-4 text-emerald-500" />
                ) : (
                  <item.icon className="w-4 h-4 text-zinc-300 dark:text-zinc-600" />
                )}
              </div>
              <span className={`text-xs font-semibold ${item.done ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400 dark:text-zinc-500"}`}>
                {item.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {!hasProfile && (
        <Link
          href="/dashboard/students/create-profile"
          className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-semibold px-5 py-3 rounded-2xl transition-all duration-300 shadow-lg shadow-emerald-600/25 hover:shadow-xl hover:shadow-emerald-600/35 hover:-translate-y-0.5"
        >
          <FiEdit3 className="w-4 h-4" />
          Complete Your Profile
        </Link>
      )}
    </GlassCard>
  );
}

function RecentActivityItem({ activity, index }) {
  const iconMap = {
    join: { icon: FiUserPlus, gradient: "from-emerald-500 to-teal-500" },
    post: { icon: FiBriefcase, gradient: "from-blue-500 to-indigo-500" },
    message: { icon: FiMessageSquare, gradient: "from-violet-500 to-purple-500" },
    follow: { icon: FiHeart, gradient: "from-rose-500 to-pink-500" },
    job: { icon: FiTrendingUp, gradient: "from-amber-500 to-orange-500" },
  };
  const { icon: ActIcon, gradient } = iconMap[activity.type] || iconMap.join;

  return (
    <motion.div
      variants={slideRight}
      custom={index}
      className="flex items-start gap-3.5 p-3 rounded-2xl hover:bg-white/50 dark:hover:bg-zinc-800/30 transition-all duration-200 group"
    >
      <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
        <ActIcon className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
          <span className="font-bold">{activity.user}</span>{" "}
          {activity.action}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <FiClock className="w-3 h-3 text-zinc-400" />
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">{activity.time}</span>
        </div>
      </div>
    </motion.div>
  );
}

function SuggestedConnectionCard({ person, index, onConnect }) {
  const [connected, setConnected] = useState(false);
  const handleConnect = async () => { setConnected(true); if (onConnect) onConnect(person.email); };
  const getInitials = (name) => { if (!name) return 'A'; return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2); };

  return (
    <motion.div variants={scaleIn} custom={index} whileHover={{ y: -4 }} className="relative overflow-hidden bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl rounded-3xl border border-white/40 dark:border-zinc-800/60 p-5 text-center shadow-lg hover:shadow-2xl transition-all duration-300">
      <div className="absolute -top-6 -right-6 w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full opacity-10" />
      {person.profilePictureUrl ? (
        <img src={person.profilePictureUrl} alt={person.name} className="w-16 h-16 rounded-2xl object-cover mx-auto shadow-lg ring-2 ring-white dark:ring-zinc-800" />
      ) : (
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center mx-auto text-white font-black text-lg shadow-lg shadow-emerald-500/25">
          {getInitials(person.name)}
        </div>
      )}
      <h4 className="mt-3 text-sm font-bold text-zinc-900 dark:text-white truncate">{person.name}</h4>
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{person.role}</p>
      <div className="flex items-center justify-center gap-1 mt-1">
        <FiMapPin className="w-3 h-3 text-zinc-400" />
        <span className="text-[10px] text-zinc-400 font-medium">{person.location}</span>
      </div>
      {person.skills.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1 mt-2.5">
          {person.skills.slice(0, 2).map((skill) => (
            <span key={skill} className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-600 dark:from-emerald-950/40 dark:to-teal-950/40 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40">
              {skill}
            </span>
          ))}
        </div>
      )}
      <button
        onClick={handleConnect}
        disabled={connected}
        className={`mt-3 w-full py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 ${
          connected
            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400'
            : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30'
        }`}
      >
        {connected ? <FiCheckCircle className="w-3 h-3" /> : <FiUserPlus className="w-3 h-3" />}
        {connected ? 'Connected!' : 'Connect'}
      </button>
    </motion.div>
  );
}

function JobOpportunitiesCard({ jobs }) {
  return (
    <motion.div initial="hidden" animate="visible" variants={fadeUp}>
      <GlassCard className="overflow-hidden" hover={false}>
        <div className="px-6 py-4 border-b border-zinc-100/50 dark:border-zinc-800/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <FiBriefcase className="w-4 h-4 text-blue-500" />
            Latest Job Openings
          </h2>
          <Link href="/dashboard/students/job-portal" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
            View All <FiArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="p-4 space-y-3">
          {jobs.length > 0 ? (
            jobs.slice(0, 4).map((job, i) => (
              <motion.div
                key={job._id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/50 dark:hover:bg-zinc-800/30 transition-all group"
              >
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform">
                  <FiBriefcase className="w-4.5 h-4.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{job.title}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{job.company} &middot; {job.location || 'Remote'}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                  job.jobType === 'Full-time' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' :
                  job.jobType === 'Part-time' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' :
                  job.jobType === 'Internship' ? 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400' :
                  'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                }`}>
                  {job.jobType || 'Full-time'}
                </span>
              </motion.div>
            ))
          ) : (
            <div className="py-8 text-center text-zinc-400">
              <FiBriefcase className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-semibold">No jobs posted yet</p>
              <p className="text-xs mt-1">Check back later for opportunities</p>
            </div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-48 bg-gradient-to-br from-zinc-200 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 rounded-3xl animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-3xl animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-48 bg-zinc-200 dark:bg-zinc-800 rounded-3xl animate-pulse" />
          <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-3xl animate-pulse" />
        </div>
        <div className="space-y-6">
          <div className="h-48 bg-zinc-200 dark:bg-zinc-800 rounded-3xl animate-pulse" />
          <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-3xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function StudentOverviewPage() {
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;

  const [hasProfile, setHasProfile] = useState(false);
  const [stats, setStats] = useState({ connections: 0, followers: 0, jobs: 0, messages: 0 });
  const [suggestedConnections, setSuggestedConnections] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [latestJobs, setLatestJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email || isPending) return;
    let cancelled = false;

    const fetchData = async () => {
      try {
        const profileData = await apiFetch(`/api/students/check/${user.email}`);
        if (!cancelled) setHasProfile(profileData.exists);

        const [studentsRes, followStatsRes, jobsRes, unreadRes, followingRes] = await Promise.allSettled([
          apiFetch(`/api/student-directory?limit=20&sortBy=newest`),
          apiFetch(`/api/follow/stats/${encodeURIComponent(user.email)}`),
          apiFetch(`/api/jobs?limit=100`),
          apiFetch(`/api/messages/unread-summary/${encodeURIComponent(user.email)}`),
          apiFetch(`/api/follow/following/${encodeURIComponent(user.email)}`),
        ]);

        if (cancelled) return;

        const studentsData = studentsRes.status === 'fulfilled' ? studentsRes.value : { profiles: [] };
        const allStudents = studentsData.profiles || studentsData.data || [];
        const followStats = followStatsRes.status === 'fulfilled' ? followStatsRes.value : { followers: 0, following: 0 };
        const jobsData = jobsRes.status === 'fulfilled' ? jobsRes.value : { jobs: [] };
        const allJobs = jobsData.jobs || [];
        const unreadData = unreadRes.status === 'fulfilled' ? unreadRes.value : { totalUnread: 0 };
        const followingData = followingRes.status === 'fulfilled' ? followingRes.value : { following: [] };
        const followingEmails = new Set((followingData.following || []).map(f => f.email));

        setStats({
          connections: followStats.following || 0,
          followers: followStats.followers || 0,
          jobs: allJobs.length,
          messages: unreadData.totalUnread || 0,
        });

        const others = allStudents.filter(p => p.email !== user.email);
        const suggested = others
          .filter(p => !followingEmails.has(p.email))
          .slice(0, 4)
          .map(p => ({
            name: p.fullName || 'Student',
            role: p.department ? `${p.department}${p.semester ? ' - Sem ' + p.semester : ''}` : 'Student',
            location: p.location || 'Bangladesh',
            skills: p.skills ? p.skills.split(',').map(s => s.trim()).slice(0, 3) : [],
            email: p.email,
            profilePictureUrl: p.profilePictureUrl,
          }));
        setSuggestedConnections(suggested);

        const activityItems = [];
        others.filter(p => p.createdAt)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 3)
          .forEach(p => {
            const diff = Date.now() - new Date(p.createdAt).getTime();
            const hours = Math.floor(diff / 3600000);
            const days = Math.floor(hours / 24);
            let time = 'just now';
            if (days > 0) time = `${days}d ago`;
            else if (hours > 0) time = `${hours}h ago`;
            activityItems.push({ type: 'join', user: p.fullName || 'Student', action: 'joined the student network', time });
          });

        allJobs.filter(j => j.createdAt)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 2)
          .forEach(j => {
            const diff = Date.now() - new Date(j.createdAt).getTime();
            const hours = Math.floor(diff / 3600000);
            const days = Math.floor(hours / 24);
            let time = 'just now';
            if (days > 0) time = `${days}d ago`;
            else if (hours > 0) time = `${hours}h ago`;
            activityItems.push({ type: 'job', user: j.postedBy || 'An alumni', action: `posted a job: ${j.title} at ${j.company}`, time });
          });

        if (followStats.followers > 0) {
          activityItems.push({ type: 'follow', user: 'Network', action: `You have ${followStats.followers} follower${followStats.followers > 1 ? 's' : ''}`, time: 'recently' });
        }

        setRecentActivities(activityItems.slice(0, 5));

        setLatestJobs(allJobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4));

      } catch {
        // silent fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [user, isPending]);

  const handleConnect = async (targetEmail) => {
    if (!user?.email) return;
    try {
      await apiFetch(`/api/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerEmail: user.email, targetEmail }),
      });
      setSuggestedConnections(prev => prev.filter(p => p.email !== targetEmail));
      setStats(prev => ({ ...prev, connections: prev.connections + 1 }));
    } catch { /* silent */ }
  };

  const completion = hasProfile ? 85 : 20;

  if (isPending || loading) return <LoadingSkeleton />;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="relative min-h-screen space-y-6 lg:space-y-8 overflow-hidden">
      <FloatingOrb className="w-72 h-72 bg-emerald-400 top-0 left-0" delay={0} />
      <FloatingOrb className="w-96 h-96 bg-teal-400 top-20 right-0" delay={2} />
      <FloatingOrb className="w-64 h-64 bg-cyan-400 bottom-0 left-1/3" delay={4} />

      {/* ========== WELCOME HERO ========== */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="relative overflow-hidden rounded-3xl shadow-2xl shadow-emerald-600/20"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 via-50% to-cyan-700" />
        <div className="absolute inset-0 opacity-[0.07]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-white rounded-full translate-y-1/3 -translate-x-1/4 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl" />
        </div>
        <div className="relative p-6 md:p-10 text-white">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 border border-white/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-100">Online</span>
              </motion.div>
              <motion.h1 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
                {greeting()}, <span className="bg-gradient-to-r from-white via-emerald-100 to-cyan-200 bg-clip-text text-transparent">{user?.name?.split(" ")[0] || "Student"}</span>!
              </motion.h1>
              <motion.p variants={fadeUp} custom={2} className="text-emerald-100/80 text-sm max-w-lg leading-relaxed">
                Your student dashboard is ready. Explore opportunities, connect with peers, and grow your career.
              </motion.p>
            </div>
            <motion.div variants={fadeUp} custom={3} className="flex items-center gap-3 flex-shrink-0">
              <Link href="/dashboard/students/my-connection" className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white text-sm font-semibold px-5 py-3 rounded-2xl border border-white/20 transition-all duration-300 hover:-translate-y-0.5">
                <FiUsers className="w-4 h-4" />
                My Network
              </Link>
              <Link href="/student-directory" className="inline-flex items-center gap-2 bg-white text-emerald-600 text-sm font-semibold px-5 py-3 rounded-2xl hover:bg-emerald-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                <FiSearch className="w-4 h-4" />
                Browse Students
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ========== STATS CARDS ========== */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard icon={FiUsers} label="Following" value={stats.connections} color="emerald" index={0} trend="+8%" />
        <StatCard icon={FiHeart} label="Followers" value={stats.followers} color="teal" index={1} />
        <StatCard icon={FiBriefcase} label="Job Listings" value={stats.jobs} color="blue" index={2} />
        <StatCard icon={FiMessageSquare} label="Unread" value={stats.messages} color="violet" index={3} />
      </motion.div>

      {/* ========== MAIN CONTENT GRID ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <FiZap className="w-4 h-4 text-amber-500" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <QuickActionCard icon={FiEdit3} label="Create Profile" description="Set up your student profile" href="/dashboard/students/create-profile" color="emerald" index={0} />
              <QuickActionCard icon={FiUserPlus} label="Find Peers" description="Browse and connect with students" href="/student-directory" color="teal" index={1} />
              <QuickActionCard icon={FiBriefcase} label="Job Portal" description="Explore job & internship openings" href="/dashboard/students/job-portal" color="blue" index={2} />
              <QuickActionCard icon={FiMessageSquare} label="Messages" description="Check your inbox" href="/dashboard/students/text-box" color="violet" index={3} />
              <QuickActionCard icon={FiUsers} label="My Connections" description="View your network" href="/dashboard/students/my-connection" color="rose" index={4} />
              <QuickActionCard icon={FiBookOpen} label="Alumni Network" description="Connect with alumni mentors" href="/alumni-directory" color="amber" index={5} />
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <GlassCard className="overflow-hidden" hover={false}>
              <div className="px-6 py-4 border-b border-zinc-100/50 dark:border-zinc-800/50 flex items-center justify-between">
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <FiActivity className="w-4 h-4 text-emerald-500" />
                  Recent Activity
                </h2>
                <span className="relative flex items-center gap-1.5 text-xs font-semibold text-zinc-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
              </div>
              <div className="p-3 divide-y divide-zinc-100/50 dark:divide-zinc-800/30">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity, i) => (
                    <RecentActivityItem key={i} activity={activity} index={i} />
                  ))
                ) : (
                  <div className="py-10 text-center text-zinc-400">
                    <FiActivity className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-semibold">No recent activity</p>
                    <p className="text-xs mt-1">Start connecting to see activity here</p>
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>

          {/* Job Opportunities */}
          <JobOpportunitiesCard jobs={latestJobs} />
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          <ProfileCompletionCard completion={completion} user={user} hasProfile={hasProfile} />

          {/* Suggested Connections */}
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <GlassCard className="overflow-hidden" hover={false}>
              <div className="px-6 py-4 border-b border-zinc-100/50 dark:border-zinc-800/50 flex items-center justify-between">
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <FiStar className="w-4 h-4 text-amber-500" />
                  People You May Know
                </h2>
                <Link href="/student-directory" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
                  View All <FiArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                {suggestedConnections.length > 0 ? (
                  suggestedConnections.map((person, i) => (
                    <SuggestedConnectionCard key={person.email || i} person={person} index={i} onConnect={handleConnect} />
                  ))
                ) : (
                  <div className="col-span-2 py-8 text-center text-zinc-400">
                    <FiUsers className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-semibold">All caught up!</p>
                    <p className="text-xs mt-1">No new suggestions right now</p>
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
