import { useEffect, useState } from "react";
import { dayFraction } from "../../game/atmosphere";
import { bellCountdown, bellRang, periodAt, timeOfDay } from "../../game/bells";
import { Icon } from "../Icons";

/** Format a seconds countdown as M:SS. */
function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

/**
 * The school clock — a chalk chip pinned to the top of the hub.
 * Shows the wall-clock time, the current period, and the countdown
 * to the last bell. When the bell rings the chip flips to a golden
 * SCHOOL'S OUT celebration.
 */
export function BellClock() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setTick((x) => x + 1), 500);
    return () => clearInterval(iv);
  }, []);
  void tick;

  const f = dayFraction();
  const period = periodAt(f);
  const out = bellRang(f);

  return (
    <div
      className={`pointer-events-none absolute left-1/2 top-5 flex -translate-x-1/2 items-center gap-2.5 rounded-2xl border-2 px-4 py-2 backdrop-blur-sm transition-colors ${
        out ? "border-[#ffd23e]/80 bg-[#10141c]/90" : "border-white/15 bg-[#0d1219]/80"
      }`}
    >
      <Icon name="bell" size={16} className={out ? "text-[#ffd23e]" : "text-white/45"} />
      <div className="leading-none">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-lg tracking-wide text-white/90">{timeOfDay(f)}</span>
          <span
            className={`text-[8px] font-extrabold tracking-[0.25em] ${out ? "text-[#ffd23e]" : "text-white/40"}`}
          >
            {out ? "SCHOOL'S OUT" : period.label}
          </span>
        </div>
        <div
          className={`mt-0.5 text-[9px] font-bold tabular-nums ${out ? "text-[#ffd23e]/80" : "text-white/35"}`}
        >
          {out ? `overtime recess · bell in ${fmt(bellCountdown(f))}` : `bell in ${fmt(bellCountdown(f))}`}
        </div>
      </div>
    </div>
  );
}
