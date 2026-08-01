// ─────────────────────────────────────────────────────────────
//  WALLBALL — real playground rules
//
//  LAYOUT
//    ONE wall. ONE court in front of it. BOTH players stand in the
//    SAME area facing the wall. There is no dividing line and no
//    "sides" — you share the space and take turns.
//
//  THE SEQUENCE (this is the whole game)
//    hit → ball bounces ONCE on the blacktop → ball hits the WALL
//        → ball rebounds → bounces ONCE on the blacktop
//        → the OTHER player hits it → repeat
//
//  SERVE
//    Server holds the ball and strikes it down so it bounces once
//    and carries into the wall. Play is live from that moment.
//
//  FOULS (opponent scores a point)
//    • Volley      — hitting before the ball bounces after the wall
//    • Double bounce — letting it bounce twice before you hit
//    • Short       — your hit reaches the wall without bouncing first
//    • Long        — your hit misses the wall / sails over the top
//    • Out         — ball lands outside the court lines
//    • Body        — the ball strikes a player
//    • Out of turn — hitting when it isn't your turn
//
//  SHOTS (real schoolyard names)
//    DRIVE        standing click        honest pace, safe
//    SCRAPIE      crouch + click        skids in low and flat off the wall
//    SMASH        jump, click falling   slams in short and rockets out
//    BABY         right click           dies right at the base of the wall
//    CROSS-COURT  crouch + right click  fires it to the far corner
// ─────────────────────────────────────────────────────────────

import * as THREE from "three";
import { sfx } from "./audio";

// ── Court geometry ───────────────────────────────────────────
export const WALL_Z       = 0;      // the wall face lives at z = 0
export const COURT_DEPTH  = 9.0;    // court runs from the wall out to +Z
export const COURT_HALF_W = 4.0;    // half width of the painted box
export const WALL_HEIGHT  = 5.2;    // clear this and you're out
export const GROUND_Y     = 0.13;
export const BALL_R       = 0.11;

// ── Ball physics ─────────────────────────────────────────────
// Floaty and generous: the ball hangs, travels deep off the bricks and
// is easy to read. Every shot steers with the mouse.
export const GRAVITY       = 11.5;   // lower = higher, longer flight
export const WALL_BOUNCE   = 0.90;   // carries much farther off the wall
export const GROUND_BOUNCE = 0.74;
export const AIR_DRAG      = 0.999;
export const HIT_REACH     = 2.1;

export const WIN_SCORE = 11;   // first to 11, classic recess length

/** Width of the aim-reticle ring on the blacktop. */
export const AIM_RING_R = 0.52;

// ── Shots ────────────────────────────────────────────────────
export type ShotKind =
  | "drive" | "scrapie" | "smash" | "baby" | "cross"
  | "roofer" | "moonball" | "bomb" | "slice";

export interface ShotDef {
  name:    string;
  idealY:  number;   // ball height where the timing is perfect
  window:  number;   // half-width of the timing window
  speed:   number;   // horizontal pace toward the wall
  /** where the mandatory pre-wall bounce lands, 0 = at your feet, 1 = at the wall */
  bounceAt: number;
  /** extra upward velocity on launch — how high the shot loops */
  arc:     number;
  /** upward boost added when it rebounds off the bricks */
  wallKick: number;
  /** how strongly the mouse steers this shot sideways */
  lateral: number;
  colour:  string;
  keys:    string;
  blurb:   string;
}

