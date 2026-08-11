import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "../../game/store";
import { sfx, buzzer } from "../../game/audio";
import { say } from "../../game/banter";
import { useSettings } from "../../game/settings";
import {
  COURT_W, COURT_LEN, stepD, playerThrow, playerCatch, playerPickup, clamp,
} from "../../game/dodgeball";
import { DS, resetDodgeball } from "./dodgeballState";

const GRAV = 15;

interface Input {
  fwd: boolean; back: boolean; left: boolean; right: boolean;
  jumpQ: boolean; clickQ: boolean;
}
const input: Input = { fwd: false, back: false, left: false, right: false, jumpQ: false, clickQ: false };

export function DodgeballDirector() {
  const { camera } = useThree();
  const phase = useGame((s) => s.phase);
  const prevPhase = useRef("hub");
  const camSnap = useRef(true);
  const camLook = useRef(new THREE.Vector3(0, 1.2, 0));
  const dtRef = useRef(0.016);
  const mouseNDC = useRef(new THREE.Vector2());
  const raycaster = useRef(new THREE.Raycaster());
  const groundPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));

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
    const mm = (e: MouseEvent) => {
      mouseNDC.current.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1,
      );
    };
    const pd = (e: MouseEvent) => {
      if (useGame.getState().phase !== "play") return;
      if ((e.target as HTMLElement | null)?.closest?.("button")) return;
      if (e.button === 0) input.clickQ = true;
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
    if (st.mode !== "dodgeball") return;

    if (phase === "play" && prevPhase.current !== "play" && prevPhase.current !== "point") {
      resetDodgeball();
      camSnap.current = true;
      sfx.whistle();
    }
    prevPhase.current = phase;

    if (phase !== "play" && phase !== "point") {
      doCam(true);
      return;
    }

    const t = DS.current;
    stepD(t, dt);

    // ── Aim raycast onto the blacktop ──
    raycaster.current.setFromCamera(mouseNDC.current, camera);
    const hit = new THREE.Vector3();
    raycaster.current.ray.intersectPlane(groundPlane.current, hit);
    if (hit) {
      t.player.aimX = clamp(hit.x, -COURT_W, COURT_W);
      t.player.aimZ = clamp(hit.z, -COURT_LEN, COURT_LEN);
    }

    // ── Player movement (their half only) ──
    const p = t.player;
    if (p.alive && t.phase === "play") {
      let mx = 0, mz = 0;
      if (input.fwd) mz -= 1;
      if (input.back) mz += 1;
      if (input.left) mx -= 1;
      if (input.right) mx += 1;
      const ml = Math.hypot(mx, mz) || 1;
      mx /= ml; mz /= ml;
      const spd = 4.6;
      p.pos.x += mx * spd * dt;
      p.pos.z += mz * spd * dt;
      p.pos.x = clamp(p.pos.x, -COURT_W + 0.4, COURT_W - 0.4);
      p.pos.z = clamp(p.pos.z, -COURT_LEN + 0.4, -0.5);
      p.moving = ml > 0.01;
      if (p.moving) p.facing = Math.atan2(mx, mz);
      else p.facing = Math.atan2(t.player.aimX - p.pos.x, t.player.aimZ - p.pos.z);
      if (input.jumpQ && p.y === 0) p.vy = 6.8;
    } else {
      p.moving = false;
    }
    input.jumpQ = false;
    if (p.y > 0 || p.vy !== 0) {
      p.y += p.vy * dt;
      p.vy -= GRAV * dt;
      if (p.y <= 0) { p.y = 0; p.vy = 0; }
    }

    // ── Click: throw if holding, else try to catch / pick up ──
    if (input.clickQ) {
      input.clickQ = false;
      if (p.alive && t.phase === "play") {
        if (p.hasBall) {
          const aim = new THREE.Vector3(t.player.aimX, 0, t.player.aimZ);
          if (playerThrow(t, aim)) sfx.kick(0.9);
        } else if (!playerCatch(t)) {
          playerPickup(t);
        }
      }
    }

    // ── Game over hand-off ──
    if (t.phase === "over" && t.endTimer === 0) {
      t.endTimer = 1;
      buzzer();
      const youWon = t.winner === 0;
      st.setDodgeResult(youWon, t.bots.filter((b) => !b.alive).length);
      say(youWon ? "win" : "lose", youWon ? "gold" : "red", true);
      if (youWon) {
        st.addScore(6);
        st.popup("CLEAN SWEEP!", "green", true);
        sfx.cheer();
      } else {
        st.popup("SPLAT — YOU'RE OUT", "red", true);
      }
      setTimeout(() => {
        const g = useGame.getState();
        if (g.mode !== "dodgeball") return;
        if (youWon) g.win();
        else { resetDodgeball(); g.setPhase("point"); }
      }, 2400);
    }

    doCam(camSnap.current);
    camSnap.current = false;
  });

  function doCam(snap: boolean) {
    const t = DS.current;
    const focus = t.ball.state === "flight" ? t.ball.pos : t.player.pos;
    const cx = clamp(focus.x * 0.4, -2.4, 2.4);
    const cy = 8.2;
    const cz = clamp(focus.z + 7.2, 2.2, 4.2);
    const lx = clamp(focus.x * 0.3, -1.6, 1.6);
    const ly = 0.9;
    const lz = 0;
    if (snap) {
      camera.position.set(cx, cy, cz);
      camLook.current.set(lx, ly, lz);
    } else {
      const k = 1 - Math.exp(-dtRef.current * 3.4);
      const k2 = 1 - Math.exp(-dtRef.current * 4.6);
      camera.position.x += (cx - camera.position.x) * k;
      camera.position.y += (cy - camera.position.y) * k;
      camera.position.z += (cz - camera.position.z) * k;
      camLook.current.x += (lx - camLook.current.x) * k2;
      camLook.current.y += (ly - camLook.current.y) * k2;
      camLook.current.z += (lz - camLook.current.z) * k2;
    }
    if (t.shake > 0 && useSettings.getState().screenShake) {
      camera.position.x += (Math.random() - 0.5) * t.shake * 0.24;
      camera.position.y += (Math.random() - 0.5) * t.shake * 0.18;
    }
    camera.lookAt(camLook.current);
  }

  return null;
}
