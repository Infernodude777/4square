import { Text } from "@react-three/drei";
import { World } from "../World";
import { Court } from "../Court";
import { Rig } from "../Rig";
import { TetherCourt } from "../tether/TetherCourt";
import { Pole } from "../tether/Pole";
import { RopeAndBall } from "../tether/RopeAndBall";
import { HubDirector } from "./HubDirector";
import {
  FOUR_SQUARE_POS, TETHER_POS, WALL_POS, KICK_POS, TAG_POS,
  BASKET_POS, GAGA_POS, DODGE_POS, HOPSCOTCH_POS, REDLIGHT_POS,
} from "./constants";
import {
  MonkeyBars, PicnicTable, Bushes, ChalkDoodles, FlowerBed, LampPosts,
} from "./Props";
import { BASE_POS } from "../../game/kickball";
import { PIT_R, OCTA, WALL_H as GAGA_WALL_H } from "../../game/gaga";

/** A slim post-mounted sign that stands at the edge of each court. */
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
      {/* two posts */}
      {[-0.78, 0.78].map((x) => (
        <mesh key={x} castShadow position={[x, 0.62, 0]}>
          <cylinderGeometry args={[0.045, 0.05, 1.24, 8]} />
          <meshStandardMaterial color="#6f7a85" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
      {/* board */}
      <group position={[0, 1.42, 0]}>
        <mesh castShadow>
          <boxGeometry args={[2.0, 0.56, 0.07]} />
          <meshStandardMaterial color="#16232c" roughness={0.82} />
        </mesh>
        <mesh position={[0, 0, -0.045]}>
          <boxGeometry args={[2.14, 0.7, 0.05]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
        <Text position={[0, 0, 0.045]} fontSize={0.23} color={color} anchorX="center" anchorY="middle">
          {title}
        </Text>
      </group>
    </group>
  );
}

/** Painted chalk arrow on the blacktop that points toward a court. */
function GroundLabel({
  text,
  position,
  color,
}: {
  text: string;
  position: [number, number, number];
  color: string;
}) {
  return (
    <Text
      position={position}
      rotation-x={-Math.PI / 2}
      fontSize={0.42}
      color={color}
      anchorX="center"
      anchorY="middle"
      fillOpacity={0.34}
    >
      {text}
    </Text>
  );
}

/** Static basketball half court + hoop (hub preview). */
function BasketballCourtStatic() {
  const hoopX = 0.2;
  return (
    <group>
      {/* court floor */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.004, -4.8]} receiveShadow>
        <planeGeometry args={[6.2, 9.6]} />
        <meshStandardMaterial color="#787d85" roughness={0.96} />
      </mesh>
      {/* key lines */}
      {[
        [-2.8, -4.6, 5.6, 0.09],
        [-2.8, -2.4, 0.09, 4.4],
        [2.8, -2.4, 0.09, 4.4],
        [-2.8, -0.2, 5.6, 0.09],
      ].map(([x, z, w, d], i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[x, 0.014, z]}>
          <planeGeometry args={[w, d]} />
          <meshBasicMaterial color="#ecc44a" transparent opacity={0.55} depthWrite={false} />
        </mesh>
      ))}
      {/* free-throw circle */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.014, -4.6]}>
        <ringGeometry args={[1.75, 1.85, 40]} />
        <meshBasicMaterial color="#ecc44a" transparent opacity={0.5} depthWrite={false} />
      </mesh>
      {/* hoop against the east fence */}
      <group position={[hoopX, 0, -1.3]}>
        <mesh castShadow position={[0, 2.0, 0]}>
          <cylinderGeometry args={[0.07, 0.09, 4.0, 12]} />
          <meshStandardMaterial color="#8d959e" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.05, 0]} receiveShadow>
          <boxGeometry args={[0.7, 0.12, 0.7]} />
          <meshStandardMaterial color="#6a7078" roughness={0.7} />
        </mesh>
        <mesh castShadow position={[0, 3.15, 0.45]} rotation-x={0.22}>
          <boxGeometry args={[0.08, 0.08, 0.95]} />
          <meshStandardMaterial color="#8d959e" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh castShadow position={[0, 3.0, 0.85]}>
          <boxGeometry args={[1.15, 0.72, 0.05]} />
          <meshStandardMaterial color="#e9edf2" roughness={0.35} metalness={0.1} />
        </mesh>
        <mesh position={[0, 2.92, 0.82]}>
          <boxGeometry args={[0.42, 0.36, 0.015]} />
          <meshStandardMaterial color="#c23227" roughness={0.5} />
        </mesh>
        <mesh castShadow position={[0, 2.6, 1.45]} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.24, 0.022, 10, 28]} />
          <meshStandardMaterial color="#e2483d" roughness={0.35} metalness={0.6} />
        </mesh>
      </group>
      <CourtSign title="BASKETBALL" position={[0, 0, -2.6]} color="#ffa63e" />
      <GroundLabel text="press E" position={[0, 0.02, -4.2]} color="#ffe0c0" />
    </group>
  );
}

