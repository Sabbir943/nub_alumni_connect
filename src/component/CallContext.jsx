"use client";
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import {
  playRingtone,
  playIncomingRingtone,
  stopRingtone,
  playConnectSound,
  playEndSound,
  playDeclineSound,
} from "@/lib/ringtone";

const CallContext = createContext(null);

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

export function CallProvider({ children, email }) {
  const [isConnected, setIsConnected] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callState, setCallState] = useState(null);
  const [callFailed, setCallFailed] = useState(null);
  const [callEnded, setCallEnded] = useState(false);
  const [peerSdp, setPeerSdp] = useState(null);
  const [peerIceCandidate, setPeerIceCandidate] = useState(null);
  const [callType, setCallType] = useState("video");
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const callTimerRef = useRef(null);

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
      setCallType(data.callType || "video");
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
      cleanupCall();
      setCallEnded(true);
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

  const cleanupCall = useCallback(() => {
    setCallState(null);
    setIncomingCall(null);
    stopRingtone();
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    setAudioEnabled(true);
    setVideoEnabled(true);
  }, [localStream]);

  const setupLocalStream = useCallback(async (type) => {
    try {
      const constraints = {
        audio: true,
        video: type === "video",
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error("Failed to get media devices:", err);
      return null;
    }
  }, []);

  const callUser = useCallback(async (calleeEmail, type = "video") => {
    const s = socketRef.current;
    if (!s) return;
    setCallState("ringing");
    setCallFailed(null);
    setCallType(type);
    playRingtone();
    s.emit("call-user", { calleeEmail, callType: type });
  }, []);

  const answerCall = useCallback(async (callerEmail) => {
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
    cleanupCall();
    setCallEnded(true);
    setTimeout(() => setCallEnded(false), 100);
    s.emit("end-call", { otherEmail });
  }, [cleanupCall]);

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

  const toggleAudio = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => {
        t.enabled = !t.enabled;
      });
      setAudioEnabled((prev) => !prev);
    }
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((t) => {
        t.enabled = !t.enabled;
      });
      setVideoEnabled((prev) => !prev);
    }
  }, [localStream]);

  const clearPeerSdp = useCallback(() => setPeerSdp(null), []);
  const clearPeerIceCandidate = useCallback(() => setPeerIceCandidate(null), []);

  const value = {
    isConnected,
    incomingCall,
    callState,
    callFailed,
    callEnded,
    callType,
    localStream,
    remoteStream,
    audioEnabled,
    videoEnabled,
    peerSdp,
    peerIceCandidate,
    peerConnectionRef,
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
    setCallType,
    setLocalStream,
    setRemoteStream,
    setAudioEnabled,
    setVideoEnabled,
    setupLocalStream,
    cleanupCall,
    callTimerRef,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCall must be used within CallProvider");
  return ctx;
}
