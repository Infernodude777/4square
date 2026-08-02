import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "../../game/store";
import { sfx } from "../../game/audio";
import { stepKick, kickTick, BASE_POS, KICK_ORIGIN } from "../../game/kickball";
import { KS, resetKickball } from "./kickballState";

// ─── Input ──────────────────────────────────────────────────────
const input = { power: false, soft: false };

export function KickballDirector() {
  const { camera } = useThree();
  const phase = useGame((s) => s.phase);
  const prevPhase = useRef("hub");
  const look = useRef(new THREE.Vector3(0, 1.2, 0));
  const camSnap = useRef(true);
  const overTimer = useRef<number | null>(null);

  useEffect(() => {
    const pd = (e: MouseEvent) => {
      if (useGame.getState().phase !== "play") return;
      if ((e.target as HTMLElement | null)?.closest?.("button")) return;
      if (e.button === 0) input.power = true;
      else if (e.button === 2) input.soft = true;
    };
    const ctx = (e: Event) => e.preventDefault();
    window.addEventListener("pointerdown", pd);
    window.addEventListener("contextmenu", ctx);
    return () => {
      window.removeEventListener("pointerdown", pd);
      window.removeEventListener("contextmenu", ctx);
    };
  }, []);

  useFrame((_, deltaRaw) => {
    const dt = Math.min(deltaRaw, 0.04);
    const st = useGame.getState();
    if (st.mode !== "kickball") return;

    // First frame of a match
    if (phase === "play" && prevPhase.current !== "play" && prevPhase.current !== "point") {
      resetKickball();
      camSnap.current = true;
      sfx.whistle();
    }
    prevPhase.current = phase;

    if (phase !== "play") {
      cam(dt, camSnap.current);
      camSnap.current = false;
      return;
    }

    const k = KS.current;

    // feed queued input into the state
    if (input.power) {
      kickTick(k, "power");
      input.power = false;
    }
    if (input.soft) {
      kickTick(k, "soft");
      input.soft = false;
    }

    stepKick(k, dt);

    // ── Match over ──
    if (k.phase === "over" && overTimer.current === null) {
      const youWon = k.winner === "you";
      st.setKickResult(k.runsYou, k.runsBot);
      if (youWon) {
        st.addScore(k.runsYou * 10);
        st.popup("FINAL WHISTLE", "gold", true);
      } else {
        st.popup("BOTS TAKE THE FIELD", "red", true);
      }
      overTimer.current = window.setTimeout(() => {
        const g = useGame.getState();
        if (youWon) g.win();
        else { resetKickball(); g.setPhase("play"); }
        overTimer.current = null;
      }, 2600);
    }

    // camera shake
    if (k.shake > 0) {
      camera.position.x += (Math.random() - 0.5) * k.shake * 0.3;
      camera.position.y += (Math.random() - 0.5) * k.shake * 0.2;
    }

    cam(dt, camSnap.current);
    camSnap.current = false;
  });

  // Elevated 3/4 view from behind home plate; drifts with the ball.
  // Field-local coords are offset by KICK_ORIGIN in world space, so apply
  // the same offset or the diamond would frame off-centre.
  function cam(dt: number, snap: boolean) {
    const k = KS.current;
    const bx = k.ball.pos.x * 0.35;
    const bz = k.ball.pos.z * 0.3;
    const cx = KICK_ORIGIN[0] + bx;
    const cy = 9.5;
    const cz = KICK_ORIGIN[2] + BASE_POS[0][1] + 6.2 + bz;
    const lx = KICK_ORIGIN[0] * 0.5 + bx;
    const ly = 0.6;
    const lz = KICK_ORIGIN[2];

    if (snap) {
      camera.position.set(cx, cy, cz);
      look.current.set(lx, ly, lz);
    } else {
      const kk = 1 - Math.exp(-dt * 4.2);
      camera.position.x += (cx - camera.position.x) * kk;
      camera.position.y += (cy - camera.position.y) * kk;
      camera.position.z += (cz - camera.position.z) * kk;
      look.current.x += (lx - look.current.x) * kk;
      look.current.y += (ly - look.current.y) * kk;
      look.current.z += (lz - look.current.z) * kk;
    }
    camera.lookAt(look.current);
  }

  return null;
}
