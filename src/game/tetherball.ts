// ─────────────────────────────────────────────────────────────
//  TETHERBALL — Physically Correct Conical Pendulum
//
//  Full Lagrangian mechanics in two generalised coordinates:
//    θ (theta) — azimuthal angle around pole's vertical axis
//    φ (phi)   — polar angle from straight-down vertical
//
//  State variables carried in TState:
//    theta, phi       — generalised coordinates
//    L                — conserved angular momentum about the vertical
//                       axis:  L = m·r²·sin²φ·θ'
//  Derived each step:
//    thetaVel = L / (m·r²·sin²φ)
//    phiVel comes from the φ E-L equation
//
//  Physical behaviour this produces:
//    • Spin acceleration when rope shortens (wraps): as r decreases, θ'
//      increases to conserve L — like a figure skater pulling arms in
//    • Natural orbit angle: at equilibrium, φ hangs at
//      cos φ_eq = g / (r·θ'²) — exactly matches a real tetherball
//    • Gravity pulls a fast ball back down when L drains (drag)
//    • Hits add/subtract ΔL directly, causing immediate speed changes
//    • Reversing requires braking the spin first — satisfying counter-hits
//
//  Hit detection:
//    • Generous reach sphere (1.35 m) centred on player's hand
//    • Ball-speed margin added to reach (fast ball = easier to catch)
//    • Ten timing windows that scale with shot type (tight for hard shots,
//      wide for safe ones) but ALL forgiving enough to actually land
//    • Aiming: no aim required — we hit whatever ball is near the hand,
//      direction determined by side (player CW, bot CCW)
// ─────────────────────────────────────────────────────────────

import * as THREE from "three";

// ── Court dimensions (regulation) ────────────────────────────
export const POLE_H      = 3.05;    // 10 ft pole
export const POLE_R      = 0.038;   // steel pole radius
export const R_COURT     = 3.05;    // 10 ft court radius
export const BALL_R      = 0.15;
export const ROPE_MAX    = 2.42;    // rope length when fresh (ball hangs 0.63 m)
export const ROPE_MIN    = 0.30;    // rope when fully wrapped
export const HEIGHT_MARK = 1.52;    // 5 ft marker — win must land above
export const GRAV        = 9.81;
export const WIN_WRAPS   = 5.0;
export const WRAP_LOSS   = 2 * Math.PI * POLE_R;  // ≈ 0.239 m per full wrap
export const BALL_MASS   = 0.40;    // rubber tetherball

// Pace tuning: tetherball feels bad when the orbit collapses into a slow
// dead hang. These values keep a live rally moving while still allowing
// momentary soft shots and reversals.
export const MIN_ORBIT_SPEED = 2.85; // m/s tangential speed floor during live rallies
export const MIN_ORBIT_PHI   = 0.34; // minimum rope angle in live play (~0.8 m radius)
export const MOMENTUM_ASSIST = 7.5;  // how quickly slow rallies recover speed

// ── Visual / gameplay constants ───────────────────────────────
export const BALL_HIT_RANGE  = 1.35;   // generous reach sphere (m)
export const BALL_GLOW_Y     = 1.45;   // ball glows when above this height (for smash timing)
export const FEEDBACK_RANGE  = 2.6;    // aim-reticle shows green when ball within this distance

export type TSide = "player" | "op";

// ─────────────────────────────────────────────────────────────
//  STATE
// ─────────────────────────────────────────────────────────────
export interface TState {
  // --- Core physics ---
  theta:      number;   // azimuth (rad) — continuous, grows with wraps
  phi:        number;   // polar angle from vertical (rad)
  phiVel:     number;   // dφ/dt
  thetaVel:   number;   // dθ/dt — derived from L each step
  L:          number;   // angular momentum  m·r²·sin²φ·θ'

  // --- Rope geometry ---
  wraps:        number;  // wraps accumulated THIS RALLY (0 at serve start)
  wrapBaseline: number;  // theta at the last serve/reset — sub from current theta
  ropeFree:     number;  // free rope below wrap-off point (m)
  wrapY:        number;  // y coordinate where rope last leaves the pole

  // --- Derived ball state (recalculated in stepTether) ---
  ballPos:   THREE.Vector3;
  ballVel:   THREE.Vector3;    // 3D velocity m/s

