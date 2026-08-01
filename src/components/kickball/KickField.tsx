import { Text } from "@react-three/drei";
import { KICK_FIELD } from "../../game/kickball";

export function KickField() {
  const w = KICK_FIELD.halfX * 2;
  const d = KICK_FIELD.nearZ - KICK_FIELD.farZ;
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, (KICK_FIELD.nearZ + KICK_FIELD.farZ) / 2]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#66755f" roughness={0.97} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.025, 2.5]}>
        <circleGeometry args={[1.0, 32]} />
        <meshBasicMaterial color="#d6c792" transparent opacity={0.45} depthWrite={false} />
      </mesh>
      {[
        [0, 5.2], [-3.35, 0.1], [0, -5.0], [3.35, 0.1],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0.08, z]}>
          <mesh rotation-x={-Math.PI / 2}>
            <planeGeometry args={[0.78, 0.78]} />
            <meshBasicMaterial color="#f5e8b8" transparent opacity={0.9} depthWrite={false} />
          </mesh>
          <mesh position={[0, 0.12, 0]}>
            <boxGeometry args={[0.58, 0.16, 0.58]} />
            <meshStandardMaterial color="#efe2ad" roughness={0.84} />
          </mesh>
        </group>
      ))}
      {[
        [0, 2.5, 0.08, 5.0], [-1.68, 2.5, 0.08, 5.0], [1.68, 2.5, 0.08, 5.0],
        [-1.68, 0.1, 3.4, 0.08], [1.68, 0.1, 3.4, 0.08],
      ].map(([x, z, sx, sz], i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[x, 0.035, z]}>
          <planeGeometry args={[sx, sz]} />
          <meshBasicMaterial color="#f1e5b7" transparent opacity={0.65} depthWrite={false} />
        </mesh>
      ))}
      <Text position={[0, 0.045, 0.1]} rotation-x={-Math.PI / 2} fontSize={0.65} color="#f4ebc8" fillOpacity={0.45} anchorX="center" anchorY="middle">KICKBALL</Text>
      <Text position={[0, 0.045, 5.92]} rotation-x={-Math.PI / 2} fontSize={0.22} color="#f5e8b8" fillOpacity={0.7} anchorX="center" anchorY="middle">KICK · RUN · BEAT THE THROW</Text>
    </group>
  );
}
