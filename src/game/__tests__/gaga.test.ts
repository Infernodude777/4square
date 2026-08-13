import { describe, expect, it } from "vitest";
import {
  createGagaState,
  stepG,
  slap,
  octDist,
  OUT_HEIGHT,
  BALL_R,
} from "../gaga";

/** Freeze a bot in place so elimination tests are deterministic. */
function freeze(t: ReturnType<typeof createGagaState>) {
  for (const b of t.bots) b.wanderAt = 1e9;
}

/** Park the ball low (below the waist line) at a spot, motionless. */
function lowBall(t: ReturnType<typeof createGagaState>, x: number, z: number) {
  t.ball.pos.set(x, OUT_HEIGHT * 0.5, z);
  t.ball.vel.set(0, 0, 0);
}

describe("gaga ball state machine", () => {
  it("counts down then starts the round", () => {
    const t = createGagaState();
    expect(t.phase).toBe("countdown");
    stepG(t, 1);
    stepG(t, 1);
    stepG(t, 1.01);
    expect(t.phase).toBe("play");
  });

  it("octDist is negative inside the pit and positive outside", () => {
    expect(octDist(0, 0)).toBeLessThan(0);
    expect(octDist(10, 10)).toBeGreaterThan(0);
  });

  it("slap only works on a reachable high ball and grants the player grace", () => {
    const t = createGagaState();
    t.phase = "play";
    t.ball.pos.set(0, 1.0, 0);
    expect(slap(t, "player", 3, 3, 1)).toBe(true);
    expect(t.ball.lastHitter).toBe("player");
    expect(t.player.grace).toBeGreaterThan(0);

    // Too low to slap.
    t.ball.pos.set(0, 0.05, 0);
    expect(slap(t, "player", 3, 3, 1)).toBe(false);
  });

  it("a low ball near a bot sends that bot out", () => {
    const t = createGagaState();
    t.phase = "play";
    freeze(t);
    const bot = t.bots[0];
    lowBall(t, bot.pos.x, bot.pos.z);
    stepG(t, 1 / 60);
    expect(t.bots[0].alive).toBe(false);
    expect(t.player.alive).toBe(true);
  });

  it("player grace protects from a low ball, then a touch claims them", () => {
    const t = createGagaState();
    t.phase = "play";
    freeze(t);
    t.player.grace = 0.55; // just slapped
    lowBall(t, t.player.pos.x, t.player.pos.z);
    stepG(t, 1 / 60);
    expect(t.player.alive).toBe(true);

    // Grace gone → the same touch now ends the round.
    t.player.grace = 0;
    lowBall(t, t.player.pos.x, t.player.pos.z);
    stepG(t, 1 / 60);
    expect(t.player.alive).toBe(false);
    expect(t.winner).toBe(1);
    expect(t.phase).toBe("over");
  });

  it("the ball can't escape over the pit wall", () => {
    const t = createGagaState();
    t.phase = "play";
    freeze(t);
    // Hard, high slap aimed straight at the wall — it must bounce back
    // into the pit, never sail out over the waist-high rail.
    t.ball.pos.set(0, 1.5, 0);
    t.ball.vel.set(9, 3.5, 0);
    for (let i = 0; i < 360; i++) stepG(t, 1 / 60);
    expect(octDist(t.ball.pos.x, t.ball.pos.z)).toBeLessThan(BALL_R);
  });

  it("a ball resting on the pit floor can still be slapped", () => {
    const t = createGagaState();
    t.phase = "play";
    t.ball.pos.set(0, BALL_R, 0); // settled on the floor
    expect(slap(t, "player", 3, 3, 1)).toBe(true);
    expect(t.ball.lastHitter).toBe("player");
  });

  it("a bot has grace after its own slap, then a rebound can get them", () => {
    const t = createGagaState();
    t.phase = "play";
    freeze(t);
    const bot = t.bots[0];
    t.ball.pos.set(bot.pos.x, 1.0, bot.pos.z);
    slap(t, bot.idx, 3, 3, 1);
    expect(bot.grace).toBeGreaterThan(0);

    lowBall(t, bot.pos.x, bot.pos.z);
    stepG(t, 1 / 60);
    expect(bot.alive).toBe(true); // grace protects

    bot.grace = 0;
    stepG(t, 1 / 60);
    expect(bot.alive).toBe(false);
  });

  it("clearing every bot crowns the player", () => {
    const t = createGagaState();
    t.phase = "play";
    freeze(t);
    for (const bot of t.bots) {
      lowBall(t, bot.pos.x, bot.pos.z);
      stepG(t, 1 / 60);
    }
    expect(t.bots.every((b) => !b.alive)).toBe(true);
    expect(t.winner).toBe(0);
    expect(t.phase).toBe("over");
  });
});
