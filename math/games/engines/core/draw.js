// Zero-allocation canvas drawing helpers.
//
// Measured in Chromium (tools/validate-engine-games-browser.mjs, GC audit):
// passing a COMPUTED double to a CanvasRenderingContext2D method or setter
// (lineTo(x + 0.5), rotate(angle), globalAlpha = a) allocates a 12-byte
// HeapNumber per call, every frame. Integers (Smis), module-level constants and
// values loaded from a tagged array do not. So every helper here:
//  - snaps coordinates to integers with `| 0` before they reach the canvas;
//  - rotates points in JS (cos/sin cached once per shape) instead of ctx.rotate;
//  - sets alpha and colour from tables built once, never from arithmetic.
// Unit renderers draw ONLY through these helpers or with integer/constant args.
//
// The same boxing happens at ANY JS call V8 declines to inline, once the caller
// is optimized: a float argument (w / 2, Math.max(...), a double field, a spring
// position) is re-boxed per call. So `| 0` every argument at the CALL SITE, read
// springs as springs.pos[i], and keep doubles in typed arrays read by the callee.

/** @typedef {CanvasRenderingContext2D} Ctx */

export const TAU = Math.PI * 2;

// Tagged table of alpha levels 0..1 in steps of 0.05. The trailing string keeps
// the array in generic (tagged) elements, so a load returns an existing boxed
// number instead of making a new one.
const ALPHA = [];
for (let i = 0; i <= 20; i++) ALPHA.push(i / 20);
ALPHA.push("tagged");
ALPHA.pop();

/** @param {Ctx} ctx @param {number} a 0..1 */
export function alpha(ctx, a) {
  const i = (a * 20 + 0.5) | 0;
  ctx.globalAlpha = ALPHA[i < 0 ? 0 : i > 20 ? 20 : i];
}

/**
 * Alpha by integer level 0..20 (0.05 steps). Prefer this in render code: an
 * integer argument never boxes, even when V8 declines to inline the call.
 * @param {Ctx} ctx @param {number} level
 */
export function alphaLevel(ctx, level) {
  ctx.globalAlpha = ALPHA[level < 0 ? 0 : level > 20 ? 20 : level];
}

/** @param {Ctx} ctx */
export function rect(ctx, x, y, w, h) {
  ctx.fillRect(x | 0, y | 0, w | 0, h | 0);
}

/** @param {Ctx} ctx */
export function line(ctx, x0, y0, x1, y1) {
  ctx.moveTo(x0 | 0, y0 | 0);
  ctx.lineTo(x1 | 0, y1 | 0);
}

/** Filled circle. @param {Ctx} ctx */
export function dot(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x | 0, y | 0, r | 0, 0, TAU);
  ctx.fill();
}

/** Circle outline path (caller strokes). @param {Ctx} ctx */
export function ring(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x | 0, y | 0, r | 0, 0, TAU);
}

/** Rounded-rectangle path. @param {Ctx} ctx */
export function roundRect(ctx, x, y, w, h, r) {
  const x0 = x | 0;
  const y0 = y | 0;
  const x1 = (x + w) | 0;
  const y1 = (y + h) | 0;
  const rr = r | 0;
  ctx.beginPath();
  ctx.moveTo(x0 + rr, y0);
  ctx.arcTo(x1, y0, x1, y1, rr);
  ctx.arcTo(x1, y1, x0, y1, rr);
  ctx.arcTo(x0, y1, x0, y0, rr);
  ctx.arcTo(x0, y0, x1, y0, rr);
  ctx.closePath();
}

/** Text at an integer position; the string must be built outside the frame. @param {Ctx} ctx */
export function text(ctx, s, x, y) {
  ctx.fillText(s, x | 0, y | 0);
}

/**
 * A pivot for rotating points without ctx.rotate. Set once per shape with
 * set(cx, cy, angle); then px/py map a local point to integer screen coords.
 */
export class Pivot {
  constructor() {
    this.cx = 0;
    this.cy = 0;
    this.c = 1;
    this.s = 0;
  }
  set(cx, cy, angle) {
    this.cx = cx;
    this.cy = cy;
    this.c = Math.cos(angle);
    this.s = Math.sin(angle);
  }
  /** Like set(), reading the angle from a typed array so no double crosses a call. */
  setFrom(cx, cy, arr, i) {
    this.cx = cx;
    this.cy = cy;
    this.c = Math.cos(arr[i]);
    this.s = Math.sin(arr[i]);
  }
  px(x, y) {
    return (this.cx + x * this.c - y * this.s) | 0;
  }
  py(x, y) {
    return (this.cy + x * this.s + y * this.c) | 0;
  }
  /**
   * Rotated rectangle path centred on local (x, y). Corner math is inline: a
   * float such as w / 2 passed to px()/py() would be boxed whenever V8 does not
   * inline the call.
   * @param {Ctx} ctx
   */
  rectPath(ctx, x, y, w, h) {
    const c = this.c;
    const s = this.s;
    const cx = this.cx;
    const cy = this.cy;
    const x0 = x - w / 2;
    const x1 = x + w / 2;
    const y0 = y - h / 2;
    const y1 = y + h / 2;
    ctx.beginPath();
    ctx.moveTo((cx + x0 * c - y0 * s) | 0, (cy + x0 * s + y0 * c) | 0);
    ctx.lineTo((cx + x1 * c - y0 * s) | 0, (cy + x1 * s + y0 * c) | 0);
    ctx.lineTo((cx + x1 * c - y1 * s) | 0, (cy + x1 * s + y1 * c) | 0);
    ctx.lineTo((cx + x0 * c - y1 * s) | 0, (cy + x0 * s + y1 * c) | 0);
    ctx.closePath();
  }
}

/**
 * Pre-render a static layer once (grids, scales, engraved plates) into an
 * offscreen canvas at device resolution. Draw it each frame with
 * ctx.drawImage(layer, 0, 0, W, H): integer args, no allocation.
 * @param {number} w @param {number} h @param {(ctx: Ctx) => void} paint
 */
export function staticLayer(w, h, paint) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const c = document.createElement("canvas");
  c.width = Math.round(w * dpr);
  c.height = Math.round(h * dpr);
  const ctx = /** @type {Ctx} */ (c.getContext("2d"));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  paint(ctx);
  return c;
}

// Trig lookup for per-frame drawing (gauges, spokes, gears). Math.cos/sin are
// builtins: in code V8 has not optimized yet, or when not inlined, each call
// returns a boxed double, so a per-frame trig loop allocates (u7 tether reel,
// u9 gear: measured). Index with ((angle * TRIG_PER_RAD) | 0) & TRIG_MASK.
export const TRIG_N = 1024;
export const TRIG_MASK = TRIG_N - 1;
export const TRIG_PER_RAD = TRIG_N / TAU;
export const COS_T = new Float64Array(TRIG_N);
export const SIN_T = new Float64Array(TRIG_N);
for (let i = 0; i < TRIG_N; i++) {
  COS_T[i] = Math.cos(i / TRIG_PER_RAD);
  SIN_T[i] = Math.sin(i / TRIG_PER_RAD);
}
