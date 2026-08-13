/**
 * Two little birdhouses on posts in the meadow — one blue, one red —
 * each with a perch and a tiny roof. They sit on the grass ring well
 * beyond the fence, far from every court.
 */
export function Birdhouses() {
  const House = ({ pos, color, yaw }: { pos: [number, number, number]; color: string; yaw: number }) => (
    <group position={pos} rotation-y={yaw}>
      {/* post */}
      <mesh castShadow position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 1.8, 8]} />
        <meshStandardMaterial color="#7a512f" roughness={0.85} />
      </mesh>
      {/* body */}
      <mesh castShadow position={[0, 1.85, 0]}>
        <boxGeometry args={[0.42, 0.42, 0.42]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      {/* pitched roof */}
      <mesh castShadow position={[0, 2.14, 0]} rotation-x={Math.PI / 2}>
        <coneGeometry args={[0.4, 0.32, 4]} />
        <meshStandardMaterial color="#5e3a2e" roughness={0.85} />
      </mesh>
      {/* entrance hole */}
      <mesh position={[0, 1.86, 0.22]}>
        <circleGeometry args={[0.07, 10]} />
        <meshStandardMaterial color="#20242c" roughness={0.8} />
      </mesh>
      {/* perch */}
      <mesh position={[0, 1.68, 0.24]}>
        <cylinderGeometry args={[0.012, 0.012, 0.16, 5]} />
        <meshStandardMaterial color="#a5845c" roughness={0.9} />
      </mesh>
      {/* mounting plate */}
      <mesh position={[0, 1.62, 0]}>
        <boxGeometry args={[0.1, 0.04, 0.1]} />
        <meshStandardMaterial color="#7d858e" metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  );

  return (
    <group>
      <House pos={[-27.5, 0, -4.5]} color="#3f6fb5" yaw={0.4} />
      <House pos={[-26.8, 0, 5.5]} color="#c23227" yaw={-0.6} />
    </group>
  );
}
