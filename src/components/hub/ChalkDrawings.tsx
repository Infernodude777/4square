import { useMemo } from "react";
import { makeChalkTexture } from "../../game/textures";

/**
 * Sidewalk chalk art on the blacktop — a big sun, a hopscotch doodle,
 * and "best day ever!" — scattered where the kids hang out between
 * courts. Flat decals just above the asphalt; purely visual.
 */
export function ChalkDrawings() {
  const chalk = useMemo(() => makeChalkTexture(), []);

  return (
    <group>
      {/* by the bench / spawn corridor */}
      <mesh rotation-x={-Math.PI / 2} position={[0.6, 0.012, 11.4]} rotation-z={0.15}>
        <planeGeometry args={[1.5, 1.5]} />
        <meshBasicMaterial map={chalk} transparent opacity={0.9} depthWrite={false} />
      </mesh>
      {/* east strip under the red-light lane */}
      <mesh rotation-x={-Math.PI / 2} position={[11.8, 0.012, 6.4]} rotation-z={-0.4}>
        <planeGeometry args={[1.2, 1.2]} />
        <meshBasicMaterial map={chalk} transparent opacity={0.85} depthWrite={false} />
      </mesh>
      {/* west sidewalk, near the four-square corner */}
      <mesh rotation-x={-Math.PI / 2} position={[-11.9, 0.012, -4.6]} rotation-z={0.6}>
        <planeGeometry args={[1.0, 1.0]} />
        <meshBasicMaterial map={chalk} transparent opacity={0.8} depthWrite={false} />
      </mesh>
      {/* a couple of chalk sticks left on the ground */}
      {[[-0.2, 11.1], [12.2, 6.8]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.014, z]} rotation-z={0.4 + i} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.02, 0.02, 0.16, 6]} />
          <meshBasicMaterial color={["#ffffff", "#ffd9e8"][i]} />
        </mesh>
      ))}
    </group>
  );
}
