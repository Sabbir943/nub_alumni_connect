'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import {
  playIncomingRingtone,
  stopRingtone,
} from './ringtone';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

let groupSocket = null;

function getGroupSocket() {
  if (!groupSocket) {
    groupSocket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }
  return groupSocket;
}

export function useGroupSocket(email) {
  const [isConnected, setIsConnected] = useState(false);
  const [newGroupMessage, setNewGroupMessage] = useState(null);
  const [groupTypingUsers, setGroupTypingUsers] = useState({});
  const [groupCallInvite, setGroupCallInvite] = useState(null);
  const [groupCallUserJoined, setGroupCallUserJoined] = useState(null);
  const [groupCallUserLeft, setGroupCallUserLeft] = useState(null);
  const [groupCallEnded, setGroupCallEnded] = useState(null);
  const [groupCallParticipants, setGroupCallParticipants] = useState(null);
  const [groupCallOffer, setGroupCallOffer] = useState(null);
  const [groupCallAnswer, setGroupCallAnswer] = useState(null);
  const [groupCallIce, setGroupCallIce] = useState(null);
  const [groupCallError, setGroupCallError] = useState(null);

  const socketRef = useRef(null);
  const typingTimers = useRef({});
  const joinedGroupsRef = useRef(new Set());

  useEffect(() => {
    if (!email) return;

    const s = getGroupSocket();
    socketRef.current = s;

    if (!s.connected) {
      s.connect();
    }

    s.on('connect', () => {
      s.emit('join', email);
      setIsConnected(true);
      for (const groupId of joinedGroupsRef.current) {
        s.emit('join-group', { groupId });
      }
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    s.on('group-message-received', (data) => {
      setNewGroupMessage(data);
    });

    s.on('group-user-typing', ({ groupId, email: typingEmail }) => {
      setGroupTypingUsers((prev) => ({
        ...prev,
        [groupId]: [...new Set([...(prev[groupId] || []), typingEmail])],
      }));
      const key = `${groupId}:${typingEmail}`;
      if (typingTimers.current[key]) clearTimeout(typingTimers.current[key]);
      typingTimers.current[key] = setTimeout(() => {
        setGroupTypingUsers((prev) => ({
          ...prev,
          [groupId]: (prev[groupId] || []).filter((e) => e !== typingEmail),
        }));
      }, 3000);
    });

    s.on('group-user-stopped-typing', ({ groupId, email: typingEmail }) => {
      const key = `${groupId}:${typingEmail}`;
      if (typingTimers.current[key]) clearTimeout(typingTimers.current[key]);
      setGroupTypingUsers((prev) => ({
        ...prev,
        [groupId]: (prev[groupId] || []).filter((e) => e !== typingEmail),
      }));
    });

    s.on('group-call-invited', (data) => {
      setGroupCallInvite(data);
      playIncomingRingtone();
    });

    s.on('group-call-user-joined', (data) => {
      setGroupCallUserJoined(data);
    });

    s.on('group-call-user-left', (data) => {
      setGroupCallUserLeft(data);
    });

    s.on('group-call-ended', (data) => {
      setGroupCallEnded(data);
      stopRingtone();
    });

    s.on('group-call-participants', (data) => {
      setGroupCallParticipants(data);
    });

    s.on('group-call-offer', (data) => {
      setGroupCallOffer(data);
    });

    s.on('group-call-answer', (data) => {
      setGroupCallAnswer(data);
    });

    s.on('group-call-ice', (data) => {
      setGroupCallIce(data);
    });

    s.on('group-call-error', (data) => {
      setGroupCallError(data.error);
      setTimeout(() => setGroupCallError(null), 3000);
    });

    return () => {
      Object.values(typingTimers.current).forEach(clearTimeout);
      s.off('connect');
      s.off('disconnect');
      s.off('group-message-received');
      s.off('group-user-typing');
      s.off('group-user-stopped-typing');
      s.off('group-call-invited');
      s.off('group-call-user-joined');
      s.off('group-call-user-left');
      s.off('group-call-ended');
      s.off('group-call-participants');
      s.off('group-call-offer');
      s.off('group-call-answer');
      s.off('group-call-ice');
      s.off('group-call-error');
    };
  }, [email]);

  const joinGroupRoom = useCallback((groupId) => {
    const s = socketRef.current;
    if (!s) return;
    joinedGroupsRef.current.add(groupId);
    s.emit('join-group', { groupId });
  }, []);

  const leaveGroupRoom = useCallback((groupId) => {
    const s = socketRef.current;
    if (!s) return;
    joinedGroupsRef.current.delete(groupId);
    s.emit('leave-group', { groupId });
  }, []);

  const sendGroupMessage = useCallback((groupId, text) => {
    const s = socketRef.current;
    if (!s || !s.connected) return false;
    s.emit('send-group-message', { groupId, senderEmail: email, text });
    return true;
  }, [email]);

  const emitGroupTyping = useCallback((groupId) => {
    const s = socketRef.current;
    if (!s || !s.connected) return;
    s.emit('group-typing', { groupId, email });
  }, [email]);

  const emitGroupStopTyping = useCallback((groupId) => {
    const s = socketRef.current;
    if (!s || !s.connected) return;
    s.emit('group-stop-typing', { groupId, email });
  }, [email]);

  const startGroupCall = useCallback((groupId, callType = 'video') => {
    const s = socketRef.current;
    if (!s || !s.connected) return;
    s.emit('group-call-start', { groupId, callType });
  }, []);

  const joinGroupCall = useCallback((groupId) => {
    const s = socketRef.current;
    if (!s || !s.connected) return;
    s.emit('group-call-join', { groupId });
  }, []);

  const leaveGroupCall = useCallback((groupId) => {
    const s = socketRef.current;
    if (!s || !s.connected) return;
    s.emit('group-call-leave', { groupId });
  }, []);

  const endGroupCall = useCallback((groupId) => {
    const s = socketRef.current;
    if (!s || !s.connected) return;
    s.emit('group-call-end', { groupId });
  }, []);

  const sendGroupCallOffer = useCallback((groupId, toEmail, offer) => {
    const s = socketRef.current;
    if (!s || !s.connected) return;
    s.emit('group-call-offer', { groupId, toEmail, offer });
  }, []);

  const sendGroupCallAnswer = useCallback((groupId, toEmail, answer) => {
    const s = socketRef.current;
    if (!s || !s.connected) return;
    s.emit('group-call-answer', { groupId, toEmail, answer });
  }, []);

  const sendGroupCallIce = useCallback((groupId, toEmail, candidate) => {
    const s = socketRef.current;
    if (!s || !s.connected) return;
    s.emit('group-call-ice', { groupId, toEmail, candidate });
  }, []);

  const clearNewGroupMessage = useCallback(() => setNewGroupMessage(null), []);
  const clearGroupCallInvite = useCallback(() => setGroupCallInvite(null), []);
  const clearGroupCallUserJoined = useCallback(() => setGroupCallUserJoined(null), []);
  const clearGroupCallUserLeft = useCallback(() => setGroupCallUserLeft(null), []);
  const clearGroupCallEnded = useCallback(() => setGroupCallEnded(null), []);
  const clearGroupCallParticipants = useCallback(() => setGroupCallParticipants(null), []);
  const clearGroupCallOffer = useCallback(() => setGroupCallOffer(null), []);
  const clearGroupCallAnswer = useCallback(() => setGroupCallAnswer(null), []);
  const clearGroupCallIce = useCallback(() => setGroupCallIce(null), []);

  return {
    isConnected,
    newGroupMessage,
    groupTypingUsers,
    groupCallInvite,
    groupCallUserJoined,
    groupCallUserLeft,
    groupCallEnded,
    groupCallParticipants,
    groupCallOffer,
    groupCallAnswer,
    groupCallIce,
    groupCallError,
    joinGroupRoom,
    leaveGroupRoom,
    sendGroupMessage,
    emitGroupTyping,
    emitGroupStopTyping,
    startGroupCall,
    joinGroupCall,
    leaveGroupCall,
    endGroupCall,
    sendGroupCallOffer,
    sendGroupCallAnswer,
    sendGroupCallIce,
    clearNewGroupMessage,
    clearGroupCallInvite,
    clearGroupCallUserJoined,
    clearGroupCallUserLeft,
    clearGroupCallEnded,
    clearGroupCallParticipants,
    clearGroupCallOffer,
    clearGroupCallAnswer,
    clearGroupCallIce,
  };
}
