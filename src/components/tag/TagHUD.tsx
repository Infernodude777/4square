import { useEffect, useRef, useState } from "react";
import { useGame, type Popup } from "../../game/store";
import { useSettings } from "../../game/settings";
import { BOTS, BOT_IDS, ROUND_TIME, blobMembers, modeDesc, modeTitle } from "../../game/tag";
import { TS } from "./TagDirector";

const TONE: Record<Popup["tone"], string> = {
  gold: "#ffd23e", cyan: "#38d6d0", red: "#ff6b5e",
  green: "#57d977", purple: "#b58cff", white: "#f2f4f8",
};

function PopupItem({ p }: { p: Popup }) {
  const drop = useGame(s => s.dropPopup);
  useEffect(() => {
    const t = setTimeout(() => drop(p.id), p.big ? 1500 : 950);
    return () => clearTimeout(t);
  }, [p.id, drop]);
  return (
    <div className="animate-popfont pointer-events-none text-center leading-none"
      style={{ color: TONE[p.tone], fontSize: p.big ? 36 : 24, textShadow: "0 3px 0 rgba(0,0,0,0.5)" }}>
      {p.text}
    </div>
  );
}

function Popups() {
  const popups = useGame(s => s.popups);
  return (
    <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-[28%]">
      <div className="flex flex-col-reverse items-center gap-1">
        {popups.slice(-3).map(p => <PopupItem key={p.id} p={p} />)}
      </div>
    </div>
  );
}

// Timer bar
function Timer() {
  const [v, setV] = useState({ time: ROUND_TIME, phase: "countdown" as string, countdown: 3, mode: "regular" as string });
  useEffect(() => {
    const iv = setInterval(() => {
      const t = TS;
      setV({ time: t.roundTimer, phase: t.phase, countdown: Math.ceil(t.countdown), mode: t.mode });
    }, 80);
    return () => clearInterval(iv);
  }, []);

  const pct = (v.time / ROUND_TIME) * 100;
  const col = pct > 50 ? "#39b46a" : pct > 20 ? "#f7b32b" : "#e2483d";

  return (
    <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 select-none w-[340px]">
      <div className="rounded-2xl border border-white/15 bg-[#0d1219]/85 px-5 py-3 backdrop-blur-sm">
        <div className="mb-0.5 flex justify-between text-[9px] font-extrabold tracking-[0.25em] text-white/45">
          <span>{modeTitle(v.mode as never)}</span>
          <span>{Math.ceil(v.time)}s</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full transition-all duration-200"
            style={{ width: `${pct}%`, background: col }} />
        </div>
      </div>
      {v.phase === "countdown" && (
        <div className="mt-3 text-center font-display text-6xl text-[#ffd23e]"
          style={{ textShadow: "0 4px 0 rgba(0,0,0,0.5)" }}>
          {v.countdown}
        </div>
      )}
    </div>
  );
}

// Banner
function Banner() {
  const [b, setB] = useState({ text: "", at: -99 });
  const seen = useRef(-99);
  useEffect(() => {
    const iv = setInterval(() => {
      const t = TS;
      if (t.banner && t.bannerAt !== seen.current) {
        seen.current = t.bannerAt;
        setB({ text: t.banner, at: t.bannerAt });
        setTimeout(() => setB(x => x.at === seen.current ? { text: "", at: -99 } : x), 1800);
      }
    }, 60);
    return () => clearInterval(iv);
  }, []);
  if (!b.text) return null;
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-[14%]">
      <div className="animate-bannerin rounded-2xl border-2 border-[#ffd23e] bg-[#10141c]/88 px-8 py-4 text-center backdrop-blur-sm">
        <div className="font-display text-3xl text-[#ffd23e]">{b.text}</div>
      </div>
    </div>
  );
}

