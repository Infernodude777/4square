import * as THREE from "three";
import {
  GRAVITY,
  LINE_SPOT,
  MOVES,
  BOTS,
  Q_HALF,
  SQ_CENTER,
  TARGET_SCORE,
  sqOf,
  squareAt,
  type EntityId,
  type MoveId,
} from "./constants";
import { RT, burst, setFace, type Leg } from "./refs";
import { useGame } from "./store";
import { sfx } from "./audio";
import { skillFactor } from "./settings";
import { say } from "./banter";
import { isMoveBanned, pickRule, ruleBotMul, ruleName, ruleScoreMul, ruleSpeedMul } from "./rules";

const g = () => useGame.getState();

/**
 * How many clean exchanges the current rally has survived. Used to trigger
 * the "long rally" banter so the bots only chirp when a rally actually goes
 * somewhere.
 */
let rallyStreak = 0;

export function nameOf(id: EntityId): string {
  return id === "player" ? "YOU" : BOTS[id].name;
}

export function occupantOf(sq: number): EntityId | null {
  return (g().assign[sq] as EntityId) ?? null;
}

export function playerSquare(): number {
  return sqOf("player", g().assign);
}

export function kingId(): EntityId {
  return g().assign[4];
}

// solve launch velocity so the ball lands on (tx,tz) after T seconds
function solveVel(from: THREE.Vector3, tx: number, tz: number, T: number, out: THREE.Vector3) {
  out.set((tx - from.x) / T, (0 - from.y) / T + 0.5 * GRAVITY * T, (tz - from.z) / T);
}

function gauss(s: number) {
  return (Math.random() + Math.random() + Math.random() - 1.5) * s;
}

export function predictLanding(px: number, py: number, pz: number, vx: number, vy: number, vz: number) {
  const t = (vy + Math.sqrt(vy * vy + 2 * GRAVITY * Math.max(0.01, py - 0.16))) / GRAVITY;
  return { x: px + vx * t, z: pz + vz * t, t };
}

// ── rally lifecycle ─────────────────────────────────────────────
export function startRally() {
  const king = kingId();
  RT.leg = null;
  RT.bursts.length = 0;
  const ball = RT.ball;
  ball.curve = 0;
  ball.grounded = 0;

  // Season 3 — KING'S RULES: before every serve the king calls a house
  // rule. 40% of the time it keeps the standing one; otherwise it flips
  // to something new, and the whole court hears about it. The banter line
  // only joins in when the popup stack has room, so a rule flip never
  // crowds out a knockout banner.
  const prevRule = g().rule;
  const nextRule = pickRule(prevRule);
  if (nextRule !== prevRule) {
    g().setRule(nextRule);
    g().popup(`KING CALLS · ${ruleName(nextRule)}`, "gold");
    if (g().popups.length < 2) say("rule", "white");
  }

  // everyone drifts home
  (Object.keys(RT.entities) as EntityId[]).forEach((id) => {
    const e = RT.entities[id];
    const sq = sqOf(id, g().assign);
    if (sq === 0) e.target.set(LINE_SPOT[0], 0, LINE_SPOT[1]);
    else {
      const c = SQ_CENTER[sq];
      e.target.set(c[0], 0, c[1]);
    }
    e.plan = null;
    if (e.face === "out") setFace(id, "idle", 0.2);
  });

  if (king === "player") {
    RT.serveStage = "hold";
    ball.active = true;
    ball.visible = true;
    ball.vel.set(0, 0, 0);
  } else {
    RT.serveStage = "idle";
    const e = RT.entities[king];
    e.serveTimer = RT.time + 1.1;
    setFace(king, "serve", 3);
  }
  sfx.whistle();
  rallyStreak = 0;
  if (Math.random() < 0.28) say("serve");
  g().rallyInc();
}

export function beginMatch() {
  startRally();
}

function newLeg(hitter: EntityId, move: MoveId, quality: number, isServe = false): Leg {
  const leg: Leg = {
    hitter,
    isServe,
    serveBounced: false,
    firstBounced: false,
    receiver: null,
    move,
    quality,
    createdAt: RT.time,
    done: false,
  };
  RT.leg = leg;
  RT.ball.move = move;
  RT.ball.grounded = 0;
  RT.ball.curve = 0;
  return leg;
}

