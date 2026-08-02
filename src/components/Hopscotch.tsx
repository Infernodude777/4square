import { Text } from "@react-three/drei";

/** A chalk hopscotch grid painted on the blacktop near the swing set. */
export function Hopscotch() {
  const chalk = "#e8c96a";
  const cell = 0.72;
  const half = 0.36;

  // Cells: 1, then 2-3 (side by side), 4, 5-6, 7, 8-9, home
  const rows: { n: number[]; x: number; z: number }[] = [
    { n: [1], x: 0, z: 0 },
    { n: [2, 3], x: -half - 0.1, z: -1.15 }, // two cells side by side
    { n: [4], x: 0, z: -2.3 },
    { n: [5, 6], x: -half - 0.1, z: -3.45 },
    { n: [7], x: 0, z: -4.6 },
    { n: [8, 9], x: -half - 0.1, z: -5.75 },
    { n: [10], x: 0, z: -6.9 },
  ];

  return (
    <group position={[-6.0, 0.015, 9.4]}>
      {rows.map((r, i) =>
        r.n.map((num, j) => (
          <group key={`${i}-${j}`} position={[r.x + (r.n.length > 1 ? j * (cell + 0.12) : 0), 0, r.z]}>
            <mesh rotation-x={-Math.PI / 2}>
              <planeGeometry args={[cell, cell]} />
              <meshStandardMaterial color="#2c313a" roughness={0.95} />
            </mesh>
            <mesh rotation-x={-Math.PI / 2}>
              <planeGeometry args={[cell - 0.06, cell - 0.06]} />
              <meshBasicMaterial color={chalk} transparent opacity={0.8} depthWrite={false} />
            </mesh>
            <Text
              position={[0, 0.004, 0]}
              rotation-x={-Math.PI / 2}
              fontSize={0.34}
              color="#3a2e12"
              anchorX="center"
              anchorY="middle"
            >
              {num}
            </Text>
          </group>
        )),
      )}
    </group>
  );
}
