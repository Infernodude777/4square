import { useEffect, useState } from "react";
import { RT } from "../../game/refs";
import { FOUR_SQUARE_POS, TETHER_POS } from "./constants";

function dist(pos: [number, number, number]) {
  const p = RT.entities.player.pos;
  return Math.hypot(p.x - pos[0], p.z - pos[2]);
}

export function HubHUD() {
  const [near, setNear] = useState<"foursquare" | "tetherball" | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      const d4 = dist(FOUR_SQUARE_POS);
      const dt = dist(TETHER_POS);
      if (d4 < 4.8 && d4 < dt) setNear("foursquare");
      else if (dt < 3.9) setNear("tetherball");
      else setNear(null);
    }, 90);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 font-body">
      <div className="absolute left-5 top-5 max-w-sm rounded-2xl border border-white/15 bg-[#0d1219]/80 px-5 py-4 text-white/80 backdrop-blur-sm">
        <div className="font-display text-xl text-[#ffd23e]">Falcon Elementary Playground</div>
        <div className="mt-1 text-xs font-bold leading-relaxed text-white/55">
          Walk around with WASD. Go to a court and press E to join.
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
        {near ? (
          <div className="animate-bannerin rounded-2xl border-2 border-[#ffd23e] bg-[#10141c]/85 px-7 py-4 backdrop-blur-sm">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-white/45">
              {near === "foursquare" ? "Four Square Court" : "Tetherball Pole"}
            </div>
            <div className="font-display text-3xl text-[#ffd23e]">Press E to play</div>
          </div>
        ) : (
          <div className="rounded-full bg-[#10141c]/55 px-5 py-2 text-xs font-bold tracking-widest text-white/45 backdrop-blur-sm">
            Find a court
          </div>
        )}
      </div>
    </div>
  );
}