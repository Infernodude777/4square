import { useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "../../game/store";
import { RT } from "../../game/refs";
import { beginServe } from "../../game/tetherball";
import { resetTether, TS } from "../tether/tetherState";
import { sfx } from "../../game/audio";
import {
  FOUR_SQUARE_POS, TETHER_POS, WALL_POS, SPAWN,
  SWING_POS, SWING_FACING, SWING_DISMOUNT, swingSeat,
  TAG_POS, KICK_POS,
} from "./constants";
import { resolveCollisions } from "./colliders";

const keys = { w: false, a: false, s: false, d: false };
const look = new THREE.Vector3(0, 1, 0);
let swinging = false;

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
    swinging = false;
    p.pos.set(SPAWN[0], 0, SPAWN[2]);
    p.target.copy(p.pos);
    p.y = 0;
    p.vy = 0;
    p.crouch = false;
    p.sitting = false;
    p.lean = 0;
    p.facing = Math.PI;

    const down = (e: KeyboardEvent) => {
      if (useGame.getState().phase !== "hub") return;
      if (e.code === "KeyW" || e.code === "ArrowUp") keys.w = true;
      if (e.code === "KeyA" || e.code === "ArrowLeft") keys.a = true;
      if (e.code === "KeyS" || e.code === "ArrowDown") keys.s = true;
      if (e.code === "KeyD" || e.code === "ArrowRight") keys.d = true;
      if (e.code === "KeyE") {
        const player = RT.entities.player.pos;
        if (swinging) {
          // Hop off onto the clear patch in front of the frame.
          swinging = false;
          const pl = RT.entities.player;
          pl.pos.set(SWING_DISMOUNT.x, 0, SWING_DISMOUNT.z);
          pl.y = 0;
          pl.vy = 0;
          pl.sitting = false;
          pl.lean = 0;
          pl.facing = SWING_FACING;
          sfx.ui();
          return;
        }

        const d4 = dist2D(player, FOUR_SQUARE_POS);
        const dt = dist2D(player, TETHER_POS);
        const dw = dist2D(player, WALL_POS);
        const ds = dist2D(player, SWING_POS);
        const dk = dist2D(player, KICK_POS);
        // Tag zone is the open centre — player must be far from all courts
        const dtag = dist2D(player, TAG_POS);
        const nearAnyCourt = d4 < 5.5 || dt < 4.8 || dw < 6.0 || ds < 2.5 || dk < 5.5;

        if (ds < 2.0 && ds <= d4 && ds <= dt && ds <= dw && ds <= dk) {
          swinging = true;
          sfx.ui();
        } else if (d4 < 5.2 && d4 <= dt && d4 <= dw && d4 <= dk) start("foursquare");
        else if (dt < 4.4 && dt <= dw && dt <= dk) start("tetherball");
        else if (dk < 4.8 && dk <= dw) start("kickball");
        else if (dw < 5.6) start("wallball");
        else if (!nearAnyCourt && dtag < 3.5) start("tag");
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

  useFrame(({ clock }, dtRaw) => {
    if (phase !== "hub") return;
    const dt = Math.min(dtRaw, 0.04);
    const p = RT.entities.player;

    if (swinging) {
      // ── Riding the swing ──
      // swingSeat() returns the exact world transform of the same plank the
      // model is drawing, so the kid is welded to the seat.
      const seat = swingSeat(clock.elapsedTime);

      p.pos.x = seat.x;
      p.pos.z = seat.z;
      // Drop the root so the hips rest on top of the plank instead of the
      // feet standing on it.
      p.y = seat.y - 0.40;
      // Sit upright facing up the yard toward the school…
      p.facing = SWING_FACING;
      // …and tilt with the chains. The body hangs from the pivot, so when the
      // seat is forward the torso is angled back.
      p.lean = -seat.angle;
      p.sitting = true;
      p.crouch = false;
      p.moving = false;
      p.walkPhase = 0;
      p.swing += dt;
    } else {
      // ── Standard walking movement ──
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
        const speed = 4.4;
        const stepX = x * speed * dt;
        const stepZ = z * speed * dt;
        let r = resolveCollisions(p.pos.x + stepX, p.pos.z);
        p.pos.x = r.x;
        r = resolveCollisions(p.pos.x, p.pos.z + stepZ);
        p.pos.z = r.z;
        p.facing = Math.atan2(x, z);
        p.walkPhase += dt * 10;
      }
      p.moving = moving;
      p.swing += dt;
      p.crouch = false;
      p.sitting = false;
      p.lean = 0;
      p.y = 0;
    }

    // Pull in a little and rise with the rider while they're on the swing.
    const targetCam = swinging
      ? new THREE.Vector3(p.pos.x * 0.85 + 1.6, 5.6 + p.y * 0.5, p.pos.z + 6.4)
      : new THREE.Vector3(p.pos.x * 0.85, 7.4, p.pos.z + 9.0);
    const targetLook = swinging
      ? new THREE.Vector3(p.pos.x, p.y + 0.9, p.pos.z - 1.6)
      : new THREE.Vector3(p.pos.x * 0.9, 0.9, p.pos.z - 2.2);
    const k = 1 - Math.exp(-dt * 4.0);
    camera.position.lerp(targetCam, k);
    look.lerp(targetLook, 1 - Math.exp(-dt * 5.5));
    camera.lookAt(look);
  });

  return null;
}