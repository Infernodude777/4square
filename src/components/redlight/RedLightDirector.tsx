import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "../../game/store";
import { useSettings } from "../../game/settings";
import { rlStep, RL_START_Z, type RLStepEvents } from "../../game/redlight";
import { sfx, go, buzzer } from "../../game/audio";
import { RL, resetRL } from "./redlightState";

const keys = { w: false };

/**
 * Drives the red-light match. Reads W / ArrowUp as "trying to move",
 * steps the pure logic, and translates the event stream into popups,
 * sounds and the match end. The camera holds a clear overview of the
 * lane so the light and every runner are always in frame.
 */
export function RedLightDirector() {
  const { camera } = useThree();
  const phase = useGame((s) => s.phase);
  const difficulty = useSettings((s) => s.difficulty);
  const ended = useRef(false);

  useEffect(() => {
    resetRL(difficulty);
    ended.current = false;

    const down = (e: KeyboardEvent) => {
      if (e.code === "KeyW" || e.code === "ArrowUp") keys.w = true;
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "KeyW" || e.code === "ArrowUp") keys.w = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [difficulty]);

  useFrame((_, dtRaw) => {
    if (phase !== "play") return;
    const dt = Math.min(dtRaw, 0.04);
    const st = useGame.getState();

    const events: RLStepEvents = rlStep(RL.current, dt, { moving: keys.w });

    if (events.fault) {
      sfx.fault();
      st.popup("CAUGHT ON RED!", "red", true);
    }
    if (events.botCaught) {
      st.popup(`${events.botCaught.toUpperCase()} CAUGHT!`, "gold");
    }
    if (events.lightChanged === "green") {
      go();
    } else if (events.lightChanged === "red") {
      buzzer();
    }
    if (events.roundWin) {
      if (events.roundWin === "player") {
        st.popup("ROUND WON!", "green", true);
        sfx.cheer();
      } else {
        st.popup(`${events.roundWin.toUpperCase()} TOOK THIS ROUND`, "white");
      }
    }
    if (events.matchWin) {
      sfx.cheer();
      st.popup("GREEN LIGHT GOD!", "gold", true);
      if (!ended.current) {
        ended.current = true;
        const rounds = RL.current.runners.find((r) => r.isPlayer)?.roundWins ?? 0;
        st.setRedlightResult(true, rounds);
        setTimeout(() => {
          if (useGame.getState().phase === "play") useGame.getState().win();
        }, 1500);
      }
    }
    if (events.matchLose) {
      st.popup("RED LIGHT GOT YOU", "red", true);
      if (!ended.current) {
        ended.current = true;
        const rounds = RL.current.runners.find((r) => r.isPlayer)?.roundWins ?? 0;
        st.setRedlightResult(false, rounds);
        setTimeout(() => {
          if (useGame.getState().phase === "play") useGame.getState().win();
        }, 1500);
      }
    }

    // Camera: high, centered, looking down the lane.
    const look = new THREE.Vector3(0, 0.4, -1.5);
    const target = new THREE.Vector3(0, 8.6, RL_START_Z + 6.2);
    const k = 1 - Math.exp(-dt * 3.2);
    camera.position.lerp(target, k);
    camera.lookAt(look);
  });

  return null;
}
