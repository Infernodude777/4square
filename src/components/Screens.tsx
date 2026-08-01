import { useMemo, useState } from "react";
import { BOTS, TARGET_SCORE, type EntityId } from "../game/constants";
import { useGame, type Mode } from "../game/store";
import { WIN_WRAPS } from "../game/tetherball";

const BOT_IDS = Object.keys(BOTS) as Exclude<EntityId, "player">[];

function ChalkSquiggle() {
  return (
    <svg viewBox="0 0 320 14" className="h-3 w-72 text-[#ffd23e]" fill="none" aria-hidden="true">
      <path
        d="M4 8 C 30 2, 55 12, 82 7 S 130 3, 158 8 S 210 12, 240 6 S 290 4, 316 9"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}

function ModeCard({
  mode,
  active,
  onPick,
  title,
  subtitle,
  emoji,
  tint,
  desc,
}: {
  mode: Mode;
  active: boolean;
  onPick: (mode: Mode) => void;
  title: string;
  subtitle: string;
  emoji: string;
  tint: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(mode)}
      className={`relative flex w-full flex-col items-start gap-1 rounded-2xl border-4 p-4 text-left transition-all ${
        active
          ? "-translate-y-1 scale-[1.02] shadow-[0_0_50px_rgba(255,210,62,0.35)]"
          : "hover:-translate-y-0.5 hover:bg-white/5"
      }`}
      style={{
        borderColor: active ? tint : "rgba(255,255,255,0.15)",
        background: active ? `${tint}18` : "rgba(0,0,0,0.25)",
      }}
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl" aria-hidden="true">{emoji}</span>
        <div>
          <div className="font-display text-xl leading-none" style={{ color: tint }}>{title}</div>
          <div className="text-[10px] font-bold tracking-widest text-white/50">{subtitle}</div>
        </div>
      </div>
      <p className="text-[11px] font-bold leading-snug text-white/70">{desc}</p>
      {active && (
        <div className="absolute -right-2 -top-2 rounded-full bg-[#ffd23e] px-2 py-0.5 text-[9px] font-extrabold tracking-widest text-[#3a2a00]">
          SELECTED
        </div>
      )}
    </button>
  );
}

const MODE_COPY: Record<Mode, { title: string; subtitle: string; tint: string; emoji: string; desc: string }> = {
  foursquare: {
    title: "FOUR SQUARE",
    subtitle: "RECESS ROYALE · 4 BOTS",
    tint: "#ffd23e",
    emoji: "🟨🟥🟩🟦",
    desc: `Classic playground four-square. Rotate up through the ranks, dethrone the King, race to ${TARGET_SCORE}.`,
  },
  tetherball: {
    title: "TETHERBALL",
    subtitle: "POLE DUEL · 1V1",
    tint: "#ff8a3c",
    emoji: "🎯",
    desc: `One-on-one against REX. Wind the rope your way and land ${WIN_WRAPS} winning wraps above the yellow mark.`,
  },
  wallball: {
    title: "WALLBALL",
    subtitle: "REBOUND RALLY · 1V1",
    tint: "#ff6b5e",
    emoji: "🧱",
    desc: "Knife the ball into the wall, read the rebound, and outlast ZIGGY in a fast blacktop rally.",
  },
  tag: {
    title: "TAG",
    subtitle: "LAST ONE STANDING · 6 PLAYERS",
    tint: "#7dff9a",
    emoji: "🏃",
    desc: "Chase the red IT marker across the field. Burn stamina, cut corners, and tag seven runners to own recess.",
  },
  kickball: {
    title: "KICKBALL",
    subtitle: "DIAMOND DASH · SCHOOLYARD CLASSIC",
    tint: "#ffb347",
    emoji: "⚾",
    desc: "Wait for the roll, kick into space, beat the fielders, and turn every safe kick into a playground story.",
  },
};

