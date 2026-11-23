// art-bg.js — the Skyline Runner's backdrops: three themed chapters, each a stack of parallax layers painted once into
// cached tiles (procedural Canvas 2D, no images), plus drifting clouds and a few ambient motes drawn per frame.
// Palettes are blues, greens, golds and coral. No purple, violet or magenta anywhere.
export const THEMES = Object.freeze({
  library: {
    key: "library",
    name: ["Cloud Library", "Biblioteca de las Nubes"],
    sky: ["#4f9fe8", "#9ad0ff", "#ffe6a6"],
    far: "#a9cdf0", mid: "#7fb0dc", near: "#5f95c8",
    top: "#f3dfae", side: "#c9a35f", under: "#8a6a3a", trim: "#e2a72e", deco: ["#c2410c", "#1f4fd8", "#15803d", "#e2a72e"],
    glow: "#ffd36b", hazard: "#14233f", motes: "#ffffff",
  },
  gardens: {
    key: "gardens",
    name: ["Grammar Gardens", "Jardines de la Gramática"],
    sky: ["#3fb8c4", "#a0e8cf", "#fff0b8"],
    far: "#a9dcc4", mid: "#79c6a4", near: "#4fae88",
    top: "#4fbf5f", side: "#2f8f47", under: "#6b4f2e", trim: "#f4c542", deco: ["#e8603c", "#f4c542", "#ffffff", "#1f9fb0"],
    glow: "#b8ff9a", hazard: "#2f6b2a", motes: "#fff6c8",
  },
  skyline: {
    key: "skyline",
    name: ["The Syntax Skyline", "El Horizonte de la Sintaxis"],
    sky: ["#16357f", "#3f8fe0", "#ffbf80"],
    far: "#2b5aa8", mid: "#1d4690", near: "#143572",
    top: "#cfe6f7", side: "#6fa4d6", under: "#2c4a78", trim: "#5fe0e8", deco: ["#5fe0e8", "#ffd36b", "#ff8a5c", "#ffffff"],
    glow: "#7ff4ff", hazard: "#ffd36b", motes: "#bff6ff",
  },
});
export const themeOf = (chapter) => THEMES[["library", "gardens", "skyline"][chapter - 1]] || THEMES.library;

export const TILE_W = 960;
export const TILE_H = 420;
const Q = 1.25; // tile resolution relative to world px
export const FACTORS = Object.freeze([0.06, 0.16, 0.34, 0.6]);

const seeded = (seed) => {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

export function cloud(ctx, x, y, s, color = "#fff", alpha = 1) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  for (const [dx, dy, rx, ry] of [[0, 0, 46, 16], [-26, 4, 28, 13], [30, 3, 32, 14], [4, -14, 26, 15]]) {
    ctx.moveTo(x + (dx + rx) * s, y + dy * s);
    ctx.ellipse(x + dx * s, y + dy * s, rx * s, ry * s, 0, 0, 7);
  }
  ctx.fill();
  ctx.globalAlpha = 1;
}

/** A small floating rock island: the base shape every theme builds on. */
function rock(ctx, x, y, w, h, top, under) {
  ctx.fillStyle = under;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.quadraticCurveTo(x + w * 0.8, y + h, x + w * 0.5, y + h * 1.5);
  ctx.quadraticCurveTo(x + w * 0.2, y + h, x, y);
  ctx.fill();
  ctx.fillStyle = top;
  ctx.fillRect(x - 2, y - 5, w + 4, 8);
}

const DECOR = {
  library(ctx, x, y, w, rnd, T) {
    const n = Math.max(3, Math.floor(w / 14));
    for (let i = 0; i < n; i += 1) {
      const bh = 22 + rnd() * 30;
      ctx.fillStyle = T.deco[Math.floor(rnd() * 4)];
      ctx.fillRect(x + 8 + i * ((w - 16) / n), y - bh, (w - 16) / n - 2, bh);
    }
    const r = Math.min(w / 2 - 6, 28);
    ctx.fillStyle = T.trim;
    ctx.fillRect(x + w / 2 - r - 4, y - 60, 2 * r + 8, 5);
    ctx.beginPath();
    ctx.arc(x + w / 2, y - 60, r, Math.PI, 0);
    ctx.fill();
  },
  gardens(ctx, x, y, w, rnd, T) {
    for (let i = 0; i < 3; i += 1) {
      const cx = x + 14 + (i * (w - 28)) / 2;
      ctx.fillStyle = "#6b4f2e";
      ctx.fillRect(cx - 2, y - 14, 4, 14);
      ctx.fillStyle = i % 2 ? "#2f9e4f" : "#3fbf62";
      ctx.beginPath();
      ctx.arc(cx, y - 26, 16 + rnd() * 8, 0, 7);
      ctx.fill();
      ctx.fillStyle = T.deco[Math.floor(rnd() * 4)];
      for (let k = 0; k < 4; k += 1) ctx.fillRect(cx - 12 + rnd() * 24, y - 36 + rnd() * 18, 3, 3);
    }
  },
  skyline(ctx, x, y, w, rnd, T) {
    const h = 70 + rnd() * 110;
    ctx.fillStyle = T.side;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.2, y);
    ctx.lineTo(x + w * 0.3, y - h);
    ctx.lineTo(x + w * 0.7, y - h * 0.9);
    ctx.lineTo(x + w * 0.8, y);
    ctx.fill();
    for (let r = 0; r < h / 14 - 1; r += 1)
      for (let c = 0; c < 4; c += 1)
        if (rnd() > 0.35) {
          ctx.fillStyle = rnd() > 0.5 ? T.deco[1] : T.deco[0];
          ctx.fillRect(x + w * 0.3 + c * (w * 0.1), y - h + 8 + r * 14, 5, 6);
        }
    ctx.fillStyle = T.deco[0];
    ctx.fillRect(x + w * 0.5 - 1, y - h - 16, 2, 16);
  },
};

