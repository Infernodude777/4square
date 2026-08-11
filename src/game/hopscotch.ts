// ─────────────────────────────────────────────────────────────
//  HOPSCOTCH — beat the bots down the chalk board
//
//  A light, skill-based time trial. Ten chalk cells zigzag down
//  the blacktop. Click the NEXT cell in order to hop there —
//  touch them all and you're home. Click a wrong cell and that's
//  a fault (+1.5 s). Finish the board and your time is compared
//  against three bot times (they scale with difficulty). Beat
//  the fastest bot to take the yard.
// ─────────────────────────────────────────────────────────────

import * as THREE from "three";
import { skillFactor } from "./settings";

// ── Board geometry (local coords; the scene offsets the board) ──
export const CELLS = 10;
export const CELL_SIZE = 0.62;

/** Centre of cell k in local space (zigzag column). */
export function cellPos(k: number, out: THREE.Vector3): THREE.Vector3 {
  const x = (k % 2 === 1 ? 1 : 0) * 0.78 - 0.39;
  return out.set(x, 0, -k * 0.78 - 0.4);
}

export const FAULT_PENALTY = 1.5;   // seconds added per fault

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// ── Bot times (seconds) ──────────────────────────────────────
export function botTimes(): number[] {
  const f = 1 + (skillFactor() - 1) * 0.55;   // chill slower, fierce faster
  return [14.5 * f, 17.0 * f, 20.5 * f];
}

// ── State ────────────────────────────────────────────────────
export type HPhase = "countdown" | "play" | "over";

export interface HState {
  time: number;
  phase: HPhase;
  countdown: number;
  /** next cell the player must hit (0..9), 10 = done */
  target: number;
  /** cell the player currently stands on (-1 = start) */
  standing: number;
  /** interpolated render position (hops are animated by the director) */
  pos: THREE.Vector3;
  hopT: number;
  faults: number;
  finishTime: number | null;
  times: number[];          // bot times this round
  banner: string;
  bannerSub: string;
  bannerAt: number;
  winner: 0 | 1 | null;     // 0 = player
  handled: boolean;
}

export function createHState(): HState {
  return {
    time: 0,
    phase: "countdown",
    countdown: 3,
    target: 0,
    standing: -1,
    pos: new THREE.Vector3(0.39, 0, 0.1),
    hopT: 0,
    faults: 0,
    finishTime: null,
    times: botTimes(),
    banner: "HOPSCOTCH",
    bannerSub: "click the cells in order — beat the bots",
    bannerAt: 0,
    winner: null,
    handled: false,
  };
}

// ── step ─────────────────────────────────────────────────────
export function stepH(t: HState, dt: number) {
  t.time += dt;
  switch (t.phase) {
    case "countdown":
      t.countdown -= dt;
      if (t.countdown <= 0) {
        t.phase = "play";
        t.banner = "GO!";
        t.bannerSub = "click cell 1";
        t.bannerAt = t.time;
      }
      return;
    case "play":
      return;
    case "over":
      return;
  }
}

/** Attempt to hop to cell k. Returns true if it was a valid hop. */
export function tryHop(t: HState, k: number): boolean {
  if (t.phase !== "play") return false;
  if (k === t.target) {
    t.standing = k;
    t.target += 1;
    t.hopT = 0;
    if (t.target >= CELLS) finish(t);
    return true;
  }
  // Fault — wrong cell.
  t.faults += 1;
  return false;
}

function finish(t: HState) {
  t.finishTime = t.time + t.faults * FAULT_PENALTY;
  t.phase = "over";
  const best = Math.min(...t.times);
  t.winner = t.finishTime <= best ? 0 : 1;
  t.banner = t.winner === 0 ? "YOU BEAT THE BOTS!" : "THE BOTS WERE FASTER";
  t.bannerSub = `${t.finishTime.toFixed(1)}s · ${t.faults} fault${t.faults === 1 ? "" : "s"}`;
  t.bannerAt = t.time;
}

/** Cell under a world point (local coords), or -1. */
export function cellAt(x: number, z: number): number {
  for (let k = 0; k < CELLS; k++) {
    const c = cellPos(k, new THREE.Vector3());
    if (Math.abs(x - c.x) < CELL_SIZE / 2 + 0.08 && Math.abs(z - c.z) < CELL_SIZE / 2 + 0.08) return k;
  }
  return -1;
}
