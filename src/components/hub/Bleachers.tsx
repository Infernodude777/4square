/**
 * Spectator bleachers on the lawn just beyond the south fence, angled to
 * watch the kickball diamond through the fence — the "game day" crowd.
 * Two short stands of wooden benches with steel frames; purely visual.
 */
export function Bleachers() {
  const Stand = ({ pos, yaw }: { pos: [number, number, number]; yaw: number }) => (
    <group position={pos} rotation-y={yaw}>
      {/* stepped frame */}
      {[0, 1, 2].map((row) => (
        <group key={row} position={[0, row * 0.55, -row * 0.45]}>
          {/* bench plank */}
          <mesh castShadow>
            <boxGeometry args={[3.4, 0.09, 0.42]} />
            <meshStandardMaterial color="#8a5a33" roughness={0.85} />
          </mesh>
          {/* legs */}
          {[-1.5, 1.5].map((x, i) => (
            <mesh key={i} position={[x, -0.35, 0.05]} castShadow>
              <boxGeometry args={[0.07, 0.7, 0.4]} />
              <meshStandardMaterial color="#5b6470" metalness={0.55} roughness={0.4} />
            </mesh>
          ))}
        </group>
      ))}
      {/* back rail */}
      <mesh position={[0, 1.85, -0.95]} castShadow>
        <boxGeometry args={[3.4, 0.08, 0.07]} />
        <meshStandardMaterial color="#6f4a28" roughness={0.85} />
      </mesh>
      {[-1.5, 1.5].map((x, i) => (
        <mesh key={i} position={[x, 0.95, -0.95]} castShadow>
          <boxGeometry args={[0.07, 1.9, 0.07]} />
          <meshStandardMaterial color="#5b6470" metalness={0.55} roughness={0.4} />
        </mesh>
      ))}
      {/* base step */}
      <mesh position={[0, 0.06, 0.55]} castShadow>
        <boxGeometry args={[3.5, 0.12, 0.5]} />
        <meshStandardMaterial color="#7d858e" roughness={0.8} />
      </mesh>
      {/* a couple of stray pom-poms on the bench */}
      <mesh position={[1.0, 1.78, 0.1]} rotation-z={0.5}>
        <sphereGeometry args={[0.09, 8, 6]} />
        <meshStandardMaterial color="#ffd23e" roughness={0.6} />
      </mesh>
      <mesh position={[-0.8, 1.74, -0.2]} rotation-z={-0.4}>
        <sphereGeometry args={[0.07, 8, 6]} />
        <meshStandardMaterial color="#e2483d" roughness={0.6} />
      </mesh>
    </group>
  );

  return (
    <group>
      <Stand pos={[-3.4, 0, 16.4]} yaw={0.12} />
      <Stand pos={[2.6, 0, 16.5]} yaw={-0.12} />
    </group>
  );
}
