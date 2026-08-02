import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sky, Clouds, Cloud } from "@react-three/drei";
import * as THREE from "three";

/**
 * A shared day-cycle lighting rig. The sun slowly drifts across the sky
 * over a ~6 minute loop (morning → noon → golden afternoon), tinting the
 * light warm at the ends of the loop and white at noon. Every scene uses
 * the same rig so the yard always feels like one continuous afternoon.
 */
export function Atmosphere() {
  const sun = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.DirectionalLight>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const cycle = (t % 360) / 360; // 6-minute day
    const angle = cycle * Math.PI * 2 - Math.PI / 2; // rise → set
    const sunX = Math.cos(angle) * 60;
    const sunY = Math.sin(angle) * 34 + 12;
    if (sun.current) sun.current.position.set(sunX, Math.max(6, sunY), -28);
    if (fill.current) fill.current.position.set(-sunX * 0.5, 12, 20);

    // Warm up near the horizon, cool down at high noon
    const warmth = Math.max(0, Math.cos(angle));
    const tint = new THREE.Color(1, 0.92 + warmth * 0.08, 0.82 + warmth * 0.16);
    if (sun.current) sun.current.color.copy(tint);
  });

  return (
    <>
      <Sky distance={4000} sunPosition={[60, 40, -60]} turbidity={5} rayleigh={1.6} mieCoefficient={0.004} mieDirectionalG={0.85} />
      <fog attach="fog" args={["#cfe3ee", 50, 170]} />
      <hemisphereLight args={["#d8ecff", "#7a8a66", 0.6]} />
      <ambientLight intensity={0.22} />
      <directionalLight
        ref={sun}
        position={[16, 24, -12]}
        intensity={1.7}
        color="#fff2dd"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-bias={-0.0004}
      />
      <directionalLight ref={fill} position={[-12, 10, 14]} intensity={0.35} color="#bcd6ff" />
      <Clouds material={THREE.MeshBasicMaterial}>
        <Cloud position={[-30, 27, -55]} speed={0.12} opacity={0.75} segments={24} bounds={[11, 3, 3]} color="#ffffff" />
        <Cloud position={[25, 31, -70]} speed={0.08} opacity={0.65} segments={20} bounds={[14, 3.4, 3]} color="#fdfdff" />
        <Cloud position={[55, 26, 10]} speed={0.1} opacity={0.55} segments={18} bounds={[9, 2.6, 3]} color="#ffffff" />
      </Clouds>
    </>
  );
}
