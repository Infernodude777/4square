// Tiny WebAudio synth — no assets, all procedural playground noise.
let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

export function setMuted(m: boolean) {
  if (master) master.gain.value = m ? 0 : 0.5;
  else if (!m) ac();
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType = "sine",
  vol = 0.3,
  when = 0,
    glideTo?: number
) {
  const c = ac();
  if (!c || !master) return;
  const t = c.currentTime + when;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
    o.frequency.setValueAtTime(freq, t);
  if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(dur: number, vol = 0.3, filterFreq = 1200, when = 0, type: BiquadFilterType = "bandpass") {
  const c = ac();
  if (!c || !master) return;
  const t = c.currentTime + when;
  const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = filterFreq;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(master);
  src.start(t);
}

export const sfx = {
  unlock() {
    ac();
  },
  bounce(impact: number) {
    const v = Math.min(0.5, 0.08 + impact * 0.05);
    tone(110 + impact * 8, 0.09, "sine", v);
    noise(0.05, v * 0.5, 500, 0, "lowpass");
  },
  hit(power: number) {
    noise(0.07, 0.35 + power * 0.25, 1600 + power * 1600);
    tone(220 + power * 260, 0.1, "triangle", 0.25 + power * 0.2, 0, 90);
  },
  botHit() {
    noise(0.06, 0.16, 1400);
    tone(260, 0.08, "triangle", 0.14, 0, 110);
  },
  perfect() {
    tone(880, 0.12, "sine", 0.22);
        tone(1318.5, 0.18, "sine", 0.2, 0.06);
    tone(1760, 0.22, "sine", 0.12, 0.12);
  },
  skimmer() {
    noise(0.18, 0.22, 900, 0, "highpass");
  },
    smash() {
    tone(70, 0.18, "sine", 0.5, 0, 40);
    noise(0.12, 0.4, 2400);
    },
  fault() {
    tone(300, 0.28, "sawtooth", 0.14, 0, 150);
    tone(220, 0.32, "sawtooth", 0.12, 0.16, 110);
    noise(0.5, 0.1, 700, 0.05, "lowpass");
  },
  cheer() {
    for (let i = 0; i < 6; i++) noise(0.35, 0.12, 900 + Math.random() * 900, i * 0.03, "bandpass");
        tone(523, 0.14, "square", 0.08, 0);
    tone(659, 0.14, "square", 0.08, 0.09);
    tone(784, 0.2, "square", 0.09, 0.18);
  },
  whistle() {
    tone(2100, 0.12, "square", 0.05);
    tone(2100, 0.2, "square", 0.05, 0.16, 2050);
  },
  line() {
    tone(440, 0.15, "sine", 0.16, 0, 520);
  },
  ui() {
        tone(660, 0.06, "sine", 0.12);
  },
  win() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, "square", 0.09, i * 0.12));
    noise(0.9, 0.14, 1400, 0.5);
  },
};

  }
  }
  }
  }
  }
  }
    }
  }
  }
  }
  }
  }
  }
}
}
}
)
}
  }
}