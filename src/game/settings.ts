import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setMuted, setVolume } from "./audio";
import { emptyCounters, todayKey, type DailyCounters } from "./daily";

// ─────────────────────────────────────────────────────────────
//  SETTINGS & PERSISTENCE
//
//  A single zustand store (persisted to localStorage) that holds
//  everything a returning recess kid would expect to survive a
//  page refresh:
//    • audio volume + mute
//    • screen-shake toggle + particle toggle
//    • aim sensitivity + reticle style
//    • difficulty (scales every mode's bots)
//    • high scores per game mode
//    • lifetime stats (games, time, hits, perfects, KOs, …)
//    • the daily-challenge counters
//
//  The store is deliberately decoupled from the game loop — game
//  code reads it with useSettings.getState() and the UI subscribes
//  with the useSettings() hook.
// ─────────────────────────────────────────────────────────────

export type Difficulty = "chill" | "classic" | "fierce";
export type ReticleStyle = "classic" | "dot" | "cross";

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
};

export interface DailyState {
  key: string;
  counters: DailyCounters;
  done: boolean;
}

interface SettingsState {
  volume: number;
  muted: boolean;
  screenShake: boolean;
  particles: boolean;
  aimSensitivity: number;
  reticleStyle: ReticleStyle;
  difficulty: Difficulty;
  highScores: Record<string, number>;
  stats: LifetimeStats;
  modePlays: Record<string, number>;
  daily: DailyState;

  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShake: () => void;
  toggleParticles: () => void;
  setSensitivity: (v: number) => void;
  setReticle: (r: ReticleStyle) => void;
  setDifficulty: (d: Difficulty) => void;
  recordScore: (mode: string, score: number) => void;
  patchStats: (p: Partial<LifetimeStats>) => void;
  addTime: (dt: number) => void;
  noteModePlay: (mode: string) => void;
  resetStats: () => void;

  noteDailyPlay: (mode: string) => void;
  noteDailyWin: (mode: string) => void;
  noteDailyPerfect: () => void;
  completeDaily: () => void;
  resetDailyIfStale: () => void;
}

/** Roll the daily counters over to a new day when the date changes. */
function freshDaily(): DailyState {
  return { key: todayKey(), counters: emptyCounters(), done: false };
}

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      volume: 0.55,
      muted: false,
      screenShake: true,
      particles: true,
      aimSensitivity: 1,
      reticleStyle: "classic",
      difficulty: "classic",
      highScores: {},
      stats: { ...INITIAL_STATS },
      modePlays: {},
      daily: freshDaily(),

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
      toggleShake: () => set((s) => ({ screenShake: !s.screenShake })),
      toggleParticles: () => set((s) => ({ particles: !s.particles })),
      setSensitivity: (v) => set({ aimSensitivity: Math.max(0.4, Math.min(2.5, v)) }),
      setReticle: (reticleStyle) => set({ reticleStyle }),
      setDifficulty: (difficulty) => set({ difficulty }),

      recordScore: (mode, score) =>
        set((s) => ({
          highScores: {
            ...s.highScores,
            [mode]: Math.max(s.highScores[mode] ?? 0, score),
          },
        })),

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

      resetStats: () =>
        set(() => ({
          stats: { ...INITIAL_STATS },
          highScores: {},
          modePlays: {},
        })),

      // ── daily challenge counters ──
      resetDailyIfStale: () => {
        const s = get();
        if (s.daily.key !== todayKey()) set({ daily: freshDaily() });
      },
      noteDailyPlay: (mode) => {
        get().resetDailyIfStale();
        set((s) => ({
          daily: {
            ...s.daily,
            counters: {
              ...s.daily.counters,
              plays: { ...s.daily.counters.plays, [mode]: (s.daily.counters.plays[mode] ?? 0) + 1 },
              totalPlays: s.daily.counters.totalPlays + 1,
            },
          },
        }));
      },
      noteDailyWin: (mode) => {
        get().resetDailyIfStale();
        set((s) => ({
          daily: {
            ...s.daily,
            counters: {
              ...s.daily.counters,
              wins: { ...s.daily.counters.wins, [mode]: (s.daily.counters.wins[mode] ?? 0) + 1 },
              totalWins: s.daily.counters.totalWins + 1,
            },
          },
        }));
      },
      noteDailyPerfect: () => {
        get().resetDailyIfStale();
        set((s) => ({
          daily: {
            ...s.daily,
            counters: { ...s.daily.counters, perfects: s.daily.counters.perfects + 1 },
          },
        }));
      },
      completeDaily: () =>
        set((s) => ({
          daily: { ...s.daily, done: true },
        })),
    }),
    { name: "recess-royale-settings-v1" },
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
