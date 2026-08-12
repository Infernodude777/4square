import { useState } from "react";
import { useSettings, DIFFICULTY_INFO, RETICLE_INFO, QUALITY_INFO, formatRecord, type Difficulty, type ReticleStyle, type Quality } from "../game/settings";
import { useGame, type Mode } from "../game/store";
import { Icon } from "./Icons";

const MODE_ORDER: Mode[] = [
  "foursquare", "tetherball", "wallball", "tag", "kickball",
  "basketball", "dodgeball", "gaga", "hopscotch", "redlight",
];
const MODE_LABEL: Record<Mode, string> = {
  foursquare: "FOUR SQUARE", tetherball: "TETHERBALL", wallball: "WALLBALL", tag: "TAG", kickball: "KICKBALL",
  basketball: "BASKETBALL", dodgeball: "DODGEBALL", gaga: "GAGA", hopscotch: "HOPSCOTCH", redlight: "RED LIGHT",
};

/** Modal settings sheet — volume, music, quality, difficulty, feel, records, stats. */
export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const {
    volume, musicVolume, muted, screenShake, particles, aimSensitivity, reticleStyle, difficulty, quality,
    highScores, stats, modePlays,
    setVolume, setMusicVolume, toggleMute, toggleShake, toggleParticles, setSensitivity, setReticle, setDifficulty, setQuality, resetAll,
  } = useSettings();
  const mode = useGame((s) => s.mode);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 font-body backdrop-blur-[3px]" onClick={onClose}>
      <div
        className="animate-cardin max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl border-2 border-[#ffd23e]/60 bg-[#10141c] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="font-display text-lg tracking-widest text-[#ffd23e]">BLACKTOP SETTINGS</div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/70 transition hover:bg-white/20"
            aria-label="Close settings"
          >
            <Icon name="x" size={14} />
          </button>
        </div>

        {/* sfx volume */}
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-[10px] font-extrabold tracking-[0.25em] text-white/50">
            <span>SFX VOLUME</span><span>{Math.round(volume * 100)}%</span>
          </div>
          <input
            type="range" min={0} max={100} value={Math.round(volume * 100)}
            onChange={(e) => setVolume(Number(e.target.value) / 100)}
            className="w-full accent-[#ffd23e]"
          />
        </div>

        {/* music volume (Season 2 recess radio) */}
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-[10px] font-extrabold tracking-[0.25em] text-white/50">
            <span>RADIO VOLUME</span><span>{Math.round(musicVolume * 100)}%</span>
          </div>
          <input
            type="range" min={0} max={100} value={Math.round(musicVolume * 100)}
            onChange={(e) => setMusicVolume(Number(e.target.value) / 100)}
            className="w-full accent-[#38d6d0]"
          />
        </div>

        {/* quality preset (Season 2) */}
        <div className="mb-4">
          <div className="mb-1.5 text-[10px] font-extrabold tracking-[0.25em] text-white/50">VISUALS</div>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(QUALITY_INFO) as Quality[]).map((q) => (
              <button
                key={q}
                onClick={() => setQuality(q)}
                className={`rounded-xl border-2 px-2 py-2 text-center transition ${
                  quality === q
                    ? "border-[#38d6d0] bg-[#38d6d0]/15 text-[#38d6d0]"
                    : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10"
                }`}
              >
                <div className="font-display text-xs">{QUALITY_INFO[q].label}</div>
                <div className="mt-0.5 text-[8px] font-bold leading-tight text-white/40">{QUALITY_INFO[q].hint}</div>
              </button>
            ))}
          </div>
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

        {/* aim sensitivity */}
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-[10px] font-extrabold tracking-[0.25em] text-white/50">
            <span>AIM SENSITIVITY</span><span>{aimSensitivity.toFixed(2)}×</span>
          </div>
          <input
            type="range" min={40} max={250} value={Math.round(aimSensitivity * 100)}
            onChange={(e) => setSensitivity(Number(e.target.value) / 100)}
            className="w-full accent-[#ffd23e]"
          />
        </div>

        {/* reticle style */}
        <div className="mb-4">
          <div className="mb-1.5 text-[10px] font-extrabold tracking-[0.25em] text-white/50">RETICLE</div>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(RETICLE_INFO) as ReticleStyle[]).map((r) => (
              <button
                key={r}
                onClick={() => setReticle(r)}
                className={`rounded-xl border-2 px-2 py-1.5 text-center transition ${
                  reticleStyle === r
                    ? "border-[#ffd23e] bg-[#ffd23e]/15 text-[#ffd23e]"
                    : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10"
                }`}
              >
                <div className="font-display text-[11px]">{RETICLE_INFO[r].label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* toggles — Season 3: words instead of emoji stickers */}
        <div className="mb-4 flex gap-2">
          <button onClick={toggleMute} className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border-2 px-3 py-2 text-[11px] font-bold transition ${muted ? "border-[#ff6b5e] bg-[#ff6b5e]/15 text-[#ff6b5e]" : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"}`}>
            <Icon name={muted ? "speakerOff" : "speaker"} size={14} />
            {muted ? "MUTED" : "SOUND ON"}
          </button>
          <button onClick={toggleShake} className={`flex-1 rounded-xl border-2 px-3 py-2 text-[11px] font-bold transition ${screenShake ? "border-[#57d977] bg-[#57d977]/15 text-[#57d977]" : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"}`}>
            {screenShake ? "SHAKE ON" : "SHAKE OFF"}
          </button>
          <button onClick={toggleParticles} className={`flex-1 rounded-xl border-2 px-3 py-2 text-[11px] font-bold transition ${particles ? "border-[#b58cff] bg-[#b58cff]/15 text-[#b58cff]" : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"}`}>
            {particles ? "FX ON" : "FX OFF"}
          </button>
        </div>

        {/* records */}
        <div className="mb-4 rounded-xl border border-white/10 bg-black/30 p-3">
          <div className="mb-2 text-[10px] font-extrabold tracking-[0.25em] text-white/50">HALL OF RECORDS</div>
          <div className="grid grid-cols-1 gap-1">
            {MODE_ORDER.map((m) => (
              <div key={m} className="flex justify-between text-[11px] font-bold">
                <span className="text-white/55">{MODE_LABEL[m]}</span>
                <span className="text-[#ffd23e] tabular-nums">
                  {highScores[m] !== undefined ? formatRecord(m, highScores[m]!) : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* lifetime stats */}
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[10px] font-extrabold tracking-[0.25em] text-white/50">LIFETIME STATS</div>
            {confirmReset ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-extrabold text-[#ff6b5e]">SURE?</span>
                <button
                  onClick={() => { resetAll(); setConfirmReset(false); }}
                  className="rounded-md bg-[#ff6b5e]/20 px-2 py-0.5 text-[9px] font-extrabold text-[#ff6b5e] transition hover:bg-[#ff6b5e]/35"
                >
                  YES, ERASE ALL
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="rounded-md bg-white/10 px-2 py-0.5 text-[9px] font-bold text-white/60 transition hover:bg-white/20"
                >
                  NO
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmReset(true)}
                className="text-[9px] font-bold text-white/30 underline-offset-2 transition hover:text-[#ff6b5e] hover:underline"
                title="Erases stats, records, badges and today's daily progress"
              >
                RESET ALL PROGRESS
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-bold text-white/60">
            <span>Games · {stats.gamesPlayed}</span>
            <span>Wins · {stats.totalWins}</span>
            <span>Time · {Math.floor(stats.timePlayed / 60)}m</span>
            <span>Hits · {stats.totalHits}</span>
            <span>Perfects · {stats.totalPerfects}</span>
            <span>KOs · {stats.totalKOs}</span>
            <span>Rallies · {stats.totalRallies}</span>
            <span>Catches · {stats.totalCatch}</span>
            <span>Swishes · {stats.totalSwishes}</span>
            <span>Kickball runs · {stats.totalRuns}</span>
            <span>Bells · {stats.bellsHeard}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {MODE_ORDER.filter((m) => (modePlays[m] ?? 0) > 0).map((m) => (
              <span key={m} className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold text-white/50">
                {MODE_LABEL[m]} ×{modePlays[m]}
              </span>
            ))}
          </div>
        </div>

        {confirmReset && (
          <div className="mt-2 rounded-lg border border-[#ff6b5e]/30 bg-[#ff6b5e]/10 px-3 py-2 text-center text-[9px] font-bold text-[#ff6b5e]/90">
            Erases lifetime stats, hall-of-records scores, every badge, and today's recess special. This cannot be undone.
          </div>
        )}
        <div className="mt-3 text-center text-[9px] font-bold tracking-widest text-white/25">
          PLAYING: {mode.toUpperCase()}
        </div>
      </div>
    </div>
  );
}