  // --- Hit legality ---
  lastHitter:    TSide | null;
  lastHitAt:     number;
  lastHitTheta:  number;
  ballCleared:   boolean;

  // --- Player ---
  playerPos:       THREE.Vector3;
  playerY:         number;
  playerVY:        number;
  playerCrouch:    boolean;
  playerFacing:    number;
  playerSwing:     number;
  playerCooldown:  number;

  // --- Bot ---
  opPos:       THREE.Vector3;
  opFacing:    number;
  opSwing:     number;
  opCooldown:  number;
  opY:         number;
  opVY:        number;
  opCrouch:    boolean;
  opTarget:    THREE.Vector3;
  opServeAt:   number;
  opServing:   boolean;

  // --- Game flow ---
  serveStage: "player-hold" | "op-hold" | "live" | "paused";
  time:       number;
  shake:      number;
}

export function createTState(): TState {
  return {
    theta:    Math.PI / 2,
    thetaVel: 0,
    phi:      0.22,
    phiVel:   0,
    L:        0,

    wraps:        0,
    wrapBaseline: Math.PI / 2,
    ropeFree:     ROPE_MAX,
    wrapY:        POLE_H,

    ballPos: new THREE.Vector3(),
    ballVel: new THREE.Vector3(),

    lastHitter:    null,
    lastHitAt:     -99,
    lastHitTheta:  0,
    ballCleared:   true,

    playerPos:      new THREE.Vector3(0, 0, 1.65),
    playerY:        0,
    playerVY:       0,
    playerCrouch:   false,
    playerFacing:   Math.PI,
    playerSwing:    9,
    playerCooldown: 0,

    opPos:       new THREE.Vector3(0, 0, -1.65),
    opFacing:    0,
    opSwing:     9,
    opCooldown:  0,
    opY:         0,
    opVY:        0,
    opCrouch:    false,
    opTarget:    new THREE.Vector3(0, 0, -1.65),
    opServeAt:   0,
    opServing:   false,

    serveStage: "player-hold",
    time:       0,
    shake:      0,
  };
}

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// ─────────────────────────────────────────────────────────────
//  POSITION FROM STATE
//  Ball is on a sphere of radius `ropeFree` centred on the pole,
//  parameterised by (theta, phi).
// ─────────────────────────────────────────────────────────────
export function computeBallPos(t: TState, out: THREE.Vector3): THREE.Vector3 {
  const r     = t.ropeFree;
  const sinP  = Math.sin(t.phi);
  const cosP  = Math.cos(t.phi);
  const ox    = Math.cos(t.theta);
  const oz    = Math.sin(t.theta);
  // rope exits the pole body at POLE_R offset
  out.set(
    POLE_R * ox + ox * r * sinP,
    t.wrapY - r * cosP,
    POLE_R * oz + oz * r * sinP,
  );
  return out;
}

