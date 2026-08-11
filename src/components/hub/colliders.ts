// Collision volumes for the playground hub. The player is a small circle
// (radius PLAYER_R) pushed out of every solid obstacle. Trees, poles and
// fountains are circles; buildings, benches and the wallball wall are boxes.
// Boxes may carry an optional `ry` rotation (e.g. the angled slide) — the
// push-out is then resolved in the box's local frame and rotated back.

import { TETHER_POS, WALL_POS, BASKET_POS, GAGA_POS, HOPSCOTCH_POS } from "./constants";

export const PLAYER_R = 0.42;

export interface CircleCol { x: number; z: number; r: number; }
export interface BoxCol { x: number; z: number; hw: number; hd: number; ry?: number; }

// ── Circular obstacles ──
export const CIRCLES: CircleCol[] = [
  // trees along the fence
  { x: -12.0, z: -7.2, r: 0.75 },
  { x:  12.4, z: -1.5, r: 0.70 },   // NE tree, moved clear of the basketball court
  { x: -12.2, z: 11.4, r: 0.68 },
  { x:  12.2, z: 11.4, r: 0.72 },
  // flagpole
  { x: 12.5,  z: -12.5, r: 0.35 },
  // water fountain
  { x: 12.2,  z: 0.5,  r: 0.5 },
  // tetherball pole
  { x: TETHER_POS[0], z: TETHER_POS[2], r: 0.35 },
  // basketball hoop pole (just behind the backboard)
  { x: BASKET_POS[0], z: BASKET_POS[2] - 1.3, r: 0.4 },
  // double-dutch crew — spinning rope + kids + handle-holders
  { x: 5.4,  z: 9.4,  r: 1.8 },
  // Season 2: fence-line bushes
  { x: -12.2, z: -2.0, r: 0.7 },
  { x:  12.2, z: -2.0, r: 0.7 },
  // Season 2: lamp posts along the east strip and west fence
  { x: 15.3, z: -9.0, r: 0.3 },
  { x: 15.3, z:  0.0, r: 0.3 },
  { x: 15.3, z:  9.0, r: 0.3 },
  { x: -12.3, z: -9.0, r: 0.3 },
  { x: -12.3, z:  9.0, r: 0.3 },
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
  // slide — angled to match the model's rotation-y (platform + ramp + rail).
  // The box is centred under the ramp (local z ≈ +1.2) so the far end of the
  // chute (local z ≈ 2.35) is blocked too; centred at the model origin the
  // last metre of the slide would be walk-through-able.
  {
    x: 8.8 + 1.2 * Math.sin(Math.PI * 0.72),
    z: 12.0 + 1.2 * Math.cos(Math.PI * 0.72),
    hw: 0.55,
    hd: 1.2,
    ry: Math.PI * 0.72,
  },
  // gaga pit — the octagonal walls keep you out
  { x: GAGA_POS[0], z: GAGA_POS[2], hw: 3.4, hd: 3.4 },
  // hopscotch board — the chalk squares you hop through (runs ~8.8 m north)
  { x: HOPSCOTCH_POS[0], z: HOPSCOTCH_POS[2] - 4.6, hw: 0.55, hd: 4.35 },
  // Season 2: monkey bars — north end of the east strip
  { x: 14.8, z: -10.5, hw: 2.0, hd: 0.9 },
  // Season 2: picnic table — south-east corner of the strip
  { x: 15.4, z: 9.8, hw: 1.0, hd: 0.6 },
  // Season 2: flower bed along the school building's base
  { x: -8.0, z: -13.9, hw: 1.8, hd: 0.5 },
];

/**
 * Resolve the player position against all colliders, returning corrected
 * coordinates. Circles push radially; boxes (optionally rotated) push along
 * the shallowest local axis.
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
    let lx = x - b.x;
    let lz = z - b.z;
    if (b.ry) {
      const c = Math.cos(-b.ry);
      const s = Math.sin(-b.ry);
      const px = lx;
      lx = px * c - lz * s;
      lz = px * s + lz * c;
    }
    if (Math.abs(lx) < hw && Math.abs(lz) < hd) {
      const overlapX = hw - Math.abs(lx);
      const overlapZ = hd - Math.abs(lz);
      if (overlapX < overlapZ) lx = Math.sign(lx || 1) * hw;
      else                     lz = Math.sign(lz || 1) * hd;
      if (b.ry) {
        const c = Math.cos(b.ry);
        const s = Math.sin(b.ry);
        x = b.x + lx * c - lz * s;
        z = b.z + lx * s + lz * c;
      } else {
        x = b.x + lx;
        z = b.z + lz;
      }
    }
  }

  // Outer chain-link fence. The east side was extended for the red-light
  // lane (Season 2), so the walkable strip runs out to x = 15.5.
  x = Math.max(-12.5, Math.min(15.5, x));
  z = Math.max(-12.5, Math.min(12.5, z));

  return { x, z };
}
