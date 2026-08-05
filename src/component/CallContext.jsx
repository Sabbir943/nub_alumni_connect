"use client";
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { apiFetch } from "@/lib/api";
import {
  playRingtone,
  playIncomingRingtone,
  stopRingtone,
  playConnectSound,
  playEndSound,
  playDeclineSound,
} from "@/lib/ringtone";

const CallContext = createContext(null);

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ],
};

export function CallProvider({ children, email }) {
  const [incomingCall, setIncomingCall] = useState(null);
  const [callState, setCallState] = useState(null);
  const [callFailed, setCallFailed] = useState(null);
  const [callEnded, setCallEnded] = useState(false);
  const [callType, setCallType] = useState("video");
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [currentCallId, setCurrentCallId] = useState(null);
  const [peerSdp, setPeerSdp] = useState(null);

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const callIdRef = useRef(null);
  const isPollingRef = useRef(false);
  const lastPollResultRef = useRef(null);

  const setupLocalStream = useCallback(async (type = "video") => {
    try {
      const constraints = {
        audio: true,
        video: type === "video" ? { width: 1280, height: 720, facingMode: "user" } : false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      localStreamRef.current = stream;
      return stream;
    } catch (err) {
      console.error("Failed to get media devices:", err);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        setLocalStream(stream);
        localStreamRef.current = stream;
        setVideoEnabled(false);
        return stream;
      } catch (audioErr) {
        console.error("Failed to get audio:", audioErr);
        return null;
      }
    }
  }, []);

  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    pc.onicecandidate = async (event) => {
      if (event.candidate && callIdRef.current) {
        try {
          await apiFetch(`/api/calls/${callIdRef.current}`, {
            method: "PATCH",
            body: JSON.stringify({
              action: "ice-candidate",
              email,
              iceCandidate: event.candidate.toJSON(),
            }),
          });
        } catch (e) {
          console.error("Failed to send ICE candidate:", e);
        }
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
        setCallState("connected");
        playConnectSound();
      } else if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
        setCallState(null);
        playEndSound();
      }
    };

    return pc;
  }, [email]);

  const pollForCalls = useCallback(async () => {
    if (!email || isPollingRef.current) return;
    isPollingRef.current = true;

    try {
      const data = await apiFetch(`/api/calls?email=${encodeURIComponent(email)}`);

      // Handle incoming call (new call from someone else)
      if (data.incomingCall && !callState && !callIdRef.current) {
        const call = data.incomingCall;
        setIncomingCall({
          callerEmail: call.callerEmail,
          callerName: call.callerEmail.split("@")[0],
          callType: call.callType,
          callId: call._id,
        });
        setCallType(call.callType);
        callIdRef.current = call._id;
        setCurrentCallId(call._id);
        playIncomingRingtone();
      }

      // Handle call answered (if we initiated the call)
      if (data.answeredCall && callState === "ringing") {
        const call = data.answeredCall;
        callIdRef.current = call._id;
        setCurrentCallId(call._id);
        setCallState("connecting");
        stopRingtone();
        playConnectSound();
      }

      // Handle call ended/declined
      if (data.endedCall) {
        const call = data.endedCall;
        setCallState(null);
        stopRingtone();
        if (call.status === "declined") {
          playDeclineSound();
          setCallFailed("Call declined");
          setTimeout(() => setCallFailed(null), 3000);
        } else {
          playEndSound();
        }
        setCallEnded(true);
        setIncomingCall(null);
        callIdRef.current = null;
        setCurrentCallId(null);
        setTimeout(() => setCallEnded(false), 100);

        if (peerConnectionRef.current) {
          peerConnectionRef.current.close();
          peerConnectionRef.current = null;
        }
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((t) => t.stop());
          setLocalStream(null);
          localStreamRef.current = null;
        }
        setRemoteStream(null);
        setAudioEnabled(true);
        setVideoEnabled(true);
      }
    } catch (e) {
      // Silent fail for polling
    } finally {
      isPollingRef.current = false;
    }
  }, [email, callState]);

  // Poll for calls every 2 seconds
  useEffect(() => {
    if (!email) return;

    pollIntervalRef.current = setInterval(pollForCalls, 2000);
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [email, pollForCalls]);

  const callUser = useCallback(async (calleeEmail, type = "video") => {
    try {
      setCallState("ringing");
      setCallFailed(null);
      setCallType(type);
      playRingtone();

      const stream = await setupLocalStream(type);
      if (!stream) {
        setCallState(null);
        setCallFailed("Could not access camera/microphone");
        return;
      }

      const data = await apiFetch("/api/calls", {
        method: "POST",
        body: JSON.stringify({
          callerEmail: email,
          calleeEmail,
          callType: type,
        }),
      });

      if (data.callId) {
        callIdRef.current = data.callId;
        setCurrentCallId(data.callId);

        // Create offer
        const pc = createPeerConnection();
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        await apiFetch(`/api/calls/${data.callId}`, {
          method: "PATCH",
          body: JSON.stringify({
            action: "offer",
            email,
            offer: pc.localDescription.toJSON(),
          }),
        });
      }
    } catch (err) {
      console.error("Call failed:", err);
      setCallState(null);
      setCallFailed(err.message || "Call failed");
      stopRingtone();
      callIdRef.current = null;
      setCurrentCallId(null);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        setLocalStream(null);
        localStreamRef.current = null;
      }
      setTimeout(() => setCallFailed(null), 3000);
    }
  }, [email, setupLocalStream, createPeerConnection]);

  const answerCall = useCallback(async (callerEmail) => {
    try {
      stopRingtone();
      setCallState("connecting");

      const callId = incomingCall?.callId || callIdRef.current;
      if (!callId) return;

      // Notify server we answered
      await apiFetch(`/api/calls/${callId}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "answer", email }),
      });

      setIncomingCall(null);

      // Get call details (with offer)
      const callData = await apiFetch(`/api/calls/${callId}?email=${encodeURIComponent(email)}`);
      const call = callData.call;

      // Get local stream
      const stream = await setupLocalStream(call.callType || "video");
      if (!stream) return;

      // Create peer connection and set remote offer
      const pc = createPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      if (call.offer) {
        await pc.setRemoteDescription(new RTCSessionDescription(call.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        // Send answer back
        await apiFetch(`/api/calls/${callId}`, {
          method: "PATCH",
          body: JSON.stringify({
            action: "answer-sdp",
            email,
            answer: pc.localDescription.toJSON(),
          }),
        });
      }
    } catch (err) {
      console.error("Answer call failed:", err);
      setCallState(null);
      setCallFailed("Failed to answer call");
      setTimeout(() => setCallFailed(null), 3000);
    }
  }, [email, incomingCall, setupLocalStream, createPeerConnection]);

  const declineCall = useCallback(async (callerEmail) => {
    stopRingtone();
    setIncomingCall(null);

    const callId = incomingCall?.callId || callIdRef.current;
    if (callId) {
      try {
        await apiFetch(`/api/calls/${callId}`, {
          method: "PATCH",
          body: JSON.stringify({ action: "decline", email }),
        });
      } catch (e) {}
    }

    callIdRef.current = null;
    setCurrentCallId(null);
  }, [email, incomingCall]);

  const endCall = useCallback(async () => {
    stopRingtone();
    setCallState(null);
    setCallEnded(true);
    setIncomingCall(null);
    setTimeout(() => setCallEnded(false), 100);

    const callId = callIdRef.current;
    if (callId) {
      try {
        await apiFetch(`/api/calls/${callId}`, {
          method: "PATCH",
          body: JSON.stringify({ action: "end", email }),
        });
      } catch (e) {}
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
      localStreamRef.current = null;
    }

    setRemoteStream(null);
    setAudioEnabled(true);
    setVideoEnabled(true);
    callIdRef.current = null;
    setCurrentCallId(null);
  }, [email]);

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
  const clearPeerIceCandidate = useCallback(() => {}, []);

  const value = {
    isConnected: true,
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
    peerIceCandidate: null,
    peerConnectionRef,
    currentCallId,
    callUser,
    answerCall,
    declineCall,
    endCall,
    sendOffer: async () => {},
    sendAnswer: async () => {},
    sendIceCandidate: async () => {},
    clearPeerSdp,
    clearPeerIceCandidate,
    setCallState,
    setCallType,
    setLocalStream,
    setRemoteStream,
    setAudioEnabled,
    setVideoEnabled,
    setupLocalStream,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCall must be used within CallProvider");
  return ctx;
}
