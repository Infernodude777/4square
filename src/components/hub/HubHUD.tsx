import { useEffect, useState } from "react";
import { RT } from "../../game/refs";
import { DailyCard } from "../DailyCard";
import { HallOfFame } from "../HallOfFame";
import { FOUR_SQUARE_POS, TETHER_POS, WALL_POS, SWING_POS, TAG_POS, KICK_POS, BASKET_POS, GAGA_POS, DODGE_POS, HOPSCOTCH_POS, REDLIGHT_POS, ENTER_R, NEAR_ANY_R } from "./constants";

type Near =
  | "foursquare" | "tetherball" | "wallball" | "swing" | "tag" | "kickball"
  | "basketball" | "dodgeball" | "gaga" | "hopscotch" | "redlight" | null;

function dist(pos: [number, number, number]) {
  const p = RT.entities.player.pos;
  return Math.hypot(p.x - pos[0], p.z - pos[2]);
}

const NEAR_LABEL: Record<Exclude<Near, null>, string> = {
  foursquare: "Four Square",
  tetherball: "Tetherball",
  wallball: "Wallball",
  swing: "Playground Swing",
  tag: "TAG!",
  kickball: "Kickball",
  basketball: "Basketball",
  dodgeball: "Dodgeball",
  gaga: "Gaga Ball",
  hopscotch: "Hopscotch",
  redlight: "Red Light, Green Light",
};

export function HubHUD({ onOpenSettings }: { onOpenSettings: () => void }) {
  const [near, setNear] = useState<Near>(null);
  const [activeSwing, setActiveSwing] = useState(false);
  const [recordsOpen, setRecordsOpen] = useState(false);

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
      const dB   = dist(BASKET_POS);
      const dG   = dist(GAGA_POS);
      const dD   = dist(DODGE_POS);
      const dH   = dist(HOPSCOTCH_POS);
      const dR   = dist(REDLIGHT_POS);
      // Entry radii are single-sourced from ENTER_R / NEAR_ANY_R, shared
      // with the HubDirector E-key handler — a prompt can never claim
      // "Press E" where pressing E does nothing.
      const E = ENTER_R;
      const N = NEAR_ANY_R;
      const nearCourt =
        d4 < N.foursquare || dt < N.tetherball || dw < N.wallball || ds < N.swing || dk < N.kickball ||
        dB < N.basketball || dG < N.gaga || dD < N.dodgeball || dH < N.hopscotch || dR < N.redlight;

      if (ds < E.swing && ds <= d4 && ds <= dt && ds <= dw && ds <= dk) setNear("swing");
      else if (dH < E.hopscotch) setNear("hopscotch");
      else if (dB < E.basketball) setNear("basketball");
      else if (dG < E.gaga) setNear("gaga");
      else if (dD < E.dodgeball) setNear("dodgeball");
      else if (dR < E.redlight) setNear("redlight");
      else if (d4 < E.foursquare && d4 <= dt && d4 <= dw && d4 <= dk) setNear("foursquare");
      else if (dt < E.tetherball && dt <= dw && dt <= dk) setNear("tetherball");
      else if (dk < E.kickball && dk <= dw) setNear("kickball");
      else if (dw < E.wallball) setNear("wallball");
      else if (!nearCourt && dtag < E.tag) setNear("tag");
      else setNear(null);
    }, 90);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 font-body">
      {/* Today's recess special — pinned top-left while exploring the yard */}
      <DailyCard />

      {/* Hall of Fame — records, badges & lifetime stats (top-right) */}
      <div className="pointer-events-auto absolute right-5 top-5 flex items-center gap-2">
        <button
          onClick={() => setRecordsOpen(true)}
          className="flex items-center gap-2 rounded-xl border-2 border-[#ffd23e]/50 bg-[#10141c]/85 px-3.5 py-2 font-display text-sm tracking-wide text-[#ffd23e] backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-[#ffd23e]/15 hover:shadow-[0_0_24px_rgba(255,210,62,0.25)] active:translate-y-0 active:scale-95"
          title="Hall of Fame — records, badges & stats"
          aria-label="Open Hall of Fame"
        >
          🏅 HALL OF FAME
        </button>
        <button
          onClick={onOpenSettings}
          className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-white/15 bg-[#10141c]/85 text-lg backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white/10 active:translate-y-0 active:scale-95"
          title="Settings — volume, music, difficulty & feel"
          aria-label="Open settings"
        >
          ⚙️
        </button>
      </div>
      {recordsOpen && <HallOfFame onClose={() => setRecordsOpen(false)} />}

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
        {near ? (
          <div className="animate-bannerin rounded-2xl border-2 border-[#ffd23e] bg-[#10141c]/85 px-7 py-4 backdrop-blur-sm">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-white/45">
              {NEAR_LABEL[near]}
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