export const SHOTS: Record<ShotKind, ShotDef> = {
  // ── DRIVE — balanced workhorse. Medium arc, moderate rebound.
  drive: {
    name: "DRIVE", idealY: 0.90, window: 1.40, speed: 10.0, bounceAt: 0.50,
    arc: 1.6, wallKick: 2.0, lateral: 0.75,
    colour: "#f4c542", keys: "CLICK",
    blurb: "Balanced workhorse. Reliable, steerable with the mouse.",
  },
  // ── SCRAPIE — crouching laser. Stays low the whole way, very hard to read.
  scrapie: {
    name: "SCRAPIE", idealY: 0.40, window: 0.90, speed: 13.0, bounceAt: 0.62,
    arc: 0.20, wallKick: 0.60, lateral: 0.65,
    colour: "#38d6d0", keys: "C + CLICK",
    blurb: "Stays below knee height the whole way. Very hard to read.",
  },
  // ── SMASH — power dive. Bounces short in court and stays inside boundaries.
  smash: {
    name: "SMASH", idealY: 1.85, window: 1.15, speed: 12.8, bounceAt: 0.38,
    arc: -0.6, wallKick: 2.2, lateral: 0.55,
    colour: "#ff5a3c", keys: "SPACE → CLICK falling",
    blurb: "Dive from altitude — slams short in court and rockets back.",
  },
  // ── BABY — ultra-soft floater. Barely reaches the wall.
  baby: {
    name: "BABY", idealY: 1.10, window: 0.85, speed: 4.8, bounceAt: 0.82,
    arc: 1.2, wallKick: 0.40, lateral: 0.45,
    colour: "#b58cff", keys: "RIGHT CLICK",
    blurb: "Ultra-soft touch — drops dead at the base of the wall.",
  },
  // ── CROSS — hard angled drive. Full mouse steering, wide angle.
  cross: {
    name: "CROSS", idealY: 0.75, window: 1.00, speed: 10.5, bounceAt: 0.52,
    arc: 1.5, wallKick: 2.0, lateral: 1.35,
    colour: "#8ae06b", keys: "C + RIGHT CLICK",
    blurb: "Fires hard to a far corner. Angle it too much and it sails wide.",
  },
  // ── ROOFER — high-altitude strike. Slams high bricks and lands deep in court.
  roofer: {
    name: "ROOFER", idealY: 1.60, window: 1.10, speed: 10.0, bounceAt: 0.45,
    arc: 3.2, wallKick: 2.8, lateral: 0.70,
    colour: "#ffa63e", keys: "SPACE → CLICK rising",
    blurb: "High-altitude strike — slams high bricks and drops deep.",
  },
  // ── MOONBALL — floating lob. Lands deep in the court.
  moonball: {
    name: "MOONBALL", idealY: 1.45, window: 1.00, speed: 7.2, bounceAt: 0.50,
    arc: 4.2, wallKick: 3.2, lateral: 0.60,
    colour: "#7fc4ff", keys: "SPACE → RIGHT rising",
    blurb: "Enormous floating loop. Buys massive time and lands deep in court.",
  },
  // ── BOMB — fastest flat shot, zero arc, pure wall impact.
  bomb: {
    name: "BOMB", idealY: 1.00, window: 0.80, speed: 18.0, bounceAt: 0.44,
    arc: 0.30, wallKick: 3.0, lateral: 0.60,
    colour: "#ff3d6e", keys: "SHIFT + CLICK",
    blurb: "Absolutely fastest ball in the yard. Zero arc — all heat.",
  },
  // ── SLICE — low-speed cutaway angle. Mouse exaggerates angle sharply.
  slice: {
    name: "SLICE", idealY: 0.55, window: 0.85, speed: 9.5, bounceAt: 0.58,
    arc: 0.50, wallKick: 1.0, lateral: 1.70,
    colour: "#c8f04a", keys: "SHIFT + C + CLICK",
    blurb: "Knifes sideways off the bricks. High risk of going wide.",
  },
};

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Full input matrix:
 *   airborne + falling            → SMASH
 *   airborne + rising  + power    → ROOFER
 *   airborne + rising  + finesse  → MOONBALL
 *   crouch   + shift   + power    → SLICE
 *   crouch   + power              → SCRAPIE
 *   crouch   + finesse            → CROSS-COURT
 *   stand    + shift   + power    → BOMB
 *   stand    + power              → DRIVE
 *   stand    + finesse            → BABY HIT
 */
export function resolveShotKind(
  crouch: boolean, airborne: boolean, vy: number, finesse: boolean, shift = false,
): ShotKind {
  if (airborne) {
    if (vy < -0.25) return "smash";
    return finesse ? "moonball" : "roofer";
  }
  if (crouch) {
    if (finesse) return "cross";
    return shift ? "slice" : "scrapie";
  }
  if (finesse) return "baby";
  return shift ? "bomb" : "drive";
}

// ── State ────────────────────────────────────────────────────
export type Side = "player" | "op";

export type Foul =
  | "volley" | "double" | "short" | "long" | "out" | "wide" | "body" | "turn" | "dead";

export interface WallState {
  time:   number;
  phase:  "serve" | "live" | "point" | "won";

  /** whose turn it is to strike the ball */
  turn:   Side;
  /** who serves this rally */
  server: Side;
  /** true while the server still has the ball in hand */
  held:   boolean;

