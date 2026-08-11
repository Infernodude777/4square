import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "../../game/store";
import { sfx, buzzer } from "../../game/audio";
import { say } from "../../game/banter";
import { useSettings } from "../../game/settings";
import { PIT_R, stepG, slap, clamp, octDist } from "../../game/gaga";
import { GS, resetGaga } from "./gagaState";

interface Input {
  fwd: boolean; back: boolean; left: boolean; right: boolean;
  clickQ: boolean;
}
const input: Input = { fwd: false, back: false, left: false, right: false, clickQ: false };

export function GagaDirector() {
  const { camera } = useThree();
  const phase = useGame((s) => s.phase);
  const prevPhase = useRef("hub");
  const camSnap = useRef(true);
  const camLook = useRef(new THREE.Vector3(0, 0.8, 0));
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
    if (st.mode !== "gaga") return;

    if (phase === "play" && prevPhase.current !== "play") {
      resetGaga();
      camSnap.current = true;
    }
    prevPhase.current = phase;

    if (phase !== "play" && phase !== "point") {
      doCam(true);
      return;
    }

    const t = GS.current;
    stepG(t, dt);

    // ── Aim onto the pit floor ──
    const hit = new THREE.Vector3();
    raycaster.current.setFromCamera(mouseNDC.current, camera);
    raycaster.current.ray.intersectPlane(groundPlane.current, hit);
    let ax = 0, az = 0;
    if (hit) {
      ax = clamp(hit.x, -PIT_R, PIT_R);
      az = clamp(hit.z, -PIT_R, PIT_R);
    }

    // ── Player movement ──
    const p = t.player;
    if (p.alive && t.phase === "play") {
      let mx = 0, mz = 0;
      if (input.fwd) mz -= 1;
      if (input.back) mz += 1;
      if (input.left) mx -= 1;
      if (input.right) mx += 1;
      const ml = Math.hypot(mx, mz) || 1;
      mx /= ml; mz /= ml;
      const spd = 4.3;
      p.pos.x += mx * spd * dt;
      p.pos.z += mz * spd * dt;
      const od = octDist(p.pos.x, p.pos.z);
      if (od > -0.45) {
        const nx = -p.pos.x / (Math.hypot(p.pos.x, p.pos.z) || 1);
        const nz = -p.pos.z / (Math.hypot(p.pos.x, p.pos.z) || 1);
        p.pos.x += nx * (od + 0.45);
        p.pos.z += nz * (od + 0.45);
      }
      p.moving = ml > 0.01;
      p.facing = ml > 0.01
        ? Math.atan2(mx, mz)
        : Math.atan2(ax - p.pos.x, az - p.pos.z);
    } else {
      p.moving = false;
    }

    // ── Click = GA! ──
    if (input.clickQ) {
      input.clickQ = false;
      if (p.alive && t.phase === "play" && p.cooldown <= 0) {
        const d = Math.hypot(t.ball.pos.x - p.pos.x, t.ball.pos.z - p.pos.z);
        const reachable = d < 1.45 && t.ball.pos.y > 0.14 && t.ball.pos.y < 1.3;
        if (reachable) {
          if (slap(t, "player", ax, az, 1)) {
            sfx.perfect();
            useGame.getState().rallyInc();
          }
        } else {
          // whiff
          p.cooldown = 0.15;
        }
      }
    }

    // ── Game over hand-off ──
    if (t.phase === "over" && t.winner !== null && !t.handled) {
      t.handled = true;
      buzzer();
      const youWon = t.winner === 0;
      st.setGagaResult(youWon, t.bots.filter((b) => b.alive).length, Math.floor(t.time));
      say(youWon ? "win" : "lose", youWon ? "gold" : "red", true);
      if (youWon) {
        st.addScore(6);
        st.popup("LAST KID STANDING!", "gold", true);
        sfx.homerun();
      } else {
        st.popup("THE BOTS RULE THE PIT", "red", true);
      }
      setTimeout(() => {
        const g = useGame.getState();
        if (g.mode !== "gaga") return;
        if (youWon) g.win();
        else { resetGaga(); g.setPhase("point"); }
      }, 2400);
    }

    doCam(camSnap.current);
    camSnap.current = false;
  });

  function doCam(snap: boolean) {
    const t = GS.current;
    const focus = t.phase === "play" ? t.ball.pos : t.player.pos;
    const cx = clamp(focus.x * 0.45, -2.2, 2.2);
    const cy = 8.4;
    const cz = clamp(focus.z * 0.35 + 7.2, 4.4, 5.6);
    const lx = clamp(focus.x * 0.3, -1.6, 1.6);
    const ly = 0.8;
    const lz = 0;
    if (snap) {
      camera.position.set(cx, cy, cz);
      camLook.current.set(lx, ly, lz);
    } else {
      const k = 1 - Math.exp(-dtRef.current * 3.2);
      const k2 = 1 - Math.exp(-dtRef.current * 4.4);
      camera.position.x += (cx - camera.position.x) * k;
      camera.position.y += (cy - camera.position.y) * k;
      camera.position.z += (cz - camera.position.z) * k;
      camLook.current.x += (lx - camLook.current.x) * k2;
      camLook.current.y += (ly - camLook.current.y) * k2;
      camLook.current.z += (lz - camLook.current.z) * k2;
    }
    if (t.shake > 0 && useSettings.getState().screenShake) {
      camera.position.x += (Math.random() - 0.5) * t.shake * 0.22;
      camera.position.y += (Math.random() - 0.5) * t.shake * 0.16;
    }
    camera.lookAt(camLook.current);
  }

  return null;
}
