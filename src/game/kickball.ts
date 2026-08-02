// ─────────────────────────────────────────────────────────────
//  KICKBALL — recess kickball, simplified to a single batter
//
//  You are the lone batter against four bot fielders. A pitcher
//  bot rolls the ball underhand toward home plate. Click to kick
//  the instant the ball reaches the plate — the closer to the
//  plate, the better your contact quality.
//
//  CONTACT QUALITY → OUTCOME (decided at contact, dramatised live)
//    q < 0.20              whiff (strike)
//    q < 0.42              foul ball (strike)
//    bunt (right click)    good bunt = single · else out at first
//    0.42 … 0.66           grounder (often out at first)
//    0.66 … 0.85           line drive (double, sometimes caught)
//    0.85 … 0.97           deep fly (triple, sometimes caught)
//    q ≥ 0.97              HOME RUN — over the fence!
//
//  After contact you sprint around the bases automatically while
//  the nearest fielder chases down the ball, scoops it up and
//  throws to the base ahead of you. The outcome was decided at
//  contact; the chase is the dramatisation.
//
//  Three outs end your half of the inning. The bot team "bats"
//  (simulated) in the bottom half. Three innings, most runs win.
// ─────────────────────────────────────────────────────────────

import * as THREE from "three";
import { sfx } from "./audio";
import { botInningRuns, pitchSpeed } from "./settings";
import { checkBadges } from "./achievements";

// ── Field geometry ───────────────────────────────────────────
export const K_BALL_R     = 0.17;
export const BASE_DIST    = 4.0;     // home→first (and each leg)
export const MOUND_Z      = 1.35;    // pitcher mound z
export const HOME_Z       = 4.0;     // home plate z
export const OUT_BOUNDS   = 11.5;    // ball past this is out of play

/** World-space origin of the field (the open centre of the schoolyard). */
export const KICK_ORIGIN: [number, number, number] = [2, 0, 0];

/** World-space position of each base (0=home, 1=first, 2=second, 3=third). */
export const BASE_POS: [number, number][] = [
  [0, HOME_Z],
  [BASE_DIST, HOME_Z - BASE_DIST],
  [0, HOME_Z - 2 * BASE_DIST],
  [-BASE_DIST, HOME_Z - BASE_DIST],
];

export const GRAV = 13;

// ── Fielders ─────────────────────────────────────────────────
export interface KFielder {
  id: string;
  pos: THREE.Vector3;
  home: THREE.Vector3;
  state: "idle" | "chase" | "pickup" | "throw";
  hasBall: boolean;
  timer: number;
  target: THREE.Vector3;
}

const FIELDER_HOMES: [number, number][] = [
  [0, MOUND_Z],                                  // pitcher (ada)
  [BASE_DIST / 2, HOME_Z - BASE_DIST - 2.2],     // shortstop (grace)
  [BASE_DIST * 1.2, HOME_Z - BASE_DIST * 2.2],   // right field (alan)
  [-BASE_DIST * 1.2, HOME_Z - BASE_DIST * 2.2],  // left field (turing)
];

// ── State ────────────────────────────────────────────────────
export type KPhase = "countdown" | "pitch" | "live" | "point" | "inning" | "over";

export interface KickState {
  phase: KPhase;
  time: number;
  countdown: number;
  inning: number;
  outs: number;
  strikes: number;
  runsYou: number;
  runsBot: number;
  pointTimer: number;
  shake: number;
  /** seconds spent in the current live phase — safety timeout against hangs */
  liveTimer: number;
  /** set when a fielder's throw completes at a base (out plays resolve then) */
  throwDone: boolean;

  banner: string;
  bannerSub: string;
  bannerAt: number;

  ball: {
    pos: THREE.Vector3;
    vel: THREE.Vector3;
    state: "held" | "roll" | "flight" | "ground" | "caught" | "thrown" | "foul" | "gone";
  };

