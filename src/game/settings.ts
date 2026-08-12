import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setMuted, setVolume } from "./audio";
import { setMusicVolume as applyMusicVolume } from "./music";
import { emptyCounters, todayKey, dailyMet, todayChallenge, type DailyCounters } from "./daily";
import { checkBadges } from "./achievements";
import { createDebouncedStorage } from "./persist";

// ─────────────────────────────────────────────────────────────
//  SETTINGS & PERSISTENCE
//
//  A single zustand store (persisted to localStorage) that holds
//  everything a returning recess kid would expect to survive a
//  page refresh:
//    • audio volume + mute + music volume
//    • screen-shake toggle + particle toggle
//    • aim sensitivity + reticle style
//    • difficulty (scales every mode's bots)
//    • quality preset (shadows / pixel ratio / FX density)
//    • high scores per game mode
//    • lifetime stats (games, time, hits, perfects, KOs, …)
//    • the daily-challenge counters
//    • bells heard (Season 3 — the school day's final bell)
//
//  The store is deliberately decoupled from the game loop — game
//  code reads it with useSettings.getState() and the UI subscribes
//  with the useSettings() hook.
// ─────────────────────────────────────────────────────────────

export type Difficulty = "chill" | "classic" | "fierce";
export type ReticleStyle = "classic" | "dot" | "cross";
export type Quality = "low" | "medium" | "high";

export const DIFFICULTY_INFO: Record<Difficulty, { label: string; hint: string }> = {
  chill:   { label: "CHILL",   hint: "Bots take it easy. Good for learning the ropes." },
  classic: { label: "CLASSIC", hint: "The proper schoolyard pace. Balanced." },
  fierce:  { label: "FIERCE",  hint: "Dodge, duck, dip, dive… and dodge." },
};

export const RETICLE_INFO: Record<ReticleStyle, { label: string; hint: string }> = {
  classic: { label: "RING",    hint: "The classic pulsing ring." },
  dot:     { label: "DOT",     hint: "A clean, precise dot." },
  cross:   { label: "CROSS",   hint: "Four-point crosshair." },
};

export const QUALITY_INFO: Record<Quality, { label: string; hint: string }> = {
  low:    { label: "LOW",    hint: "No shadows, lighter pixels, fewer FX." },
  medium: { label: "MEDIUM", hint: "The schoolyard sweet spot." },
  high:   { label: "HIGH",   hint: "Shadows, crisp pixels, all the confetti." },
};

// ── per-mode Hall-of-Records metadata (P0-1) ──────────────────
// Every court has its own "record" metric. Foursquare/tether/wallball
// record points, kickball records runs, basketball records swishes,
// dodgeball records bots-out, gaga records time survived, red-light
// records rounds won, and hopscotch records BEST TIME — where LOWER is
// better. The old model recorded a single `score` that was 0 for six of
// the nine modes, so the Hall of Fame showed "Best: 0 pts" and hopscotch
// (a time!) recorded with Math.max — i.e. the WORST time. RECORD_META is
// the single source of truth; every display (HallOfFame, Settings,
// Victory) reads it.
export interface RecordMeta {
  /** "high" = bigger is better, "low" = smaller is better (time). */
  kind: "high" | "low";
  label: string;
  unit: string;
  format?: (v: number) => string;
}

export const RECORD_META: Record<string, RecordMeta> = {
  foursquare: { kind: "high", label: "Points",    unit: "pts" },
  tetherball: { kind: "high", label: "Points",    unit: "pts" },
  wallball:   { kind: "high", label: "Points",    unit: "pts" },
  kickball:   { kind: "high", label: "Runs",      unit: "runs" },
  basketball: { kind: "high", label: "Swishes",   unit: "swishes" },
  dodgeball:  { kind: "high", label: "Bots out",  unit: "outs" },
  gaga:       { kind: "high", label: "Survived",  unit: "s" },
  hopscotch:  { kind: "low",  label: "Best time", unit: "s", format: (v) => v.toFixed(1) },
  redlight:   { kind: "high", label: "Rounds won", unit: "rds" },
};

