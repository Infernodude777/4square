import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CharacterBody } from "../CharacterBody";
import { BS } from "./basketballState";
import { drawFace, makeNameTag } from "../../game/textures";

/** The two shooters — YOU and SLAM. */
function ShooterRig({ side }: { side: 0 | 1 }) {
  const isP = side === 0;
  const jersey = isP ? "#2f6fdb" : "#ff8a3c";
  const accent = isP ? "#f4f1e8" : "#233043";
  const skin = isP ? "#f0c297" : "#c7d0dc";

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
    isP ? "YOU" : "SLAM",
    isP ? "#ffd23e" : "#ff8a3c",
    isP ? "shooter" : "hoop bot",
    false, isP,
  ), [isP]);

  const prevPos = useRef(new THREE.Vector3());

  useFrame(({ clock }) => {
    const t = BS.current;
    const pos = isP ? t.playerPos : t.opPos;
    const y = isP ? t.playerY : t.opY;
    const swing = isP ? t.playerSwing : t.opSwing;
    const moving = isP ? t.playerMoving : t.opMoving;
    const facing = isP ? t.playerFacing : t.opFacing;
    const time = clock.elapsedTime;
    if (!root.current || !body.current) return;

    root.current.position.set(pos.x, y, pos.z);
    root.current.rotation.y = facing;

    const moved = pos.distanceTo(prevPos.current);
    prevPos.current.copy(pos);
    const walking = moving || moved > 0.004;
    const sw = walking ? Math.sin(time * 11) * 0.55 : Math.sin(time * 1.7) * 0.05;
    if (legL.current) legL.current.rotation.x = sw;
    if (legR.current) legR.current.rotation.x = -sw;

    // Shooting wind-up: big overhead arc on release.
    let arm = 0.12 + Math.sin(time * 2 + (isP ? 0 : 1.4)) * 0.05;
    if (swing < 0.55) {
      const k = swing / 0.55;
      arm = -2.5 + k * 3.6; // wind-up → follow-through over the head
    }
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
          botColor: "#ff8a3c",
          faceTex: face?.tex,
        }}
      />
      <sprite position={[0, 2.38, 0]} scale={[1.42, 0.36, 1]}>
        <spriteMaterial map={tag} depthWrite={false} transparent />
      </sprite>
    </group>
  );
}

export function BasketballPlayers() {
  return (
    <>
      <ShooterRig side={0} />
      <ShooterRig side={1} />
    </>
  );
}