  playerScore: number;
  opScore:     number;

  ballPos: THREE.Vector3;
  ballVel: THREE.Vector3;

  /** 3-D world aim target on the court (where the mouse points). */
  aimPos: THREE.Vector3;

  // ── rally bookkeeping since the last strike
  bouncesBeforeWall: number;
  hitWall:           boolean;
  bouncesAfterWall:  number;
  lastHitter:        Side | null;
  rallyLength:       number;
  /** which shot produced the ball currently in flight */
  lastShot:          ShotKind;

  // ── player
  playerPos:    THREE.Vector3;
  playerY:      number;
  playerVY:     number;
  playerCrouch: boolean;
  playerFacing: number;
  playerSwing:  number;

  // ── bot
  opPos:    THREE.Vector3;
  opY:      number;
  opVY:     number;
  opCrouch: boolean;
  opFacing: number;
  opSwing:  number;
  opCooldown: number;
  opTarget: THREE.Vector3;
  opServeAt: number;

  // ── presentation
  shake:     number;
  banner:    string;
  bannerSub: string;
  bannerAt:  number;
  pointTimer: number;
}

export function createWState(): WallState {
  return {
    time: 0,
    phase: "serve",
    turn: "player",
    server: "player",
    held: true,

    playerScore: 0,
    opScore: 0,

    ballPos: new THREE.Vector3(0, 1.05, 4.5),
    ballVel: new THREE.Vector3(),
    aimPos:  new THREE.Vector3(0, 0, 4.0),

    bouncesBeforeWall: 0,
    hitWall: false,
    bouncesAfterWall: 0,
    lastHitter: null,
    rallyLength: 0,
    lastShot: "drive",

    playerPos: new THREE.Vector3(-1.1, 0, 4.6),
    playerY: 0,
    playerVY: 0,
    playerCrouch: false,
    playerFacing: 0,
    playerSwing: 9,

    opPos: new THREE.Vector3(1.4, 0, 5.2),
    opY: 0,
    opVY: 0,
    opCrouch: false,
    opFacing: 0,
    opSwing: 9,
    opCooldown: 0,
    opTarget: new THREE.Vector3(1.4, 0, 5.2),
    opServeAt: 0,

    shake: 0,
    banner: "",
    bannerSub: "",
    bannerAt: -99,
    pointTimer: 0,
  };
}

// ── helpers ──────────────────────────────────────────────────
export function other(s: Side): Side { return s === "player" ? "op" : "player"; }

export function inCourt(x: number, z: number): boolean {
  return Math.abs(x) <= COURT_HALF_W && z >= WALL_Z - 0.3 && z <= COURT_DEPTH;
}

/** Where will the ball next touch the blacktop? (ballistic, ignores wall) */
export function predictLanding(t: WallState): { x: number; z: number; time: number } {
  const { ballPos: p, ballVel: v } = t;
  const dy = p.y - GROUND_Y;
  const disc = v.y * v.y + 2 * GRAVITY * Math.max(0, dy);
  const tt = (v.y + Math.sqrt(Math.max(0, disc))) / GRAVITY;
  return { x: p.x + v.x * tt, z: p.z + v.z * tt, time: tt };
}

// ── Fouls ────────────────────────────────────────────────────
const FOUL_TEXT: Record<Foul, string> = {
  volley: "VOLLEY — let it bounce!",
  double: "DOUBLE BOUNCE",
  short:  "NO BOUNCE BEFORE THE WALL",
  long:   "MISSED THE WALL",
  out:    "OUT OF BOUNDS",
  wide:   "WIDE — OUTSIDE THE SIDELINE",
  body:   "BALL HIT A PLAYER",
  turn:   "NOT YOUR TURN",
  dead:   "BALL DIED",
};

export function callFoul(t: WallState, offender: Side, foul: Foul) {
  if (t.phase === "point" || t.phase === "won") return;
  t.phase = "point";
  t.pointTimer = 2.0;
  t.shake = 0.55;
  t.banner = FOUL_TEXT[foul];
  t.bannerSub = offender === "player" ? "ZIGGY scores" : "You score";
  t.bannerAt = t.time;

  if (offender === "player") t.opScore++;
  else t.playerScore++;

  // Winner of the point serves the next one.
  t.server = other(offender);
  sfx.fault();

  if (t.playerScore >= WIN_SCORE || t.opScore >= WIN_SCORE) {
    t.phase = "won";
  }
}

