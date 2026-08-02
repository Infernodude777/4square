import { useEffect, useState } from "react";
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
import { KickballScene } from "./components/kickball/KickballScene";
import { KickballHUD } from "./components/kickball/KickballHUD";
import { Victory } from "./components/Screens";
import { PauseMenu } from "./components/PauseMenu";
import { SettingsPanel } from "./components/SettingsPanel";
import { BadgeToast } from "./components/BadgeToast";
import { ControlsCard } from "./components/ControlsCard";
import { useGame } from "./game/store";
import { useSettings } from "./game/settings";
import { setVolume } from "./game/audio";

export default function App() {
  const phase = useGame((s) => s.phase);
  const mode = useGame((s) => s.mode);
  const paused = useGame((s) => s.paused);
  const setPaused = useGame((s) => s.setPaused);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const playing = phase === "play" || phase === "point";
  const isHub = phase === "hub";
  const isTether = mode === "tetherball";
  const isWall = mode === "wallball";
  const isTag = mode === "tag";
  const isKick = mode === "kickball";

  // Push persisted volume into the audio engine once on boot.
  useEffect(() => {
    const v = useSettings.getState().volume;
    setVolume(v);
  }, []);

  // Global pause: ESC or P toggles the pause menu during a match.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Escape" && e.code !== "KeyP") return;
      const st = useGame.getState();
      const ph = st.phase;
      if (ph !== "play" && ph !== "point") return;
      e.preventDefault();
      setPaused(!useGame.getState().paused);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setPaused]);

  // Track play time into lifetime stats.
  useEffect(() => {
    if (!playing || paused) return;
    const iv = setInterval(() => {
      useSettings.getState().addTime(1);
    }, 1000);
    return () => clearInterval(iv);
  }, [playing, paused]);

  const camPos: [number, number, number] = isTether
    ? [1, 7, 5.5]
    : isWall
      ? [0, 5.2, 6.0]
      : isTag
        ? [0, 14, 12]
        : isKick
          ? [0, 10, 13]
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
        frameloop={playing && paused ? "never" : "always"}
        camera={{ fov: 50, position: camPos, near: 0.1, far: 400 }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.08;
        }}
      >
        {isHub ? (
          <HubScene />
        ) : isTether ? (
          <TetherScene />
        ) : isWall ? (
          <WallballScene />
        ) : isTag ? (
          <TagScene />
        ) : isKick ? (
          <KickballScene />
        ) : (
          <Scene />
        )}
      </Canvas>
      {isHub && <HubHUD />}
      {playing && (isTether ? <TetherHUD /> : isWall ? <WallballHUD /> : isTag ? <TagHUD /> : isKick ? <KickballHUD /> : <HUD />)}
      {playing && !paused && <ControlsCard />}
      {phase === "win" && <Victory />}
      {playing && paused && (
        <PauseMenu onOpenSettings={() => setSettingsOpen(true)} />
      )}
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
      <BadgeToast />
    </div>
  );
}