/** Static gaga pit (octagon walls + wooden floor). */
function GagaPitStatic() {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[PIT_R - 0.12, 64]} />
        <meshStandardMaterial color="#8a5a33" roughness={0.85} />
      </mesh>
      {OCTA.map(([x, z], i) => {
        const [x2, z2] = OCTA[(i + 1) % 8];
        const mx = (x + x2) / 2;
        const mz = (z + z2) / 2;
        const len = Math.hypot(x2 - x, z2 - z) * PIT_R;
        const ang = Math.atan2(x2 - x, z2 - z);
        return (
          <group key={i}>
            <mesh castShadow receiveShadow position={[mx * PIT_R, GAGA_WALL_H / 2, mz * PIT_R]} rotation-y={-ang}>
              <boxGeometry args={[len, GAGA_WALL_H, 0.16]} />
              <meshStandardMaterial color="#9c6b42" roughness={0.85} />
            </mesh>
            <mesh position={[mx * PIT_R, GAGA_WALL_H + 0.05, mz * PIT_R]} rotation-y={-ang}>
              <boxGeometry args={[len + 0.05, 0.14, 0.24]} />
              <meshStandardMaterial color="#e0483d" roughness={0.6} />
            </mesh>
          </group>
        );
      })}
      <CourtSign title="GAGA" position={[0, 0, 4.4]} color="#b58cff" />
      <GroundLabel text="press E" position={[0, 0.02, 3.6]} color="#e4d8ff" />
    </group>
  );
}

/** Static dodgeball court. */
function DodgeCourtStatic() {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.004, 0]} receiveShadow>
        <planeGeometry args={[7.6, 5.4]} />
        <meshStandardMaterial color="#787d85" roughness={0.96} />
      </mesh>
      {[
        [0, 0.28, 7.6, 0.09],
        [0, 5.12, 7.6, 0.09],
        [-3.8, 2.7, 0.09, 5.0],
        [3.8, 2.7, 0.09, 5.0],
        [0, 2.7, 7.6, 0.09],
      ].map(([x, z, w, d], i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[x, 0.014, z]}>
          <planeGeometry args={[w, d]} />
          <meshBasicMaterial color="#ecc44a" transparent opacity={0.55} depthWrite={false} />
        </mesh>
      ))}
      <CourtSign title="DODGEBALL" position={[0, 0, 2.9]} color="#ff5a3c" />
      <GroundLabel text="press E" position={[0, 0.02, 2.2]} color="#ffd6d0" />
    </group>
  );
}

/** Static hopscotch board (the playable one lives in the game scene). */
function HopscotchBoardStatic() {
  const cell = 0.62;
  const chalk = "#e8c96a";
  const cells = Array.from({ length: 10 }, (_, k) => {
    const x = (k % 2 === 1 ? 1 : 0) * 0.78 - 0.39;
    return { x, z: -k * 0.78 - 0.4, n: k + 1 };
  });
  return (
    <group>
      {cells.map((c) => (
        <group key={c.n} position={[c.x, 0.015, c.z]}>
          <mesh rotation-x={-Math.PI / 2}>
            <planeGeometry args={[cell, cell]} />
            <meshStandardMaterial color="#2c313a" roughness={0.95} />
          </mesh>
          <mesh rotation-x={-Math.PI / 2}>
            <planeGeometry args={[cell - 0.05, cell - 0.05]} />
            <meshBasicMaterial color={chalk} transparent opacity={0.82} depthWrite={false} />
          </mesh>
          <Text position={[0, 0.004, 0]} rotation-x={-Math.PI / 2} fontSize={0.3} color="#3a2e12" anchorX="center" anchorY="middle">
            {c.n}
          </Text>
        </group>
      ))}
      <mesh rotation-x={-Math.PI / 2} position={[0.39, 0.015, -8.8]}>
        <planeGeometry args={[cell + 0.2, cell + 0.2]} />
        <meshStandardMaterial color="#2c313a" roughness={0.95} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0.39, 0.015, -8.8]}>
        <planeGeometry args={[cell + 0.1, cell + 0.1]} />
        <meshBasicMaterial color="#ffd23e" transparent opacity={0.85} depthWrite={false} />
      </mesh>
      <CourtSign title="HOPSCOTCH" position={[1.9, 0, -4.2]} color="#8ae06b" rotationY={Math.PI / 2} />
      <GroundLabel text="press E" position={[0, 0.02, -0.8]} color="#d8ffd0" />
    </group>
  );
}

