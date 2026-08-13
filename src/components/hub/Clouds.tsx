import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { currentPalette } from "../../game/atmosphere";
import { mulberry32 } from "../../utils/rand";

const CLOUDS = 16;
const PUFFS = 7;

interface Puff {
  dx: number;
  dy: number;
  dz: number;
  scale: number;
}

interface Cloud {
  x: number;
  y: number;
  z: number;
  speed: number;
  phase: number;
  puffs: Puff[];
}

/**
 * A field of cumulus clouds drifting high over the yard. Each cloud is a
 * loose cluster of puffs rendered through one InstancedMesh; the whole
 * field rides the breeze and wraps around, and the puffs cool and dim as
 * the night palette takes over.
 */
export function Clouds() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const clouds = useMemo<Cloud[]>(() => {
    const rng = mulberry32(20260901);
    return Array.from({ length: CLOUDS }, () => ({
      x: (rng() - 0.5) * 340,
      y: 30 + rng() * 26,
      z: -130 + rng() * 150,
      speed: 0.35 + rng() * 0.5,
      phase: rng() * Math.PI * 2,
      puffs: Array.from({ length: PUFFS }, () => ({
        dx: (rng() - 0.5) * 7,
        dy: rng() * 1.4 - 0.2,
        dz: (rng() - 0.5) * 3.2,
        scale: 1.6 + rng() * 2.6,
      })),
    }));
  }, []);

  useFrame(({ clock }) => {
    const m = mesh.current;
    if (!m) return;
    const t = clock.elapsedTime;
    const p = currentPalette();
    const mat = m.material as THREE.MeshStandardMaterial;
    // Soft white by day; cools and dims toward night.
    mat.color.set("#ffffff").lerp(new THREE.Color("#7d8db8"), p.night * 0.85);
    mat.opacity = Math.max(0.12, 1 - p.night * 0.85);

    let i = 0;
    for (const c of clouds) {
      // Drift east, bobbing gently; wrap around the yard.
      const x = ((c.x + t * c.speed + 190) % 380) - 190;
      const y = c.y + Math.sin(t * 0.25 + c.phase) * 1.8;
      for (const puff of c.puffs) {
        dummy.position.set(x + puff.dx, y + puff.dy, c.z + puff.dz);
        dummy.scale.setScalar(puff.scale);
        dummy.rotation.set(0, t * 0.01 + c.phase, 0);
        dummy.updateMatrix();
        m.setMatrixAt(i, dummy.matrix);
        i++;
      }
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, CLOUDS * PUFFS]}>
      <sphereGeometry args={[1, 12, 10]} />
      <meshStandardMaterial color="#ffffff" roughness={1} transparent opacity={0.92} />
    </instancedMesh>
  );
}
