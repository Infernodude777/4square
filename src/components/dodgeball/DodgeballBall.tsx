import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BALL_R } from "../../game/dodgeball";
import { DS } from "./dodgeballState";

/** Red rubber dodgeball texture. */
function makeBallTex(): THREE.CanvasTexture {
  const S = 256;
  const c = document.createElement("canvas");
  c.width = S; c.height = S;
  const g = c.getContext("2d")!;
  const gr = g.createLinearGradient(0, 0, S, S);
  gr.addColorStop(0, "#ef6a50");
  gr.addColorStop(0.5, "#d8342c");
  gr.addColorStop(1, "#a01f1c");
  g.fillStyle = gr;
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 700; i++) {
    g.fillStyle = `rgba(${Math.random() > 0.5 ? 255 : 60},${20},${20},0.06)`;
    g.fillRect(Math.random() * S, Math.random() * S, 2, 2);
  }
  g.strokeStyle = "rgba(255,248,238,0.55)";
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

export function DodgeballBall() {
  const mesh = useRef<THREE.Mesh>(null);
  const blob = useRef<THREE.Mesh>(null);
  const blobMat = useRef<THREE.MeshBasicMaterial>(null);
  const tex = useMemo(() => makeBallTex(), []);

  useFrame((_, delta) => {
    const t = DS.current;
    if (!mesh.current || !blob.current) return;
    const b = t.ball;
    const visible = b.state !== "held" || t.phase !== "over";
    mesh.current.visible = visible;
    mesh.current.position.copy(b.pos);
    mesh.current.rotation.x += b.vel.z * delta * 2.8;
    mesh.current.rotation.z -= b.vel.x * delta * 2.8;
    blob.current.position.set(b.pos.x, 0.015, b.pos.z);
    blob.current.scale.setScalar(Math.max(0.26, 1.15 - b.pos.y * 0.24));
    if (blobMat.current) blobMat.current.opacity = Math.max(0.07, 0.4 - b.pos.y * 0.1);
  });

  return (
    <group>
      <mesh ref={mesh} castShadow>
        <sphereGeometry args={[BALL_R, 24, 24]} />
        <meshStandardMaterial map={tex} roughness={0.5} />
      </mesh>
      <mesh ref={blob} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.19, 24]} />
        <meshBasicMaterial ref={blobMat} color="#0e1116" transparent opacity={0.35} depthWrite={false} />
      </mesh>
    </group>
  );
}
