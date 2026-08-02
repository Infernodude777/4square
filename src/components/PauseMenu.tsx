import { useGame } from "../game/store";
import { useSettings } from "../game/settings";

/** Pause overlay — resume, restart, settings, quit. */
export function PauseMenu({ onOpenSettings }: { onOpenSettings: () => void }) {
  const setPaused = useGame((s) => s.setPaused);
  const start = useGame((s) => s.start);
  const toMenu = useGame((s) => s.toMenu);
  const mode = useGame((s) => s.mode);
  const difficulty = useSettings((s) => s.difficulty);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#0d1219]/70 font-body backdrop-blur-[4px]">
      <div className="animate-cardin flex w-full max-w-xs flex-col items-stretch gap-3 rounded-2xl border-2 border-[#ffd23e]/50 bg-[#10141c]/95 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
        <div className="mb-1 text-center">
          <div className="font-display text-3xl tracking-widest text-[#ffd23e]">PAUSED</div>
          <div className="mt-1 text-[10px] font-extrabold tracking-[0.3em] text-white/40">
            {mode.toUpperCase()} · {difficulty.toUpperCase()}
          </div>
        </div>

        <button
          onClick={() => setPaused(false)}
          className="rounded-xl border-b-[4px] border-[#8f6a00] bg-[#ffd23e] py-3 font-display text-xl text-[#3a2a00] transition hover:-translate-y-0.5 hover:bg-[#ffe066] active:translate-y-0.5 active:border-b-0"
        >
          RESUME
        </button>
        <button
          onClick={() => start(mode)}
          className="rounded-xl border border-white/15 bg-white/5 py-2.5 text-sm font-extrabold text-white/80 transition hover:bg-white/10"
        >
          RESTART MATCH
        </button>
        <button
          onClick={onOpenSettings}
          className="rounded-xl border border-white/15 bg-white/5 py-2.5 text-sm font-extrabold text-white/80 transition hover:bg-white/10"
        >
          SETTINGS
        </button>
        <button
          onClick={toMenu}
          className="rounded-xl border border-white/15 bg-white/5 py-2.5 text-sm font-extrabold text-white/60 transition hover:bg-white/10"
        >
          QUIT TO HUB
        </button>

        <div className="mt-1 text-center text-[9px] font-bold tracking-widest text-white/25">
          ESC / P TO RESUME
        </div>
      </div>
    </div>
  );
}
