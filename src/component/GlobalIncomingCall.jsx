"use client";
import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiPhone, FiPhoneOff, FiVideo, FiPhoneCall } from "react-icons/fi";
import { useCall } from "@/component/CallContext";

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
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl border border-white/10 p-8 shadow-2xl max-w-sm w-full mx-4"
          >
            {/* Caller Avatar with pulsing rings */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 w-24 h-24 rounded-full bg-emerald-500"
                />
                <motion.div
                  animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                  className="absolute inset-0 w-24 h-24 rounded-full bg-emerald-500"
                />
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/30">
                  {isVideo ? (
                    <FiVideo className="w-12 h-12 text-white" />
                  ) : (
                    <FiPhoneCall className="w-12 h-12 text-white" />
                  )}
                </div>
              </div>

              <h2 className="mt-6 text-2xl font-bold text-white">{callerName}</h2>
              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="mt-2 text-emerald-400 font-medium"
              >
                Incoming {isVideo ? "video" : "audio"} call...
              </motion.p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => declineCall(incomingCall.callerEmail)}
                className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-500/30"
              >
                <FiPhoneOff className="w-6 h-6" />
                Decline
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => answerCall(incomingCall.callerEmail)}
                className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30"
              >
                <FiPhone className="w-6 h-6" />
                Accept
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
