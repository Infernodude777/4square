import { useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "../../game/store";
import { RT } from "../../game/refs";
import { beginServe } from "../../game/tetherball";
import { resetTether, TS } from "../tether/tetherState";
import { FOUR_SQUARE_POS, TETHER_POS } from "./constants";

const keys = { w: false, a: false, s: false, d: false };
const look = new THREE.Vector3(0, 1, 0);

function dist2D(a: THREE.Vector3, b: [number, number, number]) {
  return Math.hypot(a.x - b[0], a.z - b[2]);
}

export function HubDirector() {
  const { camera } = useThree();
  const start = useGame((s) => s.start);
  const phase = useGame((s) => s.phase);

  useEffect(() => {
    resetTether();
    beginServe(TS.current, "player");
    const p = RT.entities.player;
    p.pos.set(0, 0, 9.2);
    p.target.copy(p.pos);
    p.y = 0;
    p.vy = 0;
    p.crouch = false;
    p.facing = Math.PI;

    const down = (e: KeyboardEvent) => {
      if (useGame.getState().phase !== "hub") return;
      if (e.code === "KeyW" || e.code === "ArrowUp") keys.w = true;
      if (e.code === "KeyA" || e.code === "ArrowLeft") keys.a = true;
      if (e.code === "KeyS" || e.code === "ArrowDown") keys.s = true;
      if (e.code === "KeyD" || e.code === "ArrowRight") keys.d = true;
      if (e.code === "KeyE") {
        const player = RT.entities.player.pos;
        if (dist2D(player, FOUR_SQUARE_POS) < 4.8) start("foursquare");
        else if (dist2D(player, TETHER_POS) < 3.9) start("tetherball");
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "KeyW" || e.code === "ArrowUp") keys.w = false;
      if (e.code === "KeyA" || e.code === "ArrowLeft") keys.a = false;
      if (e.code === "KeyS" || e.code === "ArrowDown") keys.s = false;
      if (e.code === "KeyD" || e.code === "ArrowRight") keys.d = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [start]);

  useFrame((_, dtRaw) => {
    if (phase !== "hub") return;
    const dt = Math.min(dtRaw, 0.04);
    const p = RT.entities.player;
    let x = 0;
    let z = 0;
    if (keys.w) z -= 1;
    if (keys.s) z += 1;
    if (keys.a) x -= 1;
    if (keys.d) x += 1;
    const len = Math.hypot(x, z) || 1;
    x /= len;
    z /= len;
    const moving = Math.abs(x) + Math.abs(z) > 0.01;
    if (moving) {
      p.pos.x += x * 3.9 * dt;
      p.pos.z += z * 3.9 * dt;
      p.facing = Math.atan2(x, z);
      p.walkPhase += dt * 10;
    }
    p.pos.x = Math.max(-12.5, Math.min(12.5, p.pos.x));
    p.pos.z = Math.max(-12.5, Math.min(12.5, p.pos.z));
    p.moving = moving;
    p.swing += dt;
    p.crouch = false;

    const targetCam = new THREE.Vector3(p.pos.x, 6.2, p.pos.z + 7.6);
    const targetLook = new THREE.Vector3(p.pos.x, 0.9, p.pos.z - 1.4);
    const k = 1 - Math.exp(-dt * 4.0);
    camera.position.lerp(targetCam, k);
    look.lerp(targetLook, 1 - Math.exp(-dt * 5.5));
    camera.lookAt(look);
  });

  return null;
}