// ── Serve setup ──────────────────────────────────────────────
export function beginServe(t: WallState, who: Side) {
  t.server = who;
  t.turn   = who;
  t.held   = true;
  t.phase  = "serve";
  t.bouncesBeforeWall = 0;
  t.hitWall = false;
  t.bouncesAfterWall = 0;
  t.lastHitter = null;
  t.rallyLength = 0;
  t.ballVel.set(0, 0, 0);
  t.opServeAt = t.time + 1.5;

  const holder = who === "player" ? t.playerPos : t.opPos;
  t.ballPos.set(holder.x, 1.05, holder.z - 0.35);

  t.banner = who === "player" ? "YOUR SERVE" : "ZIGGY SERVES";
  t.bannerSub = who === "player" ? "click to strike it into the wall" : "";
  t.bannerAt = t.time;
}

// ── Striking the ball ────────────────────────────────────────
export interface HitResult {
  applied: boolean;
  quality: number;
  kind:    ShotKind;
  perfect: boolean;
  foul:    Foul | null;
}

/**
 * Launch the ball so it lands on the blacktop at `bounceAt` of the way to
 * the wall, then carries into the bricks. This guarantees the legal
 * ground-then-wall sequence for any well-struck ball.
 */
function launch(t: WallState, from: THREE.Vector3, def: ShotDef, quality: number) {
  const distToWall = Math.max(1.0, from.z - WALL_Z);
  const defaultZ = clamp(from.z - distToWall * def.bounceAt, WALL_Z + 0.55, from.z - 0.3);

  // The visible aim reticle is the desired pre-wall bounce point.
  // Timing controls accuracy: a great hit follows the circle closely,
  // while a bad hit falls back toward the shot's natural/default bounce.
  const desiredX = clamp(t.aimPos.x, -COURT_HALF_W + 0.45, COURT_HALF_W - 0.45);
  const desiredZ = clamp(t.aimPos.z, WALL_Z + 0.55, from.z - 0.3);
  const control = 0.35 + quality * 0.65;

  // Different shots listen to the aim circle differently. This keeps the
  // identity of each move while still giving real mouse control.
  const zControl =
    def.name === "SMASH" ? 0.35 :
    def.name === "BABY" ? 0.55 :
    def.name === "MOONBALL" ? 0.60 :
    def.name === "ROOFER" ? 0.55 :
    def.name === "BOMB" ? 0.70 :
    0.88;
  const xControl = Math.min(1.55, def.lateral) * control;
  const zAim = defaultZ + (desiredZ - defaultZ) * zControl * control;
  const xAim = from.x + (desiredX - from.x) * xControl;

  const spray = (Math.random() - 0.5) * (1 - quality) * 0.42;
  const targetX = clamp(xAim + spray, -COURT_HALF_W + 0.4, COURT_HALF_W - 0.4);
  const bounceZ = clamp(zAim, WALL_Z + 0.55, from.z - 0.3);

  const dx = targetX - from.x;
  const dz = bounceZ - from.z;
  const horiz = Math.hypot(dx, dz) || 0.001;
  const speed  = def.speed * (0.65 + 0.35 * quality);
  const T = Math.max(0.12, horiz / speed);

  // Arc boost — negative for smash (pressed downward), large for moonball.
  const arcBoost = def.arc * (0.70 + 0.30 * quality);
  const vy = (GROUND_Y - from.y) / T + 0.5 * GRAVITY * T + arcBoost;

  t.ballVel.set(dx / T, vy, dz / T);

  // Extra character by shot after solving the clean ballistic path.
  // Slices and crosses carry more side spin; moonballs and roofers float;
  // bombs and smashes add raw wall speed.
  if (def.name === "SLICE") t.ballVel.x += Math.sign(targetX - from.x || 1) * (1.4 + quality * 1.1);
  if (def.name === "CROSS") t.ballVel.x += Math.sign(targetX - from.x || 1) * (0.7 + quality * 0.7);
  if (def.name === "BOMB") t.ballVel.z *= 1.13;
  if (def.name === "SMASH") {
    t.ballVel.z *= 1.08;
    t.ballVel.y -= 1.0;
  }
  if (def.name === "MOONBALL") t.ballVel.y += 1.8 + quality * 1.2;
  if (def.name === "ROOFER") t.ballVel.y += 0.8 + quality * 0.9;

  t.ballPos.copy(from);
  t.lastShot = kindOf(def);
}

