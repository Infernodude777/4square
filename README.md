# Four Square: Recess Royale 🏀🛝

A 3D schoolyard showdown built with **Three.js**, **React**, and **react-three-fiber**.
Ten playground games, four robot classmates, one recess crown.

![courts](https://img.shields.io/badge/courts-10-brightgreen) ![modes](https://img.shields.io/badge/modes-foursquare%20·%20tetherball%20·%20wallball%20·%20tag%20·%20kickball%20·%20basketball%20·%20dodgeball%20·%20gaga%20·%20hopscotch%20·%20red%20light-blue) ![build](https://img.shields.io/badge/build-tsc%20%2B%20vite%20%2B%20vitest-passing-success)

---

## 🎮 What is it?

Free-roam a hand-painted blacktop at **Falcon Elementary** — walk up to any court and press **E** to play.
Every game is a skill duel against procedurally-animated robot classmates (ADA, GRACE, ALAN, TURIN)
with their own personalities, plus SLAM at the basketball hoop.

| Court | How you win |
|---|---|
| **Foursquare** | Reach 30 points — time your strokes against the four-square king |
| **Tetherball** | Wrap the rope all the way around the pole |
| **Wallball** | Beat ZIGGY to 11 games |
| **Tag** | Survive as the last one free across three round modes |
| **Kickball** | Outscore the bots over three innings |
| **Basketball** | Spell out H.O.R.S.E. for SLAM first |
| **Dodgeball** | Clear all three bots off the court |
| **Gaga** | Be the last survivor in the octagonal pit |
| **Hopscotch** | Beat the fastest bot time down the chalk board |
| **Red Light, Green Light** | Best-of-three lane race — move on green, freeze on red |

Everything is **procedural** — sound, music, textures, and animation are generated in code, no asset
pipeline, fully playable offline.

## 🕹️ Controls

- **WASD / Arrows** — move · **Mouse** — aim · **Click** — hit/kick/throw · **Right-click** — soft shot/bunt
- **C** — crouch (skimmer) · **Space** — jump (smash) · **Shift** — lob · **E** — enter a court in the hub
- **F** — photo mode in the hub (drag to orbit, scroll to zoom, **H** to hide the HUD, **SAVE** for a PNG)
- **ESC / P** — pause (auto-pauses when the tab loses focus) · **M** — mute (in-HUD button)

Each court's controls are shown in-game on the bottom-left card.

## ✨ Features

- **10 playable modes** with per-mode difficulty scaling (`CHILL / CLASSIC / FIERCE`)
- **The school bell (Season 3)** — the school day is a clock: a wall-clock chip in the hub, a
  countdown to the 3:00 PM bell, and when it rings the whole yard celebrates — confetti, a fresh
  daily tune, a SCHOOL'S OUT badge, and an **OVERTIME +50 bonus** if you're mid-match
- **King's rules (Season 3)** — before every foursquare serve the king calls a house rule
  (no smashing, no drops, double points, bot charge) that everyone has to live with
- **The chalk wall (Season 3)** — after a match, scrawl a chalk message that shows up on a board
  in the hub. The yard remembers
- **Chalk & duct-tape UI voice (Season 3)** — hand-drawn stroke icons replace emoji stickers in
  the UI chrome; badges and ranks keep theirs on purpose
- **Daily recess special** — a rotating challenge with a bell-ringing reward (+100 bonus & confetti)
- **Badge wall** — 32 unlockable badges including secrets; all progress persists
- **Hall of Fame** — a blacktop rank (DODO → CHALKER → COURT ACE → COURT KING), per-court records
  (points, runs, swishes, survival time, best hopscotch time, red-light rounds), win rates, lifetime
  stats (bells heard!), and the badge wall, reachable from the hub
- **Settings** — SFX volume, recess-radio volume, visuals preset (low/medium/high), difficulty,
  screen shake, particles, reticle style (ring/dot/cross), aim sensitivity
- **Procedural recess radio** — a seeded, mood-driven WebAudio soundtrack that ducks during SFX and
  follows the match state (hub / play / point); the tune rolls over when the bell rings
- **Living schoolyard** — a full school-day cycle (morning → golden hour → night, with stars) shared
  by every scene, plus yard props (monkey bars, picnic table, bushes, flower beds, lamp posts)
- **Robots that talk back** — chalk speech bubbles over bot heads on perfects, KOs, and wins
- **Photo mode** — a free orbit camera and one-click PNG keepsake of the yard
- **Procedural audio** — synthesized crowd cheers, bells, smashes; no audio files
- **Error boundary, loading screen, title menu** — a proper production app shell
- **`prefers-reduced-motion` support** and touch-friendly tap targets

## 🧱 Tech

- React 19 + react-three-fiber 9 + Three.js r185 + Zustand (two stores: `useGame` = match,
  `useSettings` = persisted prefs/stats/daily)
- Tailwind CSS v4 for the HUD
- Vite · TypeScript strict · Vitest (unit tests for all pure game-logic modules)

## 🚀 Getting started

```bash
npm install
npm run dev        # local dev server
npm run build      # production build → dist/
npm run preview    # preview the production build
npm test           # vitest unit suite
```

Open the printed localhost URL, click PLAY, and explore the yard.

## 🗺️ Architecture

```
src/
  game/             pure logic & state (no React)
    store.ts        match state (useGame — transient)
    settings.ts     persisted prefs/stats/records/daily (useSettings)
    achievements.ts badge rules + unlocked list (persisted)
    daily.ts        daily challenge definition & counters
    banter.ts       per-mode trash-talk lines
    audio.ts        procedural WebAudio synth + ambience
    music.ts        procedural recess radio (seeded tune, mood-driven)
    atmosphere.ts   the shared school-day clock (palette keyframes)
    bells.ts        the school-bell schedule (Season 3)
    rules.ts        foursquare king's house rules (Season 3)
    graffiti.ts     the persisted chalk wall (Season 3)
    rank.ts         blacktop rank tiers + record fractions
    refs.ts         shared mutable match refs + speech-bubble emotes
    textures.ts     canvas-painted court/ball/brick textures
    logic.ts        foursquare physics
    kickball.ts / tetherball.ts / wallball.ts / tag.ts
    basketball.ts / dodgeball.ts / gaga.ts / hopscotch.ts / redlight.ts
  components/       React + r3f render layer
    Scene.tsx / Director.tsx / HUD.tsx          foursquare
    hub/                                          free-roam yard
    <mode>/  Scene · Director · HUD (+ Ball/Court/Players)
    Atmosphere.tsx (shared day-cycle rig) · Sky.tsx (hub backdrop)
    PhotoMode.tsx · Rig.tsx (emote bubbles) · CharacterBody
    Icons.tsx (chalk stroke icons) · BellClock · GraffitiWall
    TitleScreen · LoadingScreen · ErrorBoundary · PauseMenu · SettingsPanel
    HallOfFame · BadgesWall · BadgeToast · DailyCard · ControlsCard
```

**Conventions** — each mode: a pure state module in `game/`, a `{mode}State.ts` mutable-ref
singleton, and a Director that mutates state in `useFrame` while the Scene only reads it. Store
updates stay pure (no cross-store `set()` inside updaters). Persistent-shape changes require a
`version` bump + `migrate` in the zustand `persist` options — see `src/game/settings.ts`.

## 🧪 Testing

`npm test` runs the vitest suite in `src/game/__tests__/` covering daily challenge rules, badge
thresholds, per-mode record logic, settings migration/reset, kickball innings, wallball scoring,
tetherball wrap maths, tag round ends, basketball H.O.R.S.E. flow, hopscotch faults, red-light
round/match rules, the school-bell schedule, king's rules, and the chalk wall.

## 📋 Roadmap (see plan.md)

The detailed audit + production plan lives in **[plan.md](./plan.md)**, including the full bug
registry, the 9-court merge history, the production-readiness pass, and the Season 3 plan
(the last bell, king's rules, the chalk wall, and the chalk & duct-tape UI voice).

---

*Made with 💛 on the blacktop of Falcon Elementary. ADA smells like rust. — recess forever.*
