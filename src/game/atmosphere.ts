// ─────────────────────────────────────────────────────────────
//  ATMOSPHERE — the school day rolling by (Season 2)
//
//  A tiny pure module that turns a session clock into a playground
//  mood: morning → noon → golden hour → dusk → night. The shared
//  <Atmosphere/> rig advances the clock every frame and the hub's
//  <Sky/> reads the same snapshot, so the whole yard always agrees
//  on what time it is. A full day takes ~24 minutes of real time —
//  fast enough that a long match can drift from noon into golden
//  hour, slow enough that it never feels like strobe lighting.
// ─────────────────────────────────────────────────────────────

export const DAY_SECONDS = 24 * 60; // one full school day (real seconds)

export interface DayState {
  /** seconds since 9:00 AM "school time" (0 at dawn-ish) */
  t: number;
}

export interface SkyPalette {
  /** clear-sky colour (used for scene.background) */
  sky: string;
  /** horizon haze / fog colour */
  fog: string;
  /** sun tint — warm near the horizon, white at noon */
  sun: string;
  /** how dark the scene feels: 0 = day, 1 = deep night */
  night: number;
  /** how strong the star field is */
  stars: number;
  /** how strongly the lamps should glow */
  lamp: number;
  /** ambient light intensity multiplier (1 day → ~0.35 at night) */
  ambience: number;
}

// Keyframes along the school day. `t` is the fraction of DAY_SECONDS.
const KEYFRAMES: { at: number; sky: [number, number, number]; fog: [number, number, number]; sun: [number, number, number]; night: number }[] = [
  // 9:00 AM — crisp, bright morning
  { at: 0.00, sky: [0.56, 0.75, 0.88], fog: [0.78, 0.87, 0.93], sun: [1.00, 0.95, 0.85], night: 0 },
  // 12:00 PM — high, clean noon
  { at: 0.30, sky: [0.47, 0.68, 0.90], fog: [0.72, 0.83, 0.93], sun: [1.00, 0.98, 0.94], night: 0 },
  // 3:30 PM — warm afternoon
  { at: 0.55, sky: [0.52, 0.70, 0.88], fog: [0.78, 0.85, 0.92], sun: [1.00, 0.92, 0.80], night: 0 },
  // 5:30 PM — golden hour
  { at: 0.75, sky: [0.95, 0.72, 0.52], fog: [0.98, 0.84, 0.66], sun: [1.00, 0.76, 0.50], night: 0.08 },
  // 7:15 PM — dusk
  { at: 0.90, sky: [0.30, 0.33, 0.55], fog: [0.42, 0.42, 0.62], sun: [0.90, 0.55, 0.45], night: 0.55 },
  // 9:00 PM — night
  { at: 1.00, sky: [0.04, 0.06, 0.14], fog: [0.08, 0.10, 0.18], sun: [0.35, 0.45, 0.75], night: 0.95 },
];

function lerp(a: number, b: number, k: number) {
  return a + (b - a) * k;
}

function lerpColor(a: [number, number, number], b: [number, number, number], k: number): [number, number, number] {
  return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
}

const rgb = (c: [number, number, number]) => {
  const to = (v: number) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, "0");
  return `#${to(c[0])}${to(c[1])}${to(c[2])}`;
};

/** Walk the keyframes and blend the palette for a given school-day fraction. */
export function skyPalette(fraction: number): SkyPalette {
  const f = ((fraction % 1) + 1) % 1;
  let i = 0;
  while (i < KEYFRAMES.length - 2 && KEYFRAMES[i + 1].at <= f) i++;
  const a = KEYFRAMES[i];
  const b = KEYFRAMES[i + 1];
  const span = Math.max(1e-6, b.at - a.at);
  const k = Math.max(0, Math.min(1, (f - a.at) / span));
  const sky = lerpColor(a.sky, b.sky, k);
  const fog = lerpColor(a.fog, b.fog, k);
  const sun = lerpColor(a.sun, b.sun, k);
  const night = lerp(a.night, b.night, k);
  return {
    sky: rgb(sky),
    fog: rgb(fog),
    sun: rgb(sun),
    night,
    stars: Math.max(0, (night - 0.25) / 0.7),
    lamp: Math.max(0, (night - 0.18) / 0.6),
    ambience: 1 - night * 0.7,
  };
}

// ── session clock ─────────────────────────────────────────────
// Module-level so every consumer reads ONE time. The <Atmosphere/>
// rig advances it (only one rig runs at a time — hub or a match).
let daySeconds = 0;
let dayRunning = false;

export function startDay() {
  dayRunning = true;
}

export function stopDay() {
  dayRunning = false;
}

/** Advance the school-day clock by dt real seconds. */
export function advanceDay(dt: number) {
  if (!dayRunning) return;
  daySeconds = (daySeconds + dt) % DAY_SECONDS;
}

/** The current palette, driven by the shared clock. */
export function currentPalette(): SkyPalette {
  return skyPalette(daySeconds / DAY_SECONDS);
}

/** Fraction 0..1 of the school day. */
export function dayFraction(): number {
  return daySeconds / DAY_SECONDS;
}
