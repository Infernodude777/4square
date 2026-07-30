import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { makeCourtTexture } from "../game/textures";
import { RT } from "../game/refs";
import { SQ_CENTER, squareAt } from "../game/constants";

export function Court() {
  const tex = useMemo(() => makeCourtTexture(), []);
  const reticle = useRef<THREE.Mesh>(null);
  const retMat = useRef<THREE.MeshBasicMaterial>(null);
  const hl = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (reticle.current && retMat.current) {
      reticle.current.position.set(RT.aim.x, 0.035, RT.aim.z);
      reticle.current.scale.setScalar(1 + Math.sin(t * 7) * 0.09);
      retMat.current.color.set(RT.aimLegal ? "#7dff9a" : "#ff6b5e");
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
      {/* aim reticle */}
      <mesh ref={reticle} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.32, 0.42, 40]} />
        <meshBasicMaterial ref={retMat} transparent opacity={0.9} depthWrite={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]} visible={false}>
        <circleGeometry args={[0.06, 12]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* legal square highlight */}
      <mesh ref={hl} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[3.86, 3.86]} />
        <meshBasicMaterial color="#ffe066" transparent opacity={0.1} depthWrite={false} />
      </mesh>
    </group>
  );
}
