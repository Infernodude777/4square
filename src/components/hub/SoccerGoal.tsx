import * as THREE from "three";

/**
 * A lone soccer goal on the lawn beyond the east fence, with a striped
 * net and a scuffed ball resting just inside the post. No court — just
 * the goal, the way a yard ends up with one. Purely visual.
 */
export function SoccerGoal() {
  return (
    <group position={[22.4, 0, 3.2]} rotation-y={-1.9}>
      {/* frame */}
      {[[-2.0, 0], [2.0, 0]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh castShadow position={[0, 1.2, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 2.4, 8]} />
            <meshStandardMaterial color="#f4f1e8" roughness={0.6} />
          </mesh>
          {/* crossbar */}
          <mesh position={[0, 2.4, -1.9]}>
            <cylinderGeometry args={[0.05, 0.05, 4.0, 8]} rotation-z={Math.PI / 2} />
            <meshStandardMaterial color="#f4f1e8" roughness={0.6} />
          </mesh>
        </group>
      ))}
      {/* net — a grid of thin white lines on the back + sides */}
      {([
        { args: [4.0, 2.4], pos: [0, 1.2, -1.92], ry: 0 },
        { args: [2.4, 2.4], pos: [-1.92, 1.2, -0.95], ry: Math.PI / 2 },
        { args: [2.4, 2.4], pos: [1.92, 1.2, -0.95], ry: Math.PI / 2 },
      ] as { args: [number, number]; pos: [number, number, number]; ry: number }[]).map((n, i) => (
        <mesh key={i} position={n.pos} rotation-y={n.ry}>
          <planeGeometry args={[n.args[0], n.args[1]]} />
          <meshStandardMaterial color="#e8edf4" transparent opacity={0.18} side={THREE.DoubleSide} wireframe />
        </mesh>
      ))}
      {/* ball */}
      <group position={[0.9, 0.16, 0.4]}>
        <mesh>
          <sphereGeometry args={[0.16, 16, 12]} />
          <meshStandardMaterial color="#ffffff" roughness={0.55} />
        </mesh>
        {([
          [0, Math.PI / 2, 0],
          [Math.PI / 2, 0, 0],
          [0, 0, Math.PI / 2],
        ] as [number, number, number][]).map((r, i) => (
          <mesh key={i} rotation={r}>
            <torusGeometry args={[0.16, 0.006, 6, 20]} />
            <meshStandardMaterial color="#20242c" roughness={0.4} />
          </mesh>
        ))}
      </group>
      {/* grass shading under the goal */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.012, -0.9]}>
        <planeGeometry args={[4.2, 2.6]} />
        <meshStandardMaterial color="#3f4a33" roughness={1} transparent opacity={0.3} />
      </mesh>
    </group>
  );
}
