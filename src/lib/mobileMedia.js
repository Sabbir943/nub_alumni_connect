export function getVideoConstraints(callType) {
  if (callType !== "video") return false;

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  if (isMobile) {
    return {
      width: { ideal: 640, max: 640 },
      height: { ideal: 480, max: 480 },
      facingMode: "user",
      frameRate: { ideal: 24, max: 30 },
    };
  }

  return {
    width: { ideal: 1280, max: 1280 },
    height: { ideal: 720, max: 720 },
    facingMode: "user",
    frameRate: { ideal: 30, max: 30 },
  };
}

export function getAudioConstraints() {
  return {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  };
}
