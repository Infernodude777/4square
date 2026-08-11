import { describe, expect, it } from "vitest";
import * as THREE from "three";
import {
  SHOTS,
  beginServe,
  createTState,
  releaseServe,
  stepTether,
  tryHit,
  wouldDoubleHit,
} from "../tetherball";

const PLAYER_FOOT = new THREE.Vector3(0, 0, 1.65);

/**
 * The tests below place the ball by hand, so the ball carries zero
 * velocity. tryHit's carry-foul check (a random 8% "carry" when the ball
 * is nearly stopped and right on the hand) would then be a *coin flip*
 * per test run — flaky by design. Giving the ball a little velocity keeps
 * the carry branch off deterministically while leaving the rule intact.
 */
function armBall(t: ReturnType<typeof createTState>, y: number) {
  t.ballCleared = true;
  t.ballPos.set(0, y, 1.65);
  t.ballVel.set(1, 0, 1); // moving ⇒ the carry roll is skipped
}

describe("tetherball", () => {
  it("a serve releases into a live, spinning orbit", () => {
    const t = createTState();
    beginServe(t, "player");
    expect(t.serveStage).toBe("player-hold");

    releaseServe(t, "player", 1);
    expect(t.serveStage).toBe("live");
    expect(Math.abs(t.L)).toBeGreaterThan(0);

    const theta0 = t.theta;
    for (let i = 0; i < 120; i++) stepTether(t, 1 / 60);
    expect(t.theta).toBeGreaterThan(theta0);
    expect(t.wrapY).toBeLessThanOrEqual(3.05);
  });

  it("double-hit rule blocks a second strike before the ball clears", () => {
    const t = createTState();
    beginServe(t, "player");
    releaseServe(t, "player", 1);

    // releaseServe arms the server as lastHitter with ballCleared=false;
    // the first legitimate strike comes after the ball has been around.
    armBall(t, SHOTS.drive.idealY);
    const res = tryHit(t, "player", PLAYER_FOOT, 1.08, false, false, 0, false, 1);
    expect(res.applied).toBe(true);
    expect(wouldDoubleHit(t, "player")).toBe(true);

    const again = tryHit(t, "player", PLAYER_FOOT, 1.08, false, false, 0, false, 1);
    expect(again.foul).toBe("double");
  });

  it("timing quality peaks at the shot's ideal height", () => {
    const t = createTState();
    beginServe(t, "player");
    releaseServe(t, "player", 1);

    // Perfect drive height → full credit. (First strike after releaseServe
    // needs ballCleared, exactly like the double-hit test.)
    armBall(t, SHOTS.drive.idealY);
    const good = tryHit(t, "player", PLAYER_FOOT, 1.08, false, false, 0, false, 1);
    expect(good.kind).toBe("drive");
    expect(good.perfect).toBe(true);
    expect(good.quality).toBeGreaterThan(0.9);

    // Re-arm, then hit way below the ideal → much weaker.
    armBall(t, 0.1);
    const bad = tryHit(t, "player", PLAYER_FOOT, 1.08, false, false, 0, false, 1);
    expect(bad.applied).toBe(true);
    expect(bad.quality).toBeLessThan(0.5);
  });

  it("loft is the tightest window in the arsenal (L9)", () => {
    const windows = Object.values(SHOTS).map((s) => s.window);
    expect(Math.min(...windows)).toBe(SHOTS.loft.window);
    expect(SHOTS.loft.window).toBeGreaterThanOrEqual(0.32); // retuned, but still tight
  });
});