// ─────────────────────────────────────────────────────────────
//  PHYSICS STEP  (semi-implicit Euler — stable at game frame rates)
// ─────────────────────────────────────────────────────────────
export function stepTether(t: TState, dt: number): void {
  const r    = Math.max(0.08, t.ropeFree);
  const sinP = Math.max(1e-4, Math.sin(t.phi));
  const cosP = Math.cos(t.phi);

  // ── φ equation of motion (exact Lagrangian, no small-angle approx):
  //   φ'' = (L²·cosφ) / (m²·r⁴·sin³φ)
  //         - (g/r)·sinφ
  //         - damping·φ'
  const centrifugal  = (t.L * t.L * cosP) /
                       (BALL_MASS * BALL_MASS * r * r * r * r * sinP * sinP * sinP + 1e-10);
  const gravity      = -(GRAV / r) * sinP;
  // Air drag on phi (pendulum swing) — moderate so swings decay naturally
  const phiDrag      = -1.6 * t.phiVel;
  t.phiVel += (centrifugal + gravity + phiDrag) * dt;
  t.phi    += t.phiVel * dt;
  t.phi     = clamp(t.phi, 0.04, Math.PI * 0.485);

  // ── Angular momentum drains slowly (air + rope friction):
  t.L *= Math.exp(-0.12 * dt);

  // ── Minimum live-rally momentum ----------------------------------
  // Real tetherball rarely becomes a dead slow pendulum during an active
  // exchange because players keep feeding it energy. This floor acts like
  // that continuous schoolyard momentum: if a live rally drops below a
  // playable orbit speed, gently pump it back up in the current direction.
  if (t.serveStage === "live" && t.lastHitter) {
    const dir = Math.sign(t.L) || (t.lastHitter === "player" ? 1 : -1);
    const orbitRadius = Math.max(0.28, r * Math.sin(Math.max(t.phi, MIN_ORBIT_PHI)));
    const currentSpeed = Math.abs(t.L) / (BALL_MASS * orbitRadius + 1e-6);
    const targetSpeed = MIN_ORBIT_SPEED + Math.min(1.3, Math.abs(t.wraps) * 0.08);
    if (currentSpeed < targetSpeed) {
      const targetL = dir * targetSpeed * BALL_MASS * orbitRadius;
      t.L += (targetL - t.L) * Math.min(1, MOMENTUM_ASSIST * dt);
      // True floor: never allow a live rally to crawl below this speed.
      const hardMinL = dir * (MIN_ORBIT_SPEED * 0.72) * BALL_MASS * orbitRadius;
      if (Math.abs(t.L) < Math.abs(hardMinL)) t.L = hardMinL;
    }

    // Keep the orbit from collapsing into the pole/hanging straight down.
    // This makes the player's side much easier to read and hit.
    if (t.phi < MIN_ORBIT_PHI) {
      t.phiVel += (MIN_ORBIT_PHI - t.phi) * 10.0 * dt;
      t.phi = Math.max(t.phi, MIN_ORBIT_PHI * 0.72);
    }
  }

  // Recover thetaVel from angular momentum: θ' = L / (m·r²·sin²φ)
  const liveSinP = Math.max(1e-4, Math.sin(t.phi));
  const mr2sin2 = BALL_MASS * r * r * liveSinP * liveSinP;
  t.thetaVel = mr2sin2 > 1e-8 ? t.L / mr2sin2 : 0;

  // ── Advance azimuth
  const dTheta = t.thetaVel * dt;
  t.theta += dTheta;

  // ── Wraps THIS RALLY — computed from current theta relative to the
  //    baseline that was set at serve time. This prevents measuring
  //    "half a wrap" just because we happened to start standing at π/2.
  t.wraps = (t.theta - t.wrapBaseline) / (2 * Math.PI);

  // ── Rope shortening as it wraps (each 2π = one pole circumference):
  const wrapsAbs = Math.abs(t.wraps);
  const targetFree = clamp(ROPE_MAX - wrapsAbs * WRAP_LOSS, ROPE_MIN, ROPE_MAX);
  // Fast rope feed when spinning fast
  const feedRate  = 5.0 + Math.abs(t.thetaVel) * 0.6;
  t.ropeFree += (targetFree - t.ropeFree) * Math.min(1, feedRate * dt);

  // ── Wrap-off Y descends smoothly as wraps accumulate:
  const descent   = clamp(wrapsAbs * 0.24, 0, POLE_H - HEIGHT_MARK - 0.10);
  const targetWy  = POLE_H - descent;
  t.wrapY += (targetWy - t.wrapY) * Math.min(1, 5.0 * dt);

  // ── Derived ball position
  computeBallPos(t, t.ballPos);

  // ── Derived ball velocity (analytic):
  const newSinP = Math.sin(t.phi);
  const newR    = t.ropeFree;
  const orbitR  = newR * newSinP;
  const ox = Math.cos(t.theta), oz = Math.sin(t.theta);
  const tx = -oz, tz = ox;
  const vTangent = t.thetaVel * orbitR;
  const vPhi     = t.phiVel * newR;
  const vOutward =  vPhi * newSinP;
  const vVert    = -vPhi * Math.cos(t.phi);
  t.ballVel.set(
    tx * vTangent + ox * vOutward,
    vVert,
    tz * vTangent + oz * vOutward,
  );

  // ── Re-arm the last striker once ball has left their zone
  if (!t.ballCleared && t.lastHitter) {
    const crossed =
      (t.lastHitter === "player" && t.ballPos.z < -0.25) ||
      (t.lastHitter === "op"     && t.ballPos.z >  0.25);
    const swung = Math.abs(t.theta - t.lastHitTheta) > Math.PI * 1.1;
    if (crossed || swung) t.ballCleared = true;
  }
}

