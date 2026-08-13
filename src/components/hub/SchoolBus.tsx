/**
 * The yellow school bus parked on the far lawn beside the building — the
 * classic "school's still in session" landmark. Box body, black stripe,
 * round lights, and an open door. Purely visual, off the asphalt.
 */
export function SchoolBus() {
  return (
    <group position={[-24.5, 0, -12.5]} rotation-y={0.55}>
      {/* body */}
      <mesh castShadow position={[0, 1.35, 0]}>
        <boxGeometry args={[6.8, 2.1, 2.4]} />
        <meshStandardMaterial color="#f7b32b" roughness={0.6} />
      </mesh>
      {/* roof cap */}
      <mesh position={[0, 2.5, 0]}>
        <boxGeometry args={[6.9, 0.3, 2.2]} />
        <meshStandardMaterial color="#e8a41f" roughness={0.55} />
      </mesh>
      {/* black bumper stripe */}
      <mesh position={[0, 0.95, 0]}>
        <boxGeometry args={[6.85, 0.22, 2.42]} />
        <meshStandardMaterial color="#20242c" roughness={0.7} />
      </mesh>
      {/* front + rear faces */}
      <mesh position={[3.41, 1.35, 0]}>
        <boxGeometry args={[0.02, 2.1, 2.4]} />
        <meshStandardMaterial color="#e8a41f" roughness={0.55} />
      </mesh>
      {/* windshield */}
      <mesh position={[3.42, 1.95, 0]}>
        <boxGeometry args={[0.02, 0.9, 1.9]} />
        <meshStandardMaterial color="#8fb8d8" roughness={0.1} metalness={0.6} />
      </mesh>
      {/* windows down the side */}
      {[0.9, 1.9, 2.9].map((x, i) => (
        <mesh key={i} position={[x - 1.6, 2.0, 0]}>
          <boxGeometry args={[0.72, 0.62, 2.41]} />
          <meshStandardMaterial color="#8fb8d8" roughness={0.1} metalness={0.6} />
        </mesh>
      ))}
      {/* round headlights */}
      {[[3.43, 1.0, -0.8], [3.43, 1.0, 0.8]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[0.11, 10, 8]} />
          <meshStandardMaterial color="#fff6d8" emissive="#ffe98a" emissiveIntensity={0.4} />
        </mesh>
      ))}
      {/* door on the right side */}
      <group position={[0.35, 1.0, 1.21]}>
        <mesh>
          <boxGeometry args={[0.9, 1.3, 0.03]} />
          <meshStandardMaterial color="#20242c" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.3, 0.02]}>
          <planeGeometry args={[0.6, 0.7]} />
          <meshStandardMaterial color="#8fb8d8" roughness={0.15} metalness={0.5} />
        </mesh>
      </group>
      {/* wheels */}
      {[[-1.9, 0.35, 0], [1.9, 0.35, 0]].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.45, 0.45, 0.25, 16]} />
            <meshStandardMaterial color="#20242c" roughness={0.85} />
          </mesh>
          <mesh rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.24, 0.24, 0.26, 12]} />
            <meshStandardMaterial color="#c8ccd2" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
      ))}
      {/* mirror arm */}
      <mesh position={[3.3, 1.85, 1.15]} rotation-z={-0.3}>
        <cylinderGeometry args={[0.02, 0.02, 0.5, 6]} />
        <meshStandardMaterial color="#3a3f46" metalness={0.7} roughness={0.35} />
      </mesh>
    </group>
  );
}
