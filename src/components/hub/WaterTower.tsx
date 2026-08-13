import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * The neighbourhood water tower rising behind the north-west fence — a
 * classic schoolyard backdrop. A steel tank on tapered legs with a ladder,
 * a pressure pipe, and a blinking aviation beacon once the lamps come on.
 * Visual only; it lives outside the fence so nothing collides with play.
 */
export function WaterTower() {
  const beacon = useRef<THREE.MeshBasicMaterial>(null);
  const blink = useRef(0);

  useFrame(({ clock }) => {
    blink.current += clock.getDelta();
    // Blink ~1 Hz once it's dark, driven by elapsed time only.
    if (beacon.current) {
      beacon.current.opacity = Math.sin(blink.current * Math.PI * 2) > 0.6 ? 1 : 0.12;
    }
  });

  return (
    <group position={[-17.6, 0, -15.2]}>
      {/* four tapered legs */}
      {[[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]].map(([x, z], i) => (
        <mesh key={i} position={[x, 3.4, z]} rotation-x={0.05 * (z > 0 ? 1 : -1)} rotation-z={0.05 * (x > 0 ? -1 : 1)} castShadow>
          <cylinderGeometry args={[0.09, 0.12, 6.8, 8]} />
          <meshStandardMaterial color="#6f767e" metalness={0.55} roughness={0.45} />
        </mesh>
      ))}

      {/* cross braces */}
      {[-1.6, 1.6].map((x, i) => (
        <mesh key={i} position={[x, 3.0, 0]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.03, 0.03, 3.2, 6]} />
          <meshStandardMaterial color="#8d959e" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}

      {/* tank — the big painted drum */}
      <group position={[0, 7.1, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[2.5, 2.5, 3.4, 20]} />
          <meshStandardMaterial color="#3f6fb5" roughness={0.5} metalness={0.25} />
        </mesh>
        <mesh position={[0, 1.85, 0]}>
          <cylinderGeometry args={[2.62, 2.62, 0.35, 20]} />
          <meshStandardMaterial color="#2f5490" roughness={0.5} metalness={0.3} />
        </mesh>
        {/* dome cap */}
        <mesh position={[0, 1.95, 0]} castShadow>
          <sphereGeometry args={[2.5, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2.4]} />
          <meshStandardMaterial color="#4f83c9" roughness={0.5} metalness={0.25} />
        </mesh>
        {/* painted ring stripes */}
        {[0.4, 1.3].map((y, i) => (
          <mesh key={i} position={[0, y - 1.7, 0]}>
            <cylinderGeometry args={[2.52, 2.52, 0.16, 20]} />
            <meshStandardMaterial color="#e8edf4" roughness={0.5} />
          </mesh>
        ))}
        {/* ladder up the side */}
        <group position={[2.35, -1.7, 0]} rotation-y={-0.15}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <mesh key={i} position={[0, i * 0.55, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.4, 5]} />
              <meshStandardMaterial color="#a8b0b8" metalness={0.6} roughness={0.4} />
            </mesh>
          ))}
        </group>
        {/* pressure pipe down one leg */}
        <mesh position={[1.2, -1.0, 1.6]} rotation-z={-0.1}>
          <cylinderGeometry args={[0.05, 0.05, 2.6, 8]} />
          <meshStandardMaterial color="#c8ccd2" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* aviation beacon on the dome */}
        <mesh position={[0, 3.9, 0]}>
          <sphereGeometry args={[0.09, 10, 8]} />
          <meshBasicMaterial ref={beacon} color="#ff4444" transparent opacity={0.2} />
        </mesh>
      </group>

      {/* ground shadow pad */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]}>
        <circleGeometry args={[3.1, 24]} />
        <meshStandardMaterial color="#3f4a33" roughness={1} transparent opacity={0.35} />
      </mesh>
    </group>
  );
}
