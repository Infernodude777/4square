import { beforeEach, describe, expect, it, vi } from "vitest";
import { todayKey } from "../daily";

// The settings store is created at import time and hydrates from storage,
// so these tests seed localStorage and re-import the module fresh. zustand
// v5 hydrates asynchronously (promise-based getItem), so each test waits a
// macrotask after import before reading the store.
const NAME = "recess-royale-settings-v1";

const settle = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
});

describe("settings persistence (M3/M4)", () => {
  it("migrates v0 storage: prunes unknown modes, rebuilds a stale daily", async () => {
    localStorage.setItem(
      NAME,
      JSON.stringify({
        state: {
          highScores: { foursquare: 25, "not-a-mode": 99 },
          stats: { gamesPlayed: 3, totalHits: 10 },
          modePlays: { tag: 2, "ghost-mode": 5 },
          daily: { key: "2020-01-01", counters: { totalPlays: 4 }, done: false },
        },
        version: 0,
      }),
    );

    const { useSettings } = await import("../settings");
    await settle();
    const s = useSettings.getState();

    // Unknown modes pruned, real ones kept.
    expect(s.highScores["not-a-mode"]).toBeUndefined();
    expect(s.highScores.foursquare).toBe(25);
    expect(s.modePlays["ghost-mode"]).toBeUndefined();
    expect(s.modePlays.tag).toBe(2);

    // Stale daily rolled to today, stats shape filled with defaults.
    expect(s.daily.key).toBe(todayKey());
    expect(s.daily.counters.totalPlays).toBe(0);
    expect(s.stats.totalHits).toBe(10);
    expect(s.stats.timePlayed).toBe(0);
  });

  it("keeps today's daily when the stored key already matches", async () => {
    localStorage.setItem(
      NAME,
      JSON.stringify({
        state: { daily: { key: todayKey(), counters: { totalPlays: 3 }, done: false } },
        version: 0,
      }),
    );

    const { useSettings } = await import("../settings");
    await settle();
    const s = useSettings.getState();
    expect(s.daily.key).toBe(todayKey());
    expect(s.daily.counters.totalPlays).toBe(3);
    expect(s.daily.done).toBe(false);
  });

  it("resetAll wipes stats, records, plays, today's daily and every badge", async () => {
    const { useSettings } = await import("../settings");
    const { useBadges } = await import("../achievements");
    await settle();

    useSettings.getState().patchStats({ gamesPlayed: 9, totalWins: 4 });
    useSettings.getState().recordResult("kickball", 20);
    useSettings.getState().noteModePlay("gaga");
    useBadges.getState().unlock("fs-win");
    expect(useBadges.getState().unlocked).toHaveLength(1);

    useSettings.getState().resetAll();

    const s = useSettings.getState();
    expect(s.stats.gamesPlayed).toBe(0);
    expect(s.stats.totalWins).toBe(0);
    expect(s.highScores.kickball).toBeUndefined();
    expect(s.modePlays.gaga).toBeUndefined();
    expect(s.daily.key).toBe(todayKey());
    expect(s.daily.counters.totalPlays).toBe(0);
    expect(useBadges.getState().unlocked).toHaveLength(0);
  });

  it("records per-mode metrics: high-kind keeps the best, low-kind keeps the best time", async () => {
    const { useSettings } = await import("../settings");
    await settle();
    const s = useSettings.getState();

    // Kickball is a high-kind (runs) — higher wins.
    s.recordResult("kickball", 2);
    s.recordResult("kickball", 5);
    s.recordResult("kickball", 3);
    expect(useSettings.getState().highScores.kickball).toBe(5);

    // Hopscotch is low-kind (time) — lower wins, and 0 is junk.
    s.recordResult("hopscotch", 0);
    expect(useSettings.getState().highScores.hopscotch).toBeUndefined();
    s.recordResult("hopscotch", 14.2);
    s.recordResult("hopscotch", 11.7);
    s.recordResult("hopscotch", 12.9);
    expect(useSettings.getState().highScores.hopscotch).toBe(11.7);
  });

  it("migrates v2 storage: drops stale zero records for low-kind courts", async () => {
    localStorage.setItem(
      NAME,
      JSON.stringify({
        state: {
          hasStarted: true,
          highScores: { foursquare: 25, hopscotch: 0 },
          stats: { gamesPlayed: 3 },
        },
        version: 2,
      }),
    );

    const { useSettings } = await import("../settings");
    await settle();
    const s = useSettings.getState();
    expect(s.hasStarted).toBe(true);
    expect(s.highScores.foursquare).toBe(25);
    expect(s.highScores.hopscotch).toBeUndefined();
  });
});
