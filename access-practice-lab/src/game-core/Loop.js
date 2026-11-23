// Loop.js — the render loop, performance control, canvas fitting and particle pool shared by the canvas games.
//
// requestAnimationFrame with delta time, a capped delta after tab suspension, automatic pause while the page
// is hidden, a rolling frame-time meter, and a PerformanceController that steps quality down (particles,
// shadows, resolution) when frames run long and back up when they recover, so a school Chromebook falls back
// toward a steady 30 FPS instead of stuttering. Reduced-effects and reduced-motion settings pin it low.

export const MAX_DT = 50; // ms: after a suspended tab one frame never simulates more than this
export const QUALITY = Object.freeze([
  { id: "low", dprCap: 1, particles: 24, shadows: false, parallax: 2, fps: 30 },
  { id: "medium", dprCap: 1.5, particles: 80, shadows: false, parallax: 3, fps: 60 },
  { id: "high", dprCap: 2, particles: 200, shadows: true, parallax: 4, fps: 60 },
]);

export class FrameMeter {
  constructor(size = 90) { this.size = size; this.samples = []; }
  push(ms) { this.samples.push(ms); if (this.samples.length > this.size) this.samples.shift(); }
  get avg() { return this.samples.length ? this.samples.reduce((a, b) => a + b, 0) / this.samples.length : 0; }
  get fps() { return this.avg ? Math.round(1000 / this.avg) : 0; }
  get p95() { if (!this.samples.length) return 0; const s = [...this.samples].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(s.length * 0.95))]; }
  get count() { return this.samples.length; }
}

/** Picks a quality tier from measured frame time. Steps down fast, up slowly, never flaps. */
export class PerformanceController {
  constructor({ reducedEffects = false, start = "high" } = {}) {
    this.pinned = reducedEffects;
    this.index = reducedEffects ? 0 : Math.max(0, QUALITY.findIndex((q) => q.id === start));
    this.cooldown = 0;
    this.good = 0;
  }
  get quality() { return QUALITY[this.index]; }
  /** Feed one frame time. Returns true when the tier changed. */
  observe(meter) {
    if (this.pinned || meter.count < 45) return false;
    if (this.cooldown > 0) { this.cooldown -= 1; return false; }
    const avg = meter.avg;
    if (avg > 28 && this.index > 0) { this.index -= 1; this.cooldown = 60; this.good = 0; meter.samples.length = 0; return true; }
    if (avg < 15.5 && meter.p95 < 22) { this.good += 1; if (this.good > 240 && this.index < QUALITY.length - 1) { this.index += 1; this.cooldown = 120; this.good = 0; meter.samples.length = 0; return true; } } else this.good = 0;
    return false;
  }
  pin(on) { this.pinned = on; if (on) this.index = 0; }
}

/**
 * The loop. `update(dtMs)` advances the simulation, `draw(alpha)` renders. Both are skipped while hidden.
 * At the "low" tier the loop runs the update every frame but draws at ~30 FPS.
 */
export class GameLoop {
  constructor({ update, draw, perf = new PerformanceController(), onQuality = () => {}, raf = (typeof requestAnimationFrame === "function" ? requestAnimationFrame : null), caf = (typeof cancelAnimationFrame === "function" ? cancelAnimationFrame : null), now = () => performance.now() } = {}) {
    this.update = update; this.draw = draw; this.perf = perf; this.onQuality = onQuality;
    this.raf = raf; this.caf = caf; this.now = now;
    this.meter = new FrameMeter();
    this.running = false; this.last = 0; this.id = 0; this.skip = false; this.frames = 0;
    this.onVis = () => (typeof document !== "undefined" && document.hidden ? this.stop() : this.start());
    this.visBound = false;
  }
  start() {
    if (this.running || !this.raf) return;
    this.running = true;
    this.last = this.now();
    this.id = this.raf(this.tick);
    if (!this.visBound && typeof document !== "undefined") { document.addEventListener("visibilitychange", this.onVis); this.visBound = true; }
  }
  stop() {
    this.running = false;
    if (this.id && this.caf) this.caf(this.id);
    this.id = 0;
  }
  destroy() {
    this.stop();
    if (this.visBound && typeof document !== "undefined") document.removeEventListener("visibilitychange", this.onVis);
    this.visBound = false;
  }
  tick = () => {
    if (!this.running) return;
    const t = this.now();
    const dt = Math.min(MAX_DT, Math.max(0, t - this.last));
    this.last = t;
    this.frames += 1;
    this.meter.push(dt || 16.7);
    try {
      this.update(dt);
      const low = this.perf.quality.fps === 30;
      if (!low || (this.skip = !this.skip)) this.draw(dt);
    } catch (e) {
      this.stop();
      throw e;
    }
    if (this.perf.observe(this.meter)) this.onQuality(this.perf.quality);
    this.id = this.raf(this.tick);
  };
}

