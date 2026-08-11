import { describe, expect, it } from "vitest";
import {
  createBState,
  startShot,
  releaseShot,
  stepB,
  SPOTS,
  MAX_LETTERS,
  SWISH_QUALITY,
  type BPhase,
  type BState,
} from "../basketball";

// Deterministic helpers: park the player at a spot and release with a
// chosen meter (0.72 → quality 1; 0 → quality 0).
function parkAndAim(t: BState, spot = 0) {
  const s = SPOTS[spot];
  t.playerPos.set(s.x, 0, s.z);
  expect(startShot(t, spot)).toBe(true);
  return t;
}

/** Step the state until it reaches `target` (or the game is over). */
function settle(t: BState, target: BPhase) {
  for (let i = 0; i < 600; i++) {
    stepB(t, 1 / 60);
    if (t.phase === target || t.phase === "over") break;
  }
  return t.phase;
}

describe("basketball H.O.R.S.E. state machine", () => {
  it("starts in pick phase, player's turn, no letters", () => {
    const t = createBState();
    expect(t.phase).toBe("pick");
    expect(t.turn).toBe(0);
    expect(t.letters[0]).toHaveLength(0);
    expect(t.letters[1]).toHaveLength(0);
    expect(t.winner).toBeNull();
  });

  it("free picks require standing near the spot", () => {
    const t = createBState();
    t.playerPos.set(10, 0, 10); // nowhere near any spot
    expect(startShot(t, 0)).toBe(false);
    expect(t.phase).toBe("pick");

    parkAndAim(t, 2);
    expect(t.phase).toBe("aim");
  });

  it("a challenged shot can start from anywhere, but only at the forced spot", () => {
    const t = createBState();
    t.forcedSpot = 3;
    t.playerPos.set(99, 0, 99); // far away — forced shots ignore distance
    expect(startShot(t, 3)).toBe(true);
    // wrong spot rejected
    t.phase = "pick" as BPhase;
    t.forcedSpot = 3;
    expect(startShot(t, 1)).toBe(false);
  });

  it("perfect meter always makes, empty meter always misses", () => {
    const t = parkAndAim(createBState(), 0);
    expect(releaseShot(t, 0.72)).toBe(true);
    expect(t.made).toBe(true);
    expect(t.quality).toBe(1);
    expect(t.phase).toBe("flight");

    const t2 = parkAndAim(createBState(), 0);
    releaseShot(t2, 0);
    expect(t2.made).toBe(false);
    expect(t2.quality).toBe(0);
  });

  it("a perfect release counts as a swish", () => {
    const t = parkAndAim(createBState(), 0);
    releaseShot(t, 0.72);
    expect(t.swishes).toBe(1);
    expect(t.quality >= SWISH_QUALITY).toBe(true);
  });

  it("a made free shot challenges the opponent on the same spot", () => {
    const t = parkAndAim(createBState(), 0);
    releaseShot(t, 0.72);
    expect(settle(t, "pick")).toBe("pick");
    expect(t.forcedSpot).toBe(0);
    expect(t.turn).toBe(1); // SLAM is now challenged
  });

  it("a missed forced shot earns a letter; five letters ends the game", () => {
    const t = createBState();
    // Drive the player to the edge of spelling defeat.
    for (let i = 0; i < MAX_LETTERS - 1; i++) {
      t.letters[0].push("H");
    }
    expect(t.winner).toBeNull();

    t.forcedSpot = 1;
    t.turn = 0;
    t.spotIdx = 1;
    t.phase = "aim" as BPhase;
    releaseShot(t, 0); // guaranteed miss
    expect(settle(t, "over")).toBe("over");

    expect(t.letters[0]).toHaveLength(MAX_LETTERS);
    expect(t.winner).toBe(1); // SLAM wins
    expect(t.phase).toBe("over");
  });

  it("a made forced shot clears the challenge and keeps the shooter", () => {
    const t = createBState();
    t.forcedSpot = 2;
    t.turn = 1;
    t.opPos.set(SPOTS[2].x, 0, SPOTS[2].z);
    t.spotIdx = 2;
    t.phase = "aim" as BPhase;
    releaseShot(t, 0.72);
    expect(settle(t, "pick")).toBe("pick");

    expect(t.forcedSpot).toBe(-1);
    expect(t.turn).toBe(1); // SLAM matched it — stays as free shooter
    expect(t.letters[1]).toHaveLength(0);
  });
});
