import * as THREE from "three";
import type { FaceState } from "./refs";

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function tex(c: HTMLCanvasElement, repeat?: [number, number]) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  return t;
}

// ── The foursquare court: 9m × 9m of painted blacktop ──────────
export function makeCourtTexture(): THREE.CanvasTexture {
  const S = 1024;
  const c = canvas(S, S);
  const g = c.getContext("2d")!;
  const P = (m: number) => ((m + 4.5) / 9) * S; // meters → px

  // asphalt base
  g.fillStyle = "#787d85";
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 5200; i++) {
    const v = 100 + Math.random() * 60;
    g.fillStyle = `rgba(${v},${v + 3},${v + 8},${0.16 + Math.random() * 0.14})`;
    g.fillRect(Math.random() * S, Math.random() * S, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
  // blotches & oil stains
  for (let i = 0; i < 14; i++) {
    const x = Math.random() * S, y = Math.random() * S, r = 30 + Math.random() * 90;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(52,55,60,${0.12 + Math.random() * 0.12})`);
    gr.addColorStop(1, "rgba(52,55,60,0)");
    g.fillStyle = gr;
    g.beginPath();
    g.arc(x, y, r, 0, 7);
    g.fill();
  }
  // cracks
  g.strokeStyle = "rgba(40,42,47,0.5)";
  for (let i = 0; i < 9; i++) {
    g.lineWidth = 1 + Math.random() * 1.6;
    g.beginPath();
    let x = Math.random() * S, y = Math.random() * S;
    g.moveTo(x, y);
    const n = 4 + Math.random() * 5;
    for (let j = 0; j < n; j++) {
      x += (Math.random() - 0.5) * 180;
      y += (Math.random() - 0.5) * 180;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  // gum spots
  for (let i = 0; i < 40; i++) {
    g.fillStyle = `rgba(${200 + Math.random() * 40},${190 + Math.random() * 40},${190 + Math.random() * 40},0.35)`;
    g.beginPath();
    g.ellipse(Math.random() * S, Math.random() * S, 2 + Math.random() * 3, 1.5 + Math.random() * 2, Math.random() * 3, 0, 7);
    g.fill();
  }

  // painted lines — weathered red, hand-rolled
  const line = (x1: number, z1: number, x2: number, z2: number, w = 0.075) => {
    g.strokeStyle = "rgba(214,69,65,0.9)";
    g.lineWidth = (w / 9) * S;
    g.lineCap = "butt";
    g.beginPath();
    g.moveTo(P(x1), P(z1));
    g.lineTo(P(x2), P(z2));
    g.stroke();
    // worn overlay
    g.strokeStyle = "rgba(236,120,110,0.35)";
    g.lineWidth = (w / 9) * S * 0.45;
    g.beginPath();
    g.moveTo(P(x1) + 1.5, P(z1) - 1);
    g.lineTo(P(x2) + 1.5, P(z2) - 1);
    g.stroke();
  };
  line(-4, -4, 4, -4);
  line(-4, 4, 4, 4);
  line(-4, -4, -4, 4);
  line(4, -4, 4, 4);
  line(-4, 0, 4, 0);
  line(0, -4, 0, 4);

  // center medallion, quartered in squad colours
  const meds: [string, number, number][] = [
    ["#4f8ef7", Math.PI, Math.PI * 1.5],
    ["#f7b32b", Math.PI * 1.5, Math.PI * 2],
    ["#39b46a", Math.PI * 0.5, Math.PI],
    ["#e2483d", 0, Math.PI * 0.5],
  ];
  g.globalAlpha = 0.8;
  meds.forEach(([col, a0, a1]) => {
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(P(0), P(0));
    g.arc(P(0), P(0), (0.42 / 9) * S, a0, a1);
    g.closePath();
    g.fill();
  });
  g.globalAlpha = 1;
  g.strokeStyle = "rgba(245,242,230,0.9)";
  g.lineWidth = 5;
  g.beginPath();
  g.arc(P(0), P(0), (0.42 / 9) * S, 0, 7);
  g.stroke();

  // quadrant numbers, each facing its own square
  const nums: [number, number, number][] = [
    [1, -2, -2],
    [2, 2, -2],
    [3, -2, 2],
    [4, 2, 2],
  ];
  nums.forEach(([n, mx, mz]) => {
    const outX = Math.sign(mx) * 0.7071;
    const outZ = Math.sign(mz) * 0.7071;
    const theta = Math.atan2(outX, -outZ);
    g.save();
    g.translate(P(mx), P(mz));
    g.rotate(theta);
    g.font = `900 ${S * 0.16}px "Arial Black", system-ui, sans-serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillStyle = "rgba(30,32,36,0.35)";
    g.fillText(String(n), 5, 7);
    g.fillStyle = "rgba(246,243,233,0.88)";
    g.fillText(String(n), 0, 0);
    g.restore();
  });

  // chalk doodles
  g.strokeStyle = "rgba(250,250,252,0.5)";
  g.lineWidth = 3;
  // star in square 2 corner
  g.save();
  g.translate(P(3.2), P(-3.2));
  g.beginPath();
  for (let i = 0; i <= 10; i++) {
    const r = i % 2 === 0 ? 26 : 11;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    g[i === 0 ? "moveTo" : "lineTo"](Math.cos(a) * r, Math.sin(a) * r);
  }
  g.closePath();
  g.stroke();
  g.restore();
  // squiggle
  g.beginPath();
  g.moveTo(P(-3.6), P(3.1));
  for (let i = 1; i <= 8; i++) g.lineTo(P(-3.6) + i * 14, P(3.1) + (i % 2 ? -9 : 9));
  g.stroke();
  g.font = `700 ${S * 0.028}px "Comic Sans MS", cursive`;
  g.fillStyle = "rgba(255,255,255,0.4)";
  g.fillText("recess royale!!", P(-3.5), P(3.55));
  g.fillStyle = "rgba(120,220,255,0.35)";
  g.font = `700 ${S * 0.024}px "Comic Sans MS", cursive`;
  g.fillText("ADA smells like rust →", P(0.4), P(1.6));

  return tex(c);
}

