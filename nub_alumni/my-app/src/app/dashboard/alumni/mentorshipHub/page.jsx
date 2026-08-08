"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiBookOpen, FiUsers, FiClock, FiCheckCircle, FiXCircle,
  FiAlertCircle, FiLoader, FiMessageSquare, FiUser, FiCalendar,
  FiChevronRight, FiStar, FiTrendingUp, FiZap, FiVideo, FiPhone,
} from "react-icons/fi";
import { authClient } from "@/lib/auth-client";
import { apiFetch } from "@/lib/api";
import toast, { Toaster } from "react-hot-toast";

const TABS = [
  { key: "all", label: "All", icon: FiUsers },
  { key: "pending", label: "Pending", icon: FiClock },
  { key: "active", label: "Active", icon: FiCheckCircle },
  { key: "completed", label: "Completed", icon: FiStar },
  { key: "declined", label: "Declined", icon: FiXCircle },
];

const STATUS_STYLES = {
  pending: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-400" },
  active: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-400" },
  completed: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-400" },
  declined: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-400" },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
  exit: { opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.2 } },
};

function StatCard({ icon: Icon, label, value, color, index }) {
  const gradients = {
    amber: "from-amber-500 via-orange-500 to-rose-500",
    emerald: "from-emerald-500 via-teal-500 to-cyan-600",
    blue: "from-blue-500 via-indigo-500 to-violet-600",
    red: "from-red-500 via-pink-500 to-rose-600",
  };
  const glows = {
    amber: "shadow-amber-500/30",
    emerald: "shadow-emerald-500/30",
    blue: "shadow-blue-500/30",
    red: "shadow-red-500/30",
  };

  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      whileHover={{ y: -4, scale: 1.02 }}
      className={`relative overflow-hidden bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-zinc-800/60 p-5 shadow-lg ${glows[color]} hover:shadow-xl transition-all duration-300`}
    >
      <div className={`absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br ${gradients[color]} rounded-full opacity-10`} />
      <div className="relative">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradients[color]} flex items-center justify-center shadow-md`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="mt-3">
          <p className="text-2xl font-black text-zinc-900 dark:text-white">{value}</p>
          <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5 uppercase tracking-widest">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${style.bg} ${style.text} border ${style.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
}

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function MentorshipCard({ mentorship, onAction, acting }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      variants={cardVariants}
      layout
      className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-zinc-800/50 overflow-hidden hover:shadow-xl transition-all duration-300"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shrink-0">
              <FiUser className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">{mentorship.studentName}</h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{mentorship.studentEmail}</p>
            </div>
          </div>
          <StatusBadge status={mentorship.status} />
        </div>

        {mentorship.expertise && (
          <div className="mt-3 flex items-center gap-1.5">
            <FiStar className="w-3 h-3 text-amber-400" />
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{mentorship.expertise}</span>
          </div>
        )}

        {mentorship.message && (
          <div className="mt-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <FiMessageSquare className="w-3 h-3" />
              {expanded ? "Hide message" : "View message"}
              <FiChevronRight className={`w-3 h-3 transition-transform ${expanded ? "rotate-90" : ""}`} />
            </button>
            <AnimatePresence>
              {expanded && (
                <motion.p
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-xl leading-relaxed overflow-hidden"
                >
                  {mentorship.message}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-zinc-400">
          <FiCalendar className="w-3 h-3" />
          <span>Requested {timeAgo(mentorship.createdAt)}</span>
          {mentorship.reviewedAt && (
            <span className="ml-2">Reviewed {timeAgo(mentorship.reviewedAt)}</span>
          )}
        </div>
      </div>

      {(mentorship.status === "pending" || mentorship.status === "active") && (
        <div className="px-5 pb-4 flex gap-2">
          {mentorship.status === "pending" && (
            <>
              <button
                onClick={() => onAction(mentorship._id, "accept")}
                disabled={acting === mentorship._id}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                {acting === mentorship._id ? (
                  <FiLoader className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FiCheckCircle className="w-3.5 h-3.5" />
                )}
                Accept
              </button>
              <button
                onClick={() => onAction(mentorship._id, "decline")}
                disabled={acting === mentorship._id}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-white dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
              >
                <FiXCircle className="w-3.5 h-3.5" />
                Decline
              </button>
            </>
          )}
          {mentorship.status === "active" && (
            <div className="flex gap-2">
              <Link
                href={`/dashboard/alumni/text?chatWith=${mentorship.studentEmail}`}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
              >
                <FiMessageSquare className="w-3.5 h-3.5" />
                Message
              </Link>
              <button
                onClick={() => window.open("https://meet.google.com/new", "_blank")}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold transition-all"
              >
                <FiVideo className="w-3.5 h-3.5" />
                Video Call
              </button>
              <button
                onClick={() => onAction(mentorship._id, "complete")}
                disabled={acting === mentorship._id}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white dark:bg-zinc-800 hover:bg-amber-50 dark:hover:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
              >
                {acting === mentorship._id ? (
                  <FiLoader className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FiStar className="w-3.5 h-3.5" />
                )}
                Complete
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-40 bg-gradient-to-br from-zinc-200 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 rounded-3xl animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-40 bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function MentorshipHubPage() {
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;

  const [mentorships, setMentorships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [acting, setActing] = useState(null);

  useEffect(() => {
    if (!user?.email || isPending) return;
    let cancelled = false;

    const fetchMentorships = async () => {
      try {
        const data = await apiFetch(`/api/mentorships?mode=alumni&email=${encodeURIComponent(user.email)}`);
        if (!cancelled) setMentorships(data.mentorships || []);
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchMentorships();
    return () => { cancelled = true; };
  }, [user, isPending]);

  const handleAction = async (id, action) => {
    setActing(id);
    try {
      await apiFetch(`/api/mentorships/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      setMentorships((prev) =>
        prev.map((m) =>
          m._id === id
            ? { ...m, status: action === "accept" ? "active" : action === "decline" ? "declined" : "completed", updatedAt: new Date().toISOString(), reviewedAt: new Date().toISOString() }
            : m
        )
      );
      toast.success(`Mentorship ${action === "accept" ? "accepted" : action === "decline" ? "declined" : "marked complete"}!`);
    } catch (err) {
      toast.error(err.message || "Action failed");
    } finally {
      setActing(null);
    }
  };

  const filtered = activeTab === "all" ? mentorships : mentorships.filter((m) => m.status === activeTab);

  const counts = {
    all: mentorships.length,
    pending: mentorships.filter((m) => m.status === "pending").length,
    active: mentorships.filter((m) => m.status === "active").length,
    completed: mentorships.filter((m) => m.status === "completed").length,
    declined: mentorships.filter((m) => m.status === "declined").length,
  };

  if (isPending || loading) return <LoadingSkeleton />;

  return (
    <div className="relative min-h-screen space-y-6 lg:space-y-8 overflow-hidden">
      <Toaster position="top-center" />

      {/* Header */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="relative overflow-hidden rounded-3xl shadow-2xl shadow-violet-600/20"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 via-50% to-fuchsia-700" />
        <div className="absolute inset-0 opacity-[0.07]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-white rounded-full translate-y-1/3 -translate-x-1/4 blur-3xl" />
        </div>
        <div className="relative p-6 md:p-10 text-white">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-2">
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 border border-white/20">
                <FiBookOpen className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold text-violet-100">Mentorship Hub</span>
              </motion.div>
              <motion.h1 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-black tracking-tight">
                Guide the Next Generation
              </motion.h1>
              <motion.p variants={fadeUp} custom={2} className="text-violet-100/80 text-sm max-w-lg leading-relaxed">
                Manage mentorship requests from students. Accept, track, and complete mentorship sessions.
              </motion.p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard icon={FiClock} label="Pending" value={counts.pending} color="amber" index={0} />
        <StatCard icon={FiCheckCircle} label="Active" value={counts.active} color="emerald" index={1} />
        <StatCard icon={FiStar} label="Completed" value={counts.completed} color="blue" index={2} />
        <StatCard icon={FiUsers} label="Total" value={counts.all} color="red" index={3} />
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="flex flex-wrap gap-2"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                activeTab === tab.key
                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/20"
                  : "bg-white/70 dark:bg-zinc-900/70 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                activeTab === tab.key ? "bg-white/20 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
              }`}>
                {counts[tab.key]}
              </span>
            </button>
          );
        })}
      </motion.div>

      {/* Mentorship Cards */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20"
        >
          <div className="w-20 h-20 rounded-full bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center mx-auto mb-4">
            <FiBookOpen className="w-10 h-10 text-violet-300" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300 mb-1">No mentorship requests</h3>
          <p className="text-sm text-zinc-400">
            {activeTab === "all"
              ? "You haven't received any mentorship requests yet."
              : `No ${activeTab} mentorships found.`}
          </p>
        </motion.div>
      ) : (
        <motion.div
          key={activeTab}
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((mentorship) => (
              <MentorshipCard
                key={mentorship._id}
                mentorship={mentorship}
                onAction={handleAction}
                acting={acting}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
