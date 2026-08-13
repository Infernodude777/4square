import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * The field-day hot dog cart parked by the gate — a red cart with a
 * striped umbrella, a little grill, and a soft "open" glow once the
 * lamps come on. Purely decorative, off to the side of the corridor.
 */
export function HotDogCart() {
  const glow = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    if (glow.current) glow.current.opacity = 0.25 + Math.abs(Math.sin(clock.elapsedTime * 1.5)) * 0.25;
  });

  return (
    <group position={[-15.3, 0, 12.2]} rotation-y={0.9}>
      {/* cart body */}
      <mesh castShadow position={[0, 0.55, 0]}>
        <boxGeometry args={[1.4, 0.7, 0.8]} />
        <meshStandardMaterial color="#c23227" roughness={0.6} />
      </mesh>
      {/* white stripe */}
      <mesh position={[0, 0.55, 0.01]}>
        <boxGeometry args={[1.41, 0.12, 0.81]} />
        <meshStandardMaterial color="#f4f1e8" roughness={0.6} />
      </mesh>
      {/* counter */}
      <mesh castShadow position={[0, 0.95, 0]}>
        <boxGeometry args={[1.5, 0.08, 0.85]} />
        <meshStandardMaterial color="#8a5a33" roughness={0.85} />
      </mesh>
      {/* wheels */}
      {[[-0.5, 0.16, 0], [0.5, 0.16, 0]].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.18, 0.18, 0.1, 14]} />
            <meshStandardMaterial color="#20242c" roughness={0.85} />
          </mesh>
          <mesh rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.09, 0.09, 0.11, 10]} />
            <meshStandardMaterial color="#c8ccd2" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
      ))}
      {/* grill on top */}
      <mesh position={[0.35, 1.02, 0.2]}>
        <cylinderGeometry args={[0.14, 0.14, 0.1, 12]} />
        <meshStandardMaterial color="#3a3f46" metalness={0.7} roughness={0.35} />
      </mesh>
      {/* umbrella pole + canopy */}
      <mesh position={[0, 1.35, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.6, 6]} />
        <meshStandardMaterial color="#8d959e" metalness={0.5} roughness={0.45} />
      </mesh>
      <mesh castShadow position={[0, 1.85, 0]}>
        <coneGeometry args={[0.75, 0.3, 12]} />
        <meshStandardMaterial color="#ff5ab5" roughness={0.55} side={THREE.DoubleSide} />
      </mesh>
      {/* little hot dog sign */}
      <mesh position={[0.4, 1.1, 0.44]}>
        <planeGeometry args={[0.5, 0.18]} />
        <meshBasicMaterial ref={glow} color="#ffe98a" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}
