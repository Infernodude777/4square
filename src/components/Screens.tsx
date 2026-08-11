import { useMemo } from "react";
import { useGame } from "../game/store";
import { useSettings, formatRecord, RECORD_META, matchRecordValue } from "../game/settings";
import { rankForRecord } from "../game/rank";

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
  const bestBotTime = st.hopTimes.length ? Math.min(...st.hopTimes) : 99;
  const hopWon = st.hopTime > 0 && st.hopTime <= bestBotTime;

  const modeTitle =
    st.mode === "tetherball" ? "TETHERBALL"
      : st.mode === "wallball" ? "WALLBALL"
        : st.mode === "tag" ? "TAG!"
          : st.mode === "kickball" ? "KICKBALL"
            : st.mode === "basketball" ? "BASKETBALL"
              : st.mode === "dodgeball" ? "DODGEBALL"
                : st.mode === "gaga" ? "GAGA BALL"
                  : st.mode === "hopscotch" ? "HOPSCOTCH"
                    : st.mode === "redlight" ? "RED LIGHT, GREEN LIGHT"
                      : "FOUR SQUARE";

  const modeTrophy =
    st.mode === "tetherball" ? "POLE WINNER"
      : st.mode === "wallball" ? "WALL MASTER"
        : st.mode === "tag" ? "LAST ONE FREE"
          : st.mode === "kickball" ? (kickWon ? "FIELD GENERAL" : "GOOD GAME")
            : st.mode === "basketball" ? (st.hoopBot >= 5 ? "SHOOTING STAR" : "BENCHED")
              : st.mode === "dodgeball" ? (st.dodgeWon ? "COURT CLEARER" : "BENCHED")
                : st.mode === "gaga" ? (st.gagaWon ? "PIT BOSS" : "BENCHED")
                  : st.mode === "hopscotch" ? (hopWon ? "CHALK LEGEND" : "CHALK HOPPER")
                    : st.mode === "redlight" ? (st.rlWon ? "LIGHT RUNNER" : "BENCHED")
                      : "RECESS KING";

  const statsRows =
    st.mode === "tetherball"
      ? ([[ "Points", st.score, "#3542ff" ], [ "Your Fouls", st.fouls, "#f05a40" ], [ "Bot Fouls", st.opFouls, "#3a9a40" ]] as const)
      : st.mode === "wallball"
        ? ([[ "Your Score", st.wallYou, "#3542ff" ], [ "Bot Score", st.wallBot, "#f05a40" ], [ "Rallies", st.rallies, "#3a9a40" ]] as const)
        : st.mode === "kickball"
          ? ([[ "You", st.kickYou, "#3542ff" ], [ "Bots", st.kickBot, "#f05a40" ], [ "Innings", 3, "#3a9a40" ]] as const)
          : st.mode === "basketball"
            ? ([[ "Your Letters", st.hoopYou, "#F0A020" ], [ "SLAM Letters", st.hoopBot, "#4050c0" ], [ "Swishes", st.hoopSwishes, "#20a8a0" ], [ "Shots", st.hoopShots, "#8050a0" ]] as const)
            : st.mode === "dodgeball"
              ? ([[ "Bots Out", st.dodgeBotsOut, "#F0A020" ], [ "Catches", settings.stats.totalCatch, "#4050c0" ], [ "Result", st.dodgeWon ? "WIN" : "LOSS", "#20a8a0" ]] as const)
              : st.mode === "gaga"
                ? ([[ "Bots Left", st.gagaBotsLeft, "#F0A020" ], [ "Time", `${st.gagaTime}s`, "#4050c0" ], [ "Result", st.gagaWon ? "WIN" : "LOSS", "#20a8a0" ]] as const)
                : st.mode === "hopscotch"
                  ? ([[ "Your Time", `${st.hopTime.toFixed(1)}s`, "#F0A020" ], [ "Faults", st.hopFaults, "#4050c0" ], [ "Best Bot", `${bestBotTime.toFixed(1)}s`, "#20a8a0" ]] as const)
                  : st.mode === "redlight"
                    ? ([[ "Rounds Won", st.rlRounds, "#57d977" ], [ "Hearts Left", st.rlWon ? 3 : 0, "#4050c0" ], [ "Result", st.rlWon ? "WIN" : "LOSS", "#20a8a0" ]] as const)
                    : ([[ "Points", st.score, "#F0A020" ], [ "Hits", st.hits, "#4050c0" ], [ "Perfect", st.perfects, "#20a8a0" ], [ "Kos", st.kos, "#c05050" ], [ "Streak", st.bestStreak, "#8050a0" ], [ "Rallies", st.rallies, "#308050" ]] as const);

  // Season 2 blacktop rank for this court — from the standing record.
  const rank = rankForRecord(
    RECORD_META[st.mode]?.kind ?? "high",
    settings.highScores[st.mode] ?? matchRecordValue(st.mode, st),
  );

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
            // Three loops, then it rests — no infinite confetti behind the
            // report card (the .confetti-piece default is infinite).
            animationIterationCount: 3,
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
          <div className="h-6 w-10 rotate-[6deg] rounded-b-sm bg-[#f8e070] opacity-80 shadow-sm" />
        </div>

        <div className="mb-1 mt-3 text-center text-[10px] font-extrabold uppercase tracking-[0.3em] text-[#64748b]">
          {st.mode === "foursquare" ? "DETENTION NOTICE" : "RECESS REPORT CARD"}
        </div>

        <h1 className="font-display text-center leading-[0.95] text-[#1a2740]" style={{ padding: "14px 0 6px" }}>
          <span style={{ fontSize: 60, display: "block", fontFamily: "'Luckiest Guy', cursive" }}>
            {modeTitle}
            <br />
            <span style={{ fontSize: 48, display: "block", color: "#c23227" }}>
              {modeTrophy}
            </span>
          </span>
        </h1>

        <div className="mx-auto mt-5 w-11/12 border-b-2 border-dashed border-[#d8b8a0]" />

        <div className="grid grid-cols-3 gap-4 text-center">
          {statsRows.map(([label, value, col]) => (
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

        {/* Season 2 — the chalk rank this result earns */}
        <div
          className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-lg border-2 border-dashed border-[#c09880] px-4 py-1.5"
          style={{ background: "rgba(255,225,180,0.2)" }}
        >
          <span className="text-xl leading-none">{rank.emoji}</span>
          <span className="text-[9px] font-extrabold uppercase tracking-[0.25em] text-[#8a7055]">Rank</span>
          <span className="font-display text-lg leading-none" style={{ color: rank.tint }}>
            {rank.title}
          </span>
        </div>

        <div
          className="mx-auto mt-4 flex w-fit items-center gap-3 rounded-lg border-2 border-dashed border-[#c09880] px-4 py-2"
          style={{ background: "rgba(255,225,180,0.35)" }}
        >
          <svg width="34" height="26" viewBox="0 0 34 26">
            <path d="M17 2 2 12l15 10 15-10-15-10z" fill="#2F4460" />
            <rect x="25" y="10" width="2.5" height="14" rx="1" fill="#C89628" />
            <path d="M27.5 24c0 2.8-1.2 5.4-2.5 5.4s-2.5-2.6-2.5-5.4" fill="#C89628" />
          </svg>
          <div className="flex flex-col">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#4a3a28]">
              {st.mode === "tetherball" ? "Today's tether king"
                : st.mode === "wallball" ? "Wallball champion"
                  : st.mode === "kickball" ? "Kickball captain"
                    : st.mode === "basketball" ? "H.O.R.S.E. winner"
                      : st.mode === "dodgeball" ? "Dodgeball ace"
                        : st.mode === "gaga" ? "Gaga pit boss"
                          : st.mode === "hopscotch" ? "Chalk hopper"
                            : st.mode === "redlight" ? "Red-light runner"
                              : "Four-square hall monitor"}
            </span>
            <span className="text-[10px] font-bold" style={{ color: "#907060" }}>
              Best:{" "}
              {formatRecord(
                st.mode,
                settings.highScores[st.mode] ??
                  (st.mode === "hopscotch" ? st.hopTime : st.mode === "redlight" ? st.rlRounds : st.score),
              )}
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
