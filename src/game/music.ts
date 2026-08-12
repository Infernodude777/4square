// ─────────────────────────────────────────────────────────────
//  RECESS RADIO — procedural schoolyard music (Season 2 + 3)
//
//  A tiny generative music engine, synthesised entirely in code —
//  no audio files. Every school day gets a fresh tune (seeded by
//  the date), built from a cheerful I–V–vi–IV loop, a wandering
//  pentatonic melody, a soft bass and a little percussion. The
//  tempo and the percussion density follow the mood:
//    hub   — 84 BPM, laid back (browsing the yard)
//    play  — 96 BPM, lively (mid-match)
//    point — 112 BPM, hyped (match point!)
//
//  Season 3: when the school bell rings (see bells.ts) the day
//  rolls over and `musicNewDay()` re-seeds the tune, so every
//  recess after the bell hums a slightly different song.
//
//  Music has its own gain (the Settings music slider) and ducks
//  briefly whenever the player makes a big sound (smashes, bells).
//  Owns its own AudioContext so nothing here touches the SFX rig;
//  it only comes alive after the first user gesture unlocks audio.
// ─────────────────────────────────────────────────────────────

export type MusicMood = "hub" | "play" | "point";

const MOOD_CFG: Record<MusicMood, { bpm: number; hats: boolean; snare: boolean; leadVol: number }> = {
  hub:   { bpm: 84,  hats: true,  snare: false, leadVol: 0.055 },
  play:  { bpm: 96,  hats: true,  snare: true,  leadVol: 0.07 },
  point: { bpm: 112, hats: true,  snare: true,  leadVol: 0.085 },
};

// ── seedable RNG (mulberry32) — one tune per school day ─────────
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Chords: C · G · Am · F (a I–V–vi–IV loop). Root + third + fifth
// as MIDI numbers; melody plucks from these plus the pentatonic.
const CHORDS: number[][] = [
  [48, 55, 60, 64], // C  (C3 G3 C4 E4)
  [43, 50, 55, 59], // G  (G2 D3 G3 B3)
  [45, 52, 57, 60], // Am (A2 E3 A3 C4)
  [41, 48, 53, 57], // F  (F2 C3 F3 A3)
];
const PENTA = [60, 62, 64, 67, 69, 72, 74, 76]; // C pentatonic + an octave

let ctx: AudioContext | null = null;
let music: GainNode | null = null;     // overall music bus (musicVolume)
let duckGain: GainNode | null = null;  // SFX-duck stage inside the bus
let volume = 0.42;
let muted = false;
let running = false;
let mood: MusicMood = "hub";
let timer: number | null = null;
let bar = 0;         // which bar of the 4-bar progression we're in
let beatInBar = 0;   // 0..31 (8th notes)
let nextNoteAt = 0;  // ctx time of the next scheduled 8th
let dayCount = 0;    // Season 3: how many bells have rolled the tune over
let rnd = mulberry32(new Date().getDate() * 7919 + 13);

