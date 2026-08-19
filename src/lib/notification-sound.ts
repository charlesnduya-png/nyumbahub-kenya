import type { Role } from "@/types";

const OWNER_ALERT_TYPES = new Set(["BOOKING", "RENTAL_RESERVATION"]);

let sharedContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  if (!sharedContext) {
    const AudioCtx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return null;
    sharedContext = new AudioCtx();
  }

  if (sharedContext.state === "suspended") {
    void sharedContext.resume();
  }

  return sharedContext;
}

/** Call once after a user gesture so browsers allow playback later. */
export function unlockNotificationSound() {
  getAudioContext();
}

export function isOwnerBookingAlert(type: string, role?: Role | string) {
  return (
    (role === "SELLER" || role === "AGENT") && OWNER_ALERT_TYPES.has(type)
  );
}

/** Short two-tone chime for new booking / rental requests. */
export function playOwnerBookingAlertSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const tones = [
    { freq: 880, start: 0, duration: 0.12 },
    { freq: 1174.66, start: 0.14, duration: 0.18 },
  ];

  for (const tone of tones) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(tone.freq, now + tone.start);
    gain.gain.setValueAtTime(0.0001, now + tone.start);
    gain.gain.exponentialRampToValueAtTime(0.22, now + tone.start + 0.02);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + tone.start + tone.duration,
    );
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + tone.start);
    osc.stop(now + tone.start + tone.duration + 0.05);
  }
}
