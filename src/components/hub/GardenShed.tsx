/**
 * The custodian's garden shed in the south-west corner of the yard — a
 * little slat-walled hut with a pitched roof, a hose coiled on a hook,
 * and a shovel leaning by the door. Visual only; it hugs the fence line.
 */
export function GardenShed() {
  return (
    <group position={[-14.9, 0, -2.6]} rotation-y={0.35}>
      {/* walls */}
      <mesh castShadow position={[0, 0.85, 0]}>
        <boxGeometry args={[1.7, 1.7, 1.3]} />
        <meshStandardMaterial color="#8a5a33" roughness={0.85} />
      </mesh>
      {/* wall slats */}
      {[0.45, 0.85, 1.25].map((y, i) => (
        <mesh key={i} position={[0, y - 0.85, 0.66]}>
          <boxGeometry args={[1.71, 0.09, 0.03]} />
          <meshStandardMaterial color="#6f4a28" roughness={0.85} />
        </mesh>
      ))}
      {/* pitched roof */}
      <mesh castShadow position={[0, 1.85, 0]} rotation-z={Math.PI / 2} rotation-y={0}>
        <coneGeometry args={[1.35, 0.95, 4]} />
        <meshStandardMaterial color="#5e3a2e" roughness={0.85} />
      </mesh>
      {/* door */}
      <mesh position={[0.4, 0.72, 0.66]}>
        <boxGeometry args={[0.62, 1.2, 0.04]} />
        <meshStandardMaterial color="#4a3028" roughness={0.85} />
      </mesh>
      {/* door frame + handle */}
      <mesh position={[0.4, 0.72, 0.67]}>
        <boxGeometry args={[0.66, 1.24, 0.02]} />
        <meshStandardMaterial color="#3a2b20" roughness={0.9} />
      </mesh>
      <mesh position={[0.62, 0.72, 0.69]}>
        <sphereGeometry args={[0.035, 8, 6]} />
        <meshStandardMaterial color="#f2b53c" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* coiled hose on a hook */}
      <group position={[-0.55, 1.05, 0.7]}>
        <mesh>
          <torusGeometry args={[0.14, 0.035, 8, 16]} />
          <meshStandardMaterial color="#39b46a" roughness={0.7} />
        </mesh>
        <mesh position={[0.15, -0.12, 0]}>
          <torusGeometry args={[0.1, 0.035, 8, 16]} />
          <meshStandardMaterial color="#39b46a" roughness={0.7} />
        </mesh>
      </group>
      {/* shovel leaning by the door */}
      <group position={[-0.15, 0.4, 0.72]} rotation-z={0.35}>
        <mesh>
          <cylinderGeometry args={[0.02, 0.02, 1.0, 6]} />
          <meshStandardMaterial color="#7a512f" roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.5, 0]}>
          <boxGeometry args={[0.16, 0.14, 0.02]} />
          <meshStandardMaterial color="#9aa0a6" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>
      {/* watering can by the wall */}
      <group position={[-0.7, 0.12, 0.5]} rotation-y={0.6}>
        <mesh>
          <cylinderGeometry args={[0.12, 0.09, 0.24, 10]} />
          <meshStandardMaterial color="#2f6fdb" metalness={0.3} roughness={0.5} />
        </mesh>
        <mesh position={[0.1, 0.16, 0]} rotation-z={-0.4}>
          <cylinderGeometry args={[0.02, 0.02, 0.18, 6]} />
          <meshStandardMaterial color="#2f6fdb" roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}
