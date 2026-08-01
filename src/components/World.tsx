import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  makeAsphaltTexture,
  makeBrickTexture,
  makeChainlinkTexture,
  makeGrassTexture,
  makeSignTexture,
} from "../game/textures";
import { swingAngle } from "./hub/constants";


function SwayTree({ pos, s = 1, phase = 0 }: { pos: [number, number, number]; s?: number; phase?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.z = Math.sin(clock.elapsedTime * 0.55 + phase) * 0.022;
      ref.current.rotation.x = Math.cos(clock.elapsedTime * 0.4 + phase) * 0.016;
    }
  });
  return (
    <group ref={ref} position={pos} scale={s}>
      <mesh castShadow position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.16, 0.26, 2.3, 8]} />
        <meshStandardMaterial color="#6b4a33" roughness={0.95} />
      </mesh>
      <mesh castShadow position={[0, 2.7, 0]}>
        <sphereGeometry args={[1.15, 12, 10]} />
        <meshStandardMaterial color="#4d8139" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0.7, 2.25, 0.2]}>
        <sphereGeometry args={[0.8, 10, 8]} />
        <meshStandardMaterial color="#5d9243" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[-0.6, 2.35, -0.25]}>
        <sphereGeometry args={[0.72, 10, 8]} />
        <meshStandardMaterial color="#43712f" roughness={0.9} />
      </mesh>
    </group>
  );
}

function SwingSet({ pos }: { pos: [number, number, number] }) {
  const s1 = useRef<THREE.Group>(null);
  const s2 = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    // Seat 1 is the rideable one — it shares swingAngle() with the player
    // so the kid and the plank move as one rigid body.
    if (s1.current) s1.current.rotation.x = swingAngle(t);
    if (s2.current) s2.current.rotation.x = Math.sin(t * 1.5 + 1.4) * 0.3;
  });
  const frame = "#7a4b2e";
  return (
    <group position={pos} rotation-y={0.5}>
      {[[-1.6, 0], [1.6, 0]].map(([x], i) => (
        <group key={i} position={[x, 0, 0]}>
          <mesh castShadow position={[0, 1.25, -0.5]} rotation-x={0.38}>
            <cylinderGeometry args={[0.06, 0.06, 2.7, 8]} />
            <meshStandardMaterial color={frame} roughness={0.8} />
          </mesh>
          <mesh castShadow position={[0, 1.25, 0.5]} rotation-x={-0.38}>
            <cylinderGeometry args={[0.06, 0.06, 2.7, 8]} />
            <meshStandardMaterial color={frame} roughness={0.8} />
          </mesh>
        </group>
      ))}
      <mesh castShadow position={[0, 2.5, 0]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.07, 0.07, 3.5, 8]} />
        <meshStandardMaterial color={frame} roughness={0.8} />
      </mesh>
      {[[-0.7, s1], [0.7, s2]].map(([x, r], i) => (
        <group key={i} ref={r as any} position={[x as number, 2.5, 0]}>
          {/* twin chains, so a rider fits between them */}
          {[-0.19, 0.19].map((cx) => (
            <mesh key={cx} position={[cx, -0.75, 0]}>
              <boxGeometry args={[0.022, 1.5, 0.022]} />
              <meshStandardMaterial color="#8b8f96" metalness={0.65} roughness={0.38} />
            </mesh>
          ))}
          {/* seat plank */}
          <mesh castShadow position={[0, -1.52, 0]}>
            <boxGeometry args={[0.46, 0.06, 0.26]} />
            <meshStandardMaterial color="#20242b" roughness={0.7} />
          </mesh>
          {/* rubber lip on the front edge */}
          <mesh position={[0, -1.52, 0.14]}>
            <boxGeometry args={[0.46, 0.05, 0.03]} />
            <meshStandardMaterial color="#33383f" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Slide({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos} rotation-y={Math.PI * 0.72}>
      <mesh castShadow position={[0, 0.9, 0]}>
        <boxGeometry args={[0.9, 0.08, 0.9]} />
        <meshStandardMaterial color="#3f6fb5" roughness={0.6} />
      </mesh>
      {[[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]].map(([x, z], i) => (
        <mesh key={i} castShadow position={[x, 0.44, z]}>
          <cylinderGeometry args={[0.05, 0.05, 0.9, 8]} />
          <meshStandardMaterial color="#3f6fb5" roughness={0.6} />
        </mesh>
      ))}
      <mesh castShadow position={[0, 0.5, 1.35]} rotation-x={0.52}>
        <boxGeometry args={[0.75, 0.06, 2.0]} />
        <meshStandardMaterial color="#f2b53c" roughness={0.35} metalness={0.3} />
      </mesh>
      <mesh position={[0.42, 0.95, -0.6]} rotation-x={-0.3}>
        <boxGeometry args={[0.05, 1.15, 0.5]} />
        <meshStandardMaterial color="#3f6fb5" roughness={0.6} />
      </mesh>
    </group>
  );
}

function Leaves() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(
    () =>
      Array.from({ length: 34 }, () => ({
        x: (Math.random() - 0.5) * 30,
        y: Math.random() * 6,
        z: (Math.random() - 0.5) * 30,
        ph: Math.random() * 10,
        sp: 0.25 + Math.random() * 0.5,
        rot: Math.random() * 3,
      })),
    []
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }, dt) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    data.forEach((d, i) => {
      d.y -= d.sp * dt;
      if (d.y < 0.05) d.y = 5 + Math.random() * 2;
      dummy.position.set(d.x + Math.sin(t * 0.8 + d.ph) * 0.8, d.y, d.z + Math.cos(t * 0.6 + d.ph) * 0.6);
      dummy.rotation.set(d.rot + t * d.sp, d.ph + t * 0.7, d.rot);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, 34]}>
      <planeGeometry args={[0.12, 0.09]} />
      <meshStandardMaterial color="#a8b23e" roughness={1} side={THREE.DoubleSide} />
    </instancedMesh>
  );
}

