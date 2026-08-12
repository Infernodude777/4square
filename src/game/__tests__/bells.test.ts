import { describe, expect, it } from "vitest";
import { bellCountdown, bellRang, LAST_BELL_F, periodAt, timeOfDay } from "../bells";

describe("bells — the school-day schedule (Season 3)", () => {
  it("maps day fractions to the four recess periods", () => {
    expect(periodAt(0).label).toBe("MORNING RECESS");
    expect(periodAt(0.24).label).toBe("MORNING RECESS");
    expect(periodAt(0.25).label).toBe("LUNCH");
    expect(periodAt(0.49).label).toBe("LUNCH");
    expect(periodAt(LAST_BELL_F).label).toBe("AFTER SCHOOL");
    expect(periodAt(0.75).label).toBe("NIGHT SHIFT");
    expect(periodAt(0.999).label).toBe("NIGHT SHIFT");
    expect(periodAt(1.02).label).toBe("MORNING RECESS"); // wraps to a new day
    expect(periodAt(-0.01).label).toBe("NIGHT SHIFT");    // wraps back a day
  });

  it("formats the wall clock from 9 AM to 9 PM", () => {
    expect(timeOfDay(0)).toBe("9:00 AM");
    expect(timeOfDay(0.25)).toBe("12:00 PM");
    expect(timeOfDay(LAST_BELL_F)).toBe("3:00 PM");
    expect(timeOfDay(0.75)).toBe("6:00 PM");
    expect(timeOfDay(0.99)).toBe("8:52 PM");
    expect(timeOfDay(1.3)).toBe("12:36 PM"); // wraps to a new day
  });

  it("counts down to the last bell and wraps after it rings", () => {
    // 0.5 of a 24-minute day = 720 s.
    expect(bellCountdown(0)).toBeCloseTo(0.5 * 24 * 60);
    expect(bellCountdown(0.25)).toBeCloseTo(0.25 * 24 * 60);
    expect(bellCountdown(LAST_BELL_F)).toBeCloseTo(24 * 60); // next day's bell
    expect(bellCountdown(0.75)).toBeCloseTo(0.75 * 24 * 60);
  });

  it("knows whether the bell already rang", () => {
    expect(bellRang(0)).toBe(false);
    expect(bellRang(0.49)).toBe(false);
    expect(bellRang(LAST_BELL_F)).toBe(true);
    expect(bellRang(0.9)).toBe(true);
    expect(bellRang(0.01)).toBe(false); // a new day begins
  });
});
