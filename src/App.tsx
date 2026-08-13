import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
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
import { BasketballScene } from "./components/basketball/BasketballScene";
import { BasketballHUD } from "./components/basketball/BasketballHUD";
import { DodgeballScene } from "./components/dodgeball/DodgeballScene";
import { DodgeballHUD } from "./components/dodgeball/DodgeballHUD";
import { GagaScene } from "./components/gaga/GagaScene";
import { GagaHUD } from "./components/gaga/GagaHUD";
import { HopscotchGame } from "./components/hopscotch/HopscotchGame";
import { HopscotchHUD } from "./components/hopscotch/HopscotchHUD";
import { RedLightScene } from "./components/redlight/RedLightScene";
import { RedLightHUD } from "./components/redlight/RedLightHUD";
import { Victory } from "./components/Screens";
import { PauseMenu } from "./components/PauseMenu";
import { SettingsPanel } from "./components/SettingsPanel";
import { BadgeToast } from "./components/BadgeToast";
import { ControlsCard } from "./components/ControlsCard";
import { TitleScreen } from "./components/TitleScreen";
import { LoadingScreen } from "./components/LoadingScreen";
import { Sky } from "./components/Sky";
import { PhotoCamera, PhotoBar } from "./components/PhotoMode";
import { Icon } from "./components/Icons";
import { useGame } from "./game/store";
import { useSettings } from "./game/settings";
import { setVolume, setMuted, unlockAudio, ambientStart, bell } from "./game/audio";
import { musicStart, musicStop, setMusicMood, musicDuck, musicNewDay } from "./game/music";
import { todayKey } from "./game/daily";
import { dayFraction } from "./game/atmosphere";
import { bellRang } from "./game/bells";

