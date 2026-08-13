import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSettings } from "../../game/settings";

const COUNT = 170;

/**
 * Sunlit dust motes drifting over the blacktop — a slow, dreamy layer of
 * floating specks. Honours the particles toggle, just like the autumn
 * leaves in <World/>.
 */
export function AmbientDust() {
  const particles = useSettings((s) => s.particles);
  const points = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
    return g;
  }, []);

  const data = useMemo(
    () =>
      Array.from({ length: COUNT }, () => ({
        x: (Math.random() - 0.5) * 30,
        y: 0.4 + Math.random() * 3.6,
        z: (Math.random() - 0.5) * 26,
        ph: Math.random() * Math.PI * 2,
        sp: 0.05 + Math.random() * 0.09,
      })),
    [],
  );

  useFrame(({ clock }, dt) => {
    const p = points.current;
    if (!p || !particles) return;
    const t = clock.elapsedTime;
    const pos = p.geometry.attributes.position as THREE.BufferAttribute;
    data.forEach((d, i) => {
      d.y += d.sp * dt;
      if (d.y > 4.1) d.y = 0.4;
      pos.setXYZ(
        i,
        d.x + Math.sin(t * 0.4 + d.ph) * 0.5,
        d.y,
        d.z + Math.cos(t * 0.5 + d.ph) * 0.4,
      );
    });
    pos.needsUpdate = true;
  });

  if (!particles) return null;

  return (
    <points ref={points} geometry={geo}>
      <pointsMaterial size={0.05} color="#ffe9a8" transparent opacity={0.5} depthWrite={false} sizeAttenuation />
    </points>
  );
}