/** Internal context — created lazily on the first user gesture. */
function mc(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    music = ctx.createGain();
    music.gain.value = muted ? 0 : volume;
    duckGain = ctx.createGain();
    duckGain.gain.value = 1;
    music.connect(duckGain);
    duckGain.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

/** Start the recess radio (safe to call before the gesture — it waits). */
export function musicStart() {
  running = true;
  // The scheduler always runs; each tick silently no-ops until the first
  // user gesture makes the context available.
  if (timer === null) timer = window.setInterval(tick, 120);
}

function tick() {
  const c = mc();
  if (!c || !running) return;
  const eighth = 60 / MOOD_CFG[mood].bpm / 2;
  while (nextNoteAt < c.currentTime + 0.6) {
    playEighth(nextNoteAt, eighth);
    nextNoteAt += eighth;
    beatInBar = (beatInBar + 1) % 32;
    if (beatInBar === 0) bar = (bar + 1) % 4;
  }
}

export function musicStop() {
  running = false;
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
  if (ctx && ctx.state === "running") ctx.suspend().catch(() => {});
}

export function setMusicMood(m: MusicMood) {
  if (mood === m) return;
  mood = m;
  // Re-seed per mood change keeps the same daily tune but a fresh walk —
  // switching feels like the band took a breath, not a new song.
  rnd = mulberry32(new Date().getDate() * 7919 + 13 + dayCount * 977 + (m === "hub" ? 0 : m === "play" ? 100 : 200));
}

export function setMusicVolume(v: number) {
  volume = Math.max(0, Math.min(1, v));
  if (music) music.gain.value = muted ? 0 : volume;
}

/** Respect the global mute switch (called from audio.ts). */
export function musicSetMuted(m: boolean) {
  muted = m;
  if (music) music.gain.value = m ? 0 : volume;
}

/** Briefly duck the music so SFX pop (smashes, bells, wins). */
export function musicDuck(sec = 1.4) {
  const c = mc();
  if (!c || !duckGain) return;
  const g = duckGain.gain;
  g.cancelScheduledValues(c.currentTime);
  g.setValueAtTime(Math.max(g.value, 0.001), c.currentTime);
  g.linearRampToValueAtTime(0.22, c.currentTime + 0.05);
  g.linearRampToValueAtTime(1, c.currentTime + sec);
}

// ── Season 3: the bell rings, the tune rolls over ──────────────
/** Roll the daily tune over — called when the school bell rings. */
export function musicNewDay() {
  dayCount += 1;
  rnd = mulberry32(new Date().getDate() * 7919 + 13 + dayCount * 977);
}

// ── voices ─────────────────────────────────────────────────────
function note(freq: number, at: number, dur: number, type: OscillatorType, vol: number, glideTo?: number) {
  const c = mc();
  if (!c || !music) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, at);
  if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, at + dur);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(vol, at + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(music);
  o.start(at);
  o.stop(at + dur + 0.05);
}

function noiseHit(at: number, dur: number, vol: number, filterFreq: number, type: BiquadFilterType = "highpass") {
  const c = mc();
  if (!c || !music) return;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = filterFreq;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  src.connect(f).connect(g).connect(music);
  src.start(at);
}

function midiToFreq(m: number) {
  return 440 * Math.pow(2, (m - 69) / 12);
}

function playEighth(at: number, eighth: number) {
  const cfg = MOOD_CFG[mood];
  const chord = CHORDS[bar];
  const isBeat = beatInBar % 4 === 0;          // quarter notes
  const isOff = beatInBar % 4 === 2;

  // ── bass: root on 1 & 3, fifth on 2 & 4 ──
  if (isBeat || isOff) {
    const root = chord[0];
    const f = midiToFreq(isBeat ? root : root + 7);
    note(f, at, eighth * 1.7, "triangle", 0.16);
  }

  // ── percussion ──
  if (isBeat) note(95, at, 0.09, "sine", 0.22, 55);           // kick
  if (cfg.hats && beatInBar % 2 === 1) noiseHit(at, 0.03, 0.035, 7000); // hats
  if (cfg.snare && beatInBar % 4 === 2) noiseHit(at, 0.06, 0.05, 1800, "bandpass"); // snare

  // ── lead melody: a sparse pentatonic walk with rests ──
  if (rnd() < 0.62) {
    const octave = rnd() < 0.3 ? 1 : 0;
    const base = PENTA[Math.floor(rnd() * PENTA.length)] + octave * 12;
    const len = rnd() < 0.22 ? 2 : 1; // occasional held note
    note(midiToFreq(base), at, eighth * len * 1.6, "square", cfg.leadVol, midiToFreq(base - 2));
  }
  // A little sparkle: the chord's top note occasionally sings over.
  if (rnd() < 0.08) note(midiToFreq(chord[3] + 12), at, eighth * 3, "sine", 0.03);
}