/** Size a canvas to its CSS box at a capped device-pixel ratio. Returns { w, h, dpr } in CSS pixels. */
export function fitCanvas(canvas, { dprCap = 2, aspect = 0 } = {}) {
  const dpr = Math.min(dprCap, (typeof window !== "undefined" && window.devicePixelRatio) || 1);
  const box = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.round(box.width || canvas.clientWidth || 320));
  const h = Math.max(1, Math.round(aspect ? w / aspect : box.height || canvas.clientHeight || 180));
  const pw = Math.round(w * dpr);
  const ph = Math.round(h * dpr);
  if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph; }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { w, h, dpr, ctx };
}

/** A fixed-size particle pool: spawning reuses dead slots, so steady play allocates nothing. */
export class ParticlePool {
  constructor(max = 200) {
    this.max = max;
    this.list = Array.from({ length: max }, () => ({ alive: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, ttl: 1, size: 2, color: "#fff", g: 0 }));
    this.cursor = 0;
    this.limit = max;
  }
  setLimit(n) { this.limit = Math.min(this.max, Math.max(0, n)); }
  spawn(x, y, { vx = 0, vy = 0, ttl = 600, size = 3, color = "#fff", g = 0 } = {}) {
    if (this.alive() >= this.limit) return null;
    for (let i = 0; i < this.max; i += 1) {
      const p = this.list[(this.cursor + i) % this.max];
      if (!p.alive) { Object.assign(p, { alive: true, x, y, vx, vy, life: ttl, ttl, size, color, g }); this.cursor = (this.cursor + i + 1) % this.max; return p; }
    }
    return null;
  }
  burst(x, y, n, opts = {}, rand = Math.random) {
    for (let i = 0; i < n; i += 1) {
      const a = rand() * Math.PI * 2;
      const s = (opts.speed || 90) * (0.4 + rand() * 0.8);
      this.spawn(x, y, { vx: Math.cos(a) * s, vy: Math.sin(a) * s - (opts.lift || 0), ttl: (opts.ttl || 600) * (0.6 + rand() * 0.6), size: opts.size || 3, color: opts.color || "#fff", g: opts.g || 0 });
    }
  }
  step(dtMs) {
    const dt = dtMs / 1000;
    for (const p of this.list) {
      if (!p.alive) continue;
      p.life -= dtMs;
      if (p.life <= 0) { p.alive = false; continue; }
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }
  alive() { let n = 0; for (const p of this.list) if (p.alive) n += 1; return n; }
  draw(ctx) {
    for (const p of this.list) {
      if (!p.alive) continue;
      ctx.globalAlpha = Math.max(0, p.life / p.ttl);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }
  clear() { for (const p of this.list) p.alive = false; }
}

/** Cache a rendered sprite/gradient by key so a frame never rebuilds it. */
export class SpriteCache {
  constructor() { this.map = new Map(); }
  get(key, w, h, paint) {
    let c = this.map.get(key);
    if (!c) {
      c = typeof OffscreenCanvas === "function" ? new OffscreenCanvas(w, h) : Object.assign(document.createElement("canvas"), { width: w, height: h });
      paint(c.getContext("2d"), w, h);
      this.map.set(key, c);
    }
    return c;
  }
  clear() { this.map.clear(); }
}

/** True when the learner or the OS asks for less motion (the saved arcade setting wins when set). */
export function prefersReducedMotion(setting = null) {
  if (typeof setting === "boolean") return setting;
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}