  kickQueued: "power" | "soft" | null;
  quality: number;
  outcome: { kind: string; bases: number; out: boolean; msg: string } | null;

  runner: {
    active: boolean;
    base: number;
    target: number;   // 1..4 (4 = around home again)
    t: number;        // 0..1 progress between base and target
    dur: number;
  };

  fielders: KFielder[];
  throwBall: { from: THREE.Vector3; to: THREE.Vector3; t: number; dur: number } | null;

  winner: "you" | "bot" | null;
  overAt: number;
}

export function createKickState(): KickState {
  return {
    phase: "countdown",
    time: 0,
    countdown: 3,
    inning: 0,
    outs: 0,
    strikes: 0,
    runsYou: 0,
    runsBot: 0,
    pointTimer: 0,
    shake: 0,
    liveTimer: 0,
    throwDone: false,
    banner: "KICKBALL",
    bannerSub: "click when the ball reaches the plate",
    bannerAt: 0,

    ball: {
      pos: new THREE.Vector3(0, K_BALL_R, MOUND_Z),
      vel: new THREE.Vector3(),
      state: "held",
    },

    kickQueued: null,
    quality: 0,
    outcome: null,

    runner: { active: false, base: 0, target: 0, t: 0, dur: 1 },

    fielders: ["ada", "grace", "alan", "turing"].map((id, i) => ({
      id,
      pos: new THREE.Vector3(FIELDER_HOMES[i][0], 0, FIELDER_HOMES[i][1]),
      home: new THREE.Vector3(FIELDER_HOMES[i][0], 0, FIELDER_HOMES[i][1]),
      state: "idle",
      hasBall: false,
      timer: 0,
      target: new THREE.Vector3(),
    })),

    throwBall: null,
    winner: null,
    overAt: 0,
  };
}

// ── helpers ──────────────────────────────────────────────────
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function baseVector(i: number, out: THREE.Vector3): THREE.Vector3 {
  return out.set(BASE_POS[i % 4][0], 0, BASE_POS[i % 4][1]);
}

function pitchBall(k: KickState) {
  k.ball.pos.set(0, K_BALL_R, MOUND_Z);
  k.ball.vel.set(0, 0, pitchSpeed());
  k.ball.state = "roll";
  k.kickQueued = null;
}

function addStrike(k: KickState) {
  k.strikes += 1;
  k.outcome = {
    kind: "strike",
    bases: 0,
    out: k.strikes >= 3,
    msg: k.strikes >= 3 ? "STRIKE THREE!" : "STRIKE",
  };
  if (k.strikes >= 3) recordOut(k);
}

// ── The big step ─────────────────────────────────────────────
export function stepKick(k: KickState, dt: number) {
  k.time += dt;
  k.shake = Math.max(0, k.shake - dt * 2);

  switch (k.phase) {
    case "countdown": {
      k.countdown -= dt;
      if (k.countdown <= 0) {
        k.phase = "pitch";
        pitchBall(k);
      }
      return;
    }

    case "pitch": {
      const b = k.ball;
      b.pos.z += b.vel.z * dt;
      b.pos.x = Math.sin(k.time * 2.4) * 0.12;
      b.pos.y = K_BALL_R;

      if (k.kickQueued) {
        const btn = k.kickQueued;
        k.kickQueued = null;
        const dist = Math.abs(b.pos.z - HOME_Z);
        const qRaw = btn === "soft" ? 0.55 : clamp(1 - dist / 1.1, 0.05, 1);
        k.quality = qRaw;
        resolveContact(k, btn === "soft");
        return;
      }

      if (b.pos.z > HOME_Z + 0.5) {
        addStrike(k);
        if (k.phase === "pitch") {
          k.phase = "point";
          k.pointTimer = 1.4;
          sfx.fault();
        }
      }
      return;
    }

    case "live": {
      k.liveTimer += dt;
      stepBall(k, dt);
      stepFielders(k, dt);
      stepRunner(k, dt);
      stepThrow(k, dt);
      checkLiveResolution(k);
      // Belt-and-braces: no live play may outlast ~9 s, ever.
      if (k.phase === "live" && k.liveTimer > 9) {
        if (k.outcome?.out) { recordOut(k); toPoint(k); }
        else if (k.runner.active) { advanceBases(k); }
        else { k.phase = "point"; k.pointTimer = 1.5; }
      }
      return;
    }

    case "point": {
      k.pointTimer -= dt;
      if (k.pointTimer <= 0) nextPlateAppearance(k);
      return;
    }

    case "inning": {
      k.pointTimer -= dt;
      if (k.pointTimer <= 0) {
        if (k.inning >= 2 && k.winner !== null) {
          k.phase = "over";
          k.overAt = k.time;
        } else {
          k.inning += 1;
          k.outs = 0;
          k.strikes = 0;
          k.phase = "pitch";
          k.banner = `INNING ${k.inning + 1}`;
          k.bannerSub = "you're up — step to the plate";
          k.bannerAt = k.time;
          pitchBall(k);
        }
      }
      return;
    }

    case "over":
      return;
  }
}

