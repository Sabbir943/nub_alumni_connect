'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPhone, FiPhoneOff, FiVideo, FiVideoOff, FiMic, FiMicOff,
  FiUsers,
} from 'react-icons/fi';
import { useGroupCall } from '@/lib/useGroupCall';
import { useGroupSocket } from '@/lib/useGroupSocket';
import GroupParticipantGrid from './GroupParticipantGrid';

function GlassButton({ onClick, children, variant = 'default', size = 'md', active, className = '' }) {
  const base = 'relative flex items-center justify-center rounded-full transition-all duration-200 backdrop-blur-xl border border-white/10';
  const sizes = { sm: 'w-11 h-11', md: 'w-14 h-14', lg: 'w-16 h-16' };
  const variants = {
    default: active
      ? 'bg-white/15 text-white shadow-lg shadow-white/5'
      : 'bg-white/8 text-white/70 hover:bg-white/15 hover:text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 border-red-400/20',
    success: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 border-emerald-400/20',
    mute: 'bg-red-500/90 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 border-red-400/20',
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

function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e27] via-[#1a1040] to-[#0d1b2a]" />
      <motion.div
        animate={{ x: [0, 30, -20, 0], y: [0, -40, 20, 0], scale: [1, 1.2, 0.9, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)' }}
      />
      <motion.div
        animate={{ x: [0, -25, 35, 0], y: [0, 30, -25, 0], scale: [1, 0.85, 1.15, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, #06b6d4, transparent 70%)' }}
      />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }} />
    </div>
  );
}

function IncomingCallUI({ groupName, inviterEmail, callType, onAccept, onDecline }) {
  const isVideo = callType === 'video';
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center pb-[env(safe-area-inset-bottom)]"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        className="relative w-full max-w-sm mx-4 mb-4 sm:mb-0"
      >
        <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1040]/95 via-[#0d1b2a]/95 to-[#0a0e27]/95 backdrop-blur-xl" />
          <div className="relative p-8">
            <div className="flex flex-col items-center mb-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#0084ff] to-[#0066cc] flex items-center justify-center shadow-2xl">
                <FiUsers className="w-10 h-10 text-white" />
              </div>
              <h2 className="mt-6 text-2xl font-bold text-white">{groupName}</h2>
              <p className="text-sm text-white/60 mt-1">
                {inviterEmail.split('@')[0]} is calling
              </p>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10">
                  {isVideo ? <FiVideo className="w-3.5 h-3.5 text-emerald-400" /> : <FiPhone className="w-3.5 h-3.5 text-emerald-400" />}
                  <span className="text-xs font-medium text-white/70">{isVideo ? 'Video' : 'Audio'} Call</span>
                </div>
              </div>
              <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="mt-3 text-sm text-emerald-400 font-medium">
                Incoming call...
              </motion.p>
            </div>
            <div className="flex gap-4">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onDecline} className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-base transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-red-500/30">
                <FiPhoneOff className="w-5 h-5" /> Decline
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onAccept} className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-base transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/30">
                <FiPhone className="w-5 h-5" /> Accept
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function GroupCallOverlay({ groupId, currentUserEmail, pendingGroupCall, clearPendingGroupCall, groupSocket: groupSocketProp }) {
  const [showIncoming, setShowIncoming] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const {
    groupCallInvite,
    groupCallUserJoined,
    groupCallUserLeft,
    groupCallEnded,
    groupCallParticipants,
    groupCallOffer,
    groupCallAnswer,
    groupCallIce,
    clearGroupCallInvite,
    clearGroupCallUserJoined,
    clearGroupCallUserLeft,
    clearGroupCallEnded,
    clearGroupCallParticipants,
    clearGroupCallOffer,
    clearGroupCallAnswer,
    clearGroupCallIce,
    joinGroupCall,
    leaveGroupCall,
    endGroupCall,
    sendGroupCallOffer,
    sendGroupCallAnswer,
    sendGroupCallIce,
  } = groupSocketProp;

  const {
    localStream,
    peers,
    callState,
    callType,
    audioEnabled,
    videoEnabled,
    participants,
    joinCall,
    leaveCall,
    endCall,
    toggleAudio,
    toggleVideo,
  } = useGroupCall({
    currentUserEmail,
    groupId,
    groupSocket: {
      groupCallInvite,
      groupCallUserJoined,
      groupCallUserLeft,
      groupCallEnded,
      groupCallParticipants,
      groupCallOffer,
      groupCallAnswer,
      groupCallIce,
      clearGroupCallInvite,
      clearGroupCallUserJoined,
      clearGroupCallUserLeft,
      clearGroupCallEnded,
      clearGroupCallParticipants,
      clearGroupCallOffer,
      clearGroupCallAnswer,
      clearGroupCallIce,
      joinGroupCall,
      leaveGroupCall,
      endGroupCall,
      sendGroupCallOffer,
      sendGroupCallAnswer,
      sendGroupCallIce,
    },
  });

  // Timer
  useEffect(() => {
    let interval;
    if (callState === 'active') {
      setCallDuration(0);
      interval = setInterval(() => setCallDuration((d) => d + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  const handleAccept = useCallback(() => {
    setShowIncoming(false);
    joinCall(groupSocketProp.groupCallInvite?.callType || 'video');
  }, [joinCall, groupSocketProp.groupCallInvite]);

  const handleDecline = useCallback(() => {
    setShowIncoming(false);
    leaveCall();
  }, [leaveCall]);

  useEffect(() => {
    if (groupCallInvite && groupCallInvite.groupId === groupId) {
      setShowIncoming(true);
    }
  }, [groupCallInvite, groupId]);

  // Handle pending call initiation (user clicked call button in GroupChat)
  useEffect(() => {
    if (pendingGroupCall && pendingGroupCall.groupId === groupId) {
      joinCall(pendingGroupCall.callType || 'video');
      if (clearPendingGroupCall) clearPendingGroupCall();
    }
  }, [pendingGroupCall, groupId, joinCall, clearPendingGroupCall]);

  const formatDuration = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  if (!callState && !showIncoming) return null;

  if (showIncoming && groupCallInvite) {
    return (
      <AnimatePresence>
        <IncomingCallUI
          groupName={groupCallInvite.groupName || 'Group Call'}
          inviterEmail={groupCallInvite.inviterEmail}
          callType={groupCallInvite.callType}
          onAccept={handleAccept}
          onDecline={handleDecline}
        />
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100]"
      >
        <AnimatedBackground />

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-black/30 backdrop-blur-xl border border-white/10">
              <div>
                <p className="text-white font-semibold text-sm leading-tight">Group Call</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {callState === 'active' && (
                    <>
                      <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-white/80 text-xs font-medium tabular-nums">{formatDuration(callDuration)}</span>
                    </>
                  )}
                  {callState !== 'active' && (
                    <span className="text-white/50 text-xs">Connecting...</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-xl border border-white/10">
              <FiUsers className="w-3.5 h-3.5 text-white/60" />
              <span className="text-white/80 text-xs font-medium">{participants.length + 1}</span>
            </div>
          </div>
        </div>

        {/* Video Grid */}
        <div className="absolute inset-0 pt-20 pb-32">
          <GroupParticipantGrid
            localStream={localStream}
            peers={peers}
            participants={participants}
            currentUserEmail={currentUserEmail}
            callType={callType}
            audioEnabled={audioEnabled}
          />
        </div>

        {/* Hidden audio elements for remote streams */}
        {Object.entries(peers).map(([email, peer]) => (
          peer.remoteStream && (
            <audio
              key={email}
              ref={(el) => { if (el && el.srcObject !== peer.remoteStream) el.srcObject = peer.remoteStream; }}
              autoPlay
              playsInline
            />
          )
        ))}

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 z-20 pb-8 pt-16 bg-gradient-to-t from-black/60 via-black/20 to-transparent">
          <div className="flex justify-center gap-5 pb-[env(safe-area-inset-bottom)]">
            <GlassButton
              onClick={toggleAudio}
              variant={audioEnabled ? 'default' : 'mute'}
              active={audioEnabled}
            >
              {audioEnabled ? <FiMic className="w-5 h-5" /> : <FiMicOff className="w-5 h-5" />}
            </GlassButton>

            {callType === 'video' && (
              <GlassButton
                onClick={toggleVideo}
                variant={videoEnabled ? 'default' : 'mute'}
                active={videoEnabled}
              >
                {videoEnabled ? <FiVideo className="w-5 h-5" /> : <FiVideoOff className="w-5 h-5" />}
              </GlassButton>
            )}

            <GlassButton onClick={leaveCall} variant="danger" size="lg">
              <FiPhoneOff className="w-6 h-6" />
            </GlassButton>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
