// ─────────────────────────────────────────────────────────────
//  BASKETBALL — H.O.R.S.E. on the half court
//
//  Two players take turns at the hoop: you vs SLAM (a basketball
//  robot with suspiciously good form). Classic playground rules:
//
//    • The free shooter picks any spot (walk over to it).
//      Make it → the OTHER player must make the SAME shot.
//      Miss it → nothing happens, the other player gets to pick.
//    • The challenged player must shoot the forced spot.
//      Make it → no letter, and THEY become the free shooter.
//      Miss it → they earn a letter. H…O…R…S…E.
//    • First to five letters loses. Winner stays on the blacktop.
//
//  SHOOTING
//    Click once to lock your spot, then a power meter ping-pongs
//    up and down. Click again to release — the closer to the
//    sweet spot, the better your quality. Quality decides made /
//    missed (thresholds grow with distance) and swishes.
//
//  OUTCOME IS DECIDED AT RELEASE, then dramatised live: the ball
//  flies a real ballistic arc toward the rim and bounces off the
//  blacktop exactly like the kickball/kickball philosophy.
// ─────────────────────────────────────────────────────────────

import * as THREE from "three";
import { sfx, swish as swishSfx, rim as rimSfx } from "./audio";
import { skillFactor } from "./settings";

// ── Court geometry (local coords; the scene offsets the whole court) ──
export const COURT_HALF_W = 4.4;     // walkable half width
export const BASELINE_Z   = -8.0;    // back line
export const FOUL_LINE_Z  = -4.6;    // free-throw line
export const RIM_X = 0;
export const RIM_Z = 0.15;           // rim sits slightly "north" of origin
export const RIM_H = 2.6;            // rim height
export const BACKBOARD_Z = -0.45;
export const BALL_R = 0.17;
export const GRAV = 13;
export const SWISH_QUALITY = 0.92;

// ── Shooting spots ───────────────────────────────────────────
export interface SpotDef {
  name: string;
  x: number;
  z: number;
  /** quality needed to make this shot (grows with distance) */
  make: number;
}
export const SPOTS: SpotDef[] = [
  { name: "FREE THROW",  x: 0.0,  z: -4.6, make: 0.46 },
  { name: "LEFT WING",   x: -2.6, z: -5.8, make: 0.54 },
  { name: "RIGHT WING",  x: 2.6,  z: -5.8, make: 0.54 },
  { name: "TOP OF KEY",  x: 0.0,  z: -7.2, make: 0.62 },
  { name: "LEFT CORNER", x: -3.6, z: -3.4, make: 0.56 },
  { name: "RIGHT CORNER", x: 3.6, z: -3.4, make: 0.56 },
];

export const LETTERS = ["H", "O", "R", "S", "E"];
export const MAX_LETTERS = 5;

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// ── State ────────────────────────────────────────────────────
export type BPhase = "pick" | "aim" | "flight" | "resolve" | "over";

export interface BState {
  time: number;
  phase: BPhase;
  /** 0 = player, 1 = SLAM */
  turn: 0 | 1;
  /** when >= 0, the current shooter MUST shoot this spot */
  forcedSpot: number;
  /** spot locked for the current shot */
  spotIdx: number;
  /** letters earned by each side (index 0 = player) */
  letters: [string[], string[]];
  swishes: number;
  shots: number;
  made: boolean;
  quality: number;
  banner: string;
  bannerSub: string;
  bannerAt: number;
  pointTimer: number;
  shake: number;
  winner: 0 | 1 | null;

  playerPos: THREE.Vector3;
  playerY: number;
  playerVY: number;
  playerFacing: number;
  playerMoving: boolean;
  playerSwing: number;

  opPos: THREE.Vector3;
  opY: number;
  opVY: number;
  opFacing: number;
  opMoving: boolean;
  opSwing: number;
  opTarget: THREE.Vector3;
  opAimAt: number;      // time the bot releases its shot

