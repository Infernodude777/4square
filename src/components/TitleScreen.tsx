import { useEffect } from "react";

/**
 * Main menu (P1-1). Shown on first run (and after a settings wipe that
 * predates it) until the player hits PLAY — dismissed permanently via the
 * persisted `hasStarted` flag so returning recess kids drop straight into
 * the yard. The hub keeps rendering behind the frosted card, so the first
 * thing anyone sees is the actual playground.
 */
export function TitleScreen({
  onPlay,
  onSettings,
}: {
  onPlay: () => void;
  onSettings: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Enter" || e.code === "Space") {
        e.preventDefault();
        onPlay();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onPlay]);

  return (
    <div
      className="absolute inset-0 z-50 flex cursor-pointer flex-col items-center justify-center bg-[#0d1219]/55 font-body backdrop-blur-[3px]"
      onClick={onPlay}
    >
      <div
        className="animate-cardin mx-4 flex w-full max-w-md flex-col items-center rounded-3xl border-4 border-[#f5edc8]/70 bg-[#10141c]/92 px-8 py-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-[10px] font-extrabold uppercase tracking-[0.4em] text-[#8fd8cf]">
          Falcon Elementary presents
        </div>
        <h1
          className="mt-2 font-display text-5xl leading-[0.95] text-[#ffd23e]"
          style={{ textShadow: "0 4px 0 rgba(0,0,0,0.5)" }}
        >
          RECESS
          <span className="block text-[#ff6b5e]">ROYALE</span>
        </h1>
        <p className="mt-3 text-xs font-bold tracking-wide text-white/55">
          Nine courts · four robot rivals · one crown
        </p>

        <button
          onClick={onPlay}
          className="mt-8 w-full rounded-xl border-b-[5px] border-[#8f6a00] bg-[#ffd23e] py-3.5 font-display text-2xl text-[#3a2a00] transition hover:-translate-y-0.5 hover:bg-[#ffe066] hover:shadow-[0_8px_24px_rgba(255,210,62,0.35)] active:translate-y-0.5 active:border-b-0"
        >
          ▶ PLAY
        </button>
        <button
          onClick={onSettings}
          className="mt-3 w-full rounded-xl border-2 border-white/15 bg-white/5 py-2.5 text-sm font-extrabold text-white/75 transition hover:bg-white/10"
        >
          ⚙️ SETTINGS
        </button>

        <div className="mt-6 text-[9px] font-bold tracking-widest text-white/30">
          CLICK OR PRESS ENTER TO START
        </div>
        <div className="mt-1 text-[9px] font-bold tracking-widest text-white/20">
          WASD TO WALK · E TO PLAY · DESKTOP + MOUSE REQUIRED
        </div>
      </div>
    </div>
  );
}
