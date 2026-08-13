import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { advanceDay, currentPalette } from "../game/atmosphere";
import { makeBurstTexture, makeSkyGradientTexture } from "../game/textures";

// Scratch colours — the per-frame sky/horizon tints never allocate.
const HORIZON = new THREE.Color();
const SUN = new THREE.Color();

/**
 * The hub's sky (Season 5 upgrade). The school day still rolls by here —
 * this rig alone advances the shared atmosphere clock in the hub — but the
 * flat backdrop is now a full gradient dome that melts from the palette's
 * sky colour up high into the horizon haze, with a double star field that
 * fades in at dusk, and a moon with a soft halo.
 */
export function Sky() {
  const bg = useRef<THREE.Color>(null);
  const fog = useRef<THREE.Fog>(null);
  const domeMat = useRef<THREE.MeshBasicMaterial>(null);
  const stars = useRef<THREE.Points>(null);
  const stars2 = useRef<THREE.Points>(null);
  const moon = useRef<THREE.MeshBasicMaterial>(null);
  const moonHalo = useRef<THREE.SpriteMaterial>(null);
  const halo = useMemo(() => makeBurstTexture(), []);
  const keyRef = useRef("");

  // Two star layers on big shells above the yard — the nearer one bright,
  // the far one slow and dim for depth. Both fade in with the night.
  const starGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const count = 700;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 240 + Math.random() * 60;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 10;
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return geo;
  }, []);

  const starGeo2 = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const count = 220;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 300 + Math.random() * 40;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 8;
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

    // The horizon haze warms toward the sun colour by day and cools to the
    // fog colour at night. Regenerate the dome's gradient only when the
    // palette actually moves (a few times a school day — cheap enough).
    const horizon = HORIZON.set(p.fog).lerp(SUN.set(p.sun), (1 - p.night) * 0.25);
    const key = `${p.sky.slice(0, 4)}|${horizon.getHexString().slice(0, 4)}`;
    if (domeMat.current && key !== keyRef.current) {
      keyRef.current = key;
      const old = domeMat.current.map;
      domeMat.current.map = makeSkyGradientTexture(p.sky, `#${horizon.getHexString()}`);
      domeMat.current.needsUpdate = true;
      if (old) old.dispose();
    }

    // Star fields + moon fade in as the sky goes dark.
    if (stars.current) (stars.current.material as THREE.PointsMaterial).opacity = p.stars;
    if (stars2.current) (stars2.current.material as THREE.PointsMaterial).opacity = p.stars * 0.8;
    if (moon.current) moon.current.opacity = p.stars;
    if (moonHalo.current) moonHalo.current.opacity = p.stars * 0.55;
  });

  return (
    <>
      <color ref={bg} attach="background" args={["#8fbfe0"]} />
      <fog ref={fog} attach="fog" args={["#cfe3ee", 46, 180]} />
      {/* gradient sky dome — the palette's sky fades into the horizon haze */}
      <mesh>
        <sphereGeometry args={[330, 24, 18]} />
        <meshBasicMaterial ref={domeMat} side={THREE.BackSide} depthWrite={false} fog={false} />
      </mesh>
      {/* near star layer */}
      <points ref={stars} geometry={starGeo}>
        <pointsMaterial size={1.5} sizeAttenuation color="#fff8e0" transparent opacity={0} depthWrite={false} fog={false} />
      </points>
      {/* far star layer — dimmer, slower, for depth */}
      <points ref={stars2} geometry={starGeo2}>
        <pointsMaterial size={0.9} sizeAttenuation color="#dce8ff" transparent opacity={0} depthWrite={false} fog={false} />
      </points>
      {/* moon + its halo */}
      <mesh position={[46, 52, -78]}>
        <sphereGeometry args={[4.2, 20, 20]} />
        <meshBasicMaterial ref={moon} color="#f4f1e8" transparent opacity={0} fog={false} />
      </mesh>
      <sprite position={[46, 52, -78]} scale={[26, 26, 1]}>
        <spriteMaterial ref={moonHalo} map={halo} color="#e8ecf6" transparent opacity={0} depthWrite={false} fog={false} />
      </sprite>
    </>
  );
}
