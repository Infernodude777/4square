import { describe, expect, it } from "vitest";
import {
  dailyMet,
  dailyProgress,
  emptyCounters,
  pickDaily,
  todayKey,
} from "../daily";
import type { DailyDef, DailyCounters } from "../daily";

const winTwo: DailyDef = {
  id: "win-2",
  emoji: "🏆",
  title: "DOUBLE WINS",
  desc: "Two dubs before the bell.",
  goal: "Win 2 games",
  measure: (d) => d.totalWins,
  target: 2,
};

describe("daily challenge", () => {
  it("picks deterministically for a given date", () => {
    expect(pickDaily("2026-08-10").id).toBe(pickDaily("2026-08-10").id);
  });

  it("varies across dates", () => {
    const ids = new Set(
      Array.from({ length: 14 }, (_, i) =>
        pickDaily(`2026-08-${String(10 + i).padStart(2, "0")}`).id,
      ),
    );
    expect(ids.size).toBeGreaterThan(1);
  });

  it("every pool pick is a real, completable definition", () => {
    for (let d = 1; d <= 28; d++) {
      const def = pickDaily(`2026-02-${String(d).padStart(2, "0")}`);
      expect(def.id.length).toBeGreaterThan(0);
      expect(def.target).toBeGreaterThan(0);
      expect(typeof def.measure(emptyCounters())).toBe("number");
    }
  });

  it("formats the day key as YYYY-MM-DD", () => {
    expect(todayKey(new Date(2026, 7, 10))).toBe("2026-08-10");
  });

  it("reports progress and completion against the target", () => {
    const below: DailyCounters = { ...emptyCounters(), totalWins: 1 };
    expect(dailyProgress(winTwo, below)).toBeCloseTo(0.5);
    expect(dailyMet(winTwo, below)).toBe(false);

    const done: DailyCounters = { ...emptyCounters(), totalWins: 2 };
    expect(dailyProgress(winTwo, done)).toBe(1);
    expect(dailyMet(winTwo, done)).toBe(true);
  });

  it("clamps progress at 100%", () => {
    const over: DailyCounters = { ...emptyCounters(), totalWins: 9 };
    expect(dailyProgress(winTwo, over)).toBe(1);
  });
});
