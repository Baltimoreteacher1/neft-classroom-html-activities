import * as THREE from "three";

/**
 * World-space text labels via canvas-textured sprites (e.g. "4×3=12").
 *
 * makeLabel(text, opts) -> THREE.Sprite
 *   opts:
 *     color      text color (default "#ffffff")
 *     background fill behind text (default "rgba(15,34,56,0.85)"); null = none
 *     fontSize   px on the canvas (default 64)
 *     fontFamily default system sans stack
 *     padding    px around text (default 18)
 *     scale      world units of sprite height (default 0.9); width auto from aspect
 *     maxWidth   max canvas px before downscaling (Chromebook cap, default 1024)
 *     THREE      optional THREE namespace override
 *
 * updateLabel(sprite, text) — re-renders the sprite's texture in place,
 *   reusing the original options so labels stay crisp and correctly sized.
 *
 * Canvas size is capped (default 1024px) to keep texture memory and fill-rate
 * low on Chromebooks while staying crisp at typical world scales.
 */
export function makeLabel(text, opts = {}) {
  const T = opts.THREE || THREE;
  const settings = {
    color: opts.color || "#ffffff",
    // Near-opaque dark panel = high contrast for numbers in any scene.
    background:
      opts.background === undefined ? "rgba(11,22,40,0.94)" : opts.background,
    // Dark outline keeps glyph edges sharp even when bloom touches white text.
    stroke: opts.stroke === undefined ? "rgba(0,0,0,0.85)" : opts.stroke,
    border: opts.border === undefined ? "rgba(255,255,255,0.22)" : opts.border,
    fontSize: opts.fontSize || 72,
    fontFamily:
      opts.fontFamily ||
      "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    padding: opts.padding === undefined ? 22 : opts.padding,
    scale: opts.scale || 1.0,
    maxWidth: opts.maxWidth || 1536,
    ss: opts.ss || 2, // supersample factor for crisp text
  };

  const canvas = document.createElement("canvas");
  const texture = new T.CanvasTexture(canvas);
  texture.minFilter = T.LinearFilter;
  texture.magFilter = T.LinearFilter;
  texture.generateMipmaps = false;

  const material = new T.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false, // numbers must stay readable, never hidden behind geometry
    depthWrite: false,
  });
  const sprite = new T.Sprite(material);
  sprite.renderOrder = 999;
  sprite.userData.labelSettings = settings;

  renderToCanvas(sprite, text);
  return sprite;
}

export function updateLabel(sprite, text) {
  if (!sprite || !sprite.userData || !sprite.userData.labelSettings) return;
  renderToCanvas(sprite, text);
}

function renderToCanvas(sprite, text) {
  const s = sprite.userData.labelSettings;
  const canvas = sprite.material.map.image;
  const ctx = canvas.getContext("2d");
  const str = String(text == null ? "" : text);

  // Supersample: render the canvas larger than needed, then let the sprite
  // scale it down — keeps numbers crisp instead of blurry.
  const ss = s.ss || 2;
  const fontPx = s.fontSize * ss;
  const pad = s.padding * ss;

  ctx.font = `bold ${fontPx}px ${s.fontFamily}`;
  const metrics = ctx.measureText(str);
  let w = Math.ceil(metrics.width) + pad * 2;
  let h = Math.ceil(fontPx * 1.35) + pad * 2;

  // Cap canvas size for Chromebooks; scale font down to fit if needed.
  let drawFont = fontPx;
  const cap = s.maxWidth * ss;
  if (w > cap) {
    const ratio = cap / w;
    drawFont = Math.max(8, Math.floor(fontPx * ratio));
    w = Math.ceil(w * ratio);
    h = Math.ceil(h * ratio);
  }

  canvas.width = w;
  canvas.height = h;

  ctx.clearRect(0, 0, w, h);
  if (s.background) {
    ctx.fillStyle = s.background;
    roundRect(ctx, 0, 0, w, h, Math.min(20 * ss, h * 0.22));
    ctx.fill();
  }
  if (s.border) {
    ctx.lineWidth = Math.max(2, ss * 1.5);
    ctx.strokeStyle = s.border;
    roundRect(
      ctx,
      ctx.lineWidth,
      ctx.lineWidth,
      w - ctx.lineWidth * 2,
      h - ctx.lineWidth * 2,
      Math.min(18 * ss, h * 0.2),
    );
    ctx.stroke();
  }
  ctx.font = `bold ${drawFont}px ${s.fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // Dark outline first, then bright fill → sharp, high-contrast glyphs.
  if (s.stroke) {
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(2, drawFont * 0.14);
    ctx.strokeStyle = s.stroke;
    ctx.strokeText(str, w / 2, h / 2);
  }
  ctx.fillStyle = s.color;
  ctx.fillText(str, w / 2, h / 2);

  sprite.material.map.needsUpdate = true;

  // Sprite world height stays = s.scale regardless of supersampling; width
  // follows the canvas aspect ratio.
  const aspect = w / h;
  sprite.scale.set(s.scale * aspect, s.scale, 1);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
