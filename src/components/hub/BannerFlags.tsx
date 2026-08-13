import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mulberry32 } from "../../utils/rand";

const COLORS = ["#c23227", "#ffd23e", "#3f6fb5", "#39b46a", "#f7b32b"];
const SPAN = 11.8; // half-span of the string, x = ±SPAN

/**
 * A string of school-colour pennant flags sagging across the south fence,
 * high above the playground so nothing collides with play. The little
 * flags sway in the breeze while the rope holds a gentle catenary.
 */
export function BannerFlags() {
  const flagRefs = useRef<(THREE.Mesh | null)[]>([]);

  const rng = useMemo(() => mulberry32(31337), []);

  const flags = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => {
        const t = (i + 0.5) / 18;
        return {
          x: -SPAN + t * SPAN * 2,
          y: 6.3 - Math.sin(t * Math.PI) * 0.9,
          c: COLORS[Math.floor(rng() * COLORS.length) % COLORS.length],
          ph: rng() * Math.PI * 2,
          sp: 0.5 + rng() * 0.4,
        };
      }),
    [rng],
  );

  const curve = useMemo(() => {
    const pts = Array.from({ length: 21 }, (_, i) => {
      const t = i / 20;
      return new THREE.Vector3(-SPAN + t * SPAN * 2, 6.3 - Math.sin(t * Math.PI) * 0.9, 12.5);
    });
    return new THREE.CatmullRomCurve3(pts);
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    flags.forEach((f, i) => {
      const m = flagRefs.current[i];
      if (m) m.rotation.z = Math.sin(t * f.sp + f.ph) * 0.12;
    });
  });

  return (
    <group>
      {/* the rope itself */}
      <mesh>
        <tubeGeometry args={[curve, 40, 0.018, 5, false]} />
        <meshStandardMaterial color="#3a322c" roughness={0.9} />
      </mesh>
      {/* end posts */}
      {[-SPAN, SPAN].map((x, i) => (
        <mesh key={i} position={[x, 3.15, 12.5]} castShadow>
          <cylinderGeometry args={[0.05, 0.06, 6.3, 8]} />
          <meshStandardMaterial color="#7a4b2e" roughness={0.8} />
        </mesh>
      ))}
      {/* pennants */}
      {flags.map((f, i) => (
        <group key={i} position={[f.x, f.y, 12.5]}>
          <mesh
            ref={(m) => {
              flagRefs.current[i] = m;
            }}
            rotation-x={Math.PI}
            scale={[1, 1.05, 0.4]}
          >
            <coneGeometry args={[0.17, 0.44, 3]} />
            <meshBasicMaterial color={f.c} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
