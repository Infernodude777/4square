import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CharacterBody } from "../CharacterBody";
import { DS } from "./dodgeballState";
import { drawFace, makeNameTag } from "../../game/textures";

function PlayerRig() {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const prevPos = useRef(new THREE.Vector3());

  useFrame(({ clock }) => {
    const t = DS.current;
    const p = t.player;
    const time = clock.elapsedTime;
    if (!root.current || !body.current) return;
    root.current.visible = p.alive;
    if (!p.alive) return;
    root.current.position.set(p.pos.x, p.y, p.pos.z);
    root.current.rotation.y = p.facing;

    const moved = p.pos.distanceTo(prevPos.current);
    prevPos.current.copy(p.pos);
    const walking = p.moving || moved > 0.004;
    const sw = walking ? Math.sin(time * 11) * 0.55 : Math.sin(time * 1.7) * 0.05;
    if (legL.current) legL.current.rotation.x = sw;
    if (legR.current) legR.current.rotation.x = -sw;

    let arm = 0.12 + Math.sin(time * 2) * 0.05;
    if (p.swing < 0.3) arm = -2.2 + (p.swing / 0.3) * 3.2;
    if (armR.current) armR.current.rotation.x = arm;
    if (armL.current) armL.current.rotation.x = -sw * 0.4;
    body.current.rotation.z = walking ? Math.sin(time * 11) * 0.05 : 0;
  });

  return (
    <group ref={root}>
      <CharacterBody
        refs={{ body, armL, armR, legL, legR }}
        look={{ isPlayer: true, jersey: "#2f6fdb", accent: "#f4f1e8", skin: "#f0c297" }}
      />
      <sprite position={[0, 2.38, 0]} scale={[1.42, 0.36, 1]}>
        <spriteMaterial map={useMemo(() => makeNameTag("YOU", "#ffd23e", "challenger", false, true), [])} depthWrite={false} transparent />
      </sprite>
    </group>
  );
}

function BotRig({ idx }: { idx: number }) {
  const def = DS.current.bots[idx].def;
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Mesh>(null);
  const haloMat = useRef<THREE.MeshBasicMaterial>(null);

  const face = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 128; c.height = 96;
    drawFace(c, "idle", "#1a0e0c", def.accent);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return { canvas: c, tex };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  const tag = useMemo(() => makeNameTag(def.name, def.colour, "dodger", false, false), [def.name, def.colour]);

  const lastFace = useRef("__none__");
  const prevPos = useRef(new THREE.Vector3());

  useFrame(({ clock }) => {
    const t = DS.current;
    const bot = t.bots[idx];
    const time = clock.elapsedTime;
    if (!root.current || !body.current) return;
    root.current.visible = bot.alive;
    if (!bot.alive) {
      if (face && lastFace.current !== "out") {
        lastFace.current = "out";
        drawFace(face.canvas, "out", "#1a0e0c", def.accent);
        face.tex.needsUpdate = true;
      }
      return;
    }
    root.current.position.set(bot.pos.x, bot.y, bot.pos.z);
    root.current.rotation.y = bot.facing;

    const moved = bot.pos.distanceTo(prevPos.current);
    prevPos.current.copy(bot.pos);
    const walking = bot.moving || moved > 0.004;
    const sw = walking ? Math.sin(time * 11) * 0.55 : Math.sin(time * 1.7 + idx) * 0.05;
    if (legL.current) legL.current.rotation.x = sw;
    if (legR.current) legR.current.rotation.x = -sw;

    let arm = 0.12 + Math.sin(time * 2 + idx) * 0.05;
    if (bot.swing < 0.3) arm = -2.2 + (bot.swing / 0.3) * 3.2;
    if (armR.current) armR.current.rotation.x = arm;
    if (armL.current) armL.current.rotation.x = -sw * 0.4;

    // Wind-up telegraph: red glow while about to throw.
    const winding = bot.state === "windup";
    if (haloMat.current) {
      haloMat.current.opacity = winding ? 0.5 + Math.sin(time * 14) * 0.35 : 0;
    }
    if (halo.current) halo.current.visible = winding;

    // Alert face while winding, idle otherwise.
    const wantFace = winding ? "alert" : "idle";
    if (face && lastFace.current !== wantFace) {
      lastFace.current = wantFace;
      drawFace(face.canvas, wantFace, "#1a0e0c", def.accent);
      face.tex.needsUpdate = true;
    }
  });

  return (
    <group ref={root}>
      <CharacterBody
        refs={{ body, armL, armR, legL, legR }}
        look={{ isPlayer: false, jersey: def.jersey, accent: def.accent, skin: def.skin, botColor: def.colour, faceTex: face?.tex }}
      />
      <sprite position={[0, 2.38, 0]} scale={[1.42, 0.36, 1]}>
        <spriteMaterial map={tag} depthWrite={false} transparent />
      </sprite>
      <mesh ref={halo} rotation-x={-Math.PI / 2} position={[0, 0.02, 0]} visible={false}>
        <ringGeometry args={[0.62, 0.78, 40]} />
        <meshBasicMaterial ref={haloMat} color="#ff3d3d" transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function DodgeballPlayers() {
  return (
    <>
      <PlayerRig />
      {DS.current.bots.map((b, i) => <BotRig key={b.def.id} idx={i} />)}
    </>
  );
}
