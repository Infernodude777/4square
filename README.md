# Four Square: Recess Royale 🏀🛝

A 3D schoolyard game built with **Three.js**, **React**, and **react-three-fiber**.
Roam the blacktop at Falcon Elementary, pick a court, and take on the robot
classmates — ADA, GRACE, ALAN, TURIN, and SLAM.

## 🎮 Games

| Court | Goal |
|---|---|
| Foursquare | Reach 30 points against the king |
| Tetherball | Wrap the rope around the pole |
| Wallball | Beat ZIGGY to 11 games |
| Tag | Survive as the last one free |
| Kickball | Outscore the bots in 3 innings |
| Basketball | Spell H-O-R-S-E before SLAM |
| Dodgeball | Clear all three bots off the court |
| Gaga | Last one standing in the octagon pit |
| Hopscotch | Beat the bot's best time |
| Red Light, Green Light | Win the lane race — move on green, freeze on red |

Plus a **daily challenge**, a **badge wall** (32 badges), a **Hall of Fame** with
ranks and records, and a **procedural recess radio** that plays and reacts to the match.

Everything is procedural — audio, music, and textures are generated in code.
No asset pipeline, fully playable offline.

## 🕹️ Controls

- **WASD / Arrows** — move · **Mouse** — aim · **Click** — hit/kick/throw
- **E** — enter a court · **F** — photo mode in the hub (drag to orbit, scroll to zoom, SAVE for PNG)
- **ESC / P** — pause · **M** — mute
- Per-game controls are shown in-game on the bottom-left card

## 🚀 Getting started

```bash
npm install
npm run dev       # local dev server
npm run build     # production build → dist/
npm run preview   # preview the production build
npm test          # vitest unit suite
```

Open the printed localhost URL, click **PLAY**, and explore the yard.

## 🧱 Tech

- React 19 · react-three-fiber 9 · Three.js · Zustand (match state + persisted settings)
- Tailwind CSS v4 for the HUD
- Vite · TypeScript (strict) · Vitest

## 🏗️ Structure

```
src/
  game/          pure game logic & state (no React)
  components/    React + three.js render layer
    hub/         the free-roam schoolyard
    <mode>/      each game's Scene · Director · HUD
```