export default function App() {
  const phase = useGame((s) => s.phase);
  const mode = useGame((s) => s.mode);
  const run = useGame((s) => s.run);
  const paused = useGame((s) => s.paused);
  const setPaused = useGame((s) => s.setPaused);
  const hasStarted = useSettings((s) => s.hasStarted);
  const startSession = useSettings((s) => s.startSession);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [celebrate, setCelebrate] = useState(0);
  const [ready, setReady] = useState(false);
  const [glLost, setGlLost] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [photo, setPhoto] = useState(false);
  // zustand v5 hydrates on a microtask — gate the title screen on it so a
  // returning player's `hasStarted: true` never flashes the menu for a frame.
  const [hydrated, setHydrated] = useState(() => useSettings.persist?.hasHydrated?.() ?? true);
  const playing = phase === "play" || phase === "point";
  const isHub = phase === "hub";
  const isTether = mode === "tetherball";
  const isWall = mode === "wallball";
  const isTag = mode === "tag";
  const isKick = mode === "kickball";
  const isBasket = mode === "basketball";
  const isDodge = mode === "dodgeball";
  const isGaga = mode === "gaga";
  const isHop = mode === "hopscotch";
  const isRed = mode === "redlight";

  // Push persisted volume into the audio engine once on boot and start the
  // quiet playground ambience. The AudioContext itself stays locked until the
  // first user gesture (unlockAudio below) — creating it early just logs a
  // browser warning and rejects the resume.
  useEffect(() => {
    const s = useSettings.getState();
    setVolume(s.volume);
    if (s.muted) setMuted(true);
    s.setMusicVolume(s.musicVolume);
    ambientStart();
    musicStart();
    return () => musicStop();
  }, []);

  // The recess radio mood follows the phase; pause ducks it so SFX pop.
  useEffect(() => {
    setMusicMood(phase === "hub" ? "hub" : phase === "point" ? "point" : "play");
    if (paused) musicDuck(2.6);
  }, [phase, paused]);

  // Photo mode: F toggles the free camera while wandering the yard.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "KeyF" && useGame.getState().phase === "hub") {
        setPhoto((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Wait for settings hydration before showing the title screen.
  useEffect(() => {
    if (hydrated) return;
    const unsub = useSettings.persist?.onFinishHydration?.(() => setHydrated(true));
    return () => {
      unsub?.();
    };
  }, [hydrated]);

  // If the GL context never comes up (unsupported GPU), don't leave the
  // loading card spinning forever — offer the reload card instead.
  useEffect(() => {
    const t = setTimeout(() => {
      if (!ready) setStuck(true);
    }, 12000);
    return () => clearTimeout(t);
  }, [ready]);

  // First user gesture unlocks audio (P0-7) — pointer, key or touch.
  useEffect(() => {
    const wake = () => {
      unlockAudio();
      musicStart();
    };
    const opts = { once: true, passive: true } as AddEventListenerOptions;
    window.addEventListener("pointerdown", wake, opts);
    window.addEventListener("keydown", wake, opts);
    window.addEventListener("touchstart", wake, opts);
    return () => {
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", wake);
      window.removeEventListener("touchstart", wake);
    };
  }, []);

  // ── Daily-completion celebration ──────────────────────────
  // When today's recess special crosses its target mid-session, ring the
  // bell, burst confetti, and bank a +100 bonus for the match in progress.
  // The ref starts at the *current* state so a day completed before this
  // session (or a fresh refresh) never re-fires the celebration.
  const dailyDone = useSettings((s) => s.daily.done);
  const dailyKey = useSettings((s) => s.daily.key);
  const prevDaily = useRef({ key: dailyKey, done: dailyKey === todayKey() && dailyDone });

  useEffect(() => {
    const fresh = dailyKey === todayKey();
    const prev = prevDaily.current;
    const nowDone = fresh && dailyDone;

    if (prev.key !== dailyKey) {
      // Day rolled over — start watching the new challenge.
      prevDaily.current = { key: dailyKey, done: nowDone };
      return;
    }
    if (nowDone && !prev.done) {
      bell();
      setCelebrate(Date.now());
      const g = useGame.getState();
      if (g.phase === "play" || g.phase === "point") {
        g.addScore(100);
        g.popup("BELL RINGER! +100", "gold", true);
      }
    }
    prevDaily.current = { key: dailyKey, done: nowDone };
  }, [dailyDone, dailyKey]);

  // ── Season 3 — THE LAST BELL ──────────────────────────────
  // When the 3:00 PM school bell rings, the yard celebrates: a long bell,
  // confetti, a fresh daily tune, a SCHOOL'S OUT badge — and if a match is
  // live, an OVERTIME +50 bonus for the player brave enough to keep playing
  // past the bell. bellRang() handles the day wrap, so this fires exactly
  // once per school day.
  const bellFired = useRef(false);
  useEffect(() => {
    const iv = setInterval(() => {
      const f = dayFraction();
      if (bellRang(f)) {
        if (bellFired.current) return;
        bellFired.current = true;
        bell();
        musicNewDay();
        setCelebrate(Date.now());
        const g = useGame.getState();
        const overtime = g.phase === "play" || g.phase === "point";
        if (overtime) {
          g.addScore(50);
          g.popup("OVERTIME +50 — SCHOOL'S OUT!", "gold", true);
        }
        useSettings.getState().noteBell(overtime);
      } else {
        bellFired.current = false;
      }
    }, 400);
    return () => clearInterval(iv);
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

  // Auto-pause when the tab loses focus mid-match (P0-5): hiding the tab
  // must never cost the player a point they weren't even watching.
  useEffect(() => {
    const onVis = () => {
      if (!document.hidden) return;
      const g = useGame.getState();
      if ((g.phase === "play" || g.phase === "point") && !g.paused) {
        g.setPaused(true);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Track play time into lifetime stats.
  useEffect(() => {
    if (!playing || paused) return;
    const iv = setInterval(() => {
      useSettings.getState().addTime(1);
    }, 1000);
    return () => clearInterval(iv);
  }, [playing, paused]);

  // Season 2 quality preset → renderer fidelity.
  const quality = useSettings((s) => s.quality);
  const dpr: [number, number] =
    quality === "low" ? [1, 1] : quality === "medium" ? [1, 1.4] : [1, 1.75];
  const shadows = quality !== "low";

  const camPos: [number, number, number] = isTether
    ? [1, 7, 5.5]
    : isWall
      ? [0, 5.2, 6.0]
      : isTag
        ? [0, 14, 12]
        : isKick
          ? [0, 10, 13]
          : isBasket
            ? [11, 5.2, 0.35]
            : isDodge
              ? [0, 8.2, 7]
              : isGaga
                ? [0, 8.4, 5.5]
                : isHop
                  ? [5.2, 7.6, 1]
                  : isRed
                    ? [0, 8.6, 13.7]
                    : [-10.5, 5.4, -10.5];

  return (
    <div
      className={`relative h-dvh w-screen touch-manipulation select-none overflow-hidden bg-[#8fbfe0] font-body ${
        playing ? "cursor-crosshair" : ""
      }`}
    >
      <Canvas
        shadows={shadows}
        dpr={dpr}
        gl={{ preserveDrawingBuffer: true }}
        frameloop={playing && paused ? "never" : "always"}
        camera={{ fov: 50, position: camPos, near: 0.1, far: 400 }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.08;
          // r3f's `shadows` prop sets the deprecated PCFSoftShadowMap — pin the
          // non-deprecated PCF type so the console stays clean on three r185.
          gl.shadowMap.type = THREE.PCFShadowMap;
          // The canvas lives for the whole session now (no per-mode remount), so
          // a context loss here is a genuine GPU hiccup. Ask the browser to
          // restore it and hide the reload card the moment it's back — three
          // re-initialises itself on webglcontextrestored.
          gl.domElement.addEventListener("webglcontextlost", (e) => {
            e.preventDefault();
            setReady(true);
            setGlLost(true);
          });
          gl.domElement.addEventListener("webglcontextrestored", () => {
            setGlLost(false);
          });
          setReady(true);
        }}
      >
        {/* Per-mode camera anchor: the canvas persists, so snap the default
            camera into place whenever the scene changes (keyed on mode+run so
            same-mode restarts re-snap too — each scene's director then eases
            it from there on its first frames). */}
        <CameraAnchor key={`${mode}-${run}`} pos={camPos} />
        {isHub && <Sky />}
        {isHub ? (
          <HubScene key={`hub-${run}`} />
        ) : isTether ? (
          <TetherScene key={`${mode}-${run}`} />
        ) : isWall ? (
          <WallballScene key={`${mode}-${run}`} />
        ) : isTag ? (
          <TagScene key={`${mode}-${run}`} />
        ) : isKick ? (
          <KickballScene key={`${mode}-${run}`} />
        ) : isBasket ? (
          <BasketballScene key={`${mode}-${run}`} />
        ) : isDodge ? (
          <DodgeballScene key={`${mode}-${run}`} />
        ) : isGaga ? (
          <GagaScene key={`${mode}-${run}`} />
        ) : isHop ? (
          <HopscotchGame key={`${mode}-${run}`} />
        ) : isRed ? (
          <RedLightScene key={`${mode}-${run}`} />
        ) : (
          <Scene key={`${mode}-${run}`} />
        )}
        {isHub && <PhotoCamera active={photo} />}
      </Canvas>
      {isHub && <HubHUD onOpenSettings={() => setSettingsOpen(true)} />}
      {playing && (isTether ? <TetherHUD /> : isWall ? <WallballHUD /> : isTag ? <TagHUD /> : isKick ? <KickballHUD /> : isBasket ? <BasketballHUD /> : isDodge ? <DodgeballHUD /> : isGaga ? <GagaHUD /> : isHop ? <HopscotchHUD /> : isRed ? <RedLightHUD /> : <HUD />)}
      {playing && !paused && <ControlsCard />}
      {phase === "win" && <Victory />}
      {playing && paused && !photo && (
        <PauseMenu onOpenSettings={() => setSettingsOpen(true)} />
      )}
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
      {celebrate > 0 && <ConfettiBurst key={celebrate} onDone={() => setCelebrate(0)} />}
      {ready && hydrated && !hasStarted && !settingsOpen && (
        <TitleScreen
          onPlay={() => {
            unlockAudio();
            musicStart();
            startSession();
          }}
          onSettings={() => setSettingsOpen(true)}
        />
      )}
      {!ready && <LoadingScreen />}
      {(glLost || stuck) && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-[#0d1219]/85 font-body backdrop-blur-sm">
          <div className="chalkboard mx-4 w-full max-w-sm rounded-3xl border-4 border-[#f5edc8]/60 p-8 text-center">
            <div className="flex justify-center text-[#d9efe8]/80">
              <Icon name="photo" size={44} />
            </div>
            <div className="mt-3 font-display text-2xl text-[#ffd23e]">SCREEN BLANKED OUT</div>
            <p className="mt-2 text-xs font-bold text-[#d9efe8]/80">
              The playground TV lost its signal. A quick reload brings recess right back.
            </p>
            {stuck && !glLost && (
              <p className="mt-1 text-[10px] font-bold text-[#d9efe8]/55">
                (The 3D view took too long to wake up — your browser may need WebGL enabled.)
              </p>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-5 rounded-xl border-b-[4px] border-[#8f6a00] bg-[#ffd23e] px-6 py-2.5 font-display text-lg text-[#3a2a00] transition hover:bg-[#ffe066] active:translate-y-0.5 active:border-b-0"
            >
              RELOAD
            </button>
          </div>
        </div>
      )}
      {photo && isHub && <PhotoBar onExit={() => setPhoto(false)} />}
      <BadgeToast />
      {/* subtle vignette — keeps the eye on the blacktop (P2-1) */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_58%,rgba(10,20,30,0.22)_100%)]" />
    </div>
  );
}

/* ── per-mode camera anchor ─────────────────────────────────── */
// The Canvas is created once and stays alive for the whole session (the old
// per-mode remount tore the WebGL context down on every game entry, which
// fired webglcontextlost on some GPUs and flashed the "screen blanked out"
// card). The default camera is repositioned here whenever the mode changes;
// each scene's director then eases it from this spot on its first frames.
function CameraAnchor({ pos }: { pos: [number, number, number] }) {
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    camera.position.set(pos[0], pos[1], pos[2]);
    camera.lookAt(0, 0, 0);
  }, [camera, pos[0], pos[1], pos[2]]);
  return null;
}

/* ── one-shot confetti burst (daily complete / last bell) ──── */
function ConfettiBurst({ onDone }: { onDone: () => void }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        left: 8 + Math.random() * 84,
        delay: Math.random() * 0.4,
        dur: 1.8 + Math.random() * 1.4,
        color: ["#ffd23e", "#57d977", "#38d6d0", "#b58cff", "#ff8a70"][i % 5],
        w: 4 + Math.random() * 4,
        h: 4 + Math.random() * 5,
      })),
    [],
  );

  useEffect(() => {
    // Longest piece ends at 1.8 + 1.4 + 0.4 = 3.6 s — clear just after.
    const t = setTimeout(onDone, 3800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden">
      {pieces.map((c, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${c.left}%`,
            width: c.w,
            height: c.h,
            background: c.color,
            animationDelay: `${c.delay}s`,
            animationDuration: `${c.dur}s`,
            animationIterationCount: 1,
          }}
        />
      ))}
    </div>
  );
}
