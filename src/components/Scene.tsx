import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Sky, Clouds, Cloud } from "@react-three/drei";
import * as THREE from "three";
import { World } from "./World";
import { Court } from "./Court";
import { Ball } from "./Ball";
import { Rig } from "./Rig";
import { Director } from "./Director";
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
  return (
    <>
      <Sky distance={4000} sunPosition={[70, 38, -80]} turbidity={5} rayleigh={1.6} mieCoefficient={0.004} mieDirectionalG={0.85} />
      <fog attach="fog" args={["#cfe3ee", 48, 160]} />
      <hemisphereLight args={["#d8ecff", "#7a8a66", 0.6]} />
      <ambientLight intensity={0.22} />
      <directionalLight
        position={[16, 24, -12]}
        intensity={1.7}
        color="#fff2dd"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[-12, 10, 14]} intensity={0.35} color="#bcd6ff" />

      <Clouds material={THREE.MeshBasicMaterial}>
        <Cloud position={[-30, 27, -55]} speed={0.12} opacity={0.75} segments={24} bounds={[11, 3, 3]} color="#ffffff" />
        <Cloud position={[25, 31, -70]} speed={0.08} opacity={0.65} segments={20} bounds={[14, 3.4, 3]} color="#fdfdff" />
        <Cloud position={[55, 26, 10]} speed={0.1} opacity={0.55} segments={18} bounds={[9, 2.6, 3]} color="#ffffff" />
      </Clouds>

      <World />
      <Court />
      <Ball />
      {IDS.map((id) => (
        <Rig key={id} id={id} />
      ))}
      <Bursts />
      <Director />
    </>
  );
}
