import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { currentPalette } from "../../game/atmosphere";
import { mulberry32 } from "../../utils/rand";

/**
 * A couple of kites high over the yard, riding the breeze with a long
 * string trailing down toward the grass. They bob and dip with the wind
 * and fade out once the sky goes dark. Visual only — well above the play.
 */
const KITES: { pos: [number, number, number]; color: string; tail: string; phase: number }[] = [
  { pos: [8, 26, -4], color: "#ff5ab5", tail: "#ffd23e", phase: 0.0 },
  { pos: [-11, 30, 2], color: "#38d6d0", tail: "#ff8a30", phase: 2.1 },
  { pos: [13, 28, -9], color: "#b58cff", tail: "#39b46a", phase: 4.2 },
];

export function Kites() {
  const mats = useRef<THREE.MeshBasicMaterial[]>([]);
  const tails = useRef<THREE.MeshBasicMaterial[]>([]);

  const tailsData = useMemo(() => {
    const rng = mulberry32(88);
    return KITES.map(() => {
      const segs = 7;
      return Array.from({ length: segs }, (_, i) => ({
        len: 0.9 + i * 0.25 + rng() * 0.2,
        w: Math.max(0.02, 0.11 - i * 0.012),
      }));
    });
  }, []);

  useFrame(() => {
    const pal = currentPalette();
    const opacity = Math.max(0.1, 1 - pal.night * 0.95);
    mats.current.forEach((m) => {
      if (m) m.opacity = opacity;
    });
    tails.current.forEach((m) => {
      if (m) m.opacity = opacity * 0.8;
    });
  });

  return (
    <group>
      {KITES.map((k, ki) => (
        <group key={ki} position={k.pos}>
          {/* kite body — diamond of two triangles */}
          <mesh rotation-y={0.3 + ki * 0.2}>
            <coneGeometry args={[0.42, 0.85, 4]} />
            <meshBasicMaterial
              ref={(m) => {
                if (m) mats.current[ki] = m;
              }}
              color={k.color}
              side={THREE.DoubleSide}
              transparent
              opacity={0.95}
            />
          </mesh>
          {/* cross spar hint */}
          <mesh rotation-y={0.3 + ki * 0.2} position={[0, 0, 0.01]}>
            <planeGeometry args={[0.6, 0.04]} />
            <meshBasicMaterial color="#f4f1e8" transparent opacity={0.4} />
          </mesh>
          {/* tail — a dotted ribbon hanging off the bottom */}
          <group position={[0, -0.5, 0]}>
            {tailsData[ki].map((s, si) => (
              <mesh key={si} position={[Math.sin(si * 0.9 + k.phase) * 0.08, -s.len, 0]}>
                <planeGeometry args={[s.w, s.w]} />
                <meshBasicMaterial
                  ref={(m) => {
                    if (m) tails.current[ki] = m;
                  }}
                  color={k.tail}
                  side={THREE.DoubleSide}
                  transparent
                  opacity={0.8}
                />
              </mesh>
            ))}
          </group>
          {/* string to the ground */}
          <mesh position={[0, -24, 0]} rotation-z={0.15 + ki * 0.05}>
            <cylinderGeometry args={[0.008, 0.008, 48, 4]} />
            <meshBasicMaterial color="#f4f1e8" transparent opacity={0.25} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
