/**
 * A row of three curbside bins — trash, recycling, compost — lined up on
 * the lawn by the gate. Bright lids and hand-painted labels; purely visual.
 */
const BINS: { color: string; label: string; lid: string }[] = [
  { color: "#3a3f46", label: "trash", lid: "#5b6470" },
  { color: "#2f6fdb", label: "recycle", lid: "#4f83c9" },
  { color: "#39b46a", label: "compost", lid: "#4f9c5e" },
];

export function RecycleBins() {
  return (
    <group position={[-3.6, 0, 13.1]} rotation-y={0.2}>
      {BINS.map((b, i) => (
        <group key={i} position={[i * 0.7 - 0.7, 0, 0]}>
          {/* body */}
          <mesh castShadow position={[0, 0.42, 0]}>
            <cylinderGeometry args={[0.24, 0.2, 0.84, 12]} />
            <meshStandardMaterial color={b.color} roughness={0.75} />
          </mesh>
          {/* lid */}
          <mesh castShadow position={[0, 0.9, 0]}>
            <cylinderGeometry args={[0.26, 0.26, 0.08, 12]} />
            <meshStandardMaterial color={b.lid} roughness={0.6} />
          </mesh>
          {/* handle */}
          <mesh position={[0, 0.42, 0.22]}>
            <torusGeometry args={[0.07, 0.02, 6, 12]} />
            <meshStandardMaterial color="#a8b0b8" metalness={0.5} roughness={0.45} />
          </mesh>
          {/* label */}
          <mesh position={[0, 0.62, 0.2]} rotation-x={-0.15}>
            <planeGeometry args={[0.28, 0.14]} />
            <meshBasicMaterial color="#f4f1e8" transparent opacity={0.85} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