// ── faults ──────────────────────────────────────────────────────
export function resolveOut(loser: EntityId) {
  const leg = RT.leg;
  if (!leg || leg.done) return;
  leg.done = true;
  const st = g();
  rallyStreak = 0;
  setFace(loser, "out", 3);
  RT.entities[loser].plan = null;

  const youLost = loser === "player";
  const youCaused = leg.hitter === "player" && !youLost;
  const mul = ruleScoreMul(g().rule); // Season 3: DOUBLE POINTS court

  if (youLost) {
    say("botKo", "red", true);
    st.addScore(-3);
    st.popup("-3 · SENT TO THE LINE", "red", true);
    sfx.fault();
    RT.shake = 0.9;
  } else {
    if (youCaused) {
      st.addScore(5 * mul);
      st.registerKO();
      st.popup(`KNOCKOUT +5 · ${nameOf(loser)}`, "green", true);
      sfx.cheer();
      setFace("player", "happy", 1.6);
      if (g().score >= TARGET_SCORE) {
        // Match-ending KO: the win line is the star — skip the extra chirp so
        // the three-popup display cap doesn't crowd out the knockout.
        say("win", "gold", true);
        setTimeout(() => {
          const st = useGame.getState();
          if (st.phase === "play" || st.phase === "point") st.win();
        }, 1600);
      } else {
        say("ko", "green");
      }
    } else {
      st.popup(`${nameOf(loser)} OUT`, "white");
      sfx.fault();
      if (Math.random() < 0.3) say("taunt");
    }
  }

  st.setPhase("point");
  burst("dust", RT.ball.pos, "#c9c2b2");

  setTimeout(() => {
    if (useGame.getState().phase !== "point") return;
    g().rotate(loser);
    useGame.setState({ phase: "play" });
    startRally();
  }, 2100);
}

// ── bounces ─────────────────────────────────────────────────────
export function onBounce(s: number | null, impact: number) {
  const leg = RT.leg;
  if (!leg || leg.done) return;
  sfx.bounce(Math.min(9, impact));

  // ── serve: must bounce once in the server's own square
  if (leg.isServe && !leg.serveBounced) {
    const serverSq = sqOf(leg.hitter, g().assign);
    if (s === serverSq) {
      leg.serveBounced = true;
      if (leg.hitter === "player") {
        RT.serveStage = "armed";
      } else {
        const e = RT.entities[leg.hitter];
        e.serveTimer = RT.time + 0.22 + Math.random() * 0.2;
      }
    } else {
      // illegal serve bounce → re-toss
      if (leg.hitter === "player") {
        g().popup("SERVE MUST BOUNCE IN YOUR SQUARE", "red");
        say("fault", "red");
        RT.serveStage = "hold";
        RT.leg = null;
        RT.ball.vel.set(0, 0, 0);
      } else {
        botToss(leg.hitter);
      }
    }
    return;
  }

  // ── first bounce of a normal leg decides the receiver
  if (!leg.firstBounced) {
    const hitterSq = sqOf(leg.hitter, g().assign);
    if (s === null) {
      resolveOut(leg.hitter);
      return;
    }
    if (s === hitterSq) {
      resolveOut(leg.hitter);
      return;
    }
    leg.firstBounced = true;
    leg.receiver = occupantOf(s);
    burst("dust", RT.ball.pos, "#b7b0a0");

    if (leg.hitter === "player") {
      const perfect = leg.quality >= 0.85;
      st_addHitScore(perfect);
      g().registerHit(perfect);
      if (g().score >= TARGET_SCORE) {
        say("win", "gold", true);
        leg.done = true;
        setTimeout(() => {
          const st = useGame.getState();
          if (st.phase === "play" || st.phase === "point") st.win();
        }, 1100);
        return;
      }
    }

    // receiver prep
    const recv = leg.receiver;
    if (recv && recv !== "player") {
      planBotReturn(recv, leg.move, impact);
      setFace(recv, "alert", 2.2);
    }

    // A clean exchange survived — count it, and let the bots call out
    // genuinely long rallies instead of every little point.
    if (!leg.isServe) {
      rallyStreak += 1;
      if (rallyStreak >= 4) {
        rallyStreak = 0;
        say("rally");
      }
    }
    return;
  }

  // ── second bounce anywhere = receiver failed
  if (leg.receiver) resolveOut(leg.receiver);
}

