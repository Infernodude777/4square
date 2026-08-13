import { useMemo } from "react";
import { makeMuralTexture } from "../../game/textures";

/**
 * Painted murals on the school building between the window columns —
 * sun over rolling hills with a big falcon star, the school's emblem.
 * The texture is drawn once on a canvas and sits flat on the brick face.
 */
export function MuralWall() {
  const mural = useMemo(() => makeMuralTexture(), []);

  return (
    <group>
      {[-6.6, 6.6].map((x, i) => (
        <group key={i} position={[x, 4.1, -14.19]}>
          <mesh>
            <planeGeometry args={[2.3, 1.1]} />
            <meshStandardMaterial map={mural} roughness={0.85} />
          </mesh>
          {/* thin border trim so it reads as a painted panel */}
          <mesh position={[0, 0, 0.004]}>
            <planeGeometry args={[2.4, 1.2]} />
            <meshBasicMaterial color="#3a2b20" transparent opacity={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
