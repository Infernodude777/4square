import { useEffect, useRef, useState } from "react";
import { useGame, visiblePopups, type Popup } from "../../game/store";
import { useSettings } from "../../game/settings";
import { LETTERS, SPOTS } from "../../game/basketball";
import { BS } from "./basketballState";

const TONE: Record<Popup["tone"], string> = {
  gold: "#ffd23e", cyan: "#38d6d0", red: "#ff6b5e",
  green: "#57d977", purple: "#b58cff", white: "#f2f4f8",
};

function lettersLeft(letters: string[]): string {
  return LETTERS.map((l, i) => (i < letters.length ? l : "·")).join(" ");
}

// ── H.O.R.S.E. letter board ─────────────────────────────────
function LetterBoard() {
  const [snap, setSnap] = useState({ you: 0, bot: 0, turn: 0 as 0 | 1, phase: "pick", swishes: 0, shots: 0 });
  useEffect(() => {
    const iv = setInterval(() => {
      const t = BS.current;
      setSnap({
        you: t.letters[0].length,
        bot: t.letters[1].length,
        turn: t.turn,
        phase: t.phase,
        swishes: t.swishes,
        shots: t.shots,
      });
    }, 80);
    return () => clearInterval(iv);
  }, []);
  return (
    <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 select-none rounded-2xl border border-white/15 bg-[#0d1219]/82 px-6 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-5">
        <div className="text-center">
          <div className="text-[9px] font-extrabold tracking-[0.28em] text-[#7dff9a]">YOU</div>
          <div className="mt-1 font-display text-lg tracking-[0.18em] text-[#7dff9a]">{lettersLeft(LETTERS.slice(0, snap.you))}</div>
        </div>
        <div className="text-center">
          <div className="text-[9px] font-bold tracking-[0.2em] text-white/35">H·O·R·S·E</div>
          <div className="text-[10px] font-bold text-white/45">swishes {snap.swishes} · shots {snap.shots}</div>
        </div>
        <div className="text-center">
          <div className="text-[9px] font-extrabold tracking-[0.28em] text-[#ff8a3c]">SLAM</div>
          <div className="mt-1 font-display text-lg tracking-[0.18em] text-[#ff8a3c]">{lettersLeft(LETTERS.slice(0, snap.bot))}</div>
        </div>
      </div>
    </div>
  );
}

// ── Whose shot is it ────────────────────────────────────────
function TurnFlag() {
  const [v, setV] = useState({ turn: 0 as 0 | 1, phase: "pick", forced: false, nearSpot: -1 });
  useEffect(() => {
    const iv = setInterval(() => {
      const t = BS.current;
      const d = Math.hypot(t.playerPos.x - SPOTS[0].x, t.playerPos.z - SPOTS[0].z);
      void d;
      setV({ turn: t.turn, phase: t.phase, forced: t.forcedSpot >= 0, nearSpot: t.turn === 0 ? 0 : -1 });
    }, 70);
    return () => clearInterval(iv);
  }, []);

  const mine = v.turn === 0;
  let label = "";
  let sub = "";
  if (v.phase === "pick") {
    if (mine) {
      if (v.forced) label = "CHALLENGE — MAKE THE SHOT";
      else label = "YOUR PICK — WALK TO A SPOT";
      sub = v.forced ? "anywhere is fine, it's locked in" : "then click to start your shot";
    } else {
      label = "SLAM IS PICKING";
      sub = "watch the letters grow";
    }
  } else if (v.phase === "aim") {
    label = mine ? "CLICK TO RELEASE!" : "SLAM IS SHOOTING";
    sub = mine ? "release near the sweet spot" : "";
  } else if (v.phase === "flight") {
    label = "SHOT'S UP!";
  } else {
    label = "";
  }
  if (!label) return null;

  return (
    <div className="pointer-events-none absolute left-1/2 top-24 -translate-x-1/2 select-none">
      <div
        className="rounded-full border-2 px-5 py-1.5 font-display text-lg backdrop-blur-sm"
        style={{
          borderColor: mine ? "#7dff9a" : "#ff8a3c",
          color: mine ? "#7dff9a" : "#ff8a3c",
          background: "rgba(12,16,24,0.78)",
        }}
      >
        {label}
      </div>
      {sub && <div className="mt-1 text-center text-[10px] font-bold tracking-widest text-white/45">{sub}</div>}
    </div>
  );
}

// ── Banner ──────────────────────────────────────────────────
function Banner() {
  const [b, setB] = useState({ text: "", sub: "", at: -99 });
  const seen = useRef(-99);
  useEffect(() => {
    const iv = setInterval(() => {
      const t = BS.current;
      if (t.banner && t.bannerAt !== seen.current) {
        seen.current = t.bannerAt;
        setB({ text: t.banner, sub: t.bannerSub, at: t.bannerAt });
        setTimeout(() => setB((x) => (x.at === seen.current ? { text: "", sub: "", at: -99 } : x)), 1800);
      }
    }, 60);
    return () => clearInterval(iv);
  }, []);
  if (!b.text) return null;
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-[18%]">
      <div className="animate-bannerin rounded-2xl border-2 border-[#ffd23e] bg-[#10141c]/88 px-8 py-4 text-center backdrop-blur-sm">
        <div className="font-display text-3xl text-[#ffd23e]">{b.text}</div>
        {b.sub && <div className="mt-0.5 text-xs font-bold tracking-widest text-white/55">{b.sub}</div>}
      </div>
    </div>
  );
}

