// ─────────────────────────────────────────────────────────────
//  TAG — three randomised playground variants
//
//  REGULAR TAG
//    One player is "it". They chase everyone. Tag someone → they
//    become "it". The player who has been "it" the shortest total
//    time when the round timer expires wins.  No elimination.
//
//  FREEZE TAG
//    One player is "it". Tagged players FREEZE (arms spread).
//    Any unfrozen non-it player can unfreeze a frozen teammate
//    by touching them. "It" wins if all others are frozen
//    simultaneously. Others win if they survive the round timer.
//
//  BLOB TAG
//    One player is "it" (the Blob). Each tag grows the Blob —
//    the tagged player joins hands (becomes part of the chain).
//    The Blob must stay connected. Only the two END players of
//    the chain can tag. Last free player wins.
//
//  SHARED RULES
//    • Court: the full schoolyard blacktop, 24 × 24 m.
//    • "It" immunity: 2 s after being tagged before they can be
//      re-tagged (prevents passing it back instantly).
//    • Round timer: 60 s. At expiry, roles/scores are tallied.
//    • Player can run with WASD, sprint by holding Shift.
// ─────────────────────────────────────────────────────────────

export type TagMode = "regular" | "freeze" | "blob";

export const TAG_YARD_HALF = 11.5;   // playable half-width (m)
export const TAG_REACH     = 1.35;   // tag range (m)
export const ROUND_TIME    = 60;     // seconds
export const IT_IMMUNITY   = 2.0;    // seconds after being tagged before you can be re-tagged
export const FREEZE_UNFREEZE_R = 1.4; // range for unfreezing in freeze tag
export const SPRINT_MUL    = 1.65;

// ── Bot definitions ────────────────────────────────────────────
export interface TagBot {
  name:    string;
  colour:  string;
  jersey:  string;
  accent:  string;
  skin:    string;
  tag:     string;
  speed:   number;   // m/s base run speed
  react:   number;   // reaction delay (s) — lower = faster brain
  fear:    number;   // 0..1 how cautiously they avoid "it"
  brave:   number;   // 0..1 how likely to unfreeze a teammate (freeze tag)
}

export const BOTS: Record<string, TagBot> = {
  rex: {
    name: "REX",  colour: "#e2483d", jersey: "#e2483d", accent: "#ffd23e", skin: "#c7d0dc",
    tag: "always \"it\"", speed: 4.8, react: 0.10, fear: 0.35, brave: 0.55,
  },
  ziggy: {
    name: "ZIGGY", colour: "#ff8a3c", jersey: "#ff8a3c", accent: "#fff0d0", skin: "#c7d0dc",
    tag: "wall master",  speed: 5.0, react: 0.08, fear: 0.28, brave: 0.40,
  },
  ada: {
    name: "ADA",   colour: "#4f8ef7", jersey: "#4f8ef7", accent: "#fff", skin: "#b8bfc7",
    tag: "math wiz",     speed: 4.5, react: 0.18, fear: 0.62, brave: 0.75,
  },
  grace: {
    name: "GRACE", colour: "#39b46a", jersey: "#39b46a", accent: "#eaf6ff", skin: "#b8bfc7",
    tag: "surgeon",      speed: 4.3, react: 0.22, fear: 0.70, brave: 0.88,
  },
  alan: {
    name: "ALAN",  colour: "#b58cff", jersey: "#b58cff", accent: "#ffe9a8", skin: "#b8bfc7",
    tag: "lobber",       speed: 3.9, react: 0.30, fear: 0.80, brave: 0.60,
  },
};

export const BOT_IDS = Object.keys(BOTS) as (keyof typeof BOTS)[];

// ── Entity state ───────────────────────────────────────────────
export interface TagEntity {
  id:       string;
  isPlayer: boolean;
  pos:      { x: number; z: number };
  facing:   number;
  walkPhase: number;
  moving:   boolean;
  y:        number;    // crouch / jump offset (unused in tag but kept for rig)
  // Tag game state
  isIt:     boolean;
  frozen:   boolean;   // freeze tag only
  blobIdx:  number;    // blob tag: position in blob chain (-1 = free)
  immunity: number;    // seconds of post-tag immunity remaining
  itTime:   number;    // total seconds spent as "it" this round
  // Blob tag chain linkage
  blobPrev: string | null;   // id of entity behind in chain
  blobNext: string | null;   // id of entity ahead in chain
}

export interface TagState {
  mode:     TagMode;
  phase:    "countdown" | "play" | "end";
  time:     number;         // total time (s) since scene started
  roundTimer: number;       // seconds remaining in round
  countdown: number;        // 3..1 pre-round countdown
  entities: Record<string, TagEntity>;
  itId:     string;         // current "it" entity id (regular & freeze)
  blobHead: string | null;  // blob tag: head of blob chain
  blobSize: number;         // blob tag: chain length
  winnerMsg: string;
  banner:   string;
  bannerAt: number;
}

