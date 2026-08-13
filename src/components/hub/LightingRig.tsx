import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { currentPalette, dayFraction } from "../../game/atmosphere";

// Scratch colour — never allocate per frame.
const SCRATCH = new THREE.Color();

/**
 * The hub's light rig (Season 5). The old hub lights were static; this rig
 * drives the same sun/fill/ambient/hemisphere levels from the shared
 * school-day palette, so golden hour actually warms the yard and the lamps
 * take over after dark. The sun light follows the same arc as <SunRig/>'s
 * disc, so the shadows stay under the sun where the eye expects them.
 */
export function LightingRig() {
  const sun = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const amb = useRef<THREE.AmbientLight>(null);

  useFrame(() => {
    const pal = currentPalette();
    const f = dayFraction();

    // Same azimuth/elevation sweep as the SunRig disc (R=130 there; the
    // light sits closer so its shadow camera hugs the yard).
    const az = f * Math.PI * 1.15;
    const el = Math.sin(Math.min(1, f / 0.85) * Math.PI) * 1.15;
    const R = 46;
    if (sun.current) {
      sun.current.position.set(
        Math.cos(az) * Math.cos(el) * R,
        Math.max(6, Math.sin(el) * R),
        -Math.sin(az) * Math.cos(el) * R,
      );
      sun.current.color.copy(SCRATCH.set(pal.sun));
      sun.current.intensity = 1.65 * pal.ambience;
    }
    if (fill.current) {
      fill.current.position.set(-Math.cos(az) * 30, 12, 20);
      fill.current.intensity = 0.32 * pal.ambience;
    }
    if (hemi.current) hemi.current.intensity = 0.72 * pal.ambience;
    if (amb.current) amb.current.intensity = 0.34 * pal.ambience;
  });

  return (
    <>
      <ambientLight ref={amb} intensity={0.34} />
      <hemisphereLight ref={hemi} args={["#dceeff", "#7d8c68", 0.72]} />
      <directionalLight
        ref={sun}
        position={[16, 26, -10]}
        intensity={1.65}
        color="#fff4e2"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-camera-near={1}
        shadow-camera-far={120}
        shadow-bias={-0.0004}
      />
      <directionalLight ref={fill} position={[-14, 12, 16]} intensity={0.32} color="#bcd6ff" />
    </>
  );
}
