import { useMemo } from "react";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mulberry32 } from "../../utils/rand";

/**
 * A bean trellis arch in the garden — two wooden lattices leaning into
 * each other with a scattering of green leaves and a few tiny red
 * blossoms. The leaves sway very gently. Visual only, on the lawn.
 */
export function Trellis() {
  const leaves = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  const data = useMemo(() => {
    const rng = mulberry32(91);
    return Array.from({ length: 46 }, () => ({
      x: (rng() - 0.5) * 1.7,
      y: 0.2 + rng() * 1.5,
      z: (rng() - 0.5) * 1.1,
      s: 0.05 + rng() * 0.06,
      rot: rng() * Math.PI * 2,
      ph: rng() * Math.PI * 2,
      red: rng() < 0.25,
    }));
  }, []);

  useFrame(({ clock }) => {
    const m = leaves.current;
    if (!m) return;
    const t = clock.elapsedTime;
    data.forEach((d, i) => {
      dummy.position.set(d.x, d.y + Math.sin(t * 0.6 + d.ph) * 0.03, d.z);
      dummy.rotation.set(d.rot, 0, Math.sin(t * 0.5 + d.ph) * 0.1);
      dummy.scale.setScalar(d.s);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      color.set(d.red ? "#e2483d" : "#3f7a33");
      m.setColorAt(i, color);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });

  const Lattice = ({ x }: { x: number }) => (
    <group position={[x, 0, 0]}>
      {[-0.8, 0.8].map((dx, i) => (
        <mesh key={i} castShadow position={[dx, 1.0, 0]}>
          <boxGeometry args={[0.05, 2.0, 0.05]} />
          <meshStandardMaterial color="#7a512f" roughness={0.85} />
        </mesh>
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} castShadow position={[0, 0.25 + i * 0.35, 0]} rotation-y={Math.PI / 2} rotation-z={0.3 * (i % 2 ? 1 : -1)}>
          <boxGeometry args={[0.05, 1.7, 0.04]} />
          <meshStandardMaterial color="#7a512f" roughness={0.85} />
        </mesh>
      ))}
    </group>
  );

  return (
    <group position={[-18.6, 0, -14.4]} rotation-y={0.3}>
      <Lattice x={-0.85} />
      <Lattice x={0.85} />
      {/* top rail */}
      <mesh castShadow position={[0, 2.1, 0]}>
        <boxGeometry args={[2.2, 0.06, 0.06]} />
        <meshStandardMaterial color="#7a512f" roughness={0.85} />
      </mesh>
      {/* swaying leaves + a few red blossoms */}
      <instancedMesh ref={leaves} args={[undefined, undefined, 46]}>
        <sphereGeometry args={[1, 6, 5]} />
        <meshStandardMaterial roughness={0.7} />
      </instancedMesh>
    </group>
  );
}
