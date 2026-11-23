// art-world.js — the Skyline Runner's foreground: islands, blocks, movers, energy bridges, hazards, shards, checkpoints,
// gate pylons, the exit ring and the guide arrows. Platform bodies are painted once into cached sprites; everything that
// animates (energy, shards, flags) is a handful of cheap shapes per frame. World coordinates, y down.
const S = 1.5; // sprite resolution
const PAD_X = 8;
const PAD_Y = 30;
const DASH = [10, 12];
const NO_DASH = [];

const hashN = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 4294967296);
};

function underside(c, w, h, T) {
  c.fillStyle = T.under;
  c.beginPath();
  c.moveTo(0, h - 2);
  c.lineTo(w, h - 2);
  const depth = Math.min(46, 16 + w * 0.12);
  c.lineTo(w * 0.86, h + depth * 0.55);
  c.lineTo(w * 0.66, h + depth * 0.8);
  c.lineTo(w * 0.5, h + depth);
  c.lineTo(w * 0.32, h + depth * 0.7);
  c.lineTo(w * 0.14, h + depth * 0.45);
  c.fill();
  c.fillStyle = T.side;
  c.fillRect(0, h * 0.45, w, h * 0.55 + 1);
}

const TOPPER = {
  library(c, w, h, T, r) {
    for (let x = 14; x < w - 20; x += 40 + r() * 40) {
      const n = 1 + Math.floor(r() * 3);
      for (let i = 0; i < n; i += 1) {
        c.fillStyle = T.deco[Math.floor(r() * 4)];
        c.fillRect(x, -5 - (i + 1) * 5, 15 + r() * 8, 5);
      }
    }
    c.fillStyle = T.trim;
    c.fillRect(0, h * 0.4, w, 2);
  },
  gardens(c, w, h, T, r) {
    c.fillStyle = "#2f9e4f";
    for (let x = 4; x < w - 4; x += 10) {
      c.beginPath();
      c.arc(x, 1, 5 + r() * 3, Math.PI, 0);
      c.fill();
    }
    for (let x = 20; x < w - 10; x += 36 + r() * 44) {
      c.fillStyle = T.deco[Math.floor(r() * 4)];
      c.fillRect(x, -9, 4, 4);
      c.fillStyle = "#2f9e4f";
      c.fillRect(x + 1, -5, 2, 6);
    }
  },
  skyline(c, w, h, T) {
    c.fillStyle = T.trim;
    for (let x = 8; x < w - 16; x += 22) c.fillRect(x, h * 0.35, 12, 3);
    c.fillStyle = "rgba(255,255,255,.55)";
    c.fillRect(0, 0, w, 3);
  },
};

function paintPlatform(c, kind, w, h, T) {
  const r = hashN(`${T.key}${kind}${w}${h}`);
  if (kind === "block") {
    c.fillStyle = T.side;
    c.fillRect(0, 0, w, h);
    c.fillStyle = T.top;
    c.fillRect(0, 0, w, 6);
    c.strokeStyle = T.under;
    c.lineWidth = 2;
    for (let y = 16; y < h; y += 16) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(w, y);
      c.stroke();
    }
    c.fillStyle = T.trim;
    c.fillRect(w / 2 - 3, h / 2 - 3, 6, 6);
    return;
  }
  if (kind === "mover") {
    c.fillStyle = T.under;
    c.fillRect(2, 8, w - 4, h - 4);
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(1, T.trim);
    c.fillStyle = g;
    c.beginPath();
    c.roundRect(0, 0, w, h - 4, 8);
    c.fill();
    c.fillStyle = T.under;
    for (let x = 12; x < w - 14; x += 18) c.fillRect(x, 6, 8, 3);
    return;
  }
  if (kind === "bonus") {
    c.fillStyle = "#e2a72e";
    c.beginPath();
    c.roundRect(0, 0, w, h - 8, 8);
    c.fill();
    c.fillStyle = "#fff3c4";
    c.fillRect(8, 2, w - 16, 3);
    return;
  }
  underside(c, w, h, T);
  c.fillStyle = T.top;
  c.beginPath();
  c.roundRect(0, 0, w, h * 0.55, 5);
  c.fill();
  c.save();
  TOPPER[T.key](c, w, h, T, r);
  c.restore();
  if (kind === "start" || kind === "gate" || kind === "exit") {
    c.fillStyle = T.trim;
    c.fillRect(0, 0, w, 4);
  }
}