/** Format a record value with its unit for display. */
export function formatRecord(mode: string, value: number): string {
  const meta = RECORD_META[mode];
  if (!meta) return String(value);
  const n = meta.format ? meta.format(value) : String(Math.round(value));
  return `${n} ${meta.unit}`;
}

/** The per-mode metric a finished match should be recorded as. */
export function matchRecordValue(mode: string, fields: {
  score: number;
  kickYou: number;
  hoopSwishes: number;
  dodgeBotsOut: number;
  gagaTime: number;
  hopTime: number;
  rlRounds: number;
}): number {
  switch (mode) {
    case "kickball":   return fields.kickYou;
    case "basketball": return fields.hoopSwishes;
    case "dodgeball":  return fields.dodgeBotsOut;
    case "gaga":       return fields.gagaTime;
    case "hopscotch":  return fields.hopTime;
    case "redlight":   return fields.rlRounds;
    default:           return fields.score;
  }
}
export interface LifetimeStats {
  gamesPlayed: number;
  timePlayed: number;      // seconds inside matches
  totalHits: number;
  totalPerfects: number;
  totalKOs: number;
  totalRallies: number;
  totalWins: number;
  totalRuns: number;       // kickball runs scored
  totalCatch: number;      // dodgeball catches
  totalSwishes: number;    // basketball swishes
  /** Season 3: how many times the 3:00 PM bell has rung on your watch */
  bellsHeard: number;
  /** per-mode win tally — powers the Hall of Fame win rates (Season 2) */
  modeWins: Record<string, number>;
}

const INITIAL_STATS: LifetimeStats = {
  gamesPlayed: 0,
  timePlayed: 0,
  totalHits: 0,
  totalPerfects: 0,
  totalKOs: 0,
  totalRallies: 0,
  totalWins: 0,
  totalRuns: 0,
  totalCatch: 0,
  totalSwishes: 0,
  bellsHeard: 0,
  modeWins: {},
};

export interface DailyState {
  key: string;
  counters: DailyCounters;
  done: boolean;
}

interface SettingsState {
  volume: number;
  muted: boolean;
  musicVolume: number;
  screenShake: boolean;
  particles: boolean;
  aimSensitivity: number;
  reticleStyle: ReticleStyle;
  difficulty: Difficulty;
  quality: Quality;
  highScores: Record<string, number>;
  stats: LifetimeStats;
  modePlays: Record<string, number>;
  daily: DailyState;
  /** true once the title screen has been dismissed (P1-1). */
  hasStarted: boolean;

  setVolume: (v: number) => void;
  toggleMute: () => void;
  setMusicVolume: (v: number) => void;
  toggleShake: () => void;
  toggleParticles: () => void;
  setSensitivity: (v: number) => void;
  setReticle: (r: ReticleStyle) => void;
  setDifficulty: (d: Difficulty) => void;
  setQuality: (q: Quality) => void;
  recordResult: (mode: string, value: number) => void;
  startSession: () => void;
  patchStats: (p: Partial<LifetimeStats>) => void;
  addTime: (dt: number) => void;
  noteModePlay: (mode: string) => void;
  noteBell: (overtime?: boolean) => void;
  resetStats: () => void;

  noteDailyPlay: (mode: string) => void;
  noteDailyWin: (mode: string) => void;
  noteDailyPerfect: () => void;
  resetDailyIfStale: () => void;
  resetAll: () => void;
}

// ── persisted-shape hygiene ───────────────────────────────────
// The ten shipped courts. Keys for anything else are stale leftovers
// from removed modes — pruned on load so the Hall of Records never
// shows ghosts. Declared BEFORE the store: zustand hydrates synchronously
// at module evaluation, so anything the migrate() closure touches must
// already be initialized (a const declared below would be in the TDZ).
const SHIPPED_MODES = [
  "foursquare", "tetherball", "wallball", "tag", "kickball",
  "basketball", "dodgeball", "gaga", "hopscotch", "redlight",
];

function pruneRecord(rec: unknown): Record<string, number> {
  if (!rec || typeof rec !== "object") return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(rec)) {
    if (SHIPPED_MODES.includes(k) && typeof v === "number" && Number.isFinite(v)) out[k] = v;
  }
  return out;
}

