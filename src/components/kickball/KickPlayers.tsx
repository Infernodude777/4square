import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CharacterBody } from "../CharacterBody";
import { drawFace, makeNameTag } from "../../game/textures";
import { KICK } from "./kickState";
import { KICK_IDS, type KickId } from "../../game/kickball";

function KickRig({ id }: { id: KickId }) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const def = KICK.current.people[id];
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
  const tag = useMemo(() => makeNameTag(def.name, isPlayer ? "#ffd23e" : def.color, isPlayer ? "kicker" : id === "ziggy" ? "pitcher" : "fielder", false, isPlayer), [def.color, def.name, id, isPlayer]);

  useFrame(({ clock }) => {
    const p = KICK.current.people[id];
    if (!root.current || !body.current) return;
    root.current.position.set(p.pos.x, 0, p.pos.z);
    root.current.rotation.y = p.facing;
    const sw = p.moving ? Math.sin(p.walkPhase) * 0.58 : Math.sin(clock.elapsedTime * 1.5 + id.length) * 0.025;
    if (legL.current) legL.current.rotation.x = sw;
    if (legR.current) legR.current.rotation.x = -sw;
    const arm = KICK.current.phase === "flight" && id === "player" ? -2.3 : 0.12;
    if (armR.current) armR.current.rotation.x = arm;
    if (armL.current) armL.current.rotation.x = -sw * 0.45 - 0.08;
    body.current.rotation.z = p.moving ? Math.sin(p.walkPhase) * 0.045 : 0;
    if (face && KICK.current.phase === "point") {
      drawFace(face.canvas, "happy", "#11161d", def.accent);
      face.tex.needsUpdate = true;
    }
  });

  return (
    <group ref={root}>
      <CharacterBody refs={{ body, armL, armR, legL, legR }} look={{ isPlayer, jersey: def.color, accent: def.accent, skin: isPlayer ? "#f0c297" : "#b8bfc7", botColor: def.color, faceTex: face?.tex }} />
      <sprite position={[0, 2.38, 0]} scale={[1.65, 0.38, 1]}><spriteMaterial map={tag} depthWrite={false} transparent /></sprite>
    </group>
  );
}

export function KickPlayers() { return <>{KICK_IDS.map((id) => <KickRig key={id} id={id} />)}</>; }
