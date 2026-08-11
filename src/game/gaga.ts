// ─────────────────────────────────────────────────────────────
//  GAGA BALL — the octagonal pit
//
//  Real recess gaga: an octagonal pit, waist-high walls, one
//  bouncy ball. Nobody picks it up — you "ga!" it with an open
//  palm. If the ball touches anyone below the waist, they're out.
//  Last one standing wins.
//
//  YOU
//    • WASD to shuffle around the pit.
//    • Click when the ball is in reach to GA! it toward the mouse.
//
//  THE BOTS
//    • They ga! the ball whenever it's close, often toward you.
//
//  A ball that rolls low and touches you = OUT. Your own slap
//  gives you a short grace period so a follow-up bounce can't
//  instantly claim you. Pure chaos. Last kid in the pit wins.
// ─────────────────────────────────────────────────────────────

import * as THREE from "three";
import { sfx, gaSlap } from "./audio";

// ── Pit geometry ─────────────────────────────────────────────
export const PIT_R = 3.7;          // octagon circumradius
export const WALL_H = 1.15;        // waist-high walls
export const BALL_R = 0.13;
export const GRAV = 12;
export const HIT_REACH = 1.35;
export const OUT_HEIGHT = 0.55;    // below this = "low" ball (dangerous)
export const OUT_DIST = 0.52;      // ball-to-body distance that claims you
export const ROUND_TIME = 90;

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Octagon vertices (unit radius, flat-topped). */
export const OCTA: [number, number][] = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
  return [Math.cos(a), Math.sin(a)];
});

/** Distance of a point from the octagon edge (negative = inside). */
export function octDist(x: number, z: number): number {
  // Signed distance to a regular polygon: the greatest outward distance
  // across its edge half-planes (approx, good enough). The vertex winding is
  // counter-clockwise, so the interior lies on the left side of every edge.
  let max = -Infinity;
  for (let i = 0; i < 8; i++) {
    const [ax0, az0] = OCTA[i];
    const [bx0, bz0] = OCTA[(i + 1) % 8];
    const ax = ax0 * PIT_R, az = az0 * PIT_R;
    const bx = bx0 * PIT_R, bz = bz0 * PIT_R;
    const ex = bx - ax, ez = bz - az;
    const len = Math.hypot(ex, ez);
    // Negate the left-side distance so inside is negative, then take the
    // greatest value: one violated half-plane makes an outside point positive.
    const d = -(ex * (z - az) - ez * (x - ax)) / len;
    max = Math.max(max, d);
  }
  return max;
}

// ── Bots ─────────────────────────────────────────────────────
export interface GBotDef {
  id: string;
  name: string;
  colour: string;
  jersey: string;
  accent: string;
  skin: string;
  speed: number;
  slap: number;    // slap accuracy/power
}
export const GBOTS: GBotDef[] = [
  { id: "rex",   name: "REX",   colour: "#e2483d", jersey: "#e2483d", accent: "#ffd23e", skin: "#c7d0dc", speed: 3.6, slap: 0.85 },
  { id: "ziggy", name: "ZIGGY", colour: "#ff8a3c", jersey: "#ff8a3c", accent: "#fff0d0", skin: "#c7d0dc", speed: 4.1, slap: 0.72 },
  { id: "grace", name: "GRACE", colour: "#39b46a", jersey: "#39b46a", accent: "#eaf6ff", skin: "#b8bfc7", speed: 3.4, slap: 0.78 },
  { id: "ada",   name: "ADA",   colour: "#4f8ef7", jersey: "#4f8ef7", accent: "#ffffff", skin: "#b8bfc7", speed: 3.1, slap: 0.9 },
];

// ── State ────────────────────────────────────────────────────
export type GPhase = "countdown" | "play" | "over";

export interface GBot {
  def: GBotDef;
  idx: number;
  pos: THREE.Vector3;
  facing: number;
  moving: boolean;
  alive: boolean;
  cooldown: number;
  wanderAt: number;
  target: THREE.Vector3;
}

export interface GagaState {
  time: number;
  phase: GPhase;
  countdown: number;
  shake: number;
  banner: string;
  bannerSub: string;
  bannerAt: number;

  player: {
    pos: THREE.Vector3;
    facing: number;
    moving: boolean;
    alive: boolean;
    grace: number;      // grace after own slap
    cooldown: number;
  };

  bots: GBot[];

  ball: {
    pos: THREE.Vector3;
    vel: THREE.Vector3;
    lastHitter: "player" | number | null;
    lowTime: number;    // seconds spent slow (to auto-bump)
  };

  winner: 0 | 1 | null;  // 0 = player
  /** set by the director once the game-over hand-off has fired */
  handled: boolean;
}

