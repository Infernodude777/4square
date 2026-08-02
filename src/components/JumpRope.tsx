import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Two kids double-dutching beside the hopscotch. The rope is a flat
 * stretched box that spins around a horizontal axis, and the jumpers
 * hop in sync with it.
 */
export function JumpRope() {
  const rope = useRef<THREE.Group>(null);
  const kidA = useRef<THREE.Group>(null);
  const kidB = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (rope.current) rope.current.rotation.x = t * 6.5;
    const hop = Math.abs(Math.sin(t * 6.5)) * 0.22;
    if (kidA.current) kidA.current.position.y = hop;
    if (kidB.current) kidB.current.position.y = hop;
  });

  const kidColor = ["#4f8ef7", "#f7b32b"];

  return (
    <group position={[5.4, 0, 9.4]}>
      {/* jumpers */}
      {[0, 1].map((i) => (
        <group key={i} position={[i * 0.9 - 0.45, 0, 0]}>
          <group ref={i === 0 ? kidA : kidB}>
            <mesh position={[0, 0.5, 0]}>
              <capsuleGeometry args={[0.11, 0.2, 4, 10]} />
              <meshStandardMaterial color={kidColor[i]} roughness={0.7} />
            </mesh>
            <mesh position={[0, 0.95, 0]}>
              <sphereGeometry args={[0.16, 12, 12]} />
              <meshStandardMaterial color="#f0c297" roughness={0.6} />
            </mesh>
          </group>
        </group>
      ))}
      {/* spinning rope */}
      <group ref={rope} position={[0, 0.62, 0]}>
        <mesh>
          <boxGeometry args={[0.05, 0.05, 3.1]} />
          <meshStandardMaterial color="#e2483d" roughness={0.6} />
        </mesh>
      </group>
      {/* two handle-holders on the ends */}
      {[-1.55, 1.55].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.62, 0]}>
            <capsuleGeometry args={[0.1, 0.18, 4, 10]} />
            <meshStandardMaterial color="#39b46a" roughness={0.7} />
          </mesh>
          <mesh position={[0, 1.08, 0]}>
            <sphereGeometry args={[0.14, 12, 12]} />
            <meshStandardMaterial color="#b8bfc7" roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
