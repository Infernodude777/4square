import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Trail } from "@react-three/drei";
import * as THREE from "three";
import { BALL_R } from "../game/constants";
import { RT } from "../game/refs";
import { makeBallTexture } from "../game/textures";

export function Ball() {
  const mesh = useRef<THREE.Mesh>(null);
  const blob = useRef<THREE.Mesh>(null);
  const blobMat = useRef<THREE.MeshBasicMaterial>(null);
  const tex = useMemo(() => makeBallTexture(), []);

    useFrame((_, delta) => {
    const b = RT.ball;
    if (!mesh.current || !blob.current) return;
    mesh.current.visible = b.visible;
    blob.current.visible = b.visible && b.pos.y > -1;
    mesh.current.position.copy(b.pos);
        mesh.current.rotation.x += b.vel.z * delta * 2.6;
    mesh.current.rotation.z -= b.vel.x * delta * 2.6;
    blob.current.position.set(b.pos.x, 0.015, b.pos.z);
    blob.current.scale.setScalar(Math.max(0.28, 1.15 - b.pos.y * 0.24));
    if (blobMat.current) blobMat.current.opacity = Math.max(0.07, 0.4 - b.pos.y * 0.1);
    });

      return (
    <group>
      <Trail width={2.0} length={4.5} decay={1.2} color="#ffd23e" attenuation={(t) => t * t}>
        <mesh ref={mesh} castShadow>
          <sphereGeometry args={[BALL_R, 28, 28]} />
          <meshStandardMaterial map={tex} roughness={0.5} />
                        </Trail>
      {/* contact shadow — critical depth cue for timing */}
      <mesh ref={blob} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.22, 24]} />
        <meshBasicMaterial ref={blobMat} color="#0e1116" transparent opacity={0.35} depthWrite={false} />
          </group>
  );
  }
  
      </Trail>
    </group>
      )
    })
}