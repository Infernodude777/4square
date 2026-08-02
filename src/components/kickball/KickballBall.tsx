import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { K_BALL_R } from "../../game/kickball";
import { KS } from "./kickballState";

/** The live kickball — follows KS.current.ball.pos, spins as it rolls. */
export function KickballBall() {
  const mesh = useRef<THREE.Mesh>(null);
  const blob = useRef<THREE.Mesh>(null);
  const blobMat = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((_, delta) => {
    const b = KS.current.ball;
    if (!mesh.current || !blob.current) return;
    mesh.current.visible = b.state !== "held" || b.pos.z < 6;
    mesh.current.position.copy(b.pos);
    // spin around the axis perpendicular to horizontal velocity
    const sp = Math.hypot(b.vel.x, b.vel.z);
    if (sp > 0.05) {
      mesh.current.rotation.x += (b.vel.z / sp) * sp * delta * 4;
      mesh.current.rotation.z -= (b.vel.x / sp) * sp * delta * 4;
    }
    blob.current.position.set(b.pos.x, 0.015, b.pos.z);
    blob.current.scale.setScalar(Math.max(0.3, 1.2 - b.pos.y * 0.3));
    if (blobMat.current) blobMat.current.opacity = Math.max(0.08, 0.45 - b.pos.y * 0.12);
  });

  return (
    <group>
      <mesh ref={mesh} castShadow>
        <sphereGeometry args={[K_BALL_R, 20, 20]} />
        <meshStandardMaterial color="#e2483d" roughness={0.5} />
      </mesh>
      <mesh ref={blob} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.24, 20]} />
        <meshBasicMaterial ref={blobMat} color="#0e1116" transparent opacity={0.35} depthWrite={false} />
      </mesh>
    </group>
  );
}
