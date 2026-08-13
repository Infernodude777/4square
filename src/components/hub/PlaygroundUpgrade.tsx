import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Season 5 playground kit: a rocking seesaw, a tire swing, and two spring
 * riders tucked into the open south-west corner (and one by the slide).
 * Everything is decorative — no colliders, no gameplay — just the yard
 * getting the equipment a real school would have.
 */
export function PlaygroundUpgrade() {
  return (
    <group>
      <Seesaw pos={[-14.4, 0, 11.3]} />
      <TireSwing pos={[-14.4, 0, 4.6]} />
      <SpringRider pos={[-14.8, 0, 8.9]} color="#e2483d" yaw={0.4} />
      <SpringRider pos={[11.4, 0, 11.9]} color="#3f6fb5" yaw={-0.9} />
    </group>
  );
}

/** A tan rubber/sand mat under each piece of equipment. */
function SandMat({ pos, r = 1.6 }: { pos: [number, number, number]; r?: number }) {
  return (
    <mesh rotation-x={-Math.PI / 2} position={pos}>
      <circleGeometry args={[r, 28]} />
      <meshStandardMaterial color="#c9b28a" roughness={1} />
    </mesh>
  );
}

/** A rocking seesaw — the plank pivots on a wooden fulcrum. */
function Seesaw({ pos }: { pos: [number, number, number] }) {
  const plank = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (plank.current) plank.current.rotation.x = Math.sin(clock.elapsedTime * 0.8) * 0.16;
  });
  return (
    <group position={pos} rotation-y={-0.6}>
      <SandMat pos={[0, 0.012, 0]} r={1.5} />
      {/* fulcrum */}
      <mesh castShadow position={[0, 0.5, 0]} rotation-z={0.5}>
        <cylinderGeometry args={[0.05, 0.05, 1.0, 8]} />
        <meshStandardMaterial color="#7a4b2e" roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0, 0.5, 0]} rotation-z={-0.5}>
        <cylinderGeometry args={[0.05, 0.05, 1.0, 8]} />
        <meshStandardMaterial color="#7a4b2e" roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0, 0.99, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.14, 10]} />
        <meshStandardMaterial color="#5b6470" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* rocking plank + handles */}
      <group ref={plank} position={[0, 1.06, 0]}>
        <mesh castShadow position={[0, 0.07, 0]}>
          <boxGeometry args={[2.9, 0.09, 0.36]} />
          <meshStandardMaterial color="#8a5a33" roughness={0.85} />
        </mesh>
        <mesh castShadow position={[0, 0.05, 0]}>
          <boxGeometry args={[2.9, 0.03, 0.42]} />
          <meshStandardMaterial color="#3f6fb5" roughness={0.6} />
        </mesh>
        {[-1.2, 1.2].map((x, i) => (
          <group key={i} position={[x, 0.18, 0]}>
            <mesh>
              <boxGeometry args={[0.05, 0.28, 0.05]} />
              <meshStandardMaterial color="#5b6470" metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.13, 0.1]}>
              <torusGeometry args={[0.08, 0.025, 8, 14]} />
              <meshStandardMaterial color="#3f6fb5" roughness={0.5} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/** A tire swing hanging from a two-post frame. */
function TireSwing({ pos }: { pos: [number, number, number] }) {
  const tire = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (tire.current) tire.current.rotation.z = Math.sin(clock.elapsedTime * 0.7) * 0.35;
  });
  return (
    <group position={pos} rotation-y={0.35}>
      <SandMat pos={[0, 0.012, 0]} r={1.7} />
      {[-1.1, 1.1].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          {[-0.4, 0.4].map((z, j) => (
            <mesh key={j} castShadow position={[0, 1.0, z]} rotation-x={z < 0 ? 0.5 : -0.5}>
              <cylinderGeometry args={[0.06, 0.06, 2.0, 8]} />
              <meshStandardMaterial color="#7a4b2e" roughness={0.8} />
            </mesh>
          ))}
          <mesh castShadow position={[0, 2.02, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.5, 10]} />
            <meshStandardMaterial color="#5b6470" metalness={0.6} roughness={0.4} />
          </mesh>
        </group>
      ))}
      <mesh castShadow position={[0, 2.18, 0]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.07, 0.07, 2.5, 10]} />
        <meshStandardMaterial color="#5b6470" metalness={0.6} roughness={0.4} />
      </mesh>
      <group ref={tire} position={[0, 2.18, 0]}>
        {[-0.26, 0.26].map((x, i) => (
          <mesh key={i} position={[x, -0.5, 0]}>
            <boxGeometry args={[0.02, 1.0, 0.02]} />
            <meshStandardMaterial color="#8b8f96" metalness={0.65} roughness={0.38} />
          </mesh>
        ))}
        <mesh castShadow position={[0, -1.02, 0]} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.4, 0.16, 12, 24]} />
          <meshStandardMaterial color="#23272e" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

/** A spring rider — a rocking critter on a coil. */
function SpringRider({ pos, color, yaw }: { pos: [number, number, number]; color: string; yaw: number }) {
  const body = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (body.current) body.current.rotation.x = Math.sin(clock.elapsedTime * 1.6) * 0.1;
  });
  return (
    <group position={pos} rotation-y={yaw}>
      <SandMat pos={[0, 0.012, 0]} r={0.9} />
      {/* base plate */}
      <mesh castShadow position={[0, 0.09, 0]}>
        <cylinderGeometry args={[0.5, 0.55, 0.12, 16]} />
        <meshStandardMaterial color="#5b6470" metalness={0.5} roughness={0.5} />
      </mesh>
      {/* coil */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, 0.5 + i * 0.13, 0]} scale={[1 - i * 0.08, 1, 1]}>
          <torusGeometry args={[0.18, 0.045, 8, 18]} />
          <meshStandardMaterial color="#8d959e" metalness={0.7} roughness={0.35} />
        </mesh>
      ))}
      {/* rocking critter */}
      <group ref={body} position={[0, 1.22, 0]}>
        <mesh castShadow position={[0, 0.16, 0.02]}>
          <boxGeometry args={[0.34, 0.3, 0.62]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
        <mesh castShadow position={[0, 0.42, -0.28]}>
          <sphereGeometry args={[0.17, 12, 10]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
        {[-0.11, 0.11].map((x, i) => (
          <mesh key={i} position={[x, 0.55, -0.34]}>
            <coneGeometry args={[0.05, 0.12, 6]} />
            <meshStandardMaterial color={color} roughness={0.6} />
          </mesh>
        ))}
        <mesh position={[0, 0.4, -0.44]}>
          <sphereGeometry args={[0.035, 8, 6]} />
          <meshStandardMaterial color="#20242c" roughness={0.4} />
        </mesh>
        {/* saddle + handle */}
        <mesh castShadow position={[0, 0.3, 0.16]}>
          <boxGeometry args={[0.26, 0.09, 0.34]} />
          <meshStandardMaterial color="#20242c" roughness={0.7} />
        </mesh>
        <mesh position={[0.19, 0.15, -0.04]}>
          <boxGeometry args={[0.04, 0.24, 0.05]} />
          <meshStandardMaterial color="#5b6470" metalness={0.5} roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}