// ── Contact resolution ───────────────────────────────────────
/** Enter the live phase, starting the fielding safety clock fresh. */
function enterLive(k: KickState) {
  k.phase = "live";
  k.liveTimer = 0;
  k.throwDone = false;
}

function resolveContact(k: KickState, bunt: boolean) {
  const q = k.quality;
  const r = Math.random();

  // Whiff / foul
  if (!bunt && q < 0.2) {
    addStrike(k);
    if (k.phase === "pitch") {
      k.phase = "point";
      k.pointTimer = 1.0;
    }
    sfx.fault();
    return;
  }
  if (!bunt && q < 0.42) {
    if (k.strikes < 2) k.strikes += 1;
    k.outcome = { kind: "foul", bases: 0, out: false, msg: "FOUL BALL" };
    k.phase = "point";
    k.pointTimer = 1.0;
    sfx.fault();
    return;
  }

  sfx.kick(q);
  k.ball.state = "flight";

  // ── Bunt: deterministic — good contact = single, else out at first ──
  if (bunt) {
    if (q >= 0.8) {
      k.outcome = { kind: "bunt", bases: 1, out: false, msg: "BUNT SINGLE!" };
      launchToLanding(k, new THREE.Vector3((Math.random() - 0.5) * 1.2, 0, HOME_Z + 1.8));
      enterLive(k);
      startRunner(k, 1);
    } else {
      k.outcome = { kind: "bunt", bases: 0, out: true, msg: "OUT AT FIRST" };
      launchToLanding(k, new THREE.Vector3((Math.random() - 0.5) * 1.4, 0, HOME_Z + 0.8));
      enterLive(k);
      startRunner(k, 0);
      sfx.fault();
    }
    return;
  }

  // ── Home run ──────────────────────────────────────────────
  if (q >= 0.97) {
    k.outcome = { kind: "homerun", bases: 4, out: false, msg: "HOME RUN!" };
    k.ball.vel.set((Math.random() - 0.5) * 1.5, 7.5, -17);
    k.ball.state = "flight";
    enterLive(k);
    startRunner(k, 4);
    checkBadges({ kind: "homerun" });
    sfx.homerun();
    k.shake = 0.8;
    return;
  }

  // ── Hits: pick the type + decide safe/out at contact ──────
  let kind = "grounder";
  let bases = 1;
  if (q < 0.66) {
    kind = "grounder";
    if (r < 0.32) { kind = "groundout"; bases = 0; }
  } else if (q < 0.85) {
    kind = "line";
    bases = 2;
    if (r < 0.28) { kind = "pop"; bases = 0; }
  } else {
    kind = "deep";
    bases = 3;
    if (r < 0.22) { kind = "pop"; bases = 0; }
  }

  const depth = bases === 0
    ? HOME_Z - 3 - Math.random() * 3     // grounder up the middle (z −2…1)
    : bases === 1 ? HOME_Z - 5.5          // soft single past the mound
    : bases === 2 ? HOME_Z - 7            // line drive into the gap
    : HOME_Z - 10.5;                       // deep fly to the fence
  const spread = kind === "pop" ? 4.0 : 2.6;
  const land = new THREE.Vector3((Math.random() - 0.5) * spread, 0, depth);

  const out = bases === 0;
  k.outcome = {
    kind,
    bases,
    out,
    msg: out ? (kind === "groundout" ? "OUT AT FIRST" : "CAUGHT!") : kind === "pop" ? "POP FLY" : kind === "grounder" ? "GROUNDER" : kind === "line" ? "LINE DRIVE" : "DEEP FLY",
  };

  launchToLanding(k, land);
  if (out && kind === "pop") {
    k.ball.vel.y = 5.4 + Math.random() * 1.2; // high arc so a fielder can grab it
  }
  enterLive(k);
  startRunner(k, bases);
  if (out) sfx.fault();
  else sfx.cheer();
}

