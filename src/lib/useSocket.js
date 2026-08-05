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

let socket = null;

function getSocket() {
  if (!socket) {
    socket = io(typeof window !== "undefined" ? window.location.origin : "", {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export function useSocket(email) {
  const [isConnected, setIsConnected] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callState, setCallState] = useState(null); // 'ringing' | 'connecting' | 'connected' | 'ended' | null
  const [callFailed, setCallFailed] = useState(null);
  const [peerSdp, setPeerSdp] = useState(null);
  const [peerIceCandidate, setPeerIceCandidate] = useState(null);
  const [callEnded, setCallEnded] = useState(false);
  const socketRef = useRef(null);

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

    s.on("incoming-call", (data) => {
      setIncomingCall(data);
      playIncomingRingtone();
    });

    s.on("call-answered", (data) => {
      setCallState("connecting");
      stopRingtone();
      playConnectSound();
    });

    s.on("call-declined", (data) => {
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

    s.on("call-ended", (data) => {
      setCallState(null);
      stopRingtone();
      playEndSound();
      setCallEnded(true);
      setIncomingCall(null);
      setTimeout(() => setCallEnded(false), 100);
    });

    s.on("offer", (data) => {
      setPeerSdp(data);
    });

    s.on("answer", (data) => {
      setPeerSdp(data);
    });

    s.on("ice-candidate", (data) => {
      setPeerIceCandidate(data);
    });

    return () => {
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
    };
  }, [email]);

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

  return {
    isConnected,
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
  };
}
