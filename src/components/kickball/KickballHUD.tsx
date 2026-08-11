import { useEffect, useState } from "react";
import { useGame, visiblePopups, type Popup } from "../../game/store";
import { useSettings } from "../../game/settings";
import { KS } from "./kickballState";
import { ballInWindow, plateProgress, BASE_DIST } from "../../game/kickball";

const TONE: Record<Popup["tone"], string> = {
  gold: "#ffd23e", cyan: "#38d6d0", red: "#ff6b5e",
  green: "#57d977", purple: "#b58cff", white: "#f2f4f8",
};

function PopupItem({ p }: { p: Popup }) {
  const drop = useGame((s) => s.dropPopup);
  useEffect(() => {
    const t = setTimeout(() => drop(p.id), p.big ? 1500 : 1000);
    return () => clearTimeout(t);
  }, [p.id, drop]);
  return (
    <div
      className="animate-popfont pointer-events-none text-center leading-none"
      style={{
        color: TONE[p.tone],
        fontSize: p.big ? 36 : 24,
        textShadow: "0 3px 0 rgba(0,0,0,0.5), 0 0 24px rgba(0,0,0,0.35)",
      }}
    >
      {p.text}
    </div>
  );
}

function Popups() {
  const popups = useGame((s) => s.popups);
  return (
    <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-[28%]">
      <div className="flex flex-col-reverse items-center gap-1">
        {visiblePopups(popups).map((p) => <PopupItem key={p.id} p={p} />)}
      </div>
    </div>
  );
}

// ── Scoreboard: innings / runs / outs ──────────────────────────
function Scoreboard() {
  const [snap, setSnap] = useState({ inning: 0, outs: 0, strikes: 0, runsYou: 0, runsBot: 0 });
  useEffect(() => {
    const iv = setInterval(() => {
      const k = KS.current;
      setSnap({ inning: k.inning, outs: k.outs, strikes: k.strikes, runsYou: k.runsYou, runsBot: k.runsBot });
    }, 90);
    return () => clearInterval(iv);
  }, []);
  return (
    <div className="pointer-events-none absolute left-5 top-5 select-none rounded-2xl border border-white/15 bg-[#0d1219]/80 px-5 py-3 backdrop-blur-sm">
      <div className="mb-1 flex items-center justify-between gap-6 text-[9px] font-extrabold tracking-[0.3em] text-white/40">
        <span>YOU</span>
        <span>INNING {snap.inning + 1}/3</span>
        <span>BOTS</span>
      </div>
      <div className="flex items-center justify-center gap-6">
        <span className="font-display text-4xl leading-none text-[#7fc4ff]">{snap.runsYou}</span>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span key={i} className={`text-lg ${i < snap.outs ? "text-[#ff6b5e]" : "text-white/15"}`}>✕</span>
          ))}
        </div>
        <span className="font-display text-4xl leading-none text-[#ff8a70]">{snap.runsBot}</span>
      </div>
      <div className="mt-1 text-center text-[10px] font-bold text-white/40">
        {snap.strikes > 0 && `${snap.strikes} STRIKE${snap.strikes > 1 ? "S" : ""}`}
      </div>
    </div>
  );
}

// ── Kick timing meter ──────────────────────────────────────────
function KickMeter() {
  const [snap, setSnap] = useState({ progress: 0, inWindow: false });
  useEffect(() => {
    const iv = setInterval(() => {
      const k = KS.current;
      setSnap({ progress: plateProgress(k), inWindow: ballInWindow(k) });
    }, 50);
    return () => clearInterval(iv);
  }, []);

  const col = snap.inWindow ? "#7dff9a" : "#ffffff88";

  return (
    <div className="pointer-events-none absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 select-none">
      <div className="relative h-3 w-64 overflow-hidden rounded-full border border-white/20 bg-black/50">
        <div className="absolute inset-y-0 left-1/2 w-[1px] bg-white/30" />
        <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#38d6d0] to-[#7dff9a] transition-[width] duration-75" style={{ width: `${snap.progress * 50}%` }} />
        <div className="absolute inset-y-0 right-0 rounded-full bg-gradient-to-l from-[#ff8a70] to-[#ffd23e] transition-[width] duration-75" style={{ width: `${snap.progress * 50}%` }} />
      </div>
      <div
        className="font-display text-lg tracking-wider"
        style={{ color: col, textShadow: "0 3px 0 rgba(0,0,0,0.45)" }}
      >
        {snap.inWindow ? "KICK!" : "wait for the pitch…"}
      </div>
      <div className="text-[10px] font-bold text-white/35">CLICK to kick · RIGHT-CLICK to bunt</div>
    </div>
  );
}

