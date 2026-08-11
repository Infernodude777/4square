import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CharacterBody } from "../CharacterBody";
import { GS } from "./gagaState";
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
    const t = GS.current;
    const p = t.player;
    const time = clock.elapsedTime;
    if (!root.current || !body.current) return;
    root.current.visible = p.alive;
    if (!p.alive) return;
    root.current.position.set(p.pos.x, 0, p.pos.z);
    root.current.rotation.y = p.facing;

    const moved = Math.hypot(p.pos.x - prevPos.current.x, p.pos.z - prevPos.current.z);
    prevPos.current.set(p.pos.x, 0, p.pos.z);
    const walking = p.moving || moved > 0.004;
    const sw = walking ? Math.sin(time * 11) * 0.55 : Math.sin(time * 1.7) * 0.05;
    if (legL.current) legL.current.rotation.x = sw;
    if (legR.current) legR.current.rotation.x = -sw;

    let arm = 0.12 + Math.sin(time * 2) * 0.05;
    if (p.cooldown > 0.18) arm = -2.4 + (1 - p.cooldown / 0.3) * 3.4; // slap follow-through
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
        <spriteMaterial map={useMemo(() => makeNameTag("YOU", "#ffd23e", "ga ga!", false, true), [])} depthWrite={false} transparent />
      </sprite>
    </group>
  );
}

function BotRig({ idx }: { idx: number }) {
  const def = GS.current.bots[idx].def;
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);

  const face = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 128; c.height = 96;
    drawFace(c, "idle", "#1a0e0c", def.accent);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return { canvas: c, tex };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  const tag = useMemo(() => makeNameTag(def.name, def.colour, "ga ga!", false, false), [def.name, def.colour]);
  const lastFace = useRef("__none__");
  const prevPos = useRef(new THREE.Vector3());

  useFrame(({ clock }) => {
    const t = GS.current;
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
    root.current.position.set(bot.pos.x, 0, bot.pos.z);
    root.current.rotation.y = bot.facing;

    const moved = Math.hypot(bot.pos.x - prevPos.current.x, bot.pos.z - prevPos.current.z);
    prevPos.current.set(bot.pos.x, 0, bot.pos.z);
    const walking = bot.moving || moved > 0.004;
    const sw = walking ? Math.sin(time * 11) * 0.55 : Math.sin(time * 1.7 + idx) * 0.05;
    if (legL.current) legL.current.rotation.x = sw;
    if (legR.current) legR.current.rotation.x = -sw;

    let arm = 0.12 + Math.sin(time * 2 + idx) * 0.05;
    if (bot.cooldown > 0.4) arm = -2.4 + (1 - bot.cooldown / 0.5) * 3.4;
    if (armR.current) armR.current.rotation.x = arm;
    if (armL.current) armL.current.rotation.x = -sw * 0.4;

    if (face && lastFace.current !== "idle") {
      lastFace.current = "idle";
      drawFace(face.canvas, "idle", "#1a0e0c", def.accent);
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
    </group>
  );
}

export function GagaPlayers() {
  return (
    <>
      <PlayerRig />
      {GS.current.bots.map((b, i) => <BotRig key={b.def.id} idx={i} />)}
    </>
  );
}
