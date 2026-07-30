// ── Court & physics ─────────────────────────────────────────────
export const COURT_HALF = 4; // full court is 8m × 8m
export const Q_HALF = 2; // each quadrant is 2m half-width
export const GRAVITY = 18;
export const BALL_R = 0.16;
export const TARGET_SCORE = 30;

// quadrant centers, index = square number (1..4). Square 1 is camera-side left.
export const SQ_CENTER: [number, number][] = [
  [0, 0],
  [-Q_HALF, -Q_HALF], // 1
  [Q_HALF, -Q_HALF], // 2
  [-Q_HALF, Q_HALF], // 3
  [Q_HALF, Q_HALF], // 4  (KING)
];

export const SQ_COLORS = ["#000", "#4f8ef7", "#f7b32b", "#39b46a", "#e2483d"];

export function squareAt(x: number, z: number): number | null {
  if (Math.abs(x) > COURT_HALF || Math.abs(z) > COURT_HALF) return null;
  const sx = x < 0 ? -1 : 1;
  const sz = z < 0 ? -1 : 1;
  if (sx < 0 && sz < 0) return 1;
  if (sx > 0 && sz < 0) return 2;
  if (sx < 0 && sz > 0) return 3;
  return 4;
}

export function sqOf(id: string, assign: Record<number, string>): number {
  for (let s = 1; s <= 4; s++) if (assign[s] === id) return s;
  return 0; // 0 ⇒ waiting in line
}

// ── Moves ───────────────────────────────────────────────────────
export type MoveId = "drive" | "skimmer" | "smash" | "lob" | "drop";

export interface MoveDef {
  name: string;
  T: number; // flight time to target (s)
  rest: number; // vertical restitution off the asphalt
  fric: number; // horizontal friction on bounce (skid)
  color: string;
  err: number; // inherent inaccuracy
  idealY: number; // ideal contact height
  win: number; // timing window half-size
  desc: string;
  key: string;
}

export const MOVES: Record<MoveId, MoveDef> = {
  drive: {
    name: "DRIVE",
    T: 0.82,
    rest: 0.6,
    fric: 0.78,
    color: "#f4c542",
    err: 0.1,
    idealY: 0.8,
    win: 0.85,
    desc: "The trusty flat shot. Solid pace, honest bounce.",
    key: "CLICK · standing",
  },
  skimmer: {
    name: "SKIMMER",
    T: 0.52,
    rest: 0.14,
    fric: 0.97,
    color: "#38d6d0",
    err: 0.13,
    idealY: 0.2,
    win: 0.45,
    desc: "Crouch + hit. Low, fast, skids off the blacktop.",
    key: "HOLD C + CLICK",
  },
  smash: {
    name: "SMASH",
    T: 0.4,
    rest: 0.62,
    fric: 0.7,
    color: "#ff5a3c",
    err: 0.28,
    idealY: 2.05,
    win: 1.05,
    desc: "Jump + hit a high ball. Pound it straight down.",
    key: "SPACE + CLICK",
  },
  lob: {
    name: "LOB",
    T: 1.5,
    rest: 0.55,
    fric: 0.6,
    color: "#b58cff",
    err: 0.05,
    idealY: 1.0,
    win: 1.15,
    desc: "Moon-shot. Nearly unmissable, gives bots time.",
    key: "HOLD SHIFT + CLICK",
  },
  drop: {
    name: "DROP SHOT",
    T: 0.5,
    rest: 0.16,
    fric: 0.4,
    color: "#8ae06b",
    err: 0.2,
    idealY: 0.8,
    win: 0.95,
    desc: "Feather-soft. Dies right over the line.",
    key: "RIGHT CLICK",
  },
};

// ── Roster ──────────────────────────────────────────────────────
export type EntityId = "player" | "ada" | "alan" | "grace" | "turing";

export interface BotDef {
  name: string;
  short: string;
  color: string;
  accent: string;
  screen: string;
  skill: number; // 0..1
  speed: number;
  tag: string;
  aggression: number; // smash/skimmer preference
}

export const BOTS: Record<Exclude<EntityId, "player">, BotDef> = {
  ada: {
    name: "ADA",
    short: "ADA",
    color: "#e2483d",
    accent: "#ffd23e",
    screen: "#1a0e0c",
    skill: 0.96,
    speed: 4.6,
    tag: "math wiz",
    aggression: 0.85,
  },
  grace: {
    name: "GRACE",
    short: "GRACE",
    color: "#f7b32b",
    accent: "#233043",
    screen: "#171207",
    skill: 0.91,
    speed: 4.2,
    tag: "surgeon",
    aggression: 0.6,
  },
  alan: {
    name: "ALAN",
    short: "ALAN",
    color: "#39b46a",
    accent: "#eaf6ff",
    screen: "#0a1710",
    skill: 0.85,
    speed: 3.85,
    tag: "lobber",
    aggression: 0.3,
  },
  turing: {
    name: "TURIN",
    short: "TURIN",
    color: "#8a5cf6",
    accent: "#ffe9a8",
    screen: "#120a1e",
    skill: 0.79,
    speed: 3.6,
    tag: "wildcard",
    aggression: 0.7,
  },
};

export const INITIAL_ASSIGN: Record<number, EntityId> = {
  1: "player",
  2: "turing",
  3: "grace",
  4: "ada",
};
export const INITIAL_LINE: EntityId = "alan";

export const LINE_SPOT: [number, number] = [-6.4, -0.4];
