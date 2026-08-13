import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { dayFraction } from "../../game/atmosphere";
import { mulberry32 } from "../../utils/rand";

const IVY = 90;
const IVY_GREENS = ["#2e5c26", "#3a702e", "#468238", "#25511f"];

/**
 * Dressing for the school building: climbing ivy on the end walls, a
 * school clock that ticks through the day, a bike rack, trash cans and
 * roof-top vents — all sitting between the north fence and the building
 * face (or on the roof), so nothing gets in the player's way.
 */
export function BuildingDress() {
  const ivy = useMemo(() => {
    const rng = mulberry32(50);
    return Array.from({ length: IVY }, () => {
      // Left or right end of the front face, hugging the corners.
      const side = rng() < 0.5 ? -1 : 1;
      return {
        x: side * (13.7 + rng() * 1.3),
        y: 0.3 + rng() * 6.5,
        z: -14.22 + (rng() - 0.5) * 0.06,
        s: 0.6 + rng() * 0.8,
        rot: (rng() - 0.5) * 0.7,
        c: rng(),
      };
    });
  }, []);

  const ivyMesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  useLayoutEffect(() => {
    const m = ivyMesh.current;
    if (!m) return;
    ivy.forEach((v, i) => {
      dummy.position.set(v.x, v.y, v.z);
      dummy.rotation.set(v.rot, 0, v.rot);
      dummy.scale.setScalar(v.s);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      color.set(IVY_GREENS[Math.floor(v.c * IVY_GREENS.length) % IVY_GREENS.length]);
      m.setColorAt(i, color);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [ivy]);

  const clock = useRef<THREE.Group>(null);
  useFrame(() => {
    const g = clock.current;
    if (!g) return;
    const f = dayFraction();
    // One full rotation of the hour hand per school day, minute hand ×12.
    g.rotation.z = -f * Math.PI * 2 - Math.PI / 2;
  });

  return (
    <group>
      {/* ivy climbing the front corners */}
      <instancedMesh ref={ivyMesh} args={[undefined, undefined, IVY]}>
        <planeGeometry args={[0.5, 0.38]} />
        <meshStandardMaterial roughness={0.95} side={THREE.DoubleSide} />
      </instancedMesh>

      {/* school clock — between the wallball wall and the east windows */}
      <group position={[4.3, 5.5, -14.32]}>
        <mesh rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.62, 0.62, 0.06, 24]} />
          <meshStandardMaterial color="#e8e2d4" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <torusGeometry args={[0.62, 0.045, 10, 28]} />
          <meshStandardMaterial color="#2a3138" roughness={0.6} />
        </mesh>
        <group ref={clock} position={[0, 0, 0.05]}>
          <mesh position={[0, 0.16, 0]}>
            <boxGeometry args={[0.05, 0.32, 0.02]} />
            <meshStandardMaterial color="#1c2228" roughness={0.6} />
          </mesh>
          <mesh position={[0.1, 0, 0]}>
            <boxGeometry args={[0.2, 0.05, 0.02]} />
            <meshStandardMaterial color="#1c2228" roughness={0.6} />
          </mesh>
        </group>
      </group>

      {/* bike rack — west of the door, clear of the flower bed */}
      <group position={[-5.4, 0, -13.7]}>
        {[0, 0.28].map((y, i) => (
          <mesh key={i} position={[0, 0.4 + y, 0]} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[0.03, 0.03, 2.6, 8]} />
            <meshStandardMaterial color="#5b6470" metalness={0.6} roughness={0.4} />
          </mesh>
        ))}
        {Array.from({ length: 7 }, (_, i) => (
          <mesh key={i} position={[-1.2 + i * 0.4, 0.8, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.8, 6]} />
            <meshStandardMaterial color="#5b6470" metalness={0.6} roughness={0.4} />
          </mesh>
        ))}
      </group>

      {/* trash cans */}
      {[4.6, 5.7].map((x, i) => (
        <group key={i} position={[x, 0, -13.7]}>
          <mesh position={[0, 0.34, 0]}>
            <cylinderGeometry args={[0.3, 0.26, 0.68, 12]} />
            <meshStandardMaterial color="#3f6f3c" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.72, 0]}>
            <cylinderGeometry args={[0.34, 0.34, 0.06, 12]} />
            <meshStandardMaterial color="#2c4f2a" roughness={0.7} />
          </mesh>
        </group>
      ))}

      {/* roof details: AC units + vent pipes */}
      {[-8.5, 8.5].map((x, i) => (
        <group key={i} position={[x, 8.55, -17]}>
          <mesh position={[0, 0.35, 0]}>
            <boxGeometry args={[1.5, 0.7, 1.1]} />
            <meshStandardMaterial color="#9aa0a6" roughness={0.8} metalness={0.3} />
          </mesh>
          <mesh position={[0, 0.74, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.06, 16]} />
            <meshStandardMaterial color="#c8ccd2" metalness={0.5} roughness={0.4} />
          </mesh>
        </group>
      ))}
      {[-4, 6].map((x, i) => (
        <mesh key={i} position={[x, 8.85, -17]}>
          <cylinderGeometry args={[0.12, 0.12, 0.6, 10]} />
          <meshStandardMaterial color="#7d858e" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}
