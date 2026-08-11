import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Sky, Clouds, Cloud, Text } from "@react-three/drei";
import * as THREE from "three";
import { World } from "../World";
import { CharacterBody } from "../CharacterBody";
import { makeNameTag } from "../../game/textures";
import { sfx, buzzer } from "../../game/audio";
import { say } from "../../game/banter";
import { useGame } from "../../game/store";
import { CELLS, CELL_SIZE, cellPos, stepH, tryHop, cellAt, clamp } from "../../game/hopscotch";
import { HS, resetHopscotch } from "./hopscotchState";

// The playable board lives exactly where the hub's chalk board is painted, so
// the "press E" gate and the game itself never drift apart.
import { HOPSCOTCH_POS } from "../hub/constants";
export const HOPSCOTCH_ORIGIN: [number, number, number] = HOPSCOTCH_POS;

/** Chalk board — ten cells + HOME plate. */
function Board() {
  const chalk = "#e8c96a";
  const cells = useMemo(() => Array.from({ length: CELLS }, (_, k) => cellPos(k, new THREE.Vector3())), []);
  return (
    <group>
      {cells.map((c, k) => (
        <group key={k} position={[c.x, 0.015, c.z]}>
          <mesh rotation-x={-Math.PI / 2}>
            <planeGeometry args={[CELL_SIZE, CELL_SIZE]} />
            <meshStandardMaterial color="#2c313a" roughness={0.95} />
          </mesh>
          <mesh rotation-x={-Math.PI / 2}>
            <planeGeometry args={[CELL_SIZE - 0.05, CELL_SIZE - 0.05]} />
            <meshBasicMaterial color={chalk} transparent opacity={0.82} depthWrite={false} />
          </mesh>
          <Text
            position={[0, 0.004, 0]}
            rotation-x={-Math.PI / 2}
            fontSize={0.3}
            color="#3a2e12"
            anchorX="center"
            anchorY="middle"
          >
            {k + 1}
          </Text>
        </group>
      ))}
      {/* HOME plate */}
      <group position={[0.39, 0.015, -CELLS * 0.78 - 1.0]}>
        <mesh rotation-x={-Math.PI / 2}>
          <planeGeometry args={[CELL_SIZE + 0.2, CELL_SIZE + 0.2]} />
          <meshStandardMaterial color="#2c313a" roughness={0.95} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2}>
          <planeGeometry args={[CELL_SIZE + 0.1, CELL_SIZE + 0.1]} />
          <meshBasicMaterial color="#ffd23e" transparent opacity={0.85} depthWrite={false} />
        </mesh>
        <Text position={[0, 0.004, 0]} rotation-x={-Math.PI / 2} fontSize={0.22} color="#3a2e12" anchorX="center" anchorY="middle">
          HOME
        </Text>
      </group>
    </group>
  );
}

/** The hopping kid. */
function Player() {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);

  const tag = useMemo(() => makeNameTag("YOU", "#ffd23e", "hopper", false, true), []);
  const prev = useRef(new THREE.Vector3());

  useFrame(({ clock }) => {
    const t = HS.current;
    const time = clock.elapsedTime;
    if (!root.current || !body.current) return;
    root.current.position.set(t.pos.x, 0, t.pos.z);
    root.current.rotation.y = t.target % 2 === 0 ? Math.PI : 0;
    const moved = t.pos.distanceTo(prev.current);
    prev.current.copy(t.pos);
    const hopping = t.phase === "play" && moved > 0.002;
    const sw = hopping ? Math.sin(time * 16) * 0.7 : Math.sin(time * 1.7) * 0.05;
    if (legL.current) legL.current.rotation.x = sw;
    if (legR.current) legR.current.rotation.x = -sw;
    if (armL.current) armL.current.rotation.x = -sw * 0.5;
    if (armR.current) armR.current.rotation.x = hopping ? 0.6 : 0.12;
  });

  return (
    <group ref={root}>
      <CharacterBody refs={{ body, armL, armR, legL, legR }} look={{ isPlayer: true, jersey: "#2f6fdb", accent: "#f4f1e8", skin: "#f0c297" }} />
      <sprite position={[0, 2.38, 0]} scale={[1.42, 0.36, 1]}>
        <spriteMaterial map={tag} depthWrite={false} transparent />
      </sprite>
    </group>
  );
}

