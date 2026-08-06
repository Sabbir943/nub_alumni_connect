"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPhone, FiPhoneOff, FiVideo, FiVideoOff, FiMic, FiMicOff,
  FiMaximize2, FiMinimize2, FiUser,
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
        className={`w-full h-full object-cover ${isLocal ? "rounded-xl" : ""}`}
        style={{ transform: isLocal ? "scaleX(-1)" : "none" }}
      />
      {label && (
        <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 text-white text-[10px] font-semibold rounded-lg backdrop-blur-sm">
          {label}
        </span>
      )}
    </div>
  );
}

function AudioOnlyView({ name, isRinging }) {
  return (
    <div className="flex flex-col items-center justify-center">
      {/* Pulsing rings when ringing */}
      <div className="relative">
        {isRinging && (
          <>
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 w-32 h-32 rounded-full bg-emerald-500"
            />
            <motion.div
              animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
              className="absolute inset-0 w-32 h-32 rounded-full bg-emerald-500"
            />
          </>
        )}
        <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/30">
          <FiUser className="w-16 h-16 text-white" />
        </div>
      </div>
      <h2 className="mt-6 text-2xl font-bold text-white">{name || "Unknown"}</h2>
      {isRinging && (
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="mt-4 flex items-center gap-2"
        >
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm text-emerald-400 font-medium">Ringing...</span>
        </motion.div>
      )}
    </div>
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
    <div className="flex items-center gap-4">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onToggleAudio}
        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
          audioEnabled
            ? "bg-white/10 hover:bg-white/20 text-white"
            : "bg-red-500 hover:bg-red-600 text-white"
        }`}
      >
        {audioEnabled ? <FiMic className="w-6 h-6" /> : <FiMicOff className="w-6 h-6" />}
      </motion.button>

      {callType === "video" && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onToggleVideo}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            videoEnabled
              ? "bg-white/10 hover:bg-white/20 text-white"
              : "bg-red-500 hover:bg-red-600 text-white"
          }`}
        >
          {videoEnabled ? <FiVideo className="w-6 h-6" /> : <FiVideoOff className="w-6 h-6" />}
        </motion.button>
      )}

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onEndCall}
        className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/30"
      >
        <FiPhoneOff className="w-7 h-7" />
      </motion.button>
    </div>
  );
}

function IncomingCallUI({ callerName, callType, onAccept, onDecline }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 shadow-2xl min-w-[300px]">
        <div className="text-center mb-4">
          {/* Pulsing rings around avatar */}
          <div className="relative inline-block">
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 w-16 h-16 rounded-full bg-emerald-500"
            />
            <motion.div
              animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
              className="absolute inset-0 w-16 h-16 rounded-full bg-emerald-500"
            />
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto">
              <FiUser className="w-8 h-8 text-white" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-white mt-3">{callerName}</h3>
          <p className="text-sm text-white/70 mt-1">
            Incoming {callType} call...
          </p>
        </div>

        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onDecline}
            className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <FiPhoneOff className="w-5 h-5" />
            Decline
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAccept}
            className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <FiPhone className="w-5 h-5" />
            Accept
          </motion.button>
        </div>
      </div>
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
  const [callDuration, setCallDuration] = useState(0);
  const [isConnecting, setIsConnecting] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    if (callState === "connected") {
      setIsConnecting(false);
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [callState]);

  useEffect(() => {
    if (!callState) {
      setCallDuration(0);
      setIsConnecting(true);
    }
  }, [callState]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const displayName = incomingCall?.callType === "video" ? calleeName : calleeName;

  if (!callState && !incomingCall) return null;

  // Incoming call UI (when not in a call yet)
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
        className="fixed inset-0 z-[100] bg-slate-900"
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-500 rounded-full translate-y-1/3 -translate-x-1/4 blur-3xl" />
        </div>

        {/* Video area */}
        {callType === "video" ? (
          <div className="relative w-full h-full">
            {/* Remote video (full screen) */}
            <div className="absolute inset-0">
              {remoteStream ? (
                <VideoStream stream={remoteStream} muted={false} isLocal={false} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <AudioOnlyView
                    name={displayName || "Connecting..."}
                    isRinging={callState === "ringing" || isConnecting}
                  />
                </div>
              )}
            </div>

            {/* Local video (PiP) */}
            {localStream && videoEnabled && (
              <div className="absolute top-4 right-4 w-40 h-28 sm:w-48 sm:h-36 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl z-10">
                <VideoStream stream={localStream} muted={true} isLocal={true} />
              </div>
            )}

            {/* Call info overlay */}
            <div className="absolute top-4 left-4 z-10">
              <div className="bg-black/30 backdrop-blur-sm rounded-xl px-4 py-2">
                <p className="text-white font-semibold text-sm">
                  {displayName || "Unknown"}
                </p>
                <p className="text-white/70 text-xs mt-0.5">
                  {isConnecting ? "Connecting..." : formatDuration(callDuration)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Audio-only call */
          <div className="flex items-center justify-center h-full">
            <AudioOnlyView
              name={displayName || "Connecting..."}
              isRinging={callState === "ringing" || isConnecting}
            />
            {!isConnecting && (
              <div className="absolute top-8 left-1/2 -translate-x-1/2">
                <p className="text-white/70 text-sm font-medium">
                  {formatDuration(callDuration)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Hidden audio element to ensure remote audio plays in all call types */}
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

        {/* Controls */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
          <CallControls
            audioEnabled={audioEnabled}
            videoEnabled={videoEnabled}
            onToggleAudio={onToggleAudio}
            onToggleVideo={onToggleVideo}
            onEndCall={onEndCall}
            callType={callType}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
