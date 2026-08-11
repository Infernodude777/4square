import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { advanceDay, currentPalette } from "../game/atmosphere";

/**
 * The hub's sky dressing. The school day rolls by here exactly as it
 * does in the match scenes (both read the shared atmosphere clock):
 * a flat backdrop colour, a soft fog, a moon, and a star field that
 * fades in at dusk. The lamp posts in <Props/> read the same palette
 * so they glow once the yard goes dark.
 */
export function Sky() {
  const bg = useRef<THREE.Color>(null);
  const fog = useRef<THREE.Fog>(null);
  const stars = useRef<THREE.Points>(null);
  const moon = useRef<THREE.MeshBasicMaterial>(null);

  const starGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const count = 700;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Even-ish scatter on a big sphere shell above the yard.
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 240 + Math.random() * 60;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 10; // keep above the horizon
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return geo;
  }, []);

  useFrame((_, dt) => {
    advanceDay(dt);
    const p = currentPalette();
    if (bg.current) bg.current.set(p.sky);
    if (fog.current) fog.current.color.set(p.fog);
    if (stars.current) {
      (stars.current.material as THREE.PointsMaterial).opacity = p.stars;
    }
    if (moon.current) {
      moon.current.opacity = p.stars;
    }
  });

  return (
    <>
      <color ref={bg} attach="background" args={["#8fbfe0"]} />
      <fog ref={fog} attach="fog" args={["#cfe3ee", 46, 180]} />
      <points ref={stars} geometry={starGeo}>
        <pointsMaterial size={1.5} sizeAttenuation color="#fff8e0" transparent opacity={0} depthWrite={false} />
      </points>
      {/* moon — a pale disc that shows up with the stars */}
      <mesh position={[40, 46, -70]}>
        <sphereGeometry args={[4, 20, 20]} />
        <meshBasicMaterial ref={moon} color="#f4f1e8" transparent opacity={0} />
      </mesh>
    </>
  );
}