function st_addHitScore(perfect: boolean) {
  const mul = ruleScoreMul(g().rule); // Season 3: DOUBLE POINTS court
  if (perfect) {
    g().addScore(3 * mul);
    g().popup("PERFECT! +3", "gold", true);
    sfx.perfect();
  } else {
    g().addScore(1 * mul);
    g().popup("+1", "white");
  }
}

// ── bot brains ──────────────────────────────────────────────────
function chooseBotTarget(botSq: number): number {
  const candidates = [1, 2, 3, 4].filter((s) => s !== botSq);
  const weighted: number[] = [];
  candidates.forEach((s) => {
    const occupant = occupantOf(s);
    let weight = 3;
    if (occupant === "player") weight += 4;
    if (s === 4) weight += 1; // pressure the king
    for (let i = 0; i < weight; i++) weighted.push(s);
  });
  return weighted[Math.floor(Math.random() * weighted.length)];
}

function tacticalAim(targetSq: number, move: MoveId, sigma: number): THREE.Vector3 {
  const center = SQ_CENTER[targetSq];
  const occupant = occupantOf(targetSq);
  let awayX = Math.random() - 0.5;
  let awayZ = Math.random() - 0.5;

  if (occupant) {
    const defender = RT.entities[occupant].pos;
    awayX = center[0] - defender.x;
    awayZ = center[1] - defender.z;
  }
  const len = Math.hypot(awayX, awayZ) || 1;
  const placement = move === "drop" ? 1.35 : move === "skimmer" ? 1.18 : 0.95;
  const x = center[0] + (awayX / len) * placement + gauss(sigma);
  const z = center[1] + (awayZ / len) * placement + gauss(sigma);
  return new THREE.Vector3(
    Math.max(center[0] - 1.62, Math.min(center[0] + 1.62, x)),
    0,
    Math.max(center[1] - 1.62, Math.min(center[1] + 1.62, z)),
  );
}

function planBotReturn(bot: Exclude<EntityId, "player">, incoming: MoveId, impact: number) {
  const def    = BOTS[bot];
  const e      = RT.entities[bot];
  const isKing = sqOf(bot, g().assign) === 4;
  // Season 3: the standing house rule can pep the bots up.
  const skill  = Math.min(1, def.skill * skillFactor() * ruleBotMul(g().rule));

  let missChance = 0.07 + (1 - skill) * 0.22;
  if (incoming === "skimmer") missChance += 0.07;
  if (incoming === "smash")   missChance += 0.10;
  if (incoming === "drop")    missChance += 0.06;
  if (incoming === "lob")     missChance -= 0.04;
  if (isKing)                 missChance -= 0.04;
  if (impact > 11)            missChance += 0.05;
  missChance = Math.min(0.42, Math.max(0.018, missChance));

  const roll  = Math.random();
  const ballY = RT.ball.pos.y;
  let move: MoveId = "drive";
  if (ballY > 1.20 && roll < def.aggression * 0.35)      move = "smash";
  else if (ballY < 0.80 && roll < def.aggression * 0.58) move = "skimmer";
  else if (roll < def.aggression * 0.72)                  move = "skimmer";
  else if (roll < 0.82)                                   move = "drive";
  else if (roll < 0.94 && ballY < 1.60)                   move = "lob";
  else                                                    move = "drop";
  if (move === "smash" && ballY < 1.0) move = "drive";
  // King-mode escape lob under heavy spin
  if (isKing && Math.hypot(RT.ball.vel.x, RT.ball.vel.z) > 8.5 && roll < 0.18) move = "lob";
  // Season 3: respect the king's rule — never plan a banned stroke.
  if (isMoveBanned(g().rule, move)) move = "drive";

  const botSq = sqOf(bot, g().assign);
  const tSq = chooseBotTarget(botSq);
  const tc = SQ_CENTER[tSq];
  const sigma = (1 - skill) * 0.58 + MOVES[move].err * 0.85;

  const willMiss = Math.random() < missChance;
  let aim: THREE.Vector3;
  if (willMiss) {
    // aim horribly: into own square or over the fence
    if (Math.random() < 0.5) {
      const bc = SQ_CENTER[botSq];
      aim = new THREE.Vector3(bc[0] + gauss(0.5), 0, bc[1] + gauss(0.5));
    } else {
      const dir = new THREE.Vector3(tc[0] - RT.ball.pos.x, 0, tc[1] - RT.ball.pos.z).normalize();
      aim = new THREE.Vector3(RT.ball.pos.x + dir.x * (7.5 + Math.random() * 3), 0, RT.ball.pos.z + dir.z * (7.5 + Math.random() * 3));
    }
  } else {
    aim = tacticalAim(tSq, move, sigma);
    const asq = squareAt(aim.x, aim.z);
    if (asq === botSq || asq === null) aim.set(tc[0] + gauss(sigma * 0.5), 0, tc[1] + gauss(sigma * 0.5));
  }

  e.plan = {
    miss: willMiss,
    whiff: willMiss && Math.random() < 0.26,
    move,
    aim,
    react: 0.025 + (1 - skill) * 0.22 + Math.random() * 0.065,
    bounceAt: RT.time,
  };
}

