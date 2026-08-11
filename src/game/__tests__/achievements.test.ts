import { beforeEach, describe, expect, it } from "vitest";
import { BADGES, checkBadges, useBadges } from "../achievements";

const has = (id: string) => useBadges.getState().unlocked.includes(id);

const ALL_MODES = [
  "foursquare", "tetherball", "wallball", "tag", "kickball",
  "basketball", "dodgeball", "gaga", "hopscotch", "redlight",
];

beforeEach(() => useBadges.getState().reset());

describe("badge rules", () => {
  it("unlocks the mode badge on the first win", () => {
    checkBadges({ kind: "modeWin", mode: "foursquare" });
    expect(has("fs-win")).toBe(true);
  });

  it("unlocks the red-light badge on the first red-light win", () => {
    checkBadges({ kind: "modeWin", mode: "redlight" });
    expect(has("redlight-win")).toBe(true);
  });

  it("PENTATHLETE needs the original five, SUPERSTAR all ten", () => {
    ALL_MODES.forEach((m) => checkBadges({ kind: "modeWin", mode: m }));
    expect(has("pentathlete")).toBe(true);
    expect(has("superstar")).toBe(true);
  });

  it("SUPERSTAR stays locked until every mode is won", () => {
    ["kickball", "tetherball", "wallball", "tag", "foursquare", "basketball", "dodgeball", "gaga", "hopscotch"].forEach(
      (m) => checkBadges({ kind: "modeWin", mode: m }),
    );
    expect(has("superstar")).toBe(false);
  });

  it("catch-5 and swish-10 need lifetime totals", () => {
    checkBadges({ kind: "catch", count: 4 });
    expect(has("catch-5")).toBe(false);
    checkBadges({ kind: "catch", count: 5 });
    expect(has("catch-5")).toBe(true);

    checkBadges({ kind: "swish", count: 9 });
    expect(has("swish-10")).toBe(false);
    checkBadges({ kind: "swish", count: 10 });
    expect(has("swish-10")).toBe(true);
  });

  it("milestone stat badges cross at their thresholds", () => {
    checkBadges({ kind: "stats", perfects: 9, kos: 4, rallies: 49, bestStreak: 7, timePlayed: 100 });
    expect(has("perfect-10")).toBe(false);
    expect(has("ko-5")).toBe(false);

    checkBadges({ kind: "stats", perfects: 10, kos: 5, rallies: 50, bestStreak: 8, timePlayed: 100 });
    expect(has("perfect-10")).toBe(true);
    expect(has("ko-5")).toBe(true);
    expect(has("rally-50")).toBe(true);
    expect(has("streak-8")).toBe(true);
  });

  it("LIFER at 30 minutes, MARATHON at 2 hours", () => {
    checkBadges({ kind: "stats", perfects: 0, kos: 0, rallies: 0, bestStreak: 0, timePlayed: 1799 });
    expect(has("lifer")).toBe(false);
    checkBadges({ kind: "stats", perfects: 0, kos: 0, rallies: 0, bestStreak: 0, timePlayed: 1800 });
    expect(has("lifer")).toBe(true);
    checkBadges({ kind: "stats", perfects: 0, kos: 0, rallies: 0, bestStreak: 0, timePlayed: 7200 });
    expect(has("marathon")).toBe(true);
  });

  it("completing the daily unlocks BELL RINGER", () => {
    checkBadges({ kind: "dailyDone" });
    expect(has("daily")).toBe(true);
  });

  it("reset wipes the wall", () => {
    checkBadges({ kind: "dailyDone" });
    expect(has("daily")).toBe(true);
    checkBadges({ kind: "reset" });
    expect(has("daily")).toBe(false);
  });

  it("badge ids are unique and every one has a definition", () => {
    const ids = BADGES.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThan(10);
  });
});