  ballPos: THREE.Vector3;
  ballVel: THREE.Vector3;
  ballState: "held" | "flight" | "ground";

  /** ping-pong aiming meter 0..1 */
  meter: number;
  meterDir: 1 | -1;
  /** did the ball already pass through the rim plane this flight? */
  rimPassed: boolean;
  landed: boolean;
}

export function createBState(): BState {
  return {
    time: 0,
    phase: "pick",
    turn: 0,
    forcedSpot: -1,
    spotIdx: -1,
    letters: [[], []],
    swishes: 0,
    shots: 0,
    made: false,
    quality: 0,
    banner: "H.O.R.S.E.",
    bannerSub: "walk to a spot, then click to shoot",
    bannerAt: 0,
    pointTimer: 0,
    shake: 0,
    winner: null,

    playerPos: new THREE.Vector3(-1.6, 0, -5.2),
    playerY: 0,
    playerVY: 0,
    playerFacing: 0,
    playerMoving: false,
    playerSwing: 9,

    opPos: new THREE.Vector3(1.6, 0, -5.2),
    opY: 0,
    opVY: 0,
    opFacing: 0,
    opMoving: false,
    opSwing: 9,
    opTarget: new THREE.Vector3(1.6, 0, -5.2),
    opAimAt: 0,

    ballPos: new THREE.Vector3(0, BALL_R, -4.6),
    ballVel: new THREE.Vector3(),
    ballState: "held",

    meter: 0,
    meterDir: 1,
    rimPassed: false,
    landed: false,
  };
}

// ── helpers ──────────────────────────────────────────────────
export function spotPos(i: number, out: THREE.Vector3): THREE.Vector3 {
  const s = SPOTS[i];
  return out.set(s.x, 0, s.z);
}

export function nearestSpot(pos: THREE.Vector3): number {
  let best = 0;
  let bestD = Infinity;
  SPOTS.forEach((s, i) => {
    const d = Math.hypot(pos.x - s.x, pos.z - s.z);
    if (d < bestD) { bestD = d; best = i; }
  });
  return best;
}

/**
 * Where the ball rests while the current shooter holds it — just in FRONT
 * of the chest at hand height. Placing it at the character's exact centre
 * used to bury the ball inside the torso model.
 */
export function heldBallPos(t: BState, out?: THREE.Vector3): THREE.Vector3 {
  const isPlayer = t.turn === 0;
  const p = isPlayer ? t.playerPos : t.opPos;
  const y = (isPlayer ? t.playerY : t.opY) + 1.15;
  const f = isPlayer ? t.playerFacing : t.opFacing;
  const v = out ?? new THREE.Vector3();
  return v.set(
    p.x + Math.sin(f) * 0.42,
    y,
    p.z + Math.cos(f) * 0.42,
  );
}

/** Whose shot is in the air (for banners). */
export const turnName = (t: 0 | 1) => (t === 0 ? "YOU" : "SLAM");

// ── shot release ─────────────────────────────────────────────
/**
 * Lock the current spot and start the aiming meter. Returns true if
 * a shot can actually start (player is near the chosen spot on free
 * picks, or anywhere when the spot is forced).
 */
export function startShot(t: BState, spot: number): boolean {
  if (t.phase !== "pick") return false;
  if (t.turn !== 0) return false;
  if (t.forcedSpot >= 0) {
    // challenged: must shoot the forced spot
    if (spot !== t.forcedSpot) return false;
  } else {
    // free pick: must be standing near the spot
    const d = Math.hypot(t.playerPos.x - SPOTS[spot].x, t.playerPos.z - SPOTS[spot].z);
    if (d > 1.5) return false;
  }
  t.spotIdx = spot;
  t.phase = "aim";
  t.meter = 0;
  t.meterDir = 1;
  return true;
}

/**
 * Release the shot with the current meter reading. Decides made/miss,
 * launches a ballistic arc toward the rim, and starts the flight phase.
 */
