"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import {
  FiPhone, FiPhoneOff, FiVideo, FiVideoOff, FiMic, FiMicOff,
  FiUser, FiMaximize2, FiMinimize2, FiCamera,
} from "react-icons/fi";

function VideoStream({ stream, muted, label, isLocal }) {
  const videoRef = useRef(null);

  const attachStream = useCallback((el, s) => {
    if (el && s && el.srcObject !== s) {
      el.srcObject = s;
    }
  }, []);

  useEffect(() => {
    attachStream(videoRef.current, stream);
  }, [stream, attachStream]);

  if (!stream) return null;

  return (
    <div className={`relative ${isLocal ? "" : "w-full h-full"}`}>
      <video
        ref={(el) => {
          videoRef.current = el;
          attachStream(el, stream);
        }}
        autoPlay
        playsInline
        muted={muted}
        className={`w-full h-full object-cover ${isLocal ? "rounded-2xl" : ""}`}
        style={{ transform: isLocal ? "scaleX(-1)" : "none" }}
      />
      {label && (
        <span className="absolute bottom-2 left-2 px-3 py-1 bg-black/40 backdrop-blur-md text-white text-[11px] font-semibold rounded-full">
          {label}
        </span>
      )}
    </div>
  );
}

const BAR_HEIGHTS = [10, 28, 16, 32, 12];
const BAR_DURATIONS = [0.9, 1.1, 0.8, 1.0, 1.2];

function AudioVisualizer({ isRinging }) {
  return (
    <div className="flex items-end gap-[3px] h-10">
      {BAR_HEIGHTS.map((h, i) => (
        <motion.div
          key={i}
          animate={
            isRinging
              ? { height: [8, h, 8], opacity: [0.4, 1, 0.4] }
              : { height: [6, 12, 6], opacity: [0.3, 0.6, 0.3] }
          }
          transition={{
            duration: isRinging ? BAR_DURATIONS[i] : 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.1,
          }}
          className="w-[3px] rounded-full bg-gradient-to-t from-emerald-400 to-cyan-400"
          style={{ minHeight: 4 }}
        />
      ))}
    </div>
  );
}

