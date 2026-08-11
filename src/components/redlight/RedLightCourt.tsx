import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { RL_START_Z, RL_FINISH_Z, lightColor } from "../../game/redlight";
import { RL } from "./redlightState";

/**
 * The lane: a chalk-outlined runway running south → north, with the
 * traffic light on a pole at the far end — exactly where a kid would
 * put it so nobody can claim they "didn't see it".
 */
export function RedLightCourt() {
  const mid = (RL_START_Z + RL_FINISH_Z) / 2;
  const len = RL_START_Z - RL_FINISH_Z;
  const L = 2.2; // lane half-width

  return (
    <group>
      {/* lane floor */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.004, mid]} receiveShadow>
        <planeGeometry args={[L * 2, len]} />
        <meshStandardMaterial color="#70767e" roughness={0.96} />
      </mesh>
      {/* lane edges */}
      {[
        [-L, mid, 0.12, len],
        [L, mid, 0.12, len],
      ].map(([x, z, w, d], i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[x, 0.014, z]}>
          <planeGeometry args={[w, d]} />
          <meshBasicMaterial color="#ffd23e" transparent opacity={0.65} depthWrite={false} />
        </mesh>
      ))}
      {/* start line (south) + finish line (north) */}
      {[
        [0, RL_START_Z],
        [0, RL_FINISH_Z],
      ].map(([x, z], i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[x, 0.016, z]}>
          <planeGeometry args={[L * 2 + 0.3, 0.16]} />
          <meshStandardMaterial color={i === 0 ? "#e8ebf2" : "#ff5a3c"} roughness={0.7} />
        </mesh>
      ))}
      {/* per-runner chalk lane guides */}
      {[-1.35, 0.45, 1.65, -0.45].map((x, i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[x, 0.012, mid]}>
          <planeGeometry args={[0.04, len - 0.6]} />
          <meshBasicMaterial color="#e8ebf2" transparent opacity={0.18} depthWrite={false} />
        </mesh>
      ))}
      {/* "GO!" chalk near the start */}
      <Text
        position={[0, 0.02, RL_START_Z + 0.8]}
        rotation-x={-Math.PI / 2}
        fontSize={0.4}
        color="#57d977"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.35}
      >
        GO!
      </Text>
      <TrafficLightPole />
    </group>
  );
}

/**
 * The traffic light: a pole at the finish line with a three-lamp head.
 * The director drives the lamp colors each frame from the game state.
 */
function TrafficLightPole() {
  const redLamp = useRef<THREE.MeshStandardMaterial>(null);
  const yellowLamp = useRef<THREE.MeshStandardMaterial>(null);
  const greenLamp = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
    const c = lightColor(RL.current);
    const dim = 0.12;
    const bright = 2.2;
    const red = redLamp.current;
    const yellow = yellowLamp.current;
    const green = greenLamp.current;
    if (!red || !yellow || !green) return;
    red.color.set(c === "red" ? "#ff3322" : "#5c1a12");
    yellow.color.set(c === "red" ? "#5c4a12" : "#5c4a12");
    green.color.set(c === "green" ? "#3dff6a" : "#1a5c2e");
    red.emissiveIntensity = c === "red" ? bright : dim;
    yellow.emissiveIntensity = 0.05;
    green.emissiveIntensity = c === "green" ? bright : dim;
  });

  return (
    <group position={[0, 0, RL_FINISH_Z]}>
      {/* pole */}
      <mesh castShadow position={[0, 2.1, 0]}>
        <cylinderGeometry args={[0.07, 0.09, 4.2, 10]} />
        <meshStandardMaterial color="#6f7a85" metalness={0.55} roughness={0.4} />
      </mesh>
      {/* lamp head */}
      <group position={[0, 3.9, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.72, 1.6, 0.3]} />
          <meshStandardMaterial color="#2a3138" roughness={0.7} />
        </mesh>
        {[
          { y: 0.55, ref: redLamp, col: "#5c1a12" },
          { y: 0.0, ref: yellowLamp, col: "#5c4a12" },
          { y: -0.55, ref: greenLamp, col: "#1a5c2e" },
        ].map((lamp) => (
          <mesh key={lamp.y} position={[0, lamp.y, 0.17]}>
            <circleGeometry args={[0.19, 24]} />
            <meshStandardMaterial
              ref={lamp.ref}
              color={lamp.col}
              emissive={lamp.col}
              emissiveIntensity={0.12}
              roughness={0.35}
              metalness={0.2}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
