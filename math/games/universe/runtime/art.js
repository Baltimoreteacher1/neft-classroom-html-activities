// Original procedural art for the Math Gaming Runtime: palette, backdrops and
// the two recurring characters. Everything is drawn with canvas paths at run
// time (no image files, nothing borrowed), so it is sharp at any size, weighs
// nothing on the network, and reads the same in low-graphics mode.
//
// Characters:
//   Wren — the player. A field engineer in a deep-navy hooded jacket with a
//          warm-gold scarf; the scarf is the silhouette cue and the motion trail.
//   Ori  — the Mathematical Apprentice. A hovering sage-and-cream unit whose
//          face is a small screen; its eyes carry every mood.

export const PAL = {
  navy: "#0d1b2e",
  navy2: "#16294a",
  navy3: "#24406b",
  teal: "#1fa6a2",
  tealInk: "#0f6f6c",
  tealGlow: "#6fe3d8",
  sage: "#9cb99a",
  sageDeep: "#5f8368",
  gold: "#f2b84b",
  goldDeep: "#c98a1f",
  terra: "#d9734e",
  terraDeep: "#a84f31",
  cream: "#f4ecd8",
  ink: "#eef3fb",
  muted: "#a9b6d3",
  ok: "#7bdc8f",
  warn: "#f2b45a",
  shadow: "rgba(4,10,20,0.45)",
};

/** Pre-render something static to its own canvas once. */
export function layer(w, h, paint) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  paint(/** @type {CanvasRenderingContext2D} */ (c.getContext("2d")), w, h);
  return c;
}

export function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Vertical gradient sky with an optional horizon glow. */
export function sky(ctx, w, h, top, bottom, glow) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  if (glow) {
    const r = ctx.createRadialGradient(w * 0.5, h * 0.92, 10, w * 0.5, h * 0.92, w * 0.7);
    r.addColorStop(0, glow);
    r.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = r;
    ctx.fillRect(0, 0, w, h);
  }
}

/**
 * A tiling silhouette strip for parallax (ridges, pipework, skyline).
 * `profile(i)` returns the height of column i (0..1); the strip tiles at `w`.
 */
export function silhouette(w, h, color, columns, profile, lights) {
  return layer(w, h, (g) => {
    g.fillStyle = color;
    const cw = w / columns;
    g.beginPath();
    g.moveTo(0, h);
    for (let i = 0; i <= columns; i++) {
      const y = h - profile(i % columns) * h;
      g.lineTo(i * cw, y);
      g.lineTo((i + 1) * cw, y);
    }
    g.lineTo(w, h);
    g.fill();
    if (lights) {
      g.fillStyle = lights;
      for (let i = 0; i < columns; i++) {
        const top = h - profile(i) * h;
        for (let y = top + 10; y < h - 8; y += 16)
          if ((i * 7 + y) % 5 < 2) g.fillRect(i * cw + cw * 0.3, y, Math.max(2, cw * 0.18), 4);
      }
    }
  });
}

/** Draw a tiling strip across the view with a parallax offset. */
export function tile(ctx, img, offsetX, y, viewW) {
  const w = img.width;
  let x = offsetX % w;
  if (x > 0) x -= w;
  for (; x < viewW; x += w) ctx.drawImage(img, Math.round(x), y);
}

export function glow(ctx, x, y, r, color, a = 1) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.globalAlpha = a;
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.globalAlpha = 1;
}

