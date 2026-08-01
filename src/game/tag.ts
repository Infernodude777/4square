import * as THREE from "three";

export type TagId = "player" | "ada" | "grace" | "alan" | "turing" | "ziggy";

export interface TagPerson {
  id: TagId;
  pos: THREE.Vector3;
  target: THREE.Vector3;
  facing: number;
  moving: boolean;
  walkPhase: number;
  stamina: number;
  taggedFlash: number;
  evasion: number;
  speed: number;
  color: string;
  accent: string;
  name: string;
  role: string;
}

export interface TagState {
  time: number;
  round: number;
  currentIt: TagId;
  tagCooldown: number;
  lastTagAt: number;
  score: number;
  escaped: number;
  phase: "ready" | "live" | "won";
  people: Record<TagId, TagPerson>;
  dust: { pos: THREE.Vector3; at: number; color: string }[];
}

const defs: Record<TagId, Omit<TagPerson, "id" | "pos" | "target" | "facing" | "moving" | "walkPhase" | "stamina" | "taggedFlash">> = {
  player: { name: "YOU", role: "sprinter", speed: 5.1, evasion: 0.8, color: "#2f6fdb", accent: "#ffd23e" },
  ada: { name: "ADA", role: "the calculator", speed: 4.7, evasion: 0.72, color: "#e2483d", accent: "#ffd23e" },
  grace: { name: "GRACE", role: "the cutter", speed: 5.0, evasion: 0.9, color: "#f7b32b", accent: "#233043" },
  alan: { name: "ALAN", role: "the decoy", speed: 4.35, evasion: 0.65, color: "#39b46a", accent: "#eaf6ff" },
  turing: { name: "TURING", role: "the juker", speed: 4.8, evasion: 0.84, color: "#8a5cf6", accent: "#ffe9a8" },
  ziggy: { name: "ZIGGY", role: "the sprinter", speed: 5.25, evasion: 0.94, color: "#18a9b8", accent: "#f5f1e8" },
};

const starts: Record<TagId, [number, number]> = {
  player: [0, 4.8], ada: [-5.4, -3.5], grace: [5.2, -3.7], alan: [-5.4, 3.6], turing: [5.2, 3.4], ziggy: [0, -4.8],
};

export function createTagState(): TagState {
  const people = {} as Record<TagId, TagPerson>;
  (Object.keys(defs) as TagId[]).forEach((id) => {
    const [x, z] = starts[id];
    people[id] = {
      id, pos: new THREE.Vector3(x, 0, z), target: new THREE.Vector3(x, 0, z), facing: Math.PI, moving: false, walkPhase: 0,
      stamina: 1, taggedFlash: 0, ...defs[id],
    };
  });
  return { time: 0, round: 1, currentIt: "ziggy", tagCooldown: 1.8, lastTagAt: -99, score: 0, escaped: 0, phase: "ready", people, dust: [] };
}

export const TAG_FIELD = { halfX: 7.2, halfZ: 6.5, tagRange: 0.82, sprintSpeed: 7.1, roundSeconds: 75, goal: 7 };

export function clampTagPosition(p: THREE.Vector3) {
  p.x = Math.max(-TAG_FIELD.halfX + 0.45, Math.min(TAG_FIELD.halfX - 0.45, p.x));
  p.z = Math.max(-TAG_FIELD.halfZ + 0.45, Math.min(TAG_FIELD.halfZ - 0.45, p.z));
}

export function nearestTagTarget(t: TagState, from: TagId, wantIt: boolean): TagPerson | null {
  const candidates = (Object.keys(t.people) as TagId[]).filter((id) => id !== from && (wantIt || id === t.currentIt));
  let best: TagPerson | null = null;
  let bestScore = wantIt ? Infinity : -Infinity;
  for (const id of candidates) {
    const p = t.people[id];
    const d = t.people[from].pos.distanceTo(p.pos);
    if (wantIt ? d < bestScore : d > bestScore) { best = p; bestScore = d; }
  }
  return best;
}

export function moveTagPerson(p: TagPerson, dt: number, sprint = false) {
  const dx = p.target.x - p.pos.x;
  const dz = p.target.z - p.pos.z;
  const d = Math.hypot(dx, dz);
  p.moving = d > 0.08;
  if (p.moving) {
    const speed = p.speed * (sprint ? TAG_FIELD.sprintSpeed / 5.1 : 1) * (0.72 + p.stamina * 0.28);
    const step = Math.min(d, speed * dt);
    p.pos.x += (dx / d) * step;
    p.pos.z += (dz / d) * step;
    p.walkPhase += dt * 10;
    p.facing = Math.atan2(dx, dz);
    p.stamina = Math.max(0, p.stamina - dt * (sprint ? 0.26 : 0.06));
  } else {
    p.stamina = Math.min(1, p.stamina + dt * 0.18);
  }
  clampTagPosition(p.pos);
}

export const TAG_IDS: TagId[] = ["player", "ada", "grace", "alan", "turing", "ziggy"];
