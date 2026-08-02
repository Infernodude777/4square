import { useEffect, useState } from "react";
import { RT } from "../../game/refs";
import { FOUR_SQUARE_POS, TETHER_POS, WALL_POS, SWING_POS, TAG_POS, KICK_POS } from "./constants";

function dist(pos: [number, number, number]) {
  const p = RT.entities.player.pos;
  return Math.hypot(p.x - pos[0], p.z - pos[2]);
}

export function HubHUD() {
  const [near, setNear] = useState<"foursquare" | "tetherball" | "wallball" | "swing" | "tag" | "kickball" | null>(null);
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

      const d4   = dist(FOUR_SQUARE_POS);
      const dt   = dist(TETHER_POS);
      const dw   = dist(WALL_POS);
      const ds   = dist(SWING_POS);
      const dtag = dist(TAG_POS);
      const dk   = dist(KICK_POS);
      const nearCourt = d4 < 5.5 || dt < 4.8 || dw < 6.0 || ds < 2.5 || dk < 5.5;
      
      if (ds < 2.0 && ds <= d4 && ds <= dt && ds <= dw && ds <= dk) setNear("swing");
      else if (d4 < 5.2 && d4 <= dt && d4 <= dw && d4 <= dk) setNear("foursquare");
      else if (dt < 4.4 && dt <= dw && dt <= dk) setNear("tetherball");
      else if (dk < 4.8 && dk <= dw) setNear("kickball");
      else if (dw < 5.6) setNear("wallball");
      // Must match the actual entry radius in HubDirector (dtag < 3.5) so the
      // prompt never claims "Press E" where pressing E does nothing.
      else if (!nearCourt && dtag < 3.5) setNear("tag");
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
              {near === "foursquare" ? "Four Square" : near === "tetherball" ? "Tetherball" : near === "wallball" ? "Wallball" : near === "tag" ? "TAG!" : near === "kickball" ? "Kickball" : "Playground Swing"}
            </div>
            <div className="font-display text-3xl text-[#ffd23e]">
              {near === "swing" ? (activeSwing ? "Press E to jump off" : "Press E to swing") : near === "tag" ? "Press E to play Tag!" : near === "kickball" ? "Press E to play Kickball!" : "Press E to play"}
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