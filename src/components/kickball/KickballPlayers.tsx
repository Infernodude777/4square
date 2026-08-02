import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CharacterBody } from "../CharacterBody";
import { BASE_POS } from "../../game/kickball";
import { KS } from "./kickballState";

/** The lone batter — always standing at home plate between pitches. */
export function KickballBatter() {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!root.current || !body.current) return;
    const t = clock.elapsedTime;

    // Batter stands behind the plate; a gentle idle sway reads as "ready".
    root.current.position.set(0, 0, BASE_POS[0][1] + 1.1);
    root.current.rotation.y = Math.PI; // faces the mound

    const sw = Math.sin(t * 2.1) * 0.02;
    if (armR.current) armR.current.rotation.x = -0.35 + sw;
    if (armL.current) armL.current.rotation.x = -0.35 - sw;
    if (legL.current) legL.current.rotation.x = sw * 0.4;
    if (legR.current) legR.current.rotation.x = -sw * 0.4;
    body.current.rotation.z = 0;
    body.current.position.y = 0;
    body.current.scale.y = 1;
  });

  return (
    <group ref={root}>
      <CharacterBody
        refs={{ body, armL, armR, legL, legR }}
        look={{ isPlayer: true, jersey: "#2f6fdb", accent: "#f4f1e8", skin: "#f0c297" }}
      />
    </group>
  );
}

/** One bot fielder that tracks its position in the kickball state. */
function Fielder({ id }: { id: string }) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);

  const colors: Record<string, { jersey: string; accent: string }> = {
    ada: { jersey: "#e2483d", accent: "#ffd23e" },
    grace: { jersey: "#f7b32b", accent: "#233043" },
    alan: { jersey: "#39b46a", accent: "#eaf6ff" },
    turing: { jersey: "#8a5cf6", accent: "#ffe9a8" },
  };
  const c = colors[id] ?? colors.ada;

  useFrame(({ clock }) => {
    const k = KS.current;
    if (!root.current || !body.current) return;
    const f = k.fielders.find((x) => x.id === id);
    if (!f) return;
    const t = clock.elapsedTime;
    root.current.position.set(f.pos.x, 0, f.pos.z);
    root.current.rotation.y = 0;

    const sw = Math.sin(t * 1.4 + (id.charCodeAt(0) % 5)) * 0.015;
    if (armR.current) armR.current.rotation.x = -0.5 + sw;
    if (armL.current) armL.current.rotation.x = -0.5 - sw;
    if (legL.current) legL.current.rotation.x = sw * 0.5;
    if (legR.current) legR.current.rotation.x = -sw * 0.5;
    body.current.rotation.z = 0;
    body.current.position.y = 0;
    body.current.scale.y = 1;
  });

  return (
    <group ref={root}>
      <CharacterBody
        refs={{ body, armL, armR, legL, legR }}
        look={{ isPlayer: false, jersey: c.jersey, accent: c.accent, skin: "#b8bfc7", botColor: c.jersey }}
      />
    </group>
  );
}

export function KickballPlayers() {
  return (
    <group>
      <KickballBatter />
      {["ada", "grace", "alan", "turing"].map((id) => (
        <Fielder key={id} id={id} />
      ))}
    </group>
  );
}
