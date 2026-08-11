import { describe, expect, it } from "vitest";
import {
  HOME_Z,
  ballInWindow,
  createKickState,
  kickTick,
  plateProgress,
  stepKick,
} from "../kickball";
import type { KickState } from "../kickball";

/** Step at 60 Hz until `predicate` is true (or bail out at maxSteps). */
function stepUntil(k: KickState, predicate: () => boolean, maxSteps = 500): number {
  let i = 0;
  while (i < maxSteps && !predicate()) {
    stepKick(k, 1 / 60);
    i++;
  }
  return i;
}

describe("kickball", () => {
  it("moves from countdown into a rolling pitch", () => {
    const k = createKickState();
    expect(k.phase).toBe("countdown");
    stepUntil(k, () => k.phase === "pitch", 250);
    expect(k.phase).toBe("pitch");
    expect(k.ball.state).toBe("roll");
    expect(k.ball.vel.z).toBeGreaterThan(0);
  });

  it("a ball left alone past the plate is a strike", () => {
    const k = createKickState();
    stepUntil(k, () => k.phase === "pitch", 250);
    stepUntil(k, () => k.ball.pos.z > HOME_Z + 0.5, 150);
    expect(k.strikes).toBe(1);
    expect(k.phase).toBe("point");
  });

  it("three strikes retire the batter", () => {
    const k = createKickState();
    let pitches = 0;
    let guard = 0;
    while (k.outs === 0 && guard++ < 10) {
      stepUntil(k, () => k.phase === "pitch", 400);
      stepUntil(k, () => k.ball.pos.z > HOME_Z + 0.5, 200);
      pitches++;
      stepUntil(k, () => k.phase === "pitch", 250);
    }
    expect(pitches).toBe(3);
    expect(k.outs).toBe(1);
    expect(k.strikes).toBe(0); // fresh count next batter
  });

  it("a perfect-timed power kick is a home run and scores", () => {
    const k = createKickState();
    stepUntil(k, () => k.phase === "pitch", 250);
    // Park the ball dead-centre on the plate and stop the roll so the
    // next step's drift can't knock the timing off perfect.
    k.ball.pos.z = HOME_Z;
    k.ball.vel.set(0, 0, 0);
    kickTick(k, "power");
    stepKick(k, 1 / 60); // contact resolves this step
    expect(k.outcome?.kind).toBe("homerun");
    expect(k.phase).toBe("live");
    expect(k.runner.target).toBe(4);

    // Let the fielding dramatisation play out — the run must be banked.
    stepUntil(k, () => k.phase !== "live", 600);
    expect(k.runsYou).toBe(1);
    expect(k.phase).toBe("point");
  });

  it("kicks only land while the ball is on the plate", () => {
    const k = createKickState();
    stepUntil(k, () => k.phase === "pitch", 250);
    k.ball.pos.z = HOME_Z;
    expect(ballInWindow(k)).toBe(true);
    expect(plateProgress(k)).toBeCloseTo(1, 1);

    k.ball.pos.z = HOME_Z - 1.0;
    expect(ballInWindow(k)).toBe(false);
    expect(plateProgress(k)).toBeLessThan(0.2);
  });

  it("kicking out of phase is ignored", () => {
    const k = createKickState();
    kickTick(k, "power"); // countdown — no-op
    expect(k.kickQueued).toBeNull();
  });
});
