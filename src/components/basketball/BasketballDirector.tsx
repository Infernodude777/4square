import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "../../game/store";
import { sfx, buzzer } from "../../game/audio";
import { say } from "../../game/banter";
import { useSettings } from "../../game/settings";
import { BASKET_POS } from "../hub/constants";
import {
  COURT_HALF_W, BASELINE_Z, FOUL_LINE_Z, RIM_Z, RIM_H,
  nearestSpot, startShot, releaseShot, stepB, clamp,
} from "../../game/basketball";
import { BS, resetBasketball } from "./basketballState";

const GRAV = 13;

interface Input {
  fwd: boolean; back: boolean; left: boolean; right: boolean;
  jumpQ: boolean; clickQ: boolean;
}
const input: Input = { fwd: false, back: false, left: false, right: false, jumpQ: false, clickQ: false };

export function BasketballDirector() {
  const { camera } = useThree();
  const phase = useGame((s) => s.phase);
  const prevPhase = useRef("hub");
  const camSnap = useRef(true);
  const camLook = useRef(new THREE.Vector3(0, 1.6, 1));
  const dtRef = useRef(0.016);

  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if (useGame.getState().phase !== "play") return;
      switch (e.code) {
        case "KeyW": case "ArrowUp": input.fwd = true; break;
        case "KeyS": case "ArrowDown": input.back = true; break;
        case "KeyA": case "ArrowLeft": input.left = true; break;
        case "KeyD": case "ArrowRight": input.right = true; break;
        case "Space": e.preventDefault(); input.jumpQ = true; break;
      }
    };
    const ku = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW": case "ArrowUp": input.fwd = false; break;
        case "KeyS": case "ArrowDown": input.back = false; break;
        case "KeyA": case "ArrowLeft": input.left = false; break;
        case "KeyD": case "ArrowRight": input.right = false; break;
      }
    };
    const pd = (e: MouseEvent) => {
      if (useGame.getState().phase !== "play") return;
      if ((e.target as HTMLElement | null)?.closest?.("button")) return;
      if (e.button === 0) input.clickQ = true;
    };
    const ctx = (e: Event) => e.preventDefault();
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    window.addEventListener("pointerdown", pd);
    window.addEventListener("contextmenu", ctx);
    return () => {
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      window.removeEventListener("pointerdown", pd);
      window.removeEventListener("contextmenu", ctx);
    };
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.04);
    dtRef.current = dt;
    const st = useGame.getState();
    if (st.mode !== "basketball") return;

    if (phase === "play" && prevPhase.current !== "play" && prevPhase.current !== "point") {
      resetBasketball();
      camSnap.current = true;
      sfx.whistle();
      st.popup("H.O.R.S.E. — walk to a spot", "gold");
    }
    prevPhase.current = phase;

    if (phase !== "play") {
      doCam(true);
      return;
    }

    const t = BS.current;
    stepB(t, dt);

    // ── Player movement (only free during their pick) ──
    const p = t.playerPos;
    const freePick = t.phase === "pick" && t.turn === 0;
    if (freePick && t.forcedSpot < 0) {
      let mx = 0, mz = 0;
      if (input.fwd) mz -= 1;
      if (input.back) mz += 1;
      if (input.left) mx -= 1;
      if (input.right) mx += 1;
      const ml = Math.hypot(mx, mz) || 1;
      mx /= ml; mz /= ml;
      const spd = 4.2;
      p.x += mx * spd * dt;
      p.z += mz * spd * dt;
      p.x = clamp(p.x, -COURT_HALF_W + 0.4, COURT_HALF_W - 0.4);
      p.z = clamp(p.z, BASELINE_Z + 0.4, FOUL_LINE_Z + 0.9);
      t.playerMoving = ml > 0.01;
      if (t.playerMoving) t.playerFacing = Math.atan2(mx, mz);
      if (input.jumpQ && t.playerY === 0) t.playerVY = 7.0;
    } else {
      t.playerMoving = false;
    }
    input.jumpQ = false;
    if (t.playerY > 0 || t.playerVY !== 0) {
      t.playerY += t.playerVY * dt;
      t.playerVY -= GRAV * dt;
      if (t.playerY <= 0) { t.playerY = 0; t.playerVY = 0; }
    }

    // ── Clicks: start shot (pick) / release (aim) ──
    if (input.clickQ) {
      input.clickQ = false;
      if (t.turn === 0) {
        if (t.phase === "pick") {
          const spot = t.forcedSpot >= 0 ? t.forcedSpot : nearestSpot(p);
          if (startShot(t, spot)) sfx.ui();
        } else if (t.phase === "aim") {
          releaseShot(t, t.meter);
        }
      }
    }

    // ── Game over hand-off to the win screen ──
    if (t.phase === "over" && !t.landed) {
      t.landed = true;
      buzzer();
      const youWon = t.winner === 0;
      st.setHoopResult(t.letters[0].length, t.letters[1].length, t.swishes, t.shots);
      say(youWon ? "win" : "lose", youWon ? "gold" : "red", true);
      if (youWon) {
        st.addScore(8 + t.swishes * 2);
        st.popup("H.O.R.S.E. VICTORY!", "gold", true);
      } else {
        st.popup("SLAM WINS THE LETTERS", "red", true);
      }
      setTimeout(() => {
        const g = useGame.getState();
        if (g.mode !== "basketball" || g.phase !== "play") return;
        if (youWon) g.win();
        else { resetBasketball(); g.setPhase("point"); }
      }, 2200);
    }

    doCam(camSnap.current);
    camSnap.current = false;
  });

  function doCam(snap: boolean) {
    const t = BS.current;
    // The court lives in the north-east corner with the hoop facing the yard,
    // so the camera hangs in the open yard SOUTH of the hoop and looks back
    // over the rim at the shooters. Tracking the shooter's x keeps both the
    // shooter and the hoop in frame as they walk the spots.
    const shooter = t.turn === 0 ? t.playerPos : t.opPos;
    const bx = BASKET_POS[0];
    const bz = BASKET_POS[2];
    const cx = bx + clamp(shooter.x * 0.45, -2.6, 2.6);
    const cy = 5.2;
    const cz = bz + RIM_Z + 5.2;
    const lx = bx + shooter.x * 0.22;
    const ly = RIM_H - 0.3;
    const lz = bz + (RIM_Z + shooter.z) * 0.6;
    if (snap) {
      camera.position.set(cx, cy, cz);
      camLook.current.set(lx, ly, lz);
    } else {
      const k = 1 - Math.exp(-dtRef.current * 3.6);
      const k2 = 1 - Math.exp(-dtRef.current * 5.0);
      camera.position.x += (cx - camera.position.x) * k;
      camera.position.y += (cy - camera.position.y) * k;
      camera.position.z += (cz - camera.position.z) * k;
      camLook.current.x += (lx - camLook.current.x) * k2;
      camLook.current.y += (ly - camLook.current.y) * k2;
      camLook.current.z += (lz - camLook.current.z) * k2;
    }
    if (t.shake > 0 && useSettings.getState().screenShake) {
      camera.position.x += (Math.random() - 0.5) * t.shake * 0.2;
      camera.position.y += (Math.random() - 0.5) * t.shake * 0.16;
    }
    camera.lookAt(camLook.current);
  }

  return null;
}
