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
    background:
      opts.background === undefined ? "rgba(15,34,56,0.85)" : opts.background,
    fontSize: opts.fontSize || 64,
    fontFamily:
      opts.fontFamily ||
      "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    padding: opts.padding === undefined ? 18 : opts.padding,
    scale: opts.scale || 0.9,
    maxWidth: opts.maxWidth || 1024,
  };

  const canvas = document.createElement("canvas");
  const texture = new T.CanvasTexture(canvas);
  texture.minFilter = T.LinearFilter;
  texture.magFilter = T.LinearFilter;
  texture.generateMipmaps = false;

  const material = new T.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: true,
    depthWrite: false,
  });
  const sprite = new T.Sprite(material);
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

  // Measure at the requested font size.
  ctx.font = `bold ${s.fontSize}px ${s.fontFamily}`;
  const metrics = ctx.measureText(str);
  let w = Math.ceil(metrics.width) + s.padding * 2;
  let h = Math.ceil(s.fontSize * 1.4) + s.padding * 2;

  // Cap canvas size for Chromebooks; scale font down to fit if needed.
  let drawFont = s.fontSize;
  if (w > s.maxWidth) {
    const ratio = s.maxWidth / w;
    drawFont = Math.max(8, Math.floor(s.fontSize * ratio));
    w = Math.ceil(w * ratio);
    h = Math.ceil(h * ratio);
  }

  canvas.width = w;
  canvas.height = h;

  ctx.clearRect(0, 0, w, h);
  if (s.background) {
    ctx.fillStyle = s.background;
    roundRect(ctx, 0, 0, w, h, Math.min(16, h * 0.2));
    ctx.fill();
  }
  ctx.font = `bold ${drawFont}px ${s.fontFamily}`;
  ctx.fillStyle = s.color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(str, w / 2, h / 2);

  sprite.material.map.needsUpdate = true;

  // Keep height = scale world units; width follows the canvas aspect ratio.
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
