import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CharacterBody } from "../CharacterBody";
import { makeNameTag } from "../../game/textures";
import type { RLRunner } from "../../game/redlight";
import { RL } from "./redlightState";

/** Lane x for each runner id — the lane chalk guides in the court match. */
const LANE_X: Record<string, number> = { player: -1.35, rex: 0.45, ziggy: 1.65, ada: -0.45 };

const BOT_LOOK: Record<string, { jersey: string; accent: string; skin: string }> = {
  rex:   { jersey: "#e2483d", accent: "#ffe9a8", skin: "#b8bfc7" },
  ziggy: { jersey: "#f7b32b", accent: "#233043", skin: "#c7c0a8" },
  ada:   { jersey: "#8a5cf6", accent: "#ffd23e", skin: "#b8bfc7" },
};

function Runner({ id }: { id: string }) {
  const isPlayer = id === "player";
  const look = isPlayer ? { jersey: "#2f6fdb", accent: "#f4f1e8", skin: "#f0c297" } : BOT_LOOK[id];

  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);

  const tag = useRef<THREE.SpriteMaterial>(null);

  const name = isPlayer ? "YOU" : id.toUpperCase();
  const color = isPlayer ? "#ffd23e" : look.jersey;
  const tagTex = makeNameTag(name, color, "runner", false, isPlayer);

  // per-runner walk clock so strides land at different times
  const phase = useRef(Math.random() * 10);

  useFrame(({ clock }, dt) => {
    if (!root.current || !body.current) return;
    const r = RL.current.runners.find((x: RLRunner) => x.id === id);
    if (!r) return;
    const t = clock.elapsedTime;
    const x = LANE_X[id] ?? 0;

    root.current.position.set(x, 0, r.z);
    // face up the lane (north, toward the light)
    root.current.rotation.y = 0;
    root.current.rotation.order = "YXZ";
    root.current.rotation.x = 0;

    if (r.moving) phase.current += dt * 11;
    const sw = r.moving ? Math.sin(phase.current) * 0.7 : 0;
    if (legL.current) legL.current.rotation.x = sw;
    if (legR.current) legR.current.rotation.x = -sw;
    if (armL.current) armL.current.rotation.x = -sw * 0.6;
    if (armR.current) armR.current.rotation.x = sw * 0.6;
    body.current.rotation.z = r.moving ? Math.sin(phase.current) * 0.04 : 0;

    // frozen-on-red posture: slight tension lean
    body.current.rotation.x = !r.moving && RL.current.light === "red" ? 0.08 : 0;

    if (tag.current) {
      tag.current.opacity = r.out ? 0.3 : 1;
    }
    void t;
    void dt;
  });

  return (
    <group ref={root}>
      <CharacterBody refs={{ body, armL, armR, legL, legR }} look={{ isPlayer, ...look }} />
      <sprite position={[0, 2.42, 0]} scale={[1.42, 0.36, 1]}>
        <spriteMaterial ref={tag} map={tagTex} depthWrite={false} transparent />
      </sprite>
    </group>
  );
}

export function RedLightPlayers() {
  return (
    <group>
      <Runner id="player" />
      <Runner id="rex" />
      <Runner id="ziggy" />
      <Runner id="ada" />
    </group>
  );
}