/** Reverse-lookup a ShotKind from its definition (small table, cheap). */
function kindOf(def: ShotDef): ShotKind {
  for (const k in SHOTS) {
    if (SHOTS[k as ShotKind] === def) return k as ShotKind;
  }
  return "drive";
}

export function tryHit(
  t:        WallState,
  hitter:   Side,
  handPos:  THREE.Vector3,
  crouch:   boolean,
  airborne: boolean,
  vy:       number,
  finesse:  boolean,
  /** 0 … 1 execution modifier so the AI can be imperfect */
  execution = 1,
  /** SHIFT held — unlocks BOMB / SLICE */
  shift = false,
): HitResult {
  const res: HitResult = {
    applied: false, quality: 0, kind: "drive", perfect: false, foul: null,
  };

  // ── Serving is a special case: the ball is in hand.
  if (t.phase === "serve" && t.held) {
    if (t.server !== hitter) { res.foul = "turn"; return res; }
    const kind = resolveShotKind(crouch, airborne, vy, finesse, shift);
    const def  = SHOTS[kind];
    res.kind = kind;
    res.quality = 0.8 * execution;
    const from = new THREE.Vector3(handPos.x, 1.0, handPos.z);
    launch(t, from, def, res.quality);
    t.held = false;
    t.phase = "live";
    t.turn = other(hitter);
    t.lastHitter = hitter;
    t.bouncesBeforeWall = 0;
    t.hitWall = false;
    t.bouncesAfterWall = 0;
    t.rallyLength = 1;
    res.applied = true;
    return res;
  }

  if (t.phase !== "live") return res;

  // ── Turn order
  if (t.turn !== hitter) { res.foul = "turn"; return res; }

  // ── Reach (generous, and extra lenient near the ground)
  const dBall = handPos.distanceTo(t.ballPos);
  if (dBall > HIT_REACH) return res;   // clean miss, no penalty

  // ── The bounce sequence must be respected
  if (!t.hitWall)                 { res.foul = "volley"; return res; }
  if (t.bouncesAfterWall === 0)   { res.foul = "volley"; return res; }
  if (t.bouncesAfterWall > 1)     { res.foul = "double"; return res; }

  // ── Classify + timing
  let kind = resolveShotKind(crouch, airborne, vy, finesse, shift);
  if (kind === "smash" && t.ballPos.y < 1.15) kind = "drive";
  const def = SHOTS[kind];
  res.kind = kind;

  const yErr  = Math.abs(t.ballPos.y - def.idealY);
  const yNorm = clamp(1 - yErr / def.window, 0, 1);
  const yQ    = yNorm * yNorm * (3 - 2 * yNorm);
  const dQ    = clamp(1 - dBall / HIT_REACH, 0.5, 1);
  const exec  = clamp(execution, 0.3, 1);
  // Weighted toward being forgiving — even a rough hit returns cleanly.
  const q     = clamp((0.55 * yQ + 0.45 * dQ) * exec, 0.30, 1);
  res.quality = q;
  res.perfect = yNorm > 0.72 && exec > 0.9;

  launch(t, t.ballPos.clone(), def, q);

  t.lastHitter        = hitter;
  t.turn              = other(hitter);
  t.bouncesBeforeWall = 0;
  t.hitWall           = false;
  t.bouncesAfterWall  = 0;
  t.rallyLength++;
  res.applied = true;
  return res;
}

// ── Physics step ─────────────────────────────────────────────
export function stepWall(t: WallState, dt: number) {
  if (t.phase === "won") return;

  if (t.phase === "point") {
    t.pointTimer = Math.max(0, t.pointTimer - dt);
    return;
  }

  // Ball sits in the server's hand until they strike it.
  if (t.phase === "serve" && t.held) {
    const holder = t.server === "player" ? t.playerPos : t.opPos;
    t.ballPos.set(holder.x, 1.05, holder.z - 0.35);
    t.ballVel.set(0, 0, 0);
    return;
  }

  // ── Substep the integration so a fast ball can never tunnel through
  //    the wall or the ground. We advance in slices no larger than the
  //    time it takes the ball to cross its own radius.
  const v = t.ballVel;
  const speed = Math.hypot(v.x, v.y, v.z);
  const maxStep = BALL_R * 0.6;            // never move more than this per slice
  const slices = Math.max(1, Math.min(8, Math.ceil((speed * dt) / maxStep)));
  const h = dt / slices;

  for (let i = 0; i < slices; i++) {
    if (integrate(t, h)) return;           // a foul ended the rally
  }
}

