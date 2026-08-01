import { round } from "three/tsl";
import  useMemo, useState } from React;
import  BOTS, TARGET_SCORE, type EntityId } from ../game/constants;
import  useGame, type Mode } from ../game/store;
import  WIN_WRAPSimport { mx_hash_vec3_1 } from "three/src/nodes/materialx/lib/mx_noise.js";
 } from ../game/tetherball;

const BOT_IDS = Object.keysBOTS) as Exclude<EntityId, player>];

function ChalkSquiggle) 
  return 
    <svg viewBox=0 0 320 14 className=h-3 w-72 text-#ffd23e] fill=none>
      <path
        d=M4 8 C 30 2, 55 12, 82 7 S 130 3, 158 8 S 210 12, 240 6 S 290 4, 316 9
        stroke=currentColor
                strokeWidth=4
                opacity=0.85
      />
    </svg>
);
}

/* ── the mode-picker card ─────────────────────────────────── */
function ModeCard
  mode,
  active,
  onPick,
  title,
  subtitle,
    emoji,
  tint,
  desc,
}: 
  mode: Mode;
  active: boolean;
  onPick: m: Mode) => void;
    su
  emoji: string;
  tint: string;
  desc: string;
}) 
  return 
          onClick=) => onPickmode)}
      className=relative flex w-full flex-col items-start gap-1 rounded-2xl border-4 p-4 text-left transition-all $
        active
          ? -translate-y-1 scale-1.02] shadow-0_0_50px_rgba255,210,62,0.35)]
          : hover:-translate-y-0.5 hover:bg-white/5
}}
      style=
        borderColor: active ? tint : rgba255,255,255,0.15),
        background: active ? $tint}18 : rgba0,0,0,0.25),
}}
    >
      <div className=flex items-center gap-3>
        <span className=text-3xl>emoji}</span>
        <div>
          <div className=font-display text-xl leading-none style= color: tint }}>
                      title}
                                  <p className=text-11px] font-bold leading-snug text-white/70>desc}</p>
      active && 
        <div className=absolute -top-2 -right-2 rounded-full bg-#ffd23e] px-2 py-0.5 text-9px] font-extrabold tracking-widest text-#3a2a00]>
          SELECTED
)}
    </button>
);
}

