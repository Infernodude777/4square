/**
 * The little things the kids leave out: a four-square ball, a basketball
 * resting by the baseline, a red kickball near the west sidewalk, a hula
 * hoop, a frisbee, and a hopscotch rock. All flat against the ground and
 * clear of the painted courts, so they read as atmosphere, not obstacles.
 */
export function PlaygroundBits() {
  return (
    <group>
      {/* four-square ball, just off the south edge of the court */}
      <mesh position={[-7.4, 0.17, 8.7]}>
        <sphereGeometry args={[0.17, 16, 12]} />
        <meshStandardMaterial color="#ff8a30" roughness={0.5} />
      </mesh>

      {/* basketball by the baseline (orange + seam rings) */}
      <group position={[10.9, 0.15, -9.6]}>
        <mesh>
          <sphereGeometry args={[0.15, 16, 12]} />
          <meshStandardMaterial color="#e8782a" roughness={0.55} />
        </mesh>
        <mesh rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.15, 0.008, 6, 20]} />
          <meshBasicMaterial color="#2a1405" />
        </mesh>
        <mesh rotation-z={Math.PI / 2}>
          <torusGeometry args={[0.15, 0.008, 6, 20]} />
          <meshBasicMaterial color="#2a1405" />
        </mesh>
      </group>

      {/* red kickball by the west sidewalk */}
      <mesh position={[-11.8, 0.14, 3.8]}>
        <sphereGeometry args={[0.14, 14, 10]} />
        <meshStandardMaterial color="#e2483d" roughness={0.6} />
      </mesh>

      {/* hula hoop, flat on the blacktop */}
      <mesh position={[10.9, 0.03, 10.3]} rotation-x={-Math.PI / 2}>
        <torusGeometry args={[0.32, 0.025, 10, 32]} />
        <meshStandardMaterial color="#ff5ab5" roughness={0.4} />
      </mesh>

      {/* frisbee */}
      <mesh position={[12.7, 0.035, 8.6]} rotation-x={-Math.PI / 2}>
        <cylinderGeometry args={[0.16, 0.15, 0.03, 20]} />
        <meshStandardMaterial color="#38d6d0" roughness={0.35} />
      </mesh>

      {/* hopscotch rock */}
      <mesh position={[6.4, 0.05, -12.4]} scale={[1, 0.6, 1]}>
        <dodecahedronGeometry args={[0.14, 0]} />
        <meshStandardMaterial color="#9aa0a6" roughness={0.9} />
      </mesh>
    </group>
  );
}
