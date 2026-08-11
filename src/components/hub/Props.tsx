import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { currentPalette } from "../../game/atmosphere";

// ─────────────────────────────────────────────────────────────
//  YARD PROPS — the extras that make Falcon Elementary feel lived
//  in (Season 2). Everything is procedural geometry: monkey bars,
//  a picnic table, fence-line bushes, a flower bed, and chalk
//  doodles on the blacktop. Colliders for the solid pieces live
//  in hub/colliders.ts.
// ─────────────────────────────────────────────────────────────

/** Monkey bars — north end of the new east strip. */
export function MonkeyBars({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      {/* two A-frames */}
      {[-1.8, 1.8].map((x) => (
        <group key={x}>
          {[-0.55, 0.55].map((z, i) => (
            <mesh key={i} castShadow position={[x, 1.1, z]} rotation-x={z < 0 ? 0.42 : -0.42}>
              <cylinderGeometry args={[0.05, 0.05, 2.4, 8]} />
              <meshStandardMaterial color="#8d959e" metalness={0.6} roughness={0.4} />
            </mesh>
          ))}
        </group>
      ))}
      {/* the bars themselves */}
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} castShadow position={[-1.8 + i * 0.6, 2.15, 0]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.032, 0.032, 1.15, 8]} />
          <meshStandardMaterial color="#8d959e" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      {/* top rails */}
      {[-0.55, 0.55].map((z, i) => (
        <mesh key={i} castShadow position={[0, 2.15, z]}>
          <cylinderGeometry args={[0.045, 0.045, 3.7, 8]} />
          <meshStandardMaterial color="#7d858e" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

/** Picnic table — south-east, beside the new strip. */
export function PicnicTable({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos} rotation-y={-0.5}>
      {/* tabletop */}
      <mesh castShadow position={[0, 0.72, 0]}>
        <boxGeometry args={[1.7, 0.07, 0.72]} />
        <meshStandardMaterial color="#7a4b2e" roughness={0.85} />
      </mesh>
      {/* benches */}
      {[-0.5, 0.5].map((z, i) => (
        <mesh key={i} castShadow position={[0, 0.42, z]}>
          <boxGeometry args={[1.7, 0.06, 0.3]} />
          <meshStandardMaterial color="#7a4b2e" roughness={0.85} />
        </mesh>
      ))}
      {/* legs */}
      {[-0.75, 0.75].map((x) =>
        [-0.3, 0.3].map((z, i) => (
          <mesh key={`${x}${i}`} position={[x, 0.36, z]}>
            <boxGeometry args={[0.07, 0.72, 0.07]} />
            <meshStandardMaterial color="#5b6470" metalness={0.5} roughness={0.5} />
          </mesh>
        )),
      )}
      {/* a lunchbox on the table */}
      <mesh castShadow position={[0.35, 0.82, 0.05]} rotation-y={0.4}>
        <boxGeometry args={[0.3, 0.14, 0.2]} />
        <meshStandardMaterial color="#f7b32b" roughness={0.5} />
      </mesh>
    </group>
  );
}

/** Fence-line bushes — plain green blobs. */
export function Bushes({ positions }: { positions: [number, number, number][] }) {
  return (
    <group>
      {positions.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh castShadow position={[0, 0.35, 0]}>
            <sphereGeometry args={[0.62, 10, 8]} />
            <meshStandardMaterial color="#3f6d31" roughness={0.95} />
          </mesh>
          <mesh castShadow position={[0.42, 0.26, 0.18]}>
            <sphereGeometry args={[0.42, 8, 7]} />
            <meshStandardMaterial color="#4d8139" roughness={0.95} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** A low flower bed along the school building's base. */
export function FlowerBed({ pos }: { pos: [number, number, number] }) {
  const petals = Array.from({ length: 9 }, (_, i) => {
    const a = (i / 9) * Math.PI * 2;
    return { x: Math.cos(a) * 1.5, z: Math.sin(a) * 0.3, c: ["#ff8a70", "#ffd23e", "#b58cff", "#38d6d0"][i % 4] };
  });
  return (
    <group position={pos}>
      {/* soil */}
      <mesh position={[0, 0.08, 0]} receiveShadow>
        <boxGeometry args={[3.4, 0.16, 0.7]} />
        <meshStandardMaterial color="#5a3a22" roughness={1} />
      </mesh>
      {petals.map((f, i) => (
        <group key={i} position={[f.x, 0, f.z]}>
          <mesh position={[0, 0.28, 0]}>
            <cylinderGeometry args={[0.015, 0.02, 0.5, 6]} />
            <meshStandardMaterial color="#3f6d31" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.55, 0]}>
            <sphereGeometry args={[0.07, 8, 6]} />
            <meshStandardMaterial color={f.c} roughness={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Chalk doodles near the courts — pure schoolyard hand-writing. */
export function ChalkDoodles() {
  const scribble = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (scribble.current) {
      // the hopscotch ladder chalk stays put; the arrow gently fades
      (scribble.current.material as THREE.MeshBasicMaterial).opacity =
        0.2 + Math.sin(clock.elapsedTime * 0.8) * 0.05;
    }
  });

  return (
    <group>
      {/* "NO RUNNING" stencil by the four-square court */}
      <Text position={[-7, 0.02, 8.9]} rotation-x={-Math.PI / 2} fontSize={0.34} color="#ffffff" anchorX="center" anchorY="middle" fillOpacity={0.22}>
        NO RUNNING · HALL MONITOR
      </Text>
      {/* hopscotch chalk ladder beside the hopscotch board */}
      <group position={[7.6, 0.015, -4.4]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} rotation-x={-Math.PI / 2} position={[0, 0, -i * 0.55]}>
            <planeGeometry args={[0.5, 0.34]} />
            <meshBasicMaterial color="#e8c96a" transparent opacity={0.4} depthWrite={false} />
          </mesh>
        ))}
      </group>
      {/* recess-forever heart near the spawn */}
      <Text position={[-2.2, 0.02, 11.4]} rotation-x={-Math.PI / 2} fontSize={0.3} color="#ff9ab0" anchorX="center" anchorY="middle" fillOpacity={0.3}>
        ♥ recess forever
      </Text>
      {/* the arrow is decorative (drives the ref fade above) */}
      <mesh ref={scribble} rotation-x={-Math.PI / 2} position={[0.4, 0.02, 10.4]}>
        <planeGeometry args={[0.7, 0.28]} />
        <meshBasicMaterial color="#8fd8cf" transparent opacity={0.22} depthWrite={false} />
      </mesh>
    </group>
  );
}

/** Lamp posts along the fence — their glow follows the school day. */
export function LampPosts({ positions }: { positions: [number, number, number][] }) {
  const mats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  useFrame((_, dt) => {
    const p = currentPalette();
    mats.current.forEach((m) => {
      if (!m) return;
      const target = 0.35 + p.lamp * 2.2;
      m.emissiveIntensity += (target - m.emissiveIntensity) * Math.min(1, dt * 3);
    });
  });

  return (
    <group>
      {positions.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh castShadow position={[0, 2.0, 0]}>
            <cylinderGeometry args={[0.05, 0.07, 4.0, 8]} />
            <meshStandardMaterial color="#5b6470" metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[0, 4.05, 0]}>
            <sphereGeometry args={[0.22, 10, 8]} />
            <meshStandardMaterial
              ref={(m) => {
                mats.current[i] = m;
              }}
              color="#fff6d8"
              emissive="#ffd98a"
              emissiveIntensity={0.35}
              roughness={0.3}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