function SchoolBuilding() {
  const brick = useMemo(() => makeBrickTexture(), []);
  const sign = useMemo(() => makeSignTexture(), []);
  const windows = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useLayoutEffect(() => {
    if (!windows.current) return;
    let i = 0;
    const cols = [-12.6, -10.2, -7.8, -5.4, 5.4, 7.8, 10.2, 12.6];
    [2.7, 5.6].forEach((y) => {
      cols.forEach((x) => {
        dummy.position.set(x, y, -14.15);
        dummy.updateMatrix();
        windows.current!.setMatrixAt(i, dummy.matrix);
        const lit = Math.random() < 0.3;
        windows.current!.setColorAt(i, new THREE.Color(lit ? "#ffe3a1" : "#1e3050"));
        i++;
      });
    });
    windows.current.instanceMatrix.needsUpdate = true;
    if (windows.current.instanceColor) windows.current.instanceColor.needsUpdate = true;
  }, []);

  const flag = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (flag.current) flag.current.rotation.y = Math.sin(clock.elapsedTime * 2.2) * 0.16;
  });

  return (
    <group>
      {/* main block */}
      <mesh castShadow receiveShadow position={[0, 4, -17]}>
        <boxGeometry args={[30, 8, 5.5]} />
        <meshStandardMaterial map={brick} roughness={0.95} />
      </mesh>
      <mesh position={[0, 8.25, -17]}>
        <boxGeometry args={[30.8, 0.55, 6.2]} />
        <meshStandardMaterial color="#5e3a2e" roughness={0.9} />
      </mesh>
      {/* windows */}
      <instancedMesh ref={windows} args={[undefined, undefined, 16]}>
        <boxGeometry args={[1.3, 1.5, 0.14]} />
        <meshStandardMaterial color="#1e3050" roughness={0.25} metalness={0.4} />
      </instancedMesh>
      {/* door + steps */}
      <mesh position={[0, 1.45, -14.2]}>
        <boxGeometry args={[2.2, 2.9, 0.12]} />
        <meshStandardMaterial color="#3a2b20" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.08, -13.7]} receiveShadow>
        <boxGeometry args={[3.6, 0.16, 1.1]} />
        <meshStandardMaterial color="#b9b6ac" roughness={0.9} />
      </mesh>
      {/* sign */}
      <mesh position={[0, 6.9, -14.18]}>
        <planeGeometry args={[8.4, 1.5]} />
        <meshStandardMaterial map={sign} roughness={0.7} />
      </mesh>
      {/* gym wing */}
      <mesh castShadow receiveShadow position={[21.5, 2.9, -13]} rotation-y={-0.35}>
        <boxGeometry args={[10, 5.8, 8]} />
        <meshStandardMaterial map={brick} roughness={0.95} />
      </mesh>
      <mesh position={[21.5, 5.95, -13]} rotation-y={-0.35}>
        <boxGeometry args={[10.6, 0.4, 8.6]} />
        <meshStandardMaterial color="#5e3a2e" roughness={0.9} />
      </mesh>
      {/* flagpole */}
      <mesh castShadow position={[12.5, 3.6, -12.5]}>
        <cylinderGeometry args={[0.05, 0.07, 7.2, 8]} />
        <meshStandardMaterial color="#c8ccd2" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh ref={flag} position={[13.2, 6.7, -12.5]}>
        <planeGeometry args={[1.3, 0.85]} />
        <meshStandardMaterial color="#c23227" roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export function World() {
  const asphalt = useMemo(() => makeAsphaltTexture(), []);
  const grass = useMemo(() => makeGrassTexture(), []);
  const chainlink = useMemo(() => makeChainlinkTexture(), []);

  return (
    <group>
      {/* ground layers */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[74, 74]} />
        <meshStandardMaterial map={asphalt} roughness={0.97} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.07, 0]}>
        <planeGeometry args={[420, 420]} />
        <meshStandardMaterial map={grass} roughness={1} />
      </mesh>
      {/* sidewalk ring */}
      {[
        [0, -14.9, 33, 2.0],
        [0, 14.9, 33, 2.0],
        [-15.4, 0, 2.0, 30],
        [15.4, 0, 2.0, 30],
      ].map(([x, z, w, d], i) => (
        <mesh key={i} position={[x, 0.03, z]} receiveShadow>
          <boxGeometry args={[w, 0.14, d]} />
          <meshStandardMaterial color="#b9b6ac" roughness={0.9} />
        </mesh>
      ))}

      {/* chain-link fence */}
      {[
        [0, -13, 0],
        [0, 13, 0],
        [-13, 0, Math.PI / 2],
        [13, 0, Math.PI / 2],
      ].map(([x, z, ry], i) => (
        <mesh key={i} position={[x, 1.2, z]} rotation-y={ry}>
          <planeGeometry args={[26, 2.35]} />
          <meshStandardMaterial map={chainlink} transparent opacity={0.9} alphaTest={0.25} side={THREE.DoubleSide} metalness={0.4} roughness={0.5} />
        </mesh>
      ))}
      {/* posts + rail */}
      {Array.from({ length: 44 }, (_, i) => {
        const side = Math.floor(i / 11);
        const t = -13 + (i % 11) * 2.6;
        const pos: [number, number, number] =
          side === 0 ? [t, 1.25, -13] : side === 1 ? [t, 1.25, 13] : side === 2 ? [-13, 1.25, t] : [13, 1.25, t];
        return (
          <mesh key={i} position={pos} castShadow>
            <cylinderGeometry args={[0.055, 0.055, 2.5, 6]} />
            <meshStandardMaterial color="#7d858e" metalness={0.6} roughness={0.4} />
          </mesh>
        );
      })}
      {[
        [0, -13, 0],
        [0, 13, 0],
        [-13, 0, Math.PI / 2],
        [13, 0, Math.PI / 2],
      ].map(([x, z, ry], i) => (
        <mesh key={i} position={[x, 2.42, z]} rotation-y={ry as number} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.04, 0.04, 26, 6]} />
          <meshStandardMaterial color="#8d959e" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}

      <SchoolBuilding />

      {/* ── Trees: hugged to the fence line, clear of every court ── */}
      <SwayTree pos={[-12.0, 0, -7.2]} s={1.25} phase={4.0} />
      <SwayTree pos={[12.0, 0, -7.2]}  s={1.15} phase={1.0} />
      <SwayTree pos={[-12.2, 0, 11.4]} s={1.10} phase={0.4} />
      <SwayTree pos={[12.2, 0, 11.4]}  s={1.20} phase={2.5} />

      {/* ── Playground equipment: far south corners ── */}
      <SwingSet pos={[-8.8, 0, 12.0]} />
      <Slide pos={[8.8, 0, 12.0]} />

      {/* ── Bench + lunchbox: south-east, facing the courts ── */}
      <group position={[4.2, 0, 11.9]} rotation-y={Math.PI}>
        <mesh castShadow position={[0, 0.42, 0]}>
          <boxGeometry args={[2.0, 0.08, 0.5]} />
          <meshStandardMaterial color="#7a4b2e" roughness={0.85} />
        </mesh>
        {[-0.85, 0.85].map((x, i) => (
          <mesh key={i} position={[x, 0.2, 0]}>
            <boxGeometry args={[0.08, 0.4, 0.44]} />
            <meshStandardMaterial color="#5b6470" metalness={0.5} roughness={0.5} />
          </mesh>
        ))}
        <mesh castShadow position={[0, 0.72, -0.22]}>
          <boxGeometry args={[2.0, 0.5, 0.07]} />
          <meshStandardMaterial color="#7a4b2e" roughness={0.85} />
        </mesh>
        <mesh castShadow position={[0.4, 0.53, 0.05]}>
          <boxGeometry args={[0.34, 0.16, 0.24]} />
          <meshStandardMaterial color="#39b46a" roughness={0.4} metalness={0.3} />
        </mesh>
      </group>

      {/* ── Backpack pile: dumped by the bench ── */}
      <group position={[-4.4, 0, 11.9]} rotation-y={0.7}>
        <mesh castShadow position={[0, 0.22, 0]}>
          <boxGeometry args={[0.42, 0.5, 0.26]} />
          <meshStandardMaterial color="#e2483d" roughness={0.7} />
        </mesh>
        <mesh castShadow position={[0.4, 0.19, 0.15]} rotation-z={0.5}>
          <boxGeometry args={[0.4, 0.46, 0.24]} />
          <meshStandardMaterial color="#2f6fdb" roughness={0.7} />
        </mesh>
        <mesh castShadow position={[-0.3, 0.12, 0.25]} rotation-x={1.35}>
          <boxGeometry args={[0.3, 0.2, 0.42]} />
          <meshStandardMaterial color="#f7b32b" roughness={0.5} />
        </mesh>
        {/* chalk bucket beside them */}
        <group position={[-0.95, 0, -0.25]}>
          <mesh castShadow position={[0, 0.16, 0]}>
            <cylinderGeometry args={[0.14, 0.11, 0.32, 12]} />
            <meshStandardMaterial color="#3f6fb5" roughness={0.6} />
          </mesh>
          {[-0.05, 0.03, 0.06].map((x, i) => (
            <mesh key={i} position={[x, 0.38, i * 0.03 - 0.04]} rotation-z={0.3 + i * 0.3}>
              <cylinderGeometry args={[0.018, 0.018, 0.16, 6]} />
              <meshStandardMaterial color={["#ffffff", "#ffd9e8", "#cfeaff"][i]} roughness={0.8} />
            </mesh>
          ))}
        </group>
      </group>

      {/* ── Cones stacked out of the way, west fence ── */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} castShadow position={[-12.0, 0.19, 1.2 + i * 0.5]}>
          <coneGeometry args={[0.17, 0.4, 10]} />
          <meshStandardMaterial color="#ff7a2f" roughness={0.6} />
        </mesh>
      ))}
      {/* spare kickball */}
      <mesh castShadow position={[-11.9, 0.19, 3.1]}>
        <sphereGeometry args={[0.19, 16, 16]} />
        <meshStandardMaterial color="#d8342c" roughness={0.45} />
      </mesh>

      {/* ── Water fountain: east fence, between the courts ── */}
      <group position={[12.2, 0, 0.5]}>
        <mesh castShadow position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.22, 0.26, 0.9, 12]} />
          <meshStandardMaterial color="#8d959e" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.94, 0]}>
          <cylinderGeometry args={[0.26, 0.26, 0.08, 12]} />
          <meshStandardMaterial color="#b9c2ca" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>

      <Leaves />
    </group>
  );
}
