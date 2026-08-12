import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createDebouncedStorage } from "./persist";

// ─────────────────────────────────────────────────────────────
//  ACHIEVEMENTS & BADGES
//
//  A badge wall for the whole yard. Each badge has an id, a name,
//  a one-line description and a little chalk emoji. Badges unlock
//  permanently (persisted) and the latest unlock pushes a toast
//  onto a queue that the <BadgeToast/> overlay drains.
//
//  Game code reports events through checkBadges(event), which is
//  called from store actions and directors. Keeping the checks in
//  ONE place makes the badge rules easy to read and extend.
// ─────────────────────────────────────────────────────────────

export interface BadgeDef {
  id: string;
  name: string;
  desc: string;
  emoji: string;
  /** hidden until earned */
  secret?: boolean;
}

export const BADGES: BadgeDef[] = [
  // ── original five modes ──
  { id: "first-kick",  name: "FIRST KICK",      desc: "Play a game of kickball",              emoji: "🦵" },
  { id: "homer",       name: "MOON SHOT",       desc: "Hit a home run in kickball",          emoji: "🌕" },
  { id: "triple",      name: "CIRCUIT",         desc: "Round the bases on one kick",         emoji: "🔺" },
  { id: "kick-win",    name: "FIELD GENERAL",   desc: "Win a kickball game",                 emoji: "🏆" },
  { id: "tether-win",  name: "POLE KING",       desc: "Win a tetherball duel",               emoji: "🎯" },
  { id: "wall-win",    name: "WALL MASTER",     desc: "Beat ZIGGY at wallball",              emoji: "🧱" },
  { id: "tag-win",     name: "EVASIVE",         desc: "Win a round of tag",                  emoji: "🏃" },
  { id: "fs-win",      name: "RECESS KING",     desc: "Win a foursquare match",              emoji: "👑" },
  // ── the new courts ──
  { id: "hoop-win",    name: "SWISH GOD",       desc: "Win a basketball H.O.R.S.E. duel",    emoji: "🏀" },
  { id: "dodge-win",   name: "DODGEBALL CHAMP", desc: "Clear the court in dodgeball",        emoji: "🥎" },
  { id: "gaga-win",    name: "PIT BOSS",        desc: "Survive the gaga pit",                emoji: "🤾" },
  { id: "hop-win",     name: "CHALK LEGEND",    desc: "Beat the bots at hopscotch",          emoji: "🦘" },
  { id: "redlight-win", name: "LIGHT RUNNER",   desc: "Beat the bots at Red Light Green Light", emoji: "🚦" },
  // ── milestones ──
  { id: "perfect-10",  name: "TIMING GURU",     desc: "Land 10 perfect hits total",          emoji: "⏱️" },
  { id: "ko-5",        name: "SLEDGE",          desc: "Knock out 5 opponents total",         emoji: "💥" },
  { id: "rally-50",    name: "HEART OF THE RALLY", desc: "Play 50 rallies total",            emoji: "🔄" },
  { id: "streak-8",    name: "UNSTOPPABLE",     desc: "Reach an 8-hit streak",               emoji: "🔥" },
  { id: "catch-5",     name: "HOT HANDS",       desc: "Make 5 catches in dodgeball",         emoji: "🧤" },
  { id: "swish-10",    name: "NET ONLY",        desc: "Sink 10 swishes in basketball",       emoji: "🌠" },
  { id: "century",     name: "TRIPLE DIGITS",   desc: "Score 100+ in a single match",        emoji: "💯" },
  { id: "no-fault",    name: "IRON SHOES",      desc: "Win hopscotch without one fault",     emoji: "🧦", secret: true },
  { id: "first-win",   name: "FIRST BLOOD",     desc: "Win your very first match",           emoji: "🩸", secret: true },
  { id: "sweep-3",     name: "BROOM SWEEP",     desc: "Win 3 different modes in one recess", emoji: "🧹", secret: true },
  { id: "full-roster", name: "FULL ROSTER",     desc: "Play every court in the yard",        emoji: "📋", secret: true },
  { id: "daily",       name: "BELL RINGER",     desc: "Complete today's recess special",     emoji: "🔔" },
  { id: "lifer",       name: "LIFER",           desc: "Spend 30 minutes at recess",          emoji: "⏰", secret: true },
  { id: "marathon",    name: "RECESS LEGEND",   desc: "Spend 2 hours at recess",             emoji: "⏳", secret: true },
  { id: "pentathlete", name: "PENTATHLETE",     desc: "Win the original five modes",         emoji: "🎖️", secret: true },
  { id: "superstar",   name: "SUPERSTAR",       desc: "Win every mode at least once",        emoji: "🌟", secret: true },
  // ── Season 3: the school bell ──
  { id: "schools-out", name: "SCHOOL'S OUT",    desc: "Hear the final bell ring",            emoji: "🏫" },
  { id: "overtime",    name: "OVERTIME",        desc: "Keep playing when the bell rings",    emoji: "🌙", secret: true },
];

