import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { dayFraction } from "../../game/atmosphere";

/**
 * A little stone sundial on the lawn by the treeline — the sort of thing
 * a science teacher sets up. The gnomon casts a lazy shadow arm that
 * tracks the school-day clock, and the whole thing is purely decorative.
 */
export function Sundial() {
  const hand = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (hand.current) {
      // The shadow arm rotates with the sun (driven by the shared clock).
      hand.current.rotation.y = dayFraction() * Math.PI * 2;
    }
  });

  return (
    <group position={[-26.4, 0, -11.8]} rotation-y={0.5}>
      {/* base disc */}
      <mesh castShadow rotation-x={-Math.PI / 2} position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.5, 0.55, 0.12, 18]} />
        <meshStandardMaterial color="#b9b6ac" roughness={0.75} />
      </mesh>
      {/* hour ticks */}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.42, 0.18, Math.sin(a) * 0.42]} rotation-x={-Math.PI / 2}>
            <boxGeometry args={[0.03, 0.05, 0.03]} />
            <meshStandardMaterial color="#7d858e" roughness={0.6} />
          </mesh>
        );
      })}
      {/* gnomon (the pointy bit) */}
      <mesh castShadow position={[0, 0.24, 0]} rotation-x={0.6}>
        <coneGeometry args={[0.05, 0.55, 4]} />
        <meshStandardMaterial color="#5b6470" metalness={0.55} roughness={0.4} />
      </mesh>
      {/* shadow arm */}
      <mesh ref={hand} position={[0, 0.17, 0]} rotation-x={-Math.PI / 2}>
        <boxGeometry args={[0.34, 0.015, 0.015]} />
        <meshStandardMaterial color="#2a2e33" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}