/** Solve a ballistic launch that lands on `land` after ~0.85 s. */
function launchToLanding(k: KickState, land: THREE.Vector3) {
  const p = k.ball.pos;
  const T = 0.85;
  const vx = (land.x - p.x) / T;
  const vz = (land.z - p.z) / T;
  const vy = (K_BALL_R - p.y) / T + 0.5 * GRAV * T;
  k.ball.vel.set(vx, vy, vz);
}

// ── Runner ───────────────────────────────────────────────────
function startRunner(k: KickState, bases: number) {
  const r = k.runner;
  r.active = bases > 0;
  r.base = 0;
  r.target = bases;
  r.t = 0;
  r.dur = bases > 0 ? (bases * BASE_DIST) / 3.6 : 0;
}

function stepRunner(k: KickState, dt: number) {
  const r = k.runner;
  if (!r.active) return;
  r.t += dt / Math.max(0.01, r.dur);
  if (r.t >= 1) r.t = 1;
}

// ── Fielders ─────────────────────────────────────────────────
function stepFielders(k: KickState, dt: number) {
  const b = k.ball;
  for (const f of k.fielders) {
    switch (f.state) {
      case "idle":
        f.pos.lerp(f.home, 1 - Math.exp(-dt * 4));
        break;

      case "chase": {
        const dx = f.target.x - f.pos.x;
        const dz = f.target.z - f.pos.z;
        const d = Math.hypot(dx, dz);
        if (d < 0.35) {
          f.state = "pickup";
          f.timer = 0.55;
        } else {
          const step = Math.min(d, 4.6 * dt);
          f.pos.x += (dx / d) * step;
          f.pos.z += (dz / d) * step;
        }
        break;
      }

      case "pickup":
        f.timer -= dt;
        if (f.timer <= 0) {
          f.hasBall = true;
          f.state = "throw";
          b.state = "held";
          b.pos.copy(f.pos);
          b.pos.y = 1.1;
          beginThrow(k, f);
        }
        break;

      case "throw":
        f.pos.lerp(f.home, 1 - Math.exp(-dt * 3));
        break;
    }
  }
}

/** The nearest idle fielder runs for the loose ball. */
function chaseBall(k: KickState) {
  const b = k.ball;
  let best: KFielder | null = null;
  let bestD = Infinity;
  for (const f of k.fielders) {
    if (f.state !== "idle") continue;
    const d = Math.hypot(b.pos.x - f.pos.x, b.pos.z - f.pos.z);
    if (d < bestD) { bestD = d; best = f; }
  }
  if (best) {
    best.state = "chase";
    best.target.set(b.pos.x, 0, b.pos.z);
  }
}

