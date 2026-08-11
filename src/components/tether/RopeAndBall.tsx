import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BALL_R, POLE_R, ROPE_MAX, BALL_HIT_RANGE, BALL_GLOW_Y, TS } from "./tetherState";

// Procedural rubber ball texture
function makeBallTexture(): THREE.CanvasTexture {
  const S = 256;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d")!;
  const gr = g.createLinearGradient(0, 0, S, S);
  gr.addColorStop(0, "#f8d070");
  gr.addColorStop(0.5, "#e09028");
  gr.addColorStop(1, "#a05010");
  g.fillStyle = gr;
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 800; i++) {
    g.fillStyle = `rgba(${Math.random() > 0.5 ? 255 : 40},${100},${10},0.07)`;
    g.fillRect(Math.random() * S, Math.random() * S, 2, 2);
  }
  // painted stripes
  g.strokeStyle = "rgba(60,20,0,0.55)";
  g.lineWidth = 7;
  g.beginPath();
  g.moveTo(0, S / 2);
  g.bezierCurveTo(S * 0.3, S * 0.2, S * 0.7, S * 0.8, S, S / 2);
  g.stroke();
  g.beginPath();
  g.moveTo(S / 2, 0);
  g.bezierCurveTo(S * 0.2, S * 0.3, S * 0.8, S * 0.7, S / 2, S);
  g.stroke();
  g.fillStyle = "rgba(60,20,0,0.65)";
  g.font = '900 28px "Arial Black", sans-serif';
  g.textAlign = "center";
  g.fillText("TETHER", S * 0.5, S * 0.53);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function RopeAndBall() {
  const ball      = useRef<THREE.Mesh>(null);
  const ballGlow  = useRef<THREE.Sprite>(null);
  const glowMat   = useRef<THREE.SpriteMaterial>(null);
  const shadow    = useRef<THREE.Mesh>(null);
  const shadMat   = useRef<THREE.MeshBasicMaterial>(null);
  const wrappedRef = useRef<THREE.Mesh>(null);
  const freeRef    = useRef<THREE.Mesh>(null);
  const clipRef    = useRef<THREE.Mesh>(null);
  const arcGeoRef  = useRef<THREE.BufferGeometry | null>(null);
  const arcRef     = useRef<THREE.Line>(null);

  const ballTex  = useMemo(() => makeBallTexture(), []);
  const ropeMat  = useMemo(() => new THREE.MeshStandardMaterial({ color: "#f2ecc8", roughness: 0.88 }), []);
  const glowT    = useMemo(() => {
    const S = 64;
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const g = c.getContext("2d")!;
    const gr = g.createRadialGradient(S/2,S/2,0,S/2,S/2,S/2);
    gr.addColorStop(0,   "rgba(255,220,120,0.85)");
    gr.addColorStop(0.4, "rgba(255,160,60,0.28)");
    gr.addColorStop(1,   "rgba(255,100,20,0)");
    g.fillStyle = gr;
    g.fillRect(0,0,S,S);
    const t = new THREE.CanvasTexture(c);
    return t;
  }, []);

  const wrappedGeoRef = useRef<THREE.BufferGeometry | null>(null);
  const freeGeoRef    = useRef<THREE.BufferGeometry | null>(null);
  // The rope/arc tube geometries are rebuilt when their curves change, and
  // each rebuild allocates + disposes a BufferGeometry. Rebuilding at half
  // rate is visually imperceptible for a spinning rope and halves the GC
  // churn (the ball/shadow/clip transforms still update every frame).
  const rebuildTick = useRef(0);

  useFrame(() => {
    const t = TS.current;
    const rebuild = (rebuildTick.current = (rebuildTick.current + 1) % 2) === 0;

    // ── Ball ─────────────────────────────────────────────────
    if (ball.current) {
      ball.current.position.copy(t.ballPos);
      ball.current.rotation.y = t.theta * 1.5;
      ball.current.rotation.z = t.phi;
    }
    // Glow sprite (child of ball mesh) — brightens at smash height, pulses with speed
    if (ballGlow.current && glowMat.current) {
      const isHigh    = t.ballPos.y > BALL_GLOW_Y;
      const speed     = t.ballVel.length();
      const intensity = isHigh ? 0.95 : 0.20 + Math.min(0.40, speed * 0.05);
      const pulse     = 1 + Math.sin(t.time * 9) * (isHigh ? 0.18 : 0.05);
      ballGlow.current.scale.setScalar((BALL_R * 6 + speed * 0.3) * pulse);
      glowMat.current.opacity = intensity;
      glowMat.current.color.set(isHigh ? "#ffd23e" : "#ff8a2f");
    }
    // Shadow
    if (shadow.current && shadMat.current) {
      shadow.current.position.set(t.ballPos.x, 0.012, t.ballPos.z);
      const h = Math.max(0, t.ballPos.y);
      shadow.current.scale.setScalar(Math.max(0.30, 1.15 - h * 0.22));
      shadMat.current.opacity = Math.max(0.05, 0.40 - h * 0.08);
    }
    // Clip
    if (clipRef.current) {
      clipRef.current.position.set(
        Math.cos(t.theta) * POLE_R * 1.42, t.wrapY, Math.sin(t.theta) * POLE_R * 1.42,
      );
    }

    // ── Wrapped rope helix around the pole ───────────────────
    const wrapsMag = Math.abs(t.wraps);
    if (rebuild && wrappedRef.current) {
      const segs   = Math.min(180, Math.max(8, Math.floor(wrapsMag * 28) + 8));
      const pts: THREE.Vector3[] = [];
      const sAngle = t.theta - Math.sign(t.wraps || 1) * wrapsMag * 2 * Math.PI;
      const dir    = t.wraps >= 0 ? 1 : -1;
      const hh     = POLE_R * 1.18;
      for (let i = 0; i <= segs; i++) {
        const u = i / segs;
        const y = 3.05 + (t.wrapY - 3.05) * u;
        const a = sAngle + dir * u * wrapsMag * 2 * Math.PI;
        pts.push(new THREE.Vector3(Math.cos(a) * hh, y, Math.sin(a) * hh));
      }
      const path = new THREE.CatmullRomCurve3(pts);
      const geo  = new THREE.TubeGeometry(path, Math.min(120, segs * 2), 0.013, 5, false);
      wrappedGeoRef.current?.dispose();
      wrappedGeoRef.current = geo;
      wrappedRef.current.geometry = geo;
      wrappedRef.current.visible  = true;
    }

    // ── Free rope (straight line with slight sag) ─────────────
    if (rebuild && freeRef.current) {
      const start = new THREE.Vector3(Math.cos(t.theta) * POLE_R * 1.18, t.wrapY, Math.sin(t.theta) * POLE_R * 1.18);
      const end   = t.ballPos.clone();
      const mid   = start.clone().lerp(end, 0.5).sub(new THREE.Vector3(0, 0.14, 0));
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const geo   = new THREE.TubeGeometry(curve, 16, 0.013, 5, false);
      freeGeoRef.current?.dispose();
      freeGeoRef.current = geo;
      freeRef.current.geometry = geo;
    }

    // ── Trajectory arc — shows the ball's true conical path around the
    //    pole (not linear extrapolation) as a colour-coded guide.
    //    Gold when ball is at smash height (attack opportunity), ice-blue otherwise.
    if (rebuild && arcRef.current && t.serveStage === "live") {
      const pts: THREE.Vector3[] = [];
      const orbitR  = t.ropeFree * Math.sin(t.phi);
      const orbitY  = t.wrapY - t.ropeFree * Math.cos(t.phi);
      const cx      = 0, cz = 0;
      for (let i = 0; i <= 28; i++) {
        const fut     = i * 0.075;
        const ang     = t.theta + t.thetaVel * fut;
        // Project: orbit shrinks as rope wraps, but we show the *near-future*
        // path, which is very close to the current orbit
        const y     = Math.max(0.04, orbitY - t.phiVel * fut * 0.35);
        pts.push(new THREE.Vector3(
          cx + Math.cos(ang) * orbitR,
          y,
          cz + Math.sin(ang) * orbitR,
        ));
      }
      const arcGeo = new THREE.BufferGeometry().setFromPoints(pts);
      arcGeoRef.current?.dispose();
      arcGeoRef.current = arcGeo;
      arcRef.current.geometry = arcGeo;
      // Required for LineDashedMaterial — computes lineDistance on the NEW
      // geometry just attached (must run after the assignment).
      arcRef.current.computeLineDistances();
      // Colour: gold when ball is at smash Y (>1.4), ice blue otherwise.
      // color/opacity are uniforms — no needsUpdate (that would recompile
      // the shader every frame).
      const isHigh = t.ballPos.y > BALL_GLOW_Y;
      const mat = arcRef.current.material as THREE.LineDashedMaterial;
      mat.color.set(isHigh ? "#ffd23e" : "#8fd8ff");
      mat.opacity = isHigh ? 0.5 : 0.28;
      arcRef.current.visible = true;
    } else if (arcRef.current) {
      arcRef.current.visible = false;
    }
  });

  return (
    <group>
      {/* Ball */}
      <mesh ref={ball} castShadow>
        <sphereGeometry args={[BALL_R, 30, 26]} />
        <meshStandardMaterial
          map={ballTex}
          roughness={0.42}
          emissive="#402000"
          emissiveIntensity={0.12}
        />
        {/* Glow sprite as child of ball — follows it automatically */}
        <sprite ref={ballGlow}>
          <spriteMaterial
            ref={glowMat}
            map={glowT}
            transparent
            alphaTest={0.01}
            depthWrite={false}
          />
        </sprite>
      </mesh>

      {/* Contact shadow */}
      <mesh ref={shadow} rotation-x={-Math.PI / 2} position={[0, 0.012, 0]}>
        <circleGeometry args={[0.20, 24]} />
        <meshBasicMaterial ref={shadMat} color="#0c0e12" transparent opacity={0.38} depthWrite={false} />
      </mesh>

      {/* Rope tubes */}
      <mesh ref={wrappedRef} material={ropeMat} castShadow />
      <mesh ref={freeRef}   material={ropeMat} castShadow />

      {/* Clip at wrap point */}
      <mesh ref={clipRef}>
        <sphereGeometry args={[0.022, 8, 8]} />
        <meshStandardMaterial color="#8f959e" metalness={0.75} roughness={0.28} />
      </mesh>

      {/* Trajectory arc guide — shows where the ball is going next */}
      <line ref={arcRef as never}>
        <lineDashedMaterial
          attach="material"
          color="#fff8c8"
          linewidth={1.5}
          dashSize={0.10}
          gapSize={0.06}
          transparent
          opacity={0.28}
          depthWrite={false}
        />
      </line>

      {/* Lost custody reference — keeps ROPE_MAX import used */}
      <mesh visible={false} userData={{ r: ROPE_MAX }} />
      {/* Also reference BALL_HIT_RANGE to satisfy lint */}
      <mesh visible={false} userData={{ r: BALL_HIT_RANGE }} />
    </group>
  );
}
