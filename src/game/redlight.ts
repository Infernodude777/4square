// ─────────────────────────────────────────────────────────────
//  RED LIGHT, GREEN LIGHT — the recess reflex duel (Season 2)
//
//  A lane race against three robots with one cruel rule: move on
//  the red light and you burn a heart. Three hearts a round, best
//  of three rounds, first to two round-wins takes the match.
//
//  The pure logic below owns every rule — light cycling, faults,
//  bot reaction AI, round and match flow — so the React render
//  layer stays dumb and the whole game is unit-testable.
// ─────────────────────────────────────────────────────────────

export type RLLight = "green" | "red";
export type RLPhase = "intro" | "countdown" | "running" | "roundEnd" | "matchEnd";
export type Difficulty = "chill" | "classic" | "fierce";

export const RL_START_Z = 7.5;   // back line (south)
export const RL_FINISH_Z = -7.5; // finish line (north)
export const RL_HEARTS = 3;      // faults before a round is lost
export const RL_ROUNDS_TO_WIN = 2;
export const RL_MAX_ROUNDS = 3;

export interface RLRunner {
  id: string;
  isPlayer: boolean;
  z: number;          // progress down the lane (start → finish)
  faults: number;     // faults THIS round
  out: boolean;       // eliminated this round (hearts gone)
  roundWins: number;  // rounds won across the match
  moving: boolean;    // currently attempting to move
  speed: number;      // how fast this runner travels (bots scale by difficulty)
  reaction: number;   // bots: remaining "caught moving on red" time
  stun: number;       // forced stop time after a fault
  /** bots: already caught once during this red phase (no double comedy) */
  caughtRed: boolean;
}

export interface RLStepEvents {
  lightChanged: RLLight | null;
  fault: boolean;         // the PLAYER faulted
  botCaught: string | null; // a bot got caught moving on red (comedy!)
  roundWin: string | null;  // who won this round ("player" | bot id)
  matchWin: boolean;      // the player won the match
  matchLose: boolean;     // the player lost the match
}

export interface RLState {
  phase: RLPhase;
  time: number;
  round: number;
  roundEndTimer: number;
  light: RLLight;
  lightTimer: number;
  countdown: number;    // 3 → 2 → 1 → 0 (GO)
  runners: RLRunner[];
  playerHearts: number;
  banner: string;
  bannerAt: number;
  roundWinner: string | null;
  difficulty: Difficulty;
}

// ── difficulty tuning ─────────────────────────────────────────
const DIFF: Record<Difficulty, { green: [number, number]; red: [number, number]; botSpeed: number; reaction: number; caughtDelay: number }> = {
  chill:   { green: [3.4, 5.2],  red: [1.7, 2.7],  botSpeed: 2.55, reaction: 0.55, caughtDelay: 0.55 },
  classic: { green: [2.6, 4.2],  red: [1.2, 2.2],  botSpeed: 2.95, reaction: 0.80, caughtDelay: 0.32 },
  fierce:  { green: [2.0, 3.4],  red: [0.9, 1.8],  botSpeed: 3.35, reaction: 0.95, caughtDelay: 0.16 },
};

export const PLAYER_SPEED = 3.5;

const BOT_IDS = ["rex", "ziggy", "ada"];

export function createRLState(difficulty: Difficulty = "classic"): RLState {
  const botSpeed = DIFF[difficulty].botSpeed;
  return {
    phase: "intro",
    time: 0,
    round: 1,
    roundEndTimer: 0,
    light: "green",
    lightTimer: 3,
    countdown: 3,
    runners: [
      { id: "player", isPlayer: true, z: RL_START_Z, faults: 0, out: false, roundWins: 0, moving: false, speed: PLAYER_SPEED, reaction: 0, stun: 0, caughtRed: false },
      ...BOT_IDS.map((id) => ({
        id, isPlayer: false, z: RL_START_Z, faults: 0, out: false, roundWins: 0,
        moving: false, speed: botSpeed * (0.94 + Math.random() * 0.12), reaction: 0, stun: 0, caughtRed: false,
      })),
    ],
    playerHearts: RL_HEARTS,
    banner: "",
    bannerAt: 0,
    roundWinner: null,
    difficulty,
  };
}

function pick(lo: number, hi: number) {
  return lo + Math.random() * (hi - lo);
}

function runner(t: RLState, id: string) {
  return t.runners.find((r) => r.id === id)!;
}

/** Start the countdown for a round (fresh lanes, fresh hearts). */
export function rlBeginRound(t: RLState) {
  t.roundWinner = null;
  t.roundEndTimer = 0;
  for (const r of t.runners) {
    r.z = RL_START_Z;
    r.faults = 0;
    r.out = false;
    r.moving = false;
    r.reaction = 0;
    r.stun = 0;
    r.caughtRed = false;
  }
  t.playerHearts = RL_HEARTS;
  t.countdown = 3;
  t.light = "green";
  t.lightTimer = pick(...DIFF[t.difficulty].green);
  t.phase = "countdown";
  t.banner = `ROUND ${t.round} OF ${RL_MAX_ROUNDS}`;
  t.bannerAt = t.time;
}