export function Menu) 
  const start = useGames) => s.start);
  const mode, setMode] = useState<Mode>foursquare);

    const isFS = mode === foursquare;
  return 
    <div className=chalkboard absolute inset-0 z-20 flex items-center justify-center overflow-y-auto p-6 font-body>
      <div className=mx-auto flex w-full max-w-6xl flex-col items-stretch gap-6 lg:flex-row>
        /* ── left: title + description ─────────────────── */}
                <div className=flex flex-1 flex-col justify-center>
                    isFS ? 
            <>
              <h1
                              className=font-display text-7xl leading-0.95] text-#ffd23e] md:text-8xl
                style= textShadow: 0 4px 0 #c23227, 0 9px 0 rgba0,0,0,0.35) }}
              >
                FOUR
                <br />
                SQUARE
              </h1>
                          </>
          ) : 
            <>
                          <h1
                className=font-display text-7xl leading-0.95] text-#ffd23e] md:text-8xl
                style= textShadow: 0 4px 0 #c23227, 0 9px 0 rgba0,0,0,0.35) }}
              >
                                TETHER
                <br />
                BALL
              </h1>
                          </>
          )}
          <div className=mt-3>
            <ChalkSquiggle />
                    <p className=mt-3 max-w-md text-sm font-bold leading-relaxed text-white/75>
                                isFS ? 
              <>
                Four chrome-plated classmate-bots hold the blacktop. Time your swings off the bounce, skimmer low,
                smash from the sky, and climb from Square 1 to the crown.
              </>
        ) : 
              <>
                Just you, REX, and a pole. Ten feet tall, rope on top, ball on the end. Wind it WIN_WRAPS} full
                turns your way to win. Crouch to skim it low, jump and strike on the way <em className=not-italic text-#ff8a7a]>down</em> to
                smash, or nail the razor-thin timing on a HIGH LOFT to sail it clean over REXs head.
              </>
      )}
                </p>

          <div className=mt-5 grid max-w-md grid-cols-1 gap-x-6 gap-y-1.5 text-13px] font-bold text-white/70 sm:grid-cols-2>
            isFS ? 
              <>
                <div><span className=text-#ffd23e]>◈</span> Ball bounces once per square</div>
                <div><span className=text-#ffd23e]>◈</span> Fault = back of the line</div>
                <div><span className=text-#ffd23e]>◈</span> Rotate up on every miss</div>
                <div><span className=text-#ffd23e]>◈</span> First to TARGET_SCORE} rules the yard</div>
              </>
    ) : 
              <>
                <div><span className=text-#ffd23e]>◈</span> You wind counter-clockwise</div>
                <div><span className=text-#ffd23e]>◈</span> Bot winds the other way</div>
                <div><span className=text-#ffd23e]>◈</span> Final wrap above the height mark</div>
                <div><span className=text-#ffd23e]>◈</span> WIN_WRAPS} wraps = victory 👑</div>
              </>
  )}
          </div>

          <button
            onClick=) => startmode)}
            className=group mt-7 w-fit rounded-2xl border-b-6px] border-#8f6a00] bg-#ffd23e] px-10 py-4 font-display text-3xl tracking-wide text-#3a2a00] transition-all hover:-translate-y-0.5 hover:bg-#ffe066] active:translate-y-0.5 active:border-b-2
          >
            isFS ? CLAIM SQUARE 1 ▸ : STEP TO THE POLE ▸}
          </button>
          <div className=mt-2 text-11px] font-bold tracking-widest text-white/40>
            SOUND ON RECOMMENDED 🔔 · WASD MOVE · SPACE JUMP · C CROUCH · CLICK HIT
          </div>
        </div>

        /* ── right: mode picker + roster ──────────────────── */}
        <div className=flex w-full max-w-sm flex-col gap-3 lg:w-96>
          <div className=mb-1 font-display text-sm tracking-0.25em] text-white/80>CHOOSE YOUR GAME</div>
          <ModeCard            mode=foursquare
            active=isFS}          onPick=setMode}
            title=FOUR SQUARE
            subtitle=RECESS ROYALE · 4 BOTS
            emoji=🟨🟥🟩🟦
            tint=#ffd23e
                        desc=Classic playground four-square. Rotate up through the ranks, dethrone the King, race to 30.
          />
          <ModeCard
            mode=tetherball
            active=mode === tetherball}
            onPick=setMode}
            title=TETHERBALL
                                    emoji=🎯
            tint=#ff8a3c
            desc=One-on-one against REX. Wind the rope your way, dodge fouls, land the winning wrap above the yellow mark.
          />
          <ModeCard
                      mode=tag
            active=mode === tag}
            onPick=setMode}
            title=TAG
                                    emoji=🏃
            tint=#7dff9a
            desc=Chase the red IT marker across the field. Burn stamina, cut corners, and tag seven runners to own recess.
          />
                    <ModeCard
            mode=kickball
            active=mode === kickball}
            onPick=setMode}
            title=KICKBALL
            subtitle=DIAMOND DASH · SCHOOLYARD CLASSIC
                        emoji=⚾
            tint=#ffb347
            desc=Wait for the roll, kick into space, beat five fielders, and turn every safe run into a playground story.
          />

          isFS && 
            <div className=rounded-2xl border-2 border-dashed border-white/25 bg-black/25 p-4>
              <div className=mb-2 font-display text-sm tracking-0.25em] text-white/80>TODAYS DETENTION BOTS</div>
              BOT_IDS.mapid) => 
                const b = BOTSid];
                return 
                  <div key=id} className=mb-2 flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2>
                    <div
                      className=flex h-9 w-9 items-center justify-center rounded-md font-display text-xs text-black/80
                                            style= background: b.color }}
                    >
                      b.short}
                    </div>
                    <div className=min-w-0 flex-1>
                      <div className=truncate text-13px] font-extrabold text-white/90>b.name}</div>
                      <div className=truncate text-10px] font-bold text-white/50>b.tag}</div>
                    </div>
                    <div className=flex gap-0.5>
                                          1, 2, 3, 4, 5].mapi) => 
                        <span
                          key=i}
                          className=text-9px] $i <= Math.roundb.skill * 5) ? text-#ffd23e] : text-white/20}}
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
                    !isFS && 
            <div className=rounded-2xl border-2 border-dashed border-white/25 bg-black/25 p-4>
              <div className=mb-2 font-display text-sm tracking-0.25em] text-white/80>TONIGHTS CHALLENGER</div>
              <div className=flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2>
                <div className=flex h-11 w-11 items-center justify-center rounded-md font-display text-xs text-white bg-#e2483d]>
                  REX
                                                  <div className=min-w-0 flex-1>
                                            </div>                <div className=flex gap-0.5>
                  1, 2, 3, 4].mapi) => 
                    <span key=i} className=text-9px] text-#ffd23e]>
                      ★
                    </span>
))}
                  <span className=text-9px] text-white/20>★</span>
                                                                                    </div>
              </div>
              <div className=mt-3 border-t border-white/10 pt-3 text-11px] font-bold text-white/60>
                <div className=mb-1 font-display text-10px] tracking-widest text-white/80>HOW YOU HIT</div>
                <div className=grid grid-cols-92px_1fr] gap-y-1>
                                                                        <span className=text-#ff5a3c]>SPACE ↓ CLICK</span> }
                  <span>
                                      SMASH — jump, then strike <em className=text-#ff8a7a] not-italic>falling</em>
                  </span>
                  <span className=text-#b58cff]>RIGHT CLICK</span> }
                  <span>
                    HIGH LOFT — <em className=text-#c9a8ff] not-italic>tight timing</em>, sails overhead
                  </span>
                  <span className=text-#8ae06b]>C + RIGHT</span> <span>DINK — soft touch, kills pace</span>
                </div>
                              </div>
            </div>
)}
        </div>
      </div>
    </div>
);
}

