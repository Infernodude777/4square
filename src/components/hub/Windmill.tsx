import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { currentPalette } from "../../game/atmosphere";

/**
 * A little decorative windmill on the far lawn with a slow-turning
 * four-blade rotor — the sort of lawn ornament a proud school has. The
 * blades spin gently while the sun is up and slow to a stop at night.
 */
export function Windmill() {
  const rotor = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const pal = currentPalette();
    const speed = 0.5 * (1 - pal.night * 0.8);
    if (rotor.current) rotor.current.rotation.z = clock.elapsedTime * speed;
  });

  return (
    <group position={[23.5, 0, -9.5]}>
      {/* base */}
      <mesh castShadow position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.7, 0.85, 1.0, 8]} />
        <meshStandardMaterial color="#7a512f" roughness={0.85} />
      </mesh>
      {/* tower */}
      <mesh castShadow position={[0, 2.2, 0]}>
        <cylinderGeometry args={[0.55, 0.7, 2.4, 8]} />
        <meshStandardMaterial color="#8a5a33" roughness={0.85} />
      </mesh>
      {/* cap */}
      <mesh position={[0, 3.5, 0]}>
        <coneGeometry args={[0.6, 0.5, 8]} />
        <meshStandardMaterial color="#5e3a2e" roughness={0.85} />
      </mesh>
      {/* rotor hub */}
      <group ref={rotor} position={[0, 3.1, 0.62]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} rotation-z={(i / 4) * Math.PI * 2}>
            <boxGeometry args={[0.09, 1.6, 0.05]} />
            <meshStandardMaterial color="#e8edf4" roughness={0.6} />
          </mesh>
        ))}
        <mesh>
          <sphereGeometry args={[0.09, 8, 6]} />
          <meshStandardMaterial color="#f2b53c" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>
      {/* little door */}
      <mesh position={[0, 0.8, 0.72]}>
        <boxGeometry args={[0.3, 0.55, 0.04]} />
        <meshStandardMaterial color="#4a3028" roughness={0.9} />
      </mesh>
      {/* window */}
      <mesh position={[0, 2.2, 0.7]}>
        <circleGeometry args={[0.12, 12]} />
        <meshStandardMaterial color="#ffe3a1" roughness={0.4} />
      </mesh>
    </group>
  );
}
