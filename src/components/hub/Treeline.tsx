import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { currentPalette } from "../../game/atmosphere";
import { mulberry32, ringPoint } from "../../utils/rand";

/**
 * The scenery beyond the fence: a dark treeline on the horizon, soft
 * rolling hills, and a water tower landmark whose beacon winks on after
 * dark. Everything sits far outside the playable yard and melts into the
 * hub's fog, so it reads as distance rather than clutter.
 */
export function Treeline() {
  const pines = useMemo(() => {
    const rng = mulberry32(770);
    return Array.from({ length: 120 }, () => {
      const [x, z] = ringPoint(rng, 104, 142);
      return { x, z, s: 1.7 + rng() * 2.7, yaw: rng() * Math.PI * 2 };
    });
  }, []);

  const hardwoods = useMemo(() => {
    const rng = mulberry32(771);
    return Array.from({ length: 42 }, () => {
      const [x, z] = ringPoint(rng, 94, 112);
      return { x, z, s: 2.0 + rng() * 2.8 };
    });
  }, []);

  const hills = useMemo(() => {
    const rng = mulberry32(772);
    return Array.from({ length: 10 }, () => {
      const [x, z] = ringPoint(rng, 128, 172);
      return { x, z, w: 26 + rng() * 20, h: 4 + rng() * 5 };
    });
  }, []);

  return (
    <group>
      {/* rolling hills */}
      {hills.map((h, i) => (
        <mesh key={i} position={[h.x, -2.5, h.z]} scale={[h.w, h.h, h.w]}>
          <sphereGeometry args={[1, 18, 12]} />
          <meshStandardMaterial color="#41523b" roughness={1} />
        </mesh>
      ))}

      {/* pine ridge */}
      {pines.map((p, i) => (
        <mesh key={i} position={[p.x, 1.7 * p.s, p.z]} rotation-y={p.yaw} scale={[p.s, p.s, p.s]}>
          <coneGeometry args={[1, 3.4, 7]} />
          <meshStandardMaterial color="#26382b" roughness={1} />
        </mesh>
      ))}

      {/* nearer deciduous treeline */}
      {hardwoods.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]} scale={t.s}>
          <mesh position={[0, 1.1, 0]}>
            <cylinderGeometry args={[0.14, 0.2, 2.2, 7]} />
            <meshStandardMaterial color="#3a2c1e" roughness={1} />
          </mesh>
          <mesh position={[0, 2.7, 0]}>
            <sphereGeometry args={[1.3, 10, 8]} />
            <meshStandardMaterial color="#2f4a2e" roughness={1} />
          </mesh>
          <mesh position={[0.6, 2.4, 0.3]}>
            <sphereGeometry args={[0.8, 8, 7]} />
            <meshStandardMaterial color="#3a5a34" roughness={1} />
          </mesh>
        </group>
      ))}

      <WaterTower pos={[88, 0, -96]} />
    </group>
  );
}

/** Classic legged water tower — the landmark you see from the blacktop. */
function WaterTower({ pos }: { pos: [number, number, number] }) {
  const beacon = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(() => {
    if (!beacon.current) return;
    const p = currentPalette();
    beacon.current.emissiveIntensity = 0.12 + p.lamp * 2.6;
  });

  return (
    <group position={pos}>
      {/* legs */}
      {[[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 3.4, lz]}>
          <cylinderGeometry args={[0.12, 0.17, 6.8, 8]} />
          <meshStandardMaterial color="#4c545e" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
      {/* tank */}
      <mesh position={[0, 8.6, 0]}>
        <cylinderGeometry args={[3.0, 3.0, 3.4, 18]} />
        <meshStandardMaterial color="#7a5a3a" roughness={0.85} />
      </mesh>
      {/* tank rim */}
      <mesh position={[0, 10.35, 0]}>
        <cylinderGeometry args={[3.05, 3.05, 0.16, 18]} />
        <meshStandardMaterial color="#4a3826" roughness={0.8} />
      </mesh>
      {/* roof cone */}
      <mesh position={[0, 11.5, 0]}>
        <coneGeometry args={[3.05, 2.2, 18]} />
        <meshStandardMaterial color="#3f4b3a" roughness={0.9} />
      </mesh>
      {/* night beacon */}
      <mesh position={[0, 12.7, 0]}>
        <sphereGeometry args={[0.22, 10, 8]} />
        <meshStandardMaterial ref={beacon} color="#ff5544" emissive="#ff3322" emissiveIntensity={0.12} />
      </mesh>
    </group>
  );
}