/** Roll the daily counters over to a new day when the date changes. */
function freshDaily(): DailyState {
  return { key: todayKey(), counters: emptyCounters(), done: false };
}

/**
 * When a daily counter update crosses the challenge's target, mark the day
 * done and pop the BELL RINGER badge (idempotent — safe to call repeatedly).
 */
function withDailyCompletion(daily: DailyState, counters: DailyCounters): DailyState {
  if (daily.done) return daily;
  if (dailyMet(todayChallenge(), counters)) {
    checkBadges({ kind: "dailyDone" });
    return { ...daily, counters, done: true };
  }
  return { ...daily, counters };
}

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      volume: 0.55,
      muted: false,
      musicVolume: 0.42,
      screenShake: true,
      particles: true,
      aimSensitivity: 1,
      reticleStyle: "classic",
      difficulty: "classic",
      quality: "high",
      highScores: {},
      stats: { ...INITIAL_STATS },
      modePlays: {},
      daily: freshDaily(),
      hasStarted: false,

      setVolume: (v) => {
        const volume = Math.max(0, Math.min(1, v));
        setVolume(volume);
        set({ volume });
      },
      toggleMute: () => {
        const muted = !get().muted;
        setMuted(muted);
        set({ muted });
      },
      setMusicVolume: (v) => {
        const musicVolume = Math.max(0, Math.min(1, v));
        applyMusicVolume(musicVolume);
        set({ musicVolume });
      },
      toggleShake: () => set((s) => ({ screenShake: !s.screenShake })),
      toggleParticles: () => set((s) => ({ particles: !s.particles })),
      setSensitivity: (v) => set({ aimSensitivity: Math.max(0.4, Math.min(2.5, v)) }),
      setReticle: (reticleStyle) => set({ reticleStyle }),
      setDifficulty: (difficulty) => set({ difficulty }),
      setQuality: (quality) => set({ quality }),

      // Record a finished match's metric. Respects the per-mode direction
      // (low-kind = time, where smaller beats bigger) and ignores junk.
      recordResult: (mode, value) =>
        set((s) => {
          const meta = RECORD_META[mode];
          const kind = meta?.kind ?? "high";
          if (!Number.isFinite(value) || value < 0 || (kind === "low" && value <= 0)) {
            return {};
          }
          const prev = s.highScores[mode];
          const better =
            prev === undefined || (kind === "low" ? value < prev : value > prev);
          return better
            ? { highScores: { ...s.highScores, [mode]: value } }
            : {};
        }),

      // Dismiss the title screen permanently (P1-1).
      startSession: () => set({ hasStarted: true }),

      patchStats: (p) =>
        set((s) => ({
          stats: { ...s.stats, ...p },
        })),

      addTime: (dt) =>
        set((s) => ({
          stats: { ...s.stats, timePlayed: s.stats.timePlayed + dt },
        })),

      noteModePlay: (mode) =>
        set((s) => ({
          modePlays: { ...s.modePlays, [mode]: (s.modePlays[mode] ?? 0) + 1 },
        })),

      // Season 3 — the final bell rang. Tally it and let the badge wall
      // know (overtime = a match was live when the bell went).
      noteBell: (overtime) => {
        const s = get();
        set({ stats: { ...s.stats, bellsHeard: s.stats.bellsHeard + 1 } });
        checkBadges({ kind: "bell", overtime });
      },

      resetStats: () =>
        set(() => ({
          stats: { ...INITIAL_STATS },
          highScores: {},
          modePlays: {},
        })),

      resetAll: () => {
        // Nuke everything — lifetime stats, records, mode plays, today's
        // daily counters, and every unlocked badge (checkBadges handles the
        // badge store). The confirm step lives in the Settings UI.
        checkBadges({ kind: "reset" });
        set(() => ({
          stats: { ...INITIAL_STATS },
          highScores: {},
          modePlays: {},
          daily: freshDaily(),
        }));
      },

      // ── daily challenge counters ──
      resetDailyIfStale: () => {
        const s = get();
        if (s.daily.key !== todayKey()) set({ daily: freshDaily() });
      },
      noteDailyPlay: (mode) => {
        get().resetDailyIfStale();
        set((s) => ({
          daily: withDailyCompletion(s.daily, {
            ...s.daily.counters,
            plays: { ...s.daily.counters.plays, [mode]: (s.daily.counters.plays[mode] ?? 0) + 1 },
            totalPlays: s.daily.counters.totalPlays + 1,
          }),
        }));
      },
      noteDailyWin: (mode) => {
        get().resetDailyIfStale();
        set((s) => ({
          daily: withDailyCompletion(s.daily, {
            ...s.daily.counters,
            wins: { ...s.daily.counters.wins, [mode]: (s.daily.counters.wins[mode] ?? 0) + 1 },
            totalWins: s.daily.counters.totalWins + 1,
          }),
        }));
      },
      noteDailyPerfect: () => {
        get().resetDailyIfStale();
        set((s) => ({
          daily: withDailyCompletion(s.daily, {
            ...s.daily.counters,
            perfects: s.daily.counters.perfects + 1,
          }),
        }));
      },
    }),
    {
      name: "recess-royale-settings-v1",
      // Bump whenever the persisted shape changes. migrate() below runs
      // on load for older stored states.
      version: 5,
      // v4 → v5 (Season 3): stats.bellsHeard + the SCHOOL'S OUT / OVERTIME
      // badges. Old stores simply get the new defaults; nothing converts.
      // v3 → v4 (Season 2): musicVolume + quality presets + per-mode win
      // tallies + the red-light lane's record.
      migrate: (persisted) => {
        const p = (persisted ?? {}) as Partial<SettingsState> & Record<string, unknown>;
        const stats: LifetimeStats = {
          ...INITIAL_STATS,
          ...(p.stats ?? {}),
          modeWins: pruneRecord(((p.stats as { modeWins?: unknown } | undefined)?.modeWins) ?? {}),
        };
        const counters = p.daily?.counters;
        const daily: DailyState =
          p.daily && p.daily.key === todayKey()
            ? { key: p.daily.key, counters: { ...emptyCounters(), ...counters }, done: !!p.daily.done }
            : freshDaily();
        const highScores = pruneRecord(p.highScores);
        for (const [m, meta] of Object.entries(RECORD_META)) {
          if (meta.kind === "low" && highScores[m] === 0) delete highScores[m];
        }
        return {
          ...p,
          hasStarted: !!p.hasStarted,
          musicVolume: typeof p.musicVolume === "number" ? p.musicVolume : 0.42,
          quality: p.quality === "low" || p.quality === "medium" || p.quality === "high" ? p.quality : "high",
          stats,
          highScores,
          modePlays: pruneRecord(p.modePlays),
          daily,
        } as SettingsState;
      },
      // Rally ticks hit the store several times a second — batch the
      // localStorage writes instead of stringifying on every single one.
      storage: createDebouncedStorage(),
    },
  ),
);

// ── Difficulty scaling helpers ────────────────────────────────
// Bots in every mode multiply their base skill by this factor.
export function skillFactor(): number {
  const d = useSettings.getState().difficulty;
  if (d === "chill") return 0.82;
  if (d === "fierce") return 1.18;
  return 1;
}

/** Kickball bot-batting runs scored per inning, by difficulty. */
export function botInningRuns(): number {
  const d = useSettings.getState().difficulty;
  const max = d === "chill" ? 1 : d === "fierce" ? 3 : 2;
  return Math.floor(Math.random() * (max + 1));
}

/** Kickball pitch speed (m/s) by difficulty — chill = easy to time. */
export function pitchSpeed(): number {
  const d = useSettings.getState().difficulty;
  if (d === "chill") return 3.2;
  if (d === "fierce") return 4.9;
  return 4.0;
}

/** Wallball / tag / tether reaction multiplier — lower = meaner bots. */
export function botReactionFactor(): number {
  const d = useSettings.getState().difficulty;
  if (d === "chill") return 1.35;
  if (d === "fierce") return 0.8;
  return 1;
}