export function Victory) 
  const st = useGame);

  // No generic confetti. Instead: shaky TAPE TOP handwritten note aesthetic.
  // A single white chalk circle drawn on dark background feels like recess
  // art pinned to the schools faded blue corkboard.

    const confetti = useMemo
) =>
      Array.from length: 28 }, _, i) => 
        left: 6 + Math.random) * 88,
        delay: Math.random) * 5,
        dur: 3.2 + Math.random) * 2.2,
        color: #d4a96e, #f0e8d0, #a8d0f0, #c8e8b0, #f0b8c0]i % 5],
        w: 3 + Math.random) * 4,
        h: 3 + Math.random) * 4,
        rot: Math.random) * 360,
})),
],
);

  return 
    <div className=absolute inset-0 z-20 flex items-center justify-center bg-#102530]/90 font-body backdrop-blur-4px]>
      /* subtle chalk dust particles — soft, drawing-like, not confetti */}
      confetti.mapc, i) => 
        <span
          key=i}
                    className=confetti-piece
          style=
            le: $c.left}%,
            width: c.w,
            height: c.h,
            background: c.color,
            animationDelay: $c.delay}s,
            animationDuration: $c.dur}s,
                        opacity: 0.35,
}}
        />
      ))}

      /* Central recess slip + tape pieces */}
      <div
        className=relative mx-4 w-full max-w-md animate-cardin overflow-hidden rounded-xl
                   border-3px] border-#f5edc8] bg-#fdfaf2] px-7 py-8 shadow-0_24px_70px_rgba0,0,0,0.6)]
        style= fontFamily: Nunito, system-ui, sans-serif }}
      >
                /* Top yellow tape strips like a student pinned paper to board) */}
        <div className=absolute left-1/2 top-0 -translate-x-1/2 flex gap-5>
          <div className=h-6 w-10 -rotate-8deg] rounded-b-sm bg-#f8e070] opacity-80 shadow-sm />
          <div className=h-6 w-10 rotate-6deg]  rounded-b-sm bg-#f8e070] opacity-80 shadow-sm />
        </div>

                /* Handwritten heading */}
        <div className=mb-1 mt-3 text-center text-10px] font-extrabold uppercase tracking-0.3em] text-#64748b]>
          st.mode === foursquare ? DETENTION NOTICE : RECESS REPORT CARD}
        </div>

                /* Main display title — no emoji, no glow, just massive display text */}
                  className=font-display text-center leading-0.95] text-#1a2740]
          style=
            textShadow: none,
            padding: 14px 0 6pageXOffset,
    }}
        >
                    <span style= fontSize: 60, display: block, fontFamily: Luckiest Guy, cursive }}>
            st.mode === tetherball ? TETHERBALL : st.mode === wallball ? WALLBALL : st.mode === tag ? TAG : st.mode === kickball ? KICKBALL : FOUR SQUARE}
            <br />
            <span style= fontSize: 48, display: block, color: #c23227 }}>
              st.mode === tetherball ? POLE WINNER : st.mode === wallball ? WALL MASTER : st.mode === tag ? FIELD CHAMP : st.mode === kickball ? DIAMOND DASH : RECESS KING}
            </span>
          </span>
        </h1>

                /* Subtitle — hand-written feel */}
        <p
          className=mt-1 text-center text-sm font-bold leading-relaxed
          style= color: #7a8899, fontStyle: italic }}
        >
          st.mode === tetherball
            ? You just hung the whole thing up. REX is still staring at the pole.
            : st.mode === wallball
                          ? You just knifed the last slice past ZIGGY. Hes still searching the fence.
              : You owned the blacktop. Every bot, every square, every badge. Recess is yours.}
        </p>

                /* Divider — like a hand-drawn rule line */}
        <div className=mx-auto my-5 w-11/12 border-b-2 border-dashed border-#d8b8a0] />

        /* Stats Grid — hand-lettered, reading like tally marks on a notebook page */}
        <div className=grid grid-cols-3 gap-4 text-center>
          st.mode === tetherball
                      ? 
                Points,  st.score,  #3542ff],
                Your Fouls, st.fouls, #f05a40],
                Bot Fouls,  st.opFouls, #3a9a40],
              ] as const)
            : st.mode === wallball
              ? 
                  Your Score, Math.max0, st.score), #3542ff],
                  Bot Score,  Math.max0, -st.score), #f05a40],
                                    Rallies,     st.rallies, #3a9a40],
                ] as const)
              : 
                  Points,  st.score,  #F0A020],
                  Hits,   st.hits,   #4050c0],
                  Perfect,st.perfects,#20a8a0],
                  Kos,    st.kos,    #c05050],
                  Streak, st.bestStreak,#8050a0],
                  Rallies, st.rallies, #308050],
                ] as const)).maplabel, value, col]) => 
            <div key=label} className=flex flex-col items-center>
              <span
                              className=font-display text-4xl leading-none
                style= color: col, fontSize: 48 }}
              >
                value}
              </span>
              <span className=mt-1 text-10px] font-extrabold uppercase tracking-0.2em] text-#a08870]>
                label}
              </span>
            </div>
))}
        </div>

                /* Note icon — hand-sketched badge, not emoji */}
        <div
          className=mx-auto mt-6 flex w-fit items-center gap-3 rounded-lg border-2 border-dashed border-#c09880] px-4 py-2
          style= background: rgba255,225,180,0.35) }}
        >
                    /* Tiny hand-drawn graduation cap SVG */}
          <svg width=34 height=26 viewBox=0 0 34 26>
            <path d=M17 2 2 12l15 10 15-10-15-10z fill=#2F4460/>
            <rect x=25 y=10 width=2.5 height=14 rx=1 fill=#C89628/>
            <path d=M27.5 24c0 2.8-1.2 5.4-2.5 5.4s-2.5-2.6-2.5-5.4 fill=#C89628/>
          </svg>
          <div className=flex flex-col>
                        <span className=text-11px] font-extrabold uppercase tracking-widest text-#4a3a28]>
              st.mode === tetherball ? Todays tether king : st.mode === wallball ? Wallball champion : st.mode === tag ? Tag field champion : st.mode === kickball ? Diamond dash champion : Four-square hall monitor}
            </span>
            <span className=text-10px] font-bold style= color: #907060 }}>
              Graduated recess, top of class
                          </span>
          </div>
        </div>

                /* Action buttons */}
        <div className=mt-6 flex gap-3>
                      onClick=) => st.startst.mode)}
            className=flex-1 rounded-none border-b-5px] border-#a06b20] bg-#f8d44c] px-6 py-3
                       font-display text-xl text-#2e1a05] transition-all
                       hover:bg-#f8e060] active:translate-y-0.5 active:border-b-0
            style= fontFamily: Nunito, system-ui, sans-serif }}
          >
            PLAY AGAIN
                      </button>
                      onClick=st.toMenu}
            className=rounded-none border-2 border-dashed border-#a09888] px-6 py-3 text-sm font-bold
                       text-#8a7055] transition hover:bg-#f0e8d8]
                                   style= fontFamily: Nunito, system-ui, sans-serif }}
          >
            BACK
          </button>
                  </div>
      </div>
    </div>
  );
  }
  
        </div>