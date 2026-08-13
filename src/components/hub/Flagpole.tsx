import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { currentPalette } from "../../game/atmosphere";

/**
 * The school flagpole in the north-west corner of the yard, with a flag
 * that lifts and ruffles with the wind through the day and goes slack at
 * night. A small gold ball tops the pole. Visual only — clear of the gaga
 * pit and the bushes.
 */
export function Flagpole() {
  const flag = useRef<THREE.Mesh>(null);
  const poleTip = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const pal = currentPalette();
    const breeze = 1 - pal.night * 0.75;
    // Flag waves side to side and flutters up/down as the wind picks up.
    const wave = Math.sin(t * 2.4) * 0.22 * breeze;
    if (flag.current) {
      flag.current.rotation.y = wave;
      flag.current.rotation.z = Math.sin(t * 3.1) * 0.05 * breeze;
      flag.current.position.x = 0.75 + wave * 0.9;
    }
    // Gold ball glints in the sun, dims at night.
    if (poleTip.current) {
      const m = poleTip.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 0.25 + pal.ambience * 0.5;
    }
  });

  return (
    <group position={[-13.6, 0, -11.6]}>
      {/* pole */}
      <mesh castShadow position={[0, 3.5, 0]}>
        <cylinderGeometry args={[0.045, 0.07, 7.0, 8]} />
        <meshStandardMaterial color="#c8ccd2" metalness={0.75} roughness={0.3} />
      </mesh>
      {/* gold ball */}
      <mesh ref={poleTip} position={[0, 7.1, 0]}>
        <sphereGeometry args={[0.09, 10, 8]} />
        <meshStandardMaterial color="#f2b53c" metalness={0.85} roughness={0.25} emissive="#f2b53c" emissiveIntensity={0.4} />
      </mesh>
      {/* flag */}
      <mesh ref={flag} castShadow position={[0.75, 6.5, 0]}>
        <planeGeometry args={[1.5, 0.95]} />
        <meshStandardMaterial color="#c23227" roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      {/* white field on the flag */}
      <mesh ref={flag} position={[0.3, 6.5, 0.01]}>
        <planeGeometry args={[0.55, 0.95]} />
        <meshStandardMaterial color="#f4f1e8" roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      {/* base */}
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.22, 0.28, 0.16, 10]} />
        <meshStandardMaterial color="#7d858e" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}
