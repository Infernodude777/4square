import { Text } from "@react-three/drei";
import { World } from "../World";
import { Court } from "../Court";
import { Rig } from "../Rig";
import { TetherCourt } from "../tether/TetherCourt";
import { Pole } from "../tether/Pole";
import { RopeAndBall } from "../tether/RopeAndBall";
import { HubDirector } from "./HubDirector";
import { FOUR_SQUARE_POS, TETHER_POS } from "./constants";

function ChalkSign({
  title,
  sub,
  position,
  color,
}: {
  title: string;
  sub: string;
  position: [number, number, number];
  color: string;
}) {
  return (
    <group position={position} rotation-x={-0.2}>
      <mesh castShadow position={[0, 0, -0.04]}>
        <boxGeometry args={[2.9, 1.15, 0.08]} />
        <meshStandardMaterial color="#15222b" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0, -0.085]}>
        <boxGeometry args={[3.08, 1.32, 0.05]} />
        <meshStandardMaterial color="#8a5a2e" roughness={0.8} />
      </mesh>
      <Text position={[0, 0.18, 0.03]} fontSize={0.26} color={color} anchorX="center" anchorY="middle">
        {title}
      </Text>
      <Text position={[0, -0.18, 0.03]} fontSize={0.13} color="#f5f0df" anchorX="center" anchorY="middle">
        {sub}
      </Text>
    </group>
  );
}

export function HubScene() {
  return (
    <>
      <ambientLight intensity={0.32} />
      <hemisphereLight args={["#d8ecff", "#7a8a66", 0.7]} />
      <directionalLight
        position={[16, 24, -12]}
        intensity={1.6}
        color="#fff2dd"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-camera-near={1}
        shadow-camera-far={60}
      />

      <World />

      {/* Two playable courts live in the same playground. Walk up and press E. */}
      <group position={FOUR_SQUARE_POS}>
        <Court />
        <ChalkSign title="FOUR SQUARE" sub="press E at the red line" position={[0, 1.2, -4.9]} color="#ffd23e" />
      </group>

      <group position={TETHER_POS}>
        <TetherCourt />
        <Pole />
        <RopeAndBall />
        <ChalkSign title="TETHERBALL" sub="press E by the pole" position={[0, 1.2, -3.9]} color="#ff8a3c" />
      </group>

      <Rig id="player" />
      <HubDirector />
    </>
  );
}