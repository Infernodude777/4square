// ─────────────────────────────────────────────────────────────
//  DODGEBALL — 1 vs 3 on the recess court
//
//  You vs three bots on a marked blacktop court. One ball. The
//  team holding it attacks; the other dodges.
//
//  YOU
//    • Walk with WASD (your half), aim with the mouse reticle.
//    • Click to throw the ball at the reticle.
//    • Click while a thrown ball is closing on you to CATCH it —
//      a catch sends the thrower to the bench.
//
//  THE BOTS
//    • They chase the loose ball, wind up (red telegraph!) and
//      throw at where you're going to be. Dodge, catch, or duck.
//    • Hit a bot and it's out. Get hit and you're out.
//
//  First to eliminate the whole other team wins. Classic recess.
//
//  OUTCOME IS LIVE — the ball really flies, really bounces, and
//  really hits. No pre-decided results here.
// ─────────────────────────────────────────────────────────────

import * as THREE from "three";
import { sfx, catchThud } from "./audio";
import { botReactionFactor } from "./settings";

// ── Court geometry (local; the scene offsets everything) ─────
export const COURT_W = 5.6;          // half width
export const COURT_LEN = 6.4;        // half length (z ±)
export const CENTER_Z = 0;
export const BALL_R = 0.13;
export const GRAV = 15;
export const HIT_RANGE = 0.52;       // ball → body hit distance
export const CATCH_RANGE = 1.5;      // player catch radius
export const WIN_BOTS = 3;

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// ── Bot roster ───────────────────────────────────────────────
export interface DBotDef {
  id: string;
  name: string;
  colour: string;
  jersey: string;
  accent: string;
  skin: string;
  speed: number;
  dodge: number;     // 0..1 how good at sidestepping
  throwSkill: number;
  aggression: number; // how often they throw vs retreat
}
export const DBOTS: DBotDef[] = [
  { id: "rex",    name: "REX",    colour: "#e2483d", jersey: "#e2483d", accent: "#ffd23e", skin: "#c7d0dc", speed: 4.7, dodge: 0.72, throwSkill: 0.82, aggression: 0.9 },
  { id: "ziggy",  name: "ZIGGY",  colour: "#ff8a3c", jersey: "#ff8a3c", accent: "#fff0d0", skin: "#c7d0dc", speed: 5.1, dodge: 0.8,  throwSkill: 0.7,  aggression: 0.7 },
  { id: "alan",   name: "ALAN",   colour: "#b58cff", jersey: "#b58cff", accent: "#ffe9a8", skin: "#b8bfc7", speed: 4.0, dodge: 0.58, throwSkill: 0.88, aggression: 0.55 },
];

// ── State ────────────────────────────────────────────────────
export type DPhase = "countdown" | "play" | "point" | "over";

export interface DBot {
  def: DBotDef;
  idx: number;
  pos: THREE.Vector3;
  home: THREE.Vector3;
  y: number;
  vy: number;
  facing: number;
  moving: boolean;
  swing: number;
  alive: boolean;
  hasBall: boolean;
  state: "idle" | "chase" | "pickup" | "windup" | "retreat";
  timer: number;
  target: THREE.Vector3;
}

export interface DodgeState {
  time: number;
  phase: DPhase;
  countdown: number;
  pointTimer: number;
  shake: number;
  banner: string;
  bannerSub: string;
  bannerAt: number;

  player: {
    pos: THREE.Vector3;
    y: number;
    vy: number;
    facing: number;
    moving: boolean;
    swing: number;
    alive: boolean;
    hasBall: boolean;
    catchWindow: number;  // seconds since last catch click
    /** world-space aim reticle (set by the director from the mouse) */
    aimX: number;
    aimZ: number;
  };

  bots: DBot[];

  ball: {
    pos: THREE.Vector3;
    vel: THREE.Vector3;
    state: "held" | "flight" | "ground";
    holder: "player" | number | null;
    lastHitter: "player" | number | null;
  };

