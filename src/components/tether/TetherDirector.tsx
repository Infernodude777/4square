import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "../../game/store";
import { sfx } from "../../game/audio";
import { skillFactor, botReactionFactor, useSettings } from "../../game/settings";
import {
  beginServe,
  releaseServe,
  stepTether,
  tryHit,
  predictBallXZ,
  wouldDoubleHit,
  SHOTS,
  WIN_WRAPS,
  HEIGHT_MARK,
  R_COURT,
  BALL_HIT_RANGE,
  ROPE_MIN,
  WRAP_LOSS,
} from "../../game/tetherball";
import { TS, resetTether } from "./tetherState";

const PLAYER_GRAV = 18;

interface Input {
  fwd: boolean; back: boolean; left: boolean; right: boolean;
  crouch: boolean; jumpQ: boolean; hitQ: ("power" | "soft")[];
}
const input: Input = {
  fwd: false, back: false, left: false, right: false,
  crouch: false, jumpQ: false, hitQ: [],
};

// ── Bot personality (scaled by the global difficulty setting) ─────────
const BOT = {
  speed:       4.1,                    // confident strides but still human
  reachRadius: BALL_HIT_RANGE * 0.89, // stronger return radius
  skill:       0.75,                   // legitimately good, but not flawless
  aggression:  0.72,                   // presses the pace without being reckless
  smashMin:    1.32,                   // min ball.y to leap for a smash
  skimMax:     0.85,                   // only skims genuinely low balls
  lookahead:   0.48,                   // solid anticipation
};

/** Effective bot skill after the difficulty multiplier (0..1). */
const botSkill = () => Math.min(1, BOT.skill * skillFactor());

