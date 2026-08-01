import { Sky, Clouds, Cloud } from "@react-three/drei";
import * as THREE from "three";
import { World } from "../World";
import { WallCourt } from "./WallCourt";
import { WallPlayers } from "./WallPlayers";
import { WallBall } from "./WallBall";
import { WallDirector } from "./WallDirector";

export function WallballScene() {
  return (
    <>
      <Sky distance={4000} sunPosition={[70, 38, -80]} turbidity={5} rayleigh={1.6} mieCoefficient={0.004} mieDirectionalG={0.85} />
      <fog attach="fog" args={["#cfe3ee", 48, 160]} />
      <hemisphereLight args={["#d8ecff", "#7a8a66", 0.6]} />
      <ambientLight intensity={0.22} />
      <directionalLight
        position={[16, 24, -12]}
        intensity={1.7}
        color="#fff2dd"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[-12, 10, 14]} intensity={0.35} color="#bcd6ff" />
      <Clouds material={THREE.MeshBasicMaterial}>
        <Cloud position={[-30, 27, -55]} speed={0.12} opacity={0.75} segments={24} bounds={[11, 3, 3]} color="#ffffff" />
        <Cloud position={[25, 31, -70]} speed={0.08} opacity={0.65} segments={20} bounds={[14, 3.4, 3]} color="#fdfdff" />
      </Clouds>
      <World />
      <WallCourt />
      <WallPlayers />
      <WallBall />
      <WallDirector />
    </>
  );
}
