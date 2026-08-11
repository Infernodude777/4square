import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { COURT_W, COURT_LEN } from "../../game/dodgeball";
import { makeDodgeCourtTexture } from "../../game/textures";
import { DS } from "./dodgeballState";

/** Aim reticle that follows the mouse + a possession badge. */
function AimReticle() {
  const ringRef = useRef<THREE.Mesh>(null);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);
  const dotRef = useRef<THREE.Mesh>(null);
  const dotMat = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(() => {
    const t = DS.current;
    if (!ringRef.current || !ringMat.current || !dotRef.current || !dotMat.current) return;
    const visible = t.phase === "play" && t.player.alive;
    ringRef.current.visible = visible;
    dotRef.current.visible = visible;
    if (!visible) return;
    const mine = t.player.hasBall;
    ringRef.current.position.set(t.player.aimX, 0.02, t.player.aimZ);
    dotRef.current.position.set(t.player.aimX, 0.022, t.player.aimZ);
    const col = mine ? "#7dff9a" : "#ffffff";
    ringMat.current.color.set(col);
    dotMat.current.color.set(col);
    ringMat.current.opacity = mine ? 0.85 : 0.3;
    dotMat.current.opacity = mine ? 0.9 : 0.4;
    ringRef.current.scale.setScalar(mine ? 1 + Math.sin(t.time * 7) * 0.06 : 1);
  });

  return (
    <group>
      <mesh ref={ringRef} rotation-x={-Math.PI / 2} visible={false}>
        <ringGeometry args={[0.3, 0.38, 36]} />
        <meshBasicMaterial ref={ringMat} transparent opacity={0.5} depthWrite={false} />
      </mesh>
      <mesh ref={dotRef} rotation-x={-Math.PI / 2} visible={false}>
        <circleGeometry args={[0.08, 18]} />
        <meshBasicMaterial ref={dotMat} transparent opacity={0.7} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function DodgeballCourt() {
  const tex = useMemo(() => makeDodgeCourtTexture(), []);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[COURT_W * 2 + 0.8, COURT_LEN * 2 + 0.6]} />
        <meshStandardMaterial map={tex} roughness={0.96} />
      </mesh>
      {/* kerb strips so the court reads in 3-D */}
      {[-COURT_W, COURT_W].map((x) => (
        <mesh key={x} position={[x, 0.04, 0]}>
          <boxGeometry args={[0.06, 0.08, COURT_LEN * 2 + 0.6]} />
          <meshStandardMaterial color="#ffb31f" emissive="#ff8a00" emissiveIntensity={0.3} roughness={0.6} />
        </mesh>
      ))}
      <AimReticle />
    </group>
  );
}
