/**
 * Boot overlay (P0-4): covers the plain sky-blue moment while the GL
 * context, shaders and the schoolyard compile. Fades out once the Canvas
 * reports its first frame via onCreated.
 */
export function LoadingScreen() {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#8fbfe0] font-body transition-opacity duration-500">
      <div className="chalkboard animate-cardin flex w-72 flex-col items-center rounded-3xl border-4 border-[#f5edc8]/50 px-8 py-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-[#8fd8cf]">
          Falcon Elementary
        </div>
        <div
          className="mt-2 font-display text-3xl leading-none text-[#ffd23e]"
          style={{ textShadow: "0 3px 0 rgba(0,0,0,0.55)" }}
        >
          RECESS
          <br />
          ROYALE
        </div>

        {/* bouncing four-square ball */}
        <div className="mt-8 h-16 w-16">
          <div className="animate-bounce rounded-full bg-[radial-gradient(circle_at_32%_28%,#ff7a66,#d8342c_55%,#9e1c18)] shadow-[0_6px_14px_rgba(0,0,0,0.35)]" style={{ width: 44, height: 44 }} />
        </div>

        <div className="mt-6 flex items-center gap-1.5 text-[10px] font-extrabold tracking-[0.3em] text-white/55">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#ffd23e]" />
          LOADING THE YARD…
        </div>
      </div>
    </div>
  );
}
