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

const g = () => useGame.getState();

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
  setFace(loser, "out", 3);
  RT.entities[loser].plan = null;

    const youLost = loser === "player";
  const youCaused = leg.hitter === "player" && !youLost;

  if (youLost) {
    st.addScore(-3);
    st.popup("-3 · SENT TO THE LINE", "red", true);
        sfx.fault();
    RT.shake = 0.9;
  } else {
    if (youCaused) {
      st.addScore(5);
      st.registerKO();
      st.popup(`KNOCKOUT +5 · ${nameOf(loser)}`, "green", true);
      sfx.cheer();
      setFace("player", "happy", 1.6);
      if (g().score >= TARGET_SCORE) {
                setTimeout(() => g().win(), 1600);
      }
    } else {
      st.popup(`${nameOf(loser)} OUT`, "white");
      sfx.fault();
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
      resolveOut(leg.bohitter);
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
        leg.done = true;
        setTimeout(() => g().win(), 1100);
        return;
      }
    }

    // receiver prep
    const recv = leg.receiver;
    if (recv && recv !== "player") {
      planBotReturn(recv, leg.move, impact);
            setFace(recv, "alert", 2.2);
    } else if (recv === "player") {

    }
    return;
}

  // ── second bounce anywhere = receiver failed
  if (leg.receiver) resolveOut(leg.receiver);
}

function st_addHitScore(perfect: boolean) {
  if (perfect) {
    g().addScore(3);
    g().popup("PERFECT! +3", "gold", true);
    sfx.perfect();
  } else {
        g().addScore(1);
    g().popup("+1", "white");
  }
}

// ── bot brains ──────────────────────────────────────────────────
function planBotReturn(bot: Exclude<EntityId, "player">, incoming: MoveId, impact: number) {
  const def = BOTS[bot];
  const e = RT.entities[bot];
  const isKing = sqOf(bot, g().assign) === 4;
  let miss = 0.1 + (1 - def.skill) * 0.38;
  if (incoming === "skimmer") miss += 0.15;
  if (incoming === "smash") miss += 0.22;
  if (incoming === "drop") miss += 0.13;
  if (incoming === "lob") miss -= 0.06;
  if (isKing) miss -= 0.05;
  if (impact > 11) miss += 0.06;
    miss = Math.min(0.62, Math.max(0.05, miss));

  const roll = Math.random();
  let move: MoveId = "drive";
  if (roll < def.aggression * 0.3) move = "smash";
  else if (roll < def.aggression * 0.62) move = "skimmer";
  else if (roll < 0.78) move = "drive";
  else if (roll < 0.92) move = "lob";
    else move = "drop";
  if (move === "smash" && RT.ball.pos.y < 1.0) move = "drive";

  const botSq = sqOf(bot, g().assign);
  const targets = [1, 2, 3, 4].filter((s) => s !== botSq);
  // bots like picking on you a little
  const weighted: number[] = [];
  targets.forEach((s) => {
    weighted.push(s);
    if (occupantOf(s) === "player") weighted.push(s, s);
  });
  const tSq = weighted[Math.floor(Math.random() * weighted.length)];
  const tc = SQ_CENTER[tSq];
  const sigma = (1 - def.skill) * 1.15 + MOVES[move].err * 1.6;

  const willMiss = Math.random() < miss;
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
        aim = new THREE.Vector3(tc[0] + gauss(sigma), 0, tc[1] + gauss(sigma));
    const asq = squareAt(aim.x, aim.z);
    if (asq === botSq || asq === null) aim.set(tc[0] + gauss(sigma * 0.5), 0, tc[1] + gauss(sigma * 0.5));
}

  e.plan = {
    miss: willMiss,
    whiff: willMiss && Math.random() < 0.55,
    move,
    aim,
    react: 0.1 + Math.random() * 0.22,
    bounceAt: RT.time,
  };
}

export function botServeHit(bot: Exclude<EntityId, "player">) {
  const botSq = sqOf(bot, g().assign);
  const targets = [1, 2, 3, 4].filter((s) => s !== botSq);
  const tSq = targets[Math.floor(Math.random() * targets.length)];
  const tc = SQ_CENTER[tSq];
  const move: MoveId = Math.random() < 0.3 ? "lob" : "drive";
  const sigma = (1 - BOTS[bot].skill) * 1.0;
  fireShot(bot, move, new THREE.Vector3(tc[0] + gauss(sigma), 0, tc[1] + gauss(sigma)), 0.7);
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
  const T = md.T * (1 + (1 - quality) * 0.22);
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
  fireShot(bot, plan.move, plan.aim, BOTS[bot].skill);
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
  const canServe = !!leg && leg.isServe && leg.serveBounced && leg.hitter === "player" && !leg.done;
  const canReturn =
    !!leg && !leg.done && !leg.isServe && leg.firstBounced && leg.receiver === "player";
  const inReach = hdist < 1.95 && ball.pos.y > 0.04 && ball.pos.y < p.y + (p.crouch ? 1.35 : 2.25);

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

  const md = MOVES[move];
  const relH = ball.pos.y - p.y;
  let ideal = md.idealY;
  if (move === "smash") ideal = 1.6;
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
}

  }
  }
    }
}
}
  }
}
}
}
}
  }}
    }
    }
  }
  })
}
  }
  }
}
    }
    }
      }
    }
        }
    }
  }
      }
      }
    }
      }
      }
    }
  }
    }
        })
      }
    }
  }
  }
}
  }
}
}
  }
  }    }
  })
}
}
}
}
}
}
}
}
}