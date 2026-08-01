import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CharacterBody } from "../CharacterBody";
import { drawFace, makeNameTag } from "../../game/textures";
import { TAG } from "./tagState";
import { TAG_IDS, type TagId } from "../../game/tag";

function TagRig({ id }: { id: TagId }) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const itBadge = useRef<THREE.Group>(null);
  const def = TAG.current.people[id];
  const isPlayer = id === "player";
  const face = useMemo(() => {
    if (isPlayer) return null;
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 96;
    drawFace(canvas, "idle", "#11161d", def.accent);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return { canvas, tex };
  }, [def.accent, isPlayer]);
  const tag = useMemo(() => makeNameTag(def.name, id === "player" ? "#ffd23e" : def.color, def.role, false, isPlayer), [def.color, def.name, def.role, id, isPlayer]);

  useFrame(({ clock }) => {
    const p = TAG.current.people[id];
    if (!root.current || !body.current) return;
    root.current.position.set(p.pos.x, 0, p.pos.z);
    root.current.rotation.y = p.facing;
    const moving = p.moving;
    const sw = moving ? Math.sin(p.walkPhase) * 0.62 : Math.sin(clock.elapsedTime * 1.5 + id.length) * 0.025;
    if (legL.current) legL.current.rotation.x = sw;
    if (legR.current) legR.current.rotation.x = -sw;
    const arm = p.taggedFlash > 0 ? -2.1 : 0.12;
    if (armR.current) armR.current.rotation.x = arm;
    if (armL.current) armL.current.rotation.x = -sw * 0.45 - 0.08;
    body.current.rotation.z = moving ? Math.sin(p.walkPhase) * 0.045 : 0;
    body.current.scale.y += ((p.stamina < 0.2 ? 0.93 : 1) - body.current.scale.y) * 0.12;
    if (itBadge.current) {
      const isIt = TAG.current.currentIt === id;
      itBadge.current.visible = isIt;
      itBadge.current.position.y = 2.12 + Math.sin(clock.elapsedTime * 5) * 0.06;
      itBadge.current.rotation.y = clock.elapsedTime * 1.8;
    }
    if (face && p.taggedFlash > 0) {
      drawFace(face.canvas, "alert", "#11161d", def.accent);
      face.tex.needsUpdate = true;
    }
  });

  return (
    <group ref={root}>
      <CharacterBody refs={{ body, armL, armR, legL, legR }} look={{ isPlayer, jersey: def.color, accent: def.accent, skin: isPlayer ? "#f0c297" : "#b8bfc7", botColor: def.color, faceTex: face?.tex }} />
      <sprite position={[0, 2.38, 0]} scale={[1.65, 0.38, 1]}>
        <spriteMaterial map={tag} depthWrite={false} transparent />
      </sprite>
      <group ref={itBadge} position={[0, 2.12, 0]}>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.17, 16, 12]} />
          <meshStandardMaterial color="#ff5a3c" emissive="#ff2e18" emissiveIntensity={1.6} />
        </mesh>
        <mesh position={[0, 0.22, 0]} rotation-z={Math.PI}>
          <coneGeometry args={[0.12, 0.25, 5]} />
          <meshStandardMaterial color="#ffd23e" emissive="#9a6a00" emissiveIntensity={0.6} />
        </mesh>
      </group>
    </group>
  );
}

export function TagPlayers() {
  return <>{TAG_IDS.map((id) => <TagRig key={id} id={id} />)}</>;
}
