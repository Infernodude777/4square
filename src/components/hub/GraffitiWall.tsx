import { useEffect, useState } from "react";
import { loadMarks } from "../../game/graffiti";

/**
 * The chalk wall — the yard's memory. The last few marks kids left
 * after matches show on a little board in the corner of the hub.
 * It polls the store every couple of seconds so a mark written on
 * the Victory screen appears the moment you step back outside.
 */
export function GraffitiWall() {
  const [marks, setMarks] = useState<string[]>(() => loadMarks());

  useEffect(() => {
    const iv = setInterval(() => setMarks(loadMarks()), 2000);
    return () => clearInterval(iv);
  }, []);

  if (marks.length === 0) return null;

  return (
    <div className="pointer-events-none absolute bottom-4 right-4 max-w-[240px] rotate-[0.6deg] select-none">
      <div className="wall-board rounded-lg px-3 py-2 shadow-[0_10px_28px_rgba(0,0,0,0.45)]">
        <div className="mb-1 text-[8px] font-extrabold tracking-[0.3em] text-[#8fd8cf]/70">
          THE CHALK WALL
        </div>
        {marks.map((m, i) => (
          <div
            key={`${i}-${m}`}
            className={`truncate text-[10px] font-extrabold ${
              i === marks.length - 1 ? "text-[#ffd23e]" : "text-white/50"
            }`}
          >
            {m}
          </div>
        ))}
      </div>
      {/* duct tape */}
      <div className="tape-corner" />
    </div>
  );
}