// ── Centre banner (RUN / OUT / HOME RUN) ───────────────────────
function Banner() {
  const [b, setB] = useState({ text: "", sub: "", at: -99 });
  useEffect(() => {
    const iv = setInterval(() => {
      const k = KS.current;
      if (k.banner && k.bannerAt !== b.at) {
        setB({ text: k.banner, sub: k.bannerSub, at: k.bannerAt });
      }
    }, 80);
    return () => clearInterval(iv);
  }, [b.at]);
  if (!b.text) return null;
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-[16%]">
      <div className="animate-bannerin rounded-2xl border-2 border-[#ffd23e] bg-[#10141c]/85 px-8 py-4 text-center backdrop-blur-sm">
        <div className="font-display text-4xl text-[#ffd23e]">{b.text}</div>
        {b.sub && <div className="mt-1 text-xs font-bold text-white/60">{b.sub}</div>}
      </div>
    </div>
  );
}

// ── Settings gear + mute + pause ─────────────────────────────
function SettingsBtn() {
  const muted = useSettings((s) => s.muted);
  const toggle = useSettings((s) => s.toggleMute);
  const toMenu = useGame((s) => s.toMenu);
  const setPaused = useGame((s) => s.setPaused);
  const [open, setOpen] = useState(false);
  return (
    <div className="pointer-events-auto absolute right-5 top-5 flex items-center gap-2">
      <button
        onClick={toggle}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-[#0d1219]/80 text-lg backdrop-blur-sm transition hover:bg-white/10"
        title={muted ? "Unmute" : "Mute"}
      >
        {muted ? "🔇" : "🔊"}
      </button>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-[#0d1219]/80 text-lg backdrop-blur-sm transition hover:bg-white/10"
        title="Kickball rules"
      >
        ⚙️
      </button>
      <button
        onClick={() => setPaused(true)}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-[#0d1219]/80 text-base backdrop-blur-sm transition hover:bg-white/10"
        title="Pause (ESC)"
      >
        ⏸
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-30 w-72 animate-cardin rounded-2xl border border-white/15 bg-[#0d1219]/96 p-4 backdrop-blur-md">
          <div className="mb-2 font-display text-xs tracking-[0.25em] text-white/65">KICKBALL RULES</div>
          <div className="space-y-0.5 text-[10px] font-bold text-white/55">
            <div>✗ CLICK when the pitch crosses the plate → kick for power</div>
            <div>✗ RIGHT-CLICK → soft bunt, easier to time</div>
            <div>✗ Run the bases off your hit — 3 innings, most runs wins</div>
            <div className="text-[#7dff9a]">▲ Kick in the green zone on the meter</div>
          </div>
          <button
            onClick={() => { setOpen(false); toMenu(); }}
            className="mt-3 w-full rounded-xl bg-white/10 py-2 text-xs font-bold text-white/60 transition hover:bg-white/20"
          >
            BACK TO PLAYGROUND
          </button>
        </div>
      )}
    </div>
  );
}

export function KickballHUD() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 font-body">
      <Scoreboard />
      <KickMeter />
      <Banner />
      <SettingsBtn />
      <Popups />
      <div className="pointer-events-none absolute bottom-2 right-3 text-[9px] font-bold tracking-widest text-white/25">
        {Math.round(BASE_DIST)} m bases · 3 innings · most runs wins
      </div>
    </div>
  );
}
