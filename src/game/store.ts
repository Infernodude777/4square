import { create } from "zustand";
import { INITIAL_ASSIGN, INITIAL_LINE, sqOf, type EntityId } from "./constants";
import { sfx } from "./audio";
import { useSettings, matchRecordValue, RECORD_META } from "./settings";
import { checkBadges } from "./achievements";
import { emoteRandomBot } from "./refs";

export type Phase = "hub" | "menu" | "play" | "point" | "win";
export type Mode =
  | "foursquare" | "tetherball" | "wallball" | "tag" | "kickball"
  | "basketball" | "dodgeball" | "gaga" | "hopscotch" | "redlight";

export interface Popup {
  id: number;
  text: string;
  tone: "gold" | "cyan" | "red" | "green" | "purple" | "white";
  big?: boolean;
}

let uid = 1;

/**
 * Popup display priority (L8) — big announcements (KO / WIN / PERFECT)
 * always beat small chatter, newest first, capped at 3 so bursty moments
 * never crowd the centre of the screen. Shared by every mode HUD.
 */
export function visiblePopups(popups: Popup[]): Popup[] {
  return [...popups]
    .sort((a, b) => Number(b.big ?? false) - Number(a.big ?? false) || b.id - a.id)
    .slice(0, 3);
}

interface GameState {
  phase: Phase;
  mode: Mode;
  /** incremented on every start() so scenes can remount for a clean restart */
  run: number;
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
  /** basketball H.O.R.S.E. letters + stats */
  hoopYou: number;
  hoopBot: number;
  hoopSwishes: number;
  hoopShots: number;
  /** dodgeball result */
  dodgeWon: boolean;
  dodgeBotsOut: number;
  /** gaga result */
  gagaWon: boolean;
  gagaBotsLeft: number;
  gagaTime: number;
  /** hopscotch result */
  hopTime: number;
  hopFaults: number;
  hopTimes: number[];
  /** red-light result (Season 2): rounds won by the player, out of 3 */
  rlWon: boolean;
  rlRounds: number;
  /** modes won this page-session (drives the BROOM SWEEP badge) */
  winsThisSession: string[];
  /** set by win() when the match's metric beat the old record */
  lastWinWasRecord: boolean;
  /** true while the pause menu is open */
  paused: boolean;
  assign: Record<number, EntityId>;
  line: EntityId;
  popups: Popup[];
  start: (mode?: Mode) => void;
  toMenu: () => void;
  setPaused: (p: boolean) => void;
  setWraps: (n: number) => void;
  setWallResult: (you: number, bot: number) => void;
  setKickResult: (you: number, bot: number) => void;
  setHoopResult: (you: number, bot: number, swishes: number, shots: number) => void;
  setDodgeResult: (won: boolean, botsOut: number) => void;
  setGagaResult: (won: boolean, botsLeft: number, time: number) => void;
  setHopscotchResult: (time: number, faults: number, times: number[]) => void;
  setRedlightResult: (won: boolean, rounds: number) => void;
  addCatch: () => void;
  addSwish: () => void;
  addFoul: (who: "player" | "op") => void;
  addScore: (n: number) => void;
  popup: (text: string, tone?: Popup["tone"], big?: boolean) => void;
  dropPopup: (id: number) => void;
  rotate: (loser: EntityId) => void;
  registerHit: (perfect: boolean) => void;
  registerKO: () => void;
  setPhase: (p: Phase) => void;
  rallyInc: () => void;
  win: () => void;
}