/** Send an idle fielder under a falling fly ball (visual only). */
function driftUnderFly(k: KickState) {
  const b = k.ball;
  let best: KFielder | null = null;
  let bestD = Infinity;
  for (const f of k.fielders) {
    if (f.state !== "idle") continue;
    const d = Math.hypot(b.pos.x - f.pos.x, b.pos.z - f.pos.z);
    if (d < bestD) { bestD = d; best = f; }
  }
  if (best) {
    best.state = "chase";
    best.target.set(b.pos.x, 0, b.pos.z);
  }
}

function beginThrow(k: KickState, f: KFielder) {
  const r = k.runner;
  const toBase = r.active ? Math.max(1, Math.min(3, r.target)) : 1;
  const target = baseVector(toBase, new THREE.Vector3());
  const from = f.pos.clone();
  const dist = from.distanceTo(target);
  k.throwBall = { from, to: target, t: 0, dur: dist / 9.5 };
  f.state = "throw";
}

function stepThrow(k: KickState, dt: number) {
  const th = k.throwBall;
  if (!th) return;
  th.t += dt;
  const p = k.ball;
  if (th.t < th.dur) {
    const t = th.t / th.dur;
    p.pos.lerpVectors(th.from, th.to, t);
    p.pos.y = Math.sin(t * Math.PI) * 2.4 + 0.3;
    p.state = "thrown";
  } else {
    p.pos.copy(th.to);
    p.pos.y = K_BALL_R;
    p.state = "held";
    k.throwBall = null;
    k.throwDone = true;
  }
}

function stepBall(k: KickState, dt: number) {
  const b = k.ball;
  if (b.state !== "flight" && b.state !== "ground") return;

  b.vel.y -= GRAV * dt;
  b.pos.addScaledVector(b.vel, dt);
  b.vel.x *= Math.pow(0.995, dt * 60);
  b.vel.z *= Math.pow(0.995, dt * 60);

  // ground contact
  if (b.pos.y <= K_BALL_R && b.vel.y < 0) {
    b.pos.y = K_BALL_R;
    if (b.vel.y < -2.2) {
      b.vel.y *= -0.45;
      b.vel.x *= 0.82;
      b.vel.z *= 0.82;
      sfx.bounce(3);
    } else {
      b.vel.y = 0;
      b.state = "ground";
      sfx.bounce(1);
    }
  }

  // fly ball: drift the nearest idle fielder underneath (visual only)
  if (b.state === "flight" && b.vel.y < 0 && k.outcome?.out) {
    driftUnderFly(k);
  }

  // caught in flight — only for plays that are already outs
  if (b.state === "flight" && b.vel.y < 0 && k.outcome?.out) {
    for (const f of k.fielders) {
      if (f.state !== "idle" && f.state !== "chase") continue;
      const d = Math.hypot(b.pos.x - f.pos.x, b.pos.z - f.pos.z);
      if (d < 0.55 && b.pos.y < 2.1) {
        b.state = "caught";
        b.vel.set(0, 0, 0);
        k.outcome.msg = "CAUGHT!";
        sfx.fault();
        return;
      }
    }
  }

  // out of bounds → dead ball (homers, deep shanks)
  if (Math.abs(b.pos.x) > OUT_BOUNDS || b.pos.z < -OUT_BOUNDS || b.pos.z > OUT_BOUNDS) {
    b.state = "held";
    b.vel.set(0, 0, 0);
  }

  // settle + ask a fielder to retrieve
  if (b.state === "ground") {
    const speed = Math.hypot(b.vel.x, b.vel.z);
    if (speed < 0.4) {
      b.state = "held";
      chaseBall(k);
    }
  }
}

// ── Live resolution ──────────────────────────────────────────
function ballDead(k: KickState): boolean {
  const s = k.ball.state;
  return s === "held" || s === "thrown" || s === "caught" || s === "ground";
}

