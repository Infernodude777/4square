import * as THREE from "three";

/**
 * A little treehouse perched on a big trunk beyond the north fence, with
 * a rope ladder and a tiny flag — the far corner's secret fort. Sits in
 * the grass strip between the fence and the building; visual only.
 */
export function Treehouse() {
  return (
    <group position={[-19.8, 0, -8.5]}>
      {/* trunk */}
      <mesh castShadow position={[0, 2.2, 0]}>
        <cylinderGeometry args={[0.55, 0.75, 4.4, 10]} />
        <meshStandardMaterial color="#5e3a2e" roughness={0.95} />
      </mesh>
      {/* platform */}
      <mesh castShadow position={[0, 4.3, 0]}>
        <boxGeometry args={[2.6, 0.15, 2.6]} />
        <meshStandardMaterial color="#7a4b2e" roughness={0.85} />
      </mesh>
      {/* hut */}
      <group position={[0, 5.1, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.9, 1.3, 1.9]} />
          <meshStandardMaterial color="#8a5a33" roughness={0.85} />
        </mesh>
        {/* roof */}
        <mesh castShadow position={[0, 0.8, 0]} rotation-x={Math.PI / 2}>
          <coneGeometry args={[1.55, 1.1, 4]} />
          <meshStandardMaterial color="#5e3a2e" roughness={0.85} />
        </mesh>
        {/* window */}
        <mesh position={[0, 0.1, 0.96]}>
          <circleGeometry args={[0.2, 14]} />
          <meshStandardMaterial color="#ffe3a1" roughness={0.4} />
        </mesh>
        {/* tiny flag */}
        <mesh position={[1.35, 1.15, 0]} rotation-z={0.15}>
          <boxGeometry args={[0.4, 0.22, 0.02]} />
          <meshStandardMaterial color="#c23227" roughness={0.7} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* rope ladder */}
      <group position={[0.7, 4.2, 0.7]} rotation-y={0.5}>
        {[0, 1, 2, 3, 4].map((i) => (
          <group key={i} position={[0, -i * 0.7, 0]}>
            {[-0.12, 0.12].map((x, j) => (
              <mesh key={j} position={[x, 0.3, 0]}>
                <cylinderGeometry args={[0.012, 0.012, 0.7, 5]} />
                <meshBasicMaterial color="#8a5a33" />
              </mesh>
            ))}
            <mesh>
              <boxGeometry args={[0.34, 0.03, 0.06]} />
              <meshStandardMaterial color="#a5845c" roughness={0.9} />
            </mesh>
          </group>
        ))}
      </group>
      {/* ground shade */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]}>
        <circleGeometry args={[1.6, 20]} />
        <meshStandardMaterial color="#3f4a33" roughness={1} transparent opacity={0.35} />
      </mesh>
    </group>
  );
}