// ── surrounding blacktop ────────────────────────────────────────
export function makeAsphaltTexture(): THREE.CanvasTexture {
  const S = 512;
  const c = canvas(S, S);
  const g = c.getContext("2d")!;
  g.fillStyle = "#5c6066";
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 2600; i++) {
    const v = 80 + Math.random() * 50;
    g.fillStyle = `rgba(${v},${v},${v + 5},0.2)`;
    g.fillRect(Math.random() * S, Math.random() * S, 2, 2);
  }
  for (let i = 0; i < 5; i++) {
    const x = Math.random() * S, y = Math.random() * S, r = 40 + Math.random() * 80;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, "rgba(40,42,46,0.18)");
    gr.addColorStop(1, "rgba(40,42,46,0)");
    g.fillStyle = gr;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // faded painted kickball arc + chalk hopscotch hint
  g.strokeStyle = "rgba(230,230,235,0.13)";
  g.lineWidth = 10;
  g.beginPath();
  g.arc(-60, S + 40, S * 0.9, -Math.PI / 2.4, -Math.PI / 6);
  g.stroke();
  return tex(c, [6, 6]);
}

export function makeGrassTexture(): THREE.CanvasTexture {
  const S = 256;
  const c = canvas(S, S);
  const g = c.getContext("2d")!;
  g.fillStyle = "#5d8f46";
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 8; i++) {
    g.fillStyle = i % 2 ? "rgba(105,155,80,0.5)" : "rgba(80,125,62,0.5)";
    g.fillRect((i / 8) * S, 0, S / 8, S);
  }
  for (let i = 0; i < 1400; i++) {
    g.fillStyle = `rgba(${60 + Math.random() * 60},${110 + Math.random() * 60},${50 + Math.random() * 40},0.5)`;
    g.fillRect(Math.random() * S, Math.random() * S, 1.6, 3);
  }
  return tex(c, [10, 10]);
}

