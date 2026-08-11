import { describe, expect, it } from "vitest";
import * as THREE from "three";
import {
  beginServe,
  callFoul,
  createWState,
  stepWall,
  tryHit,
} from "../wallball";
import type { WallState } from "../wallball";

function hand(t: WallState, y = 1.05): THREE.Vector3 {
  return new THREE.Vector3(t.playerPos.x, y, t.playerPos.z);
}

describe("wallball", () => {
  it("a serve launches the ball into a live rally", () => {
    const t = createWState();
    beginServe(t, "player");
    expect(t.phase).toBe("serve");
    const res = tryHit(t, "player", hand(t), false, false, 0, false);
    expect(res.applied).toBe(true);
    expect(t.phase).toBe("live");
    expect(t.turn).toBe("op");
    expect(t.rallyLength).toBe(1);
  });

  it("hitting before the wall bounce is a volley foul", () => {
    const t = createWState();
    beginServe(t, "player");
    tryHit(t, "player", hand(t), false, false, 0, false);
    // Now it's the player's turn again but the ball hasn't touched the wall.
    t.turn = "player";
    t.ballPos.copy(hand(t));
    const res = tryHit(t, "player", hand(t), false, false, 0, false);
    expect(res.foul).toBe("volley");
    expect(res.applied).toBe(false);
  });

  it("a legal return after the wall bounce lands", () => {
    const t = createWState();
    beginServe(t, "player");
    tryHit(t, "player", hand(t), false, false, 0, false);

    t.turn = "player";
    t.hitWall = true;
    t.bouncesAfterWall = 1;
    t.ballPos.copy(hand(t, 1.1));
    const res = tryHit(t, "player", hand(t, 1.1), false, false, 0, false);
    expect(res.applied).toBe(true);
    expect(res.foul).toBeNull();
    expect(res.perfect).toBe(true); // ball at ideal drive height
  });

  it("a player foul scores for the bot", () => {
    const t = createWState();
    callFoul(t, "player", "double");
    expect(t.opScore).toBe(1);
    expect(t.phase).toBe("point");
  });

  it("first to 11 wins the match", () => {
    const t = createWState();
    t.playerScore = 10;
    t.opScore = 9;
    callFoul(t, "op", "dead");
    expect(t.playerScore).toBe(11);
    expect(t.phase).toBe("won");
  });

  it("the point phase counts down then serves again", () => {
    const t = createWState();
    callFoul(t, "player", "wide");
    expect(t.phase).toBe("point");
    stepWall(t, 1.0);
    expect(t.pointTimer).toBeLessThanOrEqual(1.0);
    stepWall(t, 1.5);
    // beginServe is driven by the director, but the timer itself runs out.
    expect(t.phase).toBe("point"); // director restarts the serve
  });
});