// ─────────────────────────────────────────────────────────────
//  SHOT ARSENAL
// ─────────────────────────────────────────────────────────────
export type ShotKind = "drive" | "skimmer" | "smash" | "loft" | "dink" | "mistime";

export interface ShotDef {
  name:      string;
  /** Y position of the ball where this shot is perfectly timed */
  idealY:    number;
  /** Half-width of the full-credit window around idealY */
  window:    number;
  /** Base angular impulse — how much L (spin) is added */
  impulse:   number;
  /** Instant kick applied to rope angle phi */
  phiKick:   number;
  /** Delta phiVel — how much the rope angle accelerates up/down */
  phiVelDel: number;
  /** Multiplier applied to existing L on hit (1 = preserve, <1 = brake) */
  lMul:      number;
  /** Colour for HUD */
  colour:    string;
  /** HUD tutorial blurb */
  blurb:     string;
  keys:      string;
}

export const SHOTS: Record<ShotKind, ShotDef> = {
  drive: {
    name: "DRIVE",
    idealY: 1.0,  window: 0.90,
    impulse: 6.2, phiKick:  0.00, phiVelDel: 0.38,
    lMul: 1.0, colour: "#f4c542",
    blurb: "The standing punch. Forgiving and reliable.",
    keys: "CLICK",
  },
  skimmer: {
    name: "SKIMMER",
    idealY: 0.45, window: 0.42,
    impulse: 8.6, phiKick: -0.10, phiVelDel: -0.85,
    lMul: 1.0, colour: "#38d6d0",
    blurb: "Crouch low, knuckle it flat — skids fast and low.",
    keys: "HOLD C + CLICK",
  },
  smash: {
    name: "SMASH",
    idealY: 1.85, window: 0.65,
    impulse: 14.0, phiKick:  0.30, phiVelDel: 1.8,
    lMul: 1.0, colour: "#ff5a3c",
    blurb: "Jump and strike ON THE WAY DOWN. Devastating.",
    keys: "SPACE then CLICK falling",
  },
  loft: {
    name: "HIGH LOFT",
    idealY: 1.15, window: 0.28,
    impulse: 5.2, phiKick:  0.45, phiVelDel: 4.2,
    lMul: 0.88, colour: "#b58cff",
    blurb: "Tight timing window — sails high over their head!",
    keys: "RIGHT CLICK",
  },
  dink: {
    name: "DINK",
    idealY: 0.60, window: 0.55,
    impulse: 2.4, phiKick:  0.05, phiVelDel: 0.55,
    lMul: 0.50, colour: "#8ae06b",
    blurb: "Soft crouch touch. Kills all pace instantly.",
    keys: "C + RIGHT CLICK",
  },
  mistime: {
    name: "MISTIMED",
    idealY: 1.40, window: 2.20,   // huge window = very forgiving
    impulse: 2.0, phiKick:  0.08, phiVelDel: 0.55,
    lMul: 0.65, colour: "#8b93a0",
    blurb: "Off-balance hit.",
    keys: "—",
  },
};

// ─────────────────────────────────────────────────────────────
//  Resolve which shot from posture + input
//  finesse = right mouse button
// ─────────────────────────────────────────────────────────────
export function resolveShotKind(
  crouch: boolean, airborne: boolean, vy: number, finesse: boolean,
): ShotKind {
  if (airborne) {
    // Only count as smash if actually DESCENDING with a high ball —
    // we check ball height at hit time, not here.
    if (vy < -0.3) return "smash";
    return "mistime";
  }
  if (crouch) return finesse ? "dink" : "skimmer";
  return finesse ? "loft" : "drive";
}

// ─────────────────────────────────────────────────────────────
//  DOUBLE-HIT LEGALITY
//  Real tetherball rule: one strike per trip around the pole.
// ─────────────────────────────────────────────────────────────
export function wouldDoubleHit(t: TState, hitter: TSide): boolean {
  if (t.lastHitter !== hitter) return false;
  return !t.ballCleared;
}

