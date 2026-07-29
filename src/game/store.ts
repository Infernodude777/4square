import { create } from "zustand";
import { INITIAL_ASSIGN, INITIAL_LINE, sqOf, type EntityId } from "./constants";
import { sfx, setMuted } from "./audio";

export type Phase = "menu" | "play" | "point" | "win";

export interface Popup {
  id: number;
    text: string;
  tone: "gold" | "cyan" | "red" | "green" | "purple" | "white";
  big?: boolean;
}

let uid = 1;

interface GameState {
  phase: Phase;
  score: number;
  streak: number;
  bestStreak: number;
  hits: number;
  perfects: number;
  kos: number;
  rallies: number;
  assign: Record<number, EntityId>;
  line: EntityId;
  muted: boolean;
    popups: Popup[];
  start: () => void;
  toMenu: () => void;
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
  phase: "menu",
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

  start: () => {
    sfx.unlock();
    sfx.ui();
    set({
      phase: "play",
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
    });
},
  toMenu: () => {
    sfx.ui();
    set({ phase: "menu" });
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
      return {
        hits: s.hits + 1,
        perfects: s.perfects + (perfect ? 1 : 0),
                streak,
        bestStreak: Math.max(s.bestStreak, streak),
      };
    }),
  registerKO: () => set((s) => ({ kos: s.kos + 1 })),
  setPhase: (p) => set({ phase: p }),
  rallyInc: () => set((s) => ({ rallies: s.rallies + 1 })),
    toggleMute: () => {
    const m = !get().muted;
    setMuted(m);
    set({ muted: m });
    },
  win: () => {
    sfx.win();
    set({ phase: "win" });
  },
}));

  }
    }
      }
    })
  }
    })
  }    })
  }
}))
}
}