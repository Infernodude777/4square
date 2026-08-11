// ─────────────────────────────────────────────────────────────
//  RECESS RADIO — procedural schoolyard music (Season 2.5)
//
//  A full generative music engine, synthesised entirely in code —
//  no audio files. Every school day gets its own tune: a seeded
//  key, a chord progression, a melody that wanders through real
//  phrases instead of random blips, a bassline that grooves, and
//  a drum kit that swings. The whole band runs through a proper
//  mix bus — compressor, generated-impulse reverb and a warm
//  dotted-eighth delay — so it sounds like music, not a toy.
//
//  Tempo, energy and percussion follow the mood:
//    hub   — 84 BPM, laid back (browsing the yard)
//    play  — 98 BPM, grooving (mid-match)
//    point — 116 BPM, hyped (match point!)
//
//  Music has its own gain (the Settings music slider) and ducks
//  briefly whenever the player makes a big sound (smashes, bells).
//  Owns its own AudioContext so nothing here touches the SFX rig;
//  it only comes alive after the first user gesture unlocks audio.
// ─────────────────────────────────────────────────────────────

export type MusicMood = "hub" | "play" | "point";

interface MoodCfg {
  bpm: number;
  energy: number;   // 0 = lounge, 1 = groove, 2 = hype
  swing: number;    // 8th-note shuffle (fraction of a 16th)
  leadVol: number;
  padVol: number;
  bassVol: number;
  kitVol: number;   // drum-kit master
  fillEvery: number; // a drum fill every N bars
  arp: boolean;     // arpeggio bells on odd bars
}

const MOOD_CFG: Record<MusicMood, MoodCfg> = {
  hub:   { bpm: 84,  energy: 0, swing: 0.05, leadVol: 0.055, padVol: 0.06,  bassVol: 0.1,   kitVol: 0.8,  fillEvery: 8, arp: false },
  play:  { bpm: 98,  energy: 1, swing: 0.07, leadVol: 0.06,  padVol: 0.065, bassVol: 0.105, kitVol: 0.9,  fillEvery: 4, arp: true },
  point: { bpm: 116, energy: 2, swing: 0.09, leadVol: 0.065, padVol: 0.07,  bassVol: 0.115, kitVol: 1,    fillEvery: 2, arp: true },
};

// ── scales & harmony ─────────────────────────────────────────
const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11];
const MINOR_STEPS = [0, 2, 3, 5, 7, 8, 10];

// Nine keys — every school day lands on one (seeded), so the tune
// really is different tomorrow.
const KEYS: { root: number; minor: boolean }[] = [
  { root: 60, minor: false }, // C  major
  { root: 55, minor: false }, // G  major
  { root: 62, minor: false }, // D  major
  { root: 57, minor: false }, // A  major
  { root: 65, minor: false }, // F  major
  { root: 57, minor: true },  // A  minor
  { root: 50, minor: true },  // D  minor
  { root: 55, minor: true },  // E  minor
  { root: 62, minor: true },  // D  minor
];

const MAJOR_PROGS: number[][] = [
  [0, 4, 5, 3], // I  V  vi IV
  [5, 3, 0, 4], // vi IV I  V
  [0, 3, 5, 4], // I  IV vi V
  [0, 4, 3, 4], // I  V  IV V (turnaround)
  [0, 4, 1, 5], // I  V  ii VI
];

const MINOR_PROGS: number[][] = [
  [0, 5, 2, 6], // i VI III VII
  [0, 3, 5, 4], // i iv VI  V
  [0, 6, 5, 4], // i VII VI V
  [0, 5, 4, 5], // i VI v  VI
];

/** Build the working scale: root-12 up to root+24. */
function buildScale(root: number, minor: boolean): number[] {
  const steps = minor ? MINOR_STEPS : MAJOR_STEPS;
  const s: number[] = [];
  for (let oct = -1; oct <= 2; oct++) {
    for (const st of steps) s.push(root + oct * 12 + st);
  }
  return s;
}