// ─────────────────────────────────────────────────────────────
//  TRY HIT
// ─────────────────────────────────────────────────────────────
export interface HitResult {
  applied:  boolean;
  quality:  number;   // 0..1 timing quality
  kind:     ShotKind;
  perfect:  boolean;
  foul:     null | "carry" | "double" | "pole" | "offside";
  /** Ball speed after the hit (m/s), for feedback */
  ballSpeed: number;
}

export function tryHit(
  t:        TState,
  hitter:   TSide,
  hitFrom:  THREE.Vector3,   // ground XZ of hitter
  handY:    number,           // absolute Y of hand
  crouch:   boolean,
  airborne: boolean,
  vy:       number,           // hitter vertical velocity
  finesse:  boolean,          // right mouse button
  execution = 1,              // 0..1: AI/human execution quality modifier
): HitResult {
  const res: HitResult = {
    applied: false, quality: 0, kind: "drive", perfect: false,
    foul: null, ballSpeed: 0,
  };

  // ── Pole / rope contact (foul) ────────────────────────────
  const dPole = Math.hypot(hitFrom.x, hitFrom.z);
  if (dPole < POLE_R + 0.22) { res.foul = "pole"; return res; }

  // ── GENEROUS reach sphere:
  //    Base radius + bonus for fast-moving ball (more chance to deflect)
  //    + extra vertical allowance when the ball is high (smash reach)
  const speedBonus  = Math.min(0.30, t.ballVel.length() * 0.045);
  const reachRadius = BALL_HIT_RANGE + speedBonus;
  const handPos     = new THREE.Vector3(hitFrom.x, handY, hitFrom.z);
  const dBall       = handPos.distanceTo(t.ballPos);
  if (dBall > reachRadius) return res;   // whiff — no foul, no penalty

  // ── Double-hit ────────────────────────────────────────────
  if (wouldDoubleHit(t, hitter)) { res.foul = "double"; return res; }

  // ── Classify shot ─────────────────────────────────────────
  const kind = resolveShotKind(crouch, airborne, vy, finesse);
  let finalKind = kind;
  if (kind === "smash" && t.ballPos.y < 1.25) finalKind = "mistime";
  // Smash from jump requires descent — check again
  if (kind === "mistime" && airborne && vy < -0.35 && t.ballPos.y >= 1.30)
    finalKind = "smash";   // re-promote: we were descending onto a high ball

  const shotDef = SHOTS[finalKind];
  res.kind      = finalKind;

  // ── Timing quality:
  //   Compare ball's actual Y to the shot's idealY.
  //   Give full credit within window/2, ramp down to zero credit at full window.
  const yErr    = Math.abs(t.ballPos.y - shotDef.idealY);
  const yNorm   = clamp(1 - yErr / shotDef.window, 0, 1);
  // Growth curve so hits near the ideal feel rewarding but are easy to make
  const yQ      = yNorm * yNorm * (3 - 2 * yNorm);   // smoothstep
  // Distance quality: anything in the reach sphere is at least 60%
  const dQ      = clamp(1 - dBall / reachRadius, 0.40, 1);

  // Execution lets AI make human-like timing errors without changing the
  // shared ball physics. Player input defaults to perfect execution (1).
  const exec = clamp(execution, 0.25, 1.0);
  const q  = clamp((0.60 * yQ + 0.40 * dQ) * exec, 0.10, 1.0);
  res.quality = q;
  res.perfect = yNorm > 0.78 && exec > 0.93 && finalKind !== "mistime";

  // ── Carry: ball nearly stopped and hand right on it
  if (finalKind !== "smash" && t.ballVel.length() < 0.40 && dBall < 0.25) {
    if (Math.random() < 0.08) { res.foul = "carry"; return res; }
  }

  // ── Direction: player = CCW (+L), bot = CW (−L)
  const sign = hitter === "player" ? +1 : -1;

  // ── Impulse magnitude scales with quality AND descent speed for smash
  let impulseMag = shotDef.impulse * (0.35 + 0.65 * q);
  if (finalKind === "smash") {
    // Descending faster = more crush
    impulseMag *= 1 + clamp(-vy / 6.0, 0, 0.55);
  }
  if (finalKind === "loft" && res.perfect) impulseMag *= 1.5;

  // ── Delta angular momentum
  const r      = t.ropeFree;
  const deltaL = sign * impulseMag * BALL_MASS * r * Math.sin(t.phi + 0.08);

  // ── Reverse: if hitting against current spin, damp first then drive
  if (Math.sign(t.L) !== 0 && Math.sign(t.L) !== sign) {
    t.L *= 0.25;   // strong brake
  }
  t.L = t.L * shotDef.lMul + deltaL;

  // ── Clamp to physically meaningful max
  const maxL = BALL_MASS * r * r * 24;   // ~24 rad/s peak
  t.L = clamp(t.L, -maxL, maxL);

  // ── φ (rope angle) effects
  t.phi    = clamp(t.phi + shotDef.phiKick, 0.04, Math.PI * 0.485);
  t.phiVel += shotDef.phiVelDel * (0.5 + 0.5 * q);
  if (finalKind === "loft" && res.perfect) t.phiVel += 1.8;

  // ── Record hit
  t.lastHitter   = hitter;
  t.lastHitAt    = t.time;
  t.lastHitTheta = t.theta;
  t.ballCleared  = false;

  // ── Compute post-hit ball speed for feedback
  const mr2s2 = BALL_MASS * r * r * Math.sin(t.phi) * Math.sin(t.phi);
  const newTV = mr2s2 > 1e-8 ? t.L / mr2s2 : 0;
  res.ballSpeed  = Math.abs(newTV * r * Math.sin(t.phi));
  res.applied    = true;
  return res;
}

