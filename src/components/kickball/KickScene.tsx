import { Sky, Clouds, Cloud } from "@react-three/drei";
import * as THREE from "three";
import { World } from "../World";
import { KickField } from "./KickField";
import { KickPlayers } from "./KickPlayers";
import { KickBall } from "./KickBall";
import { KickDirector } from "./KickDirector";

export function KickScene() {
  return (<><Sky distance={4000} sunPosition={[70, 38, -80]} turbidity={5} rayleigh={1.6} mieCoefficient={0.004} mieDirectionalG={0.85} /><fog attach="fog" args={["#cfe3ee", 42, 120]} /><hemisphereLight args={["#d8ecff", "#6f8066", 0.72]} /><ambientLight intensity={0.26} /><directionalLight position={[14, 24, -10]} intensity={1.75} color="#fff2dd" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-16} shadow-camera-right={16} shadow-camera-top={16} shadow-camera-bottom={-16} shadow-camera-far={60} /><Clouds material={THREE.MeshBasicMaterial}><Cloud position={[-30, 27, -55]} speed={0.12} opacity={0.7} segments={22} bounds={[11, 3, 3]} color="#ffffff" /><Cloud position={[25, 31, -70]} speed={0.08} opacity={0.62} segments={20} bounds={[14, 3.4, 3]} color="#fdfdff" /></Clouds><World /><KickField /><KickPlayers /><KickBall /><KickDirector /></>);
}