  winner: 0 | 1 | null;   // 0 = player
  endTimer: number;
}

export function createDodgeState(): DodgeState {
  const bots: DBot[] = DBOTS.map((def, idx) => {
    const spawn = new THREE.Vector3((idx - 1) * 1.7, 0, 2.2 + (idx % 2) * 1.4);
    return {
      def, idx,
      pos: spawn.clone(),
      home: spawn.clone(),
      y: 0, vy: 0, facing: Math.PI, moving: false, swing: 9,
      alive: true,
      hasBall: false,
      state: "idle",
      timer: 0,
      target: new THREE.Vector3(),
    };
  });
  return {
    time: 0,
    phase: "countdown",
    countdown: 3,
    pointTimer: 0,
    shake: 0,
    banner: "DODGEBALL",
    bannerSub: "hit all three bots to win",
    bannerAt: 0,
    player: {
      pos: new THREE.Vector3(0, 0, -2.6),
      y: 0, vy: 0, facing: 0, moving: false, swing: 9,
      alive: true, hasBall: false, catchWindow: -9,
      aimX: 0, aimZ: -1,
    },
    bots,
    ball: {
      pos: new THREE.Vector3(0, BALL_R, -1.6),
      vel: new THREE.Vector3(),
      state: "held",
      holder: "player",
      lastHitter: null,
    },
    winner: null,
    endTimer: 0,
  };
}

// ── helpers ──────────────────────────────────────────────────
function giveBall(t: DodgeState, holder: "player" | number | null) {
  const b = t.ball;
  b.holder = holder;
  b.state = "held";
  b.vel.set(0, 0, 0);
  if (holder === "player") {
    t.player.hasBall = true;
  } else if (holder !== null) {
    t.bots[holder].hasBall = true;
  }
}

// ── the big step ─────────────────────────────────────────────
export function stepD(t: DodgeState, dt: number) {
  t.time += dt;
  t.shake = Math.max(0, t.shake - dt * 2);
  t.player.swing = Math.min(9, t.player.swing + dt);
  t.player.catchWindow = Math.min(2, t.player.catchWindow + dt);
  for (const b of t.bots) b.swing = Math.min(9, b.swing + dt);

  if (t.player.y > 0 || t.player.vy !== 0) {
    t.player.y += t.player.vy * dt;
    t.player.vy -= GRAV * dt;
    if (t.player.y <= 0) { t.player.y = 0; t.player.vy = 0; }
  }
  for (const b of t.bots) {
    if (b.y > 0 || b.vy !== 0) {
      b.y += b.vy * dt;
      b.vy -= GRAV * dt;
      if (b.y <= 0) { b.y = 0; b.vy = 0; }
    }
  }

  switch (t.phase) {
    case "countdown":
      t.countdown -= dt;
      if (t.countdown <= 0) {
        t.phase = "play";
        giveBall(t, "player");
        t.banner = "YOUR BALL — THROW IT!";
        t.bannerSub = "aim with the mouse, click to throw";
        t.bannerAt = t.time;
      }
      return;
    case "play":
      stepBall(t, dt);
      stepBots(t, dt);
      checkHits(t);
      return;
    case "point":
      t.pointTimer -= dt;
      if (t.pointTimer <= 0) {
        if (t.winner !== null) return;
        t.phase = "play";
      }
      return;
    case "over":
      return;
  }
}

