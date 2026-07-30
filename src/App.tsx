import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { Scene } from "./components/Scene";
import { HUD } from "./components/HUD";
import { TetherScene } from "./components/tether/TetherScene";
import { TetherHUD } from "./components/tether/TetherHUD";
import { HubScene } from "./components/hub/HubScene";
import { HubHUD } from "./components/hub/HubHUD";
import { Victory } from "./components/Screens";
import { useGame } from "./game/store";

export default function App() {
  const phase = useGame((s) => s.phase);
  const mode = useGame((s) => s.mode);
  const playing = phase === "play" || phase === "point";
  const isHub = phase === "hub";
  const isTether = mode === "tetherball";

  return (
    <div
      className={`relative h-dvh w-screen select-none overflow-hidden bg-[#8fbfe0] font-body ${
        playing ? "cursor-crosshair" : ""
      }`}
    >
      <Canvas
        key={`${phase === "hub" ? "hub" : mode}` /* remount when mode/space changes */}
        shadows
        dpr={[1, 1.75]}
        camera={{ fov: 50, position: isTether ? [1, 7, 5.5] : [-10.5, 5.4, -10.5], near: 0.1, far: 400 }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.08;
        }}
      >
        {isHub ? <HubScene /> : isTether ? <TetherScene /> : <Scene />}
      </Canvas>
      {isHub && <HubHUD />}
      {playing && (isTether ? <TetherHUD /> : <HUD />)}
      {phase === "win" && <Victory />}
    </div>
  );
}
