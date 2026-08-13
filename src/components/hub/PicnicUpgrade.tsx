import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * A picnic corner upgrade by the existing table: a charcoal grill with a
 * kettle lid, a blue cooler, and a folding camp chair — the field-day
 * spread. All decorative, tucked against the east fence clear of play.
 */
export function PicnicUpgrade() {
  const smoke = useRef<THREE.Points>(null);
  const smokePhase = useRef(0);

  const positions = useRef<Float32Array | null>(null);
  if (!positions.current) positions.current = new Float32Array(60 * 3);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    smokePhase.current += 0.016;
    const arr = positions.current!;
    for (let i = 0; i < 60; i++) {
      const lift = ((smokePhase.current * 0.35 + i * 0.13) % 1);
      arr[i * 3] = Math.sin(i * 1.7 + t * 1.2) * 0.12 * (1 - lift);
      arr[i * 3 + 1] = 0.25 + lift * 1.1;
      arr[i * 3 + 2] = Math.cos(i * 2.3 + t * 0.9) * 0.1 * (1 - lift);
    }
    if (smoke.current) {
      const attr = smoke.current.geometry.attributes.position as THREE.BufferAttribute;
      attr.needsUpdate = true;
    }
  });

  return (
    <group position={[14.6, 0, 11.4]}>
      {/* grill */}
      <group position={[0, 0, 0]}>
        {/* legs */}
        {[[-0.28, 0], [0.28, 0], [-0.28, 0.1], [0.28, 0.1]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.24, z]} castShadow>
            <cylinderGeometry args={[0.012, 0.012, 0.48, 6]} />
            <meshStandardMaterial color="#3a3f46" metalness={0.7} roughness={0.35} />
          </mesh>
        ))}
        {/* bowl */}
        <mesh castShadow position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.34, 0.24, 0.32, 16]} />
          <meshStandardMaterial color="#2c3138" metalness={0.75} roughness={0.3} />
        </mesh>
        {/* kettle lid, slightly ajar */}
        <mesh castShadow position={[0.02, 0.62, -0.05]} rotation-x={0.18}>
          <sphereGeometry args={[0.28, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#1f242b" metalness={0.8} roughness={0.28} />
        </mesh>
        {/* lid knob */}
        <mesh position={[0.02, 0.86, -0.05]}>
          <cylinderGeometry args={[0.03, 0.03, 0.05, 8]} />
          <meshStandardMaterial color="#8d959e" metalness={0.6} roughness={0.4} />
        </mesh>
        {/* vent + handle */}
        <mesh position={[0.2, 0.52, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.14, 6]} />
          <meshStandardMaterial color="#8d959e" metalness={0.6} roughness={0.4} />
        </mesh>
        {/* smoke puffs */}
        <points ref={smoke}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[positions.current!, 3]} />
          </bufferGeometry>
          <pointsMaterial size={0.07} color="#cfd4da" transparent opacity={0.5} depthWrite={false} />
        </points>
      </group>

      {/* cooler */}
      <group position={[0.85, 0, 0.4]} rotation-y={-0.5}>
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.4, 0.34]} />
          <meshStandardMaterial color="#2f6fdb" roughness={0.5} metalness={0.15} />
        </mesh>
        <mesh position={[0, 0.21, 0]}>
          <boxGeometry args={[0.52, 0.03, 0.36]} />
          <meshStandardMaterial color="#2458b0" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.04, 0.18]}>
          <boxGeometry args={[0.16, 0.1, 0.02]} />
          <meshStandardMaterial color="#e8edf4" roughness={0.6} />
        </mesh>
      </group>

      {/* folding camp chair */}
      <group position={[-0.9, 0, 0.6]} rotation-y={1.1}>
        <mesh castShadow position={[0, 0.3, 0]}>
          <boxGeometry args={[0.42, 0.42, 0.03]} />
          <meshStandardMaterial color="#e2483d" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.55, -0.16]} rotation-x={0.35}>
          <boxGeometry args={[0.42, 0.42, 0.03]} />
          <meshStandardMaterial color="#e2483d" roughness={0.6} />
        </mesh>
        {[[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.14, z]} rotation-x={z > 0 ? 0.15 : -0.15}>
            <cylinderGeometry args={[0.012, 0.012, 0.3, 6]} />
            <meshStandardMaterial color="#9aa0a6" metalness={0.6} roughness={0.4} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
