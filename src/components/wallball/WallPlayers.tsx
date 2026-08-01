import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CharacterBody } from "../CharacterBody";
import { WS } from "./wallballState";
import { drawFace, makeNameTag } from "../../game/textures";


// Reuse character look from four-square but driven by WallState
function PlayerRig({ side }: { side: "player" | "op" }) {
  const isP = side === "player";
  const jersey  = isP ? "#2f6fdb" : "#e2483d";
  const accent  = isP ? "#f4f1e8" : "#ffd23e";
  const skin    = isP ? "#f0c297" : "#c7d0dc";

  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);

  const face = useMemo(() => {
    if (isP) return null;
    const c = document.createElement("canvas");
    c.width = 128; c.height = 96;
    drawFace(c, "idle", "#1a0e0c", accent);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return { canvas: c, tex };
  }, [isP, accent]);

  const tag = useMemo(() => makeNameTag(
    isP ? "YOU" : "ZIGGY",
    isP ? "#ffd23e" : "#ff6b5e",
    isP ? "challenger" : "wall master",
    !isP, isP,
  ), [isP]);

  const prevPos = useRef(new THREE.Vector3());

  useFrame(({ clock }) => {
    const t = WS.current;
    const pos    = isP ? t.playerPos : t.opPos;
    const y      = isP ? t.playerY : t.opY;
    const swing  = isP ? t.playerSwing : t.opSwing;
    const crouch = isP ? t.playerCrouch : t.opCrouch;
    const facing = isP ? t.playerFacing : t.opFacing;
    const time   = clock.elapsedTime;
    if (!root.current || !body.current) return;

    root.current.position.set(pos.x, y, pos.z);
    // Everyone faces the wall (−Z), leaning toward their court position.
    root.current.rotation.y = facing;

    const cr = crouch ? 0.62 : 1;
    body.current.scale.y += (cr - body.current.scale.y) * 0.35;
    body.current.position.y = (body.current.scale.y - 1) * 0.48;

    // Gait only while actually moving
    const moved = pos.distanceTo(prevPos.current);
    prevPos.current.copy(pos);
    const walking = moved > 0.004;
    const sw = walking ? Math.sin(time * 11) * 0.55 : Math.sin(time * 1.7) * 0.05;
    if (legL.current) legL.current.rotation.x = sw;
    if (legR.current) legR.current.rotation.x = -sw;

    let arm = 0.12 + Math.sin(time * 2 + (isP ? 0 : 1.4)) * 0.05;
    if (swing < 0.34) arm = -2.2 + (swing / 0.34) * 3.2;
    if (armR.current) armR.current.rotation.x = arm;
    if (armL.current) armL.current.rotation.x = -sw * 0.4;

    body.current.rotation.z = walking ? Math.sin(time * 11) * 0.05 : Math.sin(time * 1.8) * 0.02;
  });

  return (
    <group ref={root}>
      <CharacterBody
        refs={{ body, armL, armR, legL, legR }}
        look={{
          isPlayer: isP, jersey, accent, skin,
          botColor: "#e2483d",
          faceTex: face?.tex,
        }}
      />
      <sprite position={[0, 2.38, 0]} scale={[1.42, 0.36, 1]}><spriteMaterial map={tag} depthWrite={false} transparent /></sprite>
    </group>
  );
}

export function WallPlayers() {
  return (
    <>
      <PlayerRig side="player" />
      <PlayerRig side="op" />
    </>
  );
}
