import { useState } from "react";
import { todayChallenge, dailyProgress, dailyMet, todayKey } from "../game/daily";
import { useSettings } from "../game/settings";

/**
 * Today's recess special — a compact, collapsible chip pinned to the
 * top-left of the hub HUD. Collapsed it's a single slim pill (emoji +
 * challenge name + live progress); clicking it opens the full card with
 * the goal and progress bar. This keeps the yard HUD light by default
 * while still surfacing the one thing worth checking each day.
 */
export function DailyCard() {
  const [open, setOpen] = useState(false);
  const daily = useSettings((s) => s.daily);
  // todayChallenge() is a tiny deterministic hash — recompute each render so
  // the card rolls over at midnight even if the hub never remounts.
  const def = todayChallenge();

  const key = daily.key ?? "";
  const fresh = key === todayKey();
  const counters = daily.counters;
  const met = fresh && dailyMet(def, counters);
  const prog = fresh ? dailyProgress(def, counters) : 0;
  const raw = fresh ? def.measure(counters) : 0;
  const shown = Math.min(raw, def.target);

  return (
    <div className="pointer-events-auto absolute left-5 top-5 select-none">
      {open ? (
        <div className="animate-cardin w-64 rounded-2xl border-2 border-[#ffd23e]/50 bg-[#0d1219]/90 p-4 backdrop-blur-sm">
          <div className="flex items-start gap-2">
            <span className="text-2xl leading-none">{def.emoji}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[9px] font-extrabold tracking-[0.25em] text-white/45">
                TODAY'S RECESS SPECIAL
              </div>
              <div className="truncate font-display text-sm leading-tight text-[#ffd23e]">{def.title}</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Collapse daily challenge"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white/40 transition hover:bg-white/10 hover:text-white/80"
            >
              ✕
            </button>
          </div>
          <div className="mt-2 text-[11px] font-bold text-white/75">{def.goal}</div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#ffd23e] to-[#57d977] transition-all duration-500"
              style={{ width: `${Math.min(100, prog * 100)}%` }}
            />
          </div>
          <div className="mt-1 text-[9px] font-bold tracking-widest text-white/35">
            {fresh ? (met ? "COME BACK TOMORROW" : "RESETS AT MIDNIGHT") : "A NEW DAY AWAITS"}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          title="Today's recess special"
          aria-label="Open today's recess special"
          className="group flex items-center gap-2 rounded-full border-2 border-[#ffd23e]/45 bg-[#0d1219]/85 py-1.5 pl-2.5 pr-3 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-[#ffd23e]/80 hover:bg-[#ffd23e]/10"
        >
          <span className="text-lg leading-none">{def.emoji}</span>
          <span className="truncate font-display text-xs tracking-wide text-[#ffd23e]">{def.title}</span>
          <span
            className={`rounded-full px-1.5 py-0.5 text-[9px] font-extrabold tabular-nums ${
              met ? "bg-[#57d977] text-[#0a2010]" : "bg-white/10 text-white/60"
            }`}
          >
            {met ? "DONE" : `${shown}/${def.target}`}
          </span>
        </button>
      )}
    </div>
  );
}
