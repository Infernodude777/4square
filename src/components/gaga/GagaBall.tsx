import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BALL_R } from "../../game/gaga";
import { GS } from "./gagaState";

/** Bright yellow gaga ball texture. */
function makeBallTex(): THREE.CanvasTexture {
  const S = 256;
  const c = document.createElement("canvas");
  c.width = S; c.height = S;
  const g = c.getContext("2d")!;
  const gr = g.createLinearGradient(0, 0, S, S);
  gr.addColorStop(0, "#ffe066");
  gr.addColorStop(0.5, "#f2c21e");
  gr.addColorStop(1, "#c89008");
  g.fillStyle = gr;
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 700; i++) {
    g.fillStyle = `rgba(${Math.random() > 0.5 ? 255 : 150},${140},${40},0.07)`;
    g.fillRect(Math.random() * S, Math.random() * S, 2, 2);
  }
  g.strokeStyle = "rgba(120,80,10,0.6)";
  g.lineWidth = 6;
  g.beginPath();
  g.moveTo(0, S / 2);
  g.bezierCurveTo(S * 0.3, S * 0.2, S * 0.7, S * 0.8, S, S / 2);
  g.stroke();
  g.beginPath();
  g.moveTo(S / 2, 0);
  g.bezierCurveTo(S * 0.2, S * 0.3, S * 0.8, S * 0.7, S / 2, S);
  g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function GagaBall() {
  const mesh = useRef<THREE.Mesh>(null);
  const blob = useRef<THREE.Mesh>(null);
  const blobMat = useRef<THREE.MeshBasicMaterial>(null);
  const tex = useMemo(() => makeBallTex(), []);

  useFrame((_, delta) => {
    const t = GS.current;
    if (!mesh.current || !blob.current) return;
    mesh.current.position.copy(t.ball.pos);
    mesh.current.rotation.x += t.ball.vel.z * delta * 3;
    mesh.current.rotation.z -= t.ball.vel.x * delta * 3;
    blob.current.position.set(t.ball.pos.x, 0.015, t.ball.pos.z);
    blob.current.scale.setScalar(Math.max(0.24, 1.12 - t.ball.pos.y * 0.24));
    if (blobMat.current) blobMat.current.opacity = Math.max(0.07, 0.38 - t.ball.pos.y * 0.1);
  });

  return (
    <group>
      <mesh ref={mesh} castShadow>
        <sphereGeometry args={[BALL_R, 24, 24]} />
        <meshStandardMaterial map={tex} roughness={0.45} />
      </mesh>
      <mesh ref={blob} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.18, 24]} />
        <meshBasicMaterial ref={blobMat} color="#0e1116" transparent opacity={0.35} depthWrite={false} />
      </mesh>
    </group>
  );
}
