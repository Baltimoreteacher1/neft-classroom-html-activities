// Object-pooled particle bursts (sparks, steam, strain dust).
//
// All particle state lives in typed arrays sized once at construction. emit()
// recycles dead slots (or the oldest slot when full); update()/render() walk the
// arrays with no allocation. Colours are indexes into a palette of CSS strings
// the caller builds once, so assigning fillStyle never creates a string.

import { alphaLevel, rect } from "./draw.js";

const TABLE_SIZE = 256;
const TABLE_MASK = TABLE_SIZE - 1;
const TABLE_PER_RADIAN = TABLE_SIZE / (Math.PI * 2);
const INV_2_32 = 1 / 4294967296;
const COS_TABLE = new Float32Array(TABLE_SIZE);
const SIN_TABLE = new Float32Array(TABLE_SIZE);
for (let t = 0; t < TABLE_SIZE; t++) {
  COS_TABLE[t] = Math.cos(t / TABLE_PER_RADIAN);
  SIN_TABLE[t] = Math.sin(t / TABLE_PER_RADIAN);
}

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
    this.rngState = new Int32Array(1);
    this.rngState[0] = 0x2545f491;
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
    // Builtins (Math.random, Math.cos, Math.sin) return boxed doubles whenever
    // V8 runs this cold or does not inline them, and bursts are rare events, so
    // emit() stays cold for a long time. Randomness is an inline xorshift on
    // typed-array state; direction comes from a unit-circle table.
    const n = (count * this.scale) | 0;
    const rs = this.rngState;
    let r = rs[0];
    for (let k = 0; k < n; k++) {
      const i = this.cursor;
      this.cursor = (this.cursor + 1) % this.capacity;
      r ^= r << 13;
      r ^= r >>> 17;
      r ^= r << 5;
      const u1 = (r >>> 0) * INV_2_32;
      r ^= r << 13;
      r ^= r >>> 17;
      r ^= r << 5;
      const u2 = (r >>> 0) * INV_2_32;
      r ^= r << 13;
      r ^= r >>> 17;
      r ^= r << 5;
      const u3 = (r >>> 0) * INV_2_32;
      const a = angle + (u1 - 0.5) * spread;
      const s = speed * (0.4 + u2 * 0.6);
      const t = ((a * TABLE_PER_RADIAN) | 0) & TABLE_MASK;
      this.x[i] = x;
      this.y[i] = y;
      this.vx[i] = COS_TABLE[t] * s;
      this.vy[i] = SIN_TABLE[t] * s;
      this.maxLife[i] = life * (0.6 + u3 * 0.4);
      this.life[i] = this.maxLife[i];
      this.size[i] = 2 + ((r >>> 0) & 3);
      this.color[i] = colorIndex;
    }
    rs[0] = r;
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
