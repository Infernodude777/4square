// ─────────────────────────────────────────────────────────────
//  KING'S RULES — house rules for foursquare (Season 3)
//
//  Real recess: the king calls the rules. Before every serve the
//  current king (human or bot) calls a house rule from the board —
//  no smashing, no drops, double points, bot charge, or a lightning
//  court where every ball flies faster. The rule stands for the
//  rally; the next serve the king may keep it or flip to something
//  new.
//
//  Rules are pure data + helpers so logic.ts stays dumb and the
//  whole thing is unit-testable.
// ─────────────────────────────────────────────────────────────

import type { MoveId } from "./constants";

export type RuleId = "nosmash" | "nodrops" | "double" | "botcharge" | "lightning";

export interface HouseRule {
  id: RuleId;
  name: string;
  desc: string;
  /** moves no one may play while the rule stands */
  banned?: MoveId[];
  /** score multiplier while the rule stands */
  scoreMul?: number;
  /** bot skill multiplier while the rule stands */
  botMul?: number;
  /** flight-time multiplier while the rule stands (lightning = faster) */
  speedMul?: number;
  /** chalk line the king scrawls when the rule lands */
  line: string;
}

export const HOUSE_RULES: Record<RuleId, HouseRule> = {
  nosmash: {
    id: "nosmash",
    name: "NO SMASHING",
    desc: "Power is banned. Smash the ball and you're out.",
    banned: ["smash"],
    line: "no smashing!!",
  },
  nodrops: {
    id: "nodrops",
    name: "NO DROPS",
    desc: "Drop shots are dead on this court. Keep it honest.",
    banned: ["drop"],
    line: "drop shots are FORBIDDEN",
  },
  double: {
    id: "double",
    name: "DOUBLE POINTS",
    desc: "Every point counts twice. Loud court, loud scores.",
    scoreMul: 2,
    line: "every point counts TWICE",
  },
  botcharge: {
    id: "botcharge",
    name: "BOT CHARGE",
    desc: "The robots got a pep talk. They're a little meaner now.",
    botMul: 1.2,
    line: "the robots got a pep talk…",
  },
  lightning: {
    id: "lightning",
    name: "LIGHTNING COURT",
    desc: "Every ball flies faster. No time to think, only swing.",
    speedMul: 0.85,
    line: "LIGHTNING COURT!!",
  },
};

export const RULE_IDS = Object.keys(HOUSE_RULES) as RuleId[];

export function ruleName(id: RuleId | null): string {
  return id ? HOUSE_RULES[id].name : "";
}

/** The chalk line the king scrawls (for the announce popup). */
export function ruleLine(id: RuleId | null): string {
  return id ? HOUSE_RULES[id].line : "";
}

/** 40% keep the standing rule, otherwise pick a fresh one. */
export function pickRule(current: RuleId | null): RuleId {
  if (current && Math.random() < 0.4) return current;
  const pool = RULE_IDS.filter((r) => r !== current);
  return pool[Math.floor(Math.random() * pool.length)];
}

/** True when the rule bans this stroke. */
export function isMoveBanned(rule: RuleId | null, move: MoveId): boolean {
  if (!rule) return false;
  return HOUSE_RULES[rule].banned?.includes(move) ?? false;
}

/** Score multiplier in effect under the rule. */
export function ruleScoreMul(rule: RuleId | null): number {
  return rule ? (HOUSE_RULES[rule].scoreMul ?? 1) : 1;
}

/** Bot skill multiplier in effect under the rule. */
export function ruleBotMul(rule: RuleId | null): number {
  return rule ? (HOUSE_RULES[rule].botMul ?? 1) : 1;
}

/** Flight-time multiplier in effect under the rule (lightning < 1). */
export function ruleSpeedMul(rule: RuleId | null): number {
  return rule ? (HOUSE_RULES[rule].speedMul ?? 1) : 1;
}