export function releaseShot(t: BState, meter: number): boolean {
  if (t.phase !== "aim") return false;
  const spot = SPOTS[t.spotIdx];
  const err = Math.abs(meter - 0.72);
  const quality = clamp(1 - err / 0.72, 0, 1);
  const made = quality >= spot.make;
  const swish = made && quality >= SWISH_QUALITY;

  t.quality = quality;
  t.made = made;
  t.shots += 1;
  if (swish) t.swishes += 1;
  t.phase = "flight";
  t.rimPassed = false;
  t.landed = false;

  const from = heldBallPos(t);

  // Aim target — decided here, physics just dramatises it.
  let target: THREE.Vector3;
  if (made) {
    target = new THREE.Vector3(RIM_X, RIM_H - 0.32, RIM_Z + 0.12);
    target.x += (Math.random() - 0.5) * 0.1;
  } else {
    const pat = Math.floor(Math.random() * 4);
    if (pat === 0) target = new THREE.Vector3(RIM_X, 1.1, RIM_Z - 0.55);          // short
    else if (pat === 1) target = new THREE.Vector3(RIM_X, RIM_H - 0.1, RIM_Z + 1.0); // long
    else if (pat === 2) target = new THREE.Vector3(RIM_X - 0.9, RIM_H - 0.25, RIM_Z);  // left
    else target = new THREE.Vector3(RIM_X + 0.9, RIM_H - 0.25, RIM_Z);            // right
  }

  // Solve a clean ballistic path to the target.
  const d = from.distanceTo(target);
  const T = clamp(d / 6.8, 0.5, 1.5);
  const vx = (target.x - from.x) / T;
  const vz = (target.z - from.z) / T;
  const vy = (target.y - from.y) / T + 0.5 * GRAV * T;
  // A gentle arc over the rim so the ball "drops in" rather than threading
  // the exact rim plane.
  t.ballVel.set(vx, vy + 0.7, vz);
  t.ballPos.copy(from);
  t.ballState = "flight";

  if (t.turn === 0) t.playerSwing = 0; else t.opSwing = 0;
  sfx.kick(0.5 + quality * 0.4);
  return true;
}

// ── physics + flow ───────────────────────────────────────────
export function stepB(t: BState, dt: number) {
  t.time += dt;
  t.shake = Math.max(0, t.shake - dt * 2);
  t.playerSwing = Math.min(9, t.playerSwing + dt);
  t.opSwing = Math.min(9, t.opSwing + dt);
  // A held ball rides in front of its shooter's chest every frame, so it
  // never sits buried in the torso nor lags behind while walking.
  if (t.ballState === "held") t.ballPos.copy(heldBallPos(t));
  if (t.playerY > 0 || t.playerVY !== 0) {
    t.playerY += t.playerVY * dt;
    t.playerVY -= GRAV * dt;
    if (t.playerY <= 0) { t.playerY = 0; t.playerVY = 0; }
  }
  if (t.opY > 0 || t.opVY !== 0) {
    t.opY += t.opVY * dt;
    t.opVY -= GRAV * dt;
    if (t.opY <= 0) { t.opY = 0; t.opVY = 0; }
  }

  switch (t.phase) {
    case "pick":
      stepPick(t, dt);
      return;
    case "aim": {
      t.meter += t.meterDir * dt * 1.25;
      if (t.meter >= 1) { t.meter = 1; t.meterDir = -1; }
      else if (t.meter <= 0) { t.meter = 0; t.meterDir = 1; }
      // Bot releases on its own clock (opAimAt is set fresh when it
      // enters this phase, so it actually winds up before firing).
      if (t.turn === 1 && t.time >= t.opAimAt) {
        const skill = clamp(0.5 * skillFactor() + gauss(0.09), 0.04, 0.97);
        releaseShot(t, 0.2 + skill * 0.78);
      }
      return;
    }
    case "flight":
      stepBall(t, dt);
      return;
    case "resolve": {
      t.pointTimer -= dt;
      if (t.pointTimer <= 0) beginNextTurn(t);
      return;
    }
    case "over":
      return;
  }
}

