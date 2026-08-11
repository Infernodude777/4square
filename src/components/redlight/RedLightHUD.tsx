import { useEffect, useRef, useState } from "react";
import { useGame, visiblePopups, type Popup } from "../../game/store";
import { useSettings } from "../../game/settings";
import { RL_HEARTS, RL_MAX_ROUNDS, RL_ROUNDS_TO_WIN } from "../../game/redlight";
import { RL } from "./redlightState";

const TONE: Record<Popup["tone"], string> = {
  gold: "#ffd23e", cyan: "#38d6d0", red: "#ff6b5e",
  green: "#57d977", purple: "#b58cff", white: "#f2f4f8",
};

function PopupItem({ p }: { p: Popup }) {
  const drop = useGame((s) => s.dropPopup);
  useEffect(() => {
    const t = setTimeout(() => drop(p.id), p.big ? 1500 : 950);
    return () => clearTimeout(t);
  }, [p.id, drop]);
  return (
    <div
      className="animate-popfont pointer-events-none text-center leading-none"
      style={{ color: TONE[p.tone], fontSize: p.big ? 36 : 24, textShadow: "0 3px 0 rgba(0,0,0,0.5)" }}
    >
      {p.text}
    </div>
  );
}

function Popups() {
  const popups = useGame((s) => s.popups);
  return (
    <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-[30%]">
      <div className="flex flex-col-reverse items-center gap-1">
        {visiblePopups(popups).map((p) => (
          <PopupItem key={p.id} p={p} />
        ))}
      </div>
    </div>
  );
}

