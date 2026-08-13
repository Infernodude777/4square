import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { dayFraction, currentPalette } from "../../game/atmosphere";
import { makeBurstTexture } from "../../game/textures";

/**
 * The sun — a warm disc with a soft halo that travels the sky with the
 * school-day clock. It climbs from the east at morning recess, peaks
 * around noon, sinks into golden hour, and slips below the horizon at
 * dusk; the whole rig fades out once the night palette takes over.
 */
export function SunRig() {
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Sprite>(null);
  const haloTex = useMemo(() => makeBurstTexture(), []);
  const sunColor = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    const f = dayFraction();
    const p = currentPalette();
    if (!group.current || !core.current || !glow.current || !halo.current) return;

    // Azimuth sweeps east → south → west; elevation peaks near noon and
    // drops below the horizon shortly after golden hour.
    const az = f * Math.PI * 1.15;
    const el = Math.sin(Math.min(1, f / 0.85) * Math.PI) * 1.15;
    const R = 130;
    group.current.position.set(
      Math.cos(az) * Math.cos(el) * R,
      Math.sin(el) * R,
      -Math.sin(az) * Math.cos(el) * R,
    );

    // Fade out as the sun sets and the night palette takes over.
    const fade = Math.max(0, Math.min(1, Math.sin(el) * 2.2)) * (1 - p.night * 0.8);
    sunColor.set(p.sun);
    (core.current.material as THREE.MeshBasicMaterial).color.copy(sunColor);
    (core.current.material as THREE.MeshBasicMaterial).opacity = fade;
    (glow.current.material as THREE.MeshBasicMaterial).color.copy(sunColor);
    (glow.current.material as THREE.MeshBasicMaterial).opacity = fade * 0.35;
    (halo.current.material as THREE.SpriteMaterial).color.copy(sunColor).multiplyScalar(0.7);
    (halo.current.material as THREE.SpriteMaterial).opacity = fade * 0.85;
  });

  return (
    <group ref={group}>
      {/* soft halo — a radial sprite so the disc melts into the sky */}
      <sprite ref={halo} scale={[46, 46, 1]}>
        <spriteMaterial map={haloTex} color="#fff2cc" transparent opacity={0} depthWrite={false} fog={false} />
      </sprite>
      {/* wide warm glow */}
      <mesh ref={glow}>
        <sphereGeometry args={[11, 24, 18]} />
        <meshBasicMaterial color="#ffe9b8" transparent opacity={0} fog={false} depthWrite={false} />
      </mesh>
      {/* bright core */}
      <mesh ref={core}>
        <sphereGeometry args={[4.4, 28, 22]} />
        <meshBasicMaterial color="#fff6dd" transparent opacity={0} fog={false} />
      </mesh>
    </group>
  );
}