// ── ball ─────────────────────────────────────────────────────
function stepBall(t: DodgeState, dt: number) {
  const b = t.ball;
  if (b.state === "held") {
    if (b.holder === "player") {
      b.pos.set(t.player.pos.x, 1.15, t.player.pos.z);
    } else if (b.holder !== null) {
      const bot = t.bots[b.holder];
      b.pos.set(bot.pos.x, 1.15, bot.pos.z);
    }
    return;
  }
  const v = b.vel;
  v.y -= GRAV * dt;
  b.pos.addScaledVector(v, dt);

  if (b.pos.y <= BALL_R && v.y < 0) {
    b.pos.y = BALL_R;
    if (v.y < -2.2) {
      v.y *= -0.55;
      v.x *= 0.8;
      v.z *= 0.8;
      sfx.bounce(3);
    } else {
      v.y = 0;
      b.state = "ground";
      sfx.bounce(1);
    }
  }
  if (b.state === "ground") {
    const f = Math.max(0, 1 - 1.6 * dt);
    v.x *= f;
    v.z *= f;
  }

  // court walls
  b.pos.x = clamp(b.pos.x, -COURT_W + BALL_R, COURT_W - BALL_R);
  if (Math.abs(b.pos.z) > COURT_LEN - BALL_R) {
    b.pos.z = Math.sign(b.pos.z) * (COURT_LEN - BALL_R);
    v.z *= -0.5;
  }
}

/**
 * The player walks over and scoops up a loose ball. Called by the
 * director each frame; returns true when the ball was picked up.
 */
export function playerPickup(t: DodgeState): boolean {
  if (t.phase !== "play" || !t.player.alive || t.player.hasBall) return false;
  const b = t.ball;
  if (b.state !== "ground" && !(b.state === "held" && b.holder === null)) return false;
  const d = Math.hypot(b.pos.x - t.player.pos.x, b.pos.z - t.player.pos.z);
  if (d > 0.75) return false;
  giveBall(t, "player");
  b.pos.set(t.player.pos.x, 1.15, t.player.pos.z);
  sfx.ui();
  return true;
}

// ── bots ─────────────────────────────────────────────────────
function stepBots(t: DodgeState, dt: number) {
  for (const bot of t.bots) {
    if (!bot.alive) {
      bot.facing = Math.atan2(-bot.pos.x, -bot.pos.z);
      continue;
    }
    const dx = bot.target.x - bot.pos.x;
    const dz = bot.target.z - bot.pos.z;
    const d = Math.hypot(dx, dz);

    switch (bot.state) {
      case "idle":
        bot.pos.lerp(bot.home, 1 - Math.exp(-dt * 3));
        bot.moving = d > 0.15;
        bot.facing = Math.atan2(-bot.pos.x, -(bot.pos.z - t.player.pos.z));
        // Loose ball nearby → chase it
        if (t.ball.state === "ground") {
          const bd = Math.hypot(t.ball.pos.x - bot.pos.x, t.ball.pos.z - bot.pos.z);
          if (bd < 6.5) {
            bot.state = "chase";
            bot.target.set(t.ball.pos.x, 0, t.ball.pos.z);
          }
        }
        break;

      case "chase":
        bot.moving = d > 0.12;
        if (d > 0.12) {
          const step = Math.min(d, bot.def.speed * dt);
          bot.pos.x += (dx / d) * step;
          bot.pos.z += (dz / d) * step;
          bot.facing = Math.atan2(dx, dz);
        } else {
          bot.state = "pickup";
          bot.timer = 0.45;
        }
        break;

      case "pickup":
        bot.moving = false;
        bot.timer -= dt;
        if (bot.timer <= 0) {
          bot.hasBall = true;
          t.ball.pos.set(bot.pos.x, 1.15, bot.pos.z);
          t.ball.holder = bot.idx;
          t.ball.state = "held";
          bot.state = "windup";
          bot.timer = 0.5 + Math.random() * 0.5;
        }
        break;

      case "windup": {
        bot.moving = false;
        bot.timer -= dt;
        bot.facing = Math.atan2(t.player.pos.x - bot.pos.x, t.player.pos.z - bot.pos.z);
        if (bot.timer <= 0) {
          botThrow(t, bot);
          bot.state = "retreat";
          bot.timer = 0.6;
        }
        break;
      }

      case "retreat":
        bot.moving = d > 0.12;
        if (d > 0.12) {
          const step = Math.min(d, bot.def.speed * 0.8 * dt);
          bot.pos.x += (dx / d) * step;
          bot.pos.z += (dz / d) * step;
        }
        bot.timer -= dt;
        if (bot.timer <= 0) bot.state = "idle";
        break;
    }

    // Keep bots inside their half (+ a little)
    bot.pos.x = clamp(bot.pos.x, -COURT_W + 0.5, COURT_W - 0.5);
    bot.pos.z = clamp(bot.pos.z, 0.7, COURT_LEN - 0.5);

    // Dodge! An incoming ball aimed at this bot → sidestep.
    if (t.ball.state === "flight" && t.ball.lastHitter !== bot.idx) {
      const b = t.ball.pos;
      const toBotX = bot.pos.x - b.x;
      const toBotZ = bot.pos.z - b.z;
      const closing = Math.hypot(toBotX, toBotZ) < 2.6 &&
        (toBotX * t.ball.vel.x + toBotZ * t.ball.vel.z) < 0;
      if (closing && Math.random() < bot.def.dodge * (1 / botReactionFactor()) * 0.35 * dt * 60) {
        const side = Math.random() < 0.5 ? 1 : -1;
        bot.target.set(bot.pos.x + side * 1.6, 0, bot.pos.z + (Math.random() < 0.5 ? 0.8 : -0.8));
        bot.state = "retreat";
        bot.timer = 0.4;
      }
    }
  }
}