/** The giant traffic light + round counter. */
function LightBoard() {
  const [snap, setSnap] = useState({
    light: "green" as string,
    phase: "intro" as string,
    countdown: 3,
    round: 1,
    hearts: RL_HEARTS,
  });
  useEffect(() => {
    const iv = setInterval(() => {
      const t = RL.current;
      setSnap({
        light: t.phase === "running" ? t.light : t.phase === "countdown" ? "green" : "off",
        phase: t.phase,
        countdown: Math.max(0, Math.ceil(t.countdown)),
        round: t.round,
        hearts: t.playerHearts,
      });
    }, 70);
    return () => clearInterval(iv);
  }, []);

  const green = snap.light === "green";
  const red = snap.light === "red";
  const off = snap.light === "off";

  return (
    <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 select-none">
      <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-[#0d1219]/85 px-5 py-3 backdrop-blur-sm">
        {/* the three lamps */}
        <div className="flex h-16 w-9 flex-col items-center justify-around rounded-xl border border-white/15 bg-black/50 py-1.5">
          <span
            className="h-4 w-4 rounded-full transition-all duration-150"
            style={{
              background: red ? "#ff3322" : "#3a1510",
              boxShadow: red ? "0 0 18px 4px rgba(255,51,34,0.8)" : "none",
            }}
          />
          <span
            className="h-4 w-4 rounded-full transition-all duration-150"
            style={{ background: "#3a3510", boxShadow: "none" }}
          />
          <span
            className="h-4 w-4 rounded-full transition-all duration-150"
            style={{
              background: green ? "#3dff6a" : "#0f3a1c",
              boxShadow: green ? "0 0 18px 4px rgba(61,255,106,0.8)" : "none",
            }}
          />
        </div>
        <div className="flex flex-col">
          <div
            className="font-display text-2xl leading-none tracking-wide"
            style={{
              color: green ? "#57d977" : red ? "#ff6b5e" : "#8b93a0",
              textShadow: green ? "0 0 18px rgba(61,255,106,0.5)" : red ? "0 0 18px rgba(255,51,34,0.5)" : "none",
            }}
          >
            {off ? "—" : green ? "GO!" : "STOP!"}
          </div>
          <div className="mt-1 text-[9px] font-extrabold tracking-[0.3em] text-white/40">
            ROUND {Math.min(snap.round, RL_MAX_ROUNDS)}/{RL_MAX_ROUNDS}
          </div>
        </div>
        {/* countdown */}
        {snap.phase === "countdown" && (
          <div
            className="ml-1 font-display text-4xl text-[#ffd23e]"
            style={{ textShadow: "0 3px 0 rgba(0,0,0,0.5)" }}
          >
            {snap.countdown}
          </div>
        )}
      </div>
    </div>
  );
}

/** Hearts + round-win standings. */
function ScorePanel() {
  const [snap, setSnap] = useState({ hearts: RL_HEARTS, wins: { player: 0, rex: 0, ziggy: 0, ada: 0 } as Record<string, number> });
  useEffect(() => {
    const iv = setInterval(() => {
      const t = RL.current;
      const wins: Record<string, number> = {};
      for (const r of t.runners) wins[r.id] = r.roundWins;
      setSnap({ hearts: t.playerHearts, wins });
    }, 120);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="pointer-events-none absolute left-5 top-5 select-none">
      <div className="rounded-2xl border border-white/15 bg-[#0d1219]/82 p-3 backdrop-blur-sm">
        <div className="mb-1.5 text-[9px] font-extrabold tracking-[0.3em] text-white/50">YOUR HEARTS</div>
        <div className="mb-2 text-lg leading-none tracking-wider">
          {Array.from({ length: RL_HEARTS }, (_, i) => (
            <span key={i} className={i < snap.hearts ? "" : "opacity-25 grayscale"}>
              ❤️
            </span>
          ))}
        </div>
        <div className="text-[9px] font-extrabold tracking-[0.3em] text-white/50">
          ROUNDS WON <span className="text-[#ffd23e]">(FIRST TO {RL_ROUNDS_TO_WIN})</span>
        </div>
        <div className="mt-1 flex flex-col gap-1">
          {Object.entries(snap.wins).map(([id, w]) => (
            <div key={id} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: id === "player" ? "#ffd23e" : { rex: "#e2483d", ziggy: "#f7b32b", ada: "#8a5cf6" }[id] }}
              />
              <span className={`w-14 text-[10px] font-extrabold ${id === "player" ? "text-[#ffd23e]" : "text-white/70"}`}>
                {id === "player" ? "YOU" : id.toUpperCase()}
              </span>
              <span className="flex gap-0.5">
                {Array.from({ length: RL_ROUNDS_TO_WIN }, (_, i) => (
                  <span key={i} className={`h-2 w-4 rounded-sm ${i < w ? "bg-[#ffd23e]" : "bg-white/15"}`} />
                ))}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Banner() {
  const [b, setB] = useState({ text: "", at: -99 });
  const seen = useRef(-99);
  useEffect(() => {
    const iv = setInterval(() => {
      const t = RL.current;
      if (t.banner && t.bannerAt !== seen.current) {
        seen.current = t.bannerAt;
        setB({ text: t.banner, at: t.bannerAt });
        setTimeout(() => setB((x) => (x.at === seen.current ? { text: "", at: -99 } : x)), 1500);
      }
    }, 60);
    return () => clearInterval(iv);
  }, []);
  if (!b.text) return null;
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-[16%]">
      <div className="animate-bannerin rounded-2xl border-2 border-[#ffd23e] bg-[#10141c]/88 px-8 py-4 text-center backdrop-blur-sm">
        <div className="font-display text-3xl text-[#ffd23e]">{b.text}</div>
      </div>
    </div>
  );
}

function InfoCorner() {
  const muted = useSettings((s) => s.muted);
  const toggle = useSettings((s) => s.toggleMute);
  const toMenu = useGame((s) => s.toMenu);
  return (
    <div className="pointer-events-auto absolute right-5 top-5 flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <button
          onClick={toggle}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-[#0d1219]/80 text-base backdrop-blur-sm hover:bg-white/10"
        >
          {muted ? "🔇" : "🔊"}
        </button>
        <button
          onClick={toMenu}
          className="rounded-xl border border-white/15 bg-[#0d1219]/80 px-3 py-1.5 text-[11px] font-bold text-white/60 backdrop-blur-sm hover:bg-white/10"
        >
          QUIT
        </button>
      </div>
      <div className="max-w-[200px] rounded-xl border border-white/12 bg-[#0d1219]/75 p-3 text-right backdrop-blur-sm">
        <div className="font-display text-xs tracking-widest text-white/80">RED LIGHT GREEN LIGHT</div>
        <div className="mt-1 text-[10px] font-bold leading-snug text-white/50">
          Hold W to run. When the light is red, freeze — or lose a heart.
        </div>
        <div className="mt-2 border-t border-white/10 pt-1.5 text-[9px] font-bold tracking-wider text-white/35">
          W RUN · LET GO ON RED
        </div>
      </div>
    </div>
  );
}

export function RedLightHUD() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 font-body">
      <LightBoard />
      <ScorePanel />
      <InfoCorner />
      <Banner />
      <Popups />
    </div>
  );
}
