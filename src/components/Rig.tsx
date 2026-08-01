import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RT } from "../game/refs";
import { BOTS, sqOf, type EntityId } from "../game/constants";
import { useGame } from "../game/store";
import { drawFace, makeNameTag } from "../game/textures";
import { CharacterBody } from "./CharacterBody";

export function Rig({ id }: { id: EntityId }) {
  const isPlayer = id === "player";
  const def = isPlayer ? null : BOTS[id as Exclude<EntityId, "player">];
  const jersey = isPlayer ? "#2f6fdb" : def!.color;
  const accent = isPlayer ? "#f4f1e8" : def!.accent;
  const skin = isPlayer ? "#f0c297" : "#b8bfc7";

  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const crown = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const antennaTip = useRef<THREE.Mesh>(null);

  const assign = useGame((s) => s.assign);
  const sq = sqOf(id, assign);
  const isKing = sq === 4;

  const face = useMemo(() => {
    if (isPlayer) return null;
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 96;
    drawFace(c, "idle", def!.screen, def!.accent);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return { canvas: c, tex: t };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const tag = useMemo(() => {
    const name  = isPlayer ? "YOU" : def!.short;
    const color = isPlayer ? "#ffd23e" : def!.color;
    const label = sq === 0 ? "in line" : sq === 4 ? "king" : `sq ${sq}`;
    return makeNameTag(name, color, label, isKing, isPlayer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sq, isKing, id]);

  const lastFace = useRef<string>("__none__");

  useFrame(({ clock }) => {
    const e = RT.entities[id];
    if (!root.current || !body.current) return;
    const t = clock.elapsedTime;
    // YXZ so `facing` turns the body first, then `lean` tips it along
    // that facing direction rather than along world X.
    root.current.rotation.order = "YXZ";
    root.current.position.set(e.pos.x, e.y, e.pos.z);
    root.current.rotation.y = e.facing;
    root.current.rotation.x = e.lean;

    if (e.sitting) {
      // ── SEATED ON THE SWING ──
      body.current.scale.y += (1 - body.current.scale.y) * 0.35;
      body.current.position.y = 0;
      // Legs stick out in front and pump with the arc of the swing.
      const kick = -1.22 + e.lean * 0.45;
      if (legL.current) legL.current.rotation.x = kick;
      if (legR.current) legR.current.rotation.x = kick - 0.06;
      // Hands reach up and grip the chains either side of the head.
      if (armL.current) { armL.current.rotation.x = -2.42; armL.current.rotation.z = 0.20; }
      if (armR.current) { armR.current.rotation.x = -2.42; armR.current.rotation.z = -0.20; }
      // Gentle recline so the pose reads as "sitting", not "standing".
      body.current.rotation.z = 0;
      body.current.rotation.x = 0.14;
    } else {
      // ── STANDING / WALKING ──
      const cr = e.crouch ? 0.6 : 1;
      body.current.scale.y += (cr - body.current.scale.y) * 0.35;
      body.current.position.y = (body.current.scale.y - 1) * 0.48;

      // gait
      const sw = e.moving ? Math.sin(e.walkPhase) * 0.75 : 0;
      if (legL.current) legL.current.rotation.x = sw;
      if (legR.current) legR.current.rotation.x = -sw;

      // swing: wind-up overhead → follow through
      let arm = 0.15 + Math.sin(t * 2 + (isPlayer ? 0 : 1.7)) * 0.07;
      if (e.swing < 0.34) {
        const k = e.swing / 0.34;
        arm = -2.3 + k * 3.3;
      }
      if (armR.current) { armR.current.rotation.x = arm; armR.current.rotation.z = 0; }
      if (armL.current) { armL.current.rotation.x = -sw * 0.5 - 0.08; armL.current.rotation.z = 0; }

      body.current.rotation.x = 0;
      body.current.rotation.z = e.moving
        ? Math.sin(e.walkPhase) * 0.05
        : Math.sin(t * 1.3 + (isPlayer ? 0 : 2)) * 0.025;
    }

    if (crown.current) {
      crown.current.visible = isKing;
      crown.current.position.y = 1.98 + Math.sin(t * 3) * 0.035;
      crown.current.rotation.y = t * 1.2;
    }
    if (ring.current) {
      const distToBall = Math.hypot(
        RT.ball.pos.x - e.pos.x,
        RT.ball.pos.z - e.pos.z,
      );
      const inRange = distToBall < 1.6 && RT.ball.active && RT.ball.pos.y > 0.04;
      const col = inRange ? "#7dff9a" : "#ffffff";
      const baseOp = isPlayer ? (inRange ? 0.85 : 0.12) : 0;
      (ring.current.material as THREE.MeshBasicMaterial).color.set(col);
      const pulse = inRange ? 1 + Math.sin(t * 7) * 0.04 : 1;
      ring.current.scale.setScalar(pulse);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = baseOp;
    }
    if (antennaTip.current) {
      const m = antennaTip.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity =
        e.face === "alert" ? 2.6 + Math.sin(t * 18) * 1.6 : 1.1 + Math.sin(t * 3) * 0.4;
    }
    if (face && e.face !== lastFace.current) {
      lastFace.current = e.face;
      drawFace(face.canvas, e.face, def!.screen, def!.accent);
      face.tex.needsUpdate = true;
    }
  });

  return (
    <group ref={root}>
      <CharacterBody
        refs={{ body, armL, armR, legL, legR, antennaTip }}
        look={{
          isPlayer,
          jersey,
          accent,
          skin,
          botColor: def?.color,
          faceTex: face?.tex,
        }}
      />

      {/* crown for the King of the court */}
      <group ref={crown} visible={false}>
        <mesh castShadow>
          <cylinderGeometry args={[0.15, 0.17, 0.1, 12]} />
          <meshStandardMaterial color="#f2b53c" metalness={0.7} roughness={0.25} emissive="#8a6a10" emissiveIntensity={0.35} />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.12, 0.1, Math.sin(a) * 0.12]}>
              <coneGeometry args={[0.045, 0.14, 6]} />
              <meshStandardMaterial color="#f2b53c" metalness={0.7} roughness={0.25} emissive="#8a6a10" emissiveIntensity={0.35} />
            </mesh>
          );
        })}
      </group>

      {/* name tag */}
      <sprite position={[0, 2.38, 0]} scale={[1.42, 0.36, 1]}>
        <spriteMaterial map={tag} depthWrite={false} transparent />
      </sprite>

      {/* hit-range ring */}
      <mesh ref={ring} rotation-x={-Math.PI / 2} position={[0, 0.018, 0]}>
        <ringGeometry args={[1.40, 1.52, 48]} />
        <meshBasicMaterial color={isPlayer ? "#7dff9a" : def!.color} transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}
