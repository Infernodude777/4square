import { useEffect, useRef, useState } from "react";
import { MOVES, TARGET_SCORE, type MoveId } from "../game/constants";
import { RT } from "../game/refs";
import { useGame, type Popup } from "../game/store";

const TONE: Record<Popup["tone"], string> = {
  gold: "#ffd23e",
  cyan: "#38d6d0",
  red: "#ff6b5e",
  green: "#57d977",
  purple: "#b58cff",
  white: "#f2f4f8",
};

/* ── small score badge ─────────────────────────────────────── */
function Score() {
  const score = useGame((s) => s.score);
  return (
    <div className="pointer-events-none absolute left-5 top-5 select-none rounded-2xl border border-white/15 bg-[#0d1219]/80 px-5 py-3 backdrop-blur-sm">
      <div className="text-[9px] font-extrabold tracking-[0.3em] text-white/40">SCORE</div>
      <div className="font-display text-4xl leading-none text-[#ffe066]">{score}</div>
      <div className="mt-1.5 h-1.5 w-28 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#f7b32b] to-[#ff5a3c] transition-all duration-500"
          style={{ width: `${Math.min(100, (score / TARGET_SCORE) * 100)}%` }}
        />
      </div>
    </div>
  );
}

/* ── floating pop-ups (perfect, KO, etc.) ──────────────────── */
function Popups() {
  const popups = useGame((s) => s.popups);
  return (
    <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-[28%]">
      <div className="flex flex-col-reverse items-center gap-1">
        {popups.slice(-3).map((p) => (
          <PopupItem key={p.id} p={p} />
        ))}
      </div>
    </div>
  );
}

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
        textShadow: "0 3px 0 rgba(0,0,0,0.45), 0 0 24px rgba(0,0,0,0.35)",
      }}
    >
      {p.text}
    </div>
  );
}

/* ── timing meter (bottom-center, only when player can hit) ── */
function TimingMeter() {
  const snap = useRef({ stance: "stand" as const, move: "drive" as MoveId, rel: 0, canHit: false } as { stance: "stand" | "crouch" | "air"; move: MoveId; rel: number; canHit: boolean });

  useEffect(() => {
    const iv = setInterval(() => {
      const p = RT.entities.player;
      const leg = RT.leg;
      const armed = !!leg && leg.isServe && leg.serveBounced && leg.hitter === "player" && !leg.done;
      const canHit =
        armed || (!!leg && !leg.done && !leg.isServe && leg.firstBounced && leg.receiver === "player");
      const stance = p.crouch ? "crouch" : p.y > 0.3 ? "air" : "stand";
      const move =
        stance === "crouch" ? "skimmer" : stance === "air" ? "smash" : RT.input.lob ? "lob" : "drive";
      snap.current = { stance, move, rel: Math.max(0, RT.ball.pos.y - p.y), canHit };
    }, 70);
    return () => clearInterval(iv);
  }, []);

  const s = snap.current;
  if (!s.canHit) return null;

  const md = MOVES[s.move];
  const ideal = s.move === "smash" ? 1.6 : md.idealY;
  const H = 2.6;
  const zoneBot = Math.max(0, (ideal - md.win * 0.55) / H) * 100;
  const zoneH = Math.min(96, ((md.win * 1.1) / H) * 100);
  const marker = Math.min(97, Math.max(0, (s.rel / H) * 100));
  const inZone = Math.abs(s.rel - ideal) < md.win * 0.5;

  return (
    <div className="pointer-events-none absolute bottom-6 left-1/2 flex -translate-x-1/2 items-end gap-2 select-none">
      <div className="relative h-20 w-3.5 overflow-hidden rounded-full border border-white/15 bg-black/40">
        <div
          className="absolute left-0 w-full rounded-full"
          style={{ bottom: `${zoneBot}%`, height: `${zoneH}%`, background: `${md.color}55` }}
        />
        <div
          className="absolute left-0 h-[2px] w-full rounded-full transition-[bottom] duration-75"
          style={{ bottom: `${marker}%`, background: inZone ? "#7dff9a" : "#ffffff88" }}
        />
      </div>
      {inZone && (
        <div className="animate-pulse font-display text-sm tracking-wider text-[#7dff9a]">HIT!</div>
      )}
    </div>
  );
}

/* ── settings gear ─────────────────────────────────────────── */
export function SettingsBtn() {
  const muted = useGame((s) => s.muted);
  const toggleMute = useGame((s) => s.toggleMute);
  const [open, setOpen] = useState(false);

  return (
    <div className="pointer-events-auto absolute right-5 top-5 flex items-center gap-2">
      <button
        onClick={toggleMute}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-[#0d1219]/80 text-lg backdrop-blur-sm transition hover:bg-white/10"
      >
        {muted ? "🔇" : "🔊"}
      </button>
      <button
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-[#0d1219]/80 text-lg backdrop-blur-sm transition hover:bg-white/10"
      >
        ⚙️
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-30 w-64 animate-cardin rounded-2xl border border-white/15 bg-[#0d1219]/95 p-4 backdrop-blur-md">
          <div className="mb-3 font-display text-xs tracking-[0.25em] text-white/70">BLACKTOP ARSENAL</div>
          {(Object.keys(MOVES) as MoveId[]).map((m) => {
            const md = MOVES[m];
            return (
              <div key={m} className="mb-2.5 flex items-start gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: md.color }} />
                <div>
                  <div className="text-[11px] font-extrabold tracking-wide text-white/90">
                    {md.name}{" "}
                    <span className="font-bold text-white/35">· {md.key}</span>
                  </div>
                  <div className="text-[10px] leading-snug text-white/45">{md.desc}</div>
                </div>
              </div>
            );
          })}
          <div className="mt-2 border-t border-white/10 pt-2 text-[9px] text-white/35">
            A / D while hitting → curve the ball
          </div>
          <button
            onClick={() => setOpen(false)}
            className="mt-3 w-full rounded-lg bg-white/10 py-1.5 text-xs font-bold text-white/70 transition hover:bg-white/20"
          >
            CLOSE
          </button>
        </div>
      )}
    </div>
  );
}

/* ── assembled HUD ─────────────────────────────────────────── */
export function HUD() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 font-body">
      <Score />
      <SettingsBtn />
      <Popups />
      <TimingMeter />
    </div>
  );
}