// ─────────────────────────────────────────────────────────────
//  SERVE
// ─────────────────────────────────────────────────────────────
export function beginServe(t: TState, who: TSide): void {
  t.theta       = who === "player" ? Math.PI * 0.52 : Math.PI * 1.52;
  t.thetaVel    = 0;
  t.phi         = 0.24;
  t.phiVel      = 0;
  t.L           = 0;
  // Wrap baseline = current theta. All wraps tracked from here forward.
  t.wrapBaseline = t.theta;
  t.wraps       = 0;
  t.ropeFree    = ROPE_MAX;
  t.wrapY       = POLE_H;
  computeBallPos(t, t.ballPos);

  t.lastHitter   = null;
  t.lastHitAt    = -99;
  t.lastHitTheta = 0;
  t.ballCleared  = true;
  t.opVY = 0;  t.opY = 0;  t.opCrouch = false;

  t.serveStage = who === "player" ? "player-hold" : "op-hold";
  t.opServing  = who === "op";
  if (who === "op") t.opServeAt = t.time + 1.8;
}

export function releaseServe(t: TState, who: TSide, dir: 1 | -1): void {
  t.serveStage = "live";
  const r      = t.ropeFree;
  const sinP   = Math.sin(t.phi);
  // Serve with enough pace to start the rally in a playable fast orbit
  const spd    = dir * 5.4;
  t.L          = spd * BALL_MASS * r * r * sinP * sinP;
  t.thetaVel   = spd;
  t.phiVel     = 0.5;
  t.lastHitter   = who;
  t.lastHitAt    = t.time;
  t.lastHitTheta = t.theta;
  t.ballCleared  = false;
}

// ─────────────────────────────────────────────────────────────
//  PREDICTOR (for AI)
//  Estimate ball XZ T seconds in the future.
// ─────────────────────────────────────────────────────────────
export function predictBallXZ(t: TState, lookahead: number): THREE.Vector2 {
  const decay  = Math.exp(-0.22 * lookahead);
  const avgL   = t.L * (1 - decay) / (0.22 + 1e-8);
  const sinP2  = Math.sin(t.phi) ** 2;
  const mr2s2  = BALL_MASS * t.ropeFree * t.ropeFree * sinP2;
  const avgTV  = mr2s2 > 1e-8 ? avgL / mr2s2 : t.thetaVel;
  const thFut  = t.theta + avgTV * lookahead;
  const wrapsF = Math.abs(thFut) / (2 * Math.PI);
  const rFut   = clamp(ROPE_MAX - wrapsF * WRAP_LOSS, ROPE_MIN, ROPE_MAX);
  const swing  = rFut * Math.sin(t.phi);
  return new THREE.Vector2(
    (POLE_R + swing) * Math.cos(thFut),
    (POLE_R + swing) * Math.sin(thFut),
  );
}