function gauss(s: number) {
  return (Math.random() + Math.random() + Math.random() - 1.5) * s;
}

function stepPick(t: BState, dt: number) {
  // ── Bot turn: choose a spot and walk to it ──
  if (t.turn === 1) {
    if (t.spotIdx < 0) {
      t.spotIdx = t.forcedSpot >= 0
        ? t.forcedSpot
        : weightedPick();
      spotPos(t.spotIdx, t.opTarget);
    }
    const dx = t.opTarget.x - t.opPos.x;
    const dz = t.opTarget.z - t.opPos.z;
    const d = Math.hypot(dx, dz);
    t.opMoving = d > 0.08;
    if (t.opMoving) {
      const step = Math.min(d, 3.9 * dt);
      t.opPos.x += (dx / d) * step;
      t.opPos.z += (dz / d) * step;
      t.opFacing = Math.atan2(dx, dz);
    } else {
      t.opFacing = Math.atan2(-t.opPos.x, RIM_Z - t.opPos.z + 0.1);
      if (t.opAimAt === 0) t.opAimAt = t.time + 0.7 + Math.random() * 0.7;
      if (t.time >= t.opAimAt) {
        t.phase = "aim";
        t.meter = 0;
        t.meterDir = 1;
        // Wind up for a beat before the release — the old code reused the
        // walk-to-spot timer here, so the bot fired the instant it entered
        // "aim" with zero windup.
        t.opAimAt = t.time + 0.6 + Math.random() * 0.5;
      }
    }
  }
  // Player turn: free movement handled by the director; the HUD drives
  // the "click to shoot" prompt. Nothing else to do here.
  t.playerFacing = Math.atan2(-t.playerPos.x, RIM_Z - t.playerPos.z + 0.1);
}

function weightedPick(): number {
  // Prefer slightly easier spots, occasionally go bold.
  const weights = SPOTS.map((s) => 1 + (1 - s.make) * 2.5);
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < SPOTS.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return 0;
}

function stepBall(t: BState, dt: number) {
  const b = t.ballPos;
  const v = t.ballVel;
  v.y -= GRAV * dt;
  b.addScaledVector(v, dt);

  // Swish moment: crossing the rim plane while descending.
  if (!t.rimPassed && b.z >= RIM_Z && b.z <= RIM_Z + 0.6 && b.y <= RIM_H + 0.1 && v.y < 0) {
    t.rimPassed = true;
    if (t.made) {
      // The net catches the ball — kill most of its forward momentum so a
      // made shot drops straight through instead of rocketing off the back
      // of the court (which used to freeze the ball mid-air at the edge).
      v.x *= 0.12;
      v.z *= 0.12;
      if (t.quality >= SWISH_QUALITY) {
        swishSfx();
        useGame_popup("SWISH!", "gold", true);
        useGame_swish();
      } else {
        rimSfx();
      }
    } else {
      rimSfx(); // clank off the iron
      t.shake = 0.35;
    }
  }

  // Floor contact
  if (b.y <= BALL_R && v.y < 0) {
    b.y = BALL_R;
    if (v.y < -2.4) {
      v.y *= -0.5;
      v.x *= 0.75;
      v.z *= 0.75;
      sfx.bounce(3);
    } else {
      v.y = 0;
      t.ballState = "ground";
      sfx.bounce(1);
    }
  }

  // Friction when rolling
  if (t.ballState === "ground") {
    const f = Math.max(0, 1 - 1.6 * dt);
    v.x *= f;
    v.z *= f;
  }

  // Flight over → resolve the letter + next turn.
  const settled =
    (t.ballState === "ground" && Math.hypot(v.x, v.z) < 0.35) ||
    b.z > 4.5 || Math.abs(b.x) > 7 || b.z < -11;
  if (settled && t.phase === "flight") endFlight(t);
}

