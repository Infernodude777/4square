import { Text } from "@react-three/drei";
import { World } from "../World";
import { Court } from "../Court";
import { Rig } from "../Rig";
import { TetherCourt } from "../tether/TetherCourt";
import { Pole } from "../tether/Pole";
import { RopeAndBall } from "../tether/RopeAndBall";
import { HubDirector } from "./HubDirector";
import { FOUR_SQUARE_POS, TETHER_POS, WALL_POS, TAG_POS, KICKBALL_POS } from "./constants";

function CourtSign({
  title,
  position,
  color,
  rotationY = 0,
}: {
  title: string;
  position: [number, number, number];
  color: string;
  rotationY?: number;
}) {
  return (
    <group position={position} rotation-y={rotationY}>
      {[-0.78, 0.78].map((x) => (
        <mesh key={x} castShadow position={[x, 0.62, 0]}>
          <cylinderGeometry args={[0.045, 0.05, 1.24, 8]} />
          <meshStandardMaterial color="#6f7a85" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
      <group position={[0, 1.42, 0]}>
        <mesh castShadow>
          <boxGeometry args={[2.0, 0.56, 0.07]} />
          <meshStandardMaterial color="#16232c" roughness={0.82} />
        </mesh>
        <mesh position={[0, 0, -0.045]}>
          <boxGeometry args={[2.14, 0.7, 0.05]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
        <Text position={[0, 0, 0.045]} fontSize={0.23} color={color} anchorX="center" anchorY="middle">{title}</Text>
      </group>
    </group>
  );
}

function GroundLabel({ text, position, color }: { text: string; position: [number, number, number]; color: string }) {
  return <Text position={position} rotation-x={-Math.PI / 2} fontSize={0.42} color={color} anchorX="center" anchorY="middle" fillOpacity={0.34}>{text}</Text>;
}

function WallballPortal() {
  const boundary: [number, number, number, number][] = [
    [0, 0.25, 6.8, 0.09],
    [0, 5.45, 6.8, 0.09],
    [-3.4, 2.85, 0.09, 5.3],
    [3.4, 2.85, 0.09, 5.3],
  ];
  return (
    <group position={WALL_POS}>
      <mesh position={[0, 2.2, 0]} receiveShadow castShadow><boxGeometry args={[6.6, 4.4, 0.45]} /><meshStandardMaterial color="#9c6544" roughness={0.92} /></mesh>
      <mesh position={[0, 0.13, 0.28]} receiveShadow><boxGeometry args={[6.6, 0.26, 0.32]} /><meshStandardMaterial color="#9aa0a6" roughness={0.9} /></mesh>
      <mesh position={[0, 4.52, -0.05]}><boxGeometry args={[7.0, 0.26, 0.8]} /><meshStandardMaterial color="#5e3a2e" roughness={0.9} /></mesh>
      <mesh position={[0, 3.75, 0.24]}><boxGeometry args={[6.4, 0.09, 0.03]} /><meshStandardMaterial color="#ecc44a" roughness={0.6} /></mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.004, 2.8]} receiveShadow><planeGeometry args={[6.8, 5.4]} /><meshStandardMaterial color="#787d85" roughness={0.96} /></mesh>
      {boundary.map(([x, z, width, depth], i) => <mesh key={i} rotation-x={-Math.PI / 2} position={[x, 0.014, z]}><planeGeometry args={[width, depth]} /><meshBasicMaterial color="#ecc44a" transparent opacity={0.78} depthWrite={false} /></mesh>)}
      <CourtSign title="WALLBALL" position={[4.7, 0, 2.6]} color="#ff6b5e" rotationY={-Math.PI / 2} />
      <GroundLabel text="PRESS E" position={[0, 0.02, 4.6]} color="#ffd6d0" />
    </group>
  );
}

function NewModePortal({ position, title, label, color }: { position: [number, number, number]; title: string; label: string; color: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.16, 0]} receiveShadow><cylinderGeometry args={[1.3, 1.45, 0.28, 32]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.18} roughness={0.72} /></mesh>
      <CourtSign title={title} position={[0, 0, -1.4]} color={color} />
      <GroundLabel text={label} position={[0, 0.03, 1.35]} color={color} />
    </group>
  );
}

export function HubScene() {
  return (
    <>
      <ambientLight intensity={0.34} />
      <hemisphereLight args={["#dceeff", "#7d8c68", 0.72]} />
      <directionalLight position={[16, 26, -10]} intensity={1.65} color="#fff4e2" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-20} shadow-camera-right={20} shadow-camera-top={20} shadow-camera-bottom={-20} shadow-camera-near={1} shadow-camera-far={64} shadow-bias={-0.0004} />
      <directionalLight position={[-14, 12, 16]} intensity={0.32} color="#bcd6ff" />
      <World />
      <group position={FOUR_SQUARE_POS}><Court /><CourtSign title="FOUR SQUARE" position={[0, 0, -5.4]} color="#ffd23e" /><GroundLabel text="PRESS E" position={[0, 0.02, 5.3]} color="#fff3cf" /></group>
      <group position={TETHER_POS}><TetherCourt /><Pole /><RopeAndBall /><CourtSign title="TETHERBALL" position={[0, 0, -4.6]} color="#ff9a3c" /><GroundLabel text="PRESS E" position={[0, 0.02, 4.5]} color="#ffe0c0" /></group>
      <WallballPortal />
      <NewModePortal position={TAG_POS} title="TAG FIELD" label="PRESS E · 6 PLAYERS" color="#7dff9a" />
      <NewModePortal position={KICKBALL_POS} title="KICKBALL" label="PRESS E · DIAMOND DASH" color="#ffb347" />
      <Rig id="player" />
      <HubDirector />
    </>
  );
}
