"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import {
  playRingtone,
  playIncomingRingtone,
  stopRingtone,
  playConnectSound,
  playEndSound,
  playDeclineSound,
} from "./ringtone";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

let socket = null;

function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }
  return socket;
}

export function useSocket(email) {
  const [isConnected, setIsConnected] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callState, setCallState] = useState(null);
  const [callFailed, setCallFailed] = useState(null);
  const [peerSdp, setPeerSdp] = useState(null);
  const [peerIceCandidate, setPeerIceCandidate] = useState(null);
  const [callEnded, setCallEnded] = useState(false);

  // Real-time messaging state
  const [newMessage, setNewMessage] = useState(null);
  const [typingUser, setTypingUser] = useState(null);
  const [readReceipt, setReadReceipt] = useState(null);
  const [messageError, setMessageError] = useState(null);

  const socketRef = useRef(null);
  const typingTimers = useRef({});

  useEffect(() => {
    if (!email) return;

    const s = getSocket();
    socketRef.current = s;

    if (!s.connected) {
      s.connect();
    }

    s.on("connect", () => {
      s.emit("join", email);
      setIsConnected(true);
    });

    s.on("disconnect", () => {
      setIsConnected(false);
    });

    // ==================== CALL EVENTS ====================
    s.on("incoming-call", (data) => {
      setIncomingCall(data);
      playIncomingRingtone();
    });

    s.on("call-answered", () => {
      setCallState("connecting");
      stopRingtone();
      playConnectSound();
    });

    s.on("call-declined", () => {
      setCallState(null);
      stopRingtone();
      playDeclineSound();
      setCallFailed("Call declined");
      setTimeout(() => setCallFailed(null), 3000);
    });

    s.on("call-failed", (data) => {
      setCallState(null);
      stopRingtone();
      playDeclineSound();
      setCallFailed(data.reason || "Call failed");
      setTimeout(() => setCallFailed(null), 3000);
    });

    s.on("call-ended", () => {
      setCallState(null);
      stopRingtone();
      playEndSound();
      setCallEnded(true);
      setIncomingCall(null);
      setTimeout(() => setCallEnded(false), 100);
    });

    s.on("offer", (data) => setPeerSdp(data));
    s.on("answer", (data) => setPeerSdp(data));
    s.on("ice-candidate", (data) => setPeerIceCandidate(data));

    // ==================== MESSAGE EVENTS ====================
    s.on("new-message", (message) => {
      setNewMessage(message);
    });

    s.on("user-typing", ({ from }) => {
      setTypingUser(from);
      // Auto-clear typing after 3 seconds
      if (typingTimers.current[from]) clearTimeout(typingTimers.current[from]);
      typingTimers.current[from] = setTimeout(() => setTypingUser(null), 3000);
    });

    s.on("user-stopped-typing", ({ from }) => {
      if (typingTimers.current[from]) clearTimeout(typingTimers.current[from]);
      setTypingUser(null);
    });

    s.on("messages-read", ({ by }) => {
      setReadReceipt(by);
    });

    s.on("message-error", (data) => {
      setMessageError(data.error);
      setTimeout(() => setMessageError(null), 3000);
    });

    return () => {
      Object.values(typingTimers.current).forEach(clearTimeout);
      s.off("connect");
      s.off("disconnect");
      s.off("incoming-call");
      s.off("call-answered");
      s.off("call-declined");
      s.off("call-failed");
      s.off("call-ended");
      s.off("offer");
      s.off("answer");
      s.off("ice-candidate");
      s.off("new-message");
      s.off("user-typing");
      s.off("user-stopped-typing");
      s.off("messages-read");
      s.off("message-error");
    };
  }, [email]);

  // ==================== CALL FUNCTIONS ====================
  const callUser = useCallback((calleeEmail, callType = "video") => {
    const s = socketRef.current;
    if (!s) return;
    setCallState("ringing");
    setCallFailed(null);
    playRingtone();
    s.emit("call-user", { calleeEmail, callType });
  }, []);

  const answerCall = useCallback((callerEmail) => {
    const s = socketRef.current;
    if (!s) return;
    stopRingtone();
    setCallState("connecting");
    setIncomingCall(null);
    s.emit("answer-call", { callerEmail });
  }, []);

  const declineCall = useCallback((callerEmail) => {
    const s = socketRef.current;
    if (!s) return;
    stopRingtone();
    setIncomingCall(null);
    s.emit("decline-call", { callerEmail });
  }, []);

  const endCall = useCallback((otherEmail) => {
    const s = socketRef.current;
    if (!s) return;
    stopRingtone();
    setCallState(null);
    setCallEnded(true);
    setTimeout(() => setCallEnded(false), 100);
    s.emit("end-call", { otherEmail });
  }, []);

  const sendOffer = useCallback((to, sdp) => {
    const s = socketRef.current;
    if (!s) return;
    s.emit("offer", { to, sdp });
  }, []);

  const sendAnswer = useCallback((to, sdp) => {
    const s = socketRef.current;
    if (!s) return;
    s.emit("answer", { to, sdp });
  }, []);

  const sendIceCandidate = useCallback((to, candidate) => {
    const s = socketRef.current;
    if (!s) return;
    s.emit("ice-candidate", { to, candidate });
  }, []);

  const clearPeerSdp = useCallback(() => setPeerSdp(null), []);
  const clearPeerIceCandidate = useCallback(() => setPeerIceCandidate(null), []);

  // ==================== MESSAGE FUNCTIONS ====================
  const sendMessage = useCallback((receiverEmail, text) => {
    const s = socketRef.current;
    if (!s || !s.connected) return false;
    s.emit("send-message", { receiverEmail, text });
    return true;
  }, []);

  const emitTyping = useCallback((to) => {
    const s = socketRef.current;
    if (!s || !s.connected) return;
    s.emit("typing", { to });
  }, []);

  const emitStopTyping = useCallback((to) => {
    const s = socketRef.current;
    if (!s || !s.connected) return;
    s.emit("stop-typing", { to });
  }, []);

  const markRead = useCallback((from) => {
    const s = socketRef.current;
    if (!s || !s.connected) return;
    s.emit("mark-read", { from });
  }, []);

  const clearNewMessage = useCallback(() => setNewMessage(null), []);
  const clearReadReceipt = useCallback(() => setReadReceipt(null), []);

  return {
    // Connection
    isConnected,
    // Call
    incomingCall,
    callState,
    callFailed,
    callEnded,
    peerSdp,
    peerIceCandidate,
    callUser,
    answerCall,
    declineCall,
    endCall,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
    clearPeerSdp,
    clearPeerIceCandidate,
    setCallState,
    // Messaging
    newMessage,
    typingUser,
    readReceipt,
    messageError,
    sendMessage,
    emitTyping,
    emitStopTyping,
    markRead,
    clearNewMessage,
    clearReadReceipt,
  };
}
