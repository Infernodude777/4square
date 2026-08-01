import { Text } from "@react-three/drei";
import { TAG_FIELD } from "../../game/tag";

export function TagField() {
  const w = TAG_FIELD.halfX * 2;
  const d = TAG_FIELD.halfZ * 2;
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.012, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#596875" roughness={0.94} />
      </mesh>
      {[
        [0, -TAG_FIELD.halfZ, w, 0.08], [0, TAG_FIELD.halfZ, w, 0.08],
        [-TAG_FIELD.halfX, 0, 0.08, d], [TAG_FIELD.halfX, 0, 0.08, d],
      ].map(([x, z, sx, sz], i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[x, 0.03, z]}>
          <planeGeometry args={[sx, sz]} />
          <meshBasicMaterial color="#ffd23e" transparent opacity={0.8} depthWrite={false} />
        </mesh>
      ))}
      {[[-6.6, -5.9], [6.6, -5.9], [-6.6, 5.9], [6.6, 5.9]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.42, z]} castShadow>
          <coneGeometry args={[0.16, 0.75, 10]} />
          <meshStandardMaterial color={i % 2 ? "#e2483d" : "#f7b32b"} roughness={0.6} />
        </mesh>
      ))}
      <Text position={[0, 0.045, 0]} rotation-x={-Math.PI / 2} fontSize={1.1} color="#e8eef4" fillOpacity={0.22} anchorX="center" anchorY="middle">
        TAG
      </Text>
      <Text position={[0, 0.045, TAG_FIELD.halfZ - 0.45]} rotation-x={-Math.PI / 2} fontSize={0.24} color="#ffe7a1" fillOpacity={0.6} anchorX="center" anchorY="middle">
        SAFE ZONE · KEEP MOVING
      </Text>
    </group>
  );
}