// ── Floating shot pops ──────────────────────────────────────
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

// ── Shot meter (aim phase) ──────────────────────────────────
function ShotMeter() {
  const [s, setS] = useState({ phase: "pick", meter: 0, turn: 0 as 0 | 1, spot: -1 });
  useEffect(() => {
    const iv = setInterval(() => {
      const t = BS.current;
      setS({ phase: t.phase, meter: t.meter, turn: t.turn, spot: t.spotIdx });
    }, 50);
    return () => clearInterval(iv);
  }, []);
  if (s.phase !== "aim" || s.turn !== 0) return null;
  const sweet = 0.72;
  const inZone = Math.abs(s.meter - sweet) < 0.12;
  return (
    <div className="pointer-events-none absolute bottom-8 left-1/2 flex -translate-x-1/2 items-end gap-3 select-none">
      <div className="relative h-28 w-5 overflow-hidden rounded-full border border-white/20 bg-black/50">
        <div className="absolute left-0 w-full" style={{
          bottom: `${sweet * 100 - 11}%`, height: "22%",
          background: inZone ? "#7dff9a55" : "#ffd23e30",
          borderTop: "1.5px solid #7dff9a", borderBottom: "1.5px solid #7dff9a",
        }} />
        <div className="absolute left-0 h-[3px] w-full" style={{
          bottom: `${Math.min(97, Math.max(0, s.meter * 100))}%`,
          background: inZone ? "#7dff9a" : "#ffffffaa",
          boxShadow: inZone ? "0 0 8px #7dff9a" : "none",
        }} />
      </div>
      <div className="mb-1">
        <div className="font-display text-base leading-none" style={{ color: inZone ? "#7dff9a" : "#ffffffaa" }}>
          {inZone ? "◆ RELEASE!" : "RELEASE"}
        </div>
        <div className="text-[10px] font-bold tracking-wider text-white/40">
          {s.spot >= 0 ? SPOTS[s.spot].name : ""} · hit the sweet spot
        </div>
      </div>
    </div>
  );
}

// ── Settings ────────────────────────────────────────────────
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
          <div className="mb-2 font-display text-xs tracking-[0.25em] text-white/65">HOW H.O.R.S.E. WORKS</div>
          <div className="space-y-0.5 text-[10px] font-bold text-white/55">
            <div>◈ Free shooter picks a spot — make it and the other must match</div>
            <div>◈ Match a challenge → no letter, and the pick is yours</div>
            <div>◈ Miss a challenge → you earn a letter</div>
            <div>◈ First to spell H-O-R-S-E loses</div>
            <div className="text-[#7dff9a]">✗ Click to start your shot, click again to release</div>
          </div>
          <button onClick={() => { setOpen(false); toMenu(); }} className="mt-3 w-full rounded-xl bg-white/10 py-2 text-xs font-bold text-white/60 transition hover:bg-white/20">
            BACK TO PLAYGROUND
          </button>
        </div>
      )}
    </div>
  );
}

export function BasketballHUD() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 font-body">
      <LetterBoard />
      <TurnFlag />
      <SettingsBtn />
      <Popups />
      <Banner />
      <ShotMeter />
    </div>
  );
}
