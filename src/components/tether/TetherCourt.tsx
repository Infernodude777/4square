import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { R_COURT } from "../../game/tetherball";
import { TS } from "./tetherState";

// A round painted asphalt court with a diameter of 20 ft (=6 m).
// Two playing zones split by a centerline through the pole. Neutral
// zones are the wedges that would be "1 o'clock–7" and "11–5".
function makeCourtTexture(): THREE.CanvasTexture {
  const S = 1024;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d")!;
  // asphalt
  g.fillStyle = "#7a7f87";
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 5400; i++) {
    const v = 100 + Math.random() * 55;
    g.fillStyle = `rgba(${v},${v + 3},${v + 8},${0.15 + Math.random() * 0.14})`;
    g.fillRect(Math.random() * S, Math.random() * S, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
  // oil blotches & cracks
  for (let i = 0; i < 10; i++) {
    const x = Math.random() * S, y = Math.random() * S, r = 40 + Math.random() * 90;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(50,52,58,${0.1 + Math.random() * 0.14})`);
    gr.addColorStop(1, "rgba(50,52,58,0)");
    g.fillStyle = gr;
    g.beginPath();
    g.arc(x, y, r, 0, 7);
    g.fill();
  }
  g.strokeStyle = "rgba(38,40,45,0.5)";
  for (let i = 0; i < 8; i++) {
    g.lineWidth = 1 + Math.random() * 1.6;
    g.beginPath();
    let x = Math.random() * S, y = Math.random() * S;
    g.moveTo(x, y);
    for (let j = 0; j < 5; j++) {
      x += (Math.random() - 0.5) * 180;
      y += (Math.random() - 0.5) * 180;
      g.lineTo(x, y);
    }
    g.stroke();
  }

  // painted circle
  g.strokeStyle = "rgba(232,192,72,0.9)";
  g.lineWidth = 12;
  g.beginPath();
  g.arc(S / 2, S / 2, S * 0.46, 0, 7);
  g.stroke();

  // centerline (dividing player half from op half) — horizontal
  g.strokeStyle = "rgba(240,80,72,0.9)";
  g.lineWidth = 10;
  g.beginPath();
  g.moveTo(S * 0.06, S / 2);
  g.lineTo(S * 0.94, S / 2);
  g.stroke();

  // neutral zone lines (11 o'clock ↔ 5 o'clock, 1 o'clock ↔ 7 o'clock)
  g.strokeStyle = "rgba(240,240,232,0.55)";
  g.lineWidth = 5;
  const drawSpoke = (aDeg: number) => {
    const a = (aDeg / 180) * Math.PI;
    g.beginPath();
    g.moveTo(S / 2 + Math.cos(a) * S * 0.08, S / 2 + Math.sin(a) * S * 0.08);
    g.lineTo(S / 2 + Math.cos(a) * S * 0.46, S / 2 + Math.sin(a) * S * 0.46);
    g.stroke();
  };
  drawSpoke(-60); // 1 o'clock
  drawSpoke(-120); // 11 o'clock
  drawSpoke(60); // 5 o'clock
  drawSpoke(120); // 7 o'clock

  // labels
  g.fillStyle = "rgba(255,248,232,0.6)";
  g.font = '900 82px "Arial Black", system-ui, sans-serif';
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("YOUR SIDE", S / 2, S * 0.78);
  g.save();
  g.translate(S / 2, S * 0.22);
  g.rotate(Math.PI);
  g.fillText("BOT SIDE", 0, 0);
  g.restore();

  // chalk doodles
  g.strokeStyle = "rgba(250,250,252,0.4)";
  g.lineWidth = 3;
  g.font = '700 30px "Comic Sans MS", cursive';
  g.fillStyle = "rgba(255,255,255,0.36)";
  g.fillText("no touchy the pole ✗", S * 0.28, S * 0.62);
  g.fillStyle = "rgba(120,220,255,0.32)";
  g.fillText("↺ WIND IT UP ↻", S * 0.72, S * 0.4);

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function TetherCourt() {
  const tex = useMemo(() => makeCourtTexture(), []);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[R_COURT + 0.4, 64]} />
        <meshStandardMaterial map={tex} roughness={0.96} />
      </mesh>
      {/* Player hit-reach ring — bright when ball is in range */}
      <HitReachRing />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
//  A pulsing ring under the player showing their hit range.
//  Turns vibrant green when the ball is within striking distance.
// ─────────────────────────────────────────────────────────────
function HitReachRing() {
  const ref  = useRef<THREE.Mesh>(null);
  const mat  = useRef<THREE.MeshBasicMaterial>(null);
  const ref2 = useRef<THREE.Mesh>(null);
  const mat2 = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(() => {
    const t = TS.current;
    if (!ref.current || !mat.current || !ref2.current || !mat2.current) return;
    const distToBall = Math.hypot(
      t.ballPos.x - t.playerPos.x,
      t.ballPos.z - t.playerPos.z,
    );
    const inRange = distToBall < 1.55 && t.serveStage === "live";
    const armed   = !(t.lastHitter === "player" && !t.ballCleared);
    const col     = armed && inRange ? "#7dff9a" : armed ? "#4d8adf" : "#5a5f7a";
    mat.current.color.set(col);
    const pulse = inRange ? 1 + Math.sin(t.time * 7) * 0.055 : 1;
    ref.current.position.set(t.playerPos.x, 0.025, t.playerPos.z);
    ref.current.scale.setScalar(pulse);
    mat.current.opacity = inRange ? 0.75 : 0.28;
    // Inner dot: ball is in the *hand* range
    const inHand = distToBall < 1.15 ? 0.72 : 0.10;
    mat2.current.color.set(inHand > 0.4 ? "#7dff9a" : "#ffffff");
    mat2.current.opacity = inHand;
    ref2.current.position.set(t.playerPos.x, 0.028, t.playerPos.z);
  });
  return (
    <group>
      <mesh ref={ref} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[1.45, 1.58, 48]} />
        <meshBasicMaterial ref={mat} transparent opacity={0.28} depthWrite={false} />
      </mesh>
      <mesh ref={ref2} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.12, 12]} />
        <meshBasicMaterial ref={mat2} transparent opacity={0.1} depthWrite={false} />
      </mesh>
    </group>
  );
}
