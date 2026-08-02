import { useMemo, useState } from "react";
import { BOTS, TARGET_SCORE, type EntityId } from "../game/constants";
import { useGame, type Mode } from "../game/store";
import { WIN_WRAPS } from "../game/tetherball";
import { useSettings } from "../game/settings";
import { BadgesWall } from "./BadgesWall";

const BOT_IDS = Object.keys(BOTS) as Exclude<EntityId, "player">[];

function ChalkSquiggle() {
  return (
    <svg viewBox="0 0 320 14" className="h-3 w-72 text-[#ffd23e]" fill="none">
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

/* ── the mode-picker card ─────────────────────────────────── */
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
  onPick: (m: Mode) => void;
  title: string;
  subtitle: string;
  emoji: string;
  tint: string;
  desc: string;
}) {
  return (
    <button
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
        <span className="text-3xl">{emoji}</span>
        <div>
          <div className="font-display text-xl leading-none" style={{ color: tint }}>
            {title}
          </div>
          <div className="text-[10px] font-bold tracking-widest text-white/50">{subtitle}</div>
        </div>
      </div>
      <p className="text-[11px] font-bold leading-snug text-white/70">{desc}</p>
      {active && (
        <div className="absolute -top-2 -right-2 rounded-full bg-[#ffd23e] px-2 py-0.5 text-[9px] font-extrabold tracking-widest text-[#3a2a00]">
          SELECTED
        </div>
      )}
    </button>
  );
}

const MODE_COPY: Record<Mode, { title: string; sub: string; emoji: string; tint: string; desc: string; head: string; rules: string[] }> = {
  foursquare: {
    title: "FOUR SQUARE",
    sub: "RECESS ROYALE · 4 BOTS",
    emoji: "🟨🟥🟩🟦",
    tint: "#ffd23e",
    desc: "Classic playground four-square. Rotate up through the ranks, dethrone the King, race to 30.",
    head: "FOUR\nSQUARE",
    rules: [
      "Ball bounces once per square",
      "Fault = back of the line",
      "Rotate up on every miss",
      `First to ${TARGET_SCORE} rules the yard`,
    ],
  },
  tetherball: {
    title: "TETHERBALL",
    sub: "POLE DUEL · 1V1",
    emoji: "🎯",
    tint: "#ff8a3c",
    desc: "One-on-one against REX. Wind the rope your way, dodge fouls, land the winning wrap above the yellow mark.",
    head: "TETHER\nBALL",
    rules: [
      "You wind counter-clockwise",
      "Bot winds the other way",
      "Final wrap above the height mark",
      `${WIN_WRAPS} wraps = victory 👑`,
    ],
  },
  kickball: {
    title: "KICKBALL",
    sub: "RECESS STAPLE · 3 INNINGS",
    emoji: "🦵",
    tint: "#7fc4ff",
    desc: "You against the yard. Time the pitch, kick it past the bots, and run like the bell is about to ring.",
    head: "KICK\nBALL",
    rules: [
      "Click when the ball hits the plate",
      "Right-click to bunt",
      "Beat the throw to the base",
      "3 innings · most runs wins",
    ],
  },
  wallball: {
    title: "WALLBALL",
    sub: "WALL MASTER · 1V1",
    emoji: "🧱",
    tint: "#ff6b5e",
    desc: "Beat ZIGGY at his own game — bounce, slam, repeat. First to 11 owns the bricks.",
    head: "WALL\nBALL",
    rules: [
      "Bounce before the wall",
      "One bounce back before you hit",
      "First to 11 wins",
    ],
  },
  tag: {
    title: "TAG!",
    sub: "THREE VARIETIES",
    emoji: "🏃",
    tint: "#e2483d",
    desc: "Regular, freeze, or blob tag across the whole blacktop. Don't be IT — or be the best at it.",
    head: "TAG!",
    rules: [
      "Avoid being IT",
      "Freeze tag: unfreeze teammates",
      "Blob tag: last one free wins",
    ],
  },
};

