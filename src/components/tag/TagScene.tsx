import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Sky, Clouds, Cloud } from "@react-three/drei";
import * as THREE from "three";
import { World } from "../World";
import { CharacterBody } from "../CharacterBody";
import { makeNameTag } from "../../game/textures";
import { BOTS, BOT_IDS, TAG_YARD_HALF, blobMembers } from "../../game/tag";
import { TS, TagDirector } from "./TagDirector";

// ── Single character for tag mode ─────────────────────────────
function TagChar({ id }: { id: string }) {
  const isPlayer = id === "player";
  const def = isPlayer ? null : BOTS[id];
  const jersey = isPlayer ? "#2f6fdb" : def!.jersey;
  const accent = isPlayer ? "#f4f1e8" : def!.accent;
  const skin   = isPlayer ? "#f0c297" : def!.skin;

  const root   = useRef<THREE.Group>(null);
  const body   = useRef<THREE.Group>(null);
  const armR   = useRef<THREE.Group>(null);
  const armL   = useRef<THREE.Group>(null);
  const legR   = useRef<THREE.Group>(null);
  const legL   = useRef<THREE.Group>(null);

  const tagSprite = useMemo(() => {
    const name  = isPlayer ? "YOU" : def!.name;
    const color = isPlayer ? "#ffd23e" : def!.colour;
    return makeNameTag(name, color, isPlayer ? "runner" : def!.tag, false, isPlayer);
  }, [isPlayer, def]);

  // Halo: glowing disc under "it" players, red; frozen = blue; blob = orange
  const haloRef   = useRef<THREE.Mesh>(null);
  const haloMat   = useRef<THREE.MeshBasicMaterial>(null);
  const frozenRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const e = TS.entities[id];
    if (!e || !root.current || !body.current) return;

    root.current.position.set(e.pos.x, e.y, e.pos.z);
    root.current.rotation.y = e.facing;

    // Walk animation
    const sw = e.moving ? Math.sin(e.walkPhase) * 0.65 : 0;
    if (legL.current) legL.current.rotation.x =  sw;
    if (legR.current) legR.current.rotation.x = -sw;
    if (armL.current) armL.current.rotation.x = -sw * 0.55;
    if (armR.current) armR.current.rotation.x =  sw * 0.55;
    body.current.rotation.z = e.moving ? Math.sin(e.walkPhase) * 0.04 : 0;
    body.current.position.y = 0;
    body.current.scale.y = 1;

    // Halo
    if (haloRef.current && haloMat.current) {
      const isIt = e.isIt || (TS.mode === "blob" && e.blobIdx === 0);
      const inBlob = TS.mode === "blob" && e.blobIdx > 0;
      const show = isIt || inBlob;
      haloRef.current.visible = show;
      if (show) {
        const p = (1 + Math.sin(t * 6) * 0.12);
        haloRef.current.scale.setScalar(p);
        haloMat.current.color.set(isIt ? "#ff4422" : "#ff9922");
      }
    }

    // Frozen ring (freeze tag)
    if (frozenRef.current) {
      frozenRef.current.visible = e.frozen;
    }
  });

  return (
    <group ref={root}>
      <CharacterBody refs={{ body, armL, armR, legL, legR }} look={{ isPlayer, jersey, accent, skin }} />

      <sprite position={[0, 2.42, 0]} scale={[1.42, 0.36, 1]}>
        <spriteMaterial map={tagSprite} depthWrite={false} transparent />
      </sprite>

      {/* "IT" / Blob halo */}
      <mesh ref={haloRef} rotation-x={-Math.PI / 2} position={[0, 0.025, 0]} visible={false}>
        <ringGeometry args={[0.52, 0.68, 40]} />
        <meshBasicMaterial ref={haloMat} color="#ff4422" transparent opacity={0.85} depthWrite={false} />
      </mesh>

      {/* Frozen ring */}
      <mesh ref={frozenRef} rotation-x={-Math.PI / 2} position={[0, 0.025, 0]} visible={false}>
        <ringGeometry args={[0.48, 0.60, 40]} />
        <meshBasicMaterial color="#38d6d0" transparent opacity={0.90} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ── Blob chain visual connectors ──────────────────────────────
function BlobChain() {
  const lineRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!lineRef.current) return;
    const t = TS;
    if (t.mode !== "blob") { lineRef.current.visible = false; return; }
    lineRef.current.visible = true;
    const members = blobMembers(t.entities);
    lineRef.current.children.forEach((c, i) => {
      if (i >= members.length - 1) { c.visible = false; return; }
      const a = members[i].pos;
      const b = members[i + 1].pos;
      const mid = new THREE.Vector3((a.x + b.x) / 2, 0.9, (a.z + b.z) / 2);
      const length = Math.hypot(b.x - a.x, b.z - a.z);
      const angle  = Math.atan2(b.x - a.x, b.z - a.z);
      c.position.copy(mid);
      c.rotation.y = angle;
      (c as THREE.Mesh).scale.set(0.08, 0.08, length);
      c.visible = true;
    });
  });
  return (
    <group ref={lineRef}>
      {Array.from({ length: 5 }, (_, i) => (
        <mesh key={i} visible={false}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#ff9922" emissive="#ff6600" emissiveIntensity={0.6} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// ── IT crown indicator ─────────────────────────────────────────
function ItCrown() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const it = Object.values(TS.entities).find(e => e.isIt || (TS.mode === "blob" && e.blobIdx === 0));
    if (!it) { ref.current.visible = false; return; }
    ref.current.visible = true;
    ref.current.position.set(it.pos.x, 2.9 + Math.sin(clock.elapsedTime * 3) * 0.08, it.pos.z);
    ref.current.rotation.y = clock.elapsedTime * 2.5;
  });
  return (
    <group ref={ref} visible={false}>
      <mesh>
        <cylinderGeometry args={[0.14, 0.16, 0.09, 12]} />
        <meshStandardMaterial color="#ff3322" emissive="#ff2211" emissiveIntensity={0.5} metalness={0.5} roughness={0.3} />
      </mesh>
      {[0, 1, 2, 3, 4].map(i => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.11, 0.09, Math.sin(a) * 0.11]}>
            <coneGeometry args={[0.038, 0.12, 5]} />
            <meshStandardMaterial color="#ff3322" emissive="#ff2211" emissiveIntensity={0.5} metalness={0.4} roughness={0.3} />
          </mesh>
        );
      })}
    </group>
  );
}

