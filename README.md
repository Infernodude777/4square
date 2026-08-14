# Recess Simulator

A 3D schoolyard game built with **Three.js, React, and react-three-fiber**.
Welcome to Falcon Elementary. Walk around the schoolyard, choose a game, and compete against a group of robot classmates: **ADA, GRACE, ALAN, TURIN, and SLAM**.
The idea is pretty simple: it's recess, so go play.

## Games

There are currently 10 different games to play around the yard:
| Game | Goal |
|---|---|
| **Foursquare** | Reach 30 points and take the king's spot |
| **Tetherball** | Wrap the rope around the pole and beat your opponent |
| **Wallball** | Beat ZIGGY to 11 games |
| **Tag** | Stay untagged and be the last player free |
| **Kickball** | Score more runs than the bots over 3 innings |
| **Basketball** | Spell H-O-R-S-E before SLAM |
| **Dodgeball** | Knock all three bots out of the court |
| **Gaga** | Be the last player standing in the pit |
| **Hopscotch** | Finish faster than the bot's best time |
| **Red Light, Green Light** | Make it to the finish without moving on red |

There is also more to the game than just the individual courts. The schoolyard has a **daily challenge**, a **32-badge collection**, a **Hall of Fame** with rankings and records, and a **procedural recess radio** that reacts to what's happening during your games.

## Everything Is Procedural
One of the main ideas behind the project is that it doesn't rely on a traditional asset pipeline.
The game generates its:
- Audio
- Music
- Sound effects
- Textures
- Various visual elements

Everything is created in code, which keeps the project self-contained and means the game can be played completely offline.
## Controls
| Input | Action |
|---|---|
| **WASD / Arrow Keys** | Move |
| **Mouse** | Aim |
| **Left Click** | Hit, kick, or throw |
| **E** | Enter a court |
| **F** | Open photo mode in the hub |
| **ESC / P** | Pause |
| **M** | Mute |

In photo mode, you can drag to orbit the camera, scroll to zoom, and use **SAVE** to export a PNG. Each game also shows its own controls in the bottom-left corner while you're playing.

## Running Locally

Clone the repository and install the dependencies:

```bash
npm install
npm run dev
npm run build
npm run preview
npm test
```

React 19 · react-three-fiber 9 · Three.js · Zustand (match state + persisted settings)
Tailwind CSS v4 for the HUD
Vite · TypeScript (strict) · Vitest

```
src/
  game/
  components/
    hub/
    <mode>/
```
