import { useEffect } from "react";
import { useBadges, type BadgeDef } from "../game/achievements";

/** One badge card — slides in, then dismisses itself after a few seconds. */
function ToastCard({ id, badge, onDone }: { id: number; badge: BadgeDef; onDone: (id: number) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onDone(id), 3600);
    return () => clearTimeout(t);
  }, [id, onDone]);

  return (
    <div className="animate-bannerin flex w-64 items-center gap-2.5 rounded-xl border border-[#ffd23e]/60 bg-[#10141c]/90 px-3 py-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.45)] backdrop-blur-md">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#ffd23e]/15 text-xl">
        {badge.emoji}
      </div>
      <div className="min-w-0">
        <div className="text-[8px] font-extrabold tracking-[0.25em] text-[#ffd23e]/70">BADGE UNLOCKED</div>
        <div className="truncate font-display text-sm text-[#ffd23e]">{badge.name}</div>
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
    <div className="pointer-events-none absolute right-4 top-20 z-50 flex flex-col items-end gap-2">
      {toasts.map((t) => (
        <ToastCard key={t.id} id={t.id} badge={t.badge} onDone={dismiss} />
      ))}
    </div>
  );
}