/** The red-light lane hub preview: chalk runway + a mini traffic light. */
function RedLightLaneStatic() {
  const L = 2.2;
  const laneZ = 0;
  return (
    <group position={REDLIGHT_POS}>
      {/* chalk outline */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.014, laneZ]}>
        <planeGeometry args={[L * 2, 15]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.1} depthWrite={false} />
      </mesh>
      {[
        [-L, laneZ, 0.12, 15],
        [L, laneZ, 0.12, 15],
      ].map(([x, z, w, d], i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[x, 0.014, z]}>
          <planeGeometry args={[w, d]} />
          <meshBasicMaterial color="#7dff9a" transparent opacity={0.4} depthWrite={false} />
        </mesh>
      ))}
      {/* mini traffic light */}
      <group position={[0, 0, -7.2]}>
        <mesh castShadow position={[0, 1.9, 0]}>
          <cylinderGeometry args={[0.05, 0.07, 3.8, 8]} />
          <meshStandardMaterial color="#6f7a85" metalness={0.5} roughness={0.5} />
        </mesh>
        <group position={[0, 3.55, 0]}>
          <mesh>
            <boxGeometry args={[0.6, 1.3, 0.26]} />
            <meshStandardMaterial color="#2a3138" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.45, 0.15]}>
            <circleGeometry args={[0.16, 20]} />
            <meshStandardMaterial color="#ff3322" emissive="#ff3322" emissiveIntensity={0.7} />
          </mesh>
          <mesh position={[0, -0.45, 0.15]}>
            <circleGeometry args={[0.16, 20]} />
            <meshStandardMaterial color="#3dff6a" emissive="#3dff6a" emissiveIntensity={0.7} />
          </mesh>
        </group>
      </group>
      <CourtSign title="RED LIGHT" position={[0, 0, 7.6]} color="#7dff9a" />
      <GroundLabel text="press E · HOLD W TO RUN" position={[0, 0.02, 6.9]} color="#d8ffd0" />
    </group>
  );
}