function endFlight(t: BState) {
  t.phase = "resolve";
  t.pointTimer = 2.1;
  // Leave the ball where it landed while the banner plays — jumping it back
  // into the shooter's hands here read as a teleport glitch. Snap it to the
  // floor in case it settled while still airborne on an out-of-bounds escape.
  t.ballState = "ground";
  t.ballVel.set(0, 0, 0);
  t.ballPos.y = BALL_R;

  const wasForced = t.forcedSpot >= 0;
  const shooterName = turnName(t.turn);

  if (t.made) {
    if (wasForced) {
      t.banner = `${shooterName} MATCHES IT!`;
      t.bannerSub = "no letter — and the pick is yours";
    } else {
      t.banner = `${shooterName} DRAINS IT!`;
      t.bannerSub = t.turn === 0 ? "SLAM must make this shot" : "you must make this shot";
    }
    sfx.cheer();
  } else {
    if (wasForced) {
      const side = t.turn;
      t.letters[side].push(LETTERS[t.letters[side].length]);
      const left = MAX_LETTERS - t.letters[side].length;
      t.banner = `${shooterName} MISSES — LETTER ${LETTERS[t.letters[side].length - 1]}`;
      t.bannerSub = side === 0
        ? `you're spelling HORSE (${left} to go)`
        : `SLAM is spelling HORSE (${left} to go)`;
      sfx.fault();
    } else {
      t.banner = `${shooterName} MISSES`;
      t.bannerSub = "no letter — pick your next spot";
      sfx.fault();
    }
  }
  t.bannerAt = t.time;

  // Check the game over condition.
  if (t.letters[0].length >= MAX_LETTERS) t.winner = 1;
  else if (t.letters[1].length >= MAX_LETTERS) t.winner = 0;
  if (t.winner !== null) {
    t.phase = "over";
    t.banner = t.winner === 0 ? "YOU WIN H.O.R.S.E.!" : "SLAM WINS H.O.R.S.E.";
    t.bannerSub = t.winner === 0 ? "the blacktop is yours" : "better luck next recess";
    t.bannerAt = t.time;
  }
}

function beginNextTurn(t: BState) {
  const made = t.made;
  const wasForced = t.forcedSpot >= 0;
  const thisSpot = t.spotIdx;

  if (made && wasForced) {
    // Challenged player matched it → no letter; they stay as free shooter.
    t.forcedSpot = -1;
    // turn does NOT change
  } else if (made) {
    // Free shot made → opponent is now challenged on this spot.
    t.forcedSpot = thisSpot;
    t.turn = t.turn === 0 ? 1 : 0;
  } else {
    // Miss → clear any challenge, other player picks.
    t.forcedSpot = -1;
    t.turn = t.turn === 0 ? 1 : 0;
  }

  t.spotIdx = -1;
  t.opAimAt = 0;
  t.made = false;
  t.phase = "pick";
  t.ballState = "held";
  t.ballVel.set(0, 0, 0);

  // Park each shooter near the free-throw line for the next pick.
  const p = t.turn === 0 ? t.playerPos : t.opPos;
  const isPlayer = t.turn === 0;
  if (isPlayer) {
    t.playerPos.set(SPOTS[nearestSpot(t.playerPos)].x, 0, FOUL_LINE_Z - 0.6);
  } else {
    t.opPos.set(1.4, 0, FOUL_LINE_Z - 0.8);
  }
  void p;
}

// tiny indirection so this pure module never imports the store at
// module scope (avoids circular imports at load time).
import { useGame } from "./store";
function useGame_popup(text: string, tone: "gold" | "cyan" | "red" | "green" | "purple" | "white", big?: boolean) {
  const st = useGame.getState();
  st.popup(text, tone, big);
}
function useGame_swish() {
  useGame.getState().addSwish();
}