/** Chord tones for a scale degree, all voiced in the root..root+24 register. */
function chordTones(scale: number[], deg: number): {
  root: number; third: number; fifth: number; seventh: number;
} {
  const root = scale[7 + deg];
  const d3 = (deg + 2) % 7;
  const d5 = (deg + 4) % 7;
  const d7 = (deg + 6) % 7;
  return {
    root,
    third:  scale[7 + d3] + (d3 < deg ? 12 : 0),
    fifth:  scale[7 + d5] + (d5 < deg ? 12 : 0),
    seventh: scale[7 + d7] + (d7 < deg ? 12 : 0),
  };
}

// ── seedable RNG (mulberry32) ────────────────────────────────
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

// ── engine state ─────────────────────────────────────────────
let ctx: AudioContext | null = null;
let bus: MixBus | null = null;
let volume = 0.42;
let muted = false;
let running = false;
let mood: MusicMood = "hub";
let timer: number | null = null;

// The day's song (seeded once per school day).
const DAY_SEED = new Date().getDate() * 137 + (new Date().getMonth() + 1) * 31;
let scale: number[] = [];
let prog: number[] = [];       // 4-bar chord progression (scale degrees)
let bar = 0;                   // absolute bar counter
let nextBarAt = 0;             // ctx time of the next bar
let phrase: (PhraseNote | null)[] = []; // current 2-bar melody phrase (16 eighths)
let lastLead: number | null = null;     // last melody MIDI (biases stepwise motion)
let rnd: () => number;         // seeded — harmony & phrase choices

interface PhraseNote { midi: number; vel: number; len: number }

interface MixBus {
  music: GainNode;
  duck: GainNode;
  comp: DynamicsCompressorNode;
  dry: GainNode;
  reverb: ConvolverNode;
  reverbSend: GainNode;
  delay: DelayNode;
  delaySend: GainNode;
  delayOut: GainNode;
  delayFb: GainNode;
  delayLP: BiquadFilterNode;
}

/** Generated stereo impulse response — a tiny schoolyard hall. */
function makeImpulse(c: AudioContext, seconds: number, decay: number): AudioBuffer {
  const rate = c.sampleRate;
  const len = Math.floor(rate * seconds);
  const buf = c.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return buf;
}

