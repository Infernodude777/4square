import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PIT_R, WALL_H, OCTA, HIT_REACH, BALL_R } from "../../game/gaga";
import { makeWoodPitTexture } from "../../game/textures";
import { GS } from "./gagaState";

/** Wooden octagon wall segments with padded top rail. */
function PitWalls() {
  const walls = useMemo(
    () =>
      OCTA.map(([x, z], i) => {
        const [x2, z2] = OCTA[(i + 1) % 8];
        const mx = (x + x2) / 2;
        const mz = (z + z2) / 2;
        const len = Math.hypot(x2 - x, z2 - z);
        const ang = Math.atan2(x2 - x, z2 - z);
        return { mx: mx * PIT_R, mz: mz * PIT_R, len: len * PIT_R, ang };
      }),
    [],
  );
  return (
    <>
      {walls.map((w, i) => (
        <group key={i}>
          {/* main wall panel */}
          <mesh castShadow receiveShadow position={[w.mx, WALL_H / 2, w.mz]} rotation-y={-w.ang}>
            <boxGeometry args={[w.len, WALL_H, 0.16]} />
            <meshStandardMaterial color="#9c6b42" roughness={0.85} />
          </mesh>
          {/* padded top rail */}
          <mesh position={[w.mx, WALL_H + 0.05, w.mz]} rotation-y={-w.ang}>
            <boxGeometry args={[w.len + 0.05, 0.14, 0.24]} />
            <meshStandardMaterial color="#e0483d" roughness={0.6} />
          </mesh>
        </group>
      ))}
    </>
  );
}

/** Soft ring under the player, pulses green when the ball is slap-able. */
function PlayerRing() {
  const ref = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(() => {
    const t = GS.current;
    if (!ref.current || !mat.current) return;
    ref.current.position.set(t.player.pos.x, 0.02, t.player.pos.z);
    const d = Math.hypot(t.ball.pos.x - t.player.pos.x, t.ball.pos.z - t.player.pos.z);
    const canSlap = t.player.alive && t.phase === "play" && d < HIT_REACH && t.ball.pos.y >= BALL_R;
    mat.current.color.set(canSlap ? "#7dff9a" : "#ffd23e");
    mat.current.opacity = t.player.alive ? (canSlap ? 0.55 : 0.2) : 0;
  });
  return (
    <mesh ref={ref} rotation-x={-Math.PI / 2}>
      <ringGeometry args={[0.55, 0.66, 40]} />
      <meshBasicMaterial ref={mat} transparent opacity={0.2} depthWrite={false} />
    </mesh>
  );
}

export function GagaCourt() {
  const tex = useMemo(() => makeWoodPitTexture(), []);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[PIT_R - 0.12, 64]} />
        <meshStandardMaterial map={tex} roughness={0.85} />
      </mesh>
      <PitWalls />
      <PlayerRing />
    </group>
  );
}
