export interface WallpaperPalette {
  bg: string;
  accent: string;
  particle: string;
  constellation: string;
  orbA: string;
  orbB: string;
  orbC: string;
  grid: string;
}

export interface Wallpaper {
  id: string;
  name: string;
  tagline: string;
  palette: WallpaperPalette;
  draw(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, seed: number): void;
}

export const WALLPAPER_STORAGE_KEY = "aura.wallpaper";

function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let x = Math.imul(s ^ (s >>> 15), 1 | s);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function fillGradient(
  ctx: CanvasRenderingContext2D,
  stops: Array<[number, string]>,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  w?: number,
  h?: number,
) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  ctx.fillStyle = g;
  const canvasW = typeof ctx.canvas?.width === "number" ? ctx.canvas.width : 0;
  const canvasH = typeof ctx.canvas?.height === "number" ? ctx.canvas.height : 0;
  const width = Math.max(w ?? 0, Math.abs(x1 - x0), canvasW, 1);
  const height = Math.max(h ?? 0, Math.abs(y1 - y0), canvasH, 1);
  ctx.fillRect(x0, y0, width, height);
}

function drawAurora(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, seed: number) {
  fillGradient(
    ctx,
    [
      [0, "#030714"],
      [0.55, "#08142b"],
      [1, "#0b0f22"],
    ],
    0,
    0,
    0,
    h,
    w,
    h,
  );
  const rand = rng(seed);

  // Subtle zenith polar glow
  const crown = ctx.createRadialGradient(w * 0.45, h * 0.18, 12, w * 0.45, h * 0.18, Math.max(w, h) * 0.65);
  crown.addColorStop(0, "rgba(16, 185, 129, 0.16)");
  crown.addColorStop(0.5, "rgba(34, 211, 238, 0.08)");
  crown.addColorStop(1, "rgba(34, 211, 238, 0)");
  ctx.fillStyle = crown;
  ctx.fillRect(0, 0, w, h);

  // Delicate high-altitude starlight
  ctx.fillStyle = "rgba(210, 245, 255, 0.65)";
  for (let i = 0; i < 65; i++) {
    const sx = rand() * w;
    const sy = rand() * h * 0.65;
    const twinkle = 0.25 + 0.65 * ((Math.sin(t * 1.1 + i * 1.7) + 1) / 2);
    ctx.globalAlpha = twinkle * 0.5;
    ctx.beginPath();
    ctx.arc(sx, sy, rand() * 1.1 + 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Shimmering Borealis silk curtains using smooth Bezier ribbons
  const bands = [
    { hue: 162, yFrac: 0.28, amp: 0.08, thick: 0.16, speed: 0.28, alpha: 0.16 },
    { hue: 188, yFrac: 0.36, amp: 0.1, thick: 0.2, speed: 0.22, alpha: 0.14 },
    { hue: 262, yFrac: 0.45, amp: 0.07, thick: 0.15, speed: 0.18, alpha: 0.11 },
  ];

  bands.forEach((b, idx) => {
    const base = h * b.yFrac;
    const phase = t * b.speed + idx * 1.9 + rand() * 3;
    const grad = ctx.createLinearGradient(0, base - h * b.thick, 0, base + h * b.thick);
    grad.addColorStop(0, `hsla(${b.hue}, 92%, 62%, 0)`);
    grad.addColorStop(0.45, `hsla(${b.hue}, 92%, 62%, ${b.alpha})`);
    grad.addColorStop(0.7, `hsla(${b.hue + 24}, 88%, 58%, ${b.alpha * 0.7})`);
    grad.addColorStop(1, `hsla(${b.hue + 32}, 85%, 55%, 0)`);
    ctx.fillStyle = grad;

    const dy1 = Math.sin(phase) * h * b.amp;
    const dy2 = Math.cos(phase * 0.85 + 1.4) * h * b.amp;
    const dy3 = Math.sin(phase * 1.1 + 2.8) * h * b.amp;
    const bandH = h * b.thick;

    ctx.beginPath();
    ctx.moveTo(0, base + dy1);
    ctx.bezierCurveTo(w * 0.3, base - bandH * 0.4 + dy2, w * 0.7, base + bandH * 0.35 + dy3, w, base - dy1 * 0.7);
    ctx.lineTo(w, base + bandH + dy2 * 0.5);
    ctx.bezierCurveTo(w * 0.65, base + bandH * 0.8 + dy3, w * 0.35, base + bandH * 1.15 + dy1, 0, base + bandH * 0.85 - dy2);
    ctx.closePath();
    ctx.fill();
  });
}

function drawDeepSpace(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, seed: number) {
  fillGradient(
    ctx,
    [
      [0, "#020209"],
      [0.6, "#060818"],
      [1, "#0b0b22"],
    ],
    0,
    0,
    0,
    h,
    w,
    h,
  );
  const rand = rng(seed);

  // Dual volumetric nebulae
  const nebulaA = ctx.createRadialGradient(w * 0.72, h * 0.28, 10, w * 0.72, h * 0.28, Math.max(w, h) * 0.55);
  nebulaA.addColorStop(0, "rgba(124, 58, 237, 0.20)");
  nebulaA.addColorStop(0.5, "rgba(79, 70, 229, 0.08)");
  nebulaA.addColorStop(1, "rgba(79, 70, 229, 0)");
  ctx.fillStyle = nebulaA;
  ctx.fillRect(0, 0, w, h);

  const nebulaB = ctx.createRadialGradient(w * 0.24, h * 0.68, 10, w * 0.24, h * 0.68, Math.max(w, h) * 0.5);
  nebulaB.addColorStop(0, "rgba(14, 165, 233, 0.14)");
  nebulaB.addColorStop(0.55, "rgba(168, 85, 247, 0.06)");
  nebulaB.addColorStop(1, "rgba(14, 165, 233, 0)");
  ctx.fillStyle = nebulaB;
  ctx.fillRect(0, 0, w, h);

  // Multi-hue starfield
  const colors = ["rgba(186, 230, 253, 0.95)", "rgba(199, 210, 254, 0.9)", "rgba(253, 230, 138, 0.75)"];
  for (let i = 0; i < 220; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const r = rand() * 1.35 + 0.25;
    const twinkle = (Math.sin(t * 1.5 + rand() * 9) + 1) / 2;
    ctx.fillStyle = colors[i % colors.length];
    ctx.globalAlpha = 0.22 + twinkle * 0.68;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawNeonGrid(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, seed: number) {
  fillGradient(
    ctx,
    [
      [0, "#050410"],
      [0.65, "#110722"],
      [1, "#180a2e"],
    ],
    0,
    0,
    0,
    h,
    w,
    h,
  );
  const horizon = h * 0.68;
  const vx = w / 2;
  const rand = rng(seed);
  const pulse = 0.5 + 0.5 * Math.sin(t * 0.75);

  // Horizon cyber bloom
  const sun = ctx.createRadialGradient(vx, horizon, 6, vx, horizon, Math.max(w, h) * 0.48);
  sun.addColorStop(0, `rgba(236, 72, 153, ${0.22 + pulse * 0.08})`);
  sun.addColorStop(0.45, `rgba(0, 240, 255, ${0.12 + pulse * 0.05})`);
  sun.addColorStop(1, "rgba(0, 240, 255, 0)");
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "rgba(0, 240, 255, 0.24)";
  ctx.lineWidth = 1;
  for (let i = -12; i <= 12; i++) {
    const jitter = (rand() - 0.5) * 0.04 * w;
    const xEnd = vx + i * (w / 12) * 1.45 + jitter;
    ctx.beginPath();
    ctx.moveTo(vx, horizon);
    ctx.lineTo(xEnd, h);
    ctx.stroke();
  }

  // Animated scrolling horizontal perspective slices
  const scroll = (t * 0.22) % 1;
  ctx.fillStyle = `rgba(0, 240, 255, ${0.12 + pulse * 0.1})`;
  for (let i = 0; i < 9; i++) {
    const p = ((i + scroll) / 9) % 1;
    const y = horizon + Math.pow(p, 2.2) * (h - horizon);
    ctx.fillRect(0, y, w, 1.5);
  }

  ctx.fillStyle = `rgba(244, 63, 94, ${0.3 + pulse * 0.18})`;
  ctx.fillRect(0, horizon - 1, w, 2.5);
}

function drawOcean(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, seed: number) {
  fillGradient(
    ctx,
    [
      [0, "#020b16"],
      [0.5, "#051d33"],
      [1, "#072c4a"],
    ],
    0,
    0,
    0,
    h,
    w,
    h,
  );
  const rand = rng(seed);

  // Soft surface solar caustic bloom
  const surfaceGlow = ctx.createRadialGradient(w * 0.5, 0, 10, w * 0.5, h * 0.1, Math.max(w, h) * 0.7);
  surfaceGlow.addColorStop(0, "rgba(56, 189, 248, 0.22)");
  surfaceGlow.addColorStop(0.5, "rgba(20, 184, 166, 0.10)");
  surfaceGlow.addColorStop(1, "rgba(2, 11, 22, 0)");
  ctx.fillStyle = surfaceGlow;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 5; i++) {
    const hue = 188 + i * 7 + Math.sin(t * 0.25 + i) * 6;
    const offset = rand() * 6.28;
    ctx.fillStyle = `hsla(${hue}, 82%, 48%, ${0.11 + i * 0.02})`;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += Math.max(12, Math.floor(w / 64))) {
      const y =
        h * (0.48 + i * 0.11) +
        Math.sin(x / (70 + i * 28) + t * (0.6 + i * 0.16) + offset) * (12 + i * 6) +
        Math.cos(x / 170 - t * 0.28 + i) * 16;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  }
}

function drawAxiomVoid(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, seed: number) {
  fillGradient(
    ctx,
    [
      [0, "#030308"],
      [0.6, "#070914"],
      [1, "#0d0b18"],
    ],
    0,
    0,
    0,
    h,
    w,
    h,
  );
  const rand = rng(seed);
  const paletteHues = [190, 42, 265];
  for (let i = 0; i < 8; i++) {
    const x = w * (0.2 + rand() * 0.6) + Math.sin(t * 0.11 + i * 1.7) * w * 0.12;
    const y = h * (0.2 + rand() * 0.6) + Math.cos(t * 0.09 + i * 2.1) * h * 0.12;
    const r = Math.min(w, h) * (0.14 + rand() * 0.22);
    const hue = paletteHues[i % paletteHues.length];
    const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
    glow.addColorStop(0, `hsla(${hue}, 85%, 60%, 0.085)`);
    glow.addColorStop(1, `hsla(${hue}, 85%, 60%, 0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // Subtle Sovereign identity orbital rings around center
  const cx = w * 0.5;
  const cy = h * 0.5;
  const baseRadius = Math.min(w, h) * 0.22;
  ctx.lineWidth = 1;
  for (let k = 0; k < 3; k++) {
    ctx.strokeStyle = k === 1 ? "rgba(251, 191, 36, 0.08)" : "rgba(34, 211, 238, 0.07)";
    ctx.beginPath();
    ctx.arc(cx, cy, baseRadius * (1 + k * 0.52), 0, Math.PI * 2);
    ctx.stroke();
  }
}

export const WALLPAPERS: Wallpaper[] = [
  {
    id: "aurora",
    name: "Aurora",
    tagline: "Polar emerald-cyan ribbons & Zenith starlight",
    palette: {
      bg: "#040814",
      accent: "#22d3ee",
      particle: "rgba(56, 240, 225, 0.45)",
      constellation: "rgba(34, 211, 238, 0.14)",
      orbA: "rgba(16, 185, 129, 0.22)",
      orbB: "rgba(34, 211, 238, 0.18)",
      orbC: "rgba(139, 92, 246, 0.16)",
      grid: "rgba(34, 211, 238, 0.04)",
    },
    draw: drawAurora,
  },
  {
    id: "deep-space",
    name: "Deep Space",
    tagline: "Volumetric obsidian nebula & multi-hue stars",
    palette: {
      bg: "#02030b",
      accent: "#818cf8",
      particle: "rgba(165, 180, 252, 0.48)",
      constellation: "rgba(129, 140, 248, 0.16)",
      orbA: "rgba(99, 102, 241, 0.22)",
      orbB: "rgba(192, 132, 252, 0.18)",
      orbC: "rgba(14, 165, 233, 0.14)",
      grid: "rgba(129, 140, 248, 0.035)",
    },
    draw: drawDeepSpace,
  },
  {
    id: "neon-grid",
    name: "Neon Grid",
    tagline: "Synthwave horizon & animated laser vectors",
    palette: {
      bg: "#070412",
      accent: "#00f0ff",
      particle: "rgba(0, 240, 255, 0.48)",
      constellation: "rgba(236, 72, 153, 0.15)",
      orbA: "rgba(0, 240, 255, 0.20)",
      orbB: "rgba(236, 72, 153, 0.20)",
      orbC: "rgba(139, 92, 246, 0.16)",
      grid: "rgba(0, 240, 255, 0.05)",
    },
    draw: drawNeonGrid,
  },
  {
    id: "ocean",
    name: "Ocean",
    tagline: "Bioluminescent abyssal swells & solar caustics",
    palette: {
      bg: "#020b16",
      accent: "#38bdf8",
      particle: "rgba(56, 189, 248, 0.45)",
      constellation: "rgba(20, 184, 166, 0.15)",
      orbA: "rgba(14, 165, 233, 0.22)",
      orbB: "rgba(20, 184, 166, 0.18)",
      orbC: "rgba(59, 130, 246, 0.15)",
      grid: "rgba(56, 189, 248, 0.038)",
    },
    draw: drawOcean,
  },
  {
    id: "axiom-void",
    name: "Axiom Void",
    tagline: "Sovereign obsidian, amber gold & orbital rings",
    palette: {
      bg: "#040409",
      accent: "#f59e0b",
      particle: "rgba(251, 191, 36, 0.42)",
      constellation: "rgba(34, 211, 238, 0.13)",
      orbA: "rgba(245, 158, 11, 0.16)",
      orbB: "rgba(6, 182, 212, 0.16)",
      orbC: "rgba(168, 85, 247, 0.14)",
      grid: "rgba(251, 191, 36, 0.032)",
    },
    draw: drawAxiomVoid,
  },
];

export function getWallpaper(id?: string | null): Wallpaper {
  if (id) {
    const found = WALLPAPERS.find((w) => w.id === id);
    if (found) return found;
  }
  return WALLPAPERS[0];
}
