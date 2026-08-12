import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Icon } from "./Icons";

// ─────────────────────────────────────────────────────────────
//  PHOTO MODE — the schoolyard yearbook (Season 2)
//
//  Press F in the hub to free the camera: drag to orbit, scroll to
//  zoom, H to hide the HUD, and SAVE to download a PNG keepsake of
//  Falcon Elementary. The photo camera sits on the same scene graph
//  as everything else and takes over the view while active — the
//  yard keeps living behind the lens.
// ─────────────────────────────────────────────────────────────

// Screenshot plumbing: the r3f camera (inside Canvas, has the GL) registers
// a capture function; the HTML bar (outside Canvas) calls it.
let screenshotFn: (() => void) | null = null;

export function registerScreenshot(fn: (() => void) | null) {
  screenshotFn = fn;
}

export function captureScreenshot() {
  screenshotFn?.();
}

const FOCUS = new THREE.Vector3(0, 1.6, 0);
const MIN_R = 6;
const MAX_R = 26;

/** r3f camera rig — orbit controller used while photo mode is active. */
export function PhotoCamera({ active }: { active: boolean }) {
  const { camera, gl, scene } = useThree();
  const sph = useRef({ theta: 0.7, phi: 1.12, radius: 13 });
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!active) return;
    registerScreenshot(() => {
      try {
        gl.render(scene, camera);
        const url = gl.domElement.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = url;
        a.download = `falcon-recess-${Date.now()}.png`;
        a.click();
      } catch {
        // Context readback can fail on some GPUs — never crash the game.
      }
    });
    return () => registerScreenshot(null);
  }, [active, gl, scene, camera]);

  useEffect(() => {
    if (!active) return;
    const el = gl.domElement;
    const down = (e: PointerEvent) => {
      dragging.current = true;
      last.current = { x: e.clientX, y: e.clientY };
    };
    const move = (e: PointerEvent) => {
      if (!dragging.current) return;
      sph.current.theta -= (e.clientX - last.current.x) * 0.005;
      sph.current.phi = THREE.MathUtils.clamp(
        sph.current.phi - (e.clientY - last.current.y) * 0.005,
        0.25,
        Math.PI - 0.25,
      );
      last.current = { x: e.clientX, y: e.clientY };
    };
    const up = () => {
      dragging.current = false;
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      sph.current.radius = THREE.MathUtils.clamp(
        sph.current.radius + e.deltaY * 0.015,
        MIN_R,
        MAX_R,
      );
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    el.addEventListener("wheel", wheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      el.removeEventListener("wheel", wheel);
    };
  }, [active, gl]);

  useFrame((_, dt) => {
    if (!active) return;
    const s = sph.current;
    if (!dragging.current) s.theta += dt * 0.12; // gentle idle orbit
    const sinP = Math.sin(s.phi);
    camera.position.set(
      FOCUS.x + s.radius * sinP * Math.cos(s.theta),
      FOCUS.y + s.radius * Math.cos(s.phi),
      FOCUS.z + s.radius * sinP * Math.sin(s.theta),
    );
    camera.lookAt(FOCUS);
  });

  return null;
}

/** HTML overlay shown while photo mode is active. */
export function PhotoBar({ onExit }: { onExit: () => void }) {
  const [hidden, setHidden] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!hidden) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "KeyH") setHidden(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hidden]);

  if (hidden) {
    return (
      <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
        <button
          onClick={() => setHidden(false)}
          className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-white/15 bg-[#0d1219]/80 px-4 py-1.5 font-display text-xs text-white/70 backdrop-blur-sm transition hover:bg-white/10"
        >
          <Icon name="camera" size={14} />
          SHOW PHOTO BAR (H)
        </button>
      </div>
    );
  }

  const flash = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1400);
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
      <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border-2 border-[#ffd23e]/40 bg-[#0d1219]/88 px-5 py-3 backdrop-blur-md">
        <span className="flex items-center gap-2 font-display text-sm tracking-widest text-[#ffd23e]">
          <Icon name="camera" size={16} />
          PHOTO MODE
        </span>
        <span className="h-6 w-px bg-white/15" />
        <div className="flex items-center gap-3 text-[10px] font-bold text-white/55">
          <span>DRAG · orbit</span>
          <span>SCROLL · zoom</span>
          <span>H · hide HUD</span>
          <span>F · exit</span>
        </div>
        <span className="h-6 w-px bg-white/15" />
        <button
          onClick={() => {
            captureScreenshot();
            flash();
          }}
          className="flex items-center gap-1.5 rounded-lg border-b-[3px] border-[#8f6a00] bg-[#ffd23e] px-4 py-1.5 font-display text-sm text-[#3a2a00] transition hover:bg-[#ffe066] active:translate-y-0.5 active:border-b-0"
        >
          <Icon name="save" size={14} />
          {saved ? "SAVED!" : "SAVE"}
        </button>
        <button
          onClick={onExit}
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-white/60 transition hover:bg-white/10"
        >
          EXIT
        </button>
      </div>
    </div>
  );
}
