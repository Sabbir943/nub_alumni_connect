"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FiUser,
  FiUsers,
  FiBriefcase,
  FiBookOpen,
  FiMapPin,
  FiCalendar,
  FiArrowRight,
  FiTrendingUp,
  FiMessageSquare,
  FiEdit3,
  FiGlobe,
  FiStar,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiUserPlus,
  FiSearch,
  FiLinkedin,
  FiHeart,
  FiZap,
} from "react-icons/fi";
import { authClient } from "@/lib/auth-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.1, type: "spring", stiffness: 260, damping: 20 },
  }),
};

const shimmer = {
  hidden: { backgroundPosition: "-200% 0" },
  visible: {
    backgroundPosition: "200% 0",
    transition: { repeat: Infinity, duration: 1.5, ease: "linear" },
  },
};

function StatCard({ icon: Icon, label, value, trend, trendUp, color, index }) {
  const colorMap = {
    blue: "from-blue-500 to-blue-600",
    indigo: "from-indigo-500 to-indigo-600",
    emerald: "from-emerald-500 to-emerald-600",
    amber: "from-amber-500 to-amber-600",
    rose: "from-rose-500 to-rose-600",
    violet: "from-violet-500 to-violet-600",
  };

  const bgMap = {
    blue: "bg-blue-50 dark:bg-blue-950/30",
    indigo: "bg-indigo-50 dark:bg-indigo-950/30",
    emerald: "bg-emerald-50 dark:bg-emerald-950/30",
    amber: "bg-amber-50 dark:bg-amber-950/30",
    rose: "bg-rose-50 dark:bg-rose-950/30",
    violet: "bg-violet-50 dark:bg-violet-950/30",
  };

  return (
    <motion.div
      variants={scaleIn}
      custom={index}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm hover:shadow-lg hover:shadow-zinc-200/50 dark:hover:shadow-zinc-900/50 transition-shadow duration-300 group cursor-default"
    >
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${trendUp ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"}`}>
            <FiTrendingUp className={`w-3 h-3 ${!trendUp ? "rotate-180" : ""}`} />
            {trend}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{value}</p>
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-0.5 uppercase tracking-wider">{label}</p>
      </div>
    </motion.div>
  );
}

function QuickActionCard({ icon: Icon, label, description, href, color, index }) {
  const bgMap = {
    blue: "bg-blue-50 dark:bg-blue-950/30 group-hover:bg-blue-100 dark:group-hover:bg-blue-950/50",
    indigo: "bg-indigo-50 dark:bg-indigo-950/30 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-950/50",
    emerald: "bg-emerald-50 dark:bg-emerald-950/30 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-950/50",
    amber: "bg-amber-50 dark:bg-amber-950/30 group-hover:bg-amber-100 dark:group-hover:bg-amber-950/50",
    violet: "bg-violet-50 dark:bg-violet-950/30 group-hover:bg-violet-100 dark:group-hover:bg-violet-950/50",
    rose: "bg-rose-50 dark:bg-rose-950/30 group-hover:bg-rose-100 dark:group-hover:bg-rose-950/50",
  };

  const textMap = {
    blue: "text-blue-600 dark:text-blue-400",
    indigo: "text-indigo-600 dark:text-indigo-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
    amber: "text-amber-600 dark:text-amber-400",
    violet: "text-violet-600 dark:text-violet-400",
    rose: "text-rose-600 dark:text-rose-400",
  };

  return (
    <motion.div variants={fadeUp} custom={index}>
      <Link
        href={href}
        className="group flex items-center gap-4 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-transparent hover:shadow-lg hover:shadow-zinc-200/50 dark:hover:shadow-zinc-900/50 transition-all duration-300"
      >
        <div className={`w-12 h-12 rounded-xl ${bgMap[color]} ${textMap[color]} flex items-center justify-center transition-colors duration-300`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{label}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{description}</p>
        </div>
        <FiArrowRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-300" />
      </Link>
    </motion.div>
  );
}

function ProfileCompletionCard({ completion, user, hasProfile }) {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (completion / 100) * circumference;

  return (
    <motion.div variants={fadeUp} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Profile Strength</h3>
        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-full">{completion}%</span>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative shrink-0">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-zinc-100 dark:text-zinc-800" />
            <circle
              cx="50" cy="50" r="40" fill="none" stroke="url(#progressGradient)" strokeWidth="8"
              strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-black text-zinc-900 dark:text-white">{completion}</span>
          </div>
        </div>

        <div className="flex-1 space-y-2.5">
          {[
            { label: "Basic Info", done: hasProfile },
            { label: "Professional Details", done: hasProfile },
            { label: "Social Links", done: hasProfile },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              {item.done ? (
                <FiCheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <FiAlertCircle className="w-4 h-4 text-zinc-300 dark:text-zinc-600 shrink-0" />
              )}
              <span className={`text-xs font-medium ${item.done ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400 dark:text-zinc-500"}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {!hasProfile && (
        <Link
          href="/dashboard/alumni/Profile"
          className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-300 shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30"
        >
          <FiEdit3 className="w-4 h-4" />
          Complete Your Profile
        </Link>
      )}
    </motion.div>
  );
}

function RecentActivityItem({ activity, index }) {
  const iconMap = {
    join: { icon: FiUserPlus, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    post: { icon: FiBriefcase, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
    message: { icon: FiMessageSquare, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-950/30" },
    follow: { icon: FiHeart, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-950/30" },
    event: { icon: FiCalendar, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
  };

  const { icon: ActIcon, color, bg } = iconMap[activity.type] || iconMap.join;

  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      className="flex items-start gap-3.5 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors duration-200"
    >
      <div className={`w-9 h-9 rounded-lg ${bg} ${color} flex items-center justify-center shrink-0`}>
        <ActIcon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          <span className="font-semibold">{activity.user}</span>{" "}
          {activity.action}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <FiClock className="w-3 h-3 text-zinc-400" />
          <span className="text-xs text-zinc-400 dark:text-zinc-500">{activity.time}</span>
        </div>
      </div>
    </motion.div>
  );
}

function SuggestedConnectionCard({ person, index }) {
  return (
    <motion.div
      variants={scaleIn}
      custom={index}
      whileHover={{ y: -2 }}
      className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 text-center hover:shadow-lg hover:shadow-zinc-200/50 dark:hover:shadow-zinc-900/50 transition-all duration-300"
    >
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mx-auto text-white font-bold text-lg shadow-md">
        {person.name.charAt(0)}
      </div>
      <h4 className="mt-3 text-sm font-bold text-zinc-900 dark:text-white truncate">{person.name}</h4>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{person.role}</p>
      <div className="flex items-center justify-center gap-1 mt-1.5">
        <FiMapPin className="w-3 h-3 text-zinc-400" />
        <span className="text-xs text-zinc-400">{person.location}</span>
      </div>
      <div className="flex flex-wrap justify-center gap-1 mt-2.5">
        {person.skills.slice(0, 2).map((skill) => (
          <span key={skill} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
            {skill}
          </span>
        ))}
      </div>
      <button className="mt-3 w-full py-1.5 rounded-lg border border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 text-xs font-semibold hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all duration-300 flex items-center justify-center gap-1.5">
        <FiUserPlus className="w-3 h-3" />
        Connect
      </button>
    </motion.div>
  );
}

export default function AlumniOverviewPage() {
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;

  const [hasProfile, setHasProfile] = useState(false);
  const [stats, setStats] = useState({ connections: 0, profileViews: 0, jobPosts: 0, messages: 0 });
  const [recentAlumni, setRecentAlumni] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email || isPending) return;

    const fetchData = async () => {
      try {
        const profileRes = await fetch(`${API_URL}/api/alumni-directory/check/${user.email}`);
        const profileData = await profileRes.json();
        setHasProfile(profileData.exists);

        const alumniRes = await fetch(`${API_URL}/api/alumni-directory?limit=6&sortBy=newest`);
        const alumniData = await alumniRes.json();
        const others = (alumniData.profiles || alumniData.data || []).filter(
          (p) => p.email !== user.email
        );
        setRecentAlumni(others.slice(0, 4));
      } catch {
        // silent fail - dashboard still works with defaults
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, isPending]);

  const completion = hasProfile ? 85 : 20;

  const recentActivities = [
    { type: "join", user: "Farhan Ahmed", action: "joined the alumni network", time: "2 hours ago" },
    { type: "post", user: "Tasnim Reza", action: "posted a new job opportunity at Google", time: "5 hours ago" },
    { type: "follow", user: "Sakib Chowdhury", action: "started following you", time: "1 day ago" },
    { type: "event", user: "NUB Alumni Committee", action: "created a reunion event for December", time: "2 days ago" },
    { type: "message", user: "Nadia Karim", action: "sent you a message", time: "3 days ago" },
  ];

  const suggestedConnections = [
    { name: "Farhan Ahmed", role: "Software Engineer at Microsoft", location: "Dhaka", skills: ["React", "Node.js"] },
    { name: "Tasnim Reza", role: "Product Manager at Stripe", location: "Singapore", skills: ["Product", "UX"] },
    { name: "Sakib Chowdhury", role: "Data Scientist at Meta", location: "London", skills: ["Python", "ML"] },
    { name: "Nadia Karim", role: "DevOps Engineer at AWS", location: "Toronto", skills: ["AWS", "Docker"] },
  ];

  if (isPending || loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-gradient-to-br from-zinc-200 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
          <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
          <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* ========== WELCOME HERO ========== */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 rounded-2xl p-6 md:p-8 text-white shadow-xl shadow-blue-600/20"
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/3 -translate-x-1/4 blur-3xl" />
        </div>
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <motion.p
              variants={fadeUp}
              custom={0}
              className="text-blue-100 text-sm font-medium"
            >
              {greeting()} 👋
            </motion.p>
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-2xl md:text-3xl font-black mt-1 tracking-tight"
            >
              Welcome back, {user?.name?.split(" ")[0] || "Alumni"}
            </motion.h1>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-blue-100 text-sm mt-2 max-w-md"
            >
              Here&apos;s what&apos;s happening in the NUB Alumni Network today. Stay connected
              with your classmates and explore new opportunities.
            </motion.p>
          </div>
          <motion.div
            variants={fadeUp}
            custom={3}
            className="flex items-center gap-3"
          >
            <Link
              href="/dashboard/alumni/my-connection"
              className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white text-sm font-semibold px-5 py-2.5 rounded-xl border border-white/20 transition-all duration-300"
            >
              <FiUsers className="w-4 h-4" />
              My Network
            </Link>
            <Link
              href="/alumni-directory"
              className="inline-flex items-center gap-2 bg-white text-blue-600 text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-50 transition-all duration-300 shadow-md"
            >
              <FiSearch className="w-4 h-4" />
              Browse Alumni
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* ========== STATS CARDS ========== */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard icon={FiUsers} label="Connections" value={stats.connections} trend="+12%" trendUp color="blue" index={0} />
        <StatCard icon={FiGlobe} label="Profile Views" value={stats.profileViews} trend="+8%" trendUp color="indigo" index={1} />
        <StatCard icon={FiBriefcase} label="Job Posts" value={stats.jobPosts} trend="+3" trendUp color="emerald" index={2} />
        <StatCard icon={FiMessageSquare} label="Messages" value={stats.messages} color="violet" index={3} />
      </motion.div>

      {/* ========== MAIN CONTENT GRID ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN - Quick Actions + Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }}
          >
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <FiZap className="w-4 h-4 text-blue-500" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <QuickActionCard
                icon={FiEdit3}
                label="Edit Profile"
                description="Update your professional details"
                href="/dashboard/alumni/Profile"
                color="blue"
                index={0}
              />
              <QuickActionCard
                icon={FiUserPlus}
                label="Find Alumni"
                description="Browse and connect with alumni"
                href="/alumni-directory"
                color="indigo"
                index={1}
              />
              <QuickActionCard
                icon={FiBriefcase}
                label="Post a Job"
                description="Share opportunities with the network"
                href="/dashboard/alumni/jobPost"
                color="emerald"
                index={2}
              />
              <QuickActionCard
                icon={FiBookOpen}
                label="Mentorship Hub"
                description="Guide the next generation"
                href="/dashboard/alumni/mentorshipHub"
                color="violet"
                index={3}
              />
              <QuickActionCard
                icon={FiMessageSquare}
                label="Messages"
                description="Check your inbox"
                href="/dashboard/alumni/text"
                color="amber"
                index={4}
              />
              <QuickActionCard
                icon={FiUsers}
                label="My Connections"
                description="View your network"
                href="/dashboard/alumni/my-connection"
                color="rose"
                index={5}
              />
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
          >
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <FiClock className="w-4 h-4 text-blue-500" />
                Recent Activity
              </h2>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">Live Feed</span>
            </div>
            <div className="p-2 divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {recentActivities.map((activity, i) => (
                <RecentActivityItem key={i} activity={activity} index={i} />
              ))}
            </div>
          </motion.div>
        </div>

        {/* RIGHT COLUMN - Profile Strength + Suggested Connections */}
        <div className="space-y-6">
          <ProfileCompletionCard completion={completion} user={user} hasProfile={hasProfile} />

          {/* Suggested Connections */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
          >
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <FiStar className="w-4 h-4 text-amber-500" />
                Suggested Connections
              </h2>
              <Link href="/alumni-directory" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                View All <FiArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {suggestedConnections.map((person, i) => (
                <SuggestedConnectionCard key={i} person={person} index={i} />
              ))}
            </div>
          </motion.div>

          {/* Upcoming Event Card */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white shadow-lg shadow-amber-500/20"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <FiCalendar className="w-8 h-8 text-white/80" />
            <h3 className="mt-3 text-lg font-black">NUB Reunion 2026</h3>
            <p className="text-sm text-amber-100 mt-1">Annual alumni gathering — save the date!</p>
            <div className="mt-3 flex items-center gap-2 text-sm font-semibold">
              <FiClock className="w-4 h-4" />
              <span>Dec 15, 2026</span>
            </div>
            <button className="mt-4 w-full py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl text-sm font-semibold transition-all duration-300 border border-white/20">
              RSVP Now
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
