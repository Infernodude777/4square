import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { HEIGHT_MARK, POLE_H, POLE_R, ROPE_MAX, ROPE_MIN, TS } from "./tetherState";

/**
 * The pole is a metal cylinder with:
 *  - alternating stripe paint (red/white)
 *  - a bright yellow height mark at 5 ft (=1.52 m)
 *  - an eye-bolt at the top
 *  - a base plate/collar
 */
export function Pole() {
  const wrapMarker = useRef<THREE.Mesh>(null);
  useFrame(() => {
    // pulse the height marker when we're close to winning
    if (wrapMarker.current) {
      const t = TS.current;
      const closeness = 1 - (t.ropeFree - ROPE_MIN) / (ROPE_MAX - ROPE_MIN);
      const mat = wrapMarker.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.4 + closeness * 1.8;
    }
  });

  const stripes = useMemo(() => {
    // Segment pole into 10 horizontal stripes red/white
    const arr: { y: number; h: number; c: string }[] = [];
    const N = 12;
    const h = POLE_H / N;
    for (let i = 0; i < N; i++) {
      arr.push({ y: h * i + h / 2, h, c: i % 2 === 0 ? "#e2483d" : "#f4f1e8" });
    }
    return arr;
  }, []);

  return (
    <group>
      {/* base plate */}
      <mesh castShadow receiveShadow position={[0, 0.045, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 0.09, 20]} />
        <meshStandardMaterial color="#3a3f47" metalness={0.7} roughness={0.35} />
      </mesh>
      {/* concrete pad */}
      <mesh receiveShadow position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.4, 0.42, 0.02, 24]} />
        <meshStandardMaterial color="#a9a49a" roughness={0.9} />
      </mesh>

      {/* striped pole */}
      {stripes.map((s, i) => (
        <mesh key={i} castShadow position={[0, s.y + 0.02, 0]}>
          <cylinderGeometry args={[POLE_R, POLE_R, s.h, 14]} />
          <meshStandardMaterial color={s.c} metalness={0.35} roughness={0.5} />
        </mesh>
      ))}

      {/* 5-foot height marker (yellow glowing band) */}
      <mesh ref={wrapMarker} position={[0, HEIGHT_MARK, 0]}>
        <cylinderGeometry args={[POLE_R * 1.15, POLE_R * 1.15, 0.05, 16]} />
        <meshStandardMaterial
          color="#ffd23e"
          emissive="#ffb800"
          emissiveIntensity={0.6}
          metalness={0.4}
          roughness={0.3}
        />
      </mesh>

      {/* top cap + eye bolt */}
      <mesh castShadow position={[0, POLE_H + 0.03, 0]}>
        <sphereGeometry args={[POLE_R * 1.3, 12, 10]} />
        <meshStandardMaterial color="#c8ccd2" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh castShadow position={[0, POLE_H + 0.15, 0]}>
        <torusGeometry args={[0.05, 0.014, 8, 14]} />
        <meshStandardMaterial color="#8f959e" metalness={0.75} roughness={0.3} />
      </mesh>
    </group>
  );
}