export function botServeHit(bot: Exclude<EntityId, "player">) {
  const botSq = sqOf(bot, g().assign);
  const tSq = chooseBotTarget(botSq);
  const move: MoveId = Math.random() < 0.18 ? "lob" : Math.random() < 0.35 ? "skimmer" : "drive";
  const skill = Math.min(1, BOTS[bot].skill * skillFactor() * ruleBotMul(g().rule));
  const sigma = (1 - skill) * 0.48;
  const quality = 0.70 + skill * 0.25;
  fireShot(bot, move, tacticalAim(tSq, move, sigma), quality);
  setFace(bot, "hit", 0.8);
}

export function playerToss() {
  const p = RT.entities.player;
  newLeg("player", "drive", 0.7, true);
  RT.serveStage = "tossed";
  const b = RT.ball;
  b.active = true;
  b.visible = true;
  b.pos.set(p.pos.x + Math.sin(p.facing) * 0.4, 1.0, p.pos.z + Math.cos(p.facing) * 0.4);
  b.vel.set(Math.sin(p.facing) * 0.85 + gauss(0.15), 4.4, Math.cos(p.facing) * 0.85 + gauss(0.15));
}

export function botToss(bot: EntityId) {
  const e = RT.entities[bot];
  const sq = sqOf(bot, g().assign);
  const c = SQ_CENTER[sq];
  newLeg(bot, "drive", 0.7, true);
  RT.serveStage = "tossed";
  const b = RT.ball;
  b.active = true;
  b.visible = true;
  b.pos.set(e.pos.x, 1.25, e.pos.z);
  b.vel.set((c[0] - e.pos.x) * 0.35 + gauss(0.2), 4.1, (c[1] - e.pos.z) * 0.35 + gauss(0.2));
  RT.leg!.serveBounced = false;
}

function fireShot(hitter: EntityId, move: MoveId, target: THREE.Vector3, quality: number) {
  const md = MOVES[move];
  const from = RT.ball.pos.clone();
  // Season 3: LIGHTNING COURT shrinks every flight time — swing faster.
  const T = md.T * (1 + (1 - quality) * 0.22) * ruleSpeedMul(g().rule);
  solveVel(from, target.x, target.z, T, RT.ball.vel);
  // clamps
  const v = RT.ball.vel;
  const sp = Math.hypot(v.x, v.z);
  const maxSp = move === "smash" ? 15 : move === "skimmer" ? 12.5 : 11;
  if (sp > maxSp) {
    v.x *= maxSp / sp;
    v.z *= maxSp / sp;
  }
  if (move === "smash" && v.y > 2.5) v.y = 2.5;
  newLeg(hitter, move, quality);
}

export function botHit(bot: Exclude<EntityId, "player">) {
  const e = RT.entities[bot];
  if (!e.plan) return;
  const plan = e.plan;
  e.plan = null;
  e.swing = 0;
  if (plan.move === "smash") e.y = Math.max(e.y, 0.55);
  const baseQuality = 0.62 + Math.min(1, BOTS[bot].skill * skillFactor()) * 0.32;
  fireShot(bot, plan.move, plan.aim, baseQuality);
  setFace(bot, "hit", 0.9);
  burst("hit", RT.ball.pos, MOVES[plan.move].color);
  sfx.botHit();
}

