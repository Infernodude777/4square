import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "../../game/store";
import { sfx } from "../../game/audio";
import { say } from "../../game/banter";
import { skillFactor, useSettings } from "../../game/settings";
import {
  COURT_HALF_W, COURT_DEPTH, WALL_Z, WIN_SCORE, SHOTS,
  stepWall, tryHit, beginServe, predictLanding, callFoul, clamp,
  type WallState,
} from "../../game/wallball";
import { WS, resetWall } from "./wallballState";

const PLAYER_GRAV = 18;

interface Input {
  fwd: boolean; back: boolean; left: boolean; right: boolean;
  crouch: boolean; shift: boolean; jumpQ: boolean; hitQ: ("power" | "soft")[];
}
const input: Input = {
  fwd: false, back: false, left: false, right: false,
  crouch: false, shift: false, jumpQ: false, hitQ: [],
};

// ZIGGY — grandmaster playground wallball expert
const BOT = {
  speed:     5.4,   // agile, fast footwork
  reach:     2.1,   // full reach matching player's reach
  skill:     0.92,  // high skill and execution quality
  clearOut:  1.8,   // steps aside smartly after hitting
};

/** Effective bot skill after the difficulty multiplier (0..1). */
const botSkill = () => Math.min(1, BOT.skill * skillFactor());

/** The yard notices when a rally really gets going (fires once per rally). */
function maybeRallyLine(t: WallState) {
  if (t.rallyLength === 5) say("rally");
}

