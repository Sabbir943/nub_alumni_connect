"use client";

class RingtonePlayer {
  constructor() {
    this.audioContext = null;
    this.isPlaying = false;
    this.intervalId = null;
    this.gainNode = null;
  }

  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioContext;
  }

  playTone(frequency, duration, startTime) {
    const ctx = this.init();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);

    return { oscillator, gainNode };
  }

  playRing() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.init();

    const playRingPattern = () => {
      if (!this.isPlaying) return;

      const ctx = this.audioContext;
      const now = ctx.currentTime;

      // Messenger-like ring pattern: two quick tones
      this.playTone(440, 0.15, now);
      this.playTone(480, 0.15, now + 0.05);
      this.playTone(440, 0.15, now + 0.3);
      this.playTone(480, 0.15, now + 0.35);
    };

    playRingPattern();
    this.intervalId = setInterval(playRingPattern, 1500);
  }

  playIncoming() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.init();

    const playIncomingPattern = () => {
      if (!this.isPlaying) return;

      const ctx = this.audioContext;
      const now = ctx.currentTime;

      // Incoming call pattern: alternating tones
      this.playTone(523, 0.2, now);
      this.playTone(659, 0.2, now + 0.25);
      this.playTone(784, 0.2, now + 0.5);
      this.playTone(659, 0.2, now + 0.75);
    };

    playIncomingPattern();
    this.intervalId = setInterval(playIncomingPattern, 1200);
  }

  stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  playConnect() {
    this.init();
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Connection established sound
    this.playTone(523, 0.1, now);
    this.playTone(659, 0.1, now + 0.1);
    this.playTone(784, 0.15, now + 0.2);
  }

  playEnd() {
    this.init();
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Call ended sound
    this.playTone(784, 0.15, now);
    this.playTone(659, 0.15, now + 0.15);
    this.playTone(523, 0.2, now + 0.3);
  }

  playDecline() {
    this.init();
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Decline sound
    this.playTone(440, 0.1, now);
    this.playTone(370, 0.15, now + 0.1);
  }
}

// Singleton instance
let ringtoneInstance = null;

export function getRingtone() {
  if (!ringtoneInstance) {
    ringtoneInstance = new RingtonePlayer();
  }
  return ringtoneInstance;
}

export function playRingtone() {
  getRingtone().playRing();
}

export function playIncomingRingtone() {
  getRingtone().playIncoming();
}

export function stopRingtone() {
  getRingtone().stop();
}

export function playConnectSound() {
  getRingtone().playConnect();
}

export function playEndSound() {
  getRingtone().playEnd();
}

export function playDeclineSound() {
  getRingtone().playDecline();
}
