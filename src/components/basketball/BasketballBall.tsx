import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Trail } from "@react-three/drei";
import * as THREE from "three";
import { BALL_R } from "../../game/basketball";
import { BS } from "./basketballState";

/** Orange basketball texture (drawn once). */
function makeBallTex(): THREE.CanvasTexture {
  const S = 256;
  const c = document.createElement("canvas");
  c.width = S; c.height = S;
  const g = c.getContext("2d")!;
  const gr = g.createLinearGradient(0, 0, S, S);
  gr.addColorStop(0, "#f4a259");
  gr.addColorStop(0.5, "#e2711d");
  gr.addColorStop(1, "#a84a10");
  g.fillStyle = gr;
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 700; i++) {
    g.fillStyle = `rgba(${Math.random() > 0.5 ? 255 : 90},${60},${20},0.06)`;
    g.fillRect(Math.random() * S, Math.random() * S, 2, 2);
  }
  g.strokeStyle = "rgba(60,28,8,0.85)";
  g.lineWidth = 7;
  g.beginPath();
  g.moveTo(0, S / 2);
  g.bezierCurveTo(S * 0.3, S * 0.15, S * 0.7, S * 0.85, S, S / 2);
  g.stroke();
  g.beginPath();
  g.moveTo(S / 2, 0);
  g.bezierCurveTo(S * 0.2, S * 0.3, S * 0.8, S * 0.7, S / 2, S);
  g.stroke();
  g.beginPath();
  g.arc(S / 2, S / 2, S * 0.32, 0, Math.PI * 2);
  g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function BasketballBall() {
  const mesh = useRef<THREE.Mesh>(null);
  const blob = useRef<THREE.Mesh>(null);
  const blobMat = useRef<THREE.MeshBasicMaterial>(null);
  const tex = useMemo(() => makeBallTex(), []);

  useFrame((_, delta) => {
    const t = BS.current;
    if (!mesh.current || !blob.current) return;
    const visible = t.ballState !== "held" || t.phase !== "over";
    mesh.current.visible = visible && (t.phase === "flight" || t.phase === "aim" || t.phase === "resolve" || t.phase === "over" || t.phase === "pick");
    if (!mesh.current.visible) {
      // show the ball in the holder's hands
      const holder = t.turn === 0 ? t.playerPos : t.opPos;
      mesh.current.position.set(holder.x, 1.25, holder.z);
      blob.current.visible = false;
      return;
    }
    mesh.current.position.copy(t.ballPos);
    mesh.current.rotation.x += t.ballVel.z * delta * 2.8;
    mesh.current.rotation.z -= t.ballVel.x * delta * 2.8;
    blob.current.position.set(t.ballPos.x, 0.015, t.ballPos.z);
    blob.current.scale.setScalar(Math.max(0.26, 1.15 - t.ballPos.y * 0.24));
    if (blobMat.current) blobMat.current.opacity = Math.max(0.07, 0.4 - t.ballPos.y * 0.1);
  });

  return (
    <group>
      <Trail width={1.8} length={3.2} decay={1.3} color="#ffb25e" attenuation={(tt) => tt * tt}>
        <mesh ref={mesh} castShadow>
          <sphereGeometry args={[BALL_R, 26, 26]} />
          <meshStandardMaterial map={tex} roughness={0.55} />
        </mesh>
      </Trail>
      <mesh ref={blob} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.2, 24]} />
        <meshBasicMaterial ref={blobMat} color="#0e1116" transparent opacity={0.35} depthWrite={false} />
      </mesh>
    </group>
  );
}
