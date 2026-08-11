import { useEffect } from "react";
import { useSettings, RECORD_META, formatRecord } from "../game/settings";
import { recordFraction, rankForFraction } from "../game/rank";
import { BadgesWall } from "./BadgesWall";

/** The ten shipped courts, with the chalk tints used across the yard. */
const RECORD_MODES: { mode: string; title: string; tint: string; emoji: string }[] = [
  { mode: "foursquare", title: "FOUR SQUARE", tint: "#ffd23e", emoji: "🟨" },
  { mode: "tetherball", title: "TETHERBALL", tint: "#ff8a3c", emoji: "🎯" },
  { mode: "wallball", title: "WALLBALL", tint: "#ff6b5e", emoji: "🧱" },
  { mode: "tag", title: "TAG!", tint: "#e2483d", emoji: "🏃" },
  { mode: "kickball", title: "KICKBALL", tint: "#7fc4ff", emoji: "🦵" },
  { mode: "basketball", title: "BASKETBALL", tint: "#ffa63e", emoji: "🏀" },
  { mode: "dodgeball", title: "DODGEBALL", tint: "#ff5a3c", emoji: "🥎" },
  { mode: "gaga", title: "GAGA BALL", tint: "#b58cff", emoji: "🤾" },
  { mode: "hopscotch", title: "HOPSCOTCH", tint: "#8ae06b", emoji: "🦘" },
  { mode: "redlight", title: "RED LIGHT GREEN LIGHT", tint: "#57d977", emoji: "🚦" },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 mt-6 flex items-center gap-2 first:mt-0">
      <span className="h-px w-6 bg-white/25" />
      <span className="font-display text-xs tracking-[0.3em] text-white/60">{children}</span>
      <span className="h-px flex-1 bg-white/25" />
    </div>
  );
}

/**
 * The hub's trophy wall — Hall of Records, the Badge Wall and lifetime stats,
 * so all the persisted progress is visible without leaving the playground.
 * Reuses the existing <BadgesWall/> so badges stay a single source of truth.
 *
 * Season 2: the wall opens with a BLACKTOP RANK banner (the best chalk title
 * across every court) and each played court shows a win-rate chip.
 */