function checkLiveResolution(k: KickState) {
  const out = k.outcome;
  if (!out) return;
  const r = k.runner;

  // ── Safe plays: the runner finishes AND the ball is dead ──
  if (!out.out && r.active && r.t >= 1 && ballDead(k) && !k.throwBall) {
    advanceBases(k);
    return;
  }

  // ── Out plays: resolve once the fielding dramatisation completes ──
  // (caught in flight, a throw landing at the base, or the ball leaving play)
  if (out.out) {
    const caught = k.ball.state === "caught";
    const thrown = k.throwDone;
    const gone = Math.abs(k.ball.pos.x) > OUT_BOUNDS || Math.abs(k.ball.pos.z) > OUT_BOUNDS;
    if (caught || thrown || gone) {
      recordOut(k);
      toPoint(k);
    }
  }
}

function toPoint(k: KickState) {
  if (k.phase === "live") {
    k.phase = "point";
    k.pointTimer = 2.0;
  }
}

function advanceBases(k: KickState) {
  const r = k.runner;
  const target = r.target;
  k.strikes = 0;   // at-bat over (runner on base) → fresh count next batter
  if (target >= 4) {
    k.runsYou += 1;
    k.outcome = { kind: "homerun", bases: 4, out: false, msg: "RUN SCORED!" };
    k.banner = "RUN!";
    k.bannerSub = "you scored";
    k.bannerAt = k.time;
    sfx.cheer();
    checkBadges({ kind: "homerun" });
  } else {
    if (target === 3) checkBadges({ kind: "triple" });
    k.banner = k.outcome?.msg ?? "SAFE";
    k.bannerSub = "next batter up";
    k.bannerAt = k.time;
  }
  r.active = false;
  k.phase = "point";
  k.pointTimer = 2.0;
}

function recordOut(k: KickState) {
  k.outs += 1;
  k.strikes = 0;   // batter retired → next batter starts a fresh count
  k.banner = k.outcome?.msg ?? "OUT";
  k.bannerSub = k.outs >= 3 ? "BOT TEAM BATS" : "next batter";
  k.bannerAt = k.time;
  k.runner.active = false;
  k.ball.state = "held";

  if (k.outs >= 3) {
    const botRuns = botInningRuns();
    k.runsBot += botRuns;
    k.banner = "THIRD OUT";
    k.bannerSub = botRuns > 0
      ? `BOTS SCORE ${botRuns} RUN${botRuns > 1 ? "S" : ""}`
      : "BOTS GO DOWN IN ORDER";
    k.bannerAt = k.time;
    sfx.whistle();

    k.phase = "inning";
    k.pointTimer = 2.6;

    if (k.inning >= 2) {
      k.winner = k.runsYou > k.runsBot ? "you"
        : k.runsBot > k.runsYou ? "bot"
        : k.runsYou >= 2 ? "you" : "bot";
    }
  }
}

function nextPlateAppearance(k: KickState) {
  // NOTE: strikes deliberately persist across pitches within one at-bat so
  // whiffs/passed balls can actually accumulate to strike three. The count
  // is reset in recordOut/advanceBases when the at-bat ends.
  k.ball.pos.set(0, K_BALL_R, MOUND_Z);
  k.ball.vel.set(0, 0, 0);
  k.ball.state = "held";
  k.outcome = null;
  k.throwBall = null;
  k.throwDone = false;
  k.liveTimer = 0;
  k.fielders.forEach((f) => {
    f.state = "idle";
    f.hasBall = false;
  });
  if (k.phase === "point") {
    k.phase = "pitch";
    pitchBall(k);
  }
}

// ── Public helpers for the director/HUD ──────────────────────
export function kickTick(k: KickState, btn: "power" | "soft") {
  if (k.phase !== "pitch") return;
  k.kickQueued = btn;
}

export function ballInWindow(k: KickState): boolean {
  return k.phase === "pitch" &&
    k.ball.pos.z >= HOME_Z - 0.6 && k.ball.pos.z <= HOME_Z + 0.35;
}

export function plateProgress(k: KickState): number {
  const b = k.ball;
  return clamp(1 - Math.abs(b.pos.z - HOME_Z) / 1.1, 0, 1);
}
