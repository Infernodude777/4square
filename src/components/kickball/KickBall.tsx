import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Trail } from "@react-three/drei";
import * as THREE from "three";
import { KICK } from "./kickState";

export function KickBall() {
  const mesh = useRef<THREE.Mesh>(null);
  const shadow = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    const t = KICK.current;
    if (!mesh.current || !shadow.current) return;
    mesh.current.visible = t.ballVisible;
    shadow.current.visible = t.ballVisible;
    mesh.current.position.copy(t.ballPos);
    mesh.current.rotation.x += t.ballVel.z * dt * 2.5;
    mesh.current.rotation.z -= t.ballVel.x * dt * 2.5;
    shadow.current.position.set(t.ballPos.x, 0.03, t.ballPos.z);
    shadow.current.scale.setScalar(Math.max(0.35, 1.2 - t.ballPos.y * 0.2));
  });
  return <group><Trail width={2.3} length={4.0} decay={1.4} color="#f44b32" attenuation={(v) => v * v}><mesh ref={mesh} castShadow><sphereGeometry args={[0.22, 24, 20]} /><meshStandardMaterial color="#e84a31" roughness={0.52} /></mesh></Trail><mesh ref={shadow} rotation-x={-Math.PI / 2}><circleGeometry args={[0.25, 24]} /><meshBasicMaterial color="#11151a" transparent opacity={0.32} depthWrite={false} /></mesh></group>;
}
