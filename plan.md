# RECESS ROYALE — Season 3 Plan (v4)

**Project:** Four Square: Recess Royale — Three.js / react-three-fiber 3D schoolyard game.
**Scope:** 10 playable modes, free-roam hub, persisted settings, badge wall, daily challenge.
**Audit date:** 2026-08-11 · **Previous passes:** v1 bug-fix + 9-court merge; v2 production pass
(title screen, error boundary, per-mode records, debounced persistence, auto-pause); Season 2
(recess radio, school-day sky, photo mode, blacktop ranks, robot speech bubbles, red-light lane,
hub props, settings depth) — all landed and verified (`tsc` clean, `vite build` clean, vitest green).

Season 3 is **the day the yard got a heartbeat**: a real school bell that rings at 3 PM and
celebrates, house rules the king calls on the foursquare court, a chalk wall that remembers your
marks, and a hand-drawn chalk & duct-tape voice that pushes the emoji stickers out of the UI chrome.

---

## 1. What Landed (v2 + S2 recap)

- P0 fixes: honest per-mode records (`RECORD_META`), hub settings gear, error boundary, loading
  screen, auto-pause on blur, debounced persistence, audio gesture gate.
- P1: title screen + `hasStarted`, reduced-motion + touch-action + aria-labels, WebGL context-loss
  recovery, vitest suites for the merged modes, README.
- P2: Victory confetti cap + vignette, HUD popover outside-close, vibration on big plays.
- Season 2: recess radio, school-day sky (24-min loop), photo mode, blacktop ranks, win rates,
  speech bubbles, Red Light Green Light (the tenth court), hub props + east strip, settings depth.

## 2. Season 3 — Feature Registry

| ID | Feature | Where | Notes |
|----|---------|-------|-------|
| S3-1 | **The Last Bell** — the school day is a clock | `game/bells.ts` (new), `BellClock.tsx`, `App.tsx`, `achievements.ts`, `settings.ts`, `music.ts` | Pure bell schedule (periods, wall clock, countdown); hub clock chip; at 3:00 PM the bell rings — long bell SFX, confetti, fresh daily tune, SCHOOL'S OUT badge, OVERTIME +50 if mid-match, `stats.bellsHeard` |
| S3-2 | **King's Rules** — foursquare house rules | `game/rules.ts` (new), `logic.ts`, `store.ts`, `HUD.tsx`, `banter.ts` | Before every serve the king calls a rule: NO SMASHING / NO DROPS (banned strokes = out), DOUBLE POINTS, BOT CHARGE. Pure + tested |
| S3-3 | **The Chalk Wall** — leave your mark | `game/graffiti.ts` (new), `Screens.tsx`, `GraffitiWall.tsx` | Victory card gains a chalk-input; the six newest marks show on a duct-taped board in the hub. Persisted to localStorage |
| S3-4 | **Chalk & duct-tape voice** | `Icons.tsx` (new), `index.css`, textures.ts, and every UI-chrome component | Hand-drawn stroke SVG icons replace emoji in buttons/labels; hand-drawn star emblem + chalk crown replace emoji glyphs in canvas textures; wall-board + tape-corner CSS. Badges/ranks keep emoji on purpose — that's content, not chrome |
| S3-5 | **Fixes & copy** | `TitleScreen.tsx`, `plan.md`, `README.md` | "Nine courts" → "Ten courts"; docs updated |

## 3. Design Rules (carried forward)

- **The game's voice** is warm, chalk-dusty and recess-y: every new screen and bubble should look
  hand-drawn on a schoolyard, not grey UI.
- Keep the two-store boundary: `useGame` = match, `useSettings` = persistence. New persisted flags
  (`stats.bellsHeard`) belong in `useSettings` with a version bump (v4 → v5).
- Single source of truth: record units in `RECORD_META`, rank tiers in `rank.ts`, entry radii in
  `hub/constants.ts`, the bell schedule in `bells.ts`, the house rules in `rules.ts`.
- Pure logic stays pure: `bells.ts` / `rules.ts` / `graffiti.ts` own all rules; directors and the
  App only forward input + events. Every new pure module ships with a vitest suite.
- All overlays share the existing patterns: `animate-cardin`, chalkboard/`#10141c` surfaces,
  `#ffd23e` gold accents, ESC/backdrop close.

## 4. Verification

`npx tsc --noEmit` · `npx vitest run` (existing suites + bells + rules + graffiti) · `npm run build` ·
browser smoke test (title → hub clock → enter foursquare under a king's rule → win → chalk a mark →
bell celebration → photo mode → settings) · update statuses.

## 5. Season 3 Checklist

- [ ] `bells.ts` + tests: periods, wall clock, countdown, wrap
- [ ] `rules.ts` + tests: bans, score/bot multipliers, pick/keep
- [ ] `graffiti.ts` + tests: sanitise, cap, wipe
- [ ] Bell wired in `App.tsx` (interval, once-per-day, overtime bonus)
- [ ] `BellClock` chip in the hub; bells stat in Settings + Hall of Fame
- [ ] King's rule enforcement in `logic.ts` (player + bots + scoring)
- [ ] RuleChip in the foursquare HUD; rule banter lines
- [ ] Chalk icons across the UI chrome; texture emoji → drawn art
- [ ] Graffiti input on Victory + chalk wall in the hub
- [ ] `tsc` / `vitest` / `vite build` all green
