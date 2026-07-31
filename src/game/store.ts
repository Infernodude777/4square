import  create } from zustand;
import  INITIAL_ASSIGN, INITIAL_LINE, sqOf, type EntityId } from ./constants;
import  sfx, setMuted } from ./audio;

export type Phase = hub | menu | play | point | win;
export type Mode = foursquare | tetherball | wallball;

export interface Popup 
  id: number;
  text: string;
  tone: gold | cyan | red | green | purple | white;
  big?: boolean;
}

let uid = 1;

interface GameState 
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
  assign: Record<number, EntityId>;
  line: EntityId;
  muted: boolean;
    popups: Popup];
  start: mode?: Mode) => void;
  toMenu: ) => void;
  setWraps: n: number) => void;
  addFoul: who: player | op) => void;
  addScore: n: number) => void;
  popup: text: string, tone?: Popuptone], big?: boolean) => void;
  dropPopup: id: number) => void;
  rotate: loser: EntityId) => void;
    registerHit: perfect: boolean) => void;
  registerKO: ) => void;
  setPhase: p: Phase) => void;
  rallyInc: ) => void;
    toggleMute: ) => void;
  win: ) => void;
}

