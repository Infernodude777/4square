// ─────────────────────────────────────────────────────────────
//  SEEDED RANDOM — deterministic scatter for the yard's visuals
//  (cloud puffs, grass tufts, treeline, vines…). A seeded PRNG
//  keeps the schoolyard looking identical on every visit instead
//  of re-rolling decorations each load.
// ─────────────────────────────────────────────────────────────

/** Small, fast seeded PRNG (mulberry32). Call the returned fn for 0..1. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Random point in an annular ring (min radius → max radius). */
export function ringPoint(rng: () => number, rMin: number, rMax: number): [number, number] {
  const a = rng() * Math.PI * 2;
  const r = rMin + rng() * (rMax - rMin);
  return [Math.cos(a) * r, Math.sin(a) * r];
}
