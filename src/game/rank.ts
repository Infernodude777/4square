// ─────────────────────────────────────────────────────────────
//  RANKS — blacktop titles (Season 2)
//
//  Every court hands out a chalk title based on your best record.
//  Reach the top and you're a COURT KING; linger at the bottom
//  and you're a DODO. Rank tiers respect the record direction
//  ("low" kinds like hopscotch time get better as the number
//  shrinks), so the title always means "how good am I here?"
// ─────────────────────────────────────────────────────────────

export interface RankDef {
  title: string;
  emoji: string;
  tint: string;
}

export const RANK_TIERS: { at: number; rank: RankDef }[] = [
  { at: 0.00, rank: { title: "DODO",      emoji: "🐤", tint: "#9aa4b2" } },
  { at: 0.30, rank: { title: "CHALKER",   emoji: "✏️", tint: "#57d977" } },
  { at: 0.60, rank: { title: "COURT ACE", emoji: "🎾", tint: "#38d6d0" } },
  { at: 0.85, rank: { title: "COURT KING", emoji: "👑", tint: "#ffd23e" } },
];

/** The best rank tier for a 0..1 "score quality" fraction. */
export function rankForFraction(fraction: number): RankDef {
  let out = RANK_TIERS[0].rank;
  for (const tier of RANK_TIERS) {
    if (fraction >= tier.at) out = tier.rank;
  }
  return out;
}

/** Normalise a record value against the mode's typical ceiling. */
export function recordFraction(kind: "high" | "low", value: number): number {
  // High-kind: guess a friendly ceiling per value; anything at/above it
  // is full marks. Low-kind (times): shorter is better, floor at ~8 s.
  if (kind === "low") {
    const best = 8;
    return Math.max(0, Math.min(1, 1 - (value - best) / Math.max(1, value * 0.6)));
  }
  const ceiling = value <= 0 ? 1 : Math.max(30, value * 1.15);
  return Math.max(0, Math.min(1, value / ceiling));
}

/** Convenience: rank for a mode's record value (0 returns DODO). */
export function rankForRecord(kind: "high" | "low", value: number): RankDef {
  if (!value || value <= 0) return RANK_TIERS[0].rank;
  return rankForFraction(recordFraction(kind, value));
}
