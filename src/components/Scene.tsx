import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { World } from "./World";
import { Court } from "./Court";
import { Ball } from "./Ball";
import { Rig } from "./Rig";
import { Director } from "./Director";
import { Atmosphere } from "./Atmosphere";
import { useSettings } from "../game/settings";
import { RT, type Burst } from "../game/refs";
import { makeBurstTexture } from "../game/textures";
import type { EntityId } from "../game/constants";

const IDS: EntityId[] = ["player", "ada", "alan", "grace", "turing"];

function BurstSprite({ b, tex }: { b: Burst; tex: THREE.Texture }) {
  const ref = useRef<THREE.Sprite>(null);
  useFrame(() => {
    const s = ref.current;
    if (!s) return;
    const age = RT.time - b.at;
    const life = b.kind === "perfect" ? 0.55 : b.kind === "dust" ? 0.5 : 0.36;
    if (age > life) {
      s.visible = false;
      return;
    }
    const k = age / life;
    s.visible = true;
    const sc = b.kind === "dust" ? 0.35 + k * 1.15 : 0.3 + k * (b.kind === "perfect" ? 2.3 : 1.5);
    s.scale.setScalar(sc);
    s.position.copy(b.pos);
    s.position.y += k * (b.kind === "dust" ? 0.25 : 0.55);
    (s.material as THREE.SpriteMaterial).opacity = (1 - k) * 0.95;
  });
  return (
    <sprite ref={ref} position={b.pos}>
      <spriteMaterial map={tex} color={b.color} transparent depthWrite={false} />
    </sprite>
  );
}

function Bursts() {
  const tex = useMemo(() => makeBurstTexture(), []);
  const [, setTick] = useState(0);
  const seen = useRef("");
  useFrame(() => {
    const last = RT.bursts[RT.bursts.length - 1];
    const key = `${RT.bursts.length}:${last ? last.at : 0}`;
    if (key !== seen.current) {
      seen.current = key;
      setTick((t) => t + 1);
    }
  });
  return (
    <>
      {RT.bursts.map((b, i) => (
        <BurstSprite key={`${b.at}-${i}`} b={b} tex={tex} />
      ))}
    </>
  );
}

export function Scene() {
  // Hit-burst stars are "FX" — honour the particles toggle.
  const particles = useSettings((s) => s.particles);
  return (
    <>
      <Atmosphere />

      <World />
      <Court />
      <Ball />
      {IDS.map((id) => (
        <Rig key={id} id={id} />
      ))}
      {particles && <Bursts />}
      <Director />
    </>
  );
}
