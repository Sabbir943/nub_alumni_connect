'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { getVideoConstraints, getAudioConstraints } from './mobileMedia';
import {
  playConnectSound,
  playEndSound,
  playIncomingRingtone,
  stopRingtone,
} from './ringtone';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};

export function useGroupCall({
  currentUserEmail,
  groupId,
  groupSocket,
}) {
  const [localStream, setLocalStream] = useState(null);
  const [peers, setPeers] = useState(new Map());
  const [callState, setCallState] = useState(null);
  const [callType, setCallType] = useState('video');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [participants, setParticipants] = useState([]);

  const localStreamRef = useRef(null);
  const peersRef = useRef(new Map());
  const pendingCandidatesRef = useRef(new Map());
  const callStateRef = useRef(null);

  const {
    groupCallInvite,
    groupCallUserJoined,
    groupCallUserLeft,
    groupCallEnded,
    groupCallParticipants,
    groupCallOffer,
    groupCallAnswer,
    groupCallIce,
    joinGroupCall,
    leaveGroupCall,
    endGroupCall,
    sendGroupCallOffer,
    sendGroupCallAnswer,
    sendGroupCallIce,
    clearGroupCallInvite,
    clearGroupCallUserJoined,
    clearGroupCallUserLeft,
    clearGroupCallEnded,
    clearGroupCallParticipants,
    clearGroupCallOffer,
    clearGroupCallAnswer,
    clearGroupCallIce,
  } = groupSocket;

  const setupLocalStream = useCallback(async (type = 'video') => {
    try {
      const constraints = {
        audio: getAudioConstraints(),
        video: getVideoConstraints(type),
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      localStreamRef.current = stream;
      return stream;
    } catch (err) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        setLocalStream(stream);
        localStreamRef.current = stream;
        setVideoEnabled(false);
        return stream;
      } catch {
        return null;
      }
    }
  }, []);

  const createPeerConnection = useCallback((remoteEmail, isInitiator, stream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendGroupCallIce(groupId, remoteEmail, event.candidate.toJSON());
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setPeers((prev) => {
          const next = new Map(prev);
          const existing = next.get(remoteEmail) || {};
          next.set(remoteEmail, { ...existing, remoteStream: event.streams[0], connection: pc });
          return next;
        });
        peersRef.current.set(remoteEmail, {
          ...peersRef.current.get(remoteEmail),
          remoteStream: event.streams[0],
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      if (state === 'connected' || state === 'completed') {
        playConnectSound();
      } else if (state === 'disconnected' || state === 'failed') {
        playEndSound();
      }
    };

    peersRef.current.set(remoteEmail, {
      connection: pc,
      remoteStream: null,
    });

    return pc;
  }, [groupId, sendGroupCallIce]);

  // Handle incoming group call invite
  useEffect(() => {
    if (!groupCallInvite || groupCallInvite.groupId !== groupId) return;

    setCallState('ringing');
    setCallType(groupCallInvite.callType);
    playIncomingRingtone();
    clearGroupCallInvite();
  }, [groupCallInvite, groupId, clearGroupCallInvite]);

  // Handle user joined
  useEffect(() => {
    if (!groupCallUserJoined || groupCallUserJoined.groupId !== groupId) return;
    const { email: joinedEmail } = groupCallUserJoined;
    if (joinedEmail === currentUserEmail) return;

    setParticipants((prev) => {
      if (prev.includes(joinedEmail)) return prev;
      return [...prev, joinedEmail];
    });

    if (callStateRef.current === 'active' && localStreamRef.current) {
      const pc = createPeerConnection(joinedEmail, true, localStreamRef.current);
      pc.createOffer().then((offer) => {
        pc.setLocalDescription(offer);
        sendGroupCallOffer(groupId, joinedEmail, offer.toJSON());
      }).catch(() => {});
    }

    clearGroupCallUserJoined();
  }, [groupCallUserJoined, groupId, currentUserEmail, createPeerConnection, sendGroupCallOffer, clearGroupCallUserJoined]);

  // Handle user left
  useEffect(() => {
    if (!groupCallUserLeft || groupCallUserLeft.groupId !== groupId) return;
    const { email: leftEmail } = groupCallUserLeft;

    const peer = peersRef.current.get(leftEmail);
    if (peer?.connection) {
      peer.connection.close();
    }
    peersRef.current.delete(leftEmail);
    pendingCandidatesRef.current.delete(leftEmail);

    setPeers((prev) => {
      const next = new Map(prev);
      next.delete(leftEmail);
      return next;
    });

    setParticipants((prev) => prev.filter((e) => e !== leftEmail));
    clearGroupCallUserLeft();
  }, [groupCallUserLeft, groupId, clearGroupCallUserLeft]);

  // Handle call ended
  useEffect(() => {
    if (!groupCallEnded || groupCallEnded.groupId !== groupId) return;

    for (const [email, peer] of peersRef.current) {
      if (peer.connection) peer.connection.close();
    }
    peersRef.current.clear();
    pendingCandidatesRef.current.clear();

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
      localStreamRef.current = null;
    }

    setPeers(new Map());
    setCallState(null);
    callStateRef.current = null;
    setParticipants([]);
    setAudioEnabled(true);
    setVideoEnabled(true);
    stopRingtone();
    clearGroupCallEnded();
  }, [groupCallEnded, groupId, clearGroupCallEnded]);

  // Handle participants list — create peer connections for existing participants
  useEffect(() => {
    if (!groupCallParticipants || groupCallParticipants.groupId !== groupId) return;
    const remoteParticipants = groupCallParticipants.participants.filter((e) => e !== currentUserEmail);
    setParticipants(remoteParticipants);
    setCallType(groupCallParticipants.callType);

    // Create peer connections for each existing participant
    if (callStateRef.current === 'active' && localStreamRef.current) {
      for (const remoteEmail of remoteParticipants) {
        if (!peersRef.current.has(remoteEmail)) {
          const pc = createPeerConnection(remoteEmail, true, localStreamRef.current);
          pc.createOffer().then((offer) => {
            pc.setLocalDescription(offer);
            sendGroupCallOffer(groupId, remoteEmail, offer.toJSON());
          }).catch(() => {});
        }
      }
    }

    clearGroupCallParticipants();
  }, [groupCallParticipants, groupId, currentUserEmail, createPeerConnection, sendGroupCallOffer, clearGroupCallParticipants]);

  // Handle incoming offer
  useEffect(() => {
    if (!groupCallOffer || groupCallOffer.groupId !== groupId) return;
    const { fromEmail, offer } = groupCallOffer;

    const handleOffer = async () => {
      let pc = peersRef.current.get(fromEmail)?.connection;
      if (!pc && localStreamRef.current) {
        pc = createPeerConnection(fromEmail, false, localStreamRef.current);
      }
      if (!pc) return;

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendGroupCallAnswer(groupId, fromEmail, answer.toJSON());

        const queued = pendingCandidatesRef.current.get(fromEmail) || [];
        for (const c of queued) {
          await pc.addIceCandidate(new RTCIceCandidate(c));
        }
        pendingCandidatesRef.current.delete(fromEmail);
      } catch (e) {
        console.error('Failed to handle group call offer:', e);
      }
    };

    handleOffer();
    clearGroupCallOffer();
  }, [groupCallOffer, groupId, createPeerConnection, sendGroupCallAnswer, clearGroupCallOffer]);

  // Handle incoming answer
  useEffect(() => {
    if (!groupCallAnswer || groupCallAnswer.groupId !== groupId) return;
    const { fromEmail, answer } = groupCallAnswer;

    const handleAnswer = async () => {
      const peer = peersRef.current.get(fromEmail);
      if (!peer?.connection) return;

      try {
        if (peer.connection.signalingState === 'have-local-offer') {
          await peer.connection.setRemoteDescription(new RTCSessionDescription(answer));
          const queued = pendingCandidatesRef.current.get(fromEmail) || [];
          for (const c of queued) {
            await peer.connection.addIceCandidate(new RTCIceCandidate(c));
          }
          pendingCandidatesRef.current.delete(fromEmail);
        }
      } catch (e) {
        console.error('Failed to handle group call answer:', e);
      }
    };

    handleAnswer();
    clearGroupCallAnswer();
  }, [groupCallAnswer, groupId, clearGroupCallAnswer]);

  // Handle incoming ICE candidate
  useEffect(() => {
    if (!groupCallIce || groupCallIce.groupId !== groupId) return;
    const { fromEmail, candidate } = groupCallIce;

    const handleIce = async () => {
      const peer = peersRef.current.get(fromEmail);
      if (peer?.connection?.remoteDescription) {
        try {
          await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Failed to add group call ICE candidate:', e);
        }
      } else {
        if (!pendingCandidatesRef.current.has(fromEmail)) {
          pendingCandidatesRef.current.set(fromEmail, []);
        }
        pendingCandidatesRef.current.get(fromEmail).push(candidate);
      }
    };

    handleIce();
    clearGroupCallIce();
  }, [groupCallIce, groupId, clearGroupCallIce]);

  // Join call
  const joinCall = useCallback(async (type = 'video') => {
    setCallType(type);
    setCallState('active');
    callStateRef.current = 'active';

    const stream = await setupLocalStream(type);
    if (!stream) {
      setCallState(null);
      callStateRef.current = null;
      return;
    }

    joinGroupCall(groupId);
  }, [groupId, setupLocalStream, joinGroupCall]);

  // Leave call
  const leaveCall = useCallback(() => {
    for (const [email, peer] of peersRef.current) {
      if (peer.connection) peer.connection.close();
    }
    peersRef.current.clear();
    pendingCandidatesRef.current.clear();

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
      localStreamRef.current = null;
    }

    setPeers(new Map());
    setCallState(null);
    callStateRef.current = null;
    setParticipants([]);
    setAudioEnabled(true);
    setVideoEnabled(true);

    leaveGroupCall(groupId);
  }, [groupId, leaveGroupCall]);

  // End call (admin)
  const endCall = useCallback(() => {
    for (const [email, peer] of peersRef.current) {
      if (peer.connection) peer.connection.close();
    }
    peersRef.current.clear();
    pendingCandidatesRef.current.clear();

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
      localStreamRef.current = null;
    }

    setPeers(new Map());
    setCallState(null);
    callStateRef.current = null;
    setParticipants([]);
    setAudioEnabled(true);
    setVideoEnabled(true);

    endGroupCall(groupId);
  }, [groupId, endGroupCall]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
      setAudioEnabled((prev) => !prev);
    }
  }, [localStream]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
      setVideoEnabled((prev) => !prev);
    }
  }, [localStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      for (const [email, peer] of peersRef.current) {
        if (peer.connection) peer.connection.close();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return {
    localStream,
    peers: Object.fromEntries(peers),
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
  };
}
