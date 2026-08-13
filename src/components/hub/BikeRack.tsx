/**
 * A bike rack by the school entrance with two parked bikes — a purple
 * BMX and a teal cruiser, both leaning on the rack. The rack is a simple
 * wave of hoops; the bikes are boxes and cylinders. Purely decorative,
 * tucked against the fence line clear of every court.
 */
const BIKE_COLORS = ["#8a5cf6", "#2fb8b0"];

export function BikeRack() {
  return (
    <group position={[15.1, 0, -12.6]} rotation-y={-0.5}>
      {/* rack — a row of steel hoops on a base rail */}
      <mesh castShadow position={[0, 0.42, 0]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.03, 0.03, 2.4, 6]} />
        <meshStandardMaterial color="#a8b0b8" metalness={0.6} roughness={0.4} />
      </mesh>
      {[-0.6, 0, 0.6].map((x, i) => (
        <mesh key={i} castShadow position={[x, 0.45, 0]}>
          <torusGeometry args={[0.28, 0.022, 8, 20, Math.PI]} />
          <meshStandardMaterial color="#c8ccd2" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* two bikes leaning against the rack */}
      {BIKE_COLORS.map((col, i) => (
        <group key={i} position={[i * 0.9 - 0.45, 0, 0.5]} rotation-z={-0.12} rotation-y={i % 2 ? -0.15 : 0.1}>
          {/* frame */}
          <mesh castShadow position={[0, 0.5, 0]} rotation-z={0.15}>
            <boxGeometry args={[0.06, 0.8, 0.05]} />
            <meshStandardMaterial color={col} roughness={0.5} />
          </mesh>
          <mesh castShadow position={[0.18, 0.32, 0]} rotation-z={-0.5}>
            <boxGeometry args={[0.34, 0.05, 0.05]} />
            <meshStandardMaterial color={col} roughness={0.5} />
          </mesh>
          {/* wheels */}
          {[[-0.32, 0.18, 0], [0.32, 0.18, 0]].map(([wx, wy, wz], wi) => (
            <mesh key={wi} position={[wx, wy, wz]} rotation-x={Math.PI / 2}>
              <torusGeometry args={[0.22, 0.025, 8, 20]} />
              <meshStandardMaterial color="#2a2e33" roughness={0.85} />
            </mesh>
          ))}
          {/* seat + handlebar */}
          <mesh position={[0, 0.88, 0]} rotation-z={0.15}>
            <boxGeometry args={[0.08, 0.1, 0.06]} />
            <meshStandardMaterial color="#20242c" roughness={0.8} />
          </mesh>
          <mesh position={[0.34, 0.7, 0]}>
            <boxGeometry args={[0.06, 0.16, 0.06]} />
            <meshStandardMaterial color="#20242c" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
