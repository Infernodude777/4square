import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setMuted, setVolume } from "./audio";

// ─────────────────────────────────────────────────────────────
//  SETTINGS & PERSISTENCE
//
//  A single zustand store (persisted to localStorage) that holds
//  everything a returning recess kid would expect to survive a
//  page refresh:
//    • audio volume + mute
//    • screen-shake toggle
//    • difficulty (scales bot skill + kickball bot batting)
//    • high scores per game mode
//    • lifetime stats (games, time, hits, perfects, KOs, …)
//
//  The store is deliberately decoupled from the game loop — game
//  code reads it with useSettings.getState() and the UI subscribes
//  with the useSettings() hook.
// ─────────────────────────────────────────────────────────────

export type Difficulty = "chill" | "classic" | "fierce";

export const DIFFICULTY_INFO: Record<Difficulty, { label: string; hint: string }> = {
  chill:   { label: "CHILL",   hint: "Bots take it easy. Good for learning the ropes." },
  classic: { label: "CLASSIC", hint: "The proper schoolyard pace. Balanced." },
  fierce:  { label: "FIERCE",  hint: "Dodge, duck, dip, dive… and dodge." },
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
};

interface SettingsState {
  volume: number;
  muted: boolean;
  screenShake: boolean;
  difficulty: Difficulty;
  highScores: Record<string, number>;
  stats: LifetimeStats;

  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShake: () => void;
  setDifficulty: (d: Difficulty) => void;
  recordScore: (mode: string, score: number) => void;
  patchStats: (p: Partial<LifetimeStats>) => void;
  addTime: (dt: number) => void;
  resetStats: () => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      volume: 0.55,
      muted: false,
      screenShake: true,
      difficulty: "classic",
      highScores: {},
      stats: { ...INITIAL_STATS },

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

      resetStats: () =>
        set(() => ({
          stats: { ...INITIAL_STATS },
          highScores: {},
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