// ── school building brick ───────────────────────────────────────
export function makeBrickTexture(): THREE.CanvasTexture {
  const W = 512, H = 256;
  const c = canvas(W, H);
  const g = c.getContext("2d")!;
  g.fillStyle = "#c9b8a4";
  g.fillRect(0, 0, W, H);
  const bw = 42, bh = 18;
  for (let row = 0; row * bh < H; row++) {
    const off = row % 2 ? bw / 2 : 0;
    for (let col = -1; col * bw < W + bw; col++) {
      const shade = 0.85 + Math.random() * 0.3;
      g.fillStyle = `rgb(${Math.round(148 * shade)},${Math.round(74 * shade)},${Math.round(58 * shade)})`;
      g.fillRect(col * bw + off + 1.5, row * bh + 1.5, bw - 3, bh - 3);
    }
  }
  // grime
  for (let i = 0; i < 40; i++) {
    g.fillStyle = `rgba(40,30,28,${Math.random() * 0.08})`;
    g.fillRect(Math.random() * W, Math.random() * H, 30 + Math.random() * 60, 6 + Math.random() * 16);
  }
  return tex(c, [4, 2]);
}

export function makeSignTexture(): THREE.CanvasTexture {
  const c = canvas(1024, 192);
  const g = c.getContext("2d")!;
  g.fillStyle = "#1c2f52";
  g.fillRect(0, 0, 1024, 192);
  g.strokeStyle = "#e8b93c";
  g.lineWidth = 10;
  g.strokeRect(10, 10, 1004, 172);
  g.fillStyle = "#f4f1e8";
  g.font = '900 84px "Arial Black", system-ui, sans-serif';
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("🦅 FALCON ELEMENTARY", 512, 104);
  return tex(c);
}

// ── chain-link fence (transparent) ──────────────────────────────
export function makeChainlinkTexture(): THREE.CanvasTexture {
  const S = 128;
  const c = canvas(S, S);
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, S, S);
  g.lineWidth = 4;
  for (let i = -S; i < S * 2; i += 22) {
    g.strokeStyle = "rgba(168,178,188,0.85)";
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i + S, S);
    g.stroke();
    g.beginPath();
    g.moveTo(i + S, 0);
    g.lineTo(i, S);
    g.stroke();
  }
  g.lineWidth = 1.5;
  g.strokeStyle = "rgba(230,238,246,0.5)";
  for (let i = -S; i < S * 2; i += 22) {
    g.beginPath();
    g.moveTo(i + 1, 0);
    g.lineTo(i + S + 1, S);
    g.stroke();
  }
  return tex(c, [7, 1.4]);
}

// ── the red four-square ball ────────────────────────────────────
export function makeBallTexture(): THREE.CanvasTexture {
  const S = 256;
  const c = canvas(S, S);
  const g = c.getContext("2d")!;
  const gr = g.createLinearGradient(0, 0, S, S);
  gr.addColorStop(0, "#ef5a48");
  gr.addColorStop(0.5, "#d8342c");
  gr.addColorStop(1, "#a01f1c");
  g.fillStyle = gr;
  g.fillRect(0, 0, S, S);
  // rubber grain
  for (let i = 0; i < 900; i++) {
    g.fillStyle = `rgba(${Math.random() > 0.5 ? 255 : 60},${20},${20},0.06)`;
    g.fillRect(Math.random() * S, Math.random() * S, 2, 2);
  }
  g.strokeStyle = "rgba(255,248,238,0.9)";
  g.lineWidth = 7;
  g.beginPath();
  g.moveTo(0, S / 2);
  g.bezierCurveTo(S * 0.3, S * 0.2, S * 0.7, S * 0.8, S, S / 2);
  g.stroke();
  g.beginPath();
  g.moveTo(S / 2, 0);
  g.bezierCurveTo(S * 0.2, S * 0.3, S * 0.8, S * 0.7, S / 2, S);
  g.stroke();
  g.font = '900 40px "Arial Black", sans-serif';
  g.fillStyle = "rgba(255,250,240,0.85)";
  g.textAlign = "center";
  g.fillText("4S", S * 0.24, S * 0.3);
  return tex(c);
}