export function createGagaState(): GagaState {
  const bots: GBot[] = GBOTS.map((def, idx) => {
    const a = (idx / GBOTS.length) * Math.PI * 2 + 0.6;
    const r = 2.0;
    return {
      def, idx,
      pos: new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r),
      facing: 0, moving: false, alive: true, cooldown: 0.5,
      wanderAt: 0,
      target: new THREE.Vector3(),
    };
  });
  return {
    time: 0,
    phase: "countdown",
    countdown: 3,
    shake: 0,
    banner: "GAGA BALL",
    bannerSub: "last one standing wins",
    bannerAt: 0,
    player: {
      pos: new THREE.Vector3(0, 0, -1.6),
      facing: 0, moving: false, alive: true, grace: 0, cooldown: 0,
    },
    bots,
    ball: {
      pos: new THREE.Vector3(0, 0.5, 0),
      vel: new THREE.Vector3(2.2, 3.0, 1.4),
      lastHitter: null,
      lowTime: 0,
    },
    winner: null,
    handled: false,
  };
}

// ── the big step ─────────────────────────────────────────────
export function stepG(t: GagaState, dt: number) {
  t.time += dt;
  t.shake = Math.max(0, t.shake - dt * 2);
  t.player.grace = Math.max(0, t.player.grace - dt);
  t.player.cooldown = Math.max(0, t.player.cooldown - dt);
  for (const b of t.bots) b.cooldown = Math.max(0, b.cooldown - dt);

  switch (t.phase) {
    case "countdown":
      t.countdown -= dt;
      if (t.countdown <= 0) {
        t.phase = "play";
        t.banner = "GA! GA! GA!";
        t.bannerSub = "click to slap the ball toward the mouse";
        t.bannerAt = t.time;
        sfx.whistle();
      }
      return;
    case "play": {
      stepBall(t, dt);
      stepBots(t, dt);
      checkTouch(t);
      if (t.time >= ROUND_TIME && t.phase === "play") endRound(t);
      return;
    }
    case "over":
      return;
  }
}

function stepBall(t: GagaState, dt: number) {
  const b = t.ball.pos;
  const v = t.ball.vel;
  v.y -= GRAV * dt;
  v.x *= 0.9985;
  v.z *= 0.9985;
  b.addScaledVector(v, dt);

  // Floor
  if (b.y <= BALL_R && v.y < 0) {
    b.y = BALL_R;
    if (v.y < -1.6) {
      v.y *= -0.72;
      v.x *= 0.96;
      v.z *= 0.96;
      sfx.bounce(3);
    } else {
      v.y = 0;
      sfx.bounce(1);
    }
  }

  // Pit walls (reflect along the nearest wall normal)
  const d = octDist(b.x, b.z);
  if (d > -BALL_R && b.y < WALL_H) {
    // The closest edge of a convex octagon = the one with max signed dist.
    let nx = 0, nz = 0, best = -Infinity;
    for (let i = 0; i < 8; i++) {
      const [p1x, p1z] = OCTA[i];
      const [p2x, p2z] = OCTA[(i + 1) % 8];
      const ex = p2x - p1x, ez = p2z - p1z;
      const len = Math.hypot(ex, ez);
      const dist = (ex * (b.z - p1z) - ez * (b.x - p1x)) / len;
      if (dist > best) { best = dist; nx = -ez / len; nz = ex / len; }
    }
    b.x -= nx * (d + BALL_R) * 1.05;
    b.z -= nz * (d + BALL_R) * 1.05;
    const dot = v.x * nx + v.z * nz;
    if (dot < 0) {
      v.x -= 2 * dot * nx;
      v.z -= 2 * dot * nz;
      v.x *= 0.86;
      v.z *= 0.86;
      sfx.hit(0.4);
      t.shake = Math.max(t.shake, 0.18);
    }
  }

  // If the ball is nearly dead, give it a little bounce to keep the
  // rally alive (playground balls never truly stop).
  const speed = Math.hypot(v.x, v.z);
  if (speed < 1.1 && v.y === 0) {
    t.ball.lowTime += dt;
    if (t.ball.lowTime > 0.9) {
      t.ball.lowTime = 0;
      v.x += (Math.random() - 0.5) * 2.6;
      v.z += (Math.random() - 0.5) * 2.6;
      v.y = 2.2 + Math.random() * 1.4;
    }
  } else {
    t.ball.lowTime = 0;
  }
}