export type BadgeEvent =
  | { kind: "modeWin"; mode: string; totalWins?: number; winsThisSession?: string[]; score?: number; hopFaults?: number }
  | { kind: "gameStart"; mode: string; modePlays?: Record<string, number> }
  | { kind: "homerun" }
  | { kind: "triple" }
  | { kind: "catch"; count: number }
  | { kind: "swish"; count: number }
  | { kind: "dailyDone" }
  | { kind: "bell"; overtime?: boolean }
  | { kind: "stats"; perfects: number; kos: number; rallies: number; bestStreak: number; timePlayed: number }
  | { kind: "reset" };

interface BadgeState {
  unlocked: string[];
  toasts: { id: number; badge: BadgeDef }[];
  unlock: (id: string) => void;
  dismiss: (id: number) => void;
  reset: () => void;
}

let toastUid = 1;

export const useBadges = create<BadgeState>()(
  persist(
    (set, get) => ({
      unlocked: [],
      toasts: [],
      unlock: (id) => {
        if (get().unlocked.includes(id)) return;
        const badge = BADGES.find((b) => b.id === id);
        if (!badge) return;
        set((s) => ({
          unlocked: [...s.unlocked, id],
          toasts: [...s.toasts.slice(-2), { id: toastUid++, badge }],
        }));
      },
      dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      reset: () => set({ unlocked: [], toasts: [] }),
    }),
    {
      name: "recess-royale-badges-v1",
      // v1: persist ONLY the unlocked list — toasts are transient UI and
      // must never re-hydrate as stale notifications on a later visit.
      version: 1,
      migrate: (persisted) => {
        const p = (persisted ?? {}) as { unlocked?: unknown };
        const unlocked = Array.isArray(p.unlocked)
          ? (p.unlocked as unknown[]).filter(
              (id): id is string => typeof id === "string" && BADGES.some((b) => b.id === id),
            )
          : [];
        return { unlocked };
      },
      partialize: (s) => ({ unlocked: s.unlocked }),
      storage: createDebouncedStorage(),
    },
  ),
);

/** The mode→badge mapping used by modeWin events. */
const MODE_BADGE: Record<string, string> = {
  kickball: "kick-win",
  tetherball: "tether-win",
  wallball: "wall-win",
  tag: "tag-win",
  foursquare: "fs-win",
  basketball: "hoop-win",
  dodgeball: "dodge-win",
  gaga: "gaga-win",
  hopscotch: "hop-win",
  redlight: "redlight-win",
};

/** The original five modes — the pentathlete set. */
const ORIGINAL_FIVE = ["kickball", "tetherball", "wallball", "tag", "foursquare"];

/**
 * Route a gameplay event through the badge rules. Called from store
 * actions (wins, stats), kickball internals (homers, triples) and the
 * new-mode directors (catches, swishes).
 */
export function checkBadges(ev: BadgeEvent) {
  const { unlock, unlocked } = useBadges.getState();

  switch (ev.kind) {
    case "modeWin": {
      const bid = MODE_BADGE[ev.mode];
      if (bid) unlock(bid);
      // Pentathlete — every ORIGINAL mode badge earned.
      const allOriginal = ORIGINAL_FIVE.map((m) => MODE_BADGE[m]);
      if (allOriginal.every((b) => unlocked.includes(b) || b === bid)) {
        unlock("pentathlete");
      }
      // Superstar — every mode badge earned.
      const allModes = Object.values(MODE_BADGE);
      if (allModes.every((b) => unlocked.includes(b) || b === bid)) {
        unlock("superstar");
      }
      // Milestone badges.
      if (ev.totalWins === 1) unlock("first-win");
      const session = new Set(ev.winsThisSession ?? []).size;
      if (session >= 3) unlock("sweep-3");
      if ((ev.score ?? 0) >= 100) unlock("century");
      if (ev.mode === "hopscotch" && ev.hopFaults === 0) unlock("no-fault");
      break;
    }
    case "gameStart": {
      if (ev.mode === "kickball") unlock("first-kick");
      // Full roster — every shipped court has been stepped on.
      const played = ev.modePlays ?? {};
      if (Object.keys(MODE_BADGE).every((m) => (played[m] ?? 0) > 0)) {
        unlock("full-roster");
      }
      break;
    }
    case "homerun":
      unlock("homer");
      break;
    case "triple":
      unlock("triple");
      break;
    case "catch":
      // HOT HANDS — lifetime catches, matching the badge description.
      if (ev.count >= 5) unlock("catch-5");
      break;
    case "swish":
      // NET ONLY — lifetime swishes, matching the badge description.
      if (ev.count >= 10) unlock("swish-10");
      break;
    case "dailyDone":
      unlock("daily");
      break;
    case "bell":
      // Season 3 — the final bell rang. Overtime only counts if a
      // match was actually live when it did.
      unlock("schools-out");
      if (ev.overtime) unlock("overtime");
      break;
    case "stats":
      if (ev.perfects >= 10) unlock("perfect-10");
      if (ev.kos >= 5) unlock("ko-5");
      if (ev.rallies >= 50) unlock("rally-50");
      if (ev.bestStreak >= 8) unlock("streak-8");
      if (ev.timePlayed >= 1800) unlock("lifer");
      if (ev.timePlayed >= 7200) unlock("marathon");
      break;
    case "reset":
      useBadges.getState().reset();
      break;
  }
}
