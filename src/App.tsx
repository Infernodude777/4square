import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { Scene } from "./components/Scene";
import { HUD } from "./components/HUD";
import { TetherScene } from "./components/tether/TetherScene";
import { TetherHUD } from "./components/tether/TetherHUD";
import { HubScene } from "./components/hub/HubScene";
import { HubHUD } from "./components/hub/HubHUD";
import { WallballScene } from "./components/wallball/WallballScene";
import { WallballHUD } from "./components/wallball/WallballHUD";
import { TagScene } from "./components/tag/TagScene";
import { TagHUD } from "./components/tag/TagHUD";
import { KickScene } from "./components/kickball/KickScene";
import { KickHUD } from "./components/kickball/KickHUD";
import { Victory } from "./components/Screens";
import { useGame } from "./game/store";

export default function App() {
  const phase = useGame((s) => s.phase);
  const mode = useGame((s) => s.mode);
  const playing = phase === "play" || phase === "point";
  const isHub = phase === "hub";
  const isTether = mode === "tetherball";
  const isWall = mode === "wallball";
  const isTag = mode === "tag";
  const isKickball = mode === "kickball";

  const camPos: [number, number, number] = isTether
    ? [1, 7, 5.5]
    : isWall
      ? [0, 5.2, 6.0]
      : isTag
        ? [0, 7.1, 9.2]
        : isKickball
          ? [0, 7.2, 10.2]
          : [-10.5, 5.4, -10.5];

  return (
    <div
      className={`relative h-dvh w-screen select-none overflow-hidden bg-[#8fbfe0] font-body ${
        playing ? "cursor-crosshair" : ""
      }`}
    >
      <Canvas
        key={`${phase === "hub" ? "hub" : mode}`}
        shadows
        dpr={[1, 1.75]}
        camera={{ fov: 50, position: camPos, near: 0.1, far: 400 }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.08;
        }}
      >
        {isHub ? <HubScene /> : isTether ? <TetherScene /> : isWall ? <WallballScene /> : isTag ? <TagScene /> : isKickball ? <KickScene /> : <Scene />}
      </Canvas>
      {isHub && <HubHUD />}
      {playing && (isTether ? <TetherHUD /> : isWall ? <WallballHUD /> : isTag ? <TagHUD /> : isKickball ? <KickHUD /> : <HUD />)}
      {phase === "win" && <Victory />}
    </div>
  );
}
