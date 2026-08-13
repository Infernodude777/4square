import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { currentPalette } from "../../game/atmosphere";
import { useSettings } from "../../game/settings";
import { mulberry32 } from "../../utils/rand";

const BIRDS = 16;

interface Bird {
  r: number;
  theta: number;
  speed: number;
  y: number;
  phase: number;
  flap: number;
  scale: number;
}

/**
 * A loose flock of birds circling high over the schoolyard — dark
 * silhouettes that bank into their turns and flap as they go. They fade
 * out once the sky goes properly dark and honour the particles toggle.
 */
export function Birds() {
  const particles = useSettings((s) => s.particles);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const birds = useMemo<Bird[]>(() => {
    const rng = mulberry32(9001);
    return Array.from({ length: BIRDS }, () => ({
      r: 55 + rng() * 45,
      theta: rng() * Math.PI * 2,
      speed: 0.05 + rng() * 0.09,
      y: 34 + rng() * 22,
      phase: rng() * Math.PI * 2,
      flap: 2 + rng() * 1.6,
      scale: 0.9 + rng() * 0.8,
    }));
  }, []);

  useFrame(({ clock }) => {
    const m = mesh.current;
    if (!m) return;
    const t = clock.elapsedTime;
    const pal = currentPalette();
    (m.material as THREE.MeshBasicMaterial).opacity = Math.max(0.15, 1 - pal.night * 0.95);
    for (let i = 0; i < birds.length; i++) {
      const b = birds[i];
      const a = b.theta + t * b.speed;
      dummy.position.set(Math.cos(a) * b.r, b.y + Math.sin(t * 0.4 + b.phase) * 2.4, Math.sin(a) * b.r);
      // Face the direction of travel and bank into the circle.
      dummy.rotation.set(0, Math.PI / 2 - a, Math.sin(t * 0.7 + b.phase) * 0.25);
      const flap = Math.abs(Math.sin(t * b.flap + b.phase));
      dummy.scale.set(b.scale * 1.6, b.scale * (0.22 + flap * 0.78), b.scale);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  if (!particles) return null;

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, BIRDS]}>
      <planeGeometry args={[1.1, 0.34]} />
      <meshBasicMaterial color="#20242c" transparent opacity={0.9} side={THREE.DoubleSide} depthWrite={false} />
    </instancedMesh>
  );
}
