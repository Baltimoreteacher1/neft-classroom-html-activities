// Object-pooled particle bursts (sparks, steam, strain dust).
//
// All particle state lives in typed arrays sized once at construction. emit()
// recycles dead slots (or the oldest slot when full); update()/render() walk the
// arrays with no allocation. Colours are indexes into a palette of CSS strings
// the caller builds once, so assigning fillStyle never creates a string.

import { alphaLevel, rect } from "./draw.js";

export class ParticlePool {
  /**
   * @param {number} capacity
   * @param {string[]} palette CSS colours, built once by the caller
   */
  constructor(capacity, palette) {
    this.capacity = capacity;
    this.palette = palette;
    this.x = new Float32Array(capacity);
    this.y = new Float32Array(capacity);
    this.vx = new Float32Array(capacity);
    this.vy = new Float32Array(capacity);
    this.life = new Float32Array(capacity);
    this.maxLife = new Float32Array(capacity);
    this.size = new Float32Array(capacity);
    this.color = new Uint8Array(capacity);
    this.cursor = 0;
    this.gravity = 240;
    this.drag = 1.6;
    this.scale = 1; // 0 under reduced motion: emit becomes a no-op
  }

  /**
   * Emit `count` particles from (x, y) in a cone around `angle` (radians).
   * @param {number} x
   * @param {number} y
   * @param {number} count
   * @param {number} speed px/s
   * @param {number} colorIndex
   * @param {number} [angle]
   * @param {number} [spread] radians
   * @param {number} [life] seconds
   */
  emit(x, y, count, speed, colorIndex, angle = -Math.PI / 2, spread = Math.PI, life = 0.7) {
    const n = Math.floor(count * this.scale);
    for (let k = 0; k < n; k++) {
      const i = this.cursor;
      this.cursor = (this.cursor + 1) % this.capacity;
      const a = angle + (Math.random() - 0.5) * spread;
      const s = speed * (0.4 + Math.random() * 0.6);
      this.x[i] = x;
      this.y[i] = y;
      this.vx[i] = Math.cos(a) * s;
      this.vy[i] = Math.sin(a) * s;
      this.maxLife[i] = life * (0.6 + Math.random() * 0.4);
      this.life[i] = this.maxLife[i];
      this.size[i] = 2 + ((Math.random() * 4) | 0);
      this.color[i] = colorIndex;
    }
  }

  /** @param {number} dt */
  update(dt) {
    const damp = Math.max(0, 1 - this.drag * dt);
    for (let i = 0; i < this.capacity; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      this.vx[i] *= damp;
      this.vy[i] = this.vy[i] * damp + this.gravity * dt;
      this.x[i] += this.vx[i] * dt;
      this.y[i] += this.vy[i] * dt;
    }
  }

  /** @param {CanvasRenderingContext2D} ctx */
  render(ctx) {
    for (let i = 0; i < this.capacity; i++) {
      const life = this.life[i];
      if (life <= 0) continue;
      alphaLevel(ctx, ((life / this.maxLife[i]) * 20 + 0.5) | 0);
      ctx.fillStyle = this.palette[this.color[i]];
      const s = this.size[i];
      rect(ctx, (this.x[i] - s / 2) | 0, (this.y[i] - s / 2) | 0, s | 0, s | 0);
    }
    ctx.globalAlpha = 1;
  }

  clear() {
    this.life.fill(0);
  }
}

// Warm update() and render() into optimized code at module load (see spring.js):
// a game that rarely emits would otherwise run render's loop body interpreted
// the first time a burst arrives, boxing every particle's doubles.
{
  const warm = new ParticlePool(64, ["#fff"]);
  const ctx = typeof document === "undefined" ? null : document.createElement("canvas").getContext("2d");
  for (let k = 0; k < 20000; k++) {
    if (k % 30 === 0) warm.emit(100, 100, 20, 200, 0);
    warm.update(1 / 60);
    if (ctx && k % 4 === 0) warm.render(ctx);
  }
}
