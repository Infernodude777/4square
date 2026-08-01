import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "../../game/store";
import { sfx } from "../../game/audio";
import { KICK, resetKick } from "./kickState";
import { KICK_FIELD, KICK_IDS, clampKickField, beginPitch, moveKickPerson, type KickId } from "../../game/kickball";

const keys = { w: false, a: false, s: false, d: false };
const aim = new THREE.Vector3();
const ndc = new THREE.Vector2();
const ray = new THREE.Raycaster();
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

export function KickDirector() {
  const { camera } = useThree();
  const phase = useGame((state) => state.phase);
  const previousPhase = useRef(phase);
  const pointTimer = useRef(0);
  const pitchTimer = useRef(0);
  const look = useRef(new THREE.Vector3(0, 0.7, 0));

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (useGame.getState().phase !== "play") return;
      if (event.code === "KeyW" || event.code === "ArrowUp") keys.w = true;
      if (event.code === "KeyA" || event.code === "ArrowLeft") keys.a = true;
      if (event.code === "KeyS" || event.code === "ArrowDown") keys.s = true;
      if (event.code === "KeyD" || event.code === "ArrowRight") keys.d = true;
      if (event.code === "Space" && !event.repeat) {
        event.preventDefault();
        kick();
      }
    };
    const up = (event: KeyboardEvent) => {
      if (event.code === "KeyW" || event.code === "ArrowUp") keys.w = false;
      if (event.code === "KeyA" || event.code === "ArrowLeft") keys.a = false;
      if (event.code === "KeyS" || event.code === "ArrowDown") keys.s = false;
      if (event.code === "KeyD" || event.code === "ArrowRight") keys.d = false;
    };
    const mouse = (event: MouseEvent) => {
      ndc.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);
    };
    const click = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.button === 0 && !target?.closest("button") && useGame.getState().phase === "play") kick();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("mousemove", mouse);
    window.addEventListener("pointerdown", click);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("mousemove", mouse);
      window.removeEventListener("pointerdown", click);
      keys.w = false; keys.a = false; keys.s = false; keys.d = false;
    };
  }, []);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.04);
    if (phase !== "play") return;
    if (previousPhase.current !== "play") {
      resetKick();
      pointTimer.current = 0;
      pitchTimer.current = 0;
      KICK.current.phase = "ready";
      sfx.whistle();
    }
    previousPhase.current = phase;

    const state = KICK.current;
    state.time += dt;
    pointTimer.current = Math.max(0, pointTimer.current - dt);
    const player = state.people.player;
    ray.setFromCamera(ndc, camera);
    ray.ray.intersectPlane(plane, aim);
    state.aim.copy(aim);

    let moveX = 0;
    let moveZ = 0;
    if (keys.w) moveZ -= 1;
    if (keys.s) moveZ += 1;
    if (keys.a) moveX -= 1;
    if (keys.d) moveX += 1;
    const length = Math.hypot(moveX, moveZ) || 1;
    if (moveX !== 0 || moveZ !== 0) player.target.set(player.pos.x + (moveX / length) * 2.2, 0, player.pos.z + (moveZ / length) * 2.2);
    else player.target.copy(player.pos);
    clampKickField(player.target);
    moveKickPerson(player, dt, 5.0);
    player.facing = Math.atan2(aim.x - player.pos.x, aim.z - player.pos.z);

    if (state.phase === "ready") {
      beginPitch(state);
      pitchTimer.current = 0;
    }
    if (state.phase === "pitch") {
      pitchTimer.current += dt;
      state.ballPos.addScaledVector(state.ballVel, dt);
      if (state.ballPos.z >= 4.7) {
        resolveOut("ziggy");
      } else if (pitchTimer.current > 2.8) {
        resolveOut("ziggy");
      } else if (state.ballPos.distanceTo(player.pos) < KICK_FIELD.kickRange && state.ballPos.z > 3.4) {
        state.banner = "CLICK OR SPACE TO KICK";
        state.bannerAt = state.time;
      }
    }
    if (state.phase === "flight") stepFlight(dt);
    if (state.phase === "point" && pointTimer.current <= 0) {
      if (state.runs >= KICK_FIELD.winRuns || state.outs >= KICK_FIELD.maxOuts) {
        state.phase = "won";
        useGame.getState().win();
        return;
      }
      state.inning += 1;
      resetKick();
      beginPitch(state);
      pitchTimer.current = 0;
    }

    for (const id of KICK_IDS) {
      if (id === "player" || id === "ziggy") continue;
      const fielder = state.people[id];
      if (state.phase === "flight") fielder.target.copy(state.ballPos);
      else fielder.target.set(fielder.pos.x * 0.2, 0, fielder.pos.z * 0.2);
      clampKickField(fielder.target);
      moveKickPerson(fielder, dt, 4.2 + (id.length % 3) * 0.3);
      if (state.phase === "flight" && fielder.pos.distanceTo(state.ballPos) < 0.7) resolveOut(id);
    }
    state.pitcher.target.set(0, 0, -4.3);
    moveKickPerson(state.pitcher, dt, 2.2);

    camera.position.lerp(new THREE.Vector3(player.pos.x * 0.35, 7.2, player.pos.z + 10.2), 1 - Math.exp(-dt * 3.2));
    look.current.lerp(new THREE.Vector3(state.ballPos.x * 0.45, 0.7 + state.ballPos.y * 0.18, state.ballPos.z * 0.22), 1 - Math.exp(-dt * 5));
    camera.lookAt(look.current);
  });

  function kick() {
    const state = KICK.current;
    if (state.phase !== "pitch") return;
    const distance = state.ballPos.distanceTo(state.people.player.pos);
    if (distance > KICK_FIELD.kickRange || state.ballPos.z < 3.2) {
      useGame.getState().popup("SWING AND MISS", "red", true);
      sfx.fault();
      resolveOut("ziggy");
      return;
    }
    const dx = aim.x - state.ballPos.x;
    const dz = (aim.z || -3) - state.ballPos.z;
    const length = Math.hypot(dx, dz) || 1;
    const power = Math.max(0.65, Math.min(1.25, 1.1 - distance * 0.25));
    state.phase = "flight";
    state.kicks += 1;
    state.ballOnGround = false;
    state.ballVel.set((dx / length) * 4.0 * power, 5.4 * power, (dz / length) * 4.0 * power);
    state.banner = "RUN THE BASES!";
    state.bannerAt = state.time;
    useGame.getState().registerHit(power > 1.0);
    useGame.getState().popup("KICK! RUN!", "gold", true);
    sfx.smash();
  }

  function stepFlight(dt: number) {
    const state = KICK.current;
    state.ballVel.y -= 18 * dt;
    state.ballPos.addScaledVector(state.ballVel, dt);
    if (state.ballPos.y <= 0.22) {
      state.ballPos.y = 0.22;
      state.ballVel.y *= -0.28;
      state.ballVel.x *= 0.92;
      state.ballVel.z *= 0.92;
      state.ballOnGround = true;
    }
    if (state.ballPos.z < KICK_FIELD.farZ || Math.abs(state.ballPos.x) > KICK_FIELD.halfX || state.ballPos.z > KICK_FIELD.nearZ + 1 || (state.ballOnGround && state.ballVel.length() < 0.7)) resolveRun();
  }

  function resolveOut(fielder: KickId) {
    const state = KICK.current;
    if (state.phase !== "pitch" && state.phase !== "flight") return;
    state.phase = "point";
    state.outs += 1;
    state.banner = `OUT · ${fielder.toUpperCase()} GOT IT`;
    state.bannerAt = state.time;
    pointTimer.current = 1.7;
    state.ballVisible = true;
    useGame.getState().registerKO();
    useGame.getState().popup("OUT!", "red", true);
    sfx.fault();
  }

  function resolveRun() {
    const state = KICK.current;
    if (state.phase !== "flight") return;
    state.phase = "point";
    state.runs += 1;
    state.banner = "SAFE! RUN SCORED";
    state.bannerAt = state.time;
    pointTimer.current = 1.7;
    useGame.getState().addScore(2);
    useGame.getState().popup("SAFE · +1 RUN", "green", true);
    sfx.cheer();
  }

  return null;
}
