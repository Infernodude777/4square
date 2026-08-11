import { useEffect } from "react";
import { useBadges, type BadgeDef } from "../game/achievements";

/** One badge card — slides in, then dismisses itself after a few seconds. */
function ToastCard({ id, badge, onDone }: { id: number; badge: BadgeDef; onDone: (id: number) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onDone(id), 3600);
    return () => clearTimeout(t);
  }, [id, onDone]);

  return (
    <div className="animate-bannerin flex items-center gap-3 rounded-2xl border-2 border-[#ffd23e] bg-[#10141c]/95 px-6 py-4 shadow-[0_12px_50px_rgba(0,0,0,0.5)] backdrop-blur-md">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#ffd23e]/15 text-3xl">
        {badge.emoji}
      </div>
      <div>
        <div className="text-[9px] font-extrabold tracking-[0.3em] text-[#ffd23e]/70">BADGE UNLOCKED</div>
        <div className="font-display text-xl text-[#ffd23e]">{badge.name}</div>
        <div className="text-[10px] font-bold text-white/55">{badge.desc}</div>
      </div>
    </div>
  );
}

/** Slides in a "BADGE UNLOCKED" card for each new badge, then dismisses it. */
export function BadgeToast() {
  const toasts = useBadges((s) => s.toasts);
  const dismiss = useBadges((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-20 z-50 flex flex-col items-center gap-3">
      {toasts.map((t) => (
        <ToastCard key={t.id} id={t.id} badge={t.badge} onDone={dismiss} />
      ))}
    </div>
  );
}
