import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mulberry32 } from "../../utils/rand";

/**
 * Two utility poles beyond the east fence with a sagging span of wires
 * between them and a transformer can. A couple of starlings perch on the
 * wire and occasionally take a hop. All beyond the fence — visual only.
 */
export function UtilityPoles() {
  const birds = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const data = useMemo(() => {
    const rng = mulberry32(77);
    return Array.from({ length: 4 }, () => ({
      x: -3.2 + rng() * 6.4,
      phase: rng() * Math.PI * 2,
      flap: 0.6 + rng() * 0.8,
    }));
  }, []);

  useFrame(({ clock }) => {
    const m = birds.current;
    if (!m) return;
    const t = clock.elapsedTime;
    data.forEach((b, i) => {
      dummy.position.set(b.x, 5.05 + Math.sin(t * 0.5 + b.phase) * 0.05, 0.02);
      dummy.rotation.set(0, 0, Math.sin(t * b.flap + b.phase) * 0.08);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });

  const Wire = ({ x1, x2, sag }: { x1: number; x2: number; sag: number }) => (
    <group>
      {Array.from({ length: 24 }, (_, i) => {
        const t = i / 23;
        const y = (x2 - x1) * 0 + sag * Math.sin(t * Math.PI);
        return (
          <mesh key={i} position={[x1 + (x2 - x1) * t, 5.2 - y, 0]} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[0.008, 0.008, 0.32, 4]} />
            <meshBasicMaterial color="#2a2e33" />
          </mesh>
        );
      })}
    </group>
  );

  const Pole = ({ x, arm }: { x: number; arm: number }) => (
    <group position={[x, 0, 0]}>
      <mesh castShadow position={[0, 4.4, 0]}>
        <cylinderGeometry args={[0.09, 0.13, 8.8, 8]} />
        <meshStandardMaterial color="#7a512f" roughness={0.85} />
      </mesh>
      {/* crossarm */}
      <mesh position={[0, 5.3, 0]}>
        <boxGeometry args={[1.5, 0.07, 0.07]} />
        <meshStandardMaterial color="#5e3a2e" roughness={0.85} />
      </mesh>
      {/* insulators */}
      {[-0.55, 0.55].map((ix, i) => (
        <mesh key={i} position={[ix * arm, 5.38, 0]}>
          <cylinderGeometry args={[0.03, 0.05, 0.12, 6]} />
          <meshBasicMaterial color="#d8dde2" />
        </mesh>
      ))}
      {/* transformer can */}
      <mesh castShadow position={[0.45, 4.2, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.5, 10]} />
        <meshStandardMaterial color="#8a8f96" metalness={0.55} roughness={0.4} />
      </mesh>
    </group>
  );

  return (
    <group position={[17.6, 0, 1.5]}>
      <Pole x={-3.4} arm={1} />
      <Pole x={3.4} arm={-1} />
      <Wire x1={-2.7} x2={2.7} sag={0.55} />
      {/* perched starlings */}
      <instancedMesh ref={birds} args={[undefined, undefined, 4]}>
        <sphereGeometry args={[0.055, 6, 5]} />
        <meshStandardMaterial color="#20242c" roughness={0.7} />
      </instancedMesh>
    </group>
  );
}
