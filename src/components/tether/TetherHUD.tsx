import { useEffect, useRef, useState } from "react";
import { useGame, visiblePopups, type Popup } from "../../game/store";
import { useSettings } from "../../game/settings";
import { TS } from "./tetherState";
import { SHOTS, resolveShotKind, type ShotKind } from "../../game/tetherball";

const TONE: Record<Popup["tone"], string> = {
  gold: "#ffd23e", cyan: "#38d6d0", red: "#ff6b5e",
  green: "#57d977", purple: "#b58cff", white: "#f2f4f8",
};

// ── Score ────────────────────────────────────────────────────
function Score() {
  const score = useGame((s) => s.score);
  return (
    <div className="pointer-events-none absolute left-5 top-5 select-none rounded-2xl border border-white/15 bg-[#0d1219]/80 px-5 py-3 backdrop-blur-sm">
      <div className="text-[9px] font-extrabold tracking-[0.3em] text-white/40">SCORE</div>
      <div className="font-display text-4xl leading-none text-[#ffe066]">{score}</div>
    </div>
  );
}

// ── Popups ───────────────────────────────────────────────────
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
        fontSize: p.big ? 38 : 25,
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
    <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-[30%]">
      <div className="flex flex-col-reverse items-center gap-1">
        {visiblePopups(popups).map((p) => <PopupItem key={p.id} p={p} />)}
      </div>
    </div>
  );
}

