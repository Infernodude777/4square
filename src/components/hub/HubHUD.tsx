import { useEffect, useState } from "react";
import { RT } from "../../game/refs";
import { FOUR_SQUARE_POS, TETHER_POS, WALL_POS, TAG_POS, KICKBALL_POS, SWING_POS } from "./constants";

function dist(pos: [number, number, number]) {
  const p = RT.entities.player.pos;
  return Math.hypot(p.x - pos[0], p.z - pos[2]);
}

export function HubHUD() {
  const [near, setNear] = useState<"foursquare" | "tetherball" | "wallball" | "tag" | "kickball" | "swing" | null>(null);
  const [activeSwing, setActiveSwing] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      // Riding the swing? Prompt to hop off instead.
      const onSwing = RT.entities.player.sitting;
      setActiveSwing(onSwing);
      if (onSwing) {
        setNear("swing");
        return;
      }

      const d4 = dist(FOUR_SQUARE_POS);
      const dt = dist(TETHER_POS);
      const dw = dist(WALL_POS);
      const dtag = dist(TAG_POS);
      const dkick = dist(KICKBALL_POS);
      const ds = dist(SWING_POS);
      
      if (ds < 2.0 && ds <= d4 && ds <= dt && ds <= dw) setNear("swing");
      else if (dtag < 3.0 && dtag <= dkick && dtag <= d4 && dtag <= dt && dtag <= dw) setNear("tag");
      else if (dkick < 3.0 && dkick <= dtag && dkick <= d4 && dkick <= dt && dkick <= dw) setNear("kickball");
      else if (d4 < 5.2 && d4 <= dt && d4 <= dw) setNear("foursquare");
      else if (dt < 4.4 && dt <= dw) setNear("tetherball");
      else if (dw < 5.6) setNear("wallball");
      else setNear(null);
    }, 90);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 font-body">
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
        {near ? (
          <div className="animate-bannerin rounded-2xl border-2 border-[#ffd23e] bg-[#10141c]/85 px-7 py-4 backdrop-blur-sm">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-white/45">
              {near === "foursquare" ? "Four Square" : near === "tetherball" ? "Tetherball" : near === "wallball" ? "Wallball" : near === "tag" ? "Tag: Last One Standing" : near === "kickball" ? "Kickball: Diamond Dash" : "Playground Swing"}
            </div>
            <div className="font-display text-3xl text-[#ffd23e]">
              {near === "swing" ? (activeSwing ? "Press E to jump off" : "Press E to swing") : "Press E to play"}
            </div>
          </div>
        ) : (
          <div className="rounded-full bg-[#10141c]/45 px-5 py-2 text-[11px] font-bold tracking-[0.2em] text-white/40 backdrop-blur-sm">
            WASD TO WALK
          </div>
        )}
      </div>
    </div>
  );
}