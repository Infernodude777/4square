import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBox } from "@react-three/drei";
import { RT } from "../game/refs";
import { BOTS, sqOf, type EntityId } from "../game/constants";
import { useGame } from "../game/store";
import { drawFace, makeNameTag } from "../game/textures";

export function Rig({ id }: { id: EntityId }) {
  const isPlayer = id === "player";
  const def = isPlayer ? null : BOTS[id as Exclude<EntityId, "player">];
  const jersey = isPlayer ? "#2f6fdb" : def!.color;
  const accent = isPlayer ? "#f4f1e8" : def!.accent;
  const skin = isPlayer ? "#f0c297" : "#b8bfc7";

    const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
    const crown = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const antennaTip = useRef<THREE.Mesh>(null);

    const assign = useGame((s) => s.assign);
  const sq = sqOf(id, assign);
  const isKing = sq === 4;

    const face = useMemo(() => {
    if (isPlayer) return null;
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 96;
    drawFace(c, "idle", def!.screen, def!.accent);
    const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
    return { canvas: c, tex: t };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

  const tag = useMemo(() => {
    const name = isPlayer ? "YOU" : def!.short;
    const color = isPlayer ? "#ffd23e" : def!.color;
    const label = sq === 0 ? "WAITING IN LINE" : sq === 4 ? "KING OF THE COURT" : `SQUARE ${sq}`;
    return makeNameTag(name, color, label, isKing, isPlayer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sq, isKing, id]);

  const lastFace = useRef<string>("__none__");

  useFrame(({ clock }) => {
    const e = RT.entities[id];
    if (!root.current || !body.current) return;
        const t = clock.elapsedTime;
    root.current.position.set(e.pos.x, e.y, e.pos.z);
    root.current.rotation.y = e.facing;

        // crouch squash
    const cr = e.crouch ? 0.6 : 1;
    body.current.scale.y += (cr - body.current.scale.y) * 0.35;
    body.current.position.y = (body.current.scale.y - 1) * 0.48;

    // gait
    const sw = e.moving ? Math.sin(e.walkPhase) * 0.75 : 0;
    if (legL.current) legL.current.rotation.x = sw;
    if (legR.current) legR.current.rotation.x = -sw;

        // swing: wind-up overhead → follow through
    let arm = 0.15 + Math.sin(t * 2 + (isPlayer ? 0 : 1.7)) * 0.07;
    if (e.swing < 0.34) {
      const k = e.swing / 0.34;
      arm = -2.3 + k * 3.3;
    }
    if (armR.current) armR.current.rotation.x = arm;
    if (armL.current) armL.current.rotation.x = -sw * 0.5 - 0.08;

        body.current.rotation.z = e.moving ? Math.sin(e.walkPhase) * 0.05 : Math.sin(t * 1.3 + (isPlayer ? 0 : 2)) * 0.025;

    if (crown.current) {
      crown.current.visible = isKing;
      crown.current.position.y = 1.98 + Math.sin(t * 3) * 0.035;
      crown.current.rotation.y = t * 1.2;
    }
    if (ring.current) {
      const s = 1 + Math.sin(t * 4.5) * 0.08;
      ring.current.scale.setScalar(s);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = isPlayer ? 0.75 : 0;
    }
    if (antennaTip.current) {
      const m = antennaTip.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = e.face === "alert" ? 2.6 + Math.sin(t * 18) * 1.6 : 1.1 + Math.sin(t * 3) * 0.4;
    }
    if (face && e.face !== lastFace.current) {
              lastFace.current = e.face;
      drawFace(face.canvas, e.face, def!.screen, def!.accent);
      face.tex.needsUpdate = true;
    }
});

  return (
    <group ref={root}>
      <group ref={body}>
        {/* legs */}
        <group ref={legL} position={[-0.14, 0.5, 0]}>
                      <mesh castShadow position={[0, -0.22, 0]}>
            <boxGeometry args={[0.15, 0.46, 0.17]} />
            <meshStandardMaterial color={isPlayer ? "#2b3a55" : "#8f97a1"} roughness={0.8} />
                    <mesh castShadow position={[0, -0.46, 0.05]}>
            <boxGeometry args={[0.17, 0.11, 0.3]} />
                        <meshStandardMaterial color={isPlayer ? "#f4f1e8" : "#39404a"} roughness={0.6} />
                  </group>
        <group ref={legR} position={[0.14, 0.5, 0]}>
          <mesh castShadow position={[0, -0.22, 0]}>
            <boxGeometry args={[0.15, 0.46, 0.17]} />
            <meshStandardMaterial color={isPlayer ? "#2b3a55" : "#8f97a1"} roughness={0.8} />
                                <mesh castShadow position={[0, -0.46, 0.05 0.05]}>
            <boxGeometry args={[0.17, 0.11, 0.3]} />
            <meshStandardMaterial color={isPlayer ? "#f4f1e8" : "#39404a"} roughness={0.6} />
                  </group>

                          {/* torso */}
        <RoundedBox args={[0.58, 0.68, 0.36]} radius={0.1} smoothness={3} castShadow position={[0, 0.86, 0]}>
          <meshStandardMaterial color={jersey} roughness={0.65} />
                <mesh position={[0, 0.98, 0]} castShadow>
          <boxGeometry args={[0.59, 0.13, 0.37]} />
          <meshStandardMaterial color={accent} roughness={0.7} />
                  </mesh>
        {/* arms */}
        <group ref={armL} position={[-0.36, 1.12, 0]}>
          <mesh castShadow position={[0, -0.2, 0]}>
            <cylinderGeometry args={[0.065, 0.06, 0.42, 10]} />
            <meshStandardMaterial color={jersey} roughness={0.65} />
                    <mesh castShadow position={[0, -0.44, 0]}>
                                    <sphereGeometry args={[0.085, 12, 12]} />
            <meshStandardMaterial color={skin} roughness={0.55} />
                  </group>
        <group ref={armR} position={[0.36, 1.12, 0]}>
          <mesh castShadow position={[0, -0.2, 0]}>
                        <cylinderGeometry args={[0.065, 0.06, 0.42, 10]} />
            <meshStandardMaterial color={jersey} roughness={0.65} />
                    <mesh castShadow position={[0, -0.44, 0]}>
            <sphereGeometry args={[0.085, 12, 12]} />
            <meshStandardMaterial color={skin} roughness={0.55} />
                  </group>

                          {/* head */}
        {isPlayer ? (
          <group position={[0, 1.5, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.26, 20, 20]} />
              <meshStandardMaterial color={skin} roughness={0.6} />
            </mesh>            <mesh position={[-0.09, 0.03, 0.22]}>
              <sphereGeometry args={[0.032, 8, 8]} />
              <meshStandardMaterial color="#1b1f26" roughness={0.3} />
                        <mesh position={[0.09, 0.03, 0.22]}>
              <sphereGeometry args={[0.032, 8, 8]} />
              <meshStandardMaterial color="#1b1f26" roughness={0.3} />
               {/* backwards cap */}
            <mesh position={[0, 0.1, 0]} castShadow>
              <sphereGeometry args={[0.275, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
                            <meshStandardMaterial color="#e2483d" roughness={0.6} />
                        <mesh position={[0, 0.11, -0.26]} castShadow>
              <boxGeometry args={[0.26, 0.05, 0.16]} />
              <meshStandardMaterial color="#c23227" roughness={0.6} />
                      </group>
        ) : (
                      <group position={[0, 1.52, 0]}>
            <RoundedBox args={[0.5, 0.44, 0.44]} radius={0.09} smoothness={3} castShadow>
              <meshStandardMaterial color="#cfd6de" metalness={0.55} roughness={0.35} />
                        <mesh position={[0, 0.01, 0.225]}>
              <planeGeometry args={[0.4, 0.3]} />
              <meshBasicMaterial map={face!.tex} toneMapped={false} />
                          </mesh>
            {/* ears */}
            <mesh position={[-0.27, 0, 0]} rotation-z={Math.PI / 2}>
              <cylinderGeometry args={[0.06, 0.06, 0.06, 10]} />
              <meshStandardMaterial color="#8f97a1" metalness={0.6} roughness={0.4} />
                        <mesh position={[0.27, 0, 0]} rotation-z={Math.PI / 2}>
              <cylinderGeometry args={[0.06, 0.06, 0.06, 10]} />
              <meshStandardMaterial color="#8f97a1" metalness={0.6} roughness={0.4} />
                        {/* antenna */}
            <mesh position={[0, 0.3, 0]}>
                              <cylinderGeometry args={[0.018, 0.018, 0.2, 8]} />
              <meshStandardMaterial color="#5b6470" metalness={0.7} roughness={0.3} />
                        <mesh ref={antennaTip} position={[0, 0.42, 0]}>
              <sphereGeometry args={[0.05, 10, 10]} />
              <meshStandardMaterial color={def!.accent} emissive={def!.accent} emissiveIntensity={1.2} />
                      </group>
        )}

                {/* crown */}
        <group ref={crown} visible={false}>
          <mesh castShadow>
            <cylinderGeometry args={[0.15, 0.17, 0.1, 12]} />
            <meshStandardMaterial color="#f2b53c" metalness={0.7} roughness={0.25} emissive="#8a6a10" emissiveIntensity={0.35} />
                                {[0, 1, 2, 3, 4].map((i) => {
            const a = (i / 5) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(a) * 0.12, 0.1, Math.sin(a) * 0.12]}>
                <coneGeometry args={[0.045, 0.14, 6]} />
                                <meshStandardMaterial color="#f2b53c" metalness={0.7} roughness={0.25} emissive="#8a6a10" emissiveIntensity={0.35} />
                          );
                                })}
        </group>
      </group>

            {/* name tag */}
      <sprite position={[0, 2.35, 0]} scale={[1.5, 0.47, 1]}>
        <spriteMaterial map={tag} depthWrite={false} transparent />
      </sprite>
      {/* under-ring */}
      <mesh ref={ring} rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.4, 0.52, 32]} />
        <meshBasicMaterial color={isPlayer ? "#ffe066" : def!.color} transparent opacity={0} depthWrite={false} />
          </group>
  );
}

      </mesh>
      </sprite>
            )
                                })}
          </mesh>
        </group>
                        </mesh>
            </mesh>
                        </mesh>
            </RoundedBox>
                      </group>
        )
            </mesh>
                        </mesh>
        )}
                    </mesh>
        </group>
        </RoundedBox>
                    </mesh>
                      </mesh>
        </group>
    </group>
  )
    }
    }
    }
    }
    }
  })
  })
    })
}