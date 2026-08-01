import { useEffect, useState } from "react";
import { useGame, type Popup } from "../../game/store";
import { TAG, TAG_FIELD } from "./tagState";

const tones: Record<Popup["tone"], string> = { gold: "#ffd23e", cyan: "#38d6d0", red: "#ff6b5e", green: "#57d977", purple: "#b58cff", white: "#f2f4f8" };

function TagScore() {
  const [v, setV] = useState({ score: 0, it: "ZIGGY", time: TAG_FIELD.roundSeconds });
  useEffect(() => { const id = window.setInterval(() => setV({ score: TAG.current.score, it: TAG.current.people[TAG.current.currentIt].name, time: Math.max(0, TAG_FIELD.roundSeconds - TAG.current.time) }), 80); return () => window.clearInterval(id); }, []);
  return <div className="pointer-events-none absolute left-5 top-5 rounded-2xl border border-white/15 bg-[#0d1219]/82 px-5 py-3 backdrop-blur-sm"><div className="flex items-end gap-7"><div><div className="text-[9px] font-extrabold tracking-[0.3em] text-[#ffd23e]">YOUR TAGS</div><div className="font-display text-4xl leading-none text-[#ffd23e]">{v.score}<span className="ml-1 text-lg text-white/35">/ {TAG_FIELD.goal}</span></div></div><div><div className="text-[9px] font-extrabold tracking-[0.25em] text-[#ff6b5e]">IT</div><div className="font-display text-2xl leading-none text-[#ff8a7a]">{v.it}</div></div><div><div className="text-[9px] font-extrabold tracking-[0.2em] text-white/35">TIME</div><div className="font-display text-2xl leading-none text-white/80">{v.time.toFixed(0)}s</div></div></div></div>;
}

function ItBanner() {
  const [it, setIt] = useState("ZIGGY");
  useEffect(() => { const id = window.setInterval(() => setIt(TAG.current.people[TAG.current.currentIt].name), 90); return () => window.clearInterval(id); }, []);
  const you = it === "YOU";
  return <div className="pointer-events-none absolute left-1/2 top-5 -translate-x-1/2 rounded-full border-2 px-5 py-1.5 font-display text-lg backdrop-blur-sm" style={{ borderColor: you ? "#ffd23e" : "#ff6b5e", color: you ? "#ffd23e" : "#ff8a7a", background: "rgba(12,16,24,0.78)" }}>{you ? "YOU ARE IT · CHASE!" : `${it} IS IT · KEEP MOVING`}</div>;
}

function Popups() { const popups = useGame((s) => s.popups); return <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-[31%]"><div className="flex flex-col-reverse items-center gap-1">{popups.slice(-3).map((p) => <div key={p.id} className="animate-popfont font-display text-center leading-none" style={{ color: tones[p.tone], fontSize: p.big ? 34 : 23, textShadow: "0 3px 0 rgba(0,0,0,0.5)" }}>{p.text}</div>)}</div></div>; }

function Settings() { const muted = useGame((s) => s.muted); const toggle = useGame((s) => s.toggleMute); const toMenu = useGame((s) => s.toMenu); const [open, setOpen] = useState(false); return <div className="pointer-events-auto absolute right-5 top-5 flex gap-2"><button onClick={toggle} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-[#0d1219]/80 text-lg backdrop-blur-sm">{muted ? "🔇" : "🔊"}</button><button onClick={() => setOpen((x) => !x)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-[#0d1219]/80 text-lg backdrop-blur-sm">⚙️</button>{open && <div className="absolute right-0 top-12 w-72 rounded-2xl border border-white/15 bg-[#0d1219]/95 p-4 backdrop-blur-md"><div className="mb-2 font-display text-xs tracking-[0.25em] text-white/70">TAG PLAYBOOK</div><div className="space-y-1.5 text-[11px] font-bold text-white/60"><div>◈ WASD / ARROWS — cut through the field</div><div>◈ HOLD SHIFT — burn stamina for a sprint</div><div>◈ If you are IT, touch a rival to tag them</div><div>◈ Tag {TAG_FIELD.goal} runners to win the yard</div></div><button onClick={() => { setOpen(false); toMenu(); }} className="mt-3 w-full rounded-xl bg-white/10 py-2 text-xs font-bold text-white/65">BACK TO PLAYGROUND</button></div>}</div>; }

export function TagHUD() { return <div className="pointer-events-none absolute inset-0 z-10 font-body"><TagScore /><ItBanner /><Settings /><Popups /><div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-[#10141c]/65 px-5 py-2 text-[11px] font-bold tracking-[0.16em] text-white/55 backdrop-blur-sm">WASD MOVE · SHIFT SPRINT · TAG {TAG_FIELD.goal} TO WIN</div></div>; }