/** Director — clicks on the board, hops the kid, drives the camera. */
function Director() {
  const { camera } = useThree();
  const phase = useGame((s) => s.phase);
  const prevPhase = useRef("hub");
  const camSnap = useRef(true);
  const camLook = useRef(new THREE.Vector3(0, 0.8, -4));
  const mouseNDC = useRef(new THREE.Vector2());
  const raycaster = useRef(new THREE.Raycaster());
  const boardPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));

  useEffect(() => {
    const mm = (e: MouseEvent) => {
      mouseNDC.current.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1,
      );
    };
    const pd = (e: MouseEvent) => {
      if (useGame.getState().phase !== "play") return;
      if ((e.target as HTMLElement | null)?.closest?.("button")) return;
      if (e.button !== 0) return;
      const t = HS.current;
      const hit = new THREE.Vector3();
      raycaster.current.setFromCamera(mouseNDC.current, camera);
      if (!raycaster.current.ray.intersectPlane(boardPlane.current, hit)) return;
      // Convert the world-space hit into board-local coords.
      const k = cellAt(hit.x - HOPSCOTCH_ORIGIN[0], hit.z - HOPSCOTCH_ORIGIN[2]);
      if (k >= 0) {
        if (tryHop(t, k)) {
          sfx.line();
          useGame.getState().popup(k + 1 === CELLS ? "HOME!" : String(k + 1), "gold");
        } else {
          sfx.fault();
          useGame.getState().popup("FAULT!", "red");
        }
      }
    };
    const ctx = (e: Event) => e.preventDefault();
    window.addEventListener("mousemove", mm);
    window.addEventListener("pointerdown", pd);
    window.addEventListener("contextmenu", ctx);
    return () => {
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("pointerdown", pd);
      window.removeEventListener("contextmenu", ctx);
    };
  }, [camera]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.04);
    const st = useGame.getState();
    if (st.mode !== "hopscotch") return;

    if (phase === "play" && prevPhase.current !== "play") {
      resetHopscotch();
      camSnap.current = true;
      sfx.whistle();
    }
    prevPhase.current = phase;

    if (phase !== "play" && phase !== "point") {
      doCam(true, dt);
      return;
    }

    const t = HS.current;
    stepH(t, dt);

    // Hop animation: lerp to the current target cell with an arc.
    const targetPos = cellPos(Math.min(t.target, CELLS - 1), new THREE.Vector3());
    const home = t.target >= CELLS ? new THREE.Vector3(0.39, 0, -CELLS * 0.78 - 1.0) : null;
    const dest = home ?? targetPos;
    const dist = Math.hypot(dest.x - t.pos.x, dest.z - t.pos.z);
    if (dist > 0.01) {
      const hopDur = 0.32;
      t.hopT = Math.min(1, t.hopT + dt / hopDur);
      const k = t.hopT;
      t.pos.x += (dest.x - t.pos.x) * (1 - Math.pow(1 - k, 3));
      t.pos.z += (dest.z - t.pos.z) * (1 - Math.pow(1 - k, 3));
      if (t.hopT >= 1) t.hopT = 0;
    }

    // ── Game over hand-off ──
    if (t.phase === "over" && !t.handled) {
      t.handled = true;
      buzzer();
      const youWon = t.winner === 0;
      st.setHopscotchResult(t.finishTime ?? 0, t.faults, t.times);
      say(youWon ? "win" : "lose", youWon ? "gold" : "red", true);
      if (youWon) {
        st.addScore(5);
        st.popup("HOPSCOTCH CHAMP!", "gold", true);
      } else {
        st.popup("THE BOTS HOP FASTER", "red", true);
      }
      setTimeout(() => {
        const g = useGame.getState();
        if (g.mode !== "hopscotch") return;
        if (youWon) g.win();
        else { resetHopscotch(); g.setPhase("point"); }
      }, 2200);
    }

    doCam(camSnap.current, dt);
    camSnap.current = false;
  });

  function doCam(snap: boolean, dt: number) {
    const t = HS.current;
    const cx = clamp(t.pos.x * 0.5, -1.6, 1.6) + HOPSCOTCH_ORIGIN[0];
    const cy = 7.6;
    const cz = clamp(t.pos.z * 0.3 + 8.6, 6.4, 8.8) + HOPSCOTCH_ORIGIN[2];
    const lx = HOPSCOTCH_ORIGIN[0];
    const ly = 0.8;
    const lz = HOPSCOTCH_ORIGIN[2] - 0.6;
    if (snap) {
      camera.position.set(cx, cy, cz);
      camLook.current.set(lx, ly, lz);
    } else {
      const k = 1 - Math.exp(-dt * 3.6);
      const k2 = 1 - Math.exp(-dt * 5.0);
      camera.position.x += (cx - camera.position.x) * k;
      camera.position.y += (cy - camera.position.y) * k;
      camera.position.z += (cz - camera.position.z) * k;
      camLook.current.x += (lx - camLook.current.x) * k2;
      camLook.current.y += (ly - camLook.current.y) * k2;
      camLook.current.z += (lz - camLook.current.z) * k2;
    }
    camera.lookAt(camLook.current);
  }

  return null;
}

export function HopscotchGame() {
  return (
    <group position={HOPSCOTCH_ORIGIN}>
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
      <Clouds material={THREE.MeshBasicMaterial}>
        <Cloud position={[-30, 27, -55]} speed={0.12} opacity={0.75} segments={24} bounds={[11, 3, 3]} color="#ffffff" />
      </Clouds>
      <World />
      <Board />
      <Player />
      <Director />
    </group>
  );
}
