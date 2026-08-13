import { useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { dayFraction } from "../../game/atmosphere";

/**
 * A pole-mounted scoreboard beside the south fence, facing the kickball
 * diamond. It shows the school-day clock (read from the shared atmosphere
 * clock, same one the bell tower uses) plus a stuck-at-7-to-3 game score —
 * "home 7, away 3", obviously. Visual only.
 */
export function Scoreboard() {
  const [time, setTime] = useState("9:00");
  const [half, setHalf] = useState("AM");

  useFrame(() => {
    // School day starts at 9:00 AM and runs ~24 real minutes end to end.
    const f = dayFraction();
    const totalMin = 9 * 60 + f * (12 * 60); // 9:00 AM → 9:00 PM
    const h = Math.floor(totalMin / 60) % 12;
    const m = Math.floor(totalMin % 60);
    const hh = h === 0 ? 12 : h;
    const next = `${hh}:${String(m).padStart(2, "0")}`;
    const nextHalf = f < 0.5 ? "AM" : "PM";
    if (next !== time) setTime(next);
    if (nextHalf !== half) setHalf(nextHalf);
  });

  return (
    <group position={[6.9, 0, 12.9]}>
      {/* pole */}
      <mesh castShadow position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 3.2, 8]} />
        <meshStandardMaterial color="#7d858e" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* backboard */}
      <group position={[0, 3.35, -0.05]} rotation-y={Math.PI}>
        <mesh castShadow>
          <boxGeometry args={[1.7, 1.05, 0.06]} />
          <meshStandardMaterial color="#16232c" roughness={0.7} />
        </mesh>
        {/* clock readout */}
        <Text
          position={[0, 0.22, 0.04]}
          fontSize={0.24}
          color="#ffe98a"
          anchorX="center"
          anchorY="middle"
        >
          {time} {half}
        </Text>
        {/* score */}
        <Text position={[0, -0.16, 0.04]} fontSize={0.16} color="#f4f1e8" anchorX="center" anchorY="middle">
          HOME 7 · AWAY 3
        </Text>
        {/* little falcon mark */}
        <mesh position={[-0.68, 0.32, 0.04]}>
          <planeGeometry args={[0.18, 0.18]} />
          <meshBasicMaterial color="#ffd23e" />
        </mesh>
      </group>
      {/* base plate */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.28, 0.32, 0.1, 10]} />
        <meshStandardMaterial color="#5b6470" metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
}
