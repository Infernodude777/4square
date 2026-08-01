import * as THREE from "three";

export type KickId = "player" | "ada" | "grace" | "alan" | "turing" | "ziggy";

export interface KickPerson {
  id: KickId;
  pos: THREE.Vector3;
  target: THREE.Vector3;
  facing: number;
  moving: boolean;
  walkPhase: number;
  color: string;
  accent: string;
  name: string;
}

export interface KickState {
  time: number;
  inning: number;
  outs: number;
  runs: number;
  kicks: number;
  phase: "ready" | "pitch" | "flight" | "point" | "won";
  ballPos: THREE.Vector3;
  ballVel: THREE.Vector3;
  ballVisible: boolean;
  ballOnGround: boolean;
  playerPos: THREE.Vector3;
  aim: THREE.Vector3;
  pitcher: KickPerson;
  people: Record<KickId, KickPerson>;
  banner: string;
  bannerAt: number;
}

const palette: Record<KickId, { name: string; color: string; accent: string }> = {
  player: { name: "YOU", color: "#2f6fdb", accent: "#ffd23e" },
  ada: { name: "ADA", color: "#e2483d", accent: "#ffd23e" },
  grace: { name: "GRACE", color: "#f7b32b", accent: "#233043" },
  alan: { name: "ALAN", color: "#39b46a", accent: "#eaf6ff" },
  turing: { name: "TURING", color: "#8a5cf6", accent: "#ffe9a8" },
  ziggy: { name: "ZIGGY", color: "#18a9b8", accent: "#f5f1e8" },
};

const fieldStarts: Record<KickId, [number, number]> = {
  player: [0, 5.2], ada: [-5.4, -1.5], grace: [4.9, -2.2], alan: [-5.6, 3.1], turing: [5.5, 3.4], ziggy: [0, -4.3],
};

function makePerson(id: KickId): KickPerson {
  const [x, z] = fieldStarts[id];
  return { id, pos: new THREE.Vector3(x, 0, z), target: new THREE.Vector3(x, 0, z), facing: Math.PI, moving: false, walkPhase: 0, ...palette[id] };
}

export function createKickState(): KickState {
  const people = {} as Record<KickId, KickPerson>;
  (Object.keys(palette) as KickId[]).forEach((id) => { people[id] = makePerson(id); });
  return {
    time: 0, inning: 1, outs: 0, runs: 0, kicks: 0, phase: "ready",
    ballPos: new THREE.Vector3(0, 1.0, -4.0), ballVel: new THREE.Vector3(), ballVisible: true, ballOnGround: false,
    playerPos: people.player.pos.clone(), aim: new THREE.Vector3(0, 0, -4), pitcher: people.ziggy,
    people, banner: "", bannerAt: -99,
  };
}

export const KICK_FIELD = { halfX: 7.2, nearZ: 6.1, farZ: -6.4, kickRange: 1.15, winRuns: 5, maxOuts: 3 };
export const KICK_IDS: KickId[] = ["player", "ada", "grace", "alan", "turing", "ziggy"];

export function resetKickPeople(t: KickState) {
  (Object.keys(t.people) as KickId[]).forEach((id) => {
    const [x, z] = fieldStarts[id];
    t.people[id].pos.set(x, 0, z);
    t.people[id].target.set(x, 0, z);
    t.people[id].moving = false;
    t.people[id].walkPhase = 0;
  });
  t.playerPos.copy(t.people.player.pos);
}

export function beginPitch(t: KickState) {
  t.phase = "pitch";
  t.ballVisible = true;
  t.ballOnGround = false;
  t.ballPos.set(t.pitcher.pos.x, 1.05, t.pitcher.pos.z + 0.65);
  t.ballVel.set(0, 0, 3.2);
  t.banner = "PITCH INCOMING";
  t.bannerAt = t.time;
}

export function moveKickPerson(p: KickPerson, dt: number, speed = 4.6) {
  const dx = p.target.x - p.pos.x;
  const dz = p.target.z - p.pos.z;
  const d = Math.hypot(dx, dz);
  p.moving = d > 0.06;
  if (!p.moving) return;
  const step = Math.min(d, speed * dt);
  p.pos.x += dx / d * step;
  p.pos.z += dz / d * step;
  p.facing = Math.atan2(dx, dz);
  p.walkPhase += dt * 9;
}

export function clampKickField(p: THREE.Vector3) {
  p.x = Math.max(-KICK_FIELD.halfX + 0.35, Math.min(KICK_FIELD.halfX - 0.35, p.x));
  p.z = Math.max(KICK_FIELD.farZ + 0.45, Math.min(KICK_FIELD.nearZ - 0.45, p.z));
}