/** Internal context — created lazily on the first tick. */
function mc(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();

    // master chain: volume → duck → compressor → dry + sends
    const music = ctx.createGain();
    const duck = ctx.createGain();
    duck.gain.value = 1;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 22;
    comp.ratio.value = 4;
    comp.attack.value = 0.004;
    comp.release.value = 0.22;
    const dry = ctx.createGain();
    dry.gain.value = 1;
    music.connect(duck);
    duck.connect(comp);
    comp.connect(dry);
    dry.connect(ctx.destination);

    // reverb — the playground echo
    const reverb = ctx.createConvolver();
    reverb.buffer = makeImpulse(ctx, 1.9, 2.4);
    const reverbSend = ctx.createGain();
    reverbSend.gain.value = 0.4;
    const reverbOut = ctx.createGain();
    reverbOut.gain.value = 0.55;
    comp.connect(reverbSend);
    reverbSend.connect(reverb);
    reverb.connect(reverbOut);
    reverbOut.connect(ctx.destination);

    // delay — dotted-eighth with warm lowpassed feedback
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.35;
    const delayLP = ctx.createBiquadFilter();
    delayLP.type = "lowpass";
    delayLP.frequency.value = 2600;
    delayLP.Q.value = 0.6;
    const delayFb = ctx.createGain();
    delayFb.gain.value = 0.34;
    const delaySend = ctx.createGain();
    delaySend.gain.value = 0.5;
    const delayOut = ctx.createGain();
    delayOut.gain.value = 0.5;
    comp.connect(delaySend);
    delaySend.connect(delay);
    delay.connect(delayLP);
    delayLP.connect(delayFb);
    delayFb.connect(delay);
    delayLP.connect(delayOut);
    delayOut.connect(ctx.destination);

    bus = { music, duck, comp, dry, reverb, reverbSend, delay, delaySend, delayOut, delayFb, delayLP };

    // gentle fade-in so the band doesn't pop into existence
    music.gain.setValueAtTime(0.0001, ctx.currentTime);
    music.gain.exponentialRampToValueAtTime(Math.max(0.0002, muted ? 0.0002 : volume), ctx.currentTime + 2);

    // compose today's tune
    rnd = mulberry32(DAY_SEED * 7919 + 13);
    const key = KEYS[Math.floor(rnd() * KEYS.length)];
    scale = buildScale(key.root, key.minor);
    const progs = key.minor ? MINOR_PROGS : MAJOR_PROGS;
    prog = progs[Math.floor(rnd() * progs.length)];
    lastLead = null;
    phrase = [];
    bar = 0;
    nextBarAt = 0;
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

/** Start the recess radio (safe to call before the gesture — it waits). */
export function musicStart() {
  running = true;
  if (timer === null) timer = window.setInterval(tick, 120);
}

function tick() {
  const c = mc();
  if (!c || !running || !bus) return;
  const barLen = 60 / MOOD_CFG[mood].bpm * 4;
  if (nextBarAt < c.currentTime) {
    // Fell behind (tab hidden / context suspended) — snap forward so the
    // lookahead scheduler never floods the graph with backdated bars.
    nextBarAt = c.currentTime + 0.1;
    bar = 0;
    phrase = [];
    lastLead = null;
  }
  while (nextBarAt < c.currentTime + 1.0) {
    playBar(c, nextBarAt, bar);
    nextBarAt += barLen;
    bar++;
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
  // Same daily tune, fresh arrangement energy — reseed so the melody walk
  // and bass walk change character with the switch.
  rnd = mulberry32(DAY_SEED * 7919 + 13 + (m === "hub" ? 0 : m === "play" ? 100 : 200));
  lastLead = null;
  phrase = [];
}

export function setMusicVolume(v: number) {
  volume = Math.max(0, Math.min(1, v));
  if (bus) bus.music.gain.value = muted ? 0 : volume;
}

/** Respect the global mute switch (called from audio.ts). */
export function musicSetMuted(m: boolean) {
  muted = m;
  if (bus) bus.music.gain.value = m ? 0 : volume;
}

/** Briefly duck the music so SFX pop (smashes, bells, wins). */
export function musicDuck(sec = 1.4) {
  const c = mc();
  if (!c || !bus) return;
  const g = bus.duck.gain;
  g.cancelScheduledValues(c.currentTime);
  g.setValueAtTime(Math.max(g.value, 0.001), c.currentTime);
  g.linearRampToValueAtTime(0.22, c.currentTime + 0.05);
  g.linearRampToValueAtTime(1, c.currentTime + sec);
}

// ── tiny voice plumbing ──────────────────────────────────────
function midiToFreq(m: number) {
  return 440 * Math.pow(2, (m - 69) / 12);
}

/** A gain envelope: quick attack, exponential decay to silence. */
function env(c: AudioContext, at: number, vol: number, attack: number, dur: number): GainNode {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(Math.max(vol, 0.0001), at + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  return g;
}

/** One oscillator through an envelope. */
function osc(
  c: AudioContext,
  type: OscillatorType,
  freq: number,
  at: number,
  dur: number,
  vol: number,
  opts?: { glideTo?: number; attack?: number; dest?: AudioNode },
) {
  if (!bus) return;
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, at);
  if (opts?.glideTo) o.frequency.exponentialRampToValueAtTime(Math.max(opts.glideTo, 1), at + dur);
  const g = env(c, at, vol, opts?.attack ?? 0.015, dur);
  o.connect(g);
  g.connect(opts?.dest ?? bus.dry);
  o.start(at);
  o.stop(at + dur + 0.08);
}

// Cached white-noise buffer (reused by every drum hit).
let noiseBuf: AudioBuffer | null = null;
function burst(
  c: AudioContext,
  at: number,
  dur: number,
  vol: number,
  type: BiquadFilterType,
  freq: number,
  dest?: AudioNode,
) {
  if (!bus) return;
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, Math.floor(c.sampleRate * 0.6), c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  src.start(at, Math.random() * 0.3); // fresh slice of noise each hit
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  const g = env(c, at, vol, 0.004, dur);
  src.connect(f);
  f.connect(g);
  g.connect(dest ?? bus.dry);
}

// ── the instruments ──────────────────────────────────────────
function kick(c: AudioContext, at: number, vol: number) {
  if (!bus) return;
  const o = c.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(150, at);
  o.frequency.exponentialRampToValueAtTime(42, at + 0.11); // pitch-drop thump
  const g = env(c, at, vol, 0.004, 0.15);
  o.connect(g);
  g.connect(bus.dry);
  o.start(at);
  o.stop(at + 0.17);
  burst(c, at, 0.02, vol * 0.35, "highpass", 1400); // beater click
}

function snare(c: AudioContext, at: number, vol: number) {
  if (!bus) return;
  burst(c, at, 0.16, vol, "bandpass", 1900);
  osc(c, "triangle", 190, at, 0.13, vol * 0.5, { glideTo: 120 });
}

function clap(c: AudioContext, at: number, vol: number) {
  for (let i = 0; i < 3; i++) burst(c, at + i * 0.011, 0.035, vol * (1 - i * 0.25), "bandpass", 1100);
}

function hat(c: AudioContext, at: number, vol: number, open: boolean) {
  burst(c, at, open ? 0.1 : 0.04, vol, "highpass", 8500);
}

function crash(c: AudioContext, at: number, vol: number) {
  if (!bus) return;
  burst(c, at, 0.9, vol, "highpass", 5200, bus.reverbSend);
  burst(c, at, 0.5, vol * 0.4, "bandpass", 3000);
}

/** Noise swell into a section top (match-point hype). */
function riser(c: AudioContext, at: number, dur: number, vol: number) {
  if (!bus) return;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.Q.value = 1.4;
  f.frequency.setValueAtTime(350, at);
  f.frequency.exponentialRampToValueAtTime(5200, at + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(vol, at + dur);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur + 0.05);
  src.connect(f);
  f.connect(g);
  g.connect(bus.dry);
  src.start(at);
}

/** Warm triangle lead with vibrato, portamento and echo. */
function lead(c: AudioContext, midi: number, at: number, dur: number, vol: number, held: boolean) {
  if (!bus) return;
  const f = midiToFreq(midi);
  const o = c.createOscillator();
  o.type = "triangle";
  o.frequency.setValueAtTime(f, at);
  o.frequency.exponentialRampToValueAtTime(f * 0.985, at + dur); // lazy slide down
  if (held) {
    const lfo = c.createOscillator();
    lfo.frequency.value = 5.5;
    const lg = c.createGain();
    lg.gain.value = 4;
    lfo.connect(lg);
    lg.connect(o.frequency);
    lfo.start(at);
    lfo.stop(at + dur);
  }
  const g = env(c, at, vol, 0.02, dur);
  o.connect(g);
  g.connect(bus.dry);
  g.connect(bus.reverbSend);
  g.connect(bus.delaySend);
  o.start(at);
  o.stop(at + dur + 0.1);
}

/** Gentle sine bell — the arpeggio sparkle. */
function bell(c: AudioContext, midi: number, at: number, vol: number) {
  if (!bus) return;
  const f = midiToFreq(midi);
  const o = c.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(f, at);
  const g = env(c, at, vol, 0.005, 0.5);
  o.connect(g);
  g.connect(bus.dry);
  g.connect(bus.reverbSend);
  o.start(at);
  o.stop(at + 0.6);
}

/** Detuned pad triad (or tetrad) through a lowpass, slow attack. */
function padChord(
  c: AudioContext,
  tones: { root: number; third: number; fifth: number; seventh: number },
  at: number,
  dur: number,
  vol: number,
  seventh: boolean,
  energy: number,
) {
  if (!bus) return;
  const notes = [tones.root, tones.third, tones.fifth];
  if (seventh) notes.push(tones.seventh);
  const lpf = c.createBiquadFilter();
  lpf.type = "lowpass";
  lpf.frequency.value = energy >= 2 ? 2200 : 1600;
  for (const n of notes) {
    const f = midiToFreq(n);
    for (const det of [1, 1.004]) {
      const o = c.createOscillator();
      o.type = "triangle";
      o.frequency.setValueAtTime(f * det, at);
      const g = env(c, at, vol / notes.length / 2, 0.4, dur + 0.4);
      o.connect(g);
      g.connect(lpf);
      o.start(at);
      o.stop(at + dur + 0.6);
    }
  }
  const out = c.createGain();
  out.gain.value = 0.85;
  lpf.connect(out);
  out.connect(bus.dry);
  const rs = c.createGain();
  rs.gain.value = 0.5;
  lpf.connect(rs);
  rs.connect(bus.reverbSend);
}

function bassNote(c: AudioContext, freq: number, at: number, dur: number, vol: number, energy: number) {
  if (!bus) return;
  const o = c.createOscillator();
  o.type = energy >= 2 ? "sawtooth" : "triangle";
  o.frequency.setValueAtTime(freq, at);
  const f = c.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = energy >= 2 ? 620 : 420;
  f.Q.value = 0.7;
  const g = env(c, at, vol, 0.012, dur);
  o.connect(f);
  f.connect(g);
  g.connect(bus.dry);
  const sub = c.createOscillator();
  sub.type = "sine";
  sub.frequency.setValueAtTime(Math.max(freq / 2, 32), at);
  const sg = env(c, at, vol * 0.4, 0.012, dur);
  sub.connect(sg);
  sg.connect(bus.dry);
  o.start(at);
  o.stop(at + dur + 0.06);
  sub.start(at);
  sub.stop(at + dur + 0.06);
}

// ── melody generation (phrase-based, not random blips) ───────
function genPhrase(barIdx: number, inSection: number): (PhraseNote | null)[] {
  const cfg = MOOD_CFG[mood];
  const mel = scale.slice(7, 22);      // root .. root+24
  const reg = inSection >= 8 ? 12 : 0; // B-section lift
  const density = 0.48 + cfg.energy * 0.13;
  const out: (PhraseNote | null)[] = [];
  for (let i = 0; i < 16; i++) {
    const deg = prog[(barIdx + (i < 8 ? 0 : 1)) % prog.length];
    const tones = chordTones(scale, deg);
    if (rnd() > density) {
      out.push(null);
      continue;
    }
    let midi: number;
    if (lastLead === null) {
      midi = tones.root + 12; // start a phrase on solid ground
    } else {
      const idx = mel.indexOf(lastLead);
      if (idx >= 0 && rnd() < 0.6) {
        // stepwise along the scale — the melody *walks*
        const dir = rnd() < 0.5 ? -1 : 1;
        const steps = rnd() < 0.7 ? 1 : 2;
        midi = mel[Math.max(0, Math.min(mel.length - 1, idx + dir * steps))];
      } else {
        // occasional chord leap
        const pick = [tones.root, tones.third, tones.fifth][Math.floor(rnd() * 3)];
        midi = pick + (rnd() < 0.5 ? 12 : 0);
      }
    }
    // resolve home to a chord tone at phrase ends
    if (i === 7 || i === 15) {
      const pick = [tones.root, tones.third, tones.fifth][Math.floor(rnd() * 3)];
      midi = pick + 12;
    }
    midi = Math.min(midi + reg, mel[mel.length - 1]);
    lastLead = midi;
    out.push({ midi, vel: 0.7 + rnd() * 0.3, len: rnd() < 0.24 ? 2 : 1 });
  }
  return out;
}

// ── one bar of the arrangement ───────────────────────────────
function playBar(c: AudioContext, at: number, barIdx: number) {
  const cfg = MOOD_CFG[mood];
  const barLen = 60 / cfg.bpm * 4;
  const sixteenth = barLen / 16;
  const deg = prog[barIdx % prog.length];
  const tones = chordTones(scale, deg);
  const inSection = barIdx % 16;
  const isFill = barIdx % cfg.fillEvery === cfg.fillEvery - 1;
  const afterFill = barIdx > 0 && (barIdx - 1) % cfg.fillEvery === cfg.fillEvery - 1;
  const energy = cfg.energy;
  const kit = cfg.kitVol;

  if (bus) bus.delay.delayTime.value = sixteenth * 6; // dotted eighth tracks the tempo

  // swung step time (offbeat 8ths shuffle) + humanise
  const stepTime = (s: number) =>
    at + s * sixteenth + (s % 4 === 2 ? sixteenth * cfg.swing : 0) + (Math.random() - 0.5) * 0.01;

  // ── pads: the chord, held through the bar (dropped on fills for a breath) ──
  if (!isFill) padChord(c, tones, at, barLen * 0.92, cfg.padVol, rnd() < 0.45, energy);

  // ── bass ──
  const r = tones.root - 12;
  const f = tones.fifth - 12;
  const ap = tones.seventh - 12;
  const oct = tones.root; // an octave flick above the root
  const bass = (s: number, midi: number, vel: number) =>
    bassNote(c, midiToFreq(midi), stepTime(s), sixteenth * 1.7, cfg.bassVol * vel, energy);

  if (energy === 0) {
    bass(0, r, 1);
    bass(8, f, 0.9);
    if (rnd() < 0.35) bass(12, r, 0.7);
  } else if (energy === 1) {
    bass(0, r, 1); bass(4, r, 0.7); bass(6, oct, 0.6);
    bass(8, f, 0.9); bass(12, r, 0.85); bass(14, ap, 0.6);
  } else {
    bass(0, r, 1); bass(2, r, 0.5); bass(4, r, 0.75); bass(6, oct, 0.65);
    bass(8, f, 0.9); bass(10, f, 0.55); bass(12, r, 0.9); bass(14, ap, 0.65);
  }

  // ── drums ──
  if (!isFill) {
    if (energy === 0) {
      kick(c, stepTime(0), 0.5);
      kick(c, stepTime(8), 0.42);
      if (rnd() < 0.25) kick(c, stepTime(12), 0.3);
    } else if (energy === 1) {
      kick(c, stepTime(0), 0.55);
      kick(c, stepTime(8), 0.5);
      if (rnd() < 0.4) kick(c, stepTime(4), 0.35);
    } else {
      [0, 4, 8, 12].forEach((s) => kick(c, stepTime(s), s === 0 ? 0.6 : 0.48)); // four-on-the-floor
    }

    if (energy >= 1) {
      [4, 12].forEach((s) => {
        snare(c, stepTime(s), kit * 0.3);
        clap(c, stepTime(s), kit * 0.12);
      });
    }

    if (energy === 0) {
      [2, 6, 10, 14].forEach((s) => hat(c, stepTime(s), 0.045, false));
    } else {
      [2, 6, 10, 14].forEach((s) => hat(c, stepTime(s), 0.06, false));
      if (energy >= 2) [1, 3, 5, 7, 9, 11, 13, 15].forEach((s) => hat(c, stepTime(s), 0.028, false));
      if (energy >= 2 && rnd() < 0.5) hat(c, stepTime(14), 0.07, true);
    }
  }

  // ── crash on phrase tops + after fills ──
  const crashAt = (energy === 2 && inSection % 4 === 0) || (energy === 1 && inSection % 8 === 0) || afterFill;
  if (crashAt) crash(c, stepTime(0), kit * 0.28);

  // ── drum fill: snare roll into the next bar ──
  if (isFill) {
    [10, 12, 13, 14, 15].forEach((s, i) => snare(c, stepTime(s), kit * (0.18 + i * 0.05)));
  }

  // ── riser into a section top (match point) ──
  if (energy === 2 && inSection === 15) riser(c, at + sixteenth * 12, barLen * 0.25, 0.09);

  // ── arpeggio bells on odd bars ──
  if (cfg.arp && barIdx % 2 === 1 && !isFill) {
    const arpNotes = [tones.root + 12, tones.third + 12, tones.fifth + 12, tones.root + 24];
    [0, 4, 8, 12].forEach((s, i) => bell(c, arpNotes[i % 4], stepTime(s), 0.035));
  }

  // ── lead melody (2-bar phrases, one half per bar) ──
  if (barIdx % 2 === 0) phrase = genPhrase(barIdx, inSection);
  const eStart = barIdx % 2 === 0 ? 0 : 8;
  for (let e = eStart; e < eStart + 8; e++) {
    const n = phrase[e];
    if (!n) continue;
    const t = stepTime((e - eStart) * 2) + (Math.random() - 0.5) * 0.012;
    lead(c, n.midi, t, n.len >= 2 ? sixteenth * 3 : sixteenth * 1.8, cfg.leadVol * n.vel, n.len >= 2);
  }
}