export function WallDirector() {
  const { camera } = useThree();
  const phase     = useGame((s) => s.phase);
  const prevPhase = useRef("hub");
  const camSnap   = useRef(true);
  const camLook   = useRef(new THREE.Vector3(0, 1.4, WALL_Z));
  const winTimer  = useRef<number | null>(null);
  const dtRef     = useRef(0.016);
  const mouseNDC  = useRef(new THREE.Vector2());
  const raycaster = useRef(new THREE.Raycaster());
  const groundPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));

  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if (useGame.getState().phase !== "play") return;
      switch (e.code) {
        case "KeyW": case "ArrowUp":    input.fwd = true; break;
        case "KeyS": case "ArrowDown":  input.back = true; break;
        case "KeyA": case "ArrowLeft":  input.left = true; break;
        case "KeyD": case "ArrowRight": input.right = true; break;
        case "KeyC": case "ControlLeft": case "ControlRight": input.crouch = true; break;
        case "ShiftLeft": case "ShiftRight": input.shift = true; break;
        case "Space": e.preventDefault(); input.jumpQ = true; break;
      }
    };
    const ku = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW": case "ArrowUp":    input.fwd = false; break;
        case "KeyS": case "ArrowDown":  input.back = false; break;
        case "KeyA": case "ArrowLeft":  input.left = false; break;
        case "KeyD": case "ArrowRight": input.right = false; break;
        case "KeyC": case "ControlLeft": case "ControlRight": input.crouch = false; break;
        case "ShiftLeft": case "ShiftRight": input.shift = false; break;
      }
    };
    const mm = (e: MouseEvent) => {
      mouseNDC.current.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1,
      );
    };
    const pd = (e: MouseEvent) => {
      if (useGame.getState().phase !== "play") return;
      if ((e.target as HTMLElement | null)?.closest?.("button")) return;
      if (e.button === 0) input.hitQ.push("power");
      else if (e.button === 2) input.hitQ.push("soft");
    };
    const ctx = (e: Event) => e.preventDefault();
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    window.addEventListener("mousemove", mm);
    window.addEventListener("pointerdown", pd);
    window.addEventListener("contextmenu", ctx);
    return () => {
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("pointerdown", pd);
      window.removeEventListener("contextmenu", ctx);
    };
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.04);
    dtRef.current = dt;
    const st = useGame.getState();
    if (st.mode !== "wallball") return;

    // First frame of a match
    if (phase === "play" && prevPhase.current !== "play" && prevPhase.current !== "point") {
      resetWall();
      beginServe(WS.current, "player");
      camSnap.current = true;
      sfx.whistle();
    }
    prevPhase.current = phase;

    if (phase !== "play" && phase !== "point") {
      doCam(true);
      camSnap.current = false;
      return;
    }

    const t = WS.current;
    t.time += dt;
    t.shake = Math.max(0, t.shake - dt * 2.0);

    // ── Between points
    if (t.phase === "point") {
      stepWall(t, dt);
      updateBot(t, dt, true);
      movePlayer(t, dt);
      if (t.pointTimer <= 0) beginServe(t, t.server);
      doCam(false);
      return;
    }

    // ── Match over
    if (t.phase === "won") {
      if (winTimer.current === null) {
        const youWon = t.playerScore >= WIN_SCORE;
        t.banner = youWon ? "GAME — YOU WIN" : "GAME — ZIGGY WINS";
        t.bannerSub = `${t.playerScore} – ${t.opScore}`;
        t.bannerAt = t.time;
        say(youWon ? "win" : "lose", youWon ? "gold" : "red", true);
        // Stash the real match tally for the victory screen.
        st.setWallResult(t.playerScore, t.opScore);
        if (youWon) { st.addScore(10); sfx.win(); } else sfx.fault();
        st.setPhase("point");
        winTimer.current = window.setTimeout(() => {
          const g = useGame.getState();
          // Guard: if the player quit or restarted during the delay, don't
          // fire a win / yank them back into a match.
          if (g.mode !== "wallball" || g.phase !== "point") { winTimer.current = null; return; }
          if (youWon) g.win();
          else { resetWall(); beginServe(WS.current, "player"); g.setPhase("play"); }
          winTimer.current = null;
        }, 2400);
      }
      doCam(false);
      return;
    }

    // ── Update aim world position via raycasting onto the blacktop ──
    raycaster.current.setFromCamera(mouseNDC.current, camera);
    const hit = new THREE.Vector3();
    raycaster.current.ray.intersectPlane(groundPlane.current, hit);
    if (hit) {
      // Clamp inside the court so the reticle never floats outside the lines.
      t.aimPos.set(
        clamp(hit.x, -COURT_HALF_W + 0.3, COURT_HALF_W - 0.3),
        0,
        clamp(hit.z, WALL_Z + 0.5, COURT_DEPTH - 0.3),
      );
    }

    movePlayer(t, dt);
    stepWall(t, dt);
    updateBot(t, dt, false);

    // ── Player strikes
    while (input.hitQ.length) {
      const btn      = input.hitQ.shift()!;
      const finesse  = btn === "soft";
      const airborne = t.playerY > 0.25;
      const handY    = t.playerY + (t.playerCrouch ? 0.50 : airborne ? 1.32 : 1.08);
      const hand     = new THREE.Vector3(t.playerPos.x, handY, t.playerPos.z);
      const res = tryHit(
        t, "player", hand,
        t.playerCrouch, airborne, t.playerVY, finesse,
        1, input.shift,
      );
      if (res.foul) {
        // Fouls surface through the big centre banner — no extra popup noise.
        if (res.foul !== "turn") callFoul(t, "player", res.foul);
        break;
      }
      if (res.applied) {
        t.playerSwing = 0;
        st.rallyInc();
        maybeRallyLine(t);
        // Shot name already lives on the timing meter; only celebrate a
        // genuinely perfect strike.
        if (res.perfect) { st.popup("PERFECT", "gold", true); sfx.perfect(); say("perfect", "gold"); }
        sfx.hit(res.quality);
        if (res.kind === "smash")  { sfx.smash(); t.shake = 0.6; }
        if (res.kind === "bomb")   { sfx.smash(); t.shake = 0.5; }
        if (res.kind === "scrapie" || res.kind === "slice") sfx.skimmer();
        if (res.kind === "moonball" || res.kind === "roofer") sfx.perfect();
        break;
      }
    }

    doCam(camSnap.current);
    camSnap.current = false;
  });

  // ── Player movement — free roam of the whole court ─────────
  function movePlayer(t: WallState, dt: number) {
    t.playerSwing = Math.min(t.playerSwing + dt, 9);
    let mx = 0, mz = 0;
    if (input.fwd)   mz -= 1;
    if (input.back)  mz += 1;
    if (input.left)  mx -= 1;
    if (input.right) mx += 1;
    const ml = Math.hypot(mx, mz) || 1;
    mx /= ml; mz /= ml;
    const spd = input.crouch && t.playerY === 0 ? 2.1 : 4.4;
    t.playerPos.x += mx * spd * dt;
    t.playerPos.z += mz * spd * dt;
    // Whole court is shared — only the wall and the outer lines stop you.
    t.playerPos.x = clamp(t.playerPos.x, -COURT_HALF_W + 0.3, COURT_HALF_W - 0.3);
    t.playerPos.z = clamp(t.playerPos.z, WALL_Z + 0.85, COURT_DEPTH - 0.3);
    t.playerFacing = Math.atan2(-t.playerPos.x * 0.35, -(t.playerPos.z - WALL_Z));

    if (input.jumpQ && t.playerY === 0) t.playerVY = 7.0;
    input.jumpQ = false;
    t.playerCrouch = input.crouch && t.playerY === 0;
    if (t.playerY > 0 || t.playerVY !== 0) {
      t.playerY  += t.playerVY * dt;
      t.playerVY -= PLAYER_GRAV * dt;
      if (t.playerY <= 0) { t.playerY = 0; t.playerVY = 0; }
    }
  }

  // ── ZIGGY ──────────────────────────────────────────────────
  function updateBot(t: WallState, dt: number, idle: boolean) {
    t.opSwing    = Math.min(t.opSwing + dt, 9);
    t.opCooldown = Math.max(0, t.opCooldown - dt);

    // Serve
    if (!idle && t.phase === "serve" && t.server === "op" && t.held && t.time >= t.opServeAt) {
      // Bot serve: set aimPos before serving so launch() finds a valid X.
      t.aimPos.set((Math.random() - 0.5) * (COURT_HALF_W * 1.5), 0, 2.5);
      const hand = new THREE.Vector3(t.opPos.x, 1.0, t.opPos.z);
      const res = tryHit(
        t, "op", hand, false, false, 0,
        Math.random() < 0.25,
        0.6 + Math.random() * botSkill() * 0.4,
      );
      if (res.applied) {
        t.opSwing = 0;
        useGame.getState().rallyInc();
        maybeRallyLine(t);
        sfx.botHit();
      }
      return;
    }

    // ── Where should ZIGGY stand?
    let tx = t.opTarget.x;
    let tz = t.opTarget.z;

    if (t.phase === "live") {
      if (t.turn === "op") {
        // It's Ziggy's ball — anticipate the rebound point immediately!
        if (t.hitWall) {
          const land = predictLanding(t);
          tx = clamp(land.x, -COURT_HALF_W + 0.4, COURT_HALF_W - 0.4);
          tz = clamp(land.z + 0.25, WALL_Z + 0.8, COURT_DEPTH - 0.4);
        } else {
          // Ball is heading toward the wall — predict post-wall bounce in advance!
          const b = t.ballPos;
          const v = t.ballVel;
          const timeToWall = Math.max(0.01, (b.z - WALL_Z) / (Math.abs(v.z) || 1));
          const wallX = b.x + v.x * timeToWall;
          // After wall rebound, ball velocity in Z reverses to +v.z * 0.90
          const rebVz = Math.abs(v.z) * 0.90;
          const rebVx = v.x * 0.96;
          // Estimate post-wall ground bounce Z
          const rebTime = 0.45; // average post-wall bounce time
          tx = clamp(wallX + rebVx * rebTime, -COURT_HALF_W + 0.5, COURT_HALF_W - 0.5);
          tz = clamp(WALL_Z + rebVz * rebTime, WALL_Z + 1.2, COURT_DEPTH - 0.5);
        }
      } else {
        // Not Ziggy's ball — step aside cleanly so player has space
        const away = t.ballPos.x > 0 ? -1 : 1;
        tx = clamp(t.ballPos.x + away * BOT.clearOut, -COURT_HALF_W + 0.5, COURT_HALF_W - 0.5);
        tz = clamp(t.playerPos.z + 0.8, 2.2, COURT_DEPTH - 0.4);
      }
    } else {
      tx = t.server === "op" ? 0.8 : 1.9;
      tz = 4.8;
    }

    t.opTarget.set(tx, 0, tz);

    const dx = tx - t.opPos.x;
    const dz = tz - t.opPos.z;
    const d  = Math.hypot(dx, dz);
    if (d > 0.05) {
      const step = Math.min(d, BOT.speed * dt);
      t.opPos.x += (dx / d) * step;
      t.opPos.z += (dz / d) * step;
    }

    // Soft body separation so the two never overlap.
    const sepX = t.opPos.x - t.playerPos.x;
    const sepZ = t.opPos.z - t.playerPos.z;
    const sep  = Math.hypot(sepX, sepZ);
    if (sep < 0.75 && sep > 0.001) {
      const push = (0.75 - sep) * 0.5;
      t.opPos.x += (sepX / sep) * push;
      t.opPos.z += (sepZ / sep) * push;
    }

    t.opPos.x = clamp(t.opPos.x, -COURT_HALF_W + 0.3, COURT_HALF_W - 0.3);
    t.opPos.z = clamp(t.opPos.z, WALL_Z + 0.85, COURT_DEPTH - 0.3);
    t.opFacing = Math.atan2(-t.opPos.x * 0.35, -(t.opPos.z - WALL_Z));

    // ── Posture prep: crouch for low balls, leap for high ones.
    const wantLow = t.ballPos.y < 0.78 && t.turn === "op";
    t.opCrouch = wantLow && t.opY === 0;

    // Jump when a high ball is arriving and he's roughly in position, so he
    // can access SMASH (falling) / ROOFER + MOONBALL (rising).
    if (
      !idle && t.phase === "live" && t.turn === "op" &&
      t.opY === 0 && t.opVY === 0 && t.hitWall && t.opCooldown <= 0
    ) {
      const near = Math.hypot(t.ballPos.x - t.opPos.x, t.ballPos.z - t.opPos.z);
      const highBall = t.ballPos.y > 1.25;
      if (highBall && near < BOT.reach + 1.4 && Math.random() < 0.10) {
        t.opVY = 6.6;
      }
    }

    if (t.opY > 0 || t.opVY !== 0) {
      t.opY  += t.opVY * dt;
      t.opVY -= PLAYER_GRAV * dt;
      if (t.opY <= 0) { t.opY = 0; t.opVY = 0; }
    }

    if (idle || t.phase !== "live") return;
    if (t.turn !== "op") return;
    if (t.opCooldown > 0) return;

    // Legal window: wall touched and exactly one bounce since.
    if (!t.hitWall || t.bouncesAfterWall !== 1) return;

    const handY = t.opY + (t.opCrouch ? 0.48 : t.opY > 0.25 ? 1.32 : 1.08);
    const hand  = new THREE.Vector3(t.opPos.x, handY, t.opPos.z);
    if (hand.distanceTo(t.ballPos) > BOT.reach) return;

    // Masterful execution
    const missCh = (1 - botSkill()) * 0.08; // very low miss chance for grandmaster Ziggy
    if (Math.random() < missCh) { t.opCooldown = 0.3; return; }

    const clutch = Math.random() < 0.15;
    const exec   = clutch ? 0.95 + Math.random() * 0.05
                          : 0.72 + Math.random() * (botSkill() * 0.28);

    // ── Shot selection: ZIGGY reads the ball height and where you're standing,
    //    then picks from the same nine-shot arsenal you have.
    const airborne = t.opY > 0.25;
    const rising   = airborne && t.opVY > -0.25;
    const ballY    = t.ballPos.y;
    const playerDeep = t.playerPos.z > 5.4;    // you're hanging back
    const playerTight = t.playerPos.z < 3.2;   // you're crowding the wall
    const r = Math.random();

    let finesse = false;
    let shift   = false;

    if (airborne) {
      // In the air: falling → SMASH, rising → ROOFER or MOONBALL.
      finesse = rising && (playerTight || r < 0.4);
    } else if (t.opCrouch) {
      // Low ball: CROSS-COURT to move you, SLICE to knife it, else SCRAPIE.
      if (r < 0.30) finesse = true;                 // cross-court
      else if (r < 0.55) shift = true;              // slice
    } else {
      // Standing: BABY when you're deep, BOMB when you're tight, else DRIVE.
      // Ball height matters too — a low skimmer begs for SLICE, a high one
      // for an occasional surprise BOMB.
      if (playerDeep && r < 0.34) finesse = true;   // baby hit
      else if (playerTight && r < 0.42) shift = true; // bomb
      else if (ballY < 0.72 && r < 0.16) shift = true; // low ball → slice
      else if (r < 0.14) shift = true;              // occasional surprise bomb
    }

    // Bot aims away from the player, but stays well inside the sidelines —
    // a wide ball is now an instant fault, so ZIGGY plays it safe.
    const aimDir = -Math.sign(t.playerPos.x || 1);
    const spread = (finesse || shift) ? 0.42 : 0.62;   // angled shots aim tighter
    const aimMag = COURT_HALF_W * spread * (0.5 + Math.random() * 0.5);
    t.aimPos.set(clamp(aimDir * aimMag, -COURT_HALF_W + 1.0, COURT_HALF_W - 1.0), 0, 2.5);

    const res = tryHit(
      t, "op", hand, t.opCrouch, airborne, t.opVY, finesse, exec, shift,
    );
    if (res.applied) {
      t.opSwing = 0;
      t.opCooldown = 0.3 + Math.random() * 0.15;
      useGame.getState().rallyInc();
      maybeRallyLine(t);
      sfx.botHit();
      // Only announce ZIGGY's genuinely dangerous shots — no drive spam.
      if (res.kind !== "drive") {
        useGame.getState().popup(`ZIGGY: ${SHOTS[res.kind].name}`, SHOTS[res.kind].colour as never);
      }
      if (res.kind === "smash")  { sfx.smash(); t.shake = 0.5; }
      if (res.kind === "bomb")   { sfx.smash(); t.shake = 0.42; }
      if (res.kind === "scrapie" || res.kind === "slice") sfx.skimmer();
    } else if (res.foul && res.foul !== "turn") {
      callFoul(t, "op", res.foul);
    } else {
      t.opCooldown = 0.25;
    }
  }

  // ── Camera: behind both players, looking at the wall ───────
  function doCam(snap: boolean) {
    const t = WS.current;
    const midX = (t.playerPos.x + t.ballPos.x * 0.5) * 0.4;
    const cx = clamp(midX, -2.2, 2.2);
    const cy = 4.9;
    const cz = clamp(t.playerPos.z + 6.4, 7.5, COURT_DEPTH + 6.0);
    const lx = clamp(t.ballPos.x * 0.4, -2.2, 2.2);
    const ly = clamp(0.9 + t.ballPos.y * 0.28, 0.8, 2.6);
    const lz = WALL_Z + 1.4;

    if (snap) {
      camera.position.set(cx, cy, cz);
      camLook.current.set(lx, ly, lz);
    } else {
      const k  = 1 - Math.exp(-dtRef.current * 4.0);
      const k2 = 1 - Math.exp(-dtRef.current * 5.4);
      camera.position.x += (cx - camera.position.x) * k;
      camera.position.y += (cy - camera.position.y) * k;
      camera.position.z += (cz - camera.position.z) * k;
      camLook.current.x += (lx - camLook.current.x) * k2;
      camLook.current.y += (ly - camLook.current.y) * k2;
      camLook.current.z += (lz - camLook.current.z) * k2;
    }
    if (t.shake > 0) {
      if (useSettings.getState().screenShake) {
        camera.position.x += (Math.random() - 0.5) * t.shake * 0.2;
        camera.position.y += (Math.random() - 0.5) * t.shake * 0.16;
      }
    }
    camera.lookAt(camLook.current);
  }

  return null;
}
