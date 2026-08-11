import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  BOTS,
  BALL_R,
  COURT_HALF,
  GRAVITY,
  LINE_SPOT,
  MOVES,
  Q_HALF,
  SQ_CENTER,
  squareAt,
  sqOf,
  type EntityId,
} from "../game/constants";
import { RT } from "../game/refs";
import { useGame } from "../game/store";
import { useSettings } from "../game/settings";
import {
  beginMatch,
  botHit,
  botServeHit,
  botToss,
  humanHit,
  kingId,
  onBounce,
  playerSquare,
  playerToss,
  resolveOut,
  predictLanding,
} from "../game/logic";

const BOT_IDS: Exclude<EntityId, "player">[] = ["ada", "alan", "grace", "turing"];
const ray = new THREE.Raycaster();
const planeY0 = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const ndc = new THREE.Vector2();
const tmpV = new THREE.Vector3();
const fwd = new THREE.Vector3();
const rgt = new THREE.Vector3();
const dir = new THREE.Vector3();

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function Director() {
  const { camera } = useThree();
  const prevPhase = useRef("menu");
  const jumpQ = useRef(false);
  const look = useRef(new THREE.Vector3(0, 1, 0));
  const lastVib = useRef(-9);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const ph = useGame.getState().phase;
      if (ph !== "play" && ph !== "point") return;
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          RT.input.fwd = true;
          break;
        case "KeyS":
        case "ArrowDown":
          RT.input.back = true;
          break;
        case "KeyA":
        case "ArrowLeft":
          RT.input.left = true;
          break;
        case "KeyD":
        case "ArrowRight":
          RT.input.right = true;
          break;
        case "KeyC":
        case "ControlLeft":
        case "ControlRight":
          RT.input.crouch = true;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          RT.input.lob = true;
          break;
        case "Space":
          e.preventDefault();
          jumpQ.current = true;
          break;
      }
    };
    const up = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          RT.input.fwd = false;
          break;
        case "KeyS":
        case "ArrowDown":
          RT.input.back = false;
          break;
        case "KeyA":
        case "ArrowLeft":
          RT.input.left = false;
          break;
        case "KeyD":
        case "ArrowRight":
          RT.input.right = false;
          break;
        case "KeyC":
        case "ControlLeft":
        case "ControlRight":
          RT.input.crouch = false;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          RT.input.lob = false;
          break;
      }
    };
    const move = (e: MouseEvent) => {
      RT.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      RT.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    const pd = (e: MouseEvent) => {
      if (useGame.getState().phase !== "play") return;
      if ((e.target as HTMLElement | null)?.closest?.("button")) return;
      if (e.button === 0) RT.hitQueue.push("power");
      else if (e.button === 2) RT.hitQueue.push("soft");
    };
    const ctx = (e: Event) => e.preventDefault();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("mousemove", move);
    window.addEventListener("pointerdown", pd);
    window.addEventListener("contextmenu", ctx);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("pointerdown", pd);
      window.removeEventListener("contextmenu", ctx);
    };
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.045);
    RT.time += dt;
    const st = useGame.getState();
    const phase = st.phase;

    if (phase === "play" && (prevPhase.current === "menu" || prevPhase.current === "win")) {
      beginMatch();
    }
    prevPhase.current = phase;

    const playing = phase === "play" || phase === "point";
    const p = RT.entities.player;
    const b = RT.ball;
    const pSq = playerSquare();

    // ── aim raycast (always, for reticle)
    // Aim sensitivity scales the reticle's offset from screen centre, so a
    // higher setting sweeps the court with less mouse travel (clamped to
    // the viewport so the aim can't fly off-screen).
    const sens = useSettings.getState().aimSensitivity;
    ndc.set(clamp(RT.mouse.x * sens, -1, 1), clamp(RT.mouse.y * sens, -1, 1));
    ray.setFromCamera(ndc, camera);
    if (ray.ray.intersectPlane(planeY0, tmpV)) {
      RT.aim.set(clamp(tmpV.x, -16, 16), 0, clamp(tmpV.z, -16, 16));
    }
    const as = squareAt(RT.aim.x, RT.aim.z);
    RT.aimLegal = pSq > 0 && as !== null && as !== pSq;

    if (!playing) {
      b.visible = false;
      updateCamera(dt, pSq, false);
      return;
    }

    // ── hits queued this frame
    while (RT.hitQueue.length) {
      const kind = RT.hitQueue.shift()!;
      if (phase !== "play") continue;
      if (RT.serveStage === "hold" && kingId() === "player") {
        playerToss();
        continue;
      }
      humanHit(kind);
    }

    // ── player controller
    p.hitCooldown -= dt;
    p.swing += dt;
    if (RT.time > p.faceUntil && p.face !== "idle") p.face = "idle";

    if (phase === "play" && pSq > 0) {
      const c = SQ_CENTER[pSq];
      fwd.set(-camera.position.x, 0, -camera.position.z);
      if (fwd.lengthSq() < 0.01) fwd.set(0, 0, 1);
      fwd.normalize();
      rgt.set(-fwd.z, 0, fwd.x);
      dir.set(0, 0, 0);
      if (RT.input.fwd) dir.add(fwd);
      if (RT.input.back) dir.sub(fwd);
      if (RT.input.right) dir.add(rgt);
      if (RT.input.left) dir.sub(rgt);
      p.moving = dir.lengthSq() > 0.01;
      if (p.moving) {
        dir.normalize();
        const sp = RT.input.crouch && p.y === 0 ? 1.8 : 3.9;
        p.pos.addScaledVector(dir, sp * dt);
        p.walkPhase += dt * 10;
      }
      p.pos.x = clamp(p.pos.x, c[0] - Q_HALF + 0.34, c[0] + Q_HALF - 0.34);
      p.pos.z = clamp(p.pos.z, c[1] - Q_HALF + 0.34, c[1] + Q_HALF - 0.34);
      if (jumpQ.current && p.y === 0) p.vy = 6.7;
      p.crouch = RT.input.crouch && p.y === 0;
      p.facing = Math.atan2(RT.aim.x - p.pos.x, RT.aim.z - p.pos.z);
    } else {
      p.moving = false;
      p.crouch = false;
      if (pSq === 0) {
        // shuffle to the line
        const dx = LINE_SPOT[0] - p.pos.x;
        const dz = LINE_SPOT[1] - p.pos.z;
        const d = Math.hypot(dx, dz);
        p.moving = d > 0.1;
        if (p.moving) {
          const step = Math.min(d, 2.5 * dt);
          p.pos.x += (dx / d) * step;
          p.pos.z += (dz / d) * step;
          p.walkPhase += dt * 8;
        }
        p.facing = Math.atan2(-p.pos.x, -p.pos.z);
      } else {
        p.facing = Math.atan2(RT.aim.x - p.pos.x, RT.aim.z - p.pos.z);
      }
    }
    jumpQ.current = false;
    if (p.y > 0 || p.vy !== 0) {
      p.y += p.vy * dt;
      p.vy -= GRAVITY * dt;
      if (p.y <= 0) {
        p.y = 0;
        p.vy = 0;
      }
    }

    // ── bots
    BOT_IDS.forEach((bot) => {
      const e = RT.entities[bot];
      const def = BOTS[bot];
      const sq = sqOf(bot, st.assign);
      e.hitCooldown -= dt;
      e.swing += dt;
      if (RT.time > e.faceUntil && e.face !== "idle") e.face = "idle";

      const leg = RT.leg;
      let tx = e.target.x;
      let tz = e.target.z;
      let speed = def.speed * 0.55;

      if (phase === "play") {
        if (!leg && kingId() === bot && RT.time > e.serveTimer) {
          botToss(bot);
        }
        if (leg && leg.isServe && leg.hitter === bot && leg.serveBounced && RT.time > e.serveTimer) {
          const hd = Math.hypot(b.pos.x - e.pos.x, b.pos.z - e.pos.z);
          if (hd < 1.9 && b.pos.y < 1.75 && b.pos.y > 0.05) botServeHit(bot);
          else {
            tx = b.pos.x;
            tz = b.pos.z;
            speed = def.speed;
          }
        } else if (leg && !leg.done && leg.firstBounced && leg.receiver === bot) {
          // Intercept the NEXT bounce instead of chasing the ball's current
          // position. This lets bots get under smashes, drops and skimmers.
          const landing = predictLanding(
            b.pos.x, b.pos.y, b.pos.z,
            b.vel.x, b.vel.y, b.vel.z,
          );
          const c = SQ_CENTER[sq];
          tx = clamp(landing.x, c[0] - Q_HALF + 0.3, c[0] + Q_HALF - 0.3);
          tz = clamp(landing.z, c[1] - Q_HALF + 0.3, c[1] + Q_HALF - 0.3);
          speed = def.speed * 1.38;

          // Prepare the correct body position before contact.
          e.crouch = !!e.plan && e.plan.move === "skimmer" && b.pos.y < 0.95 && e.y === 0;
          if (
            e.plan?.move === "smash" && e.y === 0 && b.pos.y > 1.25 &&
            b.vel.y < 1.4 && Math.hypot(b.pos.x - e.pos.x, b.pos.z - e.pos.z) < 2.65
          ) {
            e.vy = 5.9;
          }
          if (e.plan && RT.time > e.plan.bounceAt + e.plan.react) {
            const hd = Math.hypot(b.pos.x - e.pos.x, b.pos.z - e.pos.z);
            if (hd < 2.05 && b.pos.y > 0.04 && b.pos.y < e.y + 2.45) {
              if (e.plan.whiff) {
                e.swing = 0;
                e.plan = null;
              } else botHit(bot);
            }
          }
        } else {
          e.crouch = false;
          const c = sq > 0 ? SQ_CENTER[sq] : LINE_SPOT;
          const bx = b.active ? clamp((b.pos.x - c[0]) * 0.24, -1.1, 1.1) : 0;
          const bz = b.active ? clamp((b.pos.z - c[1]) * 0.24, -1.1, 1.1) : 0;
          tx = c[0] + bx;
          tz = c[1] + bz;
        }
      } else {
        const c = sq > 0 ? SQ_CENTER[sq] : LINE_SPOT;
        tx = c[0];
        tz = c[1];
      }

      const dx = tx - e.pos.x;
      const dz = tz - e.pos.z;
      const d = Math.hypot(dx, dz);
      e.moving = d > 0.07;
      if (e.moving) {
        const step = Math.min(d, speed * dt);
        e.pos.x += (dx / d) * step;
        e.pos.z += (dz / d) * step;
        e.walkPhase += dt * 9.5;
      }
      if (sq > 0) {
        const c = SQ_CENTER[sq];
        e.pos.x = clamp(e.pos.x, c[0] - Q_HALF + 0.28, c[0] + Q_HALF - 0.28);
        e.pos.z = clamp(e.pos.z, c[1] - Q_HALF + 0.28, c[1] + Q_HALF - 0.28);
      } else {
        e.pos.x = clamp(e.pos.x, LINE_SPOT[0] - 0.7, LINE_SPOT[0] + 0.7);
        e.pos.z = clamp(e.pos.z, LINE_SPOT[1] - 0.7, LINE_SPOT[1] + 0.7);
      }
      if (e.y > 0 || e.vy !== 0) {
        e.y += e.vy * dt;
        e.vy -= GRAVITY * dt;
        if (e.y <= 0) {
          e.y = 0;
          e.vy = 0;
        }
      }
      if (b.active) e.facing = Math.atan2(b.pos.x - e.pos.x, b.pos.z - e.pos.z);
    });

    // ── ball
    if (RT.serveStage === "hold" && kingId() === "player" && phase === "play") {
      b.active = true;
      b.visible = true;
      b.pos.set(p.pos.x + Math.sin(p.facing) * 0.42, 0.95, p.pos.z + Math.cos(p.facing) * 0.42);
      b.vel.set(0, 0, 0);
    } else if (b.active) {
      b.vel.y -= GRAVITY * dt;
      const legC = RT.leg;
      if (legC && !legC.firstBounced && b.curve !== 0 && b.pos.y > BALL_R + 0.02) {
        const hx = b.vel.x;
        const hz = b.vel.z;
        const hl = Math.hypot(hx, hz) || 1;
        b.vel.x += (-hz / hl) * b.curve * dt;
        b.vel.z += (hx / hl) * b.curve * dt;
      }
      b.pos.addScaledVector(b.vel, dt);

      if (b.pos.y <= BALL_R && b.vel.y < 0) {
        const impact = -b.vel.y;
        b.pos.y = BALL_R;
        if (impact > 0.9) {
          const md = MOVES[b.move];
          b.vel.y = impact * md.rest;
          b.vel.x *= md.fric;
          b.vel.z *= md.fric;
          b.curve = 0;
          if (b.vel.y < 0.55) b.vel.y = 0;
          onBounce(squareAt(b.pos.x, b.pos.z), impact);
        } else {
          b.vel.y = 0;
        }
      }

      // rolling / dead ball
      if (b.pos.y <= BALL_R + 0.006 && Math.abs(b.vel.y) < 0.05) {
        const f = Math.max(0, 1 - 1.7 * dt);
        b.vel.x *= f;
        b.vel.z *= f;
        if (b.grounded >= 0) b.grounded += dt;
        const outC = Math.abs(b.pos.x) > COURT_HALF + 0.4 || Math.abs(b.pos.z) > COURT_HALF + 0.4;
        const legR = RT.leg;
        if ((b.grounded > 1.1 || outC) && b.grounded >= 0 && legR && !legR.done) {
          b.grounded = -1;
          if (legR.isServe && !legR.serveBounced) {
            if (legR.hitter === "player") {
              RT.leg = null;
              RT.serveStage = "hold";
              b.vel.set(0, 0, 0);
              st.popup("TOSS IT INTO YOUR OWN SQUARE", "red");
            } else botToss(legR.hitter);
          } else if (legR.firstBounced && legR.receiver) {
            resolveOut(legR.receiver);
          } else {
            resolveOut(legR.hitter);
          }
        }
      } else if (b.grounded > 0 && b.pos.y > BALL_R + 0.12) {
        b.grounded = 0;
      }

      // rattle the chain-link fence
      if (b.pos.y < 2.25) {
        if (Math.abs(b.pos.x) > 12.85) {
          b.pos.x = Math.sign(b.pos.x) * 12.85;
          b.vel.x *= -0.35;
        }
        if (Math.abs(b.pos.z) > 12.85) {
          b.pos.z = Math.sign(b.pos.z) * 12.85;
          b.vel.z *= -0.35;
        }
      }

      // shot clock
      const legT = RT.leg;
      if (legT && !legT.done && RT.time - legT.createdAt > 9) {
        if (legT.isServe && !legT.serveBounced) {
          if (legT.hitter === "player") {
            RT.leg = null;
            RT.serveStage = "hold";
          } else botToss(legT.hitter);
        } else if (legT.firstBounced && legT.receiver) {
          resolveOut(legT.receiver);
        } else {
          resolveOut(legT.hitter);
        }
      }
    }

    updateCamera(dt, pSq, true);
  });

  function updateCamera(dt: number, pSq: number, active: boolean): void {
    const b = RT.ball;
    let cx: number, cy: number, cz: number, lx: number, ly: number, lz: number;
    if (pSq > 0) {
      const c = SQ_CENTER[pSq];
      const ol = Math.hypot(c[0], c[1]) || 1;
      const ox = c[0] / ol;
      const oz = c[1] / ol;
      cx = c[0] + ox * 6.6;
      cy = 4.5;
      cz = c[1] + oz * 6.6;
      lx = -c[0] * 0.18;
      ly = 1.0;
      lz = -c[1] * 0.18;
    } else {
      cx = -9.6;
      cy = 5.6;
      cz = -9.6;
      lx = 0;
      ly = 0.9;
      lz = 0;
    }
    if (active && b.active && b.pos.y > -5) {
      lx = lx * 0.68 + b.pos.x * 0.32;
      lz = lz * 0.68 + b.pos.z * 0.32;
      ly = ly * 0.6 + Math.max(0.6, Math.min(2.1, b.pos.y * 0.5 + 0.55)) * 0.4;
    }
    const k = 1 - Math.exp(-dt * 3.4);
    const k2 = 1 - Math.exp(-dt * 5.2);
    camera.position.x += (cx - camera.position.x) * k;
    camera.position.y += (cy - camera.position.y) * k;
    camera.position.z += (cz - camera.position.z) * k;
    look.current.x += (lx - look.current.x) * k2;
    look.current.y += (ly - look.current.y) * k2;
    look.current.z += (lz - look.current.z) * k2;
    if (RT.shake > 0) {
      if (useSettings.getState().screenShake) {
        camera.position.x += (Math.random() - 0.5) * RT.shake * 0.28;
        camera.position.y += (Math.random() - 0.5) * RT.shake * 0.2;
        // Buzz on big impacts (smash, KO) — once per hit, haptics only.
        if (
          typeof navigator !== "undefined" &&
          typeof navigator.vibrate === "function" &&
          RT.shake > 0.6 &&
          RT.time - lastVib.current > 0.5
        ) {
          navigator.vibrate(12);
          lastVib.current = RT.time;
        }
      }
      RT.shake = Math.max(0, RT.shake - dt * 1.8);
    }
    camera.lookAt(look.current);
  }

  return null;
}
