import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Trail } from "@react-three/drei";
import * as THREE from "three";
import { BALL_R } from "../../game/wallball";
import { WS } from "./wallballState";

function makeBallTex(): THREE.CanvasTexture {
  const S = 256;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d")!;
  const gr = g.createLinearGradient(0, 0, S, S);
  gr.addColorStop(0, "#ef5a48");
  gr.addColorStop(0.5, "#d8342c");
  gr.addColorStop(1, "#a01f1c");
  g.fillStyle = gr;
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 900; i++) {
    g.fillStyle = `rgba(${Math.random() > 0.5 ? 255 : 60},${20},${20},0.06)`;
    g.fillRect(Math.random() * S, Math.random() * S, 2, 2);
  }
  g.strokeStyle = "rgba(255,248,238,0.9)";
  g.lineWidth = 7;
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
  return t;
}

export function WallBall() {
  const ball = useRef<THREE.Mesh>(null);
  const shad = useRef<THREE.Mesh>(null);
  const shadMat = useRef<THREE.MeshBasicMaterial>(null);
  const tex = useMemo(() => makeBallTex(), []);

  useFrame(() => {
    const t = WS.current;
    if (ball.current) {
      ball.current.position.copy(t.ballPos);
      ball.current.rotation.x += t.ballVel.z * 0.03;
      ball.current.rotation.z -= t.ballVel.x * 0.03;
    }
    if (shad.current && shadMat.current) {
      shad.current.position.set(t.ballPos.x, 0.012, t.ballPos.z);
      const h = Math.max(0, t.ballPos.y);
      shad.current.scale.setScalar(Math.max(0.3, 1.1 - h * 0.18));
      shadMat.current.opacity = Math.max(0.06, 0.4 - h * 0.07);
    }
  });

  return (
    <group>
      <Trail width={2.0} length={4.0} decay={1.1} color="#ffd23e" attenuation={(t) => t * t}>
        <mesh ref={ball} castShadow>
          <sphereGeometry args={[BALL_R, 28, 28]} />
          <meshStandardMaterial map={tex} roughness={0.5} emissive="#401010" emissiveIntensity={0.15} />
        </mesh>
      </Trail>
      <mesh ref={shad} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.20, 24]} />
        <meshBasicMaterial ref={shadMat} color="#0e1116" transparent opacity={0.35} depthWrite={false} />
      </mesh>
    </group>
  );
}
