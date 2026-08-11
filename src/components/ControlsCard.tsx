import { useGame, type Mode } from "../game/store";

const CONTROLS: Record<Mode, [string, string][]> = {
  foursquare: [
    ["WASD", "move around your square"],
    ["MOUSE", "aim the reticle"],
    ["CLICK", "hit the ball"],
    ["RIGHT CLICK", "drop shot"],
    ["C", "crouch (skimmer)"],
    ["SPACE", "jump (smash)"],
    ["SHIFT", "hold to lob"],
  ],
  tetherball: [
    ["WASD", "circle the pole"],
    ["CLICK", "strike the ball"],
    ["RIGHT CLICK", "high loft"],
    ["C", "crouch (skimmer/dink)"],
    ["SPACE", "jump (smash on the way down)"],
  ],
  wallball: [
    ["WASD", "move the court"],
    ["MOUSE", "steer the ball"],
    ["CLICK", "strike (drive)"],
    ["C + CLICK", "scrapie"],
    ["SHIFT + CLICK", "bomb"],
    ["RIGHT CLICK", "baby hit"],
    ["SPACE", "jump (smash / roofer)"],
  ],
  tag: [
    ["WASD", "run"],
    ["SHIFT", "sprint"],
    ["—", "avoid being IT!"],
  ],
  kickball: [
    ["CLICK", "kick the pitch"],
    ["RIGHT CLICK", "bunt"],
    ["—", "automatic base running"],
    ["—", "timing is everything"],
  ],
  basketball: [
    ["WASD", "walk to your spot"],
    ["CLICK", "start your shot"],
    ["CLICK", "release the meter"],
    ["—", "make SLAM match it!"],
  ],
  dodgeball: [
    ["WASD", "dodge on your half"],
    ["CLICK", "throw at the reticle"],
    ["CLICK", "catch a closing ball"],
    ["—", "red glow = incoming throw"],
  ],
  gaga: [
    ["WASD", "shuffle the pit"],
    ["MOUSE", "aim your slap"],
    ["CLICK", "GA!"],
    ["—", "stay above the ball!"],
  ],
  hopscotch: [
    ["CLICK", "hop to the next cell"],
    ["—", "cells must go in order"],
    ["—", "faults add 1.5s"],
    ["—", "beat the fastest bot"],
  ],
  redlight: [
    ["W", "run down the lane"],
    ["S", "back up a step"],
    ["—", "move on GREEN only"],
    ["—", "freeze on RED or lose a heart"],
  ],
};

export function ControlsCard() {
  const mode = useGame((s) => s.mode);
  const rows = CONTROLS[mode];

  return (
    // Bottom-LEFT so it never overlaps the centred timing meters (the ball
    // height gauge that sits at bottom-centre in every mode).
    <div className="pointer-events-none absolute bottom-4 left-4 max-w-[calc(100vw-2rem)] select-none">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-white/10 bg-[#0d1219]/55 px-4 py-1.5 backdrop-blur-sm">
        {rows.map(([key, desc]) => (
          <div key={key + desc} className="flex items-center gap-1.5">
            <span className="rounded-md border border-white/15 bg-white/10 px-1.5 py-0.5 text-[9px] font-extrabold text-white/70">
              {key}
            </span>
            <span className="text-[9px] font-bold text-white/40">{desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