export function Menu() {
  const start = useGame((s) => s.start);
  const [mode, setMode] = useState<Mode>("foursquare");
  const highScores = useSettings((s) => s.highScores);

  const copy = MODE_COPY[mode];
  const isFS = mode === "foursquare";

  return (
    <div className="chalkboard absolute inset-0 z-20 flex items-center justify-center overflow-y-auto p-6 font-body">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-stretch gap-6 lg:flex-row">
        {/* ── left: title + description ─────────────────── */}
        <div className="flex flex-1 flex-col justify-center">
          <div className="font-display text-lg tracking-[0.3em] text-[#8fd8cf]">THE SCHOOLYARD GAUNTLET</div>
          <h1
            className="font-display text-6xl leading-[0.95] text-[#ffd23e] md:text-7xl"
            style={{ textShadow: "0 4px 0 #c23227, 0 9px 0 rgba(0,0,0,0.35)" }}
          >
            {copy.head.split("\n").map((l) => (
              <span key={l} className="block">{l}</span>
            ))}
          </h1>
          <div className="mt-1 font-display text-2xl tracking-widest text-[#ff8a7a]">{copy.sub}</div>
          <div className="mt-3">
            <ChalkSquiggle />
          </div>
          <p className="mt-3 max-w-md text-sm font-bold leading-relaxed text-white/75">{copy.desc}</p>

          <div className="mt-5 grid max-w-md grid-cols-1 gap-x-6 gap-y-1.5 text-[13px] font-bold text-white/70 sm:grid-cols-2">
            {copy.rules.map((r) => (
              <div key={r}><span className="text-[#ffd23e]">◈</span> {r}</div>
            ))}
          </div>

          <button
            onClick={() => start(mode)}
            className="group mt-7 w-fit rounded-2xl border-b-[6px] border-[#8f6a00] bg-[#ffd23e] px-10 py-4 font-display text-3xl tracking-wide text-[#3a2a00] transition-all hover:-translate-y-0.5 hover:bg-[#ffe066] active:translate-y-0.5 active:border-b-2"
          >
            {mode === "foursquare" ? "CLAIM SQUARE 1 ▸" : mode === "tetherball" ? "STEP TO THE POLE ▸" : mode === "kickball" ? "STEP TO THE PLATE ▸" : mode === "wallball" ? "FACE THE WALL ▸" : "RUN, DON'T WALK ▸"}
          </button>
          <div className="mt-2 text-[11px] font-bold tracking-widest text-white/40">
            SOUND ON RECOMMENDED 🔔 · WASD MOVE · SPACE JUMP · C CROUCH · CLICK HIT · ESC PAUSE
          </div>
        </div>

        {/* ── right: mode picker + extras ──────────────────── */}
        <div className="flex w-full max-w-sm flex-col gap-3 lg:w-96">
          <div className="mb-1 font-display text-sm tracking-[0.25em] text-white/80">CHOOSE YOUR GAME</div>
          {(Object.keys(MODE_COPY) as Mode[]).map((m) => {
            const c = MODE_COPY[m];
            return (
              <ModeCard
                key={m}
                mode={m}
                active={mode === m}
                onPick={setMode}
                title={c.title}
                subtitle={c.sub}
                emoji={c.emoji}
                tint={c.tint}
                desc={c.desc}
              />
            );
          })}

          {/* High scores */}
          <div className="rounded-2xl border-2 border-dashed border-white/20 bg-black/25 p-4">
            <div className="mb-2 font-display text-sm tracking-[0.25em] text-white/80">HALL OF RECORDS</div>
            <div className="grid grid-cols-1 gap-1 text-[11px] font-bold">
              {(Object.keys(MODE_COPY) as Mode[]).map((m) => (
                <div key={m} className="flex justify-between">
                  <span className="text-white/50">{MODE_COPY[m].title}</span>
                  <span className="text-[#ffd23e] tabular-nums">{highScores[m] ?? 0}</span>
                </div>
              ))}
            </div>
          </div>

          <BadgesWall />

          {isFS && (
            <div className="rounded-2xl border-2 border-dashed border-white/25 bg-black/25 p-4">
              <div className="mb-2 font-display text-sm tracking-[0.25em] text-white/80">TODAY'S DETENTION BOTS</div>
              {BOT_IDS.map((id) => {
                const b = BOTS[id];
                return (
                  <div key={id} className="mb-2 flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-md font-display text-xs text-black/80"
                      style={{ background: b.color }}
                    >
                      {b.short}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-extrabold text-white/90">{b.name}</div>
                      <div className="truncate text-[10px] font-bold text-white/50">{b.tag}</div>
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <span
                          key={i}
                          className={`text-[9px] ${i <= Math.round(b.skill * 5) ? "text-[#ffd23e]" : "text-white/20"}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Victory() {
  const st = useGame();
  const settings = useSettings();

  const confetti = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        left: 6 + Math.random() * 88,
        delay: Math.random() * 5,
        dur: 3.2 + Math.random() * 2.2,
        color: ["#d4a96e", "#f0e8d0", "#a8d0f0", "#c8e8b0", "#f0b8c0"][i % 5],
        w: 3 + Math.random() * 4,
        h: 3 + Math.random() * 4,
        rot: Math.random() * 360,
      })),
    [],
  );

  const kickWon = st.mode === "kickball" && st.kickYou > st.kickBot;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#102530]/90 font-body backdrop-blur-[4px]">
      {confetti.map((c, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${c.left}%`,
            width: c.w,
            height: c.h,
            background: c.color,
            animationDelay: `${c.delay}s`,
            animationDuration: `${c.dur}s`,
            opacity: 0.35,
          }}
        />
      ))}

      <div
        className="relative mx-4 w-full max-w-md animate-cardin overflow-hidden rounded-xl
                   border-[3px] border-[#f5edc8] bg-[#fdfaf2] px-7 py-8 shadow-[0_24px_70px_rgba(0,0,0,0.6)]"
        style={{ fontFamily: "'Nunito', system-ui, sans-serif" }}
      >
        <div className="absolute left-1/2 top-0 -translate-x-1/2 flex gap-5">
          <div className="h-6 w-10 -rotate-[8deg] rounded-b-sm bg-[#f8e070] opacity-80 shadow-sm" />
          <div className="h-6 w-10 rotate-[6deg]  rounded-b-sm bg-[#f8e070] opacity-80 shadow-sm" />
        </div>

        <div className="mb-1 mt-3 text-center text-[10px] font-extrabold uppercase tracking-[0.3em] text-[#64748b]">
          {st.mode === "foursquare" ? "DETENTION NOTICE" : "RECESS REPORT CARD"}
        </div>

        <h1 className="font-display text-center leading-[0.95] text-[#1a2740]" style={{ padding: "14px 0 6px" }}>
          <span style={{ fontSize: 60, display: "block", fontFamily: "'Luckiest Guy', cursive" }}>
            {st.mode === "tetherball" ? "TETHERBALL" : st.mode === "wallball" ? "WALLBALL" : st.mode === "tag" ? "TAG!" : st.mode === "kickball" ? "KICKBALL" : "FOUR SQUARE"}
            <br />
            <span style={{ fontSize: 48, display: "block", color: "#c23227" }}>
              {st.mode === "tetherball" ? "POLE WINNER" : st.mode === "wallball" ? "WALL MASTER" : st.mode === "tag" ? "LAST ONE FREE" : st.mode === "kickball" ? (kickWon ? "FIELD GENERAL" : "GOOD GAME") : "RECESS KING"}
            </span>
          </span>
        </h1>

        <p className="mt-1 text-center text-sm font-bold leading-relaxed" style={{ color: "#7a8899", fontStyle: "italic" }}>
          {st.mode === "tetherball"
            ? "You just hung the whole thing up. REX is still staring at the pole."
            : st.mode === "wallball"
              ? "You just knifed the last slice past ZIGGY. He's still searching the fence."
              : st.mode === "tag"
                ? "You dodged every grab, every blob, every freeze. Pure blacktop survival."
                : st.mode === "kickball"
                  ? kickWon
                    ? "You drove it deep, you ran it home, and the yard is yours."
                    : "The bots eked it out this time. The plate will be waiting."
                  : "You owned the blacktop. Every bot, every square, every badge. Recess is yours."}
        </p>

        <div className="mx-auto my-5 w-11/12 border-b-2 border-dashed border-[#d8b8a0]" />

        <div className="grid grid-cols-3 gap-4 text-center">
          {(st.mode === "tetherball"
            ? ([["Points", st.score, "#3542ff"], ["Your Fouls", st.fouls, "#f05a40"], ["Bot Fouls", st.opFouls, "#3a9a40"]] as const)
            : st.mode === "wallball"
              ? ([["Your Score", st.wallYou, "#3542ff"], ["Bot Score", st.wallBot, "#f05a40"], ["Rallies", st.rallies, "#3a9a40"]] as const)
              : st.mode === "kickball"
                ? ([["You", st.kickYou, "#3542ff"], ["Bots", st.kickBot, "#f05a40"], ["Innings", 3, "#3a9a40"]] as const)
                : ([["Points", st.score, "#F0A020"], ["Hits", st.hits, "#4050c0"], ["Perfect", st.perfects, "#20a8a0"], ["Kos", st.kos, "#c05050"], ["Streak", st.bestStreak, "#8050a0"], ["Rallies", st.rallies, "#308050"]] as const)
          ).map(([label, value, col]) => (
            <div key={label} className="flex flex-col items-center">
              <span className="font-display text-4xl leading-none" style={{ color: col, fontSize: 48 }}>
                {value}
              </span>
              <span className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#a08870]">
                {label}
              </span>
            </div>
          ))}
        </div>

        <div
          className="mx-auto mt-6 flex w-fit items-center gap-3 rounded-lg border-2 border-dashed border-[#c09880] px-4 py-2"
          style={{ background: "rgba(255,225,180,0.35)" }}
        >
          <svg width="34" height="26" viewBox="0 0 34 26">
            <path d="M17 2 2 12l15 10 15-10-15-10z" fill="#2F4460"/>
            <rect x="25" y="10" width="2.5" height="14" rx="1" fill="#C89628"/>
            <path d="M27.5 24c0 2.8-1.2 5.4-2.5 5.4s-2.5-2.6-2.5-5.4" fill="#C89628"/>
          </svg>
          <div className="flex flex-col">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#4a3a28]">
              {st.mode === "tetherball" ? "Today's tether king" : st.mode === "wallball" ? "Wallball champion" : st.mode === "kickball" ? "Kickball captain" : "Four-square hall monitor"}
            </span>
            <span className="text-[10px] font-bold" style={{ color: "#907060" }}>
              Best: {settings.highScores[st.mode] ?? st.score} pts
            </span>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => st.start(st.mode)}
            className="flex-1 rounded-none border-b-[5px] border-[#a06b20] bg-[#f8d44c] px-6 py-3
                       font-display text-xl text-[#2e1a05] transition-all
                       hover:bg-[#f8e060] active:translate-y-0.5 active:border-b-0"
            style={{ fontFamily: "'Nunito', system-ui, sans-serif" }}
          >
            PLAY AGAIN
          </button>
          <button
            onClick={st.toMenu}
            className="rounded-none border-2 border-dashed border-[#a09888] px-6 py-3 text-sm font-bold
                       text-[#8a7055] transition hover:bg-[#f0e8d8]"
            style={{ fontFamily: "'Nunito', system-ui, sans-serif" }}
          >
            BACK
          </button>
        </div>
      </div>
    </div>
  );
}