function drawPlatforms(ctx, cache, T, plats, view, t) {
  for (const p of plats) {
    if (p.x + p.w < view.x0 - 20 || p.x > view.x1 + 20) continue;
    if (p.kind === "bridge") {
      drawBridge(ctx, T, p, t);
      continue;
    }
    if (p.kind === "pad") {
      drawPad(ctx, T, p, t);
      continue;
    }
    if (p.mv) {
      const m = p.mv;
      ctx.strokeStyle = T.glow;
      ctx.globalAlpha = 0.28;
      ctx.lineWidth = 2;
      ctx.setLineDash(DASH);
      ctx.beginPath();
      const cx = p.x0 + p.w / 2;
      const cy = p.y0 + p.h / 2;
      ctx.moveTo(cx, cy);
      if (m.axis === "x") ctx.lineTo(cx + m.range, cy);
      else ctx.lineTo(cx, cy + m.range);
      ctx.stroke();
      ctx.setLineDash(NO_DASH);
      ctx.globalAlpha = 1;
    }
    const key = `od:p:${T.key}:${p.kind}:${p.w}x${p.h}`;
    const sw = p.w + PAD_X * 2;
    const sh = p.h + PAD_Y + 60;
    const img = cache.get(key, Math.ceil(sw * S), Math.ceil(sh * S), (c) => {
      c.scale(S, S);
      c.translate(PAD_X, PAD_Y);
      paintPlatform(c, p.kind, p.w, p.h, T);
    });
    ctx.drawImage(img, p.x - PAD_X, p.y - PAD_Y, sw, sh);
  }
}

function drawBridge(ctx, T, p, t) {
  ctx.fillStyle = T.glow;
  ctx.globalAlpha = 0.28;
  ctx.fillRect(p.x, p.y - 4, p.w, p.h + 10);
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(p.x, p.y, p.w, 4);
  ctx.fillStyle = T.glow;
  ctx.fillRect(p.x, p.y + 4, p.w, p.h - 4);
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.setLineDash(DASH);
  ctx.lineDashOffset = -t * 30;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y + 9);
  ctx.lineTo(p.x + p.w, p.y + 9);
  ctx.stroke();
  ctx.setLineDash(NO_DASH);
  ctx.globalAlpha = 1;
}

function drawPad(ctx, T, p, t) {
  const pulse = 0.6 + 0.4 * Math.sin(t * 4 + p.x);
  ctx.fillStyle = T.glow;
  ctx.globalAlpha = 0.25 + 0.25 * pulse;
  ctx.beginPath();
  ctx.ellipse(p.x + p.w / 2, p.y + 6, p.w * 0.62, 12, 0, 0, 7);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(p.x, p.y, p.w, p.h, 8);
  ctx.fill();
  ctx.fillStyle = T.glow;
  ctx.fillRect(p.x + 6, p.y + 3, p.w - 12, 4);
}

const HAZARD = {
  ink(ctx, h, t, T) {
    ctx.fillStyle = T.hazard;
    ctx.beginPath();
    ctx.ellipse(h.x + h.w / 2, h.y + h.h - 5, h.w / 2 + 3, 9 + Math.sin(t * 3 + h.phase) * 2, 0, 0, 7);
    ctx.fill();
    ctx.fillRect(h.x + 6, h.y + 2 + Math.sin(t * 4) * 2, 5, h.h - 8);
    ctx.fillRect(h.x + 17, h.y + 6, 5, h.h - 12);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(h.x + 9, h.y + h.h - 9, 3, 3);
    ctx.fillRect(h.x + 17, h.y + h.h - 9, 3, 3);
  },
  bramble(ctx, h, t, T) {
    ctx.fillStyle = T.hazard;
    ctx.beginPath();
    ctx.ellipse(h.x + h.w / 2, h.y + h.h - 7, h.w / 2 + 2, 10, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#e8603c";
    for (let i = 0; i < 5; i += 1) {
      const x = h.x + 2 + i * 6;
      ctx.beginPath();
      ctx.moveTo(x, h.y + h.h - 6);
      ctx.lineTo(x + 3, h.y + 1 + Math.sin(t * 3 + i) * 1.5);
      ctx.lineTo(x + 6, h.y + h.h - 6);
      ctx.fill();
    }
  },
  zap(ctx, h, t, T) {
    const cx = h.x + h.w / 2;
    const cy = h.y + h.h / 2;
    ctx.strokeStyle = T.hazard;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * 6.283 + t * 3;
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * (13 + (i % 2) * 5), cy + Math.sin(a) * (13 + (i % 2) * 5));
    }
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, 7);
    ctx.fill();
    ctx.fillStyle = T.hazard;
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, 7);
    ctx.fill();
  },
};

function drawShards(ctx, shards, view, t) {
  for (const s of shards) {
    if (s.got || s.x < view.x0 - 20 || s.x > view.x1 + 20) continue;
    const sx = Math.cos(t * 3 + s.x * 0.05);
    const bob = Math.sin(t * 2 + s.x * 0.03) * 3;
    ctx.fillStyle = s.high ? "#ff8a5c" : "#ffcf4a";
    ctx.beginPath();
    ctx.moveTo(s.x, s.y - 11 + bob);
    ctx.lineTo(s.x + 8 * sx, s.y + bob);
    ctx.lineTo(s.x, s.y + 11 + bob);
    ctx.lineTo(s.x - 8 * sx, s.y + bob);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.75)";
    ctx.fillRect(s.x - 1, s.y - 8 + bob, 2, 8);
  }
}

