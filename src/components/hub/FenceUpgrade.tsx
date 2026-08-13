import { useLayoutEffect, useMemo, useRef } from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { makeChainlinkTexture } from "../../game/textures";
import { mulberry32 } from "../../utils/rand";

const VINES = 90;
const VINE_GREENS = ["#2e5c26", "#3a702e", "#468238"];

/**
 * Fence dressing: gold finials on the corner posts, climbing vines on the
 * west and east runs, and a welcoming banner + gate over the south fence
 * facing the spawn corridor.
 */
export function FenceUpgrade() {
  const vines = useMemo(() => {
    const rng = mulberry32(60);
    return Array.from({ length: VINES }, () => {
      const side = rng() < 0.5 ? -1 : 1; // west / east fence
      return {
        x: side * 16,
        z: side < 0 ? -8 + rng() * 16 : -6 + rng() * 12,
        y: 0.3 + rng() * 1.9,
        s: 0.7 + rng() * 0.8,
        rot: (rng() - 0.5) * 0.8,
        c: rng(),
      };
    });
  }, []);

  const vineMesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  useLayoutEffect(() => {
    const m = vineMesh.current;
    if (!m) return;
    vines.forEach((v, i) => {
      dummy.position.set(v.x, v.y, v.z);
      dummy.rotation.set(v.rot, 0, v.rot);
      dummy.scale.setScalar(v.s);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      color.set(VINE_GREENS[Math.floor(v.c * VINE_GREENS.length) % VINE_GREENS.length]);
      m.setColorAt(i, color);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [vines]);

  const chainlink = useMemo(() => makeChainlinkTexture(), []);

  return (
    <group>
      {/* gold finials on the four corner posts */}
      {[[-16, -13], [16, -13], [-16, 13], [16, 13]].map(([x, z], i) => (
        <mesh key={i} position={[x, 2.56, z]}>
          <sphereGeometry args={[0.13, 12, 10]} />
          <meshStandardMaterial color="#f2b53c" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}

      {/* climbing vines on the west + east fence runs */}
      <instancedMesh ref={vineMesh} args={[undefined, undefined, VINES]}>
        <planeGeometry args={[0.55, 0.42]} />
        <meshStandardMaterial roughness={0.95} side={THREE.DoubleSide} />
      </instancedMesh>

      {/* south gate — a chain-link panel with a frame and latch */}
      <group position={[-1.35, 0, 13.04]}>
        {/* panel */}
        <mesh position={[1.35, 1.15, 0]} receiveShadow>
          <boxGeometry args={[2.7, 2.3, 0.05]} />
          <meshStandardMaterial map={chainlink} transparent opacity={0.9} alphaTest={0.25} side={THREE.DoubleSide} metalness={0.4} roughness={0.5} />
        </mesh>
        {/* frame */}
        {[[0.05, 1.15], [2.65, 1.15], [1.35, 0.08], [1.35, 2.22]].map(([x, y], i) => (
          <mesh key={i} position={[x, y, 0]}>
            <boxGeometry args={[i < 2 ? 0.08 : 2.7, i < 2 ? 2.3 : 0.08, 0.07]} />
            <meshStandardMaterial color="#7d858e" metalness={0.6} roughness={0.4} />
          </mesh>
        ))}
        {/* latch */}
        <mesh position={[2.72, 1.25, 0]}>
          <boxGeometry args={[0.12, 0.16, 0.1]} />
          <meshStandardMaterial color="#5b6470" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>

      {/* welcome banner over the gate */}
      <group>
        {[-1.6, 1.6].map((x, i) => (
          <mesh key={i} position={[x, 1.15, 12.98]} castShadow>
            <cylinderGeometry args={[0.05, 0.06, 2.3, 8]} />
            <meshStandardMaterial color="#7d858e" metalness={0.6} roughness={0.4} />
          </mesh>
        ))}
        <mesh position={[0, 3.0, 12.94]} castShadow>
          <boxGeometry args={[3.7, 0.85, 0.04]} />
          <meshStandardMaterial color="#c23227" roughness={0.7} />
        </mesh>
        <Text position={[0, 3.0, 12.96]} rotation-y={Math.PI} fontSize={0.34} color="#ffd23e" anchorX="center" anchorY="middle">
          FALCON ELEMENTARY
        </Text>
      </group>
    </group>
  );
}
