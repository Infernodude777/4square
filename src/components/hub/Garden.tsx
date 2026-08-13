import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mulberry32, ringPoint } from "../../utils/rand";

const TUFTS = 620;
const FLOWERS = 150;
const PEBBLES = 110;

const TUFT_GREENS = ["#4c8a3a", "#57983f", "#3f7a33", "#62a34a", "#467f39"];
const PETAL_COLORS = ["#ff8a70", "#ffd23e", "#b58cff", "#38d6d0", "#ff5ab5", "#ffffff"];
const PEBBLE_GRAYS = ["#8a8f96", "#6f767e", "#a0a6ad"];

/**
 * The meadow beyond the fence — seeded scatter of grass tufts, wildflowers
 * and pebbles plus a few bigger lawn trees, all sitting on the grass ring
 * outside the blacktop (past the asphalt apron) and clear of every court.
 */
export function Garden() {
  const tufts = useMemo(() => {
    const rng = mulberry32(40);
    return Array.from({ length: TUFTS }, () => {
      const [x, z] = ringPoint(rng, 54, 92);
      return { x, z, s: 0.7 + rng() * 1.1, rot: rng() * Math.PI * 2, c: rng() };
    });
  }, []);

  const flowers = useMemo(() => {
    const rng = mulberry32(41);
    return Array.from({ length: FLOWERS }, () => {
      const [x, z] = ringPoint(rng, 56, 86);
      return { x, z, s: 0.8 + rng() * 0.7, rot: rng() * Math.PI * 2, c: rng() };
    });
  }, []);

  const pebbles = useMemo(() => {
    const rng = mulberry32(42);
    return Array.from({ length: PEBBLES }, () => {
      const [x, z] = ringPoint(rng, 55, 84);
      return { x, z, s: 0.6 + rng() * 1.1, rot: rng() * Math.PI * 2, c: rng() };
    });
  }, []);

  const lawnTrees = useMemo(() => {
    const rng = mulberry32(43);
    return Array.from({ length: 12 }, () => {
      const [x, z] = ringPoint(rng, 56, 80);
      const pine = rng() < 0.45;
      return { x, z, s: 1.6 + rng() * 1.8, pine, yaw: rng() * Math.PI * 2 };
    });
  }, []);

  const bushes = useMemo(() => {
    const rng = mulberry32(44);
    return Array.from({ length: 8 }, () => {
      const [x, z] = ringPoint(rng, 54, 74);
      return { x, z, s: 0.8 + rng() * 0.9, yaw: rng() * Math.PI * 2 };
    });
  }, []);

  const tuftMesh = useRef<THREE.InstancedMesh>(null);
  const stemMesh = useRef<THREE.InstancedMesh>(null);
  const headMesh = useRef<THREE.InstancedMesh>(null);
  const pebbleMesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  useLayoutEffect(() => {
    const m = tuftMesh.current;
    if (m) {
      tufts.forEach((t, i) => {
        dummy.position.set(t.x, 0.06, t.z);
        dummy.rotation.set(0, t.rot, 0);
        dummy.scale.setScalar(t.s);
        dummy.updateMatrix();
        m.setMatrixAt(i, dummy.matrix);
        color.set(TUFT_GREENS[Math.floor(t.c * TUFT_GREENS.length) % TUFT_GREENS.length]);
        m.setColorAt(i, color);
      });
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }

    const s = stemMesh.current;
    const h = headMesh.current;
    if (s && h) {
      flowers.forEach((f, i) => {
        dummy.position.set(f.x, 0.17, f.z);
        dummy.rotation.set(0, f.rot, 0);
        dummy.scale.setScalar(f.s);
        dummy.updateMatrix();
        s.setMatrixAt(i, dummy.matrix);
        dummy.position.set(f.x, 0.38, f.z);
        dummy.rotation.set(0, f.rot, 0);
        dummy.scale.setScalar(f.s);
        dummy.updateMatrix();
        h.setMatrixAt(i, dummy.matrix);
        color.set(PETAL_COLORS[Math.floor(f.c * PETAL_COLORS.length) % PETAL_COLORS.length]);
        h.setColorAt(i, color);
      });
      s.instanceMatrix.needsUpdate = true;
      h.instanceMatrix.needsUpdate = true;
      if (h.instanceColor) h.instanceColor.needsUpdate = true;
    }

    const p = pebbleMesh.current;
    if (p) {
      pebbles.forEach((b, i) => {
        dummy.position.set(b.x, 0.04, b.z);
        dummy.rotation.set(0, b.rot, 0);
        dummy.scale.set(b.s, b.s * 0.5, b.s);
        dummy.updateMatrix();
        p.setMatrixAt(i, dummy.matrix);
        color.set(PEBBLE_GRAYS[Math.floor(b.c * PEBBLE_GRAYS.length) % PEBBLE_GRAYS.length]);
        p.setColorAt(i, color);
      });
      p.instanceMatrix.needsUpdate = true;
      if (p.instanceColor) p.instanceColor.needsUpdate = true;
    }
  }, [tufts, flowers, pebbles]);

  return (
    <group>
      {/* grass tufts */}
      <instancedMesh ref={tuftMesh} args={[undefined, undefined, TUFTS]}>
        <coneGeometry args={[0.09, 0.26, 5]} />
        <meshStandardMaterial roughness={1} />
      </instancedMesh>
      {/* wildflower stems + heads (index-aligned) */}
      <instancedMesh ref={stemMesh} args={[undefined, undefined, FLOWERS]}>
        <cylinderGeometry args={[0.012, 0.014, 0.34, 6]} />
        <meshStandardMaterial color="#3f6d31" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={headMesh} args={[undefined, undefined, FLOWERS]}>
        <sphereGeometry args={[0.06, 8, 6]} />
        <meshStandardMaterial roughness={0.7} />
      </instancedMesh>
      {/* pebbles */}
      <instancedMesh ref={pebbleMesh} args={[undefined, undefined, PEBBLES]}>
        <dodecahedronGeometry args={[0.09, 0]} />
        <meshStandardMaterial roughness={1} />
      </instancedMesh>

      {/* lawn trees + bushes beyond the fence */}
      {lawnTrees.map((t, i) =>
        t.pine ? (
          <Pine key={i} pos={[t.x, 0, t.z]} s={t.s} yaw={t.yaw} />
        ) : (
          <LawnTree key={i} pos={[t.x, 0, t.z]} s={t.s} yaw={t.yaw} />
        ),
      )}
      {bushes.map((b, i) => (
        <group key={i} position={[b.x, 0, b.z]} rotation-y={b.yaw} scale={b.s}>
          <mesh position={[0, 0.35, 0]}>
            <sphereGeometry args={[0.7, 10, 8]} />
            <meshStandardMaterial color="#3f6d31" roughness={0.95} />
          </mesh>
          <mesh position={[0.5, 0.28, 0.2]}>
            <sphereGeometry args={[0.45, 8, 7]} />
            <meshStandardMaterial color="#4d8139" roughness={0.95} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** A round-crowned shade tree for the meadow. */
function LawnTree({ pos, s, yaw }: { pos: [number, number, number]; s: number; yaw: number }) {
  return (
    <group position={pos} rotation-y={yaw} scale={s}>
      <mesh position={[0, 1.3, 0]}>
        <cylinderGeometry args={[0.22, 0.34, 2.6, 8]} />
        <meshStandardMaterial color="#5d4330" roughness={0.95} />
      </mesh>
      <mesh position={[0, 3.2, 0]}>
        <sphereGeometry args={[1.5, 12, 10]} />
        <meshStandardMaterial color="#4d8139" roughness={0.9} />
      </mesh>
      <mesh position={[0.9, 2.8, 0.3]}>
        <sphereGeometry args={[1.0, 10, 8]} />
        <meshStandardMaterial color="#5d9243" roughness={0.9} />
      </mesh>
      <mesh position={[-0.8, 2.9, -0.35]}>
        <sphereGeometry args={[0.9, 10, 8]} />
        <meshStandardMaterial color="#43712f" roughness={0.9} />
      </mesh>
    </group>
  );
}

/** A stacked-cone pine for the meadow. */
function Pine({ pos, s, yaw }: { pos: [number, number, number]; s: number; yaw: number }) {
  return (
    <group position={pos} rotation-y={yaw} scale={s}>
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.16, 0.22, 1.8, 8]} />
        <meshStandardMaterial color="#5d4330" roughness={0.95} />
      </mesh>
      {[1.9, 2.9, 3.9].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <coneGeometry args={[1.5 - i * 0.35, 1.7, 8]} />
          <meshStandardMaterial color={["#2f5426", "#38642c", "#41742f"][i]} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}