// Status panel — who is IT, who is frozen / in blob
function StatusPanel() {
  const [snap, setSnap] = useState({ itId: "", frozenIds: [] as string[], blobSize: 0, phase: "countdown" as string });
  useEffect(() => {
    const iv = setInterval(() => {
      const t = TS;
      setSnap({
        itId: t.itId,
        frozenIds: Object.values(t.entities).filter(e => e.frozen).map(e => e.id),
        blobSize: t.blobSize,
        phase: t.phase,
      });
    }, 100);
    return () => clearInterval(iv);
  }, []);

  if (snap.phase === "countdown") return null;

  const mode = TS.mode;
  const ids = ["player", ...BOT_IDS];

  return (
    <div className="pointer-events-none absolute left-5 top-5 select-none">
      <div className="rounded-2xl border border-white/15 bg-[#0d1219]/82 p-3 backdrop-blur-sm">
        <div className="mb-2 font-display text-[9px] tracking-[0.25em] text-white/50">PLAYERS</div>
        <div className="flex flex-col gap-1.5">
          {ids.map(id => {
            const e = TS.entities[id];
            if (!e) return null;
            const isPlayer = id === "player";
            const def = isPlayer ? null : BOTS[id];
            const colour = isPlayer ? "#ffd23e" : def!.colour;
            const name   = isPlayer ? "YOU" : def!.name;
            let status = "";
            let statusCol = "#ffffff55";
            if (mode === "regular" || mode === "freeze") {
              if (e.isIt) { status = "IT"; statusCol = "#ff4422"; }
              else if (e.frozen) { status = "FROZEN"; statusCol = "#38d6d0"; }
              else status = "FREE";
            } else {
              const members = blobMembers(TS.entities);
              if (e.blobIdx === 0) { status = "BLOB HEAD"; statusCol = "#ff4422"; }
              else if (e.blobIdx > 0) { status = `BLOB #${e.blobIdx + 1}`; statusCol = "#ff9922"; }
              else status = "FREE";
              void members;
            }
            return (
              <div key={id} className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ background: colour }} />
                <span className="w-14 text-[11px] font-extrabold" style={{ color: isPlayer ? "#ffd23e" : "#e8ebf2" }}>
                  {name}
                </span>
                <span className="text-[10px] font-bold" style={{ color: statusCol }}>
                  {status}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Controls + mode description
function InfoCorner() {
  const [mode, setMode] = useState("regular" as string);
  useEffect(() => {
    const iv = setInterval(() => setMode(TS.mode), 200);
    return () => clearInterval(iv);
  }, []);
  const muted = useSettings(s => s.muted);
  const toggle = useSettings(s => s.toggleMute);
  const toMenu = useGame(s => s.toMenu);
  return (
    <div className="pointer-events-auto absolute right-5 top-5 flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <button onClick={toggle} className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-[#0d1219]/80 text-base backdrop-blur-sm hover:bg-white/10">
          {muted ? "🔇" : "🔊"}
        </button>
        <button onClick={toMenu} className="rounded-xl border border-white/15 bg-[#0d1219]/80 px-3 py-1.5 text-[11px] font-bold text-white/60 backdrop-blur-sm hover:bg-white/10">
          QUIT
        </button>
      </div>
      <div className="max-w-[180px] rounded-xl border border-white/12 bg-[#0d1219]/75 p-3 backdrop-blur-sm text-right">
        <div className="font-display text-xs tracking-widest text-white/80">{modeTitle(mode as never)}</div>
        <div className="mt-1 text-[10px] font-bold leading-snug text-white/50">{modeDesc(mode as never)}</div>
        <div className="mt-2 border-t border-white/10 pt-1.5 text-[9px] font-bold tracking-wider text-white/35">
          WASD MOVE · SHIFT SPRINT
        </div>
      </div>
    </div>
  );
}

export function TagHUD() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 font-body">
      <Timer />
      <StatusPanel />
      <InfoCorner />
      <Banner />
      <Popups />
    </div>
  );
}
