// Collision volumes for the playground hub. The player is a small circle
// (radius PLAYER_R) pushed out of every solid obstacle. Trees, poles and
// fountains are circles; buildings, benches and the wallball wall are boxes.

import { TETHER_POS, WALL_POS } from "./constants";

export const PLAYER_R = 0.42;

export interface CircleCol { x: number; z: number; r: number; }
export interface BoxCol { x: number; z: number; hw: number; hd: number; }

// ── Circular obstacles ──
export const CIRCLES: CircleCol[] = [
  // trees along the fence
  { x: -12.0, z: -7.2, r: 0.75 },
  { x:  12.0, z: -7.2, r: 0.70 },
  { x: -12.2, z: 11.4, r: 0.68 },
  { x:  12.2, z: 11.4, r: 0.72 },
  // flagpole
  { x: 12.5,  z: -12.5, r: 0.35 },
  // water fountain
  { x: 12.2,  z: 0.5,  r: 0.5 },
  // tetherball pole
  { x: TETHER_POS[0], z: TETHER_POS[2], r: 0.35 },
];

// ── Box obstacles ──
export const BOXES: BoxCol[] = [
  // main school building (front face ≈ z −14.25)
  { x: 0,    z: -17,   hw: 15,  hd: 3.0 },
  // gym wing
  { x: 21.5, z: -13,   hw: 5.5, hd: 4.5 },
  // bench (south-east)
  { x: 4.2,  z: 11.9,  hw: 1.1, hd: 0.4 },
  // backpack pile (south-west)
  { x: -4.4, z: 11.9,  hw: 0.7, hd: 0.5 },
  // wallball wall — its front face blocks you
  { x: WALL_POS[0], z: WALL_POS[2] - 0.2, hw: 3.2, hd: 0.5 },
  // swing set frame
  { x: -8.8, z: 12.0,  hw: 1.9, hd: 0.6 },
  // slide platform
  { x:  8.8, z: 12.0,  hw: 0.7, hd: 0.7 },
  // tag and kickball entrance markers
  { x: -3.8, z: 9.0, hw: 0.7, hd: 0.5 },
  { x:  3.8, z: 9.0, hw: 0.7, hd: 0.5 },
];

/**
 * Resolve the player position against all colliders, returning corrected
 * coordinates. Circles push radially, boxes push along the shallowest axis.
 */
export function resolveCollisions(px: number, pz: number): { x: number; z: number } {
  let x = px;
  let z = pz;

  for (const c of CIRCLES) {
    const dx = x - c.x;
    const dz = z - c.z;
    const minD = c.r + PLAYER_R;
    const d2 = dx * dx + dz * dz;
    if (d2 < minD * minD) {
      const d = Math.sqrt(d2) || 0.0001;
      const push = (minD - d) / d;
      x += dx * push;
      z += dz * push;
    }
  }

  for (const b of BOXES) {
    const hw = b.hw + PLAYER_R;
    const hd = b.hd + PLAYER_R;
    const dx = x - b.x;
    const dz = z - b.z;
    if (Math.abs(dx) < hw && Math.abs(dz) < hd) {
      const overlapX = hw - Math.abs(dx);
      const overlapZ = hd - Math.abs(dz);
      if (overlapX < overlapZ) x = b.x + Math.sign(dx || 1) * hw;
      else                     z = b.z + Math.sign(dz || 1) * hd;
    }
  }

  // Outer chain-link fence
  x = Math.max(-12.5, Math.min(12.5, x));
  z = Math.max(-12.5, Math.min(12.5, z));

  return { x, z };
}
