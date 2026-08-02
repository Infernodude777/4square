import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * A cheering recess crowd — instanced kids pressed against the chain-link
 * fences. Cheer "waves" ripple through the crowd every few seconds.
 */
export function Crowd({ count = 42 }: { count?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const kids = useMemo(() => {
    const cols = ["#e2483d", "#f7b32b", "#39b46a", "#4f8ef7", "#8a5cf6", "#ff8a3c", "#2f9e8f", "#d05a8c"];
    const skins = ["#f0c297", "#c7b299", "#8d6e5a", "#e8b98a"];
    return Array.from({ length: count }, (_, i) => {
      // scatter along the four fence lines, facing inwards
      const side = i % 4;
      const t = (i / 4) * 2.4 - 1.2;
      let x = 0, z = 0;
      if (side === 0) { x = t * 12.4; z = -12.6; }
      else if (side === 1) { x = t * 12.4; z = 12.6; }
      else if (side === 2) { x = -12.6; z = t * 12.4; }
      else { x = 12.6; z = t * 12.4; }
      return {
        x: x + (Math.random() - 0.5) * 0.8,
        z: z + (Math.random() - 0.5) * 0.8,
        scale: 0.85 + Math.random() * 0.35,
        color: cols[i % cols.length],
        skin: skins[i % skins.length],
        phase: Math.random() * Math.PI * 2,
        cheer: Math.random() < 0.4,
      };
    });
  }, [count]);

  useLayoutEffect(() => {
    if (!ref.current) return;
    kids.forEach((kid, i) => {
      ref.current!.setColorAt(i, new THREE.Color(kid.color));
    });
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, [kids]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    // A cheer wave travels along the fence every ~7 seconds.
    const wave = ((t % 7) / 7) * 12.4;
    kids.forEach((kid, i) => {
      const dist = Math.min(Math.abs(Math.abs(kid.x) - wave), Math.abs(Math.abs(kid.z) - wave));
      const cheerBoost = kid.cheer ? Math.max(0, 1 - dist / 3) * 0.18 : 0;
      const hop = Math.abs(Math.sin(t * 5 + kid.phase)) * 0.06 + cheerBoost;
      dummy.position.set(kid.x, hop, kid.z);
      dummy.rotation.set(0, Math.atan2(-kid.x, -kid.z) + Math.PI, 0);
      dummy.scale.setScalar(kid.scale);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} castShadow>
      {/* a simple rounded "kid" blob — head + body fused */}
      <sphereGeometry args={[0.22, 10, 10]} />
      <meshStandardMaterial color="#e2483d" roughness={0.85} />
    </instancedMesh>
  );
}
