import { create } from "zustand";
import { INITIAL_ASSIGN, INITIAL_LINE, sqOf, type EntityId } from "./constants";
import { sfx, setMuted } from "./audio";
import { useSettings } from "./settings";
import { checkBadges } from "./achievements";

export type Phase = "hub" | "menu" | "play" | "point" | "win";
export type Mode = "foursquare" | "tetherball" | "wallball" | "tag" | "kickball";

export interface Popup {
  id: number;
  text: string;
  tone: "gold" | "cyan" | "red" | "green" | "purple" | "white";
  big?: boolean;
}

let uid = 1;

interface GameState {
  phase: Phase;
  mode: Mode;
  score: number;
  streak: number;
  bestStreak: number;
  hits: number;
  perfects: number;
  kos: number;
  rallies: number;
  wraps: number; // for tetherball: +ve = player winning, -ve = opponent winning
  fouls: number; // player fouls in tetherball
  opFouls: number;
  /** final wallball match tally for the victory screen */
  wallYou: number;
  wallBot: number;
  /** final kickball tally for the victory screen */
  kickYou: number;
  kickBot: number;
  /** true while the pause menu is open */
  paused: boolean;
  assign: Record<number, EntityId>;
  line: EntityId;
  muted: boolean;
  popups: Popup[];
  start: (mode?: Mode) => void;
  toMenu: () => void;
  setPaused: (p: boolean) => void;
  setWraps: (n: number) => void;
  setWallResult: (you: number, bot: number) => void;
  setKickResult: (you: number, bot: number) => void;
  addFoul: (who: "player" | "op") => void;
  addScore: (n: number) => void;
  popup: (text: string, tone?: Popup["tone"], big?: boolean) => void;
  dropPopup: (id: number) => void;
  rotate: (loser: EntityId) => void;
  registerHit: (perfect: boolean) => void;
  registerKO: () => void;
  setPhase: (p: Phase) => void;
  rallyInc: () => void;
  toggleMute: () => void;
  win: () => void;
}

export const useGame = create<GameState>((set, get) => ({
  phase: "hub",
  mode: "foursquare",
  wraps: 0,
  fouls: 0,
  opFouls: 0,
  wallYou: 0,
  wallBot: 0,
  kickYou: 0,
  kickBot: 0,
  paused: false,
  score: 0,
  streak: 0,
  bestStreak: 0,
  hits: 0,
  perfects: 0,
  kos: 0,
  rallies: 0,
  assign: { ...INITIAL_ASSIGN },
  line: INITIAL_LINE,
  muted: false,
  popups: [],

  start: (mode) => {
    sfx.unlock();
    sfx.ui();
    const next = mode ?? get().mode;
    const s = useSettings.getState();
    s.patchStats({ gamesPlayed: s.stats.gamesPlayed + 1 });
    checkBadges({ kind: "gameStart", mode: next });
    set({
      phase: "play",
      mode: next,
      score: 0,
      streak: 0,
      bestStreak: 0,
      hits: 0,
      perfects: 0,
      kos: 0,
      rallies: 0,
      wraps: 0,
      fouls: 0,
      opFouls: 0,
      wallYou: 0,
      wallBot: 0,
      kickYou: 0,
      kickBot: 0,
      paused: false,
      assign: { ...INITIAL_ASSIGN },
      line: INITIAL_LINE,
      popups: [],
    });
  },
  setWraps: (n) => set({ wraps: n }),
  setWallResult: (you, bot) => set({ wallYou: you, wallBot: bot }),
  setKickResult: (you, bot) => set({ kickYou: you, kickBot: bot }),
  setPaused: (p) => set({ paused: p }),
  addFoul: (who) =>
    set((s) => (who === "player" ? { fouls: s.fouls + 1 } : { opFouls: s.opFouls + 1 })),
  toMenu: () => {
    sfx.ui();
    set({ phase: "hub", paused: false });
  },
  addScore: (n) =>
    set((s) => {
      const score = Math.max(0, s.score + n);
      return { score };
    }),
  popup: (text, tone = "white", big = false) =>
    set((s) => ({ popups: [...s.popups.slice(-5), { id: uid++, text, tone, big }] })),
  dropPopup: (id) => set((s) => ({ popups: s.popups.filter((p) => p.id !== id) })),
  rotate: (loser) => {
    const { assign, line } = get();
    const s = sqOf(loser, assign);
    if (s === 0) return;
    const newAssign: Record<number, EntityId> = { ...assign };
    for (let i = s; i >= 2; i--) newAssign[i] = assign[i - 1];
    newAssign[1] = line;
    sfx.line();
    set({ assign: newAssign, line: loser });
  },
  registerHit: (perfect) =>
    set((s) => {
      const streak = perfect ? s.streak + 1 : 0;
      const stats = useSettings.getState().stats;
      useSettings
        .getState()
        .patchStats({
          totalHits: stats.totalHits + 1,
          totalPerfects: stats.totalPerfects + (perfect ? 1 : 0),
        });
      checkBadges({
        kind: "stats",
        perfects: s.perfects + (perfect ? 1 : 0),
        kos: s.kos,
        rallies: s.rallies,
        bestStreak: Math.max(s.bestStreak, streak),
        timePlayed: useSettings.getState().stats.timePlayed,
      });
      return {
        hits: s.hits + 1,
        perfects: s.perfects + (perfect ? 1 : 0),
        streak,
        bestStreak: Math.max(s.bestStreak, streak),
      };
    }),
  registerKO: () => {
    const stats = useSettings.getState().stats;
    useSettings.getState().patchStats({ totalKOs: stats.totalKOs + 1 });
    checkBadges({
      kind: "stats",
      perfects: get().perfects,
      kos: get().kos + 1,
      rallies: get().rallies,
      bestStreak: get().bestStreak,
      timePlayed: useSettings.getState().stats.timePlayed,
    });
    set((s) => ({ kos: s.kos + 1 }));
  },
  setPhase: (p) => set({ phase: p }),
  rallyInc: () =>
    set((s) => {
      const stats = useSettings.getState().stats;
      useSettings
        .getState()
        .patchStats({ totalRallies: stats.totalRallies + 1 });
      return { rallies: s.rallies + 1 };
    }),
  toggleMute: () => {
    const m = !get().muted;
    setMuted(m);
    set({ muted: m });
  },
  win: () => {
    sfx.win();
    const st = get();
    const mode = st.mode;
    const score = st.score;
    // record high score for the mode + lifetime win
    const settings = useSettings.getState();
    settings.recordScore(mode, score);
    settings.patchStats({ totalWins: settings.stats.totalWins + 1 });
    checkBadges({ kind: "modeWin", mode });
    set({ phase: "win" });
  },
}));
