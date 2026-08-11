# RECESS ROYALE — Season 2 Plan (v3)

**Project:** Four Square: Recess Royale — Three.js / react-three-fiber 3D schoolyard game.
**Scope:** 10 playable modes, free-roam hub, persisted settings, badge wall, daily challenge.
**Audit date:** 2026-08-10 · **Previous passes:** v1 bug-fix + 9-court merge (basketball, dodgeball,
gaga, hopscotch) + banter/daily-reward/settings/polish + v2 production-readiness pass (title screen,
error boundary, loading screen, per-mode records, debounced persistence, auto-pause, reduced-motion)
— all landed and verified (`tsc` clean, `vite build` clean, `npx vitest run` 39/39).

Season 2 is the **make-it-sing** pass: a real soundtrack, a living schoolyard, a photo mode,
progress depth (ranks + win rates), robots that talk back, and a brand-new tenth court.

---

## 1. What Landed (v2 recap)

- P0 fixes: honest per-mode records (`RECORD_META`), hub settings gear, error boundary, loading
  screen, auto-pause on blur, debounced persistence, audio gesture gate.
- P1: title screen + `hasStarted`, reduced-motion + touch-action + aria-labels, WebGL context-loss
  recovery, vitest suites for the merged modes, README.
- P2: Victory confetti cap + vignette, HUD popover outside-close, vibration on big plays.

---

## 2. Season 2 — Feature Registry

| ID | Feature | Where | Notes |
|----|---------|-------|-------|
| S2-1 | **Recess radio** — procedural WebAudio soundtrack | `game/music.ts` | Seeded daily tune, mood-driven tempo (hub/play/point), SFX ducking, own gain bus for the music volume slider |
| S2-2 | **School-day sky** — one shared clock across every scene | `game/atmosphere.ts`, `Atmosphere.tsx` | 24-minute loop: morning → noon → golden hour → dusk → night; palette keyframes drive background, fog, sun tint, ambient; stars fade in after dusk; hub gets a matching `<Sky/>` |
| S2-3 | **Photo mode** — orbit camera + PNG download | `PhotoMode.tsx`, `App.tsx` | `F` in the hub; drag orbit, scroll zoom, `H` hide HUD, SAVE writes a canvas snapshot |
| S2-4 | **Blacktop ranks** | `game/rank.ts` | DODO → CHALKER → COURT ACE → COURT KING; per-court rank on the Victory card, live chip on the foursquare HUD, overall rank banner in the Hall of Fame |
| S2-5 | **Win rates + per-mode wins** | `settings.ts` (`stats.modeWins`), `HallOfFame.tsx` | Every win tallies per mode; the wall shows `wins/plays · %` chips |
| S2-6 | **Robot speech bubbles** | `refs.ts` (`setEmote`), `store.ts` reactions, `Rig.tsx`, CSS | Chalk bubbles over bot heads on perfects, KOs, wins |
| S2-7 | **Red Light, Green Light** — the tenth court | `game/redlight.ts` + `components/redlight/*` + tests | Best-of-three lane race vs REX, ZIGGY, ADA; hearts on red faults; difficulty-scaled bot reactions; new badge (LIGHT RUNNER), record (rounds won), daily goal |
| S2-8 | **Hub props + east strip** | `components/hub/Props.tsx`, `World.tsx`, `colliders.ts`, `constants.ts` | Fence extends east; monkey bars, picnic table, bushes, flower beds, lamp posts (glow at night) |
| S2-9 | **Settings depth** | `SettingsPanel.tsx` | Radio volume slider + visuals preset (low/medium/high → dpr + shadows) |
| S2-10 | **New badges** | `achievements.ts` | redlight-win, plus 5 Season 2 secrets (full-roster refresh, sweeps, lifer/marathon already in) |

## 3. Design Rules (carried from v2)

- **The game's voice** is warm, chalk-dusty and recess-y: every new screen and bubble should look
  hand-drawn on a schoolyard, not grey UI.
- Keep the two-store boundary: `useGame` = match, `useSettings` = persistence. New persisted flags
  (`musicVolume`, `quality`, `stats.modeWins`) belong in `useSettings` with a version bump.
- Single source of truth: record units in `RECORD_META`, rank tiers in `rank.ts`, entry radii in
  `hub/constants.ts`. Every display reads the same table.
- Pure logic stays pure: `redlight.ts` owns all rules; the director only forwards input + events.
- All overlays share the existing patterns: `animate-cardin`, chalkboard/`#10141c` surfaces,
  `#ffd23e` gold accents, ESC/backdrop close.

## 4. Verification

`npx tsc --noEmit` · `npx vitest run` (39 + redlight + tetherball-flake fixes) · `npm run build` ·
browser smoke test (title → hub → enter the red-light lane → photo mode → settings) · update statuses.