function botThrow(t: DodgeState, bot: DBot) {
  const b = t.ball;
  bot.hasBall = false;
  b.lastHitter = bot.idx;
  b.holder = null;
  b.state = "flight";
  b.pos.set(bot.pos.x, 1.25, bot.pos.z);

  // Lead the player slightly, capped so it's still dodgeable.
  const p = t.player.pos;
  const dist = Math.hypot(p.x - b.pos.x, p.z - b.pos.z);
  const lead = clamp(dist * 0.08, 0, 1.0);
  const tx = p.x + (t.player.moving ? lead : 0);
  const tz = p.z;
  const T = clamp(dist / (5.2 + bot.def.throwSkill * 2.2), 0.7, 1.7);
  const vx = (tx - b.pos.x) / T;
  const vz = (tz - b.pos.z) / T;
  const vy = (BALL_R - b.pos.y) / T + 0.5 * GRAV * T + 0.6;
  b.vel.set(vx, vy, vz);
  bot.swing = 0;
  sfx.kick(0.7);
  sfx.ui(); // telegraph already flashed in the HUD
}

// ── player actions ───────────────────────────────────────────
export function playerThrow(t: DodgeState, aim: THREE.Vector3) {
  if (t.phase !== "play" || !t.player.alive) return false;
  if (!t.player.hasBall || t.ball.holder !== "player") return false;
  const b = t.ball;
  t.player.hasBall = false;
  b.lastHitter = "player";
  b.holder = null;
  b.state = "flight";
  b.pos.set(t.player.pos.x, 1.25, t.player.pos.z);
  const dist = Math.hypot(aim.x - b.pos.x, aim.z - b.pos.z);
  const T = clamp(dist / 9.5, 0.4, 1.4);
  b.vel.set((aim.x - b.pos.x) / T, (BALL_R - b.pos.y) / T + 0.5 * GRAV * T + 0.7, (aim.z - b.pos.z) / T);
  t.player.swing = 0;
  sfx.kick(0.9);
  return true;
}

