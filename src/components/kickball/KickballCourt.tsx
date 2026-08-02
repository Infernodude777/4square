import { useMemo } from "react";
import * as THREE from "three";
import { BASE_POS, MOUND_Z } from "../../game/kickball";

/** Painted kickball diamond: chalk foul lines, bases, pitcher's mound. */
export function KickballCourt() {
  const lineMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#ecc44a",
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
      }),
    [],
  );

  const legs: [number, number][] = [
    [BASE_POS[0][0], BASE_POS[0][1]],
    [BASE_POS[1][0], BASE_POS[1][1]],
    [BASE_POS[1][0], BASE_POS[1][1]],
    [BASE_POS[2][0], BASE_POS[2][1]],
    [BASE_POS[2][0], BASE_POS[2][1]],
    [BASE_POS[3][0], BASE_POS[3][1]],
    [BASE_POS[3][0], BASE_POS[3][1]],
    [BASE_POS[0][0], BASE_POS[0][1]],
  ];

  return (
    <group>
      {/* diamond chalk lines */}
      {legs.map(([x1, z1], i) => {
        const [x2, z2] = legs[(i + 1) % 8];
        const mx = (x1 + x2) / 2;
        const mz = (z1 + z2) / 2;
        const len = Math.hypot(x2 - x1, z2 - z1);
        const ang = Math.atan2(x2 - x1, z2 - z1);
        return (
          <mesh key={i} rotation-x={-Math.PI / 2} position={[mx, 0.012, mz]} rotation-z={-ang}>
            <planeGeometry args={[len, 0.09]} />
            <primitive object={lineMat} attach="material" />
          </mesh>
        );
      })}
      {/* bases */}
      {BASE_POS.map(([x, z], i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[x, 0.02, z]} castShadow>
          <planeGeometry args={[0.55, 0.55]} />
          <meshStandardMaterial
            color={i === 0 ? "#d8dde4" : "#f2f4f8"}
            roughness={0.7}
          />
        </mesh>
      ))}
      {/* pitcher's mound */}
      <mesh position={[0, 0.1, MOUND_Z]} castShadow>
        <cylinderGeometry args={[0.9, 1.1, 0.2, 24]} />
        <meshStandardMaterial color="#9a6a45" roughness={0.9} />
      </mesh>
      {/* home plate line */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.012, BASE_POS[0][1] + 0.75]}>
        <planeGeometry args={[1.4, 0.09]} />
        <primitive object={lineMat} attach="material" />
      </mesh>
    </group>
  );
}