export const useGame = create<GameState>((set, get) => ({
  phase: "hub",
  mode: "foursquare",
  run: 0,
  wraps: 0,
  fouls: 0,
  opFouls: 0,
  wallYou: 0,
  wallBot: 0,
  kickYou: 0,
  kickBot: 0,
  hoopYou: 0,
  hoopBot: 0,
  hoopSwishes: 0,
  hoopShots: 0,
  dodgeWon: false,
  dodgeBotsOut: 0,
  gagaWon: false,
  gagaBotsLeft: 4,
  gagaTime: 0,
  hopTime: 0,
  hopFaults: 0,
  hopTimes: [],
  rlWon: false,
  rlRounds: 0,
  winsThisSession: [],
  lastWinWasRecord: false,
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
  popups: [],

  start: (mode) => {
    sfx.unlock();
    sfx.ui();
    const next = mode ?? get().mode;
    const s = useSettings.getState();
    s.patchStats({ gamesPlayed: s.stats.gamesPlayed + 1 });
    // Track which modes get played (for stats + the daily challenge).
    s.noteModePlay(next);
    s.noteDailyPlay(next);
    checkBadges({ kind: "gameStart", mode: next, modePlays: useSettings.getState().modePlays });
    set({
      phase: "play",
      mode: next,
      run: get().run + 1,
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
      hoopYou: 0,
      hoopBot: 0,
      hoopSwishes: 0,
      hoopShots: 0,
      dodgeWon: false,
      dodgeBotsOut: 0,
      gagaWon: false,
      gagaBotsLeft: 4,
      gagaTime: 0,
      hopTime: 0,
      hopFaults: 0,
      hopTimes: [],
      rlWon: false,
      rlRounds: 0,
      lastWinWasRecord: false,
      paused: false,
      assign: { ...INITIAL_ASSIGN },
      line: INITIAL_LINE,
      popups: [],
    });
  },
  setWraps: (n) => set({ wraps: n }),
  setWallResult: (you, bot) => set({ wallYou: you, wallBot: bot }),
  setKickResult: (you, bot) => set({ kickYou: you, kickBot: bot }),
  setHoopResult: (you, bot, swishes, shots) => set({ hoopYou: you, hoopBot: bot, hoopSwishes: swishes, hoopShots: shots }),
  setDodgeResult: (won, botsOut) => set({ dodgeWon: won, dodgeBotsOut: botsOut }),
  setGagaResult: (won, botsLeft, time) => set({ gagaWon: won, gagaBotsLeft: botsLeft, gagaTime: time }),
  setHopscotchResult: (time, faults, times) => set({ hopTime: time, hopFaults: faults, hopTimes: times }),
  setRedlightResult: (won, rounds) => set({ rlWon: won, rlRounds: rounds }),
  setPaused: (p) => set({ paused: p }),
  // Lifetime catch/swish counters feed the HOT HANDS / NET ONLY badges.
  addCatch: () => {
    const stats = useSettings.getState().stats;
    const count = stats.totalCatch + 1;
    useSettings.getState().patchStats({ totalCatch: count });
    checkBadges({ kind: "catch", count });
  },
  addSwish: () => {
    const stats = useSettings.getState().stats;
    const count = stats.totalSwishes + 1;
    useSettings.getState().patchStats({ totalSwishes: count });
    checkBadges({ kind: "swish", count });
  },
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
  registerHit: (perfect) => {
    // Lifetime stats + daily counters + badge checks fire OUTSIDE the store
    // update so the updater stays pure (nested cross-store set() calls inside
    // an updater are a footgun under middleware like devtools).
    const prev = get();
    const stats = useSettings.getState().stats;
    const streak = perfect ? prev.streak + 1 : 0;
    const nextBest = Math.max(prev.bestStreak, streak);
    const settings = useSettings.getState();
    settings.patchStats({
      totalHits: stats.totalHits + 1,
      totalPerfects: stats.totalPerfects + (perfect ? 1 : 0),
    });
    // A perfect hit counts toward today's recess special.
    if (perfect) settings.noteDailyPerfect();
    // Milestone badges compare against LIFETIME totals (see badge descs).
    const st = useSettings.getState();
    checkBadges({
      kind: "stats",
      perfects: st.stats.totalPerfects,
      kos: st.stats.totalKOs,
      rallies: st.stats.totalRallies,
      bestStreak: nextBest,
      timePlayed: st.stats.timePlayed,
    });
    // Season 2: the robots talk back on a crisp hit.
    if (perfect) emoteRandomBot("wow", 1.4);
    set({
      hits: prev.hits + 1,
      perfects: prev.perfects + (perfect ? 1 : 0),
      streak,
      bestStreak: nextBest,
    });
  },
  registerKO: () => {
    const stats = useSettings.getState().stats;
    useSettings.getState().patchStats({ totalKOs: stats.totalKOs + 1 });
    const st = useSettings.getState();
    checkBadges({
      kind: "stats",
      perfects: st.stats.totalPerfects,
      kos: st.stats.totalKOs,
      rallies: st.stats.totalRallies,
      bestStreak: get().bestStreak,
      timePlayed: st.stats.timePlayed,
    });
    emoteRandomBot("oof", 1.6);
    set((s) => ({ kos: s.kos + 1 }));
  },
  setPhase: (p) => set({ phase: p }),
  rallyInc: () => {
    const prev = get();
    const stats = useSettings.getState().stats;
    useSettings.getState().patchStats({ totalRallies: stats.totalRallies + 1 });
    // Keep rally milestones checked even for rallies that don't end in a
    // player hit (bots rally each other constantly).
    const st = useSettings.getState();
    checkBadges({
      kind: "stats",
      perfects: st.stats.totalPerfects,
      kos: st.stats.totalKOs,
      rallies: st.stats.totalRallies,
      bestStreak: prev.bestStreak,
      timePlayed: st.stats.timePlayed,
    });
    set({ rallies: prev.rallies + 1 });
  },
  win: () => {
    sfx.win();
    const st = get();
    const mode = st.mode;
    const settings = useSettings.getState();
    // Detect whether this match's metric beats the standing record BEFORE
    // recordResult mutates the table (the Victory card says "NEW RECORD!").
    const value = matchRecordValue(mode, st);
    const meta = RECORD_META[mode];
    const kind = meta?.kind ?? "high";
    const prevRec = settings.highScores[mode];
    const wasRecord =
      Number.isFinite(value) &&
      value >= 0 &&
      (prevRec === undefined || (kind === "low" ? value < prevRec : value > prevRec));
    // Record the per-mode metric + lifetime win. See RECORD_META in settings.
    settings.recordResult(mode, value);
    const wins = settings.stats.totalWins + 1;
    settings.patchStats({
      totalWins: wins,
      modeWins: { ...settings.stats.modeWins, [mode]: (settings.stats.modeWins[mode] ?? 0) + 1 },
    });
    // A win counts toward today's recess special.
    settings.noteDailyWin(mode);
    const winsThisSession = st.winsThisSession.includes(mode)
      ? st.winsThisSession
      : [...st.winsThisSession, mode];
    checkBadges({
      kind: "modeWin",
      mode,
      totalWins: wins,
      winsThisSession,
      score: st.score,
      hopFaults: st.hopFaults,
    });
    // Season 2: the robots congratulate (or sulk).
    emoteRandomBot("win", 2.0);
    set({ phase: "win", lastWinWasRecord: wasRecord, winsThisSession });
  },
}));
