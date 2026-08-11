import { useEffect, useRef, useState } from "react";
import { useGame, visiblePopups, type Popup } from "../../game/store";
import { useSettings } from "../../game/settings";
import { DBOTS } from "../../game/dodgeball";
import { DS } from "./dodgeballState";

const TONE: Record<Popup["tone"], string> = {
  gold: "#ffd23e", cyan: "#38d6d0", red: "#ff6b5e",
  green: "#57d977", purple: "#b58cff", white: "#f2f4f8",
};

// ── Scoreboard ───────────────────────────────────────────────
function Scoreboard() {
  const [s, setS] = useState({ you: 0, bots: 3, phase: "countdown", hasBall: false });
  useEffect(() => {
    const iv = setInterval(() => {
      const t = DS.current;
      setS({
        you: t.player.alive ? 1 : 0,
        bots: t.bots.filter((b) => b.alive).length,
        phase: t.phase,
        hasBall: t.player.hasBall,
      });
    }, 80);
    return () => clearInterval(iv);
  }, []);
  return (
    <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 select-none rounded-2xl border border-white/15 bg-[#0d1219]/82 px-6 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-6">
        <div className="text-center">
          <div className="text-[9px] font-extrabold tracking-[0.28em] text-[#7dff9a]">YOU</div>
          <div className="font-display text-3xl leading-none text-[#7dff9a]">{s.you ? "●" : "✕"}</div>
        </div>
        <div className="text-center">
          <div className="text-[9px] font-bold tracking-[0.2em] text-white/35">BOTS LEFT</div>
          <div className="flex items-center gap-1.5 pt-1">
            {DBOTS.map((d, i) => (
              <span key={d.id} className="h-3 w-3 rounded-full transition-all" style={{
                background: i < s.bots ? d.colour : "#2a3040",
                opacity: i < s.bots ? 1 : 0.4,
              }} />
            ))}
          </div>
        </div>
        <div className="text-center">
          <div className="text-[9px] font-extrabold tracking-[0.28em] text-white/40">BALL</div>
          <div className="font-display text-2xl leading-none text-white/70">{s.hasBall ? "🏐" : "…"}</div>
        </div>
      </div>
    </div>
  );
}

// ── Big banner ───────────────────────────────────────────────
function Banner() {
  const [b, setB] = useState({ text: "", sub: "", at: -99 });
  const seen = useRef(-99);
  useEffect(() => {
    const iv = setInterval(() => {
      const t = DS.current;
      if (t.banner && t.bannerAt !== seen.current) {
        seen.current = t.bannerAt;
        setB({ text: t.banner, sub: t.bannerSub, at: t.bannerAt });
        setTimeout(() => setB((x) => (x.at === seen.current ? { text: "", sub: "", at: -99 } : x)), 1900);
      }
    }, 60);
    return () => clearInterval(iv);
  }, []);
  if (!b.text) return null;
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-[16%]">
      <div className="animate-bannerin rounded-2xl border-2 border-[#ff8a7a] bg-[#10141c]/88 px-8 py-4 text-center backdrop-blur-sm">
        <div className="font-display text-3xl text-[#ff8a7a]">{b.text}</div>
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

// ── Context hints (bottom centre) ────────────────────────────
function Hints() {
  const [s, setS] = useState({ phase: "play", hasBall: false, ballFlight: false, catchable: false });
  useEffect(() => {
    const iv = setInterval(() => {
      const t = DS.current;
      const closing = t.ball.state === "flight" && t.ball.lastHitter !== "player";
      setS({
        phase: t.phase,
        hasBall: t.player.hasBall,
        ballFlight: closing,
        catchable: closing && Math.hypot(t.ball.pos.x - t.player.pos.x, t.ball.pos.z - t.player.pos.z) < 2.4,
      });
    }, 70);
    return () => clearInterval(iv);
  }, []);

  let label = "";
  if (s.phase === "countdown") label = "3… 2… 1…";
  else if (s.phase === "play" && s.hasBall) label = "CLICK TO THROW";
  else if (s.catchable) label = "CLICK TO CATCH!";
  else if (s.phase === "play" && !s.ballFlight) label = "RUN TO THE LOOSE BALL";
  else if (s.phase === "play") label = "DODGE!";
  if (!label) return null;
  return (
    <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 select-none">
      <div className={`rounded-full border-2 px-5 py-1.5 font-display text-lg backdrop-blur-sm ${s.catchable ? "animate-pulse" : ""}`}
        style={{ borderColor: s.catchable ? "#7dff9a" : "#ffd23e", color: s.catchable ? "#7dff9a" : "#ffd23e", background: "rgba(12,16,24,0.78)" }}>
        {label}
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
          <div className="mb-2 font-display text-xs tracking-[0.25em] text-white/65">DODGEBALL 101</div>
          <div className="space-y-0.5 text-[10px] font-bold text-white/55">
            <div>◈ You vs three bots, one ball</div>
            <div>◈ Click to throw at the reticle</div>
            <div>◈ Click while a ball is closing to CATCH it</div>
            <div>◈ Red glow = bot about to throw — dodge!</div>
            <div className="text-[#ff8a7a]">✗ Get hit and you're out · hit all three to win</div>
          </div>
          <button onClick={() => { setOpen(false); toMenu(); }} className="mt-3 w-full rounded-xl bg-white/10 py-2 text-xs font-bold text-white/60 transition hover:bg-white/20">
            BACK TO PLAYGROUND
          </button>
        </div>
      )}
    </div>
  );
}

export function DodgeballHUD() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 font-body">
      <Scoreboard />
      <SettingsBtn />
      <Popups />
      <Banner />
      <Hints />
    </div>
  );
}
