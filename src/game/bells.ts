// ─────────────────────────────────────────────────────────────
//  THE BELL — the school day's schedule (Season 3)
//
//  A pure module that turns the shared school-day clock
//  (atmosphere.ts) into a recess schedule: a flavour label for the
//  time of day, a wall-clock string, and the countdown to THE LAST
//  BELL. The bell rings once per school day at 3:00 PM (day
//  fraction 0.5). App.tsx watches `bellRang()` and fires the
//  celebration; this module never touches React or the stores.
// ─────────────────────────────────────────────────────────────

import { DAY_SECONDS } from "./atmosphere";

/** Day fraction at which the last bell rings — 3:00 PM (12 h day). */
export const LAST_BELL_F = 0.5;

export interface PeriodDef {
  label: string;
  sub: string;
  from: number;
  to: number;
}

// The school day runs 9:00 AM → 9:00 PM (fraction 0..1). Four
// flavours, chosen so the LAST BELL always lands on a period
// boundary — "school's out" is a real transition, not a blip in
// the middle of lunch.
export const PERIODS: PeriodDef[] = [
  { label: "MORNING RECESS", sub: "the yard is all yours",  from: 0.0,  to: 0.25 },
  { label: "LUNCH",          sub: "peanut butter hour",     from: 0.25, to: 0.5 },
  { label: "AFTER SCHOOL",   sub: "the bell already rang",  from: 0.5,  to: 0.75 },
  { label: "NIGHT SHIFT",    sub: "streetlight basketball", from: 0.75, to: 1.0001 },
];

/** The flavour period containing a day fraction (wraps). */
export function periodAt(f: number): PeriodDef {
  const k = ((f % 1) + 1) % 1;
  return PERIODS.find((p) => k >= p.from && k < p.to) ?? PERIODS[0];
}

/** Wall-clock string for a day fraction, e.g. "12:34 PM". */
export function timeOfDay(f: number): string {
  const k = ((f % 1) + 1) % 1;
  const totalMin = k * 12 * 60;              // 9 AM → 9 PM
  const minutes = Math.floor(totalMin) % 720;
  const h24 = 9 + Math.floor(minutes / 60);
  const m = minutes % 60;
  const pm = h24 >= 12;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${pm ? "PM" : "AM"}`;
}

/** Seconds until the last bell (wraps to tomorrow after it rings). */
export function bellCountdown(f: number): number {
  const k = ((f % 1) + 1) % 1;
  if (k < LAST_BELL_F) return (LAST_BELL_F - k) * DAY_SECONDS;
  return (1 - k + LAST_BELL_F) * DAY_SECONDS;
}

/** True once the bell has rung this school day. */
export function bellRang(f: number): boolean {
  return ((f % 1) + 1) % 1 >= LAST_BELL_F;
}