export function HallOfFame({ onClose }: { onClose: () => void }) {
  const highScores = useSettings((s) => s.highScores);
  const stats = useSettings((s) => s.stats);
  const modePlays = useSettings((s) => s.modePlays);

  // ESC closes the panel, same as every other overlay in the game.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const best = Math.max(1, ...RECORD_MODES.map((r) => highScores[r.mode] ?? 0));
  // For low-kind records (hopscotch time) the bar grows as the score
  // shrinks — shorter is better, so it fills toward the best time.
  const lowKinds = RECORD_MODES.filter(
    (r) => RECORD_META[r.mode]?.kind === "low" && highScores[r.mode] !== undefined,
  );
  const lowBest = lowKinds.length ? Math.min(...lowKinds.map((r) => highScores[r.mode]!)) : 0;

  // Overall blacktop rank — the best record fraction across every court.
  const bestFraction = Math.max(
    0,
    ...RECORD_MODES.map((r) => {
      const v = highScores[r.mode];
      if (v === undefined) return 0;
      return recordFraction(RECORD_META[r.mode]?.kind ?? "high", v);
    }),
  );
  const overall = rankForFraction(bestFraction);

  return (
    <div
      className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[3px]"
      onClick={onClose}
    >
      <div
        className="chalkboard animate-cardin flex max-h-[86vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border-4 border-[#f5edc8]/60 shadow-[0_24px_80px_rgba(0,0,0,0.65)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── header ── */}
        <div className="flex items-center justify-between border-b-2 border-dashed border-white/15 px-6 py-4">
          <div>
            <div className="font-display text-[9px] tracking-[0.35em] text-[#8fd8cf]">
              FALCON ELEMENTARY · OFFICIAL RECORDS
            </div>
            <h2
              className="font-display text-3xl leading-none text-[#ffd23e]"
              style={{ textShadow: "0 3px 0 rgba(0,0,0,0.55)" }}
            >
              HALL OF FAME
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-white/15 bg-white/5 text-base text-white/70 transition hover:border-[#ff6b5e] hover:bg-[#ff6b5e]/15 hover:text-[#ff8a7a]"
            title="Close (ESC)"
            aria-label="Close Hall of Fame"
          >
            ✕
          </button>
        </div>

        {/* ── body ── */}
        <div className="overflow-y-auto px-6 pb-6 pt-5">
          {/* Blacktop rank (Season 2) */}
          <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-white/15 bg-black/25 px-4 py-3">
            <span className="text-3xl leading-none">{overall.emoji}</span>
            <div>
              <div className="text-[9px] font-extrabold tracking-[0.3em] text-white/40">BLACKTOP RANK</div>
              <div className="font-display text-2xl leading-none" style={{ color: overall.tint }}>
                {overall.title}
              </div>
            </div>
            <div className="ml-auto text-right text-[9px] font-bold leading-snug text-white/35">
              best title earned
              <br />
              across all courts
            </div>
          </div>

          {/* Hall of Records */}
          <SectionLabel>HALL OF RECORDS</SectionLabel>
          <div className="grid gap-2 sm:grid-cols-2">
            {RECORD_MODES.map((r) => {
              const score = highScores[r.mode];
              const meta = RECORD_META[r.mode];
              const has = score !== undefined;
              const width = !has
                ? 0
                : (meta?.kind ?? "high") === "low"
                  ? lowBest > 0
                    ? Math.min(100, (lowBest / score) * 100)
                    : 0
                  : (score / best) * 100;
              return (
                <div
                  key={r.mode}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5"
                >
                  <span className="text-xl leading-none">{r.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-display text-sm" style={{ color: r.tint }}>
                        {r.title}
                      </span>
                      <span
                        className="font-display text-lg leading-none text-[#ffe066] tabular-nums"
                        title={meta ? meta.label : undefined}
                      >
                        {has ? formatRecord(r.mode, score!) : "—"}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${width}%`, background: r.tint }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-1.5 text-right text-[9px] font-bold tracking-widest text-white/30">
            BEST RESULT PER COURT
          </div>

          {/* Win rates (Season 2) */}
          <SectionLabel>WIN RATES</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {RECORD_MODES.filter((r) => (modePlays[r.mode] ?? 0) > 0).map((r) => {
              const plays = modePlays[r.mode] ?? 0;
              const wins = stats.modeWins[r.mode] ?? 0;
              const pct = Math.round((wins / plays) * 100);
              return (
                <span
                  key={r.mode}
                  className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[9px] font-extrabold text-white/60"
                >
                  <span className="text-xs">{r.emoji}</span>
                  {r.title}
                  <span className="tabular-nums" style={{ color: r.tint }}>
                    {wins}/{plays} · {pct}%
                  </span>
                </span>
              );
            })}
          </div>

          {/* Badge Wall */}
          <SectionLabel>BADGE WALL</SectionLabel>
          <BadgesWall />

          {/* Lifetime stats */}
          <SectionLabel>LIFETIME STATS</SectionLabel>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-[11px] font-bold text-white/65 sm:grid-cols-4">
            <span>Games · <span className="text-[#ffd23e] tabular-nums">{stats.gamesPlayed}</span></span>
            <span>Wins · <span className="text-[#ffd23e] tabular-nums">{stats.totalWins}</span></span>
            <span>Time · <span className="text-[#ffd23e] tabular-nums">{Math.floor(stats.timePlayed / 60)}m</span></span>
            <span>Hits · <span className="text-[#ffd23e] tabular-nums">{stats.totalHits}</span></span>
            <span>Perfects · <span className="text-[#ffd23e] tabular-nums">{stats.totalPerfects}</span></span>
            <span>KOs · <span className="text-[#ffd23e] tabular-nums">{stats.totalKOs}</span></span>
            <span>Rallies · <span className="text-[#ffd23e] tabular-nums">{stats.totalRallies}</span></span>
            <span>Kickball runs · <span className="text-[#ffd23e] tabular-nums">{stats.totalRuns}</span></span>
            <span>Catches · <span className="text-[#ffd23e] tabular-nums">{stats.totalCatch}</span></span>
            <span>Swishes · <span className="text-[#ffd23e] tabular-nums">{stats.totalSwishes}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
