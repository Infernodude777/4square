import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * A weather vane on the school roof — an arrow and a little falcon that
 * swings slowly around as the wind changes. It sits on the building's
 * roof ridge, well out of the way; the rotation is pure decoration.
 */
export function WeatherVane() {
  const vane = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (vane.current) {
      // Slow, slightly irregular swing — the wind never quite decides.
      vane.current.rotation.y = Math.sin(clock.elapsedTime * 0.18) * 2.4 + clock.elapsedTime * 0.05;
    }
  });

  return (
    <group position={[-3.5, 8.9, -17.6]}>
      {/* mast */}
      <mesh castShadow position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 2.0, 6]} />
        <meshStandardMaterial color="#7d858e" metalness={0.7} roughness={0.35} />
      </mesh>
      {/* swinging arrow */}
      <group ref={vane} position={[0, 1.9, 0]}>
        {/* arrow shaft */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.1, 0.05, 0.05]} />
          <meshStandardMaterial color="#20242c" roughness={0.7} />
        </mesh>
        {/* arrow head */}
        <mesh position={[0.62, 0, 0]} rotation-z={Math.PI / 2}>
          <coneGeometry args={[0.1, 0.24, 3]} />
          <meshStandardMaterial color="#20242c" roughness={0.7} />
        </mesh>
        {/* arrow tail */}
        <mesh position={[-0.5, 0, 0]}>
          <boxGeometry args={[0.22, 0.22, 0.04]} />
          <meshStandardMaterial color="#c23227" roughness={0.7} />
        </mesh>
        {/* cardinal markers */}
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[Math.cos((i / 4) * Math.PI * 2) * 0.55, 0, Math.sin((i / 4) * Math.PI * 2) * 0.55]}>
            <boxGeometry args={[0.02, 0.16, 0.02]} />
            <meshStandardMaterial color="#c8ccd2" metalness={0.6} roughness={0.4} />
          </mesh>
        ))}
      </group>
      {/* little falcon on top */}
      <mesh position={[0, 2.25, 0]}>
        <coneGeometry args={[0.06, 0.2, 4]} />
        <meshStandardMaterial color="#c23227" roughness={0.7} />
      </mesh>
    </group>
  );
}
