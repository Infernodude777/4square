import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  COURT_HALF_W, BASELINE_Z, FOUL_LINE_Z, RIM_H, RIM_Z,
  BACKBOARD_Z, SPOTS, type BState,
} from "../../game/basketball";
import { BS } from "./basketballState";

/** Procedural half-court blacktop with painted lines + key + spots. */
function makeCourtTex(): THREE.CanvasTexture {
  const W = 1024, H = 1024;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d")!;
  const P = (m: number) => ((m + 9) / 18) * W; // meters → px (court is 18m tall)

  g.fillStyle = "#7b8087";
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 5400; i++) {
    const v = 100 + Math.random() * 52;
    g.fillStyle = `rgba(${v},${v + 2},${v + 7},${0.14 + Math.random() * 0.13})`;
    g.fillRect(Math.random() * W, Math.random() * H, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
  for (let i = 0; i < 10; i++) {
    const x = Math.random() * W, y = Math.random() * H, r = 40 + Math.random() * 100;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(50,52,58,${0.09 + Math.random() * 0.12})`);
    gr.addColorStop(1, "rgba(50,52,58,0)");
    g.fillStyle = gr;
    g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  }
  g.strokeStyle = "rgba(38,40,45,0.45)";
  for (let i = 0; i < 8; i++) {
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

  // court outline
  g.strokeStyle = "rgba(236,196,74,0.85)";
  g.lineWidth = 9;
  g.strokeRect(P(-COURT_HALF_W), P(BASELINE_Z), P(2 * COURT_HALF_W) - P(0), P(-BASELINE_Z + 2.2) - P(BASELINE_Z));

  // free-throw line + key
  g.lineWidth = 6;
  g.beginPath();
  g.moveTo(P(-2.8), P(FOUL_LINE_Z));
  g.lineTo(P(2.8), P(FOUL_LINE_Z));
  g.stroke();
  g.beginPath();
  g.moveTo(P(-2.8), P(FOUL_LINE_Z));
  g.lineTo(P(-2.8), P(-0.8));
  g.moveTo(P(2.8), P(FOUL_LINE_Z));
  g.lineTo(P(2.8), P(-0.8));
  g.stroke();

  // free-throw circle
  g.beginPath();
  g.arc(P(0), P(FOUL_LINE_Z), P(1.8) - P(0), 0, Math.PI * 2);
  g.stroke();

  // three-point arc (far side only)
  g.beginPath();
  g.arc(P(0), P(-0.8), P(6.4) - P(0), -Math.PI / 2.35, Math.PI / 2.35);
  g.stroke();

  // the six shooting spots
  SPOTS.forEach((s) => {
    g.fillStyle = "rgba(236,196,74,0.55)";
    g.beginPath();
    g.arc(P(s.x), P(s.z), 10, 0, Math.PI * 2);
    g.fill();
  });

  // chalk doodles
  g.fillStyle = "rgba(245,240,225,0.3)";
  g.font = '700 26px "Comic Sans MS", cursive';
  g.textAlign = "center";
  g.fillText("H·O·R·S·E", P(0), P(-6.4));
  g.fillStyle = "rgba(140,220,255,0.24)";
  g.font = '700 22px "Comic Sans MS", cursive';
  g.fillText("walk to a spot · click · click", P(0), P(0.9));

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** The hoop — pole, backboard, rim and net. */
function Hoop() {
  return (
    <group>
      {/* pole */}
      <mesh castShadow position={[0, 2.0, -1.3]}>
        <cylinderGeometry args={[0.07, 0.09, 4.0, 12]} />
        <meshStandardMaterial color="#8d959e" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* base plate */}
      <mesh position={[0, 0.05, -1.3]} receiveShadow>
        <boxGeometry args={[0.7, 0.12, 0.7]} />
        <meshStandardMaterial color="#6a7078" roughness={0.7} />
      </mesh>
      {/* arm from pole to backboard */}
      <mesh castShadow position={[0, 3.15, -0.85]} rotation-x={0.22}>
        <boxGeometry args={[0.08, 0.08, 0.95]} />
        <meshStandardMaterial color="#8d959e" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* backboard */}
      <mesh castShadow position={[0, 3.0, BACKBOARD_Z]}>
        <boxGeometry args={[1.15, 0.72, 0.05]} />
        <meshStandardMaterial color="#e9edf2" roughness={0.35} metalness={0.1} />
      </mesh>
      {/* shooter's square on the board */}
      <mesh position={[0, 2.92, BACKBOARD_Z - 0.03]}>
        <boxGeometry args={[0.42, 0.36, 0.015]} />
        <meshStandardMaterial color="#c23227" roughness={0.5} />
      </mesh>
      {/* rim */}
      <mesh castShadow position={[0, RIM_H, RIM_Z]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.24, 0.022, 10, 28]} />
        <meshStandardMaterial color="#e2483d" roughness={0.35} metalness={0.6} />
      </mesh>
      {/* net — a simple open cylinder with thin bands */}
      <group position={[0, RIM_H - 0.06, RIM_Z]}>
        <mesh>
          <cylinderGeometry args={[0.22, 0.14, 0.42, 12, 1, true]} />
          <meshBasicMaterial color="#c8cdd4" transparent opacity={0.28} side={THREE.DoubleSide} wireframe />
        </mesh>
      </group>
    </group>
  );
}

/** Spot ring markers — the active spot pulses gold. */
function SpotMarkers() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const mats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  useFrame(() => {
    const t = BS.current as BState;
    const active = t.phase === "pick" || t.phase === "aim" ? t.spotIdx : -1;
    const forced = t.forcedSpot;
    SPOTS.forEach((_, i) => {
      const m = refs.current[i];
      const mat = mats.current[i];
      if (!m || !mat) return;
      const isActive = i === active;
      const isForced = i === forced;
      const isNear = t.turn === 0 && t.phase === "pick" &&
        Math.hypot(t.playerPos.x - SPOTS[i].x, t.playerPos.z - SPOTS[i].z) < 1.5;
      mat.color.set(isForced ? "#ff6b5e" : isActive || isNear ? "#ffd23e" : "#8a93a0");
      mat.opacity = isActive ? 0.95 : isNear ? 0.75 : 0.25;
      m.scale.setScalar(isActive || isNear ? 1 + Math.sin(t.time * 6) * 0.08 : 1);
    });
  });
  return (
    <>
      {SPOTS.map((s, i) => (
        <mesh
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          rotation-x={-Math.PI / 2}
          position={[s.x, 0.02, s.z]}
        >
          <ringGeometry args={[0.34, 0.42, 28]} />
          <meshBasicMaterial ref={(el) => { mats.current[i] = el; }} transparent opacity={0.25} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

/** Soft highlight ring under whoever's ball it is. */
function TurnRing() {
  const ref = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(() => {
    const t = BS.current as BState;
    if (!ref.current || !mat.current) return;
    const pos = t.turn === 0 ? t.playerPos : t.opPos;
    ref.current.position.set(pos.x, 0.02, pos.z);
    const mine = t.turn === 0;
    mat.current.color.set(mine ? "#7dff9a" : "#ff8a7a");
    mat.current.opacity = t.phase === "over" ? 0 : 0.28;
  });
  return (
    <mesh ref={ref} rotation-x={-Math.PI / 2}>
      <ringGeometry args={[0.55, 0.66, 40]} />
      <meshBasicMaterial ref={mat} transparent opacity={0.25} depthWrite={false} />
    </mesh>
  );
}

export function BasketballCourt() {
  const tex = useMemo(() => makeCourtTex(), []);
  const W = COURT_HALF_W * 2;

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, (BASELINE_Z + 2.2) / 2]} receiveShadow>
        <planeGeometry args={[W + 2.6, 11.6]} />
        <meshStandardMaterial map={tex} roughness={0.96} />
      </mesh>

      <Hoop />
      <SpotMarkers />
      <TurnRing />
    </group>
  );
}
