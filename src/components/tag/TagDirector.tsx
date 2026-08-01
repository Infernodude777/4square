import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "../../game/store";
import { sfx } from "../../game/audio";
import { TAG, resetTag } from "./tagState";
import { TAG_FIELD, TAG_IDS, clampTagPosition, moveTagPerson, nearestTagTarget } from "../../game/tag";

const keys = { w: false, a: false, s: false, d: false, shift: false };
const aim = new THREE.Vector3();
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

export function TagDirector() {
  const { camera } = useThree();
  const phase = useGame((state) => state.phase);
  const previousPhase = useRef(phase);
  const look = useRef(new THREE.Vector3(0, 0.5, 0));
  const winTimer = useRef<number | null>(null);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (useGame.getState().phase !== "play") return;
      if (event.code === "KeyW" || event.code === "ArrowUp") keys.w = true;
      if (event.code === "KeyA" || event.code === "ArrowLeft") keys.a = true;
      if (event.code === "KeyS" || event.code === "ArrowDown") keys.s = true;
      if (event.code === "KeyD" || event.code === "ArrowRight") keys.d = true;
      if (event.code === "ShiftLeft" || event.code === "ShiftRight") keys.shift = true;
    };
    const up = (event: KeyboardEvent) => {
      if (event.code === "KeyW" || event.code === "ArrowUp") keys.w = false;
      if (event.code === "KeyA" || event.code === "ArrowLeft") keys.a = false;
      if (event.code === "KeyS" || event.code === "ArrowDown") keys.s = false;
      if (event.code === "KeyD" || event.code === "ArrowRight") keys.d = false;
      if (event.code === "ShiftLeft" || event.code === "ShiftRight") keys.shift = false;
    };
    const mouse = (event: MouseEvent) => {
      ndc.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("mousemove", mouse);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("mousemove", mouse);
      keys.w = false; keys.a = false; keys.s = false; keys.d = false; keys.shift = false;
      if (winTimer.current !== null) window.clearTimeout(winTimer.current);
    };
  }, []);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.04);
    if (phase !== "play") {
      if (phase === "menu" || phase === "hub") camera.lookAt(look.current);
      return;
    }

    if (previousPhase.current !== "play") {
      resetTag();
      TAG.current.phase = "live";
      sfx.whistle();
    }
    previousPhase.current = phase;

    const state = TAG.current;
    state.time += dt;
    if (state.time >= TAG_FIELD.roundSeconds && state.phase === "live") {
      state.phase = "won";
      useGame.getState().popup(state.score > 0 ? `FIELD TIME · ${state.score} TAGS` : "FIELD TIME · RUN IT BACK", state.score > 0 ? "gold" : "white", true);
      winTimer.current = window.setTimeout(() => {
        if (useGame.getState().phase === "play") useGame.getState().win();
      }, 1100);
      return;
    }

    state.tagCooldown = Math.max(0, state.tagCooldown - dt);
    for (const id of TAG_IDS) state.people[id].taggedFlash = Math.max(0, state.people[id].taggedFlash - dt);

    const player = state.people.player;
    const activeIt = state.people[state.currentIt];
    ray.setFromCamera(ndc, camera);
    if (!ray.ray.intersectPlane(plane, aim)) aim.set(player.pos.x, 0, player.pos.z - 1);

    let moveX = 0;
    let moveZ = 0;
    if (keys.w) moveZ -= 1;
    if (keys.s) moveZ += 1;
    if (keys.a) moveX -= 1;
    if (keys.d) moveX += 1;
    const length = Math.hypot(moveX, moveZ) || 1;
    const moving = moveX !== 0 || moveZ !== 0;
    const sprinting = keys.shift && moving;
    if (moving) {
      const distance = sprinting ? 2.8 : 1.8;
      player.target.set(player.pos.x + (moveX / length) * distance, 0, player.pos.z + (moveZ / length) * distance);
      clampTagPosition(player.target);
    } else {
      player.target.copy(player.pos);
    }
    moveTagPerson(player, dt, sprinting);
    player.facing = Math.atan2(aim.x - player.pos.x, aim.z - player.pos.z);

    for (const id of TAG_IDS) {
      if (id === "player") continue;
      const person = state.people[id];
      const target = nearestTagTarget(state, id, id === state.currentIt);
      if (!target) continue;
      const dx = target.pos.x - person.pos.x;
      const dz = target.pos.z - person.pos.z;
      const distance = Math.hypot(dx, dz) || 1;
      if (id === state.currentIt) {
        person.target.set(target.pos.x, 0, target.pos.z);
      } else {
        const side = id.length % 2 ? 1 : -1;
        person.target.set(person.pos.x - (dx / distance) * 2.4 + side * (dz / distance) * 1.2, 0, person.pos.z - (dz / distance) * 2.4 - side * (dx / distance) * 1.2);
        clampTagPosition(person.target);
      }
      moveTagPerson(person, dt, id === state.currentIt);
    }

    if (state.tagCooldown <= 0) {
      const chaser = state.people[state.currentIt];
      for (const id of TAG_IDS) {
        if (id === state.currentIt) continue;
        const victim = state.people[id];
        if (chaser.pos.distanceTo(victim.pos) >= TAG_FIELD.tagRange) continue;
        state.currentIt = id;
        state.tagCooldown = 1.2;
        state.lastTagAt = state.time;
        victim.taggedFlash = 0.8;
        chaser.taggedFlash = 0.8;
        if (chaser.id === "player") {
          state.score += 1;
          useGame.getState().addScore(1);
          useGame.getState().popup(`TAGGED ${victim.name} · +1`, "gold", true);
          sfx.cheer();
        } else if (victim.id === "player") {
          useGame.getState().popup(`YOU'RE IT · ${chaser.name} GOT YOU`, "red", true);
          sfx.fault();
        } else {
          useGame.getState().popup(`${chaser.name} TAGGED ${victim.name}`, "white");
          sfx.hit(0.5);
        }
        break;
      }
    }

    if (state.score >= TAG_FIELD.goal && state.phase === "live") {
      state.phase = "won";
      useGame.getState().rallyInc();
      useGame.getState().popup("FIELD CHAMP · SEVEN TAGS", "gold", true);
      winTimer.current = window.setTimeout(() => {
        if (useGame.getState().phase === "play") useGame.getState().win();
      }, 900);
    }

    const centre = player.pos.clone().lerp(activeIt.pos, 0.22);
    const cameraTarget = new THREE.Vector3(player.pos.x * 0.2, 7.1, player.pos.z + 9.2);
    camera.position.lerp(cameraTarget, 1 - Math.exp(-dt * 3.6));
    look.current.lerp(centre.setY(0.5), 1 - Math.exp(-dt * 5));
    camera.lookAt(look.current);
  });

  return null;
}
