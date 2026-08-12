import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { makeCourtTexture } from "../game/textures";
import { RT } from "../game/refs";
import { SQ_CENTER, squareAt } from "../game/constants";
import { useSettings } from "../game/settings";
import { useGame } from "../game/store";
import { ruleName } from "../game/rules";

/**
 * Season 3 — the court rule board. A little chalkboard on a post at the
 * south edge of the court. In a match it shows the king's standing house
 * rule (or "PLAY FREE" when no rule is up); in the hub it just reminds
 * everyone who's in charge.
 */
function RuleBoard() {
  const rule = useGame((s) => s.rule);
  const name = rule ? ruleName(rule) : null;

  return (
    <group position={[0, 0.06, 4.92]}>
      {/* post */}
      <mesh castShadow position={[0, 0.62, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 1.28, 8]} />
        <meshStandardMaterial color="#6f7a85" metalness={0.5} roughness={0.5} />
      </mesh>
      {/* board */}
      <group position={[0, 1.52, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.7, 0.9, 0.06]} />
          <meshStandardMaterial color="#16232c" roughness={0.82} />
        </mesh>
        <mesh position={[0, 0, -0.042]}>
          <boxGeometry args={[1.86, 1.06, 0.04]} />
          <meshStandardMaterial color="#24423a" roughness={0.7} />
        </mesh>
        <Text position={[0, 0.24, 0.03]} fontSize={0.13} color="#8fd8cf" anchorX="center" anchorY="middle">
          {rule ? "KING CALLS" : "THE KING CALLS"}
        </Text>
        <Text position={[0, -0.1, 0.03]} fontSize={0.19} color="#ffd23e" anchorX="center" anchorY="middle">
          {rule ? name : "THE RULES"}
        </Text>
      </group>
    </group>
  );
}

export function Court() {
  const tex = useMemo(() => makeCourtTexture(), []);
  const reticle = useRef<THREE.Object3D>(null);
  const hl = useRef<THREE.Mesh>(null);
  const reticleStyle = useSettings((s) => s.reticleStyle);

  // One shared material for every reticle variant — tinted live by the
  // frame loop, so switching the RETICLE setting costs nothing.
  const retMat = useMemo(
    () => new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.9, depthWrite: false }),
    [],
  );
  useEffect(() => () => retMat.dispose(), [retMat]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (reticle.current) {
      reticle.current.position.set(RT.aim.x, 0.035, RT.aim.z);
      reticle.current.scale.setScalar(1 + Math.sin(t * 7) * 0.09);
      retMat.color.set(RT.aimLegal ? "#7dff9a" : "#ff6b5e");
    }
    if (hl.current) {
      const s = squareAt(RT.aim.x, RT.aim.z);
      const m = hl.current.material as THREE.MeshBasicMaterial;
      if (s && RT.aimLegal) {
        hl.current.visible = true;
        hl.current.position.set(SQ_CENTER[s][0], 0.02, SQ_CENTER[s][1]);
        m.opacity = 0.09 + Math.sin(t * 5) * 0.04;
      } else {
        hl.current.visible = false;
      }
    }
  });

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[9, 9]} />
        <meshStandardMaterial map={tex} roughness={0.96} />
      </mesh>
      {/* aim reticle — geometry follows the RETICLE setting */}
      {reticleStyle === "classic" && (
        <mesh ref={reticle} rotation-x={-Math.PI / 2} material={retMat}>
          <ringGeometry args={[0.32, 0.42, 40]} />
        </mesh>
      )}
      {reticleStyle === "dot" && (
        <mesh ref={reticle} rotation-x={-Math.PI / 2} material={retMat}>
          <circleGeometry args={[0.09, 18]} />
        </mesh>
      )}
      {reticleStyle === "cross" && (
        <group ref={reticle}>
          <mesh rotation-x={-Math.PI / 2} material={retMat}>
            <boxGeometry args={[0.58, 0.09, 0.004]} />
          </mesh>
          <mesh rotation-x={-Math.PI / 2} material={retMat}>
            <boxGeometry args={[0.09, 0.58, 0.004]} />
          </mesh>
        </group>
      )}
      {/* legal square highlight */}
      <mesh ref={hl} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[3.86, 3.86]} />
        <meshBasicMaterial color="#ffe066" transparent opacity={0.1} depthWrite={false} />
      </mesh>
      {/* Season 3 — the king's rule board */}
      <RuleBoard />
    </group>
  );
}