function paintLayer(ctx, T, layer) {
  const rnd = seeded(T.key.length * 131 + layer * 17 + 3);
  const decorate = DECOR[T.key];
  if (layer === 0) {
    // distant haze islands, almost sky-colored
    for (let i = 0; i < 6; i += 1) rock(ctx, 40 + i * 160 + rnd() * 50, 130 + rnd() * 160, 70 + rnd() * 60, 18 + rnd() * 14, T.far, T.far);
    return;
  }
  const count = layer === 1 ? 5 : 4;
  for (let i = 0; i < count; i += 1) {
    const w = (layer === 1 ? 80 : 120) + rnd() * 70;
    const x = (i * TILE_W) / count + rnd() * 50;
    const y = (layer === 1 ? 190 : 250) + rnd() * 90;
    ctx.globalAlpha = layer === 1 ? 0.7 : 0.9;
    rock(ctx, x, y, w, 26 + rnd() * 20, layer === 1 ? T.mid : T.near, layer === 1 ? T.mid : T.near);
    ctx.save();
    if (layer === 1) ctx.globalAlpha = 0.55;
    decorate(ctx, x, y - 4, w, rnd, T);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  if (layer === 2) {
    ctx.strokeStyle = T.glow;
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i += 1) {
      const x = 90 + i * 300 + rnd() * 80;
      ctx.beginPath();
      ctx.moveTo(x, 300 + rnd() * 50);
      ctx.quadraticCurveTo(x + 90, 330 + rnd() * 40, x + 190, 300 + rnd() * 50);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

function paintClouds(ctx, T) {
  const rnd = seeded(77 + T.key.length);
  // a sea of cloud along the bottom of the view, a few small wisps higher up
  for (let i = 0; i < 8; i += 1) cloud(ctx, 40 + i * 125 + rnd() * 40, 300 + rnd() * 100, 1.2 + rnd() * 1.1, "#ffffff", 0.75 + rnd() * 0.2);
  for (let i = 0; i < 3; i += 1) cloud(ctx, 100 + i * 330 + rnd() * 90, 50 + rnd() * 90, 0.6 + rnd() * 0.4, "#ffffff", 0.35 + rnd() * 0.2);
}

/** The sky: a gradient sprite and a soft sun/moon glow. */
function paintSky(ctx, T, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, T.sky[0]);
  g.addColorStop(0.6, T.sky[1]);
  g.addColorStop(1, T.sky[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}
function paintSun(ctx, T, w) {
  const r = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
  r.addColorStop(0, T.key === "skyline" ? "rgba(255,226,170,.95)" : "rgba(255,244,196,.95)");
  r.addColorStop(0.35, "rgba(255,230,160,.35)");
  r.addColorStop(1, "rgba(255,230,160,0)");
  ctx.fillStyle = r;
  ctx.fillRect(0, 0, w, w);
}

/** Draw the whole backdrop. `cam` is world px; `s` is canvas px per world px; `quality` limits the layer count. */
export function drawBackground(ctx, cache, T, { w, h, s, cam, t, layers = 4, drift = true, still = false }) {
  const sky = cache.get(`od:sky:${T.key}`, 4, 256, (c, cw, ch) => paintSky(c, T, cw, ch));
  ctx.drawImage(sky, 0, 0, w, h);
  const sun = cache.get(`od:sun:${T.key}`, 256, 256, (c, sw) => paintSun(c, T, sw));
  const sunR = Math.max(w, h) * 0.32;
  ctx.drawImage(sun, w * 0.72 - sunR - (still ? 0 : cam.x * 0.01), h * 0.28 - sunR, sunR * 2, sunR * 2);
  const order = layers >= 4 ? [0, 1, 2, 3] : layers === 3 ? [0, 1, 3] : [1, 3];
  const th = TILE_H * s;
  const tw = TILE_W * s;
  for (const i of order) {
    const f = still ? 0 : FACTORS[i];
    const near = i === 3;
    const key = `od:L${i}:${T.key}`;
    const img = cache.get(key, Math.round(TILE_W * Q), Math.round(TILE_H * Q), (c) => {
      c.scale(Q, Q);
      if (near) paintClouds(c, T);
      else paintLayer(c, T, i);
    });
    const dx = -cam.x * f * s - (near && drift && !still ? t * 9 * s : 0);
    const oy = h - th + (cam.y - 340) * -0.05 * (i + 1) * s * (still ? 0 : 1) - (near ? 24 * s : 0);
    let x = ((dx % tw) + tw) % tw;
    x -= tw;
    for (; x < w; x += tw) ctx.drawImage(img, x, oy, tw, th);
  }
}

/** Ambient motes (pages, petals, sparks): a handful of points whose positions are pure functions of time. */
export function drawMotes(ctx, T, { w, h, t, count }) {
  ctx.fillStyle = T.motes;
  for (let i = 0; i < count; i += 1) {
    const sp = 14 + (i % 5) * 7;
    const x = (((i * 197 + t * sp) % (w + 40)) + w + 40) % (w + 40) - 20;
    const y = (h * ((i * 53) % 100)) / 100 + Math.sin(t * 0.8 + i) * 12;
    ctx.globalAlpha = 0.35 + 0.35 * Math.sin(t + i);
    ctx.fillRect(x, y, T.key === "library" ? 7 : 4, T.key === "library" ? 4 : 4);
  }
  ctx.globalAlpha = 1;
}
