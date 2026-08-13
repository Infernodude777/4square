/**
 * A nicer bench flanked by two planter boxes full of flowers, sitting on
 * the lawn by the treeline — the quiet spot to watch recess. Visual only;
 * far from every court and the spawn corridor.
 */
export function GardenBench() {
  return (
    <group position={[-20.4, 0, -12.2]} rotation-y={0.7}>
      {/* bench */}
      <group>
        <mesh castShadow position={[0, 0.42, 0]}>
          <boxGeometry args={[1.8, 0.08, 0.5]} />
          <meshStandardMaterial color="#7a4b2e" roughness={0.85} />
        </mesh>
        <mesh castShadow position={[0, 0.74, -0.2]}>
          <boxGeometry args={[1.8, 0.5, 0.07]} />
          <meshStandardMaterial color="#7a4b2e" roughness={0.85} />
        </mesh>
        {[-0.75, 0.75].map((x, i) => (
          <mesh key={i} position={[x, 0.2, 0]}>
            <boxGeometry args={[0.08, 0.4, 0.44]} />
            <meshStandardMaterial color="#5b6470" metalness={0.5} roughness={0.5} />
          </mesh>
        ))}
      </group>
      {/* planter boxes */}
      {[-1.35, 1.35].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <mesh castShadow position={[0, 0.22, 0]}>
            <boxGeometry args={[0.55, 0.44, 0.55]} />
            <meshStandardMaterial color="#7a512f" roughness={0.85} />
          </mesh>
          {/* flowers */}
          {[[-0.12, 0.46, -0.1], [0.1, 0.5, 0.08], [0.0, 0.48, -0.16], [0.12, 0.44, 0.14]].map(([fx, fy, fz], j) => (
            <group key={j} position={[fx, fy, fz]}>
              <mesh>
                <cylinderGeometry args={[0.008, 0.008, 0.22, 5]} />
                <meshStandardMaterial color="#3f7a33" roughness={0.8} />
              </mesh>
              <mesh position={[0, 0.12, 0]}>
                <sphereGeometry args={[0.05, 8, 6]} />
                <meshStandardMaterial color={["#ff8a70", "#ffd23e", "#b58cff", "#ff5ab5"][j]} roughness={0.5} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}
