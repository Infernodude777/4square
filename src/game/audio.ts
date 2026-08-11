// Tiny WebAudio synth — no assets, all procedural playground noise.
import { musicSetMuted } from "./music";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let volume = 0.55;
let muted = false;
// Browsers block audio until the first user gesture — creating the context
// any earlier just logs a warning and forces an unhandled resume rejection
// (P0-7). Everything stays silent until unlockAudio()/sfx.unlock() flips
// this on (wired to one-time pointer/key/touch listeners at boot).
let gestureUnlocked = false;

function ac(): AudioContext | null {
  if (!gestureUnlocked) return null;
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    applyGain();
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

/** Allow the audio context to exist — call from a user gesture. */
export function unlockAudio() {
  gestureUnlocked = true;
  ac();
}

function applyGain() {
  if (master) master.gain.value = muted ? 0 : volume;
}

export function setMuted(m: boolean) {
  muted = m;
  applyGain();
  // The recess radio respects the same mute switch.
  musicSetMuted(m);
}

export function setVolume(v: number) {
  volume = Math.max(0, Math.min(1, v));
  applyGain();
}

export function getVolume() {
  return volume;
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType = "sine",
  vol = 0.3,
  when = 0,
  glideTo?: number
) {
  const c = ac();
  if (!c || !master) return;
  const t = c.currentTime + when;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(dur: number, vol = 0.3, filterFreq = 1200, when = 0, type: BiquadFilterType = "bandpass") {
  const c = ac();
  if (!c || !master) return;
  const t = c.currentTime + when;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = filterFreq;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t);
}

export const sfx = {
  unlock() {
    unlockAudio();
  },
  bounce(impact: number) {
    const v = Math.min(0.5, 0.08 + impact * 0.05);
    tone(110 + impact * 8, 0.09, "sine", v);
    noise(0.05, v * 0.5, 500, 0, "lowpass");
  },
  hit(power: number) {
    noise(0.07, 0.35 + power * 0.25, 1600 + power * 1600);
    tone(220 + power * 260, 0.1, "triangle", 0.25 + power * 0.2, 0, 90);
  },
  kick(power: number) {
    noise(0.09, 0.4 + power * 0.3, 700 + power * 500, 0, "lowpass");
    tone(160 + power * 120, 0.12, "triangle", 0.3 + power * 0.25, 0, 70);
  },
  botHit() {
    noise(0.06, 0.16, 1400);
    tone(260, 0.08, "triangle", 0.14, 0, 110);
  },
  perfect() {
    tone(880, 0.12, "sine", 0.22);
    tone(1318.5, 0.18, "sine", 0.2, 0.06);
    tone(1760, 0.22, "sine", 0.12, 0.12);
  },
  skimmer() {
    noise(0.18, 0.22, 900, 0, "highpass");
  },
  smash() {
    tone(70, 0.18, "sine", 0.5, 0, 40);
    noise(0.12, 0.4, 2400);
  },
  fault() {
    tone(300, 0.28, "sawtooth", 0.14, 0, 150);
    tone(220, 0.32, "sawtooth", 0.12, 0.16, 110);
    noise(0.5, 0.1, 700, 0.05, "lowpass");
  },
  cheer() {
    for (let i = 0; i < 6; i++) noise(0.35, 0.12, 900 + Math.random() * 900, i * 0.03, "bandpass");
    tone(523, 0.14, "square", 0.08, 0);
    tone(659, 0.14, "square", 0.08, 0.09);
    tone(784, 0.2, "square", 0.09, 0.18);
  },
  homerun() {
    for (let i = 0; i < 10; i++) noise(0.4, 0.14, 800 + Math.random() * 1200, i * 0.025, "bandpass");
    [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.24, "square", 0.1, i * 0.09));
    tone(80, 0.4, "sine", 0.5, 0, 40);
  },
  whistle() {
    tone(2100, 0.12, "square", 0.05);
    tone(2100, 0.2, "square", 0.05, 0.16, 2050);
  },
  line() {
    tone(440, 0.15, "sine", 0.16, 0, 520);
  },
  ui() {
    tone(660, 0.06, "sine", 0.12);
  },
  win() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, "square", 0.09, i * 0.12));
    noise(0.9, 0.14, 1400, 0.5);
  },
};

// ── the new courts' sound kit ────────────────────────────────
/** Soft net swish — a made shot dropping clean through. */
export function swish() {
  tone(1800, 0.14, "sine", 0.16, 0, 2400);
  noise(0.18, 0.1, 5000, 0, "highpass");
}

/** Metallic rim clank — a miss that rattles the iron. */
export function rim() {
  tone(1250, 0.09, "square", 0.12);
  noise(0.06, 0.14, 2600, 0, "bandpass");
}

/** Thock of a caught dodgeball. */
export function catchThud() {
  tone(180, 0.08, "triangle", 0.3, 0, 90);
  noise(0.08, 0.3, 900, 0, "lowpass");
}

/** Open-palm GA! slap in the gaga pit. */
export function gaSlap() {
  noise(0.05, 0.28, 2200);
  tone(320, 0.07, "triangle", 0.18, 0, 140);
}

/** Long recess buzzer — the bell that ends a match. */
export function buzzer() {
  tone(196, 0.5, "sawtooth", 0.18, 0, 196);
  tone(147, 0.55, "sawtooth", 0.14, 0.02, 147);
}

/** School bell — the daily recess special has been conquered. */
export function bell() {
  tone(880, 0.9, "triangle", 0.16);
  tone(1108.7, 0.9, "triangle", 0.12, 0.02);
  tone(880, 0.7, "sine", 0.1, 1.0);
  tone(880, 0.7, "sine", 0.1, 1.9);
}

/** GO! — the bright two-note call when the light flips green. */
export function go() {
  tone(660, 0.09, "square", 0.09);
  tone(880, 0.16, "square", 0.1, 0.07);
  noise(0.12, 0.05, 6000, 0.03, "highpass");
}

// ── playground ambience ──────────────────────────────────────
// A very quiet, ever-present yard: distant chatter, a clanging kickball,
// an occasional bird. Inaudible until the audio context unlocks, which is
// exactly what we want for a recess backdrop.
let ambientTimer: number | null = null;

export function ambientStart() {
  if (ambientTimer !== null) return;
  ambientTimer = window.setInterval(() => {
    const r = Math.random();
    if (r < 0.3) noise(0.25, 0.02 + Math.random() * 0.02, 700 + Math.random() * 800);
    else if (r < 0.45) tone(900 + Math.random() * 500, 0.05, "sine", 0.015);
    else if (r < 0.5) tone(1600 + Math.random() * 600, 0.06, "sine", 0.012);
    else if (r < 0.55) noise(0.4, 0.012, 500, 0, "lowpass");
  }, 1800);
}

export function ambientStop() {
  if (ambientTimer !== null) {
    clearInterval(ambientTimer);
    ambientTimer = null;
  }
}