export function Menu() {
  const start = useGame((state) => state.start);
  const [mode, setMode] = useState<Mode>("foursquare");
  const copy = MODE_COPY[mode];
  const isFourSquare = mode === "foursquare";

  return (
    <div className="chalkboard absolute inset-0 z-20 flex items-center justify-center overflow-y-auto p-6 font-body">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-stretch gap-6 lg:flex-row">
        <div className="flex flex-1 flex-col justify-center">
          <div className="font-display text-lg tracking-[0.3em] text-[#8fd8cf]">THE SCHOOLYARD GAUNTLET</div>
          <h1
            className="mt-1 font-display text-7xl leading-[0.95] text-[#ffd23e] md:text-8xl"
            style={{ textShadow: "0 4px 0 #c23227, 0 9px 0 rgba(0,0,0,0.35)" }}
          >
            {copy.title.split(" ")[0]}
            <br />
            {copy.title.split(" ").slice(1).join(" ")}
          </h1>
          <div className="mt-1 font-display text-2xl tracking-widest" style={{ color: copy.tint }}>{copy.subtitle}</div>
          <div className="mt-3"><ChalkSquiggle /></div>
          <p className="mt-3 max-w-md text-sm font-bold leading-relaxed text-white/75">{copy.desc}</p>
          <div className="mt-5 grid max-w-md grid-cols-1 gap-x-6 gap-y-1.5 text-[13px] font-bold text-white/70 sm:grid-cols-2">
            {isFourSquare ? (
              <>
                <div><span className="text-[#ffd23e]">◈</span> Ball bounces once per square</div>
                <div><span className="text-[#ffd23e]">◈</span> Fault = back of the line</div>
                <div><span className="text-[#ffd23e]">◈</span> Rotate up on every miss</div>
                <div><span className="text-[#ffd23e]">◈</span> First to {TARGET_SCORE} rules the yard</div>
              </>
            ) : mode === "tetherball" ? (
              <>
                <div><span className="text-[#ffd23e]">◈</span> Wind counter-clockwise</div>
                <div><span className="text-[#ffd23e]">◈</span> Dodge fouls at the pole</div>
                <div><span className="text-[#ffd23e]">◈</span> Final wrap above the mark</div>
                <div><span className="text-[#ffd23e]">◈</span> {WIN_WRAPS} wraps = victory</div>
              </>
            ) : mode === "tag" ? (
              <>
                <div><span className="text-[#7dff9a]">◈</span> Six players share the field</div>
                <div><span className="text-[#7dff9a]">◈</span> Hold Shift to sprint</div>
                <div><span className="text-[#7dff9a]">◈</span> Touch the runner while IT</div>
                <div><span className="text-[#7dff9a]">◈</span> Seven tags wins recess</div>
              </>
            ) : mode === "kickball" ? (
              <>
                <div><span className="text-[#ffb347]">◈</span> Wait for the rolling pitch</div>
                <div><span className="text-[#ffb347]">◈</span> Space or click to kick</div>
                <div><span className="text-[#ffb347]">◈</span> Move to set up the kick</div>
                <div><span className="text-[#ffb347]">◈</span> Three outs ends the inning</div>
              </>
            ) : (
              <>
                <div><span className="text-[#ff6b5e]">◈</span> Aim with the mouse</div>
                <div><span className="text-[#ff6b5e]">◈</span> Return every rebound</div>
                <div><span className="text-[#ff6b5e]">◈</span> Keep the rally alive</div>
                <div><span className="text-[#ff6b5e]">◈</span> First to the target wins</div>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => start(mode)}
            className="group mt-7 w-fit rounded-2xl border-b-[6px] border-[#8f6a00] bg-[#ffd23e] px-10 py-4 font-display text-3xl tracking-wide text-[#3a2a00] transition-all hover:-translate-y-0.5 hover:bg-[#ffe066] active:translate-y-0.5 active:border-b-2"
          >
            START {copy.title} ▸
          </button>
          <div className="mt-2 text-[11px] font-bold tracking-widest text-white/40">SOUND ON RECOMMENDED 🔔 · WASD MOVE · SPACE / CLICK ACTION</div>
        </div>

        <div className="flex w-full max-w-sm flex-col gap-3 lg:w-96">
          <div className="mb-1 font-display text-sm tracking-[0.25em] text-white/80">CHOOSE YOUR GAME</div>
          {(Object.keys(MODE_COPY) as Mode[]).map((candidate) => {
            const item = MODE_COPY[candidate];
            return <ModeCard key={candidate} mode={candidate} active={mode === candidate} onPick={setMode} {...item} />;
          })}
          {isFourSquare ? (
            <div className="rounded-2xl border-2 border-dashed border-white/25 bg-black/25 p-4">
              <div className="mb-2 font-display text-sm tracking-[0.25em] text-white/80">TODAY'S DETENTION BOTS</div>
              {BOT_IDS.map((id) => {
                const bot = BOTS[id];
                return (
                  <div key={id} className="mb-2 flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md font-display text-xs text-black/80" style={{ background: bot.color }}>{bot.short}</div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-extrabold text-white/90">{bot.name}</div>
                      <div className="truncate text-[10px] font-bold text-white/50">{bot.tag}</div>
                    </div>
                    <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((i) => <span key={i} className={`text-[9px] ${i <= Math.round(bot.skill * 5) ? "text-[#ffd23e]" : "text-white/20"}`}>★</span>)}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-white/25 bg-black/25 p-4 text-[11px] font-bold text-white/65">
              <div className="mb-2 font-display text-sm tracking-[0.25em] text-white/80">PLAYGROUND NOTE</div>
              {mode === "tag" ? "Five bots roam the field. Watch the IT badge and cut behind them." : mode === "kickball" ? "ZIGGY pitches while ADA, GRACE, ALAN, and TURING patrol the diamond." : `${copy.title} is ready on the blacktop. Step in and make the yard yours.`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Victory() {
  const st = useGame();
  const confetti = useMemo(
    () => Array.from({ length: 28 }, (_, i) => ({
      left: 6 + Math.random() * 88,
      delay: Math.random() * 5,
      dur: 3.2 + Math.random() * 2.2,
      color: ["#d4a96e", "#f0e8d0", "#a8d0f0", "#c8e8b0", "#f0b8c0"][i % 5],
      w: 3 + Math.random() * 4,
      h: 3 + Math.random() * 4,
    })),
    [],
  );
  const isTether = st.mode === "tetherball";
  const title = st.mode === "tetherball" ? "TETHERBALL" : st.mode === "wallball" ? "WALLBALL" : st.mode === "tag" ? "TAG" : st.mode === "kickball" ? "KICKBALL" : "FOUR SQUARE";
  const subtitle = st.mode === "tetherball" ? "POLE WINNER" : st.mode === "wallball" ? "WALL MASTER" : st.mode === "tag" ? "FIELD CHAMP" : st.mode === "kickball" ? "DIAMOND DASH" : "RECESS KING";
  const note = st.mode === "tetherball" ? "Today's tether king" : st.mode === "wallball" ? "Wallball champion" : st.mode === "tag" ? "Tag field champion" : st.mode === "kickball" ? "Diamond dash champion" : "Four-square hall monitor";
  const stats = st.mode === "tetherball"
    ? [["Points", st.score, "#3542ff"], ["Your Fouls", st.fouls, "#f05a40"], ["Bot Fouls", st.opFouls, "#3a9a40"]] as const
    : st.mode === "wallball"
      ? [["Your Score", Math.max(0, st.score), "#3542ff"], ["Bot Score", Math.max(0, -st.score), "#f05a40"], ["Rallies", st.rallies, "#3a9a40"]] as const
      : st.mode === "tag"
        ? [["Tags", st.score, "#7d8cff"], ["Rallies", st.rallies, "#3a9a40"], ["Best", st.bestStreak, "#c05050"]] as const
        : st.mode === "kickball"
          ? [["Runs", Math.max(0, st.score / 2), "#f0a020"], ["Hits", st.hits, "#4050c0"], ["Outs", st.kos, "#c05050"]] as const
          : [["Points", st.score, "#F0A020"], ["Hits", st.hits, "#4050c0"], ["Perfect", st.perfects, "#20a8a0"], ["Kos", st.kos, "#c05050"], ["Streak", st.bestStreak, "#8050a0"], ["Rallies", st.rallies, "#308050"]] as const;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#102530]/90 font-body backdrop-blur-[4px]">
      {confetti.map((piece, i) => <span key={i} className="confetti-piece" style={{ left: `${piece.left}%`, width: piece.w, height: piece.h, background: piece.color, animationDelay: `${piece.delay}s`, animationDuration: `${piece.dur}s`, opacity: 0.35 }} />)}
      <div className="relative mx-4 w-full max-w-md animate-cardin overflow-hidden rounded-xl border-[3px] border-[#f5edc8] bg-[#fdfaf2] px-7 py-8 shadow-[0_24px_70px_rgba(0,0,0,0.6)]" style={{ fontFamily: "'Nunito', system-ui, sans-serif" }}>
        <div className="absolute left-1/2 top-0 flex -translate-x-1/2 gap-5"><div className="h-6 w-10 -rotate-[8deg] rounded-b-sm bg-[#f8e070] opacity-80 shadow-sm" /><div className="h-6 w-10 rotate-[6deg] rounded-b-sm bg-[#f8e070] opacity-80 shadow-sm" /></div>
        <div className="mb-1 mt-3 text-center text-[10px] font-extrabold uppercase tracking-[0.3em] text-[#64748b]">{isTether ? "RECESS REPORT CARD" : "DETENTION NOTICE"}</div>
        <h1 className="font-display text-center leading-[0.95] text-[#1a2740]" style={{ padding: "14px 0 6px" }}><span style={{ fontSize: 60, display: "block", fontFamily: "'Luckiest Guy', cursive" }}>{title}<br /><span style={{ fontSize: 48, display: "block", color: "#c23227" }}>{subtitle}</span></span></h1>
        <p className="mt-1 text-center text-sm font-bold italic leading-relaxed" style={{ color: "#7a8899" }}>{st.mode === "tag" ? "You owned the whole field. Nobody could keep up." : st.mode === "kickball" ? "You kicked it into the gap and left the fielders chasing dust." : st.mode === "tetherball" ? "You just hung the whole thing up. REX is still staring at the pole." : st.mode === "wallball" ? "You just knifed the last slice past ZIGGY. He's still searching the fence." : "You owned the blacktop. Every bot, every square, every badge. Recess is yours."}</p>
        <div className="mx-auto my-5 w-11/12 border-b-2 border-dashed border-[#d8b8a0]" />
        <div className="grid grid-cols-3 gap-4 text-center">{stats.map(([label, value, color]) => <div key={label} className="flex flex-col items-center"><span className="font-display text-4xl leading-none" style={{ color, fontSize: 48 }}>{value}</span><span className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#a08870]">{label}</span></div>)}</div>
        <div className="mx-auto mt-6 flex w-fit items-center gap-3 rounded-lg border-2 border-dashed border-[#c09880] px-4 py-2" style={{ background: "rgba(255,225,180,0.35)" }}>
          <svg width="34" height="26" viewBox="0 0 34 26" aria-hidden="true"><path d="M17 2 2 12l15 10 15-10-15-10z" fill="#2F4460" /><rect x="25" y="10" width="2.5" height="14" rx="1" fill="#C89628" /><path d="M27.5 24c0 2.8-1.2 5.4-2.5 5.4s-2.5-2.6-2.5-5.4" fill="#C89628" /></svg>
          <div className="flex flex-col"><span className="text-[11px] font-extrabold uppercase tracking-widest text-[#4a3a28]">{note}</span><span className="text-[10px] font-bold text-[#907060]">Graduated recess, top of class</span></div>
        </div>
        <div className="mt-6 flex gap-3"><button type="button" onClick={() => st.start(st.mode)} className="flex-1 rounded-none border-b-[5px] border-[#a06b20] bg-[#f8d44c] px-6 py-3 font-display text-xl text-[#2e1a05] transition-all hover:bg-[#f8e060] active:translate-y-0.5 active:border-b-0">PLAY AGAIN</button><button type="button" onClick={st.toMenu} className="rounded-none border-2 border-dashed border-[#a09888] px-6 py-3 text-sm font-bold text-[#8a7055] transition hover:bg-[#f0e8d8]">BACK</button></div>
      </div>
    </div>
  );
}
