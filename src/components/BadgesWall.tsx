import { BADGES, useBadges } from "../game/achievements";

/** The chalkboard badge wall — earned badges shine, secrets hide. */
export function BadgesWall() {
  const unlocked = useBadges((s) => s.unlocked);
  const earned = unlocked.length;

  return (
    <div className="rounded-2xl border-2 border-dashed border-white/20 bg-black/25 p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-display text-sm tracking-[0.25em] text-white/80">BADGE WALL</div>
        <div className="text-[10px] font-bold text-[#ffd23e]">{earned}/{BADGES.length}</div>
      </div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {BADGES.map((b) => {
          const got = unlocked.includes(b.id);
          return (
            <div
              key={b.id}
              title={got ? `${b.name} — ${b.desc}` : "???"}
              className={`flex aspect-square flex-col items-center justify-center rounded-lg border text-center transition ${
                got
                  ? "border-[#ffd23e]/50 bg-[#ffd23e]/10"
                  : b.secret
                    ? "border-white/5 bg-white/[0.02] opacity-40"
                    : "border-white/10 bg-white/5 opacity-60 grayscale"
              }`}
            >
              <span className={`text-xl ${got ? "" : "grayscale"}`}>
                {got || !b.secret ? b.emoji : "❔"}
              </span>
              <span className={`mt-0.5 px-0.5 text-[6px] font-extrabold leading-tight tracking-wide ${got ? "text-[#ffd23e]" : "text-white/35"}`}>
                {got || !b.secret ? b.name : "SECRET"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
