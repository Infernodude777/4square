// ─────────────────────────────────────────────────────────────
//  RED LIGHT, GREEN LIGHT — runtime state (Season 2)
//
//  Following the yard-wide convention: a pure logic module in
//  game/ owns the rules (redlight.ts) and a mutable-ref singleton
//  here holds the live state the render layer reads every frame.
//  The Director mutates it; the Scene/Players/HUD only read.
// ─────────────────────────────────────────────────────────────

import { createRLState, type RLState } from "../../game/redlight";

export const RL: { current: RLState } = {
  current: createRLState(),
};

/** Fresh state for a new match (keeps the difficulty in sync). */
export function resetRL(difficulty: "chill" | "classic" | "fierce") {
  RL.current = createRLState(difficulty);
}