/**
 * Advance the state by dt seconds. The `input.moving` flag is the
 * player's live "W is held" signal. Returns a compact event list so
 * the director can fire popups and sounds without reading internals.
 */
export function rlStep(t: RLState, dt: number, input: { moving: boolean }): RLStepEvents {
  const ev: RLStepEvents = { lightChanged: null, fault: false, botCaught: null, roundWin: null, matchWin: false, matchLose: false };
  t.time += dt;
  const d = DIFF[t.difficulty];

  if (t.phase === "intro") {
    if (t.time > 0.4) rlBeginRound(t);
    return ev;
  }

  if (t.phase === "countdown") {
    t.countdown -= dt;
    if (t.countdown <= 0) {
      t.phase = "running";
      t.light = "green";
      t.lightTimer = pick(...d.green);
      t.banner = "GREEN LIGHT — GO!";
      t.bannerAt = t.time;
      ev.lightChanged = "green";
    }
    return ev;
  }

  if (t.phase === "roundEnd" || t.phase === "matchEnd") {
    t.roundEndTimer -= dt;
    if (t.phase === "roundEnd" && t.roundEndTimer <= 0) rlBeginRound(t);
    return ev;
  }

  // ── running: the light cycle ──
  t.lightTimer -= dt;
  if (t.lightTimer <= 0) {
    if (t.light === "green") {
      t.light = "red";
      t.lightTimer = pick(...d.red);
      t.banner = "RED LIGHT — STOP!";
      t.bannerAt = t.time;
      ev.lightChanged = "red";
    } else {
      t.light = "green";
      t.lightTimer = pick(...d.green);
      t.banner = "GREEN LIGHT — GO!";
      t.bannerAt = t.time;
      ev.lightChanged = "green";
      for (const r of t.runners) r.caughtRed = false;
    }
  }

  // ── the player ──
  const player = runner(t, "player");
  if (player.stun > 0) player.stun -= dt;
  player.moving = input.moving && player.stun <= 0 && !player.out;

  if (player.moving && t.light === "red") {
    // Caught! One fault per red phase.
    player.faults += 1;
    t.playerHearts -= 1;
    player.z += 1.6; // shoved back toward the start
    player.stun = 0.55;
    ev.fault = true;
    if (t.playerHearts <= 0) {
      player.out = true;
      player.moving = false;
      t.banner = "OUT — TOO BOLD FOR THE LIGHT!";
      t.bannerAt = t.time;
    }
  }
  if (player.moving && t.light === "green") {
    player.z -= player.speed * dt;
  }
  player.z = Math.min(RL_START_Z, Math.max(RL_FINISH_Z, player.z));

  // ── the bots ──
  for (const b of t.runners) {
    if (b.isPlayer || b.out) continue;
    if (t.light === "green") {
      b.moving = true;
      b.z -= b.speed * dt;
    } else if (b.reaction > 0) {
      // Still "caught" from a late stop — keep sliding a beat.
      b.reaction -= dt;
      b.moving = true;
      b.z -= b.speed * dt;
      if (b.reaction <= 0) {
        b.moving = false;
        b.caughtRed = true;
        ev.botCaught = b.id;
      }
    } else if (b.caughtRed) {
      b.moving = false; // already decided this red phase
    } else if (Math.random() < d.reaction) {
      // Reacted in time — lock in a clean stop for the rest of this red.
      // (Previously this re-rolled every frame, so a "stopped" bot could
      // randomly break into a sprint again, and the odds depended on the
      // host's frame rate.)
      b.moving = false;
      b.caughtRed = true;
    } else {
      b.reaction = pick(d.caughtDelay * 0.5, d.caughtDelay); // late reaction
    }
    b.z = Math.min(RL_START_Z, Math.max(RL_FINISH_Z, b.z));
  }

  // ── round / match resolution ──
  const playerFinished = player.z <= RL_FINISH_Z && !player.out;
  const botFinished = t.runners.find((r) => !r.isPlayer && !r.out && r.z <= RL_FINISH_Z);

  if (playerFinished || botFinished) {
    const winner = playerFinished ? "player" : botFinished!.id;
    runner(t, winner).roundWins += 1;
    t.roundWinner = winner;
    t.round += 1;
    t.roundEndTimer = 2.4;
    t.phase = "roundEnd";
    ev.roundWin = winner;

    const playerWins = runner(t, "player").roundWins;
    const bestBot = Math.max(...t.runners.filter((r) => !r.isPlayer).map((r) => r.roundWins));
    if (playerWins >= RL_ROUNDS_TO_WIN) {
      t.phase = "matchEnd";
      ev.matchWin = true;
    } else if (bestBot >= RL_ROUNDS_TO_WIN || t.round > RL_MAX_ROUNDS) {
      t.phase = "matchEnd";
      ev.matchLose = playerWins < RL_ROUNDS_TO_WIN;
    }
  }

  return ev;
}

/** Convenience for the director: what the traffic light should show. */
export function lightColor(t: RLState): "green" | "red" | "off" {
  if (t.phase === "countdown") return "green";
  if (t.phase === "running") return t.light;
  return "off";
}

/** True once the player's match result is decided. */
export function rlMatchDecided(t: RLState): boolean {
  return t.phase === "matchEnd";
}
