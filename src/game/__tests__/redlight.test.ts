import { describe, expect, it } from "vitest";
import {
  createRLState,
  rlBeginRound,
  rlStep,
  lightColor,
  RL_START_Z,
  RL_FINISH_Z,
  RL_HEARTS,
  RL_ROUNDS_TO_WIN,
  type RLState,
} from "../redlight";

function toRunning(): RLState {
  const t = createRLState("classic");
  rlBeginRound(t);
  // Run the 3-2-1 countdown.
  for (let i = 0; i < 240; i++) {
    rlStep(t, 1 / 60, { moving: false });
    if (t.phase === "running") break;
  }
  expect(t.phase).toBe("running");
  return t;
}

describe("red light green light", () => {
  it("begins with a countdown into a green light", () => {
    const t = createRLState("classic");
    expect(t.phase).toBe("intro");
    rlStep(t, 0.5, { moving: false });
    expect(t.phase).toBe("countdown");
    // The countdown phase keeps the light showing green.
    expect(lightColor(t)).toBe("green");

    let ran = false;
    for (let i = 0; i < 300; i++) {
      const ev = rlStep(t, 1 / 60, { moving: false });
      if (t.phase === "running") {
        ran = true;
        expect(ev.lightChanged).toBe("green");
        break;
      }
    }
    expect(ran).toBe(true);
  });

  it("moving on green advances the player toward the finish", () => {
    const t = toRunning();
    // Force a long green so the whole step is clean.
    t.light = "green";
    t.lightTimer = 30;
    const startZ = t.runners.find((r) => r.id === "player")!.z;
    for (let i = 0; i < 60; i++) rlStep(t, 1 / 60, { moving: true });
    const z = t.runners.find((r) => r.id === "player")!.z;
    expect(z).toBeLessThan(startZ);
  });

  it("moving on red is a fault and costs a heart", () => {
    const t = toRunning();
    t.light = "red";
    t.lightTimer = 30;
    const hearts0 = t.playerHearts;
    const ev = rlStep(t, 1 / 60, { moving: true });
    expect(ev.fault).toBe(true);
    expect(t.playerHearts).toBe(hearts0 - 1);
    // The stun should stop further progress for a beat.
    const z = t.runners.find((r) => r.id === "player")!.z;
    expect(z).toBeGreaterThan(RL_FINISH_Z);
  });

  it("three faults eliminate the player from the round", () => {
    const t = toRunning();
    t.light = "red";
    t.lightTimer = 60;
    for (let i = 0; i < 600 && !t.runners.find((r) => r.id === "player")!.out; i++) {
      rlStep(t, 1 / 60, { moving: true });
    }
    expect(t.playerHearts).toBe(0);
    expect(t.runners.find((r) => r.id === "player")!.out).toBe(true);
  });

  it("bots run during green and reach the finish before the player", () => {
    const t = toRunning();
    t.light = "green";
    t.lightTimer = 60;
    // Let the bots run; the player stays put.
    for (let i = 0; i < 900; i++) {
      const ev = rlStep(t, 1 / 60, { moving: false });
      if (ev.roundWin) break;
    }
    expect(t.runners.find((r) => !r.isPlayer && r.roundWins === 1)).toBeDefined();
  });

  it("first to two round-wins takes the match", () => {
    const t = toRunning();
    // Fabricate two player round-wins directly.
    const player = t.runners.find((r) => r.id === "player")!;
    player.roundWins = RL_ROUNDS_TO_WIN - 1;
    // Put the player on the line and win the round.
    t.light = "green";
    t.lightTimer = 60;
    player.z = RL_FINISH_Z + 0.01;
    let won = false;
    for (let i = 0; i < 120; i++) {
      const ev = rlStep(t, 1 / 60, { moving: true });
      if (ev.matchWin) {
        won = true;
        break;
      }
    }
    expect(won).toBe(true);
    expect(player.roundWins).toBe(RL_ROUNDS_TO_WIN);
  });

  it("lightColor returns off between rounds", () => {
    const t = toRunning();
    t.light = "red";
    t.lightTimer = 60;
    // Park a bot on the finish line so the round ends deterministically
    // (a stopped bot must never be expected to slide across on red).
    const bot = t.runners.find((r) => !r.isPlayer)!;
    bot.z = RL_FINISH_Z;
    for (let i = 0; i < 120; i++) {
      rlStep(t, 1 / 60, { moving: false });
      if (t.phase === "roundEnd") break;
    }
    expect(t.phase).toBe("roundEnd");
    expect(lightColor(t)).toBe("off");
  });

  it("lanes reset cleanly at the start of a round", () => {
    const t = toRunning();
    t.runners.find((r) => r.id === "player")!.z = 0;
    rlBeginRound(t);
    for (const r of t.runners) {
      expect(r.z).toBe(RL_START_Z);
      expect(r.out).toBe(false);
      expect(r.faults).toBe(0);
    }
    expect(t.playerHearts).toBe(RL_HEARTS);
  });
});
