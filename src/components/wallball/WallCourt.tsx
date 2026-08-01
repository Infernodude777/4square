import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  COURT_HALF_W, COURT_DEPTH, WALL_Z, WALL_HEIGHT, AIM_RING_R, predictLanding,
} from "../../game/wallball";
import { WS } from "./wallballState";

// ── Blacktop with the painted playing box ────────────────────
function makeCourtTex(): THREE.CanvasTexture {
  const W = 1024, H = 1024;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d")!;

  g.fillStyle = "#7b8087";
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 5200; i++) {
    const v = 100 + Math.random() * 52;
    g.fillStyle = `rgba(${v},${v + 2},${v + 7},${0.14 + Math.random() * 0.13})`;
    g.fillRect(Math.random() * W, Math.random() * H, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
  for (let i = 0; i < 9; i++) {
    const x = Math.random() * W, y = Math.random() * H, r = 40 + Math.random() * 100;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(50,52,58,${0.09 + Math.random() * 0.12})`);
    gr.addColorStop(1, "rgba(50,52,58,0)");
    g.fillStyle = gr;
    g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  }
  g.strokeStyle = "rgba(38,40,45,0.45)";
  for (let i = 0; i < 7; i++) {
    g.lineWidth = 1 + Math.random() * 1.6;
    g.beginPath();
    let x = Math.random() * W, y = Math.random() * H;
    g.moveTo(x, y);
    for (let j = 0; j < 5; j++) {
      x += (Math.random() - 0.5) * 190;
      y += (Math.random() - 0.5) * 190;
      g.lineTo(x, y);
    }
    g.stroke();
  }

  // Single painted box — the whole shared court. Wall is along the TOP edge.
  g.strokeStyle = "rgba(236,196,74,0.92)";
  g.lineWidth = 11;
  g.strokeRect(W * 0.05, H * 0.04, W * 0.90, H * 0.92);

  // Service reference line (chalk, informal)
  g.strokeStyle = "rgba(245,240,225,0.32)";
  g.lineWidth = 5;
  g.setLineDash([26, 20]);
  g.beginPath();
  g.moveTo(W * 0.05, H * 0.60);
  g.lineTo(W * 0.95, H * 0.60);
  g.stroke();
  g.setLineDash([]);

  g.fillStyle = "rgba(245,240,225,0.30)";
  g.font = '700 26px "Comic Sans MS", cursive';
  g.textAlign = "center";
  g.fillText("serve from behind here", W * 0.5, H * 0.585);

  // Big chalk arrow pointing at the wall
  g.strokeStyle = "rgba(250,250,252,0.26)";
  g.lineWidth = 8;
  g.beginPath();
  g.moveTo(W * 0.5, H * 0.34);
  g.lineTo(W * 0.5, H * 0.13);
  g.moveTo(W * 0.5 - 30, H * 0.19);
  g.lineTo(W * 0.5, H * 0.13);
  g.lineTo(W * 0.5 + 30, H * 0.19);
  g.stroke();
  g.fillStyle = "rgba(250,250,252,0.30)";
  g.font = '900 34px "Arial Black", system-ui';
  g.fillText("HIT THE WALL", W * 0.5, H * 0.40);

  g.fillStyle = "rgba(140,220,255,0.24)";
  g.font = '700 24px "Comic Sans MS", cursive';
  g.fillText("bounce · wall · bounce · swing", W * 0.5, H * 0.46);

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// ── Brick face with a painted strike line ────────────────────
function makeWallTex(): THREE.CanvasTexture {
  const W = 1024, H = 512;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d")!;
  g.fillStyle = "#c3b09a";
  g.fillRect(0, 0, W, H);
  const bw = 62, bh = 26;
  for (let row = 0; row * bh < H; row++) {
    const off = row % 2 ? bw / 2 : 0;
    for (let col = -1; col * bw < W + bw; col++) {
      const s = 0.84 + Math.random() * 0.32;
      g.fillStyle = `rgb(${Math.round(150 * s)},${Math.round(76 * s)},${Math.round(60 * s)})`;
      g.fillRect(col * bw + off + 2, row * bh + 2, bw - 4, bh - 4);
    }
  }
  // grime + ball scuffs near the bottom
  for (let i = 0; i < 60; i++) {
    g.fillStyle = `rgba(40,30,28,${Math.random() * 0.09})`;
    g.fillRect(Math.random() * W, Math.random() * H, 40 + Math.random() * 80, 8 + Math.random() * 20);
  }
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * W;
    const y = H * 0.55 + Math.random() * H * 0.42;
    g.fillStyle = `rgba(190,70,60,${0.05 + Math.random() * 0.10})`;
    g.beginPath();
    g.ellipse(x, y, 6 + Math.random() * 12, 5 + Math.random() * 9, Math.random() * 3, 0, 7);
    g.fill();
  }
  // Painted top-out line
  g.fillStyle = "rgba(236,196,74,0.9)";
  g.fillRect(0, H * 0.055, W, 12);
  g.fillStyle = "rgba(245,240,225,0.5)";
  g.font = '900 30px "Arial Black", system-ui';
  g.textAlign = "center";
  g.fillText("OVER THIS LINE = OUT", W / 2, H * 0.028);

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// Pulsing hit-range ring under the player
function ReachRing() {
  const ref = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(() => {
    const t = WS.current;
    if (!ref.current || !mat.current) return;
    const d = Math.hypot(t.ballPos.x - t.playerPos.x, t.ballPos.z - t.playerPos.z);
    const mine  = t.turn === "player";
    const ready = t.hitWall && t.bouncesAfterWall === 1;
    const near  = d < 2.05 && t.phase === "live";
    ref.current.position.set(t.playerPos.x, 0.02, t.playerPos.z);
    const col = !mine ? "#5a5f7a" : ready && near ? "#7dff9a" : "#ffd23e";
    mat.current.color.set(col);
    mat.current.opacity = !mine ? 0.10 : near ? (ready ? 0.8 : 0.34) : 0.18;
    ref.current.scale.setScalar(near && ready ? 1 + Math.sin(t.time * 7) * 0.045 : 1);
  });
  return (
    <mesh ref={ref} rotation-x={-Math.PI / 2}>
      <ringGeometry args={[1.88, 2.02, 52]} />
      <meshBasicMaterial ref={mat} transparent opacity={0.2} depthWrite={false} />
    </mesh>
  );
}

// Marker showing where the ball will next land
function LandingMarker() {
  const ref = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(() => {
    const t = WS.current;
    if (!ref.current || !mat.current) return;
    const v = t.ballVel;
    if (t.phase !== "live" || (v.x * v.x + v.z * v.z) < 0.4) {
      mat.current.opacity = 0;
      return;
    }
    // Use the same ballistic solver as the physics so the marker always
    // matches the true landing spot (real GRAVITY, not a hardcoded value).
    const land = predictLanding(t);
    ref.current.position.set(land.x, 0.026, land.z);
    const mine = t.turn === "player" && t.hitWall;
    mat.current.color.set(mine ? "#7dff9a" : "#ff8a7a");
    mat.current.opacity = 0.42;
  });
  return (
    <mesh ref={ref} rotation-x={-Math.PI / 2}>
      <ringGeometry args={[0.22, 0.30, 24]} />
      <meshBasicMaterial ref={mat} transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

// ── Aim reticle — follows the mouse, shows where your shot will bounce ──
function AimReticle() {
  const ringRef = useRef<THREE.Mesh>(null);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);
  const dotRef  = useRef<THREE.Mesh>(null);
  const dotMat  = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(() => {
    const t = WS.current;
    if (!ringRef.current || !ringMat.current || !dotRef.current || !dotMat.current) return;
    const visible = t.phase === "live" || t.phase === "serve";
    ringRef.current.visible = visible;
    dotRef.current.visible  = visible;
    if (!visible) return;

    ringRef.current.position.set(t.aimPos.x, 0.02, t.aimPos.z);
    dotRef.current.position.set(t.aimPos.x, 0.022, t.aimPos.z);

    // Pulse green when it's my turn and ball is in range, otherwise dim white.
    const myTurn = t.turn === "player";
    const d = Math.hypot(t.ballPos.x - t.playerPos.x, t.ballPos.z - t.playerPos.z);
    const inRange = d < 2.2 && t.ballVel.lengthSq() > 0.01;
    const ready   = t.hitWall && t.bouncesAfterWall === 1;
    const hot     = myTurn && inRange && ready;

    const col = hot ? "#7dff9a" : myTurn ? "#ffd23e" : "#ffffff";
    const op  = hot ? 0.90 : myTurn ? 0.45 : 0.20;
    ringMat.current.color.set(col);
    ringMat.current.opacity = op;
    dotMat.current.color.set(col);
    dotMat.current.opacity = hot ? 0.95 : 0.50;

    // Pulse when it's hot
    const pulse = hot ? 1 + Math.sin(t.time * 8) * 0.07 : 1;
    ringRef.current.scale.setScalar(pulse);
  });

  return (
    <group>
      <mesh ref={ringRef} rotation-x={-Math.PI / 2} visible={false}>
        <ringGeometry args={[AIM_RING_R, AIM_RING_R + 0.055, 40]} />
        <meshBasicMaterial ref={ringMat} transparent opacity={0.5} depthWrite={false} />
      </mesh>
      <mesh ref={dotRef} rotation-x={-Math.PI / 2} visible={false}>
        <circleGeometry args={[0.095, 20]} />
        <meshBasicMaterial ref={dotMat} transparent opacity={0.7} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function WallCourt() {
  const courtTex = useMemo(() => makeCourtTex(), []);
  const wallTex  = useMemo(() => makeWallTex(), []);

  const W = COURT_HALF_W * 2;
  const midZ = (WALL_Z + COURT_DEPTH) / 2;

  return (
    <group>
      {/* The wall — a slab of the school building */}
      <mesh position={[0, WALL_HEIGHT / 2 + 0.9, WALL_Z - 0.3]} receiveShadow castShadow>
        <boxGeometry args={[W + 3.0, WALL_HEIGHT + 1.8, 0.6]} />
        <meshStandardMaterial map={wallTex} roughness={0.94} />
      </mesh>
      {/* Concrete kick plate at the base */}
      <mesh position={[0, 0.12, WALL_Z - 0.02]} receiveShadow>
        <boxGeometry args={[W + 3.0, 0.24, 0.28]} />
        <meshStandardMaterial color="#9aa0a6" roughness={0.9} />
      </mesh>
      {/* Roof lip */}
      <mesh position={[0, WALL_HEIGHT + 1.85, WALL_Z - 0.35]}>
        <boxGeometry args={[W + 3.4, 0.3, 1.0]} />
        <meshStandardMaterial color="#5e3a2e" roughness={0.9} />
      </mesh>

      {/* Shared blacktop court */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, midZ]} receiveShadow>
        <planeGeometry args={[W + 0.8, COURT_DEPTH + 0.4]} />
        <meshStandardMaterial map={courtTex} roughness={0.96} />
      </mesh>

      {/* ── Sidelines — cross these and the ball is OUT ── */}
      {[-COURT_HALF_W, COURT_HALF_W].map((x) => (
        <group key={x}>
          {/* bright painted stripe on the deck */}
          <mesh rotation-x={-Math.PI / 2} position={[x, 0.016, midZ]}>
            <planeGeometry args={[0.13, COURT_DEPTH + 0.4]} />
            <meshBasicMaterial color="#ffd23e" transparent opacity={0.92} depthWrite={false} />
          </mesh>
          {/* low warning kerb so the edge reads in 3-D */}
          <mesh position={[x, 0.045, midZ]}>
            <boxGeometry args={[0.05, 0.09, COURT_DEPTH + 0.4]} />
            <meshStandardMaterial
              color="#ffb31f"
              emissive="#ff8a00"
              emissiveIntensity={0.35}
              roughness={0.6}
            />
          </mesh>
        </group>
      ))}
      {/* back line */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.016, COURT_DEPTH]}>
        <planeGeometry args={[COURT_HALF_W * 2 + 0.13, 0.13]} />
        <meshBasicMaterial color="#ffd23e" transparent opacity={0.8} depthWrite={false} />
      </mesh>

      <ReachRing />
      <LandingMarker />
      <AimReticle />
    </group>
  );
}