function drawCheckpoints(ctx, T, level, t) {
  for (const c of level.seq.checkpoints) {
    const p = level.w.plats[c.plat];
    const on = level.cpActive.has(c.plat);
    const x = p.x + p.w / 2;
    ctx.fillStyle = "#e9e5d8";
    ctx.fillRect(x - 2, p.y - 46, 4, 46);
    ctx.fillStyle = on ? "#ffcf4a" : "#8fa6c4";
    const wave = Math.sin(t * 5) * (on ? 3 : 0.5);
    ctx.beginPath();
    ctx.moveTo(x + 2, p.y - 46);
    ctx.lineTo(x + 26 + wave, p.y - 38);
    ctx.lineTo(x + 2, p.y - 28);
    ctx.fill();
    if (on) {
      ctx.strokeStyle = T.glow;
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 3);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(x, p.y - 2, 20, 6, 0, 0, 7);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
}

function drawGates(ctx, T, level, t) {
  level.seq.gates.forEach((g, i) => {
    const kind = level.kinds[i];
    const live = level.pending === i;
    const pulse = 0.55 + 0.45 * Math.sin(t * 4);
    const pylon = (x, lit) => {
      ctx.fillStyle = T.under;
      ctx.fillRect(x - 6, g.y - 58, 12, 58);
      ctx.fillStyle = lit ? T.glow : "#9db4d2";
      ctx.beginPath();
      ctx.moveTo(x, g.y - 88);
      ctx.lineTo(x + 11, g.y - 66);
      ctx.lineTo(x, g.y - 52);
      ctx.lineTo(x - 11, g.y - 66);
      ctx.fill();
      if (lit) {
        ctx.globalAlpha = 0.35 * pulse + 0.15;
        ctx.beginPath();
        ctx.arc(x, g.y - 68, 22, 0, 7);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    };
    pylon(g.x0 - 18, Boolean(kind) || live);
    pylon(g.x1 + 18, Boolean(kind));
    if (!kind) {
      ctx.strokeStyle = "#9db4d2";
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 2;
      ctx.setLineDash(DASH);
      ctx.beginPath();
      ctx.moveTo(g.x0 - 18, g.y - 40);
      ctx.lineTo(g.x1 + 18, g.y - 40);
      ctx.stroke();
      ctx.setLineDash(NO_DASH);
      ctx.globalAlpha = 1;
    }
  });
}

function drawExit(ctx, T, level, t) {
  const e = level.seq.exit;
  const ready = level.kinds.every(Boolean);
  ctx.strokeStyle = ready ? "#ffcf4a" : "#9db4d2";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.ellipse(e.x, e.y - 46, 26, 46, 0, 0, 7);
  ctx.stroke();
  ctx.strokeStyle = ready ? "#ffffff" : "#c9d6e8";
  ctx.lineWidth = 2;
  ctx.setLineDash(DASH);
  ctx.lineDashOffset = -t * 40;
  ctx.beginPath();
  ctx.ellipse(e.x, e.y - 46, 17, 36, 0, 0, 7);
  ctx.stroke();
  ctx.setLineDash(NO_DASH);
}

function drawGuides(ctx, T, guides, view, t) {
  ctx.fillStyle = T.glow;
  ctx.strokeStyle = T.glow;
  for (const g of guides) {
    if (g.x < view.x0 - 40 || g.x > view.x1 + 40) continue;
    const bob = Math.sin(t * 4 + g.x) * 4;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y + bob);
    ctx.lineTo(g.x + 20, g.y + 12 + bob);
    ctx.lineTo(g.x, g.y + 24 + bob);
    ctx.lineTo(g.x + 5, g.y + 12 + bob);
    ctx.fill();
    ctx.globalAlpha = 0.45;
    for (let k = 1; k <= 6; k += 1) {
      const u = k / 7;
      const x = g.x + 12 + (g.tx - g.x - 12) * u;
      const y = g.y + 74 + (g.ty - g.y - 74) * u - Math.sin(u * Math.PI) * 52;
      ctx.fillRect(x - 2, y - 2, 4, 4);
    }
  }
  ctx.globalAlpha = 1;
}

/** Draw every foreground element of a live level. `view` = { x0, x1 } in world px. */
export function drawLevel(ctx, cache, T, level, { t, view, dormant = false, guide = false }) {
  drawPlatforms(ctx, cache, T, level.w.plats, view, t);
  drawGates(ctx, T, level, t);
  drawExit(ctx, T, level, t);
  drawCheckpoints(ctx, T, level, t);
  if (guide) drawGuides(ctx, T, level.seq.guide, view, t);
  const draw = HAZARD[level.seq.hazards[0]?.type] || HAZARD[T.key === "library" ? "ink" : T.key === "gardens" ? "bramble" : "zap"];
  if (dormant) ctx.globalAlpha = 0.3;
  for (const h of level.hazards) if (h.x + h.w > view.x0 && h.x < view.x1) (HAZARD[h.type] || draw)(ctx, h, t, T);
  ctx.globalAlpha = 1;
  drawShards(ctx, level.shards, view, t);
}
