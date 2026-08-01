import { useEffect, useRef, useState } from "react";
import { useGame, type Popup } from "../../game/store";
import { SHOTS, resolveShotKind, WIN_SCORE, type ShotKind } from "../../game/wallball";
import { WS } from "./wallballState";

const TONE: Record<Popup["tone"], string> = {
  gold: "#ffd23e", cyan: "#38d6d0", red: "#ff6b5e",
  green: "#57d977", purple: "#b58cff", white: "#f2f4f8",
};

// Shared shift-key tracker for the timing meter readout.
const shiftHeld = { current: false };

// ── Scoreboard ───────────────────────────────────────────────
function Scoreboard() {
  const [s, setS] = useState({ you: 0, ziggy: 0, rally: 0 });
  useEffect(() => {
    const iv = setInterval(() => {
      const t = WS.current;
      setS({ you: t.playerScore, ziggy: t.opScore, rally: t.rallyLength });
    }, 80);
    return () => clearInterval(iv);
  }, []);
  return (
    <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 select-none rounded-2xl border border-white/15 bg-[#0d1219]/82 px-6 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-6">
        <div className="text-center">
          <div className="text-[9px] font-extrabold tracking-[0.28em] text-[#ffd23e]">YOU</div>
          <div className="font-display text-4xl leading-none text-[#ffd23e]">{s.you}</div>
        </div>
        <div className="text-center">
          <div className="text-[9px] font-bold tracking-[0.2em] text-white/35">FIRST TO {WIN_SCORE}</div>
          <div className="text-[10px] font-bold text-white/45">rally · {s.rally}</div>
        </div>
        <div className="text-center">
          <div className="text-[9px] font-extrabold tracking-[0.28em] text-[#ff6b5e]">ZIGGY</div>
          <div className="font-display text-4xl leading-none text-[#ff6b5e]">{s.ziggy}</div>
        </div>
      </div>
    </div>
  );
}

// ── Whose ball is it? ────────────────────────────────────────
function TurnFlag() {
  const [v, setV] = useState({ turn: "player", held: false, live: false, ready: false });
  useEffect(() => {
    const iv = setInterval(() => {
      const t = WS.current;
      setV({
        turn: t.turn,
        held: t.held,
        live: t.phase === "live" || t.phase === "serve",
        // legal strike window: wall hit + exactly one bounce since
        ready: t.hitWall && t.bouncesAfterWall === 1,
      });
    }, 60);
    return () => clearInterval(iv);
  }, []);

  if (!v.live) return null;
  const mine = v.turn === "player";
  const label = v.held
    ? (mine ? "YOUR SERVE — CLICK" : "ZIGGY IS SERVING")
    : mine
      ? (v.ready ? "YOUR BALL — HIT IT" : "YOUR BALL — LET IT BOUNCE")
      : "ZIGGY'S BALL";

  return (
    <div className="pointer-events-none absolute left-1/2 top-24 -translate-x-1/2 select-none">
      <div
        className="rounded-full border-2 px-5 py-1.5 font-display text-lg backdrop-blur-sm"
        style={{
          borderColor: mine ? (v.ready ? "#7dff9a" : "#ffd23e") : "#ff6b5e",
          color:       mine ? (v.ready ? "#7dff9a" : "#ffd23e") : "#ff6b5e",
          background: "rgba(12,16,24,0.78)",
        }}
      >
        {label}
      </div>
    </div>
  );
}

// ── Foul / result banner ─────────────────────────────────────
function Banner() {
  const [b, setB] = useState({ text: "", sub: "", at: -99 });
  const seen = useRef(-99);
  useEffect(() => {
    const iv = setInterval(() => {
      const t = WS.current;
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

// ── Floating shot pops ───────────────────────────────────────
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
        {popups.slice(-3).map((p) => <PopupItem key={p.id} p={p} />)}
      </div>
    </div>
  );
}

// ── Timing meter ─────────────────────────────────────────────
function TimingMeter() {
  const [s, setS] = useState({
    kind: "drive" as ShotKind, fKind: "baby" as ShotKind,
    ballY: 1, inReach: false, ready: false, mine: false, shift: false, serveLive: false,
  });
  const raf = useRef(0);
  useEffect(() => {
    const onShift = (e: KeyboardEvent, down: boolean) => {
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") shiftHeld.current = down;
    };
    const kd = (e: KeyboardEvent) => onShift(e, true);
    const ku = (e: KeyboardEvent) => onShift(e, false);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    const tick = () => {
      const t = WS.current;
      const d = Math.hypot(t.ballPos.x - t.playerPos.x, t.ballPos.z - t.playerPos.z);
      const airborne = t.playerY > 0.25;
      const sh = shiftHeld.current;
      setS({
        kind:  resolveShotKind(t.playerCrouch, airborne, t.playerVY, false, sh),
        fKind: resolveShotKind(t.playerCrouch, airborne, t.playerVY, true,  sh),
        ballY:     t.ballPos.y,
        inReach:   d < 2.3 && t.phase === "live",
        ready:     t.hitWall && t.bouncesAfterWall === 1,
        mine:      t.turn === "player",
        shift:     sh,
        serveLive: t.phase === "live" || t.phase === "serve",
      });
      raf.current = window.setTimeout(tick, 55);
    };
    tick();
    return () => {
      clearTimeout(raf.current);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
    };
  }, []);

  // Always show the meter during live play so you know what shot is loaded.
  if (!s.serveLive) return null;
  const def  = SHOTS[s.kind];
  const fDef = SHOTS[s.fKind];
  const H = 2.6;
  const pct = (v: number) => Math.max(0, Math.min(97, (v / H) * 100));
  const inZone  = Math.abs(s.ballY - def.idealY)  < def.window * 0.6;
  const inFZone = s.kind !== s.fKind && Math.abs(s.ballY - fDef.idealY) < fDef.window * 0.6;

  return (
    <div className="pointer-events-none absolute bottom-6 left-1/2 flex -translate-x-1/2 items-end gap-3 select-none">
      <div className="relative h-28 w-5 overflow-hidden rounded-full border border-white/20 bg-black/50">
        <div className="absolute left-0 w-full" style={{
          bottom: `${Math.max(0, pct(def.idealY) - pct(def.window * 1.1) / 2)}%`,
          height: `${pct(def.window * 1.1)}%`,
          background: inZone ? `${def.colour}70` : `${def.colour}30`,
          borderTop: `1.5px solid ${def.colour}`, borderBottom: `1.5px solid ${def.colour}`,
        }} />
        {s.kind !== s.fKind && (
          <div className="absolute left-0 w-full" style={{
            bottom: `${Math.max(0, pct(fDef.idealY) - pct(fDef.window * 1.1) / 2)}%`,
            height: `${pct(fDef.window * 1.1)}%`,
            border: `1.5px dashed ${fDef.colour}88`, background: `${fDef.colour}18`,
          }} />
        )}
        <div className="absolute left-0 h-[3px] w-full" style={{
          bottom: `${pct(s.ballY)}%`,
          background: !s.ready ? "#ffffff55" : inZone ? "#7dff9a" : inFZone ? fDef.colour : "#ffffffaa",
          boxShadow: s.ready && (inZone || inFZone) ? "0 0 7px currentColor" : "none",
        }} />
      </div>
      {/* Shot label — always shows which shot is primed */}
      <div className="mb-1">
        <div className="font-display text-base leading-none"
          style={{ color: !s.mine ? "#5a6070" : !s.ready ? "#8b93a0" : inZone ? def.colour : inFZone ? fDef.colour : "#ffffff66" }}>
          {!s.mine ? "ZIGGY'S BALL" : !s.ready ? def.name : inZone ? `◆ ${def.name}` : inFZone ? `◆ ${fDef.name}` : def.name}
        </div>
        <div className="text-[10px] font-bold tracking-wider text-white/40">
          {!s.mine ? "" : s.ready
            ? (inZone || inFZone ? "HIT!" : `need ${(inZone ? def : fDef).idealY.toFixed(1)} m`)
            : "wait for bounce"}
        </div>
      </div>
    </div>
  );
}

// ── Settings ─────────────────────────────────────────────────
function SettingsBtn() {
  const muted  = useGame((s) => s.muted);
  const toggle = useGame((s) => s.toggleMute);
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
        <div className="absolute right-0 top-12 z-30 max-h-[78vh] w-80 animate-cardin overflow-y-auto rounded-2xl border border-white/15 bg-[#0d1219]/96 p-4 backdrop-blur-md">
          <div className="mb-2 font-display text-xs tracking-[0.25em] text-white/65">WALL ARSENAL</div>
          {([
            "drive", "bomb", "scrapie", "slice", "cross",
            "baby", "smash", "roofer", "moonball",
          ] as ShotKind[]).map((k) => {
            const s = SHOTS[k];
            return (
              <div key={k} className="mb-2.5 flex items-start gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: s.colour }} />
                <div>
                  <div className="text-[11px] font-extrabold text-white/90">
                    {s.name} <span className="text-[10px] font-bold text-white/35">· {s.keys}</span>
                  </div>
                  <div className="text-[10px] leading-snug text-white/50">{s.blurb}</div>
                </div>
              </div>
            );
          })}
          <div className="mt-3 border-t border-white/10 pt-2">
            <div className="mb-1 font-display text-[10px] tracking-widest text-white/65">HOW IT WORKS</div>
            <div className="space-y-0.5 text-[10px] font-bold text-white/55">
              <div>◈ You both share ONE court in front of the wall</div>
              <div>◈ Every hit: bounce once, then the wall</div>
              <div>◈ After the wall: let it bounce ONCE, then hit</div>
              <div>◈ Take turns — you, ZIGGY, you, ZIGGY…</div>
              <div>◈ Move aside after you hit so they can play it</div>
              <div className="text-[#ff8a7a]">✗ Volley, double bounce, missing the wall, out, body hit</div>
            </div>
          </div>
          <button onClick={() => { setOpen(false); toMenu(); }} className="mt-3 w-full rounded-xl bg-white/10 py-2 text-xs font-bold text-white/60 transition hover:bg-white/20">
            BACK TO PLAYGROUND
          </button>
        </div>
      )}
    </div>
  );
}

export function WallballHUD() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 font-body">
      <Scoreboard />
      <TurnFlag />
      <SettingsBtn />
      <Popups />
      <Banner />
      <TimingMeter />
    </div>
  );
}
