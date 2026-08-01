import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CharacterBody } from "../CharacterBody";
import { TS } from "./tetherState";
import { drawFace, makeNameTag } from "../../game/textures";
import type { FaceState } from "../../game/refs";

interface RigProps {
  side: "player" | "op";
}

/**
 * A stripped-down rig for the tetherball mode — one player (blue jersey,
 * ballcap) and one opponent (red robot with LED face). Both driven off
 * TS.current so they animate without React re-renders.
 */
export function TetherRig({ side }: RigProps) {
  const isPlayer = side === "player";
  const jersey = isPlayer ? "#2f6fdb" : "#e2483d";
  const accent = isPlayer ? "#f4f1e8" : "#ffd23e";
  const skin = isPlayer ? "#f0c297" : "#c7d0dc";
  const screen = "#1a0e0c";
  const face = useMemo(() => {
    if (isPlayer) return null;
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 96;
    drawFace(c, "idle", screen, accent);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return { canvas: c, tex };
  }, [isPlayer, accent]);

  const tag = useMemo(
    () =>
      makeNameTag(
        isPlayer ? "YOU" : "REX",
        isPlayer ? "#ffd23e" : "#ff6b5e",
        isPlayer ? "challenger" : "pole king",
        !isPlayer,   // bot is the king (has the crown)
        isPlayer,
      ),
    [isPlayer],
  );

  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const lastFace = useRef<FaceState>("idle");
  const lastPos = useRef(new THREE.Vector3());

  useFrame(({ clock }) => {
    const t = TS.current;
    if (!root.current || !body.current) return;
    const time = clock.elapsedTime;

    const pos = isPlayer ? t.playerPos : t.opPos;
    const yOff = isPlayer ? t.playerY : t.opY;
    const facing = isPlayer ? t.playerFacing : t.opFacing;
    const swing = isPlayer ? t.playerSwing : t.opSwing;
    const crouch = isPlayer ? t.playerCrouch : t.opCrouch;

    root.current.position.set(pos.x, yOff, pos.z);
    root.current.rotation.y = facing;

    const cr = crouch ? 0.62 : 1;
    body.current.scale.y += (cr - body.current.scale.y) * 0.35;
    body.current.position.y = (body.current.scale.y - 1) * 0.48;

    // walk sway when the rig is actually moving (player: WASD deltas,
    // bot: distance remaining to its current target)
    const moving =
      isPlayer
        ? lastPos.current.distanceTo(t.playerPos) > 0.04
        : Math.hypot(t.opTarget.x - t.opPos.x, t.opTarget.z - t.opPos.z) > 0.08;
    lastPos.current.copy(isPlayer ? t.playerPos : t.opPos);
    const sw = moving ? Math.sin(time * 6) * 0.35 : 0;
    if (legL.current) legL.current.rotation.x = sw;
    if (legR.current) legR.current.rotation.x = -sw;

    // arm swing animation (windup then follow through)
    let arm = 0.15 + Math.sin(time * 2 + (isPlayer ? 0 : 1.7)) * 0.07;
    if (swing < 0.34) {
      const k = swing / 0.34;
      arm = -2.3 + k * 3.3;
    }
    if (armR.current) armR.current.rotation.x = arm;
    if (armL.current) armL.current.rotation.x = -sw * 0.5 - 0.08;

    // bot face
    if (face && !isPlayer) {
      const wantsFace: FaceState =
        swing < 0.35 ? "hit" : t.thetaVel * -1 > 5 ? "happy" : Math.abs(t.thetaVel) > 2 ? "alert" : "idle";
      if (wantsFace !== lastFace.current) {
        lastFace.current = wantsFace;
        drawFace(face.canvas, wantsFace, screen, accent);
        face.tex.needsUpdate = true;
      }
    }
  });

  return (
    <group ref={root}>
      <CharacterBody
        refs={{ body, armL, armR, legL, legR }}
        look={{
          isPlayer, jersey, accent, skin,
          botColor: "#e2483d",
          faceTex: face?.tex,
        }}
      />
      <sprite position={[0, 2.38, 0]} scale={[1.42, 0.36, 1]}>
        <spriteMaterial map={tag} depthWrite={false} transparent />
      </sprite>
    </group>
  );
}
