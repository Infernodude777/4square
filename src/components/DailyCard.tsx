import { todayChallenge, dailyProgress, dailyMet, todayKey } from "../game/daily";
import { useSettings } from "../game/settings";

/**
 * Today's recess special — a small card pinned to the top-left of the
 * hub HUD. Shows the challenge, live progress and a ✓ once complete.
 */
export function DailyCard() {
  const daily = useSettings((s) => s.daily);
  // todayChallenge() is a tiny deterministic hash — recompute each render so
  // the card rolls over at midnight even if the hub never remounts.
  const def = todayChallenge();

  const key = daily.key ?? "";
  const fresh = key === todayKey();
  const counters = daily.counters;
  const met = fresh && dailyMet(def, counters);
  const prog = fresh ? dailyProgress(def, counters) : 0;

  return (
    <div
      className={`pointer-events-auto absolute left-5 top-5 w-56 select-none rounded-2xl border-2 p-4 backdrop-blur-sm transition-all ${
        met ? "border-[#57d977] bg-[#0d1219]/82" : "border-[#ffd23e]/50 bg-[#0d1219]/82"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl">{def.emoji}</span>
        <div className="min-w-0">
          <div className="truncate text-[9px] font-extrabold tracking-[0.25em] text-white/45">
            TODAY'S RECESS SPECIAL
          </div>
          <div className="truncate font-display text-sm leading-tight text-[#ffd23e]">{def.title}</div>
        </div>
        {met && <span className="ml-auto rounded-full bg-[#57d977] px-2 py-0.5 text-[9px] font-extrabold text-[#0a2010]">DONE ✓</span>}
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
  );
}
