// ─────────────────────────────────────────────────────────────
//  DAILY CHALLENGE — today's recess special
//
//  Every school day (well, every calendar day) the yard picks a
//  new challenge from a fixed pool. Progress is tracked in the
//  persisted settings store so it survives a page refresh. Finish
//  it before the bell (midnight) and you earn a badge + bonus.
//
//  The pool is deterministic per date, so the same day always
//  shows the same challenge — no re-rolling until tomorrow.
// ─────────────────────────────────────────────────────────────

export interface DailyDef {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  /** goal label shown on the card */
  goal: string;
  /** how to read progress from the daily counters */
  measure: (d: DailyCounters) => number;
  target: number;
}

export interface DailyCounters {
  plays: Record<string, number>;
  wins: Record<string, number>;
  perfects: number;
  totalWins: number;
  totalPlays: number;
}

export const emptyCounters = (): DailyCounters => ({
  plays: {},
  wins: {},
  perfects: 0,
  totalWins: 0,
  totalPlays: 0,
});

// Only modes actually shipped in this build may appear in the daily pool —
// otherwise the challenge could never be completed. All ten courts now
// ship (foursquare, tetherball, wallball, tag, kickball, basketball,
// dodgeball, gaga, hopscotch + the Season 2 red-light lane).
const MODES = ["foursquare", "tetherball", "wallball", "tag", "kickball", "basketball", "dodgeball", "gaga", "hopscotch", "redlight"];

// Keep in sync with the MODES pool above — only shipped modes get names here.
const MODE_NAMES: Record<string, string> = {
  foursquare: "Four Square", tetherball: "Tetherball", wallball: "Wallball",
  tag: "Tag", kickball: "Kickball", basketball: "Basketball",
  dodgeball: "Dodgeball", gaga: "Gaga Ball", hopscotch: "Hopscotch",
  redlight: "Red Light Green Light",
};

const POOL: (() => DailyDef)[] = [
  () => ({ id: "play-3", emoji: "🎒", title: "BELL RINGER", desc: "Get your reps in.", goal: "Play 3 games", measure: (d) => d.totalPlays, target: 3 }),
  () => ({ id: "win-2", emoji: "🏆", title: "DOUBLE WINS", desc: "Two dubs before the bell.", goal: "Win 2 games", measure: (d) => d.totalWins, target: 2 }),
  () => ({ id: "perfect-5", emoji: "⏱️", title: "CLEAN HANDS", desc: "Timing is everything.", goal: "Land 5 perfect hits", measure: (d) => d.perfects, target: 5 }),
  ...MODES.map((mode) => () => ({
    id: `win-${mode}`,
    emoji: "🎯",
    title: `${MODE_NAMES[mode].toUpperCase()} DAY`,
    desc: `The yard wants a ${MODE_NAMES[mode]} champion.`,
    goal: `Win a ${MODE_NAMES[mode]} match`,
    measure: (d: DailyCounters) => d.wins[mode] ?? 0,
    target: 1,
  })),
];

/** Deterministic pick for a given date string (YYYY-MM-DD). */
export function pickDaily(dateKey: string): DailyDef {
  let h = 0;
  for (let i = 0; i < dateKey.length; i++) h = (h * 31 + dateKey.charCodeAt(i)) | 0;
  const idx = Math.abs(h) % POOL.length;
  return POOL[idx]();
}

export function todayKey(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function dailyProgress(def: DailyDef, c: DailyCounters): number {
  return Math.min(1, def.measure(c) / def.target);
}

export function dailyMet(def: DailyDef, c: DailyCounters): boolean {
  return def.measure(c) >= def.target;
}

/** The daily challenge that should be active today. */
export function todayChallenge(): DailyDef {
  return pickDaily(todayKey());
}
