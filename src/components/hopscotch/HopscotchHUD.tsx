import { useEffect, useRef, useState } from "react";
import { useGame, visiblePopups, type Popup } from "../../game/store";
import { useSettings } from "../../game/settings";
import { CELLS, FAULT_PENALTY } from "../../game/hopscotch";
import { HS } from "./hopscotchState";

const TONE: Record<Popup["tone"], string> = {
  gold: "#ffd23e", cyan: "#38d6d0", red: "#ff6b5e",
  green: "#57d977", purple: "#b58cff", white: "#f2f4f8",
};

// ── Timer + target card ──────────────────────────────────────
function TimerCard() {
  const [s, setS] = useState({ phase: "countdown", count: 3, target: 0, faults: 0, time: 0, finish: null as number | null });
  useEffect(() => {
    const iv = setInterval(() => {
      const t = HS.current;
      setS({
        phase: t.phase,
        count: Math.ceil(t.countdown),
        target: t.target,
        faults: t.faults,
        time: t.time,
        finish: t.finishTime,
      });
    }, 80);
    return () => clearInterval(iv);
  }, []);

  const timeLeft = s.finish !== null ? s.finish : s.time;
  const cellsDone = Math.min(s.target, CELLS);

  return (
    <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 select-none rounded-2xl border border-white/15 bg-[#0d1219]/82 px-6 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-6">
        <div className="text-center">
          <div className="text-[9px] font-extrabold tracking-[0.28em] text-[#ffd23e]">TIME</div>
          <div className="font-display text-4xl leading-none text-[#ffd23e] tabular-nums">
            {s.phase === "countdown" ? s.count : timeLeft.toFixed(1)}
          </div>
          {s.faults > 0 && (
            <div className="text-[9px] font-bold text-[#ff6b5e]">+{s.faults} × {FAULT_PENALTY}s</div>
          )}
        </div>
        <div className="text-center">
          <div className="text-[9px] font-bold tracking-[0.2em] text-white/35">CELLS</div>
          <div className="flex flex-wrap justify-center gap-1 pt-1">
            {Array.from({ length: CELLS }, (_, i) => (
              <span key={i} className={`flex h-3.5 w-3.5 items-center justify-center rounded-sm text-[8px] font-extrabold ${i < cellsDone ? "bg-[#ffd23e] text-[#3a2a00]" : i === cellsDone ? "bg-white/25 text-white/80 animate-pulse" : "bg-white/10 text-white/30"}`}>
                {i + 1}
              </span>
            ))}
          </div>
        </div>
        <div className="text-center">
          <div className="text-[9px] font-extrabold tracking-[0.28em] text-white/40">BOTS</div>
          <div className="mt-1 space-y-0.5 text-[10px] font-bold text-white/50 tabular-nums">
            {HS.current.times.map((bt, i) => (
              <div key={i}>{bt.toFixed(1)}s</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Banner ───────────────────────────────────────────────────
function Banner() {
  const [b, setB] = useState({ text: "", sub: "", at: -99 });
  const seen = useRef(-99);
  useEffect(() => {
    const iv = setInterval(() => {
      const t = HS.current;
      if (t.banner && t.bannerAt !== seen.current) {
        seen.current = t.bannerAt;
        setB({ text: t.banner, sub: t.bannerSub, at: t.bannerAt });
        setTimeout(() => setB((x) => (x.at === seen.current ? { text: "", sub: "", at: -99 } : x)), 2000);
      }
    }, 60);
    return () => clearInterval(iv);
  }, []);
  if (!b.text) return null;
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-[16%]">
      <div className="animate-bannerin rounded-2xl border-2 border-[#ffd23e] bg-[#10141c]/88 px-8 py-4 text-center backdrop-blur-sm">
        <div className="font-display text-3xl text-[#ffd23e]">{b.text}</div>
        {b.sub && <div className="mt-0.5 text-xs font-bold tracking-widest text-white/55">{b.sub}</div>}
      </div>
    </div>
  );
}

// ── Popups ───────────────────────────────────────────────────
function PopupItem({ p }: { p: Popup }) {
  const drop = useGame((s) => s.dropPopup);
  useEffect(() => {
    const t = setTimeout(() => drop(p.id), p.big ? 1400 : 950);
    return () => clearTimeout(t);
  }, [p.id, drop]);
  return (
    <div className="animate-popfont pointer-events-none text-center leading-none"
      style={{ color: TONE[p.tone] ?? p.tone, fontSize: p.big ? 34 : 23, textShadow: "0 3px 0 rgba(0,0,0,0.5)" }}>
      {p.text}
    </div>
  );
}
function Popups() {
  const popups = useGame((s) => s.popups);
  return (
    <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-[34%]">
      <div className="flex flex-col-reverse items-center gap-1">
        {visiblePopups(popups).map((p) => <PopupItem key={p.id} p={p} />)}
      </div>
    </div>
  );
}

// ── Settings ─────────────────────────────────────────────────
function SettingsBtn() {
  const muted = useSettings((s) => s.muted);
  const toggle = useSettings((s) => s.toggleMute);
  const toMenu = useGame((s) => s.toMenu);
  const [open, setOpen] = useState(false);
  return (
    <div className="pointer-events-auto absolute right-5 top-5 flex items-center gap-2">
      <button onClick={toggle} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-[#0d1219]/80 text-lg backdrop-blur-sm transition hover:bg-white/10">
        {muted ? "🔇" : "🔊"}
      </button>
      <button onClick={() => setOpen((v) => !v)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-[#0d1219]/80 text-lg backdrop-blur-sm transition hover:bg-white/10">
        ⚙️
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-30 w-72 animate-cardin rounded-2xl border border-white/15 bg-[#0d1219]/96 p-4 backdrop-blur-md">
          <div className="mb-2 font-display text-xs tracking-[0.25em] text-white/65">HOW IT WORKS</div>
          <div className="space-y-0.5 text-[10px] font-bold text-white/55">
            <div>◈ Click the next cell in order — 1 to HOME</div>
            <div>◈ Wrong cell = fault (+{FAULT_PENALTY}s)</div>
            <div>◈ Beat the fastest bot time to win</div>
            <div className="text-[#ff8a7a]">✗ Bots get faster on FIERCE</div>
          </div>
          <button onClick={() => { setOpen(false); toMenu(); }} className="mt-3 w-full rounded-xl bg-white/10 py-2 text-xs font-bold text-white/60 transition hover:bg-white/20">
            BACK TO PLAYGROUND
          </button>
        </div>
      )}
    </div>
  );
}

export function HopscotchHUD() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 font-body">
      <TimerCard />
      <SettingsBtn />
      <Popups />
      <Banner />
    </div>
  );
}