// ── Court boundary outline ─────────────────────────────────────
function TagBoundary() {
  const hw = TAG_YARD_HALF;
  return (
    <group>
      {[
        [0, -hw, hw * 2, 0.14],
        [0,  hw, hw * 2, 0.14],
        [-hw, 0, 0.14, hw * 2],
        [ hw, 0, 0.14, hw * 2],
      ].map(([x, z, w, d], i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[x, 0.018, z]}>
          <planeGeometry args={[w, d]} />
          <meshBasicMaterial color="#ffd23e" transparent opacity={0.55} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

// ── Full tag scene ─────────────────────────────────────────────
export function TagScene() {
  return (
    <>
      <Sky distance={4000} sunPosition={[70, 38, -80]} turbidity={4} rayleigh={1.4} />
      <fog attach="fog" args={["#cfe3ee", 55, 180]} />
      <hemisphereLight args={["#d8ecff", "#7a8a66", 0.65]} />
      <ambientLight intensity={0.28} />
      <directionalLight position={[14, 22, -10]} intensity={1.6} color="#fff2dd" castShadow
        shadow-mapSize={[2048, 2048]} shadow-camera-left={-20} shadow-camera-right={20}
        shadow-camera-top={20} shadow-camera-bottom={-20} shadow-bias={-0.0004} />
      <Clouds material={THREE.MeshBasicMaterial}>
        <Cloud position={[-28, 26, -55]} speed={0.10} opacity={0.70} segments={22} bounds={[12, 3, 3]} color="#ffffff" />
        <Cloud position={[24, 30, -68]} speed={0.08} opacity={0.60} segments={18} bounds={[14, 3, 3]} color="#fdfdff" />
      </Clouds>

      <World />
      <TagBoundary />

      {/* All six characters */}
      <TagChar id="player" />
      {BOT_IDS.map(id => <TagChar key={id} id={id} />)}

      <BlobChain />
      <ItCrown />
      <TagDirector />
    </>
  );
}