// ── name tag sprite ─────────────────────────────────────────────
// Simple pill: coloured left bar + name (bold, white) + role (small, muted)
export function makeNameTag(name: string, color: string, label: string, isKing: boolean, _isPlayer: boolean): THREE.CanvasTexture {
  const W = 220, H = 56;
  const c = canvas(W, H);
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, W, H);

  // Dark pill background
  g.fillStyle = "rgba(12,16,24,0.82)";
  rr(g, 0, 0, W, H, 14);
  g.fill();

  // Left colour accent bar (simple — canvas clips to the pill path)
  g.save();
  rr(g, 0, 0, W, H, 14);
  g.clip();
  g.fillStyle = color;
  g.fillRect(0, 0, 8, H);
  g.restore();

  // Crown (king badge) on the right
  if (isKing) {
    g.font = "22px sans-serif";
    g.textBaseline = "middle";
    g.fillText("👑", W - 24, H * 0.38);
  }

  // Name — large, white
  g.fillStyle = "#ffffff";
  g.font = '700 26px "Arial Black", system-ui, sans-serif';
  g.textAlign = "left";
  g.textBaseline = "middle";
  g.fillText(name, 18, H * 0.37);

  // Role — small, muted colour
  g.fillStyle = color;
  g.font = "600 14px system-ui, sans-serif";
  g.fillText(label.toUpperCase(), 18, H * 0.72);

  return tex(c);
}

