import { useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Clouds, Cloud, Stars } from "@react-three/drei";
import * as THREE from "three";
import { advanceDay, currentPalette, dayFraction } from "../game/atmosphere";

// Scratch colours — the per-frame background/fog/sun tints never allocate.
const bgColor = new THREE.Color();
const fogColor = new THREE.Color();
const sunTint = new THREE.Color();

/**
 * A shared day-cycle lighting rig (Season 2). One module-level clock in
 * `game/atmosphere.ts` drives the whole yard: morning → noon → golden
 * hour → dusk → night over a ~24-minute loop. The sky colour, fog, sun
 * tint and ambient level all follow the same keyframes, and a star field
 * fades in after dusk. Every scene mounts the same rig, so the hub and
 * every court always agree on what time recess is.
 */
export function Atmosphere() {
  const sun = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const fogRef = useRef<THREE.Fog>(null);
  const { scene } = useThree();
  const [starsVisible, setStarsVisible] = useState(false);

  useFrame((_, dt) => {
    advanceDay(dt);
    const pal = currentPalette();

    // The whole scene follows the school-day sky (background + fog).
    scene.background = bgColor.set(pal.sky);
    if (fogRef.current) fogRef.current.color.copy(fogColor.set(pal.fog));
    if (hemi.current) hemi.current.intensity = 0.6 * pal.ambience;

    // The sun arcs across the sky; its warmth comes from the palette
    // keyframes (white at noon, ember at golden hour, cold at night).
    const angle = dayFraction() * Math.PI * 2;
    const sunX = Math.cos(angle) * 58;
    const sunY = Math.sin(angle) * 26 + 12;
    if (sun.current) {
      sun.current.position.set(sunX, Math.max(5, sunY), -26);
      sun.current.color.copy(sunTint.set(pal.sun));
      sun.current.intensity = 1.7 * pal.ambience;
    }
    if (fill.current) {
      fill.current.position.set(-sunX * 0.5, 12, 22);
      fill.current.intensity = 0.35 * pal.ambience;
    }

    // Stars only after the sky has actually gone dark — no strobe at dusk.
    const showStars = pal.stars > 0.08;
    if (showStars !== starsVisible) setStarsVisible(showStars);
  });

  return (
    <>
      <fog ref={fogRef} attach="fog" args={["#cfe3ee", 50, 170]} />
      <hemisphereLight ref={hemi} args={["#d8ecff", "#7a8a66", 0.6]} />
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
      {starsVisible && (
        <Stars radius={95} depth={45} count={1200} factor={4} saturation={0} fade speed={0.6} />
      )}
      <Clouds material={THREE.MeshBasicMaterial}>
        <Cloud position={[-30, 27, -55]} speed={0.12} opacity={0.75} segments={24} bounds={[11, 3, 3]} color="#ffffff" />
        <Cloud position={[25, 31, -70]} speed={0.08} opacity={0.65} segments={20} bounds={[14, 3.4, 3]} color="#fdfdff" />
        <Cloud position={[55, 26, 10]} speed={0.1} opacity={0.55} segments={18} bounds={[9, 2.6, 3]} color="#ffffff" />
      </Clouds>
    </>
  );
}