/** Soft contact shadow under anything that stands or hovers. */
export function shadow(ctx, x, y, w, a = 0.35) {
  ctx.fillStyle = `rgba(3,8,16,${a})`;
  ctx.beginPath();
  ctx.ellipse(x, y, w, w * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Wren, drawn from the feet. Pose comes straight from the body's state:
 * @param {{x: number, y: number, face: number, vx: number, vy: number, ground: number,
 *          dash: number, landed: number, t: number, acting?: boolean}} p
 */
export function drawWren(ctx, p) {
  const run = p.ground && Math.abs(p.vx) > 0.4;
  const phase = p.t * (6 + Math.abs(p.vx) * 2.2);
  // Squash on landing, stretch while rising or dashing.
  let sx = 1;
  let sy = 1;
  if (p.landed < 8 && p.ground) {
    const k = 1 - p.landed / 8;
    sx = 1 + 0.22 * k;
    sy = 1 - 0.2 * k;
  } else if (!p.ground) {
    const k = Math.max(-1, Math.min(1, p.vy / 9));
    sy = 1 + 0.1 * Math.abs(k);
    sx = 1 - 0.07 * Math.abs(k);
  }
  if (p.dash > 0) {
    sx = 1.25;
    sy = 0.82;
  }
  const bob = p.ground && !run ? Math.sin(p.t * 2.4) * 1.2 : 0;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(p.face * sx, sy);
  const lean = p.dash > 0 ? 0.32 : run ? 0.12 : !p.ground ? p.vx * 0.02 : 0;
  ctx.rotate(lean);

  // Scarf: three trailing segments, the read-at-a-glance motion cue.
  const trail = Math.min(1, Math.abs(p.vx) / 3.5 + (p.dash > 0 ? 0.6 : 0));
  ctx.strokeStyle = PAL.gold;
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-3, -30 + bob);
  ctx.quadraticCurveTo(
    -12 - trail * 12,
    -30 + Math.sin(p.t * 9) * 3 * (0.3 + trail),
    -18 - trail * 20,
    -25 + Math.sin(p.t * 7 + 1) * 4 * (0.3 + trail) - p.vy * 0.6,
  );
  ctx.stroke();

  // Legs.
  ctx.strokeStyle = PAL.navy3;
  ctx.lineWidth = 6;
  const swing = run ? Math.sin(phase) * 9 : 0;
  const tuck = !p.ground ? 5 : 0;
  ctx.beginPath();
  ctx.moveTo(-4, -14);
  ctx.lineTo(-4 + swing, -1 - tuck - (run ? Math.max(0, Math.cos(phase)) * 4 : 0));
  ctx.moveTo(4, -14);
  ctx.lineTo(4 - swing, -1 - tuck - (run ? Math.max(0, -Math.cos(phase)) * 4 : 0));
  ctx.stroke();

  // Jacket.
  ctx.fillStyle = PAL.navy2;
  rr(ctx, -10, -34 + bob, 20, 23, 7);
  ctx.fill();
  ctx.fillStyle = PAL.teal;
  rr(ctx, -10, -24 + bob, 20, 5, 2);
  ctx.fill();

  // Arms: swing when running, reach forward when working a machine.
  ctx.strokeStyle = PAL.navy2;
  ctx.lineWidth = 5;
  ctx.beginPath();
  if (p.acting) {
    ctx.moveTo(6, -28 + bob);
    ctx.lineTo(17, -30 + Math.sin(p.t * 10) * 2);
  } else {
    ctx.moveTo(7, -29 + bob);
    ctx.lineTo(9 - swing * 0.7, -18 + bob - (p.ground ? 0 : 6));
    ctx.moveTo(-7, -29 + bob);
    ctx.lineTo(-9 + swing * 0.7, -18 + bob - (p.ground ? 0 : 6));
  }
  ctx.stroke();

  // Hood and visor.
  ctx.fillStyle = PAL.navy3;
  ctx.beginPath();
  ctx.arc(0, -41 + bob, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PAL.cream;
  ctx.beginPath();
  ctx.arc(2, -40 + bob, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PAL.tealGlow;
  rr(ctx, 0, -43 + bob, 9, 4.5, 2);
  ctx.fill();
  ctx.restore();
}

const MOOD_LIGHT = {
  curious: PAL.tealGlow,
  confused: PAL.warn,
  surprised: PAL.gold,
  focused: PAL.teal,
  thinking: PAL.muted,
  eureka: PAL.gold,
  celebrate: PAL.ok,
  worried: PAL.terra,
};

/**
 * Ori, drawn around its centre. `mood` is one of the keys above; `t` animates.
 * @param {{x: number, y: number, face: number, mood: string, t: number, talk?: number}} p
 */
export function drawOri(ctx, p) {
  const mood = MOOD_LIGHT[p.mood] ? p.mood : "curious";
  const hop = mood === "celebrate" ? Math.abs(Math.sin(p.t * 7)) * 7 : 0;
  const hover = Math.sin(p.t * 2.2) * 3 - hop;
  const tilt =
    mood === "confused" ? Math.sin(p.t * 1.6) * 0.2 : mood === "curious" ? 0.08 * p.face : 0;
  ctx.save();
  ctx.translate(p.x, p.y + hover);
  // Thruster glow.
  glow(ctx, 0, 18, 16, MOOD_LIGHT[mood], 0.5);
  ctx.rotate(tilt);
  // Antenna.
  ctx.strokeStyle = PAL.sageDeep;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.quadraticCurveTo(3 * Math.sin(p.t * 3), -20, 0, -24);
  ctx.stroke();
  ctx.fillStyle = MOOD_LIGHT[mood];
  ctx.beginPath();
  ctx.arc(0, -25, mood === "eureka" ? 4.5 + Math.sin(p.t * 12) : 3, 0, Math.PI * 2);
  ctx.fill();
  if (mood === "eureka") glow(ctx, 0, -25, 22, PAL.gold, 0.7);
  // Shell.
  ctx.fillStyle = PAL.cream;
  rr(ctx, -16, -14, 32, 26, 11);
  ctx.fill();
  ctx.fillStyle = PAL.sage;
  rr(ctx, -16, 3, 32, 9, 5);
  ctx.fill();
  // Screen.
  ctx.fillStyle = PAL.navy;
  rr(ctx, -12, -10, 24, 14, 6);
  ctx.fill();
  // Eyes.
  ctx.strokeStyle = ctx.fillStyle = MOOD_LIGHT[mood];
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  const blink = Math.sin(p.t * 0.9) > 0.985 ? 0.2 : 1;
  const look = p.face * 1.5;
  const eye = (cx, r, squash = 1) => {
    ctx.beginPath();
    ctx.ellipse(cx + look, -3, r, r * squash * blink, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  const arc = (cx, up) => {
    ctx.beginPath();
    ctx.arc(cx + look, up ? -2 : -4, 3, up ? Math.PI : 0, up ? 0 : Math.PI);
    ctx.stroke();
  };
  switch (mood) {
    case "confused":
      eye(-5, 2.2);
      eye(5, 3.4);
      break;
    case "surprised":
      eye(-5, 3.6);
      eye(5, 3.6);
      break;
    case "focused":
      eye(-5, 3, 0.35);
      eye(5, 3, 0.35);
      break;
    case "thinking": {
      const k = Math.floor(p.t * 3) % 3;
      for (let i = 0; i < 3; i++) {
        ctx.globalAlpha = i === k ? 1 : 0.35;
        ctx.beginPath();
        ctx.arc(-5 + i * 5, -3, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      break;
    }
    case "eureka":
    case "celebrate":
      arc(-5, true);
      arc(5, true);
      break;
    case "worried":
      eye(-5, 2.4);
      eye(5, 2.4);
      ctx.beginPath();
      ctx.moveTo(-8 + look, -8);
      ctx.lineTo(-3 + look, -6.5);
      ctx.moveTo(8 + look, -8);
      ctx.lineTo(3 + look, -6.5);
      ctx.stroke();
      break;
    default:
      eye(-5, 2.6);
      eye(5, 2.6);
  }
  // Speaking: a small pulsing bar under the eyes.
  if (p.talk) {
    ctx.fillRect(-3, 1, 6 * (0.4 + Math.abs(Math.sin(p.t * 16)) * 0.6), 1.5);
  }
  ctx.restore();
}

/** A machine nameplate / in-world readout: dark glass with a lit edge. */
export function plate(ctx, x, y, w, h, edge = PAL.teal) {
  ctx.fillStyle = "rgba(9,18,34,0.92)";
  rr(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 2;
  ctx.stroke();
}

/** Centered text with the runtime's display face. */
export function label(ctx, text, x, y, size = 16, color = PAL.ink, weight = 700) {
  ctx.font = `${weight} ${size}px "Atkinson Hyperlegible", system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}
