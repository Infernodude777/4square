import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { currentPalette } from "../../game/atmosphere";
import { useSettings } from "../../game/settings";
import { mulberry32, ringPoint } from "../../utils/rand";

const COUNT = 70;

/**
 * Fireflies drifting over the meadow after dark. They only appear once the
 * lamp posts start glowing, then pulse gently and wander — pure summer-
 * night atmosphere, and it honours the particles toggle like every other
 * particle system in the yard.
 */
export function Fireflies() {
  const particles = useSettings((s) => s.particles);
  const points = useRef<THREE.Points>(null);

  const data = useMemo(() => {
    const rng = mulberry32(1201);
    return Array.from({ length: COUNT }, () => {
      const [x, z] = ringPoint(rng, 50, 95);
      return {
        x,
        z,
        y: 0.5 + rng() * 2.6,
        ph: rng() * Math.PI * 2,
        sp: 0.3 + rng() * 0.6,
      };
    });
  }, []);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
    return g;
  }, []);

  useFrame(({ clock }) => {
    const p = points.current;
    if (!p) return;
    const t = clock.elapsedTime;
    const pal = currentPalette();
    const mat = p.material as THREE.PointsMaterial;
    // Fade in with the lamps, then shimmer gently.
    mat.opacity = pal.lamp * (0.55 + 0.35 * Math.sin(t * 1.7));
    const pos = p.geometry.attributes.position as THREE.BufferAttribute;
    data.forEach((d, i) => {
      pos.setXYZ(
        i,
        d.x + Math.sin(t * d.sp + d.ph) * 2.2,
        d.y + Math.sin(t * 0.8 + d.ph) * 0.6,
        d.z + Math.cos(t * d.sp + d.ph) * 2.2,
      );
    });
    pos.needsUpdate = true;
  });

  if (!particles) return null;

  return (
    <points ref={points} geometry={geo}>
      <pointsMaterial
        size={0.16}
        color="#ffe98a"
        transparent
        opacity={0}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        fog={false}
      />
    </points>
  );
}