// ── the player's swing ──────────────────────────────────────────
export function humanHit(kind: "power" | "soft") {
  const st = g();
  if (st.phase !== "play") return;
  const p = RT.entities.player;
  if (p.hitCooldown > 0) return;
  const leg = RT.leg;
  const ball = RT.ball;
  p.hitCooldown = 0.35;

  const hdist = Math.hypot(ball.pos.x - p.pos.x, ball.pos.z - p.pos.z);
  const HIT_RANGE = 1.50;   // matches the under-ring radius so visual = detection
  const canServe = !!leg && leg.isServe && leg.serveBounced && leg.hitter === "player" && !leg.done;
  const canReturn =
    !!leg && !leg.done && !leg.isServe && leg.firstBounced && leg.receiver === "player";
  const inReach = hdist < HIT_RANGE && ball.pos.y > 0.04 && ball.pos.y < p.y + (p.crouch ? 1.35 : 2.25);

  if ((!canServe && !canReturn) || !inReach || !ball.active) {
    // whiff
    p.swing = 0;
    RT.shake = Math.max(RT.shake, 0.12);
    return;
  }

  // pick the move from posture
  let move: MoveId;
  let weak = false;
  if (kind === "soft") move = "drop";
  else if (p.crouch) move = "skimmer";
  else if (p.y > 0.3) {
    if (ball.pos.y - p.y > 1.05) move = "smash";
    else {
      move = "drive";
      weak = true;
    }
  } else if (RT.input.lob) move = "lob";
  else move = "drive";

  // Season 3 — the king's rule: a banned stroke is an instant fault.
  // resolveOut() plays the fault sound and handles the rotation, so we
  // just announce the rule and hand off.
  if (isMoveBanned(g().rule, move)) {
    g().popup(`RULE! ${ruleName(g().rule)} — YOU'RE OUT`, "red", true);
    say("fault", "red");
    resolveOut("player");
    return;
  }

  const md = MOVES[move];
  const relH = ball.pos.y - p.y;
  // Single source of truth — idealY lives on the move definition (see L6).
  const ideal = md.idealY;
  let q = 1 - Math.min(1, Math.abs(relH - ideal) / md.win);
  q *= Math.min(1, Math.max(0.25, 1.15 - hdist / 1.9));
  if (weak) q *= 0.5;
  q = Math.min(1, Math.max(0.05, q));

  // aim point (drop shots die just over the nearest line)
  const aim = RT.aim.clone();
  const mySq = playerSquare();
  if (move === "drop") {
    const c = SQ_CENTER[mySq];
    const dir = new THREE.Vector3(aim.x - c[0], 0, aim.z - c[1]);
    if (dir.lengthSq() < 0.001) dir.set(0, 0, 1);
    dir.normalize();
    aim.set(c[0] + dir.x * (Q_HALF + 1.25), 0, c[1] + dir.z * (Q_HALF + 1.25));
  }
  const sigma = md.err * (1.7 - q) + (1 - q) * 0.55;
  aim.x += gauss(sigma);
  aim.z += gauss(sigma);

  fireShot("player", move, aim, q);

  // curve spin from strafe keys
  const side = (RT.input.right ? 1 : 0) - (RT.input.left ? 1 : 0);
  RT.ball.curve = side * 3.4;

  // juice
  p.swing = 0;
  setFace("player", "hit", 0.7);
  RT.lastHitInfo = { move, quality: q, at: RT.time };
  burst(q >= 0.85 ? "perfect" : "hit", ball.pos, md.color);
  sfx.hit(q);
  if (move === "skimmer") sfx.skimmer();
  if (move === "smash") {
    sfx.smash();
    RT.shake = 0.7;
  }

  if (move !== "drive" || q >= 0.85)
    st.popup(`${MOVES[move].name}!`, move === "smash" ? "red" : move === "skimmer" ? "cyan" : move === "lob" ? "purple" : "green");
  if (q < 0.35) st.popup("SHANKED…", "red");
  else if (q >= 0.85) st.popup("PERFECT TIMING", "gold");
  if (q >= 0.85 && Math.random() < 0.5) say("perfect", "gold");
}
