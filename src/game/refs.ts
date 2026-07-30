import * as THREE from "three";
import type { EntityId, MoveId } from "./constants";

export type FaceState = "idle" | "alert" | "hit" | "out" | "happy" | "serve";

export interface EntRT {
  id: EntityId;
  pos: THREE.Vector3; // ground-plane position
  target: THREE.Vector3; // where the brain wants to be
  y: number; // jump height
  vy: number;
  crouch: boolean;
  moving: boolean;
  walkPhase: number;
  facing: number;
  swing: number; // seconds since last swing (large = idle)
  face: FaceState;
  faceUntil: number;
  hitCooldown: number;
  serveTimer: number;
  plan: BotPlan | null;
}

export interface BotPlan {
  miss: boolean;
  whiff: boolean;
  move: MoveId;
  aim: THREE.Vector3;
  react: number;
  bounceAt: number; // game time when legal bounce happened
}

export interface Leg {
  hitter: EntityId;
  isServe: boolean;
  serveBounced: boolean;
  firstBounced: boolean;
  receiver: EntityId | null;
  move: MoveId;
  quality: number; // timing quality of the stroke that started this leg
  createdAt: number;
  done: boolean;
}

export type BurstKind = "hit" | "perfect" | "dust" | "star";
export interface Burst {
  kind: BurstKind;
  pos: THREE.Vector3;
  color: string;
  at: number;
}

interface RT {
  time: number;
  entities: Record<EntityId, EntRT>;
  ball: {
    pos: THREE.Vector3;
    vel: THREE.Vector3;
    move: MoveId;
    curve: number; // lateral accel until first bounce
    active: boolean;
    grounded: number; // seconds rolling on the ground
    visible: boolean;
  };
  leg: Leg | null;
  serveStage: "idle" | "hold" | "tossed" | "armed";
  aim: THREE.Vector3;
  aimLegal: boolean;
  mouse: { x: number; y: number };
  input: {
    fwd: boolean;
    back: boolean;
    left: boolean;
    right: boolean;
    crouch: boolean;
    lob: boolean;
  };
  hitQueue: ("power" | "soft")[];
  bursts: Burst[];
  lastHitInfo: { move: MoveId; quality: number; at: number } | null;
  shake: number;
}

function mkEnt(id: EntityId, x: number, z: number): EntRT {
  return {
    id,
    pos: new THREE.Vector3(x, 0, z),
    target: new THREE.Vector3(x, 0, z),
    y: 0,
    vy: 0,
    crouch: false,
    moving: false,
    walkPhase: 0,
    facing: 0,
    swing: 9,
    face: "idle",
    faceUntil: 0,
    hitCooldown: 0,
    serveTimer: 0,
    plan: null,
  };
}

export const RT: RT = {
  time: 0,
  entities: {
    player: mkEnt("player", -2, -2),
    ada: mkEnt("ada", 2, 2),
    alan: mkEnt("alan", -6.4, -0.4),
    grace: mkEnt("grace", -2, 2),
    turing: mkEnt("turing", 2, -2),
  },
  ball: {
    pos: new THREE.Vector3(0, -10, 0),
    vel: new THREE.Vector3(),
    move: "drive",
    curve: 0,
    active: false,
    grounded: 0,
    visible: false,
  },
  leg: null,
  serveStage: "idle",
  aim: new THREE.Vector3(2, 0, 2),
  aimLegal: true,
  mouse: { x: 0, y: 0 },
  input: { fwd: false, back: false, left: false, right: false, crouch: false, lob: false },
  hitQueue: [],
  bursts: [],
  lastHitInfo: null,
  shake: 0,
};

export function setFace(id: EntityId, face: FaceState, dur = 1.4) {
  const e = RT.entities[id];
  e.face = face;
  e.faceUntil = RT.time + dur;
}

export function burst(kind: BurstKind, pos: THREE.Vector3, color: string) {
  RT.bursts.push({ kind, pos: pos.clone(), color, at: RT.time });
  if (RT.bursts.length > 24) RT.bursts.shift();
}
