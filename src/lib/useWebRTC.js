"use client";
import { useEffect, useRef, useState, useCallback } from "react";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ],
};

export function useWebRTC({
  callState,
  incomingCall,
  peerSdp,
  peerIceCandidate,
  clearPeerSdp,
  clearPeerIceCandidate,
  sendOffer,
  sendAnswer,
  sendIceCandidate,
  callEnded,
}) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const isCallerRef = useRef(false);
  const connectedRef = useRef(false);

  // Create peer connection
  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const otherEmail = isCallerRef.current
          ? incomingCall?.callerEmail
          : incomingCall?.calleeEmail;
        if (otherEmail) {
          sendIceCandidate(otherEmail, event.candidate);
        }
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        connectedRef.current = true;
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
        // Connection lost
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [incomingCall, sendIceCandidate]);

  // Get local media stream
  const getLocalStream = useCallback(async (video = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: video ? { width: 1280, height: 720, facingMode: "user" } : false,
      });
      setLocalStream(stream);
      localStreamRef.current = stream;
      return stream;
    } catch (err) {
      console.error("Failed to get media devices:", err);
      // Try audio only
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
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

  // Start a call (caller side)
  const startCall = useCallback(async (calleeEmail, callType = "video") => {
    isCallerRef.current = true;
    const stream = await getLocalStream(callType === "video");
    if (!stream) return;

    const pc = createPeerConnection();
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendOffer(calleeEmail, pc.localDescription);
    } catch (err) {
      console.error("Error creating offer:", err);
    }
  }, [getLocalStream, createPeerConnection, sendOffer]);

  // Answer a call (callee side)
  const answerCall = useCallback(async (callerEmail, callType = "video") => {
    isCallerRef.current = false;
    const stream = await getLocalStream(callType === "video");
    if (!stream) return;

    const pc = createPeerConnection();
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    // Process any pending candidates
    if (peerSdp && peerSdp.sdp) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(peerSdp.sdp));
        clearPeerSdp();

        // Add pending ICE candidates
        for (const candidate of pendingCandidatesRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        pendingCandidatesRef.current = [];

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendAnswer(callerEmail, pc.localDescription);
      } catch (err) {
        console.error("Error answering call:", err);
      }
    }
  }, [getLocalStream, createPeerConnection, peerSdp, clearPeerSdp, sendAnswer]);

  // Handle incoming offer (callee side)
  useEffect(() => {
    if (!peerSdp || !peerSdp.sdp || isCallerRef.current) return;

    const handleOffer = async () => {
      const pc = peerConnectionRef.current;
      if (!pc) return;

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(peerSdp.sdp));
        clearPeerSdp();

        // Add pending ICE candidates
        for (const candidate of pendingCandidatesRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        pendingCandidatesRef.current = [];

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        const callerEmail = peerSdp.from;
        sendAnswer(callerEmail, pc.localDescription);
      } catch (err) {
        console.error("Error handling offer:", err);
      }
    };

    handleOffer();
  }, [peerSdp, clearPeerSdp, sendAnswer]);

  // Handle incoming answer (caller side)
  useEffect(() => {
    if (!peerSdp || !peerSdp.sdp || !isCallerRef.current) return;

    const handleAnswer = async () => {
      const pc = peerConnectionRef.current;
      if (!pc) return;

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(peerSdp.sdp));
        clearPeerSdp();

        // Add pending ICE candidates
        for (const candidate of pendingCandidatesRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        pendingCandidatesRef.current = [];
      } catch (err) {
        console.error("Error handling answer:", err);
      }
    };

    handleAnswer();
  }, [peerSdp, clearPeerSdp]);

  // Handle incoming ICE candidates
  useEffect(() => {
    if (!peerIceCandidate || !peerIceCandidate.candidate) return;

    const pc = peerConnectionRef.current;
    if (pc && pc.remoteDescription) {
      pc.addIceCandidate(new RTCIceCandidate(peerIceCandidate.candidate)).catch((err) => {
        console.error("Error adding ICE candidate:", err);
      });
    } else {
      pendingCandidatesRef.current.push(peerIceCandidate.candidate);
    }

    clearPeerIceCandidate();
  }, [peerIceCandidate, clearPeerIceCandidate]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  }, []);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  }, []);

  // Cleanup on call end
  useEffect(() => {
    if (callEnded) {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      setLocalStream(null);
      setRemoteStream(null);
      setAudioEnabled(true);
      setVideoEnabled(true);
      connectedRef.current = false;
      isCallerRef.current = false;
      pendingCandidatesRef.current = [];
    }
  }, [callEnded]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    localStream,
    remoteStream,
    audioEnabled,
    videoEnabled,
    startCall,
    answerCall,
    toggleAudio,
    toggleVideo,
    getLocalStream,
    createPeerConnection,
  };
}
