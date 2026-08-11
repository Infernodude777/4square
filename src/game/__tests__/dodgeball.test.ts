import { describe, expect, it } from "vitest";
import * as THREE from "three";
import {
  createDodgeState,
  stepD,
  playerThrow,
  playerCatch,
  playerPickup,
  BALL_R,
  CATCH_RANGE,
} from "../dodgeball";

const settle = (t: ReturnType<typeof createDodgeState>, frames = 300) => {
  for (let i = 0; i < frames; i++) {
    stepD(t, 1 / 60);
    if (t.phase === "over") break;
  }
  return t;
};

/** Park a bot dead-still so hit tests are deterministic. */
function parkBot(t: ReturnType<typeof createDodgeState>, idx: number) {
  const b = t.bots[idx];
  b.state = "retreat";
  b.timer = 999;
  return b;
}

describe("dodgeball state machine", () => {
  it("counts down then gives the player the ball", () => {
    const t = createDodgeState();
    expect(t.phase).toBe("countdown");
    stepD(t, 3.01);
    expect(t.phase).toBe("play");
    expect(t.ball.holder).toBe("player");
    expect(t.player.hasBall).toBe(true);
  });

  it("playerThrow launches a flight ball toward the aim", () => {
    const t = createDodgeState();
    t.phase = "play";
    t.player.hasBall = true;
    t.ball.holder = "player";
    t.ball.state = "held";
    const aim = new THREE.Vector3(0, 0, 4);
    expect(playerThrow(t, aim)).toBe(true);
    expect(t.ball.state).toBe("flight");
    expect(t.ball.lastHitter).toBe("player");
    expect(t.player.hasBall).toBe(false);
    // Can't throw twice without the ball.
    expect(playerThrow(t, aim)).toBe(false);
  });

  it("a player throw that reaches a bot eliminates it", () => {
    const t = createDodgeState();
    t.phase = "play";
    const bot = parkBot(t, 0);
    // Craft the decisive moment directly — ball right on the bot, low.
    t.ball.state = "flight";
    t.ball.lastHitter = "player";
    t.ball.holder = null;
    t.ball.pos.set(bot.pos.x, 0.3, bot.pos.z);
    t.ball.vel.set(0, 0, 0);
    settle(t, 2);
    expect(t.bots[0].alive).toBe(false);
  });

  it("a bot hit by a teammate's throw sends the THROWER out", () => {
    const t = createDodgeState();
    t.phase = "play";
    parkBot(t, 0);
    parkBot(t, 1);
    t.ball.state = "flight";
    t.ball.lastHitter = 1; // bot 1 threw it
    t.ball.holder = null;
    t.ball.pos.set(t.bots[0].pos.x, 0.3, t.bots[0].pos.z);
    t.ball.vel.set(0, 0, 0);
    settle(t, 2);
    expect(t.bots[0].alive).toBe(true); // the target survives…
    expect(t.bots[1].alive).toBe(false); // …the thrower is out
  });

  it("playerCatch catches a closing ball and sends the thrower to the bench", () => {
    const t = createDodgeState();
    t.phase = "play";
    t.player.alive = true;
    t.player.pos.set(0, 0, -2.6);
    const bot = parkBot(t, 0);
    bot.alive = true;
    // Ball within catch range, moving toward the player.
    t.ball.state = "flight";
    t.ball.lastHitter = 0;
    t.ball.holder = null;
    t.ball.pos.set(t.player.pos.x + 0.5, 0.8, t.player.pos.z + 0.5);
    t.ball.vel.set(-2, 0, -2);
    expect(playerCatch(t)).toBe(true);
    expect(t.bots[0].alive).toBe(false);
    expect(t.player.hasBall).toBe(true);
  });

  it("playerCatch refuses balls moving away or out of range", () => {
    const t = createDodgeState();
    t.phase = "play";
    t.player.alive = true;
    t.player.pos.set(0, 0, -2.6);
    // Moving away → no catch.
    t.ball.state = "flight";
    t.ball.lastHitter = 0;
    t.ball.pos.set(t.player.pos.x + 0.5, 0.8, t.player.pos.z + 0.5);
    t.ball.vel.set(2, 0, 2);
    expect(playerCatch(t)).toBe(false);
    // Too far → no catch.
    t.ball.pos.set(t.player.pos.x + CATCH_RANGE + 1, 0.8, t.player.pos.z);
    t.ball.vel.set(-2, 0, 0);
    expect(playerCatch(t)).toBe(false);
  });

  it("clearing all three bots wins the match", () => {
    const t = createDodgeState();
    t.phase = "play";
    t.winner = null;
    for (let i = 0; i < 3; i++) {
      const bot = parkBot(t, i);
      bot.alive = true;
      t.ball.state = "flight";
      t.ball.lastHitter = "player";
      t.ball.holder = null;
      t.ball.pos.set(bot.pos.x, 0.3, bot.pos.z);
      t.ball.vel.set(0, 0, 0);
      settle(t, 3);
    }
    expect(t.bots.every((b) => !b.alive)).toBe(true);
    expect(t.winner).toBe(0);
    expect(t.phase).toBe("over");
  });

  it("playerPickup scoops a loose ball when close", () => {
    const t = createDodgeState();
    t.phase = "play";
    t.player.hasBall = false;
    t.ball.state = "ground";
    t.ball.holder = null;
    t.ball.pos.set(t.player.pos.x + 0.3, BALL_R, t.player.pos.z);
    expect(playerPickup(t)).toBe(true);
    expect(t.player.hasBall).toBe(true);
    expect(t.ball.holder).toBe("player");
  });
});