function stepBots(t: GagaState, dt: number) {
  for (const bot of t.bots) {
    if (!bot.alive) continue;
    // shuffle toward a wander target
    if (t.time > bot.wanderAt) {
      bot.wanderAt = t.time + 1.4 + Math.random() * 2.2;
      const a = Math.random() * Math.PI * 2;
      const r = 0.6 + Math.random() * 2.4;
      bot.target.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    }
    const dx = bot.target.x - bot.pos.x;
    const dz = bot.target.z - bot.pos.z;
    const d = Math.hypot(dx, dz);
    if (d > 0.12) {
      const step = Math.min(d, bot.def.speed * dt);
      bot.pos.x += (dx / d) * step;
      bot.pos.z += (dz / d) * step;
      bot.moving = true;
    } else {
      bot.moving = false;
    }

    // Stay inside the pit
    const od = octDist(bot.pos.x, bot.pos.z);
    if (od > -0.5) {
      const nx = -bot.pos.x / (Math.hypot(bot.pos.x, bot.pos.z) || 1);
      const nz = -bot.pos.z / (Math.hypot(bot.pos.x, bot.pos.z) || 1);
      bot.pos.x += nx * (od + 0.5);
      bot.pos.z += nz * (od + 0.5);
    }

    // Slap the ball when it's near.
    const bd = Math.hypot(t.ball.pos.x - bot.pos.x, t.ball.pos.z - bot.pos.z);
    const ballHigh = t.ball.pos.y > 0.14 && t.ball.pos.y < 1.25;
    if (bot.cooldown <= 0 && bd < HIT_REACH && ballHigh) {
      // Aim away from self, slightly toward the player if nearby.
      let tx = bot.pos.x * 1.6;
      let tz = bot.pos.z * 1.6;
      if (t.player.alive && Math.random() < 0.55) {
        tx = t.player.pos.x;
        tz = t.player.pos.z;
      }
      tx += (Math.random() - 0.5) * 1.6;
      tz += (Math.random() - 0.5) * 1.6;
      slap(t, bot.idx, tx, tz, bot.def.slap);
      bot.cooldown = 0.55 + Math.random() * 0.5;
    }
    bot.facing = Math.atan2(t.ball.pos.x - bot.pos.x, t.ball.pos.z - bot.pos.z);
  }
}

/** Slap the ball toward (tx, tz). `power` 0..1. */
export function slap(
  t: GagaState,
  hitter: "player" | number,
  tx: number,
  tz: number,
  power = 1,
): boolean {
  const b = t.ball;
  const from = b.pos.clone();
  if (b.pos.y < 0.14) return false;
  const speed = 4.4 + power * 3.4;
  const dx = tx - from.x;
  const dz = tz - from.z;
  const horiz = Math.hypot(dx, dz) || 1;
  b.vel.set((dx / horiz) * speed * (0.8 + Math.random() * 0.3), 2.6 + power * 1.6, (dz / horiz) * speed * (0.8 + Math.random() * 0.3));
  b.lastHitter = hitter;
  if (hitter === "player") {
    t.player.grace = 0.55;
    t.player.cooldown = 0.3;
  } else {
    t.bots[hitter].cooldown = 0.5;
  }
  gaSlap();
  return true;
}

function checkTouch(t: GagaState) {
  const b = t.ball.pos;
  if (b.y > OUT_HEIGHT) return;

  // Player out?
  if (t.player.alive && t.player.grace <= 0) {
    const d = Math.hypot(b.x - t.player.pos.x, b.z - t.player.pos.z);
    if (d < OUT_DIST + BALL_R) {
      t.player.alive = false;
      t.banner = "THE BALL GOT YOU";
      t.bannerSub = "below the waist — you're out";
      t.bannerAt = t.time;
      sfx.fault();
      t.shake = 0.8;
      endRound(t);
      return;
    }
  }

  // Bots out?
  for (const bot of t.bots) {
    if (!bot.alive) continue;
    if (t.ball.lastHitter === bot.idx && t.ball.lastHitter !== null) continue;
    const d = Math.hypot(b.x - bot.pos.x, b.z - bot.pos.z);
    if (d < OUT_DIST + BALL_R) {
      bot.alive = false;
      t.banner = `${bot.def.name} IS OUT!`;
      const left = t.bots.filter((x) => x.alive).length;
      t.bannerSub = left === 1 ? "one bot left" : `${left} bots left`;
      t.bannerAt = t.time;
      sfx.cheer();
      if (left === 0) endRound(t);
      return;
    }
  }
}

function endRound(t: GagaState) {
  if (t.phase === "over") return;
  t.phase = "over";
  const botsLeft = t.bots.filter((b) => b.alive).length;
  if (t.player.alive) {
    t.winner = 0;
    t.banner = botsLeft === 0 ? "LAST KID STANDING!" : "YOU SURVIVED THE PIT";
    t.bannerSub = "gaga champion of the yard";
  } else {
    t.winner = 1;
    t.banner = "THE BOTS RULE THE PIT";
    t.bannerSub = "better luck next round";
  }
  t.bannerAt = t.time;
}
