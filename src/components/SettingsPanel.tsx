import { useSettings, DIFFICULTY_INFO, type Difficulty } from "../game/settings";
import { useGame } from "../game/store";

/** Modal settings sheet — volume, difficulty, toggles, records. */
export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const {
    volume, muted, screenShake, difficulty, highScores, stats,
    setVolume, toggleMute, toggleShake, setDifficulty, resetStats,
  } = useSettings();
  const mode = useGame((s) => s.mode);

  const rows: [string, number][] = [
    ["FOUR SQUARE", highScores["foursquare"] ?? 0],
    ["TETHERBALL", highScores["tetherball"] ?? 0],
    ["WALLBALL", highScores["wallball"] ?? 0],
    ["TAG", highScores["tag"] ?? 0],
    ["KICKBALL", highScores["kickball"] ?? 0],
  ];

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 font-body backdrop-blur-[3px]" onClick={onClose}>
      <div
        className="animate-cardin w-full max-w-md rounded-2xl border-2 border-[#ffd23e]/60 bg-[#10141c] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="font-display text-lg tracking-widest text-[#ffd23e]">BLACKTOP SETTINGS</div>
          <button onClick={onClose} className="rounded-lg bg-white/10 px-3 py-1 text-xs font-bold text-white/70 hover:bg-white/20">✕</button>
        </div>

        {/* volume */}
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-[10px] font-extrabold tracking-[0.25em] text-white/50">
            <span>VOLUME</span><span>{Math.round(volume * 100)}%</span>
          </div>
          <input
            type="range" min={0} max={100} value={Math.round(volume * 100)}
            onChange={(e) => setVolume(Number(e.target.value) / 100)}
            className="w-full accent-[#ffd23e]"
          />
        </div>

        {/* difficulty */}
        <div className="mb-4">
          <div className="mb-1.5 text-[10px] font-extrabold tracking-[0.25em] text-white/50">DIFFICULTY</div>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(DIFFICULTY_INFO) as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`rounded-xl border-2 px-2 py-2 text-center transition ${
                  difficulty === d
                    ? "border-[#ffd23e] bg-[#ffd23e]/15 text-[#ffd23e]"
                    : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10"
                }`}
              >
                <div className="font-display text-xs">{DIFFICULTY_INFO[d].label}</div>
                <div className="mt-0.5 text-[8px] font-bold leading-tight text-white/40">{DIFFICULTY_INFO[d].hint}</div>
              </button>
            ))}
          </div>
        </div>

        {/* toggles */}
        <div className="mb-4 flex gap-2">
          <button onClick={toggleMute} className={`flex-1 rounded-xl border-2 px-3 py-2 text-[11px] font-bold transition ${muted ? "border-[#ff6b5e] bg-[#ff6b5e]/15 text-[#ff6b5e]" : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"}`}>
            {muted ? "🔇 MUTED" : "🔊 SOUND ON"}
          </button>
          <button onClick={toggleShake} className={`flex-1 rounded-xl border-2 px-3 py-2 text-[11px] font-bold transition ${screenShake ? "border-[#57d977] bg-[#57d977]/15 text-[#57d977]" : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"}`}>
            {screenShake ? "📳 SHAKE ON" : "📴 SHAKE OFF"}
          </button>
        </div>

        {/* records */}
        <div className="mb-4 rounded-xl border border-white/10 bg-black/30 p-3">
          <div className="mb-2 text-[10px] font-extrabold tracking-[0.25em] text-white/50">HALL OF RECORDS</div>
          <div className="grid grid-cols-1 gap-1">
            {rows.map(([name, score]) => (
              <div key={name} className="flex justify-between text-[11px] font-bold">
                <span className="text-white/55">{name}</span>
                <span className="text-[#ffd23e] tabular-nums">{score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* lifetime stats */}
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[10px] font-extrabold tracking-[0.25em] text-white/50">LIFETIME STATS</div>
            <button onClick={resetStats} className="text-[9px] font-bold text-white/30 underline-offset-2 hover:text-[#ff6b5e] hover:underline">RESET</button>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-bold text-white/60">
            <span>Games · {stats.gamesPlayed}</span>
            <span>Wins · {stats.totalWins}</span>
            <span>Time · {Math.floor(stats.timePlayed / 60)}m</span>
            <span>Hits · {stats.totalHits}</span>
            <span>Perfects · {stats.totalPerfects}</span>
            <span>KOs · {stats.totalKOs}</span>
            <span>Rallies · {stats.totalRallies}</span>
            <span>Kickball runs · {stats.totalRuns}</span>
          </div>
        </div>

        <div className="mt-3 text-center text-[9px] font-bold tracking-widest text-white/25">
          PLAYING: {mode.toUpperCase()}
        </div>
      </div>
    </div>
  );
}
