"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiBell, FiBellOff, FiUserPlus, FiMessageSquare, FiInfo,
  FiTrash2, FiCheck, FiCheckCircle, FiFilter, FiClock, FiX,
  FiPhone, FiPhoneOff, FiVideo, FiPhoneCall, FiPhoneIncoming,
} from "react-icons/fi";
import { authClient } from "@/lib/auth-client";
import { apiFetch } from "@/lib/api";
import { useCall } from "@/component/CallContext";
import { useRouter } from "next/navigation";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  }),
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

const typeConfig = {
  follow: { icon: <FiUserPlus />, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30", label: "Follow" },
  message: { icon: <FiMessageSquare />, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30", label: "Message" },
  admin_notice: { icon: <FiInfo />, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-950/30", label: "Notice" },
  call_incoming: { icon: <FiPhoneIncoming />, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30", label: "Incoming" },
  call_outgoing: { icon: <FiPhone />, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30", label: "Outgoing" },
  call_missed: { icon: <FiPhoneOff />, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/30", label: "Missed" },
  call_ended: { icon: <FiPhone />, color: "text-zinc-500", bg: "bg-zinc-50 dark:bg-zinc-950/30", label: "Call" },
};

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + "m ago";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + "h ago";
  const days = Math.floor(hours / 24);
  if (days < 7) return days + "d ago";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function AlumniNotifications() {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const email = user?.email;
  const router = useRouter();
  const { answerCall, declineCall, incomingCall, callState } = useCall();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const fetchNotifications = useCallback(async () => {
    if (!email) return;
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("type", filter);
      const data = await apiFetch(`/api/notifications/${email}?${params}`);
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (e) {
      console.error("Failed to fetch notifications:", e);
    } finally {
      setLoading(false);
    }
  }, [email, filter]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  useEffect(() => {
    if (!email) return;
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [email, fetchNotifications]);

  const markAllRead = async () => {
    try {
      await apiFetch(`/api/notifications/${email}`, { method: "PATCH" });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error("Failed to mark all read:", e);
    }
  };

  const markOneRead = async (id) => {
    try {
      await apiFetch(`/api/notifications/mark-read/${id}`, { method: "PATCH" });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error("Failed to mark read:", e);
    }
  };

  const deleteNotification = async (id) => {
    setDeleting(id);
    try {
      await apiFetch(`/api/notifications/${email}?id=${id}`, { method: "DELETE" });
      const wasUnread = notifications.find(n => n._id === id && !n.read);
      setNotifications(prev => prev.filter(n => n._id !== id));
      if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error("Failed to delete:", e);
    } finally {
      setDeleting(null);
    }
  };

  const handleAcceptCall = async (notification) => {
    if (incomingCall) return;
    await answerCall(notification.actorEmail);
    await markOneRead(notification._id);
    router.push(`/dashboard/alumni/text?chatWith=${notification.actorEmail}`);
  };

  const handleDeclineCall = async (notification) => {
    await declineCall(notification.actorEmail);
    await markOneRead(notification._id);
  };

  const filteredNotifications = (() => {
    const filtered = filter === "unread"
      ? notifications.filter(n => !n.read)
      : filter === "calls"
      ? notifications.filter(n => n.type?.startsWith("call_"))
      : notifications;
    const seen = new Set();
    return filtered.filter(n => {
      if (seen.has(n._id)) return false;
      seen.add(n._id);
      return true;
    });
  })();

  const filterButtons = [
    { key: "all", label: "All" },
    { key: "unread", label: "Unread" },
    { key: "calls", label: "Calls" },
    { key: "follow", label: "Follows" },
    { key: "message", label: "Messages" },
    { key: "admin_notice", label: "Notices" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <FiBell className="text-2xl text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-zinc-100">
                  Notifications
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : "You're all caught up"}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-sm font-semibold hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors"
              >
                <FiCheckCircle className="text-base" />
                Mark all read
              </button>
            )}
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-6 overflow-x-auto pb-2"
        >
          {filterButtons.map((btn) => (
            <button
              key={btn.key}
              onClick={() => setFilter(btn.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                filter === btn.key
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </motion.div>

        {/* Notification List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <FiBellOff className="text-3xl text-zinc-400" />
            </div>
            <h3 className="text-lg font-bold text-zinc-600 dark:text-zinc-400 mb-1">No notifications</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-500">
              {filter === "unread" ? "All caught up! No unread notifications." : "When someone interacts with you, you'll see it here."}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredNotifications.map((notification, i) => {
                const config = typeConfig[notification.type] || typeConfig.follow;
                return (
                  <motion.div
                    key={notification._id}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    custom={i}
                    layout
                    className={`group relative bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border rounded-2xl p-4 md:p-5 transition-all hover:shadow-lg ${
                      notification.read
                        ? "border-zinc-200 dark:border-zinc-800"
                        : "border-blue-200 dark:border-blue-800/50 shadow-md shadow-blue-100/50 dark:shadow-blue-900/20"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${config.bg}`}>
                        <span className={`text-lg ${config.color}`}>{config.icon}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className={`text-sm leading-relaxed ${notification.read ? 'text-zinc-600 dark:text-zinc-400' : 'text-zinc-800 dark:text-zinc-200 font-medium'}`}>
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <FiClock className="text-xs text-zinc-400" />
                              <span className="text-xs text-zinc-400">{timeAgo(notification.createdAt)}</span>
                              {notification.callDuration && (
                                <span className="text-xs text-emerald-500 font-medium ml-1">
                                  {notification.callDuration}
                                </span>
                              )}
                              {notification.callStatus === "missed" && (
                                <span className="text-xs text-red-500 font-medium ml-1">Missed</span>
                              )}
                              {notification.callStatus === "declined" && (
                                <span className="text-xs text-red-500 font-medium ml-1">Declined</span>
                              )}
                              {!notification.read && (
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notification.read && (
                              <button
                                onClick={() => markOneRead(notification._id)}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                                title="Mark as read"
                              >
                                <FiCheck className="text-sm" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification._id)}
                              disabled={deleting === notification._id}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
                              title="Delete"
                            >
                              {deleting === notification._id ? (
                                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-red-500 border-t-transparent"></div>
                              ) : (
                                <FiTrash2 className="text-sm" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Unread indicator bar */}
                    {!notification.read && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-blue-500"></div>
                    )}

                    {/* Call Action Buttons */}
                    {notification.type === "call_incoming" && notification.callStatus === "ringing" && !notification.read && (
                      <div className="flex gap-2 mt-3 px-4 pb-4">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleDeclineCall(notification)}
                          className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                        >
                          <FiPhoneOff className="w-4 h-4" />
                          Decline
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleAcceptCall(notification)}
                          className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                        >
                          <FiPhone className="w-4 h-4" />
                          Accept
                        </motion.button>
                      </div>
                    )}

                    {/* Missed Call Indicator */}
                    {notification.type === "call_missed" && (
                      <div className="flex items-center gap-2 mt-2 px-4 pb-2">
                        <FiPhoneOff className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-500 font-medium">Missed call</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