/** Click to catch an incoming ball. Returns true if a catch happened. */
export function playerCatch(t: DodgeState): boolean {
  t.player.catchWindow = 0;
  if (t.phase !== "play" || !t.player.alive) return false;
  const b = t.ball;
  if (b.state !== "flight" || b.lastHitter === "player") return false;
  const d = Math.hypot(b.pos.x - t.player.pos.x, b.pos.z - t.player.pos.z);
  if (d > CATCH_RANGE) return false;
  // Must be moving toward the player.
  const closing = (b.pos.x - t.player.pos.x) * b.vel.x + (b.pos.z - t.player.pos.z) * b.vel.z < 0;
  if (!closing) return false;

  // Catch! The thrower is out.
  const thrower = b.lastHitter;
  b.vel.set(0, 0, 0);
  b.pos.set(t.player.pos.x, 1.15, t.player.pos.z);
  giveBall(t, "player");
  if (thrower !== null && t.bots[thrower].alive) {
    eliminateBot(t, thrower, "CAUGHT OUT!");
  }
  catchThud();
  useGame_addCatch();
  t.shake = 0.3;
  return true;
}

// ── eliminations & flow ──────────────────────────────────────
function checkHits(t: DodgeState) {
  if (t.phase !== "play") return;
  const b = t.ball;
  if (b.state !== "flight") return;

  // hit a bot
  for (const bot of t.bots) {
    if (!bot.alive) continue;
    const d = Math.hypot(b.pos.x - bot.pos.x, b.pos.z - bot.pos.z);
    if (d < HIT_RANGE + BALL_R && b.pos.y < bot.y + 1.5) {
      if (b.lastHitter === "player") {
        eliminateBot(t, bot.idx, "HIT!");
        b.vel.set(0, 0, 0);
        b.state = "ground";
        t.shake = 0.6;
        sfx.hit(1);
      } else if (b.lastHitter !== bot.idx) {
        // bot hit by another bot's throw — that thrower is out instead
        eliminateBot(t, b.lastHitter as number, "HIT A TEAMMATE!");
        b.vel.set(0, 0, 0);
        b.state = "ground";
        sfx.fault();
      }
      return;
    }
  }

  // hit the player
  if (t.player.alive) {
    const d = Math.hypot(b.pos.x - t.player.pos.x, b.pos.z - t.player.pos.z);
    if (d < HIT_RANGE + BALL_R && b.pos.y < t.player.y + 1.5 && b.lastHitter !== "player") {
      // Catching window: clicked just before impact → catch instead.
      if (t.player.catchWindow < 0.28) {
        const thrower = b.lastHitter;
        b.vel.set(0, 0, 0);
        giveBall(t, "player");
        if (thrower !== null && t.bots[thrower].alive) {
          eliminateBot(t, thrower, "CAUGHT OUT!");
        }
        catchThud();
        useGame_addCatch();
        return;
      }
      t.player.alive = false;
      t.winner = 1;
      t.phase = "over";
      t.banner = "OUCH — YOU'RE OUT!";
      t.bannerSub = "the bots take the court";
      t.bannerAt = t.time;
      sfx.fault();
      t.shake = 0.9;
    }
  }
}

// tiny indirection so this pure module never imports the store at
// module scope (avoids circular imports at load time).
import { useGame } from "./store";
function useGame_addCatch() {
  useGame.getState().addCatch();
}

function eliminateBot(t: DodgeState, idx: number, why: string) {
  const bot = t.bots[idx];
  bot.alive = false;
  bot.hasBall = false;
  bot.state = "idle";
  bot.pos.x = clamp(bot.pos.x, -COURT_W + 0.6, COURT_W - 0.6);
  bot.pos.z = COURT_LEN - 0.6;
  t.banner = `${bot.def.name} ${why}`;
  t.bannerSub = `${t.bots.filter((b) => b.alive).length} bot${t.bots.filter((b) => b.alive).length === 1 ? "" : "s"} left`;
  t.bannerAt = t.time;
  sfx.cheer();

  if (t.bots.every((b) => !b.alive)) {
    t.winner = 0;
    t.phase = "over";
    t.banner = "CLEAN SWEEP!";
    t.bannerSub = "you cleared the court";
    t.bannerAt = t.time;
  }
}