export function HubScene() {
  return (
    <>
      <ambientLight intensity={0.34} />
      <hemisphereLight args={["#dceeff", "#7d8c68", 0.72]} />
      <directionalLight
        position={[16, 26, -10]}
        intensity={1.65}
        color="#fff4e2"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-camera-near={1}
        shadow-camera-far={64}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[-14, 12, 16]} intensity={0.32} color="#bcd6ff" />

      <World />

      {/* ── FOUR SQUARE — west side ── */}
      <group position={FOUR_SQUARE_POS}>
        <Court />
        <CourtSign title="FOUR SQUARE" position={[0, 0, -5.4]} color="#ffd23e" />
        <GroundLabel text="press E" position={[0, 0.02, 5.3]} color="#fff3cf" />
      </group>

      {/* ── TETHERBALL — east side ── */}
      <group position={TETHER_POS}>
        <TetherCourt />
        <Pole />
        <RopeAndBall />
        <CourtSign title="TETHERBALL" position={[0, 0, -4.6]} color="#ff9a3c" />
        <GroundLabel text="press E" position={[0, 0.02, 4.5]} color="#ffe0c0" />
      </group>

      {/* ── WALLBALL — north, against the building ── */}
      <group position={WALL_POS}>
        {/* wall slab */}
        <mesh position={[0, 2.2, 0]} receiveShadow castShadow>
          <boxGeometry args={[6.6, 4.4, 0.45]} />
          <meshStandardMaterial color="#9c6544" roughness={0.92} />
        </mesh>
        {/* concrete kick plate */}
        <mesh position={[0, 0.13, 0.28]} receiveShadow>
          <boxGeometry args={[6.6, 0.26, 0.32]} />
          <meshStandardMaterial color="#9aa0a6" roughness={0.9} />
        </mesh>
        {/* roof lip */}
        <mesh position={[0, 4.52, -0.05]}>
          <boxGeometry args={[7.0, 0.26, 0.8]} />
          <meshStandardMaterial color="#5e3a2e" roughness={0.9} />
        </mesh>
        {/* painted out-line near the top */}
        <mesh position={[0, 3.75, 0.24]}>
          <boxGeometry args={[6.4, 0.09, 0.03]} />
          <meshStandardMaterial color="#ecc44a" roughness={0.6} />
        </mesh>
        {/* shared blacktop court in front */}
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.004, 2.8]} receiveShadow>
          <planeGeometry args={[6.8, 5.4]} />
          <meshStandardMaterial color="#787d85" roughness={0.96} />
        </mesh>
        {/* painted boundary */}
        {[
          [0, 0.25, 6.8, 0.09],
          [0, 5.45, 6.8, 0.09],
          [-3.4, 2.85, 0.09, 5.3],
          [3.4, 2.85, 0.09, 5.3],
        ].map(([x, z, w, d], i) => (
          <mesh key={i} rotation-x={-Math.PI / 2} position={[x, 0.014, z]}>
            <planeGeometry args={[w, d]} />
            <meshBasicMaterial color="#ecc44a" transparent opacity={0.78} depthWrite={false} />
          </mesh>
        ))}
        <CourtSign title="WALLBALL" position={[4.7, 0, 2.6]} color="#ff6b5e" rotationY={-Math.PI / 2} />
        <GroundLabel text="press E" position={[0, 0.02, 4.6]} color="#ffd6d0" />
      </group>

      {/* ── KICKBALL — dedicated diamond; chalk matches the real field ── */}
      <group position={KICK_POS}>
        {/* diamond chalk lines (identical to KickballCourt's geometry) */}
        {BASE_POS.map(([x1, z1], i) => {
          const [x2, z2] = BASE_POS[(i + 1) % 4];
          const mx = (x1 + x2) / 2;
          const mz = (z1 + z2) / 2;
          const len = Math.hypot(x2 - x1, z2 - z1);
          const ang = Math.atan2(x2 - x1, z2 - z1);
          return (
            <mesh key={i} rotation-x={-Math.PI / 2} position={[mx, 0.012, mz]} rotation-z={-ang}>
              <planeGeometry args={[len, 0.09]} />
              <meshBasicMaterial color="#ecc44a" transparent opacity={0.55} depthWrite={false} />
            </mesh>
          );
        })}
        {/* bases */}
        {BASE_POS.map(([x, z], i) => (
          <mesh key={i} rotation-x={-Math.PI / 2} position={[x, 0.02, z]}>
            <planeGeometry args={[0.5, 0.5]} />
            <meshStandardMaterial color={i === 0 ? "#d8dde4" : "#f2f4f8"} roughness={0.7} />
          </mesh>
        ))}
        <CourtSign title="KICKBALL" position={[0, 0, 5.6]} color="#7fc4ff" />
        <GroundLabel text="press E" position={[0, 0.02, 5.0]} color="#d8ecff" />
      </group>

      {/* ── BASKETBALL — north-east corner ── */}
      <group position={BASKET_POS}>
        <BasketballCourtStatic />
      </group>

      {/* ── GAGA — north-west corner ── */}
      <group position={GAGA_POS}>
        <GagaPitStatic />
      </group>

      {/* ── DODGEBALL — south-east ── */}
      <group position={DODGE_POS}>
        <DodgeCourtStatic />
      </group>

      {/* ── HOPSCOTCH — north, beside the wallball court ── */}
      <group position={HOPSCOTCH_POS}>
        <HopscotchBoardStatic />
      </group>

      {/* ── RED LIGHT GREEN LIGHT — the new east strip (Season 2) ── */}
      <RedLightLaneStatic />

      {/* ── Season 2 yard props ── */}
      <MonkeyBars pos={[14.8, 0, -10.5]} />
      <PicnicTable pos={[15.4, 0, 9.8]} />
      <Bushes positions={[[-12.2, 0, -2.0], [12.2, 0, -2.0]]} />
      <FlowerBed pos={[-8.0, 0, -13.9]} />
      <ChalkDoodles />
      <LampPosts positions={[[15.3, 0, -9.0], [15.3, 0, 0], [15.3, 0, 9.0], [-12.3, 0, -9.0], [-12.3, 0, 9.0]]} />

      {/* Tag: open blacktop zone in the south corridor — sign on a post */}
      <group position={TAG_POS}>
        {/* post */}
        <mesh castShadow position={[0, 1.0, 0]}>
          <cylinderGeometry args={[0.045, 0.05, 2.0, 8]} />
          <meshStandardMaterial color="#6f7a85" metalness={0.5} roughness={0.5} />
        </mesh>
        {/* board */}
        <group position={[0, 2.1, 0]}>
          <mesh castShadow>
            <boxGeometry args={[2.2, 0.58, 0.07]} />
            <meshStandardMaterial color="#16232c" roughness={0.82} />
          </mesh>
          <mesh position={[0, 0, -0.045]}>
            <boxGeometry args={[2.36, 0.72, 0.05]} />
            <meshStandardMaterial color="#e2483d" roughness={0.6} />
          </mesh>
          <Text position={[0, 0, 0.045]} fontSize={0.26} color="#e2483d" anchorX="center" anchorY="middle">
            TAG!
          </Text>
        </group>
        <Text position={[0, 0.018, 2.2]} rotation-x={-Math.PI / 2} fontSize={0.42} color="#e2483d"
          anchorX="center" anchorY="middle" fillOpacity={0.34}>
          press E
        </Text>
      </group>

      <Rig id="player" />
      <HubDirector />
    </>
  );
}