export function TetherDirector() {
  const { camera } = useThree();
  const prevPhase  = useRef<string>("menu");
  const look       = useRef(new THREE.Vector3(0, 1.5, -0.3));
  const camStart   = useRef(true);
  const foulCD     = useRef(0);
  const fouled     = useRef(false);
  const winTimer   = useRef<number | null>(null);

  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      const ph = useGame.getState().phase;
      if (ph !== "play" && ph !== "point") return;
      switch (e.code) {
        case "KeyW": case "ArrowUp":    input.fwd    = true; break;
        case "KeyS": case "ArrowDown":  input.back   = true; break;
        case "KeyA": case "ArrowLeft":  input.left   = true; break;
        case "KeyD": case "ArrowRight": input.right  = true; break;
        case "KeyC": case "ControlLeft": case "ControlRight": input.crouch = true; break;
        case "Space": e.preventDefault(); input.jumpQ = true; break;
      }
    };
    const ku = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW": case "ArrowUp":    input.fwd    = false; break;
        case "KeyS": case "ArrowDown":  input.back   = false; break;
        case "KeyA": case "ArrowLeft":  input.left   = false; break;
        case "KeyD": case "ArrowRight": input.right  = false; break;
        case "KeyC": case "ControlLeft": case "ControlRight": input.crouch = false; break;
      }
    };
    const pd = (e: MouseEvent) => {
      if (useGame.getState().phase !== "play") return;
      if ((e.target as HTMLElement | null)?.closest?.("button")) return;
      if (e.button === 0) input.hitQ.push("power");
      else if (e.button === 2) input.hitQ.push("soft");
    };
    const ctx = (e: Event) => e.preventDefault();
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup",   ku);
    window.addEventListener("pointerdown", pd);
    window.addEventListener("contextmenu", ctx);
    return () => {
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup",   ku);
      window.removeEventListener("pointerdown", pd);
      window.removeEventListener("contextmenu", ctx);
    };
  }, []);

  useFrame((_, delta) => {
    const dt  = Math.min(delta, 0.04);
    const st  = useGame.getState();
    if (st.mode !== "tetherball") return;

    const phase = st.phase;

    // ── Start / reset on first play frame ──────────────────────────
    if (phase === "play" && prevPhase.current !== "play" && prevPhase.current !== "point") {
      resetTether();
      beginServe(TS.current, Math.random() < 0.5 ? "player" : "op");
      camStart.current = true;
      sfx.whistle();
    }
    prevPhase.current = phase;

    if (phase !== "play" && phase !== "point") {
      cam(dt, camStart.current);
      camStart.current = false;
      return;
    }
    if (phase === "point") { cam(dt, false); return; }

    fouled.current = false;
    foulCD.current = Math.max(0, foulCD.current - dt);

    const t = TS.current;
    t.time += dt;

    // ── PLAYER ─────────────────────────────────────────────────────
    t.playerSwing    = Math.min(t.playerSwing + dt, 9);
    t.playerCooldown = Math.max(0, t.playerCooldown - dt);

    // WASD movement (camera-relative: fwd = toward pole = -Z)
    let mx = 0, mz = 0;
    if (input.fwd)   mz -= 1;
    if (input.back)  mz += 1;
    if (input.right) mx += 1;
    if (input.left)  mx -= 1;
    const ml = Math.hypot(mx, mz) || 1;
    mx /= ml; mz /= ml;
    const spd = input.crouch && t.playerY === 0 ? 2.0 : 4.2;
    t.playerPos.x += mx * spd * dt;
    t.playerPos.z += mz * spd * dt;

    // Confine to +Z half
    const CB = 0.18;
    if (t.playerPos.z < CB) {
      if (t.playerPos.z < -0.06 && foulCD.current <= 0) {
        doFoul("player", "offside");
        if (fouled.current) { cam(dt, false); return; }
      }
      t.playerPos.z = CB;
    }
    const d2 = Math.hypot(t.playerPos.x, t.playerPos.z);
    if (d2 > R_COURT - 0.3) {
      t.playerPos.x = (t.playerPos.x / d2) * (R_COURT - 0.3);
      t.playerPos.z = (t.playerPos.z / d2) * (R_COURT - 0.3);
    }
    t.playerFacing = Math.atan2(-t.playerPos.x, -t.playerPos.z); // face pole

    // Jump
    if (input.jumpQ && t.playerY === 0) { t.playerVY = 7.0; }
    input.jumpQ = false;
    t.playerCrouch = input.crouch && t.playerY === 0;
    if (t.playerY > 0 || t.playerVY !== 0) {
      t.playerY  += t.playerVY * dt;
      t.playerVY -= PLAYER_GRAV * dt;
      if (t.playerY <= 0) { t.playerY = 0; t.playerVY = 0; }
    }

    // ── AI (always running so bot moves even during serve hold) ────
    updateAI(dt);

    // ── SERVE HOLD ─────────────────────────────────────────────────
    if (t.serveStage === "player-hold") {
      positionHeldBall("player");
      while (input.hitQ.length) {
        input.hitQ.shift();
        releaseServe(t, "player", 1);
        sfx.hit(0.75);
        break;
      }
    } else if (t.serveStage === "op-hold") {
      positionHeldBall("op");
      if (t.time >= t.opServeAt) {
        releaseServe(t, "op", -1);
        sfx.hit(0.75);
      }
    } else {
      // ── LIVE PHYSICS ─────────────────────────────────────────────
      stepTether(t, dt);

      // Player swing
      while (input.hitQ.length) {
        const btn      = input.hitQ.shift()!;
        const finesse  = btn === "soft";
        const airborne = t.playerY > 0.25;
        const handY    = t.playerY + (t.playerCrouch ? 0.52 : airborne ? 1.35 : 1.18);
        const from     = new THREE.Vector3(t.playerPos.x, 0, t.playerPos.z);
        const res = tryHit(
          t, "player", from, handY,
          t.playerCrouch, airborne, t.playerVY, finesse,
        );
        if (res.foul) {
          doFoul("player", res.foul);
          if (fouled.current) { cam(dt, false); return; }
          break;
        }
        if (res.applied) {
          t.playerSwing = 0;
          const def = SHOTS[res.kind];
          const tone =
            res.kind === "smash"   ? "red"    :
            res.kind === "skimmer" ? "cyan"   :
            res.kind === "loft"    ? "purple" :
            res.kind === "dink"    ? "green"  :
            res.kind === "mistime" ? "red"    : "white";
          st.popup(res.kind === "mistime" ? "TOO EARLY!" : `${def.name}!`, tone as never);
          if (res.perfect) st.popup("PERFECT TIMING", "gold", true);
          sfx.hit(res.quality);
          if (res.kind === "smash")   sfx.smash();
          if (res.kind === "skimmer") sfx.skimmer();
          if (res.kind === "loft" && res.perfect) sfx.perfect();
          t.shake = res.kind === "smash" ? 0.7 : 0.2;
        }
      }
      if (fouled.current) { cam(dt, false); return; }

      // Bot swing
      botSwing();
      if (fouled.current) { cam(dt, false); return; }

      // ── WIN CHECK ──
      // Actual wrap means: wraps accumulated in one direction ≥ WIN_WRAPS
      // AND the free rope has genuinely been consumed (not just loosely
      // orbiting but physically wrapped on the pole) AND that tight wrap
      // finishes at or above the yellow height mark.
      //
      // Target free-rope for a legal wrap at WIN_WRAPS:
      //   target = pole_top   - height_mark  = 3.05 - 1.52 = 1.53 m
      //   If ropeFree is much above that, the rope is slack — NOT wrapped.
      const wrapsAbs      = Math.abs(t.wraps);
      const ropeNearMin  = t.ropeFree <= (WIN_WRAPS * WRAP_LOSS + ROPE_MIN + 0.15);
      // e.g. for 5 wraps: 5*0.239 + 0.30 + 0.15 ≈ 1.60 m free rope
      // (rope physically wrapped 5 full turns around the 10 ft pole)
      const aboveMark     = t.wrapY >= HEIGHT_MARK - 0.06;
      const trulyAWin     = wrapsAbs >= WIN_WRAPS && ropeNearMin && aboveMark;
      if (trulyAWin) {
        if (winTimer.current === null) {
          const pWins = t.wraps > 0;
          st.popup(pWins ? "WRAP! YOU WIN! 🏆" : "WRAPPED OUT — YOU LOSE", pWins ? "gold" : "red", true);
          if (pWins) { st.addScore(10); sfx.win(); } else sfx.fault();
          st.setPhase("point");
          winTimer.current = window.setTimeout(() => {
            const g = useGame.getState();
            // Guard: if the player quit or restarted during the delay, don't
            // fire a win / yank them back into a match.
            if (g.mode !== "tetherball" || g.phase !== "point") { winTimer.current = null; return; }
            if (pWins) { g.win(); }
            else { resetTether(); beginServe(TS.current, "player"); g.setPhase("play"); }
            winTimer.current = null;
          }, 1900);
        }
      }
    }

    cam(dt, camStart.current);
    camStart.current = false;
  });

  // ── Position the ball in the server's hand ─────────────────────
  function positionHeldBall(who: "player" | "op") {
    const t   = TS.current;
    const pos = who === "player" ? t.playerPos : t.opPos;
    const dr0 = Math.hypot(pos.x, pos.z);
    const nx  = dr0 > 0.01 ? pos.x / dr0 : 0;
    const nz  = dr0 > 0.01 ? pos.z / dr0 : (who === "player" ? 1 : -1);
    const bx  = pos.x - nx * 0.5;
    const bz  = pos.z - nz * 0.5;
    t.ballPos.set(bx, 1.08, bz);
    t.ballVel.set(0, 0, 0);
    t.theta    = Math.atan2(bz, bx);
    t.wrapY    = 3.05;
    const dr   = Math.hypot(bx, bz);
    t.phi      = Math.min(Math.PI * 0.44, Math.atan2(dr, t.wrapY - 1.08));
    t.ropeFree = Math.max(1.4, Math.hypot(dr, t.wrapY - 1.08));
    t.wraps    = 0;
    t.wrapBaseline = t.theta;
    t.L        = 0;
  }

  // ── FOUL ───────────────────────────────────────────────────────
  function doFoul(who: "player" | "op", kind: string) {
    if (foulCD.current > 0) return;
    foulCD.current = 1.4;
    fouled.current = true;
    const st = useGame.getState();
    st.addFoul(who);
    const lbl =
      kind === "pole"    ? "TOUCHED POLE"  :
      kind === "double"  ? "DOUBLE HIT"    :
      kind === "carry"   ? "CARRY"         : "OFF-SIDES";
    if (who === "player") {
      st.popup(`FOUL · ${lbl}`, "red", true);
      st.addScore(-2);
      sfx.fault();
      resetTether(); beginServe(TS.current, "op");
    } else {
      st.popup(`BOT FOUL · ${lbl}`, "green");
      st.addScore(3);
      sfx.cheer();
      resetTether(); beginServe(TS.current, "player");
    }
  }

  // ── AI MOVEMENT ────────────────────────────────────────────────
  function updateAI(dt: number) {
    const t = TS.current;
    t.opSwing    = Math.min(t.opSwing + dt, 9);
    t.opCooldown = Math.max(0, t.opCooldown - dt);

    if (t.serveStage === "op-hold" || t.serveStage === "player-hold") return;

    const ball  = t.ballPos;
    const ballZ = ball.z;

    let targetX = 0, targetZ = -1.65;

    if (ballZ < 1.0) {
      // Ball is heading toward bot half — predict intercept
      const lookahead = t.serveStage === "live" ? BOT.lookahead : 0.3;
      const pred = predictBallXZ(t, lookahead);

      // Bot ideally stands on the line from pole to predicted ball,
      // at a comfortable striking radius
      const predDist = Math.hypot(pred.x, pred.y);
      if (predDist > 0.1) {
        const ang    = Math.atan2(pred.y, pred.x);
        const radius = clamp(predDist * 0.75, 1.0, R_COURT - 0.4);
        targetX = Math.cos(ang) * radius;
        targetZ = Math.sin(ang) * radius;
        // Keep bot in their half
        if (targetZ > -0.2) targetZ = -0.2;
      }
    }

    // Move toward target
    const dx  = targetX - t.opPos.x;
    const dz  = targetZ - t.opPos.z;
    const dd  = Math.hypot(dx, dz);
    if (dd > 0.04) {
      const step = Math.min(dd, BOT.speed * dt);
      t.opPos.x += (dx / dd) * step;
      t.opPos.z += (dz / dd) * step;
    }
    // Confine to -Z half
    if (t.opPos.z > -0.18) t.opPos.z = -0.18;
    const opR = Math.hypot(t.opPos.x, t.opPos.z);
    if (opR > R_COURT - 0.3) {
      t.opPos.x = (t.opPos.x / opR) * (R_COURT - 0.3);
      t.opPos.z = (t.opPos.z / opR) * (R_COURT - 0.3);
    }
    // Always face pole
    t.opFacing = Math.atan2(-t.opPos.x, -t.opPos.z);

    // ── Bot crouching decision: drop for low balls BEFORE they arrive.
    // Predict where the ball is heading rather than just reacting to it.
    const pred = predictBallXZ(t, BOT.lookahead * 0.6);
    const predY = Math.max(t.ballPos.y, t.ballPos.y - t.phiVel * BOT.lookahead * 0.3);
    if (t.opY === 0 && t.opVY === 0) {
      const ballLow   = predY < BOT.skimMax + 0.20;
      const ballClose = ball.z < 1.2;  // allow wider radius to prepare posture
      t.opCrouch = ballLow && ballClose && !wouldDoubleHit(t, "op");
    } else {
      t.opCrouch = false;
    }

    // ── Bot jump: only attempt when a high ball is genuinely heading
    // toward the bot's half AND the bot is in a good position for it.
    // Don't jump if we're still re-arming (double-hit rule) or already airborne.
    if (t.opY === 0 && t.opVY === 0 && !wouldDoubleHit(t, "op") && t.serveStage === "live") {
      const ballHigh   = predY > BOT.smashMin + 0.05;
      const ballClosing = ball.z < 1.2;
      const botNear    = Math.hypot(pred.x - t.opPos.x, pred.y - t.opPos.z) < BOT.reachRadius + 1.35;
      if (ballHigh && ballClosing && botNear && Math.random() < BOT.aggression * 0.16) {
        t.opVY = 7.0;
      }
    }
    // Integrate bot jump
    if (t.opY > 0 || t.opVY !== 0) {
      t.opY  += t.opVY * dt;
      t.opVY -= PLAYER_GRAV * dt;
      if (t.opY <= 0) { t.opY = 0; t.opVY = 0; }
    }
  }

  function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

  // ── BOT HIT ────────────────────────────────────────────────────
  // Tactically reads situation: ball height, player position, posture.
  // Executes the same full shot arsenal the player has.
  function botSwing() {
    const t = TS.current;
    if (t.opCooldown > 0) return;
    if (wouldDoubleHit(t, "op")) return;

    const ball  = t.ballPos;
    if (ball.z > 0.10) return;  // wait until clearly in bot's half

    // Predict whether ball will be in reach within the next few frames
    // (prevents "zipped just past" misses from pure position checks)
    const predShort  = predictBallXZ(t, 0.07);
    const dNow       = Math.hypot(ball.x - t.opPos.x, ball.z - t.opPos.z);
    const dSoon      = Math.hypot(predShort.x - t.opPos.x, predShort.y - t.opPos.z);
    if (Math.min(dNow, dSoon) > BOT.reachRadius) return;

    const airborne = t.opY > 0.25;
    const crouched = t.opCrouch;
    const roll     = Math.random();

    // Human-like reaction error. REX sometimes commits a little early or
    // simply whiffs a fast ball instead of returning every shot perfectly.
    const incomingSpeed = t.ballVel.length();
    const missChance = 0.04 + Math.min(0.12, incomingSpeed * 0.006) + (1 - botSkill()) * 0.09;
    if (Math.random() < missChance) {
      t.opSwing = 0;
      t.opCooldown = (0.42 + Math.random() * 0.22) * botReactionFactor();
      return;
    }

    // Tactical finesse choice driven by player position:
    const playerDist    = Math.hypot(t.playerPos.x, t.playerPos.z);
    const playerClose   = playerDist < 1.55;   // player blocking near pole
    const playerFar     = playerDist > 2.20;   // player lunging at the wall
    // Base finesse probability higher when player is close (bypass them)
    let useFinesse = false;
    if (!airborne) {
      if (playerClose && roll < 0.38)     useFinesse = true;
      if (playerFar   && roll < 0.30)     useFinesse = true;
      // Small skill-based variance
      if (roll < botSkill() * 0.15)        useFinesse = !useFinesse;
    }

    let handY = 1.12;
    if (airborne) {
      if (t.opVY > -0.25) return;  // wait for descent!
      handY = t.opY + 1.40;
    } else if (crouched) {
      handY = 0.45;
    }

    // Imperfect contact height: most hits are decent, some are notably late.
    // Very fast balls create more timing error.
    const timingJitter = 0.10 + (1 - botSkill()) * 0.28 + Math.min(0.16, incomingSpeed * 0.008);
    handY += (Math.random() - 0.5) * timingJitter * 1.6;

    // Execution is usually 55–85%. Only about 4% of attempts can become
    // genuinely perfect, even if ball height and distance are ideal.
    const rareClutch = Math.random() < 0.06;
    const execution = rareClutch
      ? 0.93 + Math.random() * 0.06
      : 0.55 + Math.random() * (botSkill() * 0.52);

    const from = new THREE.Vector3(t.opPos.x, 0, t.opPos.z);
    const res  = tryHit(
      t, "op", from, handY, crouched, airborne, t.opVY, useFinesse, execution,
    );
    finishBotSwing(res);
  }

  function finishBotSwing(res: ReturnType<typeof tryHit>) {
    const t = TS.current;
    if (res.applied) {
      t.opSwing    = 0;
      t.opCooldown = (0.36 + Math.random() * 0.22) * botReactionFactor();
      const st     = useGame.getState();
      const def    = SHOTS[res.kind];
      const colMap: Record<string, string> = {
        smash: "#ff5a3c", skimmer: "#38d6d0",
        loft: "#b58cff",  dink: "#8ae06b", drive: "#f4c542",
      };
      // Only call out special moves; normal drives stay visually quiet.
      if (res.kind !== "drive") {
        st.popup(`REX: ${def.name}!`, (colMap[res.kind] ?? "#ffffff") as never);
      }
      if (res.perfect) st.popup("REX PERFECT!", "gold", true);
      sfx.botHit();
      if (res.kind === "smash")   sfx.smash();
      if (res.kind === "skimmer") sfx.skimmer();
      if (res.kind === "loft" && res.perfect) sfx.perfect();
      t.shake = res.kind === "smash" ? 0.72 : res.kind === "skimmer" ? 0.38 : 0.14;
    } else if (res.foul) {
      doFoul("op", res.foul);
    } else {
      // Bot takes a longer breather on whiffs so it doesn't spam
      t.opCooldown = 0.30;
    }
  }

  // ── CAMERA ─────────────────────────────────────────────────────
  // High 3/4 isometric view: sits at roughly 45° behind player, 7 m up.
  // Pans slightly to follow the ball's X swing and the player's position.
  function cam(dt: number, snap: boolean) {
    const t = TS.current;
    // Elevated wide shot — follows the ball's orbit around the pole.
    // The camera stays on the player's half but reads depth across the
    // whole court, so you can track the ball and see both players clearly.

    const playerTheta = Math.atan2(t.playerPos.z, t.playerPos.x);
    const ballTheta   = Math.atan2(t.ballPos.z,   t.ballPos.x);
    // camTheta is the CAMERA'S angular position around the pole (not a unit
    // direction, an actual world-space orbit). We blend the player's position
    // with the ball's position so the camera tracks the rally naturally.
    // Since player is on +Z side we want camera on +Z side as well:
    //  playerTheta is atan2( +Z, X) for player at z>0  → angle from X-axis = π/2
    // So camTheta is π/2-ish. For circle: camera position = (cos θ, +Z side).
    // cos π/2 = 0 → camera X = 0 (behind pole). Correct: camera sits
    // behind the player shoulder, orbiting to follow the ball.
    // Small ball influence — camera sweeps gently rather than fully orbiting
    // every rally which would be disorienting at speed
    const camTheta = playerTheta * 0.82 + ballTheta * 0.18;

    const dist = 5.8;
    const cy   = 6.6;
    const cx   =  Math.cos(camTheta) * dist;
    const cz   =  Math.sin(camTheta) * dist;   // no negation! player is at +Z

    // Look at midpoint of pole axis and ball — keeps the pole in view
    // (for context/reference) while tracking the ball for action
    const lx = t.ballPos.x * 0.42;
    const ly = Math.max(0.55, Math.min(2.8, t.ballPos.y * 0.35 + 0.68));
    // Slight bias toward the ball's Z but cap at 1 m so camera
    // doesn't look wildly away from the pole centre region
    const lz = Math.max(-1.0, Math.min(1.0, t.ballPos.z * 0.28));

    if (snap) {
      camera.position.set(cx, cy, cz);
      look.current.set(lx, ly, lz);
    } else {
      const k  = 1 - Math.exp(-dt * 3.8);
      const k2 = 1 - Math.exp(-dt * 5.5);
      camera.position.x += (cx - camera.position.x) * k;
      camera.position.y += (cy - camera.position.y) * k;
      camera.position.z += (cz - camera.position.z) * k;
      look.current.x    += (lx - look.current.x) * k2;
      look.current.y    += (ly - look.current.y) * k2;
      look.current.z    += (lz - look.current.z) * k2;
    }
    if (t.shake > 0) {
      if (useSettings.getState().screenShake) {
        camera.position.x += (Math.random() - 0.5) * t.shake * 0.22;
        camera.position.y += (Math.random() - 0.5) * t.shake * 0.18;
      }
      t.shake = Math.max(0, t.shake - dt * 2.0);
    }
    camera.lookAt(look.current);


  }

  return null;
}
