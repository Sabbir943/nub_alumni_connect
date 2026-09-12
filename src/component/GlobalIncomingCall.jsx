"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiPhone, FiPhoneOff, FiVideo, FiPhoneCall } from "react-icons/fi";
import { useCall } from "@/component/CallContext";

function AnimatedOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e27] via-[#1a1040] to-[#0d1b2a]" />
      <motion.div
        animate={{ x: [0, 40, -30, 0], y: [0, -50, 30, 0], scale: [1, 1.3, 0.8, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)" }}
      />
      <motion.div
        animate={{ x: [0, -35, 45, 0], y: [0, 40, -35, 0], scale: [1, 0.8, 1.2, 1] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        className="absolute bottom-[-20%] left-[-15%] w-[700px] h-[700px] rounded-full opacity-15"
        style={{ background: "radial-gradient(circle, #06b6d4, transparent 70%)" }}
      />
      <motion.div
        animate={{ x: [0, 25, -20, 0], y: [0, -25, 20, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        className="absolute top-[35%] left-[25%] w-[400px] h-[400px] rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #8b5cf6, transparent 70%)" }}
      />
    </div>
  );
}

function CallerAvatar({ name, isVideo }) {
  const initials = name
    ? name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Triple pulsing rings */}
      {[0, 0.5, 1].map((delay, i) => (
        <motion.div
          key={i}
          animate={{ scale: [1, 2 + i * 0.3], opacity: [0.35, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut", delay }}
          className="absolute w-28 h-28 rounded-full border-2 border-emerald-400/40"
        />
      ))}

      {/* Glow */}
      <div className="absolute w-28 h-28 rounded-full bg-emerald-500/20 blur-2xl" />

      {/* Avatar circle */}
      <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl"
        style={{ boxShadow: "0 0 60px rgba(99, 102, 241, 0.4), 0 0 120px rgba(99, 102, 241, 0.1)" }}
      >
        <span className="text-3xl font-bold text-white">{initials}</span>
      </div>
    </div>
  );
}

export default function GlobalIncomingCall() {
  const { incomingCall, answerCall, declineCall, callState } = useCall();

  if (!incomingCall || callState) return null;

  const callerName = incomingCall.callerName || incomingCall.callerEmail?.split("@")[0];
  const isVideo = incomingCall.callType === "video";

  return (
    <AnimatePresence>
      {incomingCall && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center"
        >
          <AnimatedOrbs />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center px-6 max-w-sm w-full">
            {/* Top label */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-8 flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 backdrop-blur-xl"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-white/70 uppercase tracking-wider">Incoming Call</span>
            </motion.div>

            {/* Avatar */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.15 }}
            >
              <CallerAvatar name={callerName} isVideo={isVideo} />
            </motion.div>

            {/* Name */}
            <motion.h2
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="mt-8 text-3xl font-bold text-white text-center"
            >
              {callerName}
            </motion.h2>

            {/* Call type badge */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="mt-3 flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10"
            >
              {isVideo ? (
                <FiVideo className="w-4 h-4 text-cyan-400" />
              ) : (
                <FiPhoneCall className="w-4 h-4 text-cyan-400" />
              )}
              <span className="text-sm text-white/60 font-medium">
                {isVideo ? "Video Call" : "Audio Call"}
              </span>
            </motion.div>

            {/* Action buttons */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.45, type: "spring", stiffness: 200 }}
              className="mt-12 flex gap-6 w-full"
            >
              {/* Decline */}
              <div className="flex-1 flex flex-col items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => declineCall(incomingCall.callerEmail)}
                  className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/40 border border-red-400/20"
                >
                  <FiPhoneOff className="w-7 h-7 text-white" />
                </motion.button>
                <span className="text-xs text-white/50 font-medium">Decline</span>
              </div>

              {/* Accept */}
              <div className="flex-1 flex flex-col items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  onClick={() => answerCall(incomingCall.callerEmail)}
                  className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/40 border border-emerald-400/20"
                >
                  <FiPhone className="w-7 h-7 text-white" />
                </motion.button>
                <span className="text-xs text-white/50 font-medium">Accept</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
