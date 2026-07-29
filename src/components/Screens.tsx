import { useMemo } from "react";
import { BOTS, TARGET_SCORE, type EntityId } from "../game/constants";
import { useGame } from "../game/store";

const BOT_IDS = Object.keys(BOTS) as Exclude<EntityId, "player">[];

function ChalkSquiggle() {
  return (
    <svg viewBox="0 0 320 14" className="h-3 w-72 text-[#ffd23e]" fill="none">
              d="M4 8 C 30 2, 55 12, 82 7 S 130 3, 158 8 S 210 12, 240 6 S 290 4, 316 9"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
                opacity=="0.85"
      />
      );
      }

      export function Menu() {
  const start = useGame((s) => s.start);
  return (
    <div className="chalkboard absolute inset-0 z-20 flex items-center justify-center overflow-y-auto p-6 font-body">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-stretch gap-6 lg:flex-row">
                {/* left: title + rules */}
        <div className="flex flex-1 flex-col justify-center">
                    <h1
            className="font-display text-7xl leading-[0.95] text-[#ffd23e] md:text-8xl"
                        style={{ textShadow: "0 4px 0 #c23227, 0 9px 0 rgba(0,0,0,0.35)" }}
          >
            FOUR
            <br />
            SQUARE
                              <div className="mt-3">
            <ChalkSquiggle />
                    <p className="mt-3 max-w-md text-sm font-bold leading-relaxed text-white/75">
            Four chrome-plated classmate-bots hold the blacktop. Time your swings off the bounce, skimmer low,
                        smash from the sky, and climb from Square 1 to the crown. Miss, and you're eating chalk in the line.
          </p>
          <div className="mt-5 grid max-w-md grid-cols-2 gap-x-6 gap-y-1.5 text-[13px] font-bold text-white/70">
            <div>
              <span className="text-[#ffd23e]">◈</span> Ball must bounce once in a square
                        <div>
              <span className="text-[#ffd23e]">◈</span> Fault = sent to the back of the line
            </div>            <div>
              <span className="text-[#ffd23e]">◈</span> Everyone rotates up — classic rules
                        <div>
              <span className="text-[#ffd23e]">◈</span> First to {TARGET_SCORE} rules the yard
                      </div>
                      onClick={start}
            className="group mt-7 w-fit rounded-2xl border-b-[6px] border-[#8f6a00] bg-[#ffd23e] px-10 py-4 font-display text-3xl tracking-wide text-[#3a2a00] transition-all hover:-translate-y-0.5 hover:bg-[#ffe066] active:translate-y-0.5 active:border-b-2"
          >
            CLAIM SQUARE 1 ▸
          </button>
          <div className="mt-2 text-[11px] font-bold tracking-widest text-white/40">
            YOU + 4 BOTS · SOUND ON RECOMMENDED 🔔
          </div>        </div>
        {/* right: roster + controls */}
        <div className="flex w-full max-w-sm flex-col gap-3 lg:w-96">
          <div className="rounded-2xl border-2 border-dashed border-white/25 bg-black/25 p-4">
                        {BOT_IDS.map((id) => {
                                          const b = BOTS[id];
              return (
                <div key={id} className="mb-2 flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2">
                                      className="flex h-9 w-9 items-center justify-center rounded-md font-display text-xs text-black/80"
                    style={{ background: b.color }}
                  >
                                      {b.short}
                                    <div className="min-w-0 flex-1">
                                                          <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span key={i} className={`text-[9px] ${i <= Math.round(b.skill * 5) ? "text-[#ffd23e]" : "text-white/20"}`}>
                        ★
                                          ))}
                  </div>
              );
            })}
          </div>
                    <div className="rounded-2xl border-2 border-dashed border-white/25 bg-black/25 p-4 text-[12px] font-bold text-white/70">
                        <div className="grid grid-cols-[70px_1fr] gap-y-1">
                                          <span className="text-[#b58cff]">SHIFT + CLICK</span> <span>LOB — safe moon-shot</span>
                                                      </div>
                        );
      }

      export function Victory() {
  const st = useGame();
  const confetti = useMemo(
    () =>
      Array.from({ length: 44 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 3,
                dur: 2.4 + Math.random() * 2.4,
        color: ["#ffd23e", "#ff5a3c", "#38d6d0", "#57d977", "#b58cff", "#f4f1e8"][i % 6],
        w: 6 + Math.random() * 7,
        h: 10 + Math.random() * 8,
      })),
    []
    );
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#10141c]/80 font-body backdrop-blur-[3px]">
      {confetti.map((c, i) => (
                          key={i}
          className="confetti-piece"
          style={{
            left: `${c.left}%`,
            width: c.w,
            height: c.h,
                        background: c.color,
            animationDelay: `${c.delay}s`,
            animationDuration: `${c.dur}s`,
          }}
        />
        ))}
      <div className="animate-cardin mx-4 w-full max-w-lg rounded-3xl border-4 border-[#ffd23e] bg-[#171d29] p-8 text-center shadow-[0_0_80px_rgba(255,210,62,0.25)]">
                <h2
          className="font-display text-5xl leading-none text-[#ffd23e]"
          style={{ textShadow: "0 3px 0 #c23227" }}
        >
                      RECESS CHAMPION
                <p className="mt-2 text-sm font-bold text-white/60">
          The blacktop is yours. Even ADA-9000 computed a 0.00% chance of this.
                <div className="mt-6 grid grid-cols-3 gap-2 text-center">
          {[
            ["POINTS", st.score, "#ffd23e"],
            ["HITS", st.hits, "#7db4ff"],
            ["PERFECTS", st.perfects, "#38d6d0"],
            ["KNOCKOUTS", st.kos, "#ff5a3c"],
                        ["BEST STREAK", st.bestStreak, "#b58cff"],
            ["RALLIES", st.rallies, "#57d977"],
          ].map(([label, val, color]) => (
            <div key={label as string} className="rounded-xl bg-white/5 py-3">
              <div className="font-display text-3xl" style={{ color: color as string }}>
                                {val as number}
                                                  ))}
        </div>        <div className="mt-7 flex justify-center gap-3">
                      onClick={st.start}
            className="rounded-xl border-b-4 border-[#8f6a00] bg-[#ffd23e] px-8 py-3 font-display text-xl text-[#3a2a00] transition hover:bg-[#ffe066] active:translate-y-0.5 active:border-b-0"
          >
            RUN IT BACK
          </button>
          <GamepadButton            onClick={st.toMenu}
            className="rounded-xl border border-white/20 px-6 py-3 font-display text-xl text-white/80 transition hover:bg-white/10"
          >
            MENU
                  </div>
            );
      }
      
              </div>
          ))
          ]}
          }}
      ))}
  )
  )
      }
                        </div>
                      </span>
                    ))}
              )
                        })}
                        </div>
            </div>
                        </div>
            </div>
                              </div>
          </h1>
  )
      }
  )
}