import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { currentPalette } from "../../game/atmosphere";

/**
 * A bus stop shelter on the lawn beside the gate: a little red roof on
 * posts over a bench, with a route sign that glows once the lamps come
 * on. It sits clear of the gate swing and the spawn corridor.
 */
export function BusStop() {
  const sign = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(() => {
    const pal = currentPalette();
    if (sign.current) sign.current.opacity = 0.35 + pal.lamp * 0.65;
  });

  return (
    <group position={[2.2, 0, 13.1]} rotation-y={0.25}>
      {/* roof */}
      <mesh castShadow position={[0, 2.35, 0]} rotation-x={-0.06}>
        <boxGeometry args={[2.4, 0.1, 1.6]} />
        <meshStandardMaterial color="#c23227" roughness={0.7} />
      </mesh>
      {/* roof edge trim */}
      <mesh position={[0, 2.28, 0]}>
        <boxGeometry args={[2.5, 0.06, 1.7]} />
        <meshStandardMaterial color="#8e2320" roughness={0.7} />
      </mesh>
      {/* posts */}
      {[[-1.05, -0.65], [1.05, -0.65], [-1.05, 0.65], [1.05, 0.65]].map(([x, z], i) => (
        <mesh key={i} position={[x, 1.15, z]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 2.3, 8]} />
          <meshStandardMaterial color="#6f767e" metalness={0.5} roughness={0.45} />
        </mesh>
      ))}
      {/* bench */}
      <group position={[0, 0.5, 0.42]}>
        <mesh castShadow>
          <boxGeometry args={[1.6, 0.07, 0.42]} />
          <meshStandardMaterial color="#7a4b2e" roughness={0.85} />
        </mesh>
        {[-0.7, 0.7].map((x, i) => (
          <mesh key={i} position={[x, -0.22, 0]}>
            <boxGeometry args={[0.06, 0.44, 0.36]} />
            <meshStandardMaterial color="#5b6470" metalness={0.5} roughness={0.5} />
          </mesh>
        ))}
      </group>
      {/* back panel */}
      <mesh position={[0, 1.35, -0.68]}>
        <boxGeometry args={[2.0, 1.5, 0.05]} />
        <meshStandardMaterial color="#d8e0e8" roughness={0.6} transparent opacity={0.85} />
      </mesh>
      {/* route sign */}
      <group position={[1.35, 1.9, -0.2]} rotation-y={-0.4}>
        <mesh>
          <planeGeometry args={[0.62, 0.5]} />
          <meshStandardMaterial color="#16232c" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.12, 0.01]}>
          <planeGeometry args={[0.5, 0.22]} />
          <meshBasicMaterial ref={sign} color="#ffe98a" transparent opacity={0.4} />
        </mesh>
      </group>
      {/* tiny bus logo */}
      <mesh position={[-0.9, 2.05, -0.45]}>
        <boxGeometry args={[0.28, 0.16, 0.06]} />
        <meshStandardMaterial color="#ffd23e" roughness={0.6} />
      </mesh>
    </group>
  );
}