function rr(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

// ── bot LED face (redrawn live) ─────────────────────────────────
export function drawFace(cv: HTMLCanvasElement, state: FaceState, screen: string, accent: string) {
  const g = cv.getContext("2d")!;
  const W = cv.width, H = cv.height;
  g.fillStyle = screen;
  g.fillRect(0, 0, W, H);
  // subtle scanlines
  g.fillStyle = "rgba(255,255,255,0.03)";
  for (let y = 0; y < H; y += 4) g.fillRect(0, y, W, 1.5);
  g.fillStyle = accent;
  g.shadowColor = accent;
  g.shadowBlur = 10;
  const ex = W * 0.3, ex2 = W * 0.7, ey = H * 0.4;
  const drawEyes = () => {
    switch (state) {
      case "idle":
        g.fillRect(ex - 9, ey - 11, 18, 22);
        g.fillRect(ex2 - 9, ey - 11, 18, 22);
        break;
      case "alert":
        g.beginPath();
        g.arc(ex, ey, 14, 0, 7);
        g.arc(ex2, ey, 14, 0, 7);
        g.fill();
        g.font = "900 30px sans-serif";
        g.textAlign = "center";
        g.fillText("!", W / 2, H * 0.2);
        break;
      case "hit":
        g.save();
        g.lineWidth = 7;
        g.strokeStyle = accent;
        g.beginPath();
        g.moveTo(ex - 12, ey - 8);
        g.lineTo(ex + 12, ey + 4);
        g.moveTo(ex2 + 12, ey - 8);
        g.lineTo(ex2 - 12, ey + 4);
        g.stroke();
        g.restore();
        break;
      case "out":
        g.save();
        g.lineWidth = 6;
        g.strokeStyle = accent;
        [ex, ex2].forEach((x) => {
          g.beginPath();
          g.moveTo(x - 10, ey - 10);
          g.lineTo(x + 10, ey + 10);
          g.moveTo(x + 10, ey - 10);
          g.lineTo(x - 10, ey + 10);
          g.stroke();
        });
        g.restore();
        break;
      case "happy":
        g.beginPath();
        g.arc(ex, ey, 12, Math.PI, 0);
        g.arc(ex2, ey, 12, Math.PI, 0);
        g.fill();
        break;
      case "serve":
        g.fillRect(ex - 12, ey - 4, 24, 8);
        g.fillRect(ex2 - 12, ey - 4, 24, 8);
        break;
    }
  };
  drawEyes();
  // mouth
  g.beginPath();
  if (state === "happy") g.arc(W / 2, H * 0.62, 16, 0, Math.PI);
  else if (state === "out") g.arc(W / 2, H * 0.78, 14, Math.PI, 0);
  else if (state === "alert") g.arc(W / 2, H * 0.7, 9, 0, 7);
  else g.rect(W / 2 - 16, H * 0.68, 32, 6);
  g.fill();
  g.shadowBlur = 0;
}

// ── gaga pit wood floor ────────────────────────────────────────
export function makeWoodPitTexture(): THREE.CanvasTexture {
  const S = 1024;
  const c = canvas(S, S);
  const g = c.getContext("2d")!;
  g.fillStyle = "#8a5a33";
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 26; i++) {
    g.fillStyle = i % 2 ? "rgba(120,72,38,0.35)" : "rgba(160,110,64,0.35)";
    g.fillRect(0, (i / 26) * S, S, S / 26 - 4);
  }
  for (let i = 0; i < 1800; i++) {
    g.fillStyle = `rgba(${60 + Math.random() * 60},${40 + Math.random() * 40},${20 + Math.random() * 25},0.3)`;
    g.fillRect(Math.random() * S, Math.random() * S, 2, 3);
  }
  g.strokeStyle = "rgba(240,220,190,0.5)";
  g.lineWidth = 10;
  g.beginPath();
  g.arc(S / 2, S / 2, S * 0.32, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = "rgba(240,220,190,0.34)";
  g.font = '900 120px "Arial Black", system-ui';
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("GA!", S / 2, S / 2);
  return tex(c);
}

// ── dodgeball court blacktop ───────────────────────────────────
export function makeDodgeCourtTexture(): THREE.CanvasTexture {
  const W = 1024, H = 1024;
  const c = canvas(W, H);
  const g = c.getContext("2d")!;
  const P = (m: number) => ((m + 6.4) / 12.8) * W; // meters → px
  g.fillStyle = "#7b8087";
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 5000; i++) {
    const v = 100 + Math.random() * 52;
    g.fillStyle = `rgba(${v},${v + 2},${v + 7},${0.14 + Math.random() * 0.13})`;
    g.fillRect(Math.random() * W, Math.random() * H, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
  for (let i = 0; i < 9; i++) {
    const x = Math.random() * W, y = Math.random() * H, r = 40 + Math.random() * 100;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(50,52,58,${0.09 + Math.random() * 0.12})`);
    gr.addColorStop(1, "rgba(50,52,58,0)");
    g.fillStyle = gr;
    g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  }
  g.strokeStyle = "rgba(236,196,74,0.9)";
  g.lineWidth = 9;
  g.strokeRect(P(-5.6), P(-6.4), P(11.2), P(12.8));
  g.lineWidth = 6;
  g.beginPath();
  g.moveTo(P(-5.6), P(0));
  g.lineTo(P(5.6), P(0));
  g.stroke();
  g.fillStyle = "rgba(245,240,225,0.28)";
  g.font = '700 30px "Comic Sans MS", cursive';
  g.textAlign = "center";
  g.fillText("YOUR SIDE", P(0), P(-5.4));
  g.fillStyle = "rgba(255,140,90,0.3)";
  g.fillText("THEIR SIDE", P(0), P(5.4));
  return tex(c);
}

// ── hit burst star ──────────────────────────────────────────────
export function makeBurstTexture(): THREE.CanvasTexture {
  const S = 128;
  const c = canvas(S, S);
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, S, S);
  g.fillStyle = "#fff";
  g.beginPath();
  for (let i = 0; i <= 16; i++) {
    const r = i % 2 === 0 ? 60 : 20;
    const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
    g[i === 0 ? "moveTo" : "lineTo"](64 + Math.cos(a) * r, 64 + Math.sin(a) * r);
  }
  g.closePath();
  g.fill();
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 62);
  gr.addColorStop(0, "rgba(255,255,255,0.9)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  g.globalCompositeOperation = "destination-in";
  g.fillStyle = gr;
  g.fillRect(0, 0, S, S);
  return tex(c);
}
