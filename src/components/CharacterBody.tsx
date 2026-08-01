import { forwardRef } from "react";
import * as THREE from "three";
import { RoundedBox } from "@react-three/drei";

export interface BodyRefs {
  body: React.RefObject<THREE.Group | null>;
  armL: React.RefObject<THREE.Group | null>;
  armR: React.RefObject<THREE.Group | null>;
  legL: React.RefObject<THREE.Group | null>;
  legR: React.RefObject<THREE.Group | null>;
  antennaTip?: React.RefObject<THREE.Mesh | null>;
}

export interface CharacterLook {
  isPlayer: boolean;
  jersey: string;
  accent: string;
  skin: string;
  /** robot only */
  botColor?: string;
  faceTex?: THREE.Texture;
}

/**
 * Shared, high-detail character body used by every mode so the kid and the
 * robots look identical wherever you meet them.
 */
export const CharacterBody = forwardRef<THREE.Group, { refs: BodyRefs; look: CharacterLook }>(
  function CharacterBody({ refs, look }, _ref) {
    const { isPlayer, jersey, accent, skin, botColor, faceTex } = look;
    const { body, armL, armR, legL, legR, antennaTip } = refs;

    return (
      <group ref={body}>
        {/* ── LEGS ── */}
        {([-1, 1] as const).map((side) => (
          <group key={side} ref={side === -1 ? legL : legR} position={[side * 0.135, 0.52, 0]}>
            <mesh castShadow position={[0, -0.13, 0]}>
              <capsuleGeometry args={[0.088, 0.16, 4, 12]} />
              <meshStandardMaterial color={isPlayer ? "#31456b" : "#8f97a1"} roughness={0.78} />
            </mesh>
            <mesh castShadow position={[0, -0.35, 0]}>
              <capsuleGeometry args={[0.062, 0.16, 4, 12]} />
              <meshStandardMaterial color={isPlayer ? skin : "#79818b"} roughness={0.62} />
            </mesh>
            <mesh position={[0, -0.45, 0]}>
              <cylinderGeometry args={[0.068, 0.068, 0.07, 12]} />
              <meshStandardMaterial color={isPlayer ? "#f4f1e8" : "#4a525c"} roughness={0.75} />
            </mesh>
            <group position={[0, -0.505, 0.035]}>
              <RoundedBox args={[0.145, 0.09, 0.27]} radius={0.042} smoothness={3} castShadow>
                <meshStandardMaterial color={isPlayer ? "#e8452f" : "#2f353d"} roughness={0.55} />
              </RoundedBox>
              <mesh position={[0, -0.045, 0]}>
                <boxGeometry args={[0.15, 0.026, 0.272]} />
                <meshStandardMaterial color="#f4f1e8" roughness={0.7} />
              </mesh>
            </group>
          </group>
        ))}

        {/* ── HIPS ── */}
        <mesh castShadow position={[0, 0.60, 0]}>
          <capsuleGeometry args={[0.175, 0.10, 4, 16]} />
          <meshStandardMaterial color={isPlayer ? "#31456b" : "#8f97a1"} roughness={0.78} />
        </mesh>

        {/* ── TORSO ── */}
        <mesh castShadow position={[0, 0.92, 0]}>
          <capsuleGeometry args={[0.225, 0.34, 6, 18]} />
          <meshStandardMaterial color={jersey} roughness={0.62} />
        </mesh>
        <mesh position={[0, 0.90, 0]}>
          <cylinderGeometry args={[0.232, 0.232, 0.085, 20]} />
          <meshStandardMaterial color={accent} roughness={0.66} />
        </mesh>
        <mesh position={[0, 1.17, 0]}>
          <torusGeometry args={[0.115, 0.032, 8, 18]} />
          <meshStandardMaterial color={accent} roughness={0.7} />
        </mesh>

        {/* ── ARMS ── */}
        {([-1, 1] as const).map((side) => (
          <group key={side} ref={side === -1 ? armL : armR} position={[side * 0.275, 1.10, 0]}>
            <mesh castShadow position={[0, -0.075, 0]}>
              <capsuleGeometry args={[0.072, 0.09, 4, 12]} />
              <meshStandardMaterial color={jersey} roughness={0.62} />
            </mesh>
            <mesh castShadow position={[0, -0.27, 0]}>
              <capsuleGeometry args={[0.055, 0.19, 4, 12]} />
              <meshStandardMaterial color={skin} roughness={0.58} />
            </mesh>
            <mesh castShadow position={[0, -0.44, 0]}>
              <sphereGeometry args={[0.076, 14, 12]} />
              <meshStandardMaterial color={skin} roughness={0.55} />
            </mesh>
          </group>
        ))}

        {/* ── HEAD ── */}
        {isPlayer ? (
          <group position={[0, 1.42, 0]}>
            <mesh position={[0, -0.10, 0]}>
              <cylinderGeometry args={[0.072, 0.082, 0.11, 12]} />
              <meshStandardMaterial color={skin} roughness={0.6} />
            </mesh>
            <mesh castShadow scale={[1, 1.08, 0.96]}>
              <sphereGeometry args={[0.235, 26, 22]} />
              <meshStandardMaterial color={skin} roughness={0.58} />
            </mesh>
            <mesh position={[0, 0.028, -0.012]} scale={[1.02, 0.92, 1.02]}>
              <sphereGeometry args={[0.238, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
              <meshStandardMaterial color="#43301f" roughness={0.9} />
            </mesh>
            {([-1, 1] as const).map((s) => (
              <group key={s} position={[s * 0.082, 0.022, 0.196]}>
                <mesh scale={[1, 1.15, 0.6]}>
                  <sphereGeometry args={[0.037, 12, 12]} />
                  <meshStandardMaterial color="#fbfbfd" roughness={0.28} />
                </mesh>
                <mesh position={[0, 0, 0.022]}>
                  <sphereGeometry args={[0.019, 10, 10]} />
                  <meshStandardMaterial color="#26313f" roughness={0.22} />
                </mesh>
              </group>
            ))}
            {([-1, 1] as const).map((s) => (
              <mesh key={s} position={[s * 0.082, 0.078, 0.203]} rotation-z={s * 0.13}>
                <boxGeometry args={[0.062, 0.016, 0.02]} />
                <meshStandardMaterial color="#3a2717" roughness={0.9} />
              </mesh>
            ))}
            <mesh position={[0, -0.028, 0.222]}>
              <sphereGeometry args={[0.028, 10, 10]} />
              <meshStandardMaterial color={skin} roughness={0.6} />
            </mesh>
            <mesh position={[0, -0.095, 0.198]} rotation-x={0.22}>
              <torusGeometry args={[0.052, 0.011, 8, 16, Math.PI]} />
              <meshStandardMaterial color="#a4574a" roughness={0.7} />
            </mesh>
            {([-1, 1] as const).map((s) => (
              <mesh key={s} position={[s * 0.226, -0.012, 0]} scale={[0.5, 1, 0.75]}>
                <sphereGeometry args={[0.052, 10, 10]} />
                <meshStandardMaterial color={skin} roughness={0.6} />
              </mesh>
            ))}
            <group position={[0, 0.072, 0]}>
              <mesh castShadow scale={[1.03, 0.82, 1.03]}>
                <sphereGeometry args={[0.248, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
                <meshStandardMaterial color="#e2483d" roughness={0.58} />
              </mesh>
              <mesh position={[0, -0.004, 0]}>
                <torusGeometry args={[0.247, 0.017, 8, 24]} />
                <meshStandardMaterial color="#c23227" roughness={0.6} />
              </mesh>
              <mesh position={[0, 0.176, 0]}>
                <sphereGeometry args={[0.026, 10, 10]} />
                <meshStandardMaterial color="#c23227" roughness={0.6} />
              </mesh>
              <mesh castShadow position={[0, -0.012, -0.235]} rotation-x={-0.16}>
                <cylinderGeometry args={[0.155, 0.155, 0.028, 20, 1, false, 0, Math.PI]} />
                <meshStandardMaterial color="#c23227" roughness={0.6} />
              </mesh>
            </group>
          </group>
        ) : (
          <group position={[0, 1.44, 0]}>
            <mesh position={[0, -0.14, 0]}>
              <cylinderGeometry args={[0.062, 0.075, 0.13, 12]} />
              <meshStandardMaterial color="#6c757f" metalness={0.75} roughness={0.32} />
            </mesh>
            <RoundedBox args={[0.48, 0.44, 0.42]} radius={0.11} smoothness={4} castShadow>
              <meshStandardMaterial color="#d3dae2" metalness={0.6} roughness={0.3} />
            </RoundedBox>
            <RoundedBox args={[0.40, 0.32, 0.03]} radius={0.05} smoothness={3} position={[0, 0.01, 0.208]}>
              <meshStandardMaterial color="#2a3038" metalness={0.5} roughness={0.5} />
            </RoundedBox>
            {faceTex && (
              <mesh position={[0, 0.01, 0.226]}>
                <planeGeometry args={[0.36, 0.28]} />
                <meshBasicMaterial map={faceTex} toneMapped={false} />
              </mesh>
            )}
            <mesh position={[0, 0.20, 0.10]} rotation-x={0.32}>
              <boxGeometry args={[0.46, 0.05, 0.18]} />
              <meshStandardMaterial color={botColor ?? "#e2483d"} metalness={0.45} roughness={0.42} />
            </mesh>
            {([-1, 1] as const).map((s) => (
              <group key={s} position={[s * 0.255, -0.01, 0]}>
                <mesh rotation-z={Math.PI / 2}>
                  <cylinderGeometry args={[0.072, 0.072, 0.055, 14]} />
                  <meshStandardMaterial color="#8f97a1" metalness={0.68} roughness={0.35} />
                </mesh>
                <mesh rotation-z={Math.PI / 2} position={[s * 0.032, 0, 0]}>
                  <cylinderGeometry args={[0.038, 0.038, 0.02, 12]} />
                  <meshStandardMaterial color={accent} metalness={0.4} roughness={0.4} />
                </mesh>
              </group>
            ))}
            <mesh position={[0, 0.30, 0]}>
              <cylinderGeometry args={[0.015, 0.019, 0.20, 8]} />
              <meshStandardMaterial color="#5b6470" metalness={0.75} roughness={0.28} />
            </mesh>
            <mesh ref={antennaTip} position={[0, 0.43, 0]}>
              <sphereGeometry args={[0.052, 14, 14]} />
              <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.2} />
            </mesh>
          </group>
        )}
      </group>
    );
  },
);