/** One integration slice. Returns true if a foul fired (stop stepping). */
function integrate(t: WallState, dt: number): boolean {
  const b = t.ballPos;
  const v = t.ballVel;

  v.y -= GRAVITY * dt;
  v.x *= AIR_DRAG;
  v.z *= AIR_DRAG;

  b.x += v.x * dt;
  b.y += v.y * dt;
  b.z += v.z * dt;

  // ── Ground contact
  if (b.y <= GROUND_Y && v.y < 0) {
    b.y = GROUND_Y;
    v.y = -v.y * GROUND_BOUNCE;
    v.x *= 0.92;
    v.z *= 0.92;
    if (v.y < 0.45) v.y = 0;
    sfx.bounce(Math.min(8, Math.abs(v.y) * 1.2 + 2));

    if (t.hitWall) {
      t.bouncesAfterWall++;
      if (t.bouncesAfterWall > 1) { callFoul(t, t.turn, "double"); return true; }
    } else {
      t.bouncesBeforeWall++;
    }

    if (!inCourt(b.x, b.z)) { callFoul(t, t.lastHitter ?? t.turn, "out"); return true; }
  }

  // ── Wall contact (front brick face)
  if (b.z <= WALL_Z + BALL_R && v.z < 0) {
    if (b.y > WALL_HEIGHT) { callFoul(t, t.lastHitter ?? t.turn, "long"); return true; }
    if (t.bouncesBeforeWall === 0) { callFoul(t, t.lastHitter ?? t.turn, "short"); return true; }
    b.z = WALL_Z + BALL_R;
    v.z = -v.z * WALL_BOUNCE;
    v.x *= 0.97;
    // Per-shot upward kick: roofers and moonballs balloon way up and back,
    // scrapies and baby hits stay low and short.
    v.y = v.y * 0.96 + SHOTS[t.lastShot].wallKick;
    t.hitWall = true;
    t.bouncesAfterWall = 0;
    sfx.hit(0.55);
  }

  // ── Sidelines:
  // If the ball has ALREADY bounced legally once in court, drifting wide means
  // the receiver failed to return it (point to hitter!).
  // If it hasn't bounced in court yet, the hitter shot wide (fault on hitter).
  if (Math.abs(b.x) > COURT_HALF_W + BALL_R) {
    if (t.hitWall && t.bouncesAfterWall >= 1) {
      callFoul(t, t.turn, "dead"); return true;
    } else {
      callFoul(t, t.lastHitter ?? t.turn, "wide"); return true;
    }
  }

  // ── Over the top of the wall
  if (b.y > WALL_HEIGHT + 0.6 && b.z < WALL_Z + 2.2) {
    callFoul(t, t.lastHitter ?? t.turn, "long"); return true;
  }

  // ── Sailed off the back:
  // If the ball bounced legally once inside court and then carried past the back line,
  // the receiver failed to return it in time — POINT TO HITTER!
  // If it flew past the back line WITHOUT bouncing in court first, the hitter went long.
  if (b.z > COURT_DEPTH + 0.4) {
    if (t.hitWall && t.bouncesAfterWall >= 1) {
      callFoul(t, t.turn, "dead"); return true;
    } else {
      callFoul(t, t.lastHitter ?? t.turn, "long"); return true;
    }
  }

  // ── Body contact
  if (t.hitWall && t.rallyLength > 0) {
    const victim = other(t.turn);
    const pos = victim === "player" ? t.playerPos : t.opPos;
    const py  = victim === "player" ? t.playerY : t.opY;
    const d = Math.hypot(b.x - pos.x, b.z - pos.z);
    if (d < 0.40 && b.y > py + 0.2 && b.y < py + 1.6) {
      callFoul(t, victim, "body"); return true;
    }
  }

  // ── Ball died on the floor — receiver never reached it
  const speed2 = v.x * v.x + v.z * v.z;
  if (b.y <= GROUND_Y + 0.02 && Math.abs(v.y) < 0.2 && speed2 < 0.30) {
    callFoul(t, t.turn, "dead"); return true;
  }
  return false;
}
