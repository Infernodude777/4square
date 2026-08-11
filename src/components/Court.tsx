import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { makeCourtTexture } from "../game/textures";
import { RT } from "../game/refs";
import { SQ_CENTER, squareAt } from "../game/constants";
import { useSettings } from "../game/settings";

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
    </group>
  );
}
