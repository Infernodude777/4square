// ─────────────────────────────────────────────────────────────
//  THE CHALK WALL — leave your mark (Season 3)
//
//  After a match the Victory card invites you to scrawl a chalk
//  message on the yard's wall. Marks persist in localStorage and
//  the hub shows the six most recent on a little chalkboard. The
//  wall remembers every recess — your name, your trash talk, your
//  nonsense. No accounts, no cloud, just chalk dust.
// ─────────────────────────────────────────────────────────────

const KEY = "recess-royale-graffiti-v1";
export const MAX_MARKS = 6;
export const MARK_MAX_LEN = 40;

/** Sanitise one mark: trim, cap length, drop control characters. */
export function sanitizeMark(raw: string): string {
  return raw.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, MARK_MAX_LEN);
}

function read(): string[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((m): m is string => typeof m === "string").slice(0, MAX_MARKS);
  } catch {
    return [];
  }
}

function write(marks: string[]) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(marks));
  } catch {
    // Quota / private-mode errors must never crash the game loop.
  }
}

/** The chalk wall, oldest first. */
export function loadMarks(): string[] {
  return read();
}

/** Scrawl a new mark. Returns the updated wall. Empty marks are ignored. */
export function addMark(raw: string): string[] {
  const mark = sanitizeMark(raw);
  if (!mark) return loadMarks();
  const next = [...read(), mark].slice(-MAX_MARKS);
  write(next);
  return next;
}

/** Wipe the wall (used by the settings reset + tests). */
export function clearMarks() {
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(KEY);
    } catch {
      // ignore
    }
  }
}