function AnimatedBackground({ variant = "call" }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e27] via-[#1a1040] to-[#0d1b2a]" />

      {/* Animated orbs */}
      <motion.div
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -40, 20, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)" }}
      />
      <motion.div
        animate={{
          x: [0, -25, 35, 0],
          y: [0, 30, -25, 0],
          scale: [1, 0.85, 1.15, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-15"
        style={{ background: "radial-gradient(circle, #06b6d4, transparent 70%)" }}
      />
      {variant === "call" && (
        <motion.div
          animate={{
            x: [0, 20, -30, 0],
            y: [0, -20, 30, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute top-[40%] left-[30%] w-[350px] h-[350px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #8b5cf6, transparent 70%)" }}
        />
      )}
      {/* Noise overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
    </div>
  );
}

function AvatarWithPulse({ name, size = "lg", isRinging }) {
  const initials = name
    ? name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const sizeClasses = {
    sm: "w-14 h-14 text-lg",
    md: "w-20 h-20 text-2xl",
    lg: "w-28 h-28 text-3xl",
    xl: "w-36 h-36 text-4xl",
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Pulsing rings */}
      {isRinging && (
        <>
          <motion.div
            animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            className={`absolute rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 ${sizeClasses[size]}`}
          />
          <motion.div
            animate={{ scale: [1, 2], opacity: [0.2, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
            className={`absolute rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 ${sizeClasses[size]}`}
          />
          <motion.div
            animate={{ scale: [1, 2.4], opacity: [0.1, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 1 }}
            className={`absolute rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 ${sizeClasses[size]}`}
          />
        </>
      )}
      {/* Avatar */}
      <div
        className={`relative ${sizeClasses[size]} rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center font-bold text-white shadow-2xl`}
        style={{ boxShadow: "0 0 40px rgba(99, 102, 241, 0.3)" }}
      >
        {initials}
      </div>
    </div>
  );
}

function CallTimer({ callState, className = "" }) {
  const [duration, setDuration] = useState(0);
  const timerRef = useRef(null);
  const startRef = useRef(0);

  useEffect(() => {
    if (callState === "connected") {
      startRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startRef.current) / 1000));
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callState]);

  const elapsed = callState === "connected" ? duration : 0;
  const mins = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const secs = (elapsed % 60).toString().padStart(2, "0");

  if (callState !== "connected") return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <motion.div
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="w-2 h-2 rounded-full bg-emerald-400"
      />
      <span className="text-white/80 text-sm font-medium tabular-nums tracking-wider">
        {mins}:{secs}
      </span>
    </div>
  );
}

function GlassButton({ onClick, children, variant = "default", size = "md", active, className = "" }) {
  const base = "relative flex items-center justify-center rounded-full transition-all duration-200 backdrop-blur-xl border border-white/10";

  const sizes = {
    sm: "w-11 h-11",
    md: "w-14 h-14",
    lg: "w-16 h-16",
  };

  const variants = {
    default: active
      ? "bg-white/15 text-white shadow-lg shadow-white/5"
      : "bg-white/8 text-white/70 hover:bg-white/15 hover:text-white",
    danger: "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 border-red-400/20",
    success: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 border-emerald-400/20",
    mute: "bg-red-500/90 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 border-red-400/20",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
}

function CallControls({
  audioEnabled,
  videoEnabled,
  onToggleAudio,
  onToggleVideo,
  onEndCall,
  callType,
}) {
  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      className="flex items-center gap-5"
    >
      <GlassButton
        onClick={onToggleAudio}
        variant={audioEnabled ? "default" : "mute"}
        size="md"
        active={audioEnabled}
      >
        {audioEnabled ? <FiMic className="w-5 h-5" /> : <FiMicOff className="w-5 h-5" />}
      </GlassButton>

      {callType === "video" && (
        <GlassButton
          onClick={onToggleVideo}
          variant={videoEnabled ? "default" : "mute"}
          size="md"
          active={videoEnabled}
        >
          {videoEnabled ? <FiVideo className="w-5 h-5" /> : <FiVideoOff className="w-5 h-5" />}
        </GlassButton>
      )}

      <GlassButton onClick={onEndCall} variant="danger" size="lg">
        <FiPhoneOff className="w-6 h-6" />
      </GlassButton>
    </motion.div>
  );
}

function IncomingCallUI({ callerName, callType, onAccept, onDecline }) {
  const isVideo = callType === "video";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center pb-[env(safe-area-inset-bottom)]"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      {/* Card */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        className="relative w-full max-w-sm mx-4 mb-4 sm:mb-0"
      >
        <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
          {/* Card background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1040]/95 via-[#0d1b2a]/95 to-[#0a0e27]/95 backdrop-blur-xl" />

          <div className="relative p-8">
            {/* Caller info */}
            <div className="flex flex-col items-center mb-8">
              <AvatarWithPulse name={callerName} size="lg" isRinging={true} />

              <motion.h2
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="mt-6 text-2xl font-bold text-white"
              >
                {callerName}
              </motion.h2>

              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-3 flex items-center gap-2"
              >
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10">
                  {isVideo ? (
                    <FiVideo className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <FiPhone className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span className="text-xs font-medium text-white/70">
                    {isVideo ? "Video Call" : "Audio Call"}
                  </span>
                </div>
              </motion.div>

              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mt-3 text-sm text-emerald-400 font-medium"
              >
                Incoming call...
              </motion.p>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onDecline}
                className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-base transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40"
              >
                <FiPhoneOff className="w-5 h-5" />
                Decline
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onAccept}
                className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-base transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40"
              >
                <FiPhone className="w-5 h-5" />
                Accept
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function CallOverlay({
  callState,
  incomingCall,
  localStream,
  remoteStream,
  audioEnabled,
  videoEnabled,
  callType,
  callerName,
  calleeName,
  onAccept,
  onDecline,
  onEndCall,
  onToggleAudio,
  onToggleVideo,
}) {
  const isConnecting = callState && callState !== "connected";

  const displayName = incomingCall?.callerName || calleeName || "Unknown";

  if (!callState && !incomingCall) return null;

  // Incoming call (when already in overlay mode)
  if (incomingCall && !callState) {
    return (
      <AnimatePresence>
        <IncomingCallUI
          callerName={incomingCall.callerName || incomingCall.callerEmail?.split("@")[0]}
          callType={incomingCall.callType}
          onAccept={() => onAccept(incomingCall.callerEmail)}
          onDecline={() => onDecline(incomingCall.callerEmail)}
        />
      </AnimatePresence>
    );
  }

  // Active call overlay
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100]"
      >
        <AnimatedBackground variant="call" />

        {/* Video call layout */}
        {callType === "video" ? (
          <div className="relative w-full h-full">
            {/* Remote video (full screen) */}
            <div className="absolute inset-0">
              {remoteStream ? (
                <VideoStream stream={remoteStream} muted={false} isLocal={false} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center">
                    <AvatarWithPulse name={displayName} size="xl" isRinging={isConnecting} />
                    <motion.h2
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="mt-6 text-2xl font-bold text-white"
                    >
                      {displayName}
                    </motion.h2>
                    <motion.p
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="mt-2 text-sm text-white/60"
                    >
                      {isConnecting ? "Connecting..." : "Waiting for video..."}
                    </motion.p>
                  </div>
                </div>
              )}
            </div>

            {/* Local video (PiP) */}
            {localStream && videoEnabled && (
              <motion.div
                drag
                dragMomentum={false}
                onDragStart={() => setIsPipDragging(true)}
                onDragEnd={() => setIsPipDragging(false)}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute top-5 right-5 w-36 h-28 sm:w-44 sm:h-32 rounded-2xl overflow-hidden border border-white/20 shadow-2xl z-10 cursor-grab active:cursor-grabbing"
                style={{
                  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                  background: "rgba(0,0,0,0.2)",
                }}
              >
                <VideoStream stream={localStream} muted={true} isLocal={true} label="You" />
              </motion.div>
            )}

            {/* Top info bar */}
            <div className="absolute top-0 left-0 right-0 z-10 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-black/30 backdrop-blur-xl border border-white/10">
                  <div>
                    <p className="text-white font-semibold text-sm leading-tight">
                      {displayName}
                    </p>
                    <CallTimer callState={callState} className="mt-0.5" />
                    {isConnecting && (
                      <p className="text-white/50 text-xs mt-0.5">Connecting...</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Audio-only call */
          <div className="relative flex items-center justify-center h-full">
            <div className="flex flex-col items-center">
              <AvatarWithPulse name={displayName} size="xl" isRinging={isConnecting} />

              <motion.h2
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="mt-8 text-3xl font-bold text-white"
              >
                {displayName}
              </motion.h2>

              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-3"
              >
                {isConnecting ? (
                  <motion.p
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-sm text-white/50"
                  >
                    Connecting...
                  </motion.p>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <CallTimer callState={callState} />
                    <AudioVisualizer isRinging={false} />
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        )}

        {/* Hidden audio element */}
        {remoteStream && (
          <audio
            ref={(el) => {
              if (el && el.srcObject !== remoteStream) {
                el.srcObject = remoteStream;
              }
            }}
            autoPlay
            playsInline
          />
        )}

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 z-20 pb-8 pt-16 bg-gradient-to-t from-black/60 via-black/20 to-transparent">
          <div className="flex justify-center pb-[env(safe-area-inset-bottom)]">
            <CallControls
              audioEnabled={audioEnabled}
              videoEnabled={videoEnabled}
              onToggleAudio={onToggleAudio}
              onToggleVideo={onToggleVideo}
              onEndCall={onEndCall}
              callType={callType}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
