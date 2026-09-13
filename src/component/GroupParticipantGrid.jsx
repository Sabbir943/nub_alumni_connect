'use client';
import React, { useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';

function VideoTile({ stream, label, isLocal, isMuted }) {
  const videoRef = useRef(null);

  const attachStream = useCallback((el, s) => {
    if (el && s && el.srcObject !== s) {
      el.srcObject = s;
    }
  }, []);

  useEffect(() => {
    attachStream(videoRef.current, stream);
  }, [stream, attachStream]);

  const initials = label
    ? label.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  if (!stream) {
    return (
      <div className="relative w-full h-full rounded-2xl overflow-hidden bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-xl font-bold text-white shadow-2xl">
          {initials}
        </div>
        <span className="absolute bottom-2 left-2 px-3 py-1 bg-black/40 backdrop-blur-md text-white text-[11px] font-semibold rounded-full">
          {label}
        </span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black">
      <video
        ref={(el) => {
          videoRef.current = el;
          attachStream(el, stream);
        }}
        autoPlay
        playsInline
        muted={isMuted}
        className="w-full h-full object-cover"
        style={{ transform: isLocal ? 'scaleX(-1)' : 'none' }}
      />
      <span className="absolute bottom-2 left-2 px-3 py-1 bg-black/40 backdrop-blur-md text-white text-[11px] font-semibold rounded-full">
        {label} {isLocal ? '(You)' : ''}
      </span>
      {isMuted && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-red-500/80 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        </div>
      )}
    </div>
  );
}

function AudioOnlyTile({ label, isMuted }) {
  const initials = label
    ? label.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-xl font-bold text-white shadow-2xl">
        {initials}
      </div>
      <span className="absolute bottom-2 left-2 px-3 py-1 bg-black/40 backdrop-blur-md text-white text-[11px] font-semibold rounded-full">
        {label}
      </span>
      {isMuted && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-red-500/80 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        </div>
      )}
    </div>
  );
}

export default function GroupParticipantGrid({
  localStream,
  peers,
  participants,
  currentUserEmail,
  callType,
  audioEnabled,
}) {
  const allParticipants = [
    { email: currentUserEmail, label: 'You', stream: localStream, isLocal: true, muted: !audioEnabled },
    ...participants.map((email) => ({
      email,
      label: email.split('@')[0],
      stream: peers[email]?.remoteStream || null,
      isLocal: false,
      muted: false,
    })),
  ];

  const count = allParticipants.length;

  const getGridClass = () => {
    if (count <= 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2 grid-rows-2';
    return 'grid-cols-3 grid-rows-2';
  };

  const getHeightClass = () => {
    if (count <= 2) return 'h-full';
    return 'h-full';
  };

  return (
    <div className={`grid ${getGridClass()} ${getHeightClass()} gap-2 p-2`}>
      {allParticipants.map((p) => (
        <motion.div
          key={p.email}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="relative min-h-0"
        >
          {callType === 'video' ? (
            <VideoTile
              stream={p.stream}
              label={p.label}
              isLocal={p.isLocal}
              isMuted={p.muted}
            />
          ) : (
            <AudioOnlyTile
              label={p.label}
              isMuted={p.muted}
            />
          )}
        </motion.div>
      ))}
    </div>
  );
}