// ── Wrap meter ────────────────────────────────────────────────
function WrapMeter() {
  const [wraps, setWraps] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setWraps(TS.current.wraps), 60);
    return () => clearInterval(iv);
  }, []);
  const pct        = Math.max(-1, Math.min(1, wraps / 5.0));
  const playerPct  = Math.max(0, pct);
  const botPct     = Math.max(0, -pct);
  return (
    <div className="pointer-events-none absolute left-1/2 top-4 w-[420px] max-w-[92vw] -translate-x-1/2 select-none rounded-2xl border border-white/15 bg-[#0d1219]/80 px-4 py-3 backdrop-blur-sm">
      <div className="mb-1 flex items-center justify-between text-[9px] font-extrabold tracking-[0.22em]">
        <span className="text-[#ff6b5e]">◀ REX</span>
        <span className="text-white/40">WIND 5 TURNS</span>
        <span className="text-[#ffd23e]">YOU ▶</span>
      </div>
      <div className="relative h-3 rounded-full bg-white/10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-white/40" />
        <div className="absolute top-0 h-full right-1/2 bg-gradient-to-l from-[#ff8a70] to-[#ff5a3c] transition-all"
          style={{ width: `${botPct * 50}%` }} />
        <div className="absolute top-0 h-full left-1/2 bg-gradient-to-r from-[#ffd23e] to-[#ff9a2f] transition-all"
          style={{ width: `${playerPct * 50}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-[10px] font-bold tabular-nums text-white/40">
        <span>{Math.max(0, -wraps).toFixed(1)}</span>
        <span>{wraps === 0 ? "even" : ""}</span>
        <span>{Math.max(0, wraps).toFixed(1)}</span>
      </div>
    </div>
  );
}

// ── Timing meter (the core hitting aid) ───────────────────────
interface MeterSnap {
  kind: ShotKind;
  fKind: ShotKind;
  ballY: number;
  ballSpeed: number;
  inRange: boolean;    // ball within generous hit zone
  inHand:  boolean;    // ball within hand sweet spot
  armed:   boolean;    // player legally allowed to hit
  airborne: boolean;
  descending: boolean;
  serveLive: boolean;
}
const initSnap: MeterSnap = {
  kind: "drive", fKind: "loft", ballY: 1.0,
  ballSpeed: 0, inRange: false, inHand: false,
  armed: true, airborne: false, descending: false,
  serveLive: false,
};

function TimingMeter() {
  const [snap, setSnap] = useState<MeterSnap>(initSnap);
  const raf = useRef(0);

  useEffect(() => {
    const tick = () => {
      const t = TS.current;
      const dx  = t.ballPos.x - t.playerPos.x;
      const dz  = t.ballPos.z - t.playerPos.z;
      const d2d = Math.hypot(dx, dz);
      const inRange  = d2d < 1.55 && t.serveStage === "live";
      const inHand   = d2d < 1.15;
      const airborne = t.playerY > 0.25;
      const kind     = resolveShotKind(t.playerCrouch, airborne, t.playerVY, false);
      const fKind    = resolveShotKind(t.playerCrouch, airborne, t.playerVY, true);
      const armed    = !(t.lastHitter === "player" && !t.ballCleared);
      setSnap({
        kind, fKind,
        ballY:      t.ballPos.y,
        ballSpeed:  t.ballVel.length(),
        inRange, inHand,
        armed, airborne,
        descending: t.playerVY < -0.3,
        serveLive:  t.serveStage === "live",
      });
      raf.current = window.setTimeout(tick, 55);
    };
    tick();
    return () => clearTimeout(raf.current);
  }, []);

  if (!snap.serveLive || !snap.inRange) return null;

  const def    = SHOTS[snap.kind];
  const fDef   = SHOTS[snap.fKind];
  const METER_H = 2.6;   // meter shows 0 → 2.6 m
  const pct    = (v: number) => Math.max(0, Math.min(97, (v / METER_H) * 100));

  // Is the ball in the sweet zone of the power shot?
  const nearIdeal  = Math.abs(snap.ballY - def.idealY)  < def.window * 0.65;
  // Finesse zone?
  const nearFIdeal = !sameKind(snap) && Math.abs(snap.ballY - fDef.idealY) < fDef.window * 0.65;
  const armed = snap.armed;

  const clickAction = armed
    ? nearIdeal  ? "◆ CLICK NOW!" :
      nearFIdeal ? "◆ RIGHT-CLICK!" :
      "ball up…"
    : "WAIT";
  const actionCol = armed
    ? nearIdeal  ? def.colour :
      nearFIdeal ? fDef.colour :
      "#ffffff66"
    : "#8b93a0";

  return (
    <div className="pointer-events-none absolute bottom-6 left-1/2 flex -translate-x-1/2 items-end gap-4 select-none">
      {/* Meter column */}
      <div className="relative h-32 w-6 overflow-hidden rounded-full border border-white/25 bg-black/50">
        {/* Power-shot zone (coloured band) */}
        <ZoneBand def={def} pct={pct} snap={snap} />
        {/* Finesse zone (dashed border) */}
        {!sameKind(snap) && <FinesseBand def={fDef} pct={pct} />}
          {/* Ball height marker */}
        <div
          className="absolute left-0 w-full transition-[bottom] duration-[60ms]"
          style={{
            bottom: `${pct(snap.ballY)}%`,
            height: 4,
            background: snap.inHand ? (armed ? "#7dff9a" : "#ffffff") : "#ffffff99",
            boxShadow: snap.inHand && armed ? "0 0 8px #7dff9a" : "none",
            borderRadius: 2,
          }}
        />
      </div>
      {/* Labels */}
      <div className="mb-2 flex flex-col gap-1">
        <div
          className="font-display text-lg leading-none"
          style={{ color: actionCol, fontSize: snap.inHand && armed && nearIdeal ? 22 : 18 }}
        >
          {snap.kind === "mistime"
            ? (snap.descending && snap.airborne ? "TOO LOW!" : "RISING…")
            : clickAction}
        </div>
        <div className="text-[11px] font-bold tracking-wider text-white/45">
          {snap.kind !== "mistime" && `${SHOTS[snap.kind].name}`}
          {snap.inHand && armed && nearIdeal && (
            <span className="ml-2 text-[#7dff9a] text-[12px] animate-pulse">●</span>
          )}
        </div>
        {/* Speed readout */}
        <div className="text-[10px] tabular-nums font-bold text-white/35">
          {snap.ballSpeed.toFixed(1)} m/s
        </div>
      </div>
    </div>
  );
}
function sameKind(s: MeterSnap) { return s.kind === s.fKind; }

function ZoneBand({ def, pct, snap }: { def: (typeof SHOTS)[ShotKind]; pct: (v: number) => number; snap: MeterSnap }) {
  const center = pct(def.idealY);
  const height = pct(def.window * 2) * 0.85;
  const active = Math.abs(snap.ballY - def.idealY) < def.window * 0.65;
  return (
    <div
      className="absolute left-0 w-full"
      style={{
        bottom: Math.max(0, center - height / 2),
        height,
        background: active ? `${def.colour}77` : `${def.colour}33`,
        borderTop: `1.5px solid ${def.colour}${active ? "ff" : "55"}`,
        borderBottom: `1.5px solid ${def.colour}${active ? "ff" : "55"}`,
        transition: "background 80ms",
      }}
    />
  );
}

function FinesseBand({ def, pct }: { def: (typeof SHOTS)[ShotKind]; pct: (v: number) => number }) {
  const center = pct(def.idealY);
  const height = pct(def.window * 2) * 0.8;
  return (
    <div
      className="absolute left-0 w-full"
      style={{
        bottom: Math.max(0, center - height / 2),
        height,
        background: `${def.colour}18`,
        border: `1.5px dashed ${def.colour}77`,
        borderRadius: 3,
      }}
    />
  );
}

// ── Settings ─────────────────────────────────────────────────
function SettingsBtn() {
  const muted  = useSettings((s) => s.muted);
  const toggle = useSettings((s) => s.toggleMute);
  const toMenu = useGame((s) => s.toMenu);
  const [open, setOpen] = useState(false);
  return (
    <div className="pointer-events-auto absolute right-5 top-5 flex items-center gap-2">
      <button
        onClick={toggle}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-[#0d1219]/80 text-lg backdrop-blur-sm transition hover:bg-white/10"
      >{muted ? "🔇" : "🔊"}</button>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-[#0d1219]/80 text-lg backdrop-blur-sm transition hover:bg-white/10"
      >⚙️</button>
      {open && (
        <div className="absolute right-0 top-12 z-30 w-80 animate-cardin rounded-2xl border border-white/15 bg-[#0d1219]/96 p-4 backdrop-blur-md">
          <div className="mb-3 font-display text-xs tracking-[0.25em] text-white/65">POLE ARSENAL</div>
          {(["drive", "skimmer", "smash", "loft", "dink"] as ShotKind[]).map((k) => {
            const s = SHOTS[k];
            return (
              <div key={k} className="mb-3 flex items-start gap-2.5">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.colour }} />
                <div>
                  <div className="text-[12px] font-extrabold text-white/90">
                    {s.name}{" "}
                    <span className="text-[10px] font-bold text-white/35">{s.keys}</span>
                  </div>
                  <div className="text-[10px] leading-snug text-white/50">{s.blurb}</div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-[8px] text-white/25 font-bold tracking-wider">TIMING</span>
                    <div className="flex gap-0.5">
                      {/* Inverted: more sections = harder timing */}
                      {[0,1,2,3,4].map((i) => {
                        // max window 0.90 = easy (1), min window 0.28 = hard (5)
                        const difficulty = Math.ceil((0.90 - s.window) / 0.62 * 5);
                        return (
                          <span key={i} className="h-1 w-3 rounded-full"
                            style={{ background: i < difficulty ? s.colour : "rgba(255,255,255,0.10)" }} />
                        );
                      })}
                    </div>
                    <span className="text-[8px] text-white/25 font-bold">DIFFICULTY</span>
                  </div>
                </div>
              </div>
            );
          })}
          <div className="mt-2 border-t border-white/10 pt-2">
            <div className="mb-1 font-display text-xs tracking-[0.25em] text-white/65">RULES OF THE POLE</div>
            <div className="space-y-0.5 text-[10px] font-bold text-white/55">
              <div>◈ You wind counter-clockwise — hit it hard and fast</div>
              <div>◈ REX winds the other way — counter every hit!</div>
              <div>◈ 5 full turns above the yellow mark = victory 🏆</div>
              <div className="text-[#ff8a7a]">✗ Fouls: touch pole, cross centre, carry ball, double-hit</div>
            </div>
          </div>
          <button
            onClick={() => { setOpen(false); toMenu(); }}
            className="mt-3 w-full rounded-xl bg-white/10 py-2 text-xs font-bold text-white/60 hover:bg-white/20 transition"
          >BACK TO MENU</button>
        </div>
      )}
    </div>
  );
}

// ── HUD root ──────────────────────────────────────────────────
export function TetherHUD() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 font-body">
      <Score />
      <WrapMeter />
      <SettingsBtn />
      <Popups />
      <TimingMeter />
    </div>
  );
}