function makeEntity(id: string, x: number, z: number, isPlayer: boolean): TagEntity {
  return {
    id, isPlayer, pos: { x, z },
    facing: 0, walkPhase: 0, moving: false, y: 0,
    isIt: false, frozen: false, blobIdx: -1,
    immunity: 0, itTime: 0,
    blobPrev: null, blobNext: null,
  };
}

/** Pick a random spawn so no two entities start at the same spot. */
function spawnRing(n: number, r = 5.0): { x: number; z: number }[] {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return { x: Math.cos(a) * r, z: Math.sin(a) * r };
  });
}

export function createTagState(): TagState {
  const modes: TagMode[] = ["regular", "freeze", "blob"];
  const mode = modes[Math.floor(Math.random() * modes.length)];
  const spawns = spawnRing(6, 5.5);

  const entities: Record<string, TagEntity> = {};
  entities["player"] = makeEntity("player", spawns[0].x, spawns[0].z, true);
  BOT_IDS.forEach((id, i) => {
    entities[id] = makeEntity(id, spawns[i + 1].x, spawns[i + 1].z, false);
  });

  // Choose first "it" — always a bot, never the player at start.
  const itId = BOT_IDS[Math.floor(Math.random() * BOT_IDS.length)];
  entities[itId].isIt = true;
  if (mode === "blob") {
    entities[itId].blobIdx = 0;
  }

  return {
    mode,
    phase: "countdown",
    time: 0,
    roundTimer: ROUND_TIME,
    countdown: 3,
    entities,
    itId,
    blobHead: mode === "blob" ? itId : null,
    blobSize: mode === "blob" ? 1 : 0,
    winnerMsg: "",
    banner: modeTitle(mode),
    bannerAt: 0,
  };
}

export function modeTitle(m: TagMode): string {
  if (m === "regular") return "REGULAR TAG";
  if (m === "freeze")  return "FREEZE TAG";
  return "BLOB TAG";
}

export function modeDesc(m: TagMode): string {
  if (m === "regular") return "Avoid being IT. Spend the least time as IT to win.";
  if (m === "freeze")  return "Freeze everyone — or survive until time runs out!";
  return "The Blob grows with every tag. Be the last one free!";
}

// ── Blob chain helpers ──────────────────────────────────────────
export function blobCanTag(e: TagEntity, allEntities: Record<string, TagEntity>): boolean {
  // Only the HEAD and TAIL of the blob chain can tag.
  if (e.blobIdx < 0) return false;
  const members = blobMembers(allEntities);
  return e.blobIdx === 0 || e.blobIdx === members.length - 1;
}

export function blobMembers(all: Record<string, TagEntity>): TagEntity[] {
  return Object.values(all)
    .filter(e => e.blobIdx >= 0)
    .sort((a, b) => a.blobIdx - b.blobIdx);
}

export function blobEndPos(all: Record<string, TagEntity>): { x: number; z: number } {
  const m = blobMembers(all);
  return m.length > 0 ? m[m.length - 1].pos : { x: 0, z: 0 };
}

// ── Check round end ─────────────────────────────────────────────
export function checkRoundEnd(t: TagState): boolean {
  if (t.phase !== "play") return false;
  if (t.roundTimer <= 0) {
    endRound(t);
    return true;
  }
  if (t.mode === "freeze") {
    const all = Object.values(t.entities);
    const nonIt = all.filter(e => !e.isIt);
    if (nonIt.length > 0 && nonIt.every(e => e.frozen)) {
      t.winnerMsg = t.entities[t.itId].isPlayer ? "YOU WIN — ALL FROZEN!" : `${t.entities[t.itId].id.toUpperCase()} WINS`;
      endRound(t);
      return true;
    }
  }
  if (t.mode === "blob") {
    const free = Object.values(t.entities).filter(e => e.blobIdx < 0);
    if (free.length === 0) {
      t.winnerMsg = "BLOB SWALLOWS EVERYONE!";
      endRound(t);
      return true;
    }
    if (free.length === 1 && free[0].isPlayer) {
      t.winnerMsg = "YOU'RE THE LAST ONE FREE!";
      endRound(t);
      return true;
    }
  }
  return false;
}

function endRound(t: TagState) {
  t.phase = "end";
  if (!t.winnerMsg) {
    if (t.mode === "regular") {
      const least = Object.values(t.entities).reduce((a, b) => a.itTime < b.itTime ? a : b);
      t.winnerMsg = least.isPlayer ? "YOU WIN — Least time as IT!" : `${least.id.toUpperCase()} wins · Least IT time`;
    } else if (t.mode === "freeze") {
      t.winnerMsg = "SURVIVORS WIN — Time ran out!";
    } else {
      t.winnerMsg = "LAST FREE WINS!";
    }
  }
}
