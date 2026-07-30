import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBox } from "@react-three/drei";
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

    // walk sway when hitting/moving
    const moving =
      isPlayer
        ? Math.hypot(t.ballVel.x, t.ballVel.z) > 0.4 || true
        : Math.hypot(t.opTarget.x - t.opPos.x, t.opTarget.z - t.opPos.z) > 0.08;
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
      <group ref={body}>
        {/* legs */}
        <group ref={legL} position={[-0.14, 0.5, 0]}>
          <mesh castShadow position={[0, -0.22, 0]}>
            <boxGeometry args={[0.15, 0.46, 0.17]} />
            <meshStandardMaterial color={isPlayer ? "#2b3a55" : "#8f97a1"} roughness={0.8} />
          </mesh>
          <mesh castShadow position={[0, -0.46, 0.05]}>
            <boxGeometry args={[0.17, 0.11, 0.3]} />
            <meshStandardMaterial color={isPlayer ? "#f4f1e8" : "#39404a"} roughness={0.6} />
          </mesh>
        </group>
        <group ref={legR} position={[0.14, 0.5, 0]}>
          <mesh castShadow position={[0, -0.22, 0]}>
            <boxGeometry args={[0.15, 0.46, 0.17]} />
            <meshStandardMaterial color={isPlayer ? "#2b3a55" : "#8f97a1"} roughness={0.8} />
          </mesh>
          <mesh castShadow position={[0, -0.46, 0.05]}>
            <boxGeometry args={[0.17, 0.11, 0.3]} />
            <meshStandardMaterial color={isPlayer ? "#f4f1e8" : "#39404a"} roughness={0.6} />
          </mesh>
        </group>

        {/* torso */}
        <RoundedBox args={[0.58, 0.68, 0.36]} radius={0.1} smoothness={3} castShadow position={[0, 0.86, 0]}>
          <meshStandardMaterial color={jersey} roughness={0.65} />
        </RoundedBox>
        <mesh position={[0, 0.98, 0]} castShadow>
          <boxGeometry args={[0.59, 0.13, 0.37]} />
          <meshStandardMaterial color={accent} roughness={0.7} />
        </mesh>

        {/* arms */}
        <group ref={armL} position={[-0.36, 1.12, 0]}>
          <mesh castShadow position={[0, -0.2, 0]}>
            <cylinderGeometry args={[0.065, 0.06, 0.42, 10]} />
            <meshStandardMaterial color={jersey} roughness={0.65} />
          </mesh>
          <mesh castShadow position={[0, -0.44, 0]}>
            <sphereGeometry args={[0.085, 12, 12]} />
            <meshStandardMaterial color={skin} roughness={0.55} />
          </mesh>
        </group>
        <group ref={armR} position={[0.36, 1.12, 0]}>
          <mesh castShadow position={[0, -0.2, 0]}>
            <cylinderGeometry args={[0.065, 0.06, 0.42, 10]} />
            <meshStandardMaterial color={jersey} roughness={0.65} />
          </mesh>
          <mesh castShadow position={[0, -0.44, 0]}>
            <sphereGeometry args={[0.085, 12, 12]} />
            <meshStandardMaterial color={skin} roughness={0.55} />
          </mesh>
        </group>

        {/* head */}
        {isPlayer ? (
          <group position={[0, 1.5, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.26, 20, 20]} />
              <meshStandardMaterial color={skin} roughness={0.6} />
            </mesh>
            <mesh position={[-0.09, 0.03, 0.22]}>
              <sphereGeometry args={[0.032, 8, 8]} />
              <meshStandardMaterial color="#1b1f26" roughness={0.3} />
            </mesh>
            <mesh position={[0.09, 0.03, 0.22]}>
              <sphereGeometry args={[0.032, 8, 8]} />
              <meshStandardMaterial color="#1b1f26" roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.1, 0]} castShadow>
              <sphereGeometry args={[0.275, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
              <meshStandardMaterial color="#e2483d" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.11, -0.26]} castShadow>
              <boxGeometry args={[0.26, 0.05, 0.16]} />
              <meshStandardMaterial color="#c23227" roughness={0.6} />
            </mesh>
          </group>
        ) : (
          <group position={[0, 1.52, 0]}>
            <RoundedBox args={[0.5, 0.44, 0.44]} radius={0.09} smoothness={3} castShadow>
              <meshStandardMaterial color="#cfd6de" metalness={0.55} roughness={0.35} />
            </RoundedBox>
            <mesh position={[0, 0.01, 0.225]}>
              <planeGeometry args={[0.4, 0.3]} />
              <meshBasicMaterial map={face!.tex} toneMapped={false} />
            </mesh>
            <mesh position={[-0.27, 0, 0]} rotation-z={Math.PI / 2}>
              <cylinderGeometry args={[0.06, 0.06, 0.06, 10]} />
              <meshStandardMaterial color="#8f97a1" metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh position={[0.27, 0, 0]} rotation-z={Math.PI / 2}>
              <cylinderGeometry args={[0.06, 0.06, 0.06, 10]} />
              <meshStandardMaterial color="#8f97a1" metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.3, 0]}>
              <cylinderGeometry args={[0.018, 0.018, 0.2, 8]} />
              <meshStandardMaterial color="#5b6470" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.42, 0]}>
              <sphereGeometry args={[0.05, 10, 10]} />
              <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.4} />
            </mesh>
          </group>
        )}
      </group>

      <sprite position={[0, 2.38, 0]} scale={[1.42, 0.36, 1]}>
        <spriteMaterial map={tag} depthWrite={false} transparent />
      </sprite>
    </group>
  );
}
