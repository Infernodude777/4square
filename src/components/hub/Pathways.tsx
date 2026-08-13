import { useMemo } from "react";
import { makeDirtTexture } from "../../game/textures";

// Worn dirt paths between the courts — flat decals just above the blacktop,
// laid along the natural walking lines so they read as traffic, not clutter.
const PATHS: { x: number; z: number; w: number; d: number }[] = [
  { x: 0, z: 7.5, w: 2.6, d: 7 },      // spawn corridor → centre
  { x: 13, z: 0, w: 2.4, d: 16 },      // east strip, under the red-light lane
  { x: -12.6, z: 0.5, w: 2.2, d: 17 }, // west sidewalk
  { x: -4.6, z: 10.6, w: 1.8, d: 3 },  // over to the swings
];

const MANHOLES: { x: number; z: number }[] = [
  { x: 4.4, z: 6.8 },
  { x: -4.6, z: -4.2 },
  { x: 11.6, z: 6.4 },
];

/** Dirt wear + cast-iron manholes on the blacktop corridors (visual only). */
export function Pathways() {
  const dirt = useMemo(() => makeDirtTexture(), []);

  return (
    <group>
      {PATHS.map((p, i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[p.x, 0.006, p.z]} receiveShadow>
          <planeGeometry args={[p.w, p.d]} />
          <meshStandardMaterial map={dirt} roughness={1} />
        </mesh>
      ))}
      {MANHOLES.map((m, i) => (
        <group key={i} position={[m.x, 0.002, m.z]}>
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.004, 0]}>
            <cylinderGeometry args={[0.42, 0.42, 0.02, 24]} />
            <meshStandardMaterial color="#6a7078" roughness={0.85} metalness={0.4} />
          </mesh>
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.014, 0]}>
            <circleGeometry args={[0.34, 24]} />
            <meshStandardMaterial color="#4c545e" roughness={0.9} metalness={0.5} />
          </mesh>
          {[[-0.14, 0], [0.14, 0], [0, -0.14], [0, 0.14]].map(([x, z], j) => (
            <mesh key={j} rotation-x={-Math.PI / 2} position={[x, 0.026, z]}>
              <planeGeometry args={[0.09, 0.05]} />
              <meshStandardMaterial color="#33383f" roughness={0.95} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
