import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { currentPalette } from "../../game/atmosphere";

/**
 * A lawn sprinkler on the grass beyond the east fence, chugging through
 * its arc while the sun is up. The spray is a soft translucent fan that
 * sweeps with the head; it goes quiet (and dark) once the lamps take over.
 */
export function Sprinkler() {
  const head = useRef<THREE.Group>(null);
  const spray = useRef<THREE.MeshBasicMaterial>(null);
  const sweep = useRef(0);

  useFrame((_, delta) => {
    const pal = currentPalette();
    // Sweep back and forth, paused once it's properly dark.
    const speed = 0.7 * (1 - pal.night);
    sweep.current += delta * speed;
    const a = Math.sin(sweep.current * 2.2) * 1.1;
    if (head.current) head.current.rotation.y = a;
    if (spray.current) spray.current.opacity = 0.16 * (1 - pal.night * 0.9);
  });

  return (
    <group position={[19.2, 0, 8.5]} rotation-y={-2.6}>
      {/* base */}
      <mesh castShadow position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.16, 0.2, 0.12, 10]} />
        <meshStandardMaterial color="#6f767e" metalness={0.55} roughness={0.4} />
      </mesh>
      {/* neck */}
      <mesh position={[0, 0.2, 0]} rotation-x={0.7}>
        <cylinderGeometry args={[0.03, 0.03, 0.22, 6]} />
        <meshStandardMaterial color="#8d959e" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* rotating head */}
      <group ref={head} position={[0, 0.34, 0]}>
        <mesh>
          <cylinderGeometry args={[0.05, 0.07, 0.1, 8]} />
          <meshStandardMaterial color="#c23227" roughness={0.55} />
        </mesh>
        {/* spray fan — a soft translucent wedge */}
        <mesh position={[0.5, 0.02, 0]} rotation-z={-Math.PI / 2}>
          <coneGeometry args={[0.16, 1.6, 10, 1, true]} />
          <meshBasicMaterial ref={spray} color="#bfe6ff" transparent opacity={0.16} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}
