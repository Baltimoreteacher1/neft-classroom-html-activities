// Camera for the Math Gaming Runtime. Presentation only: it reads the world and
// is never part of it, so it is free to smooth, look ahead and shake without
// touching determinism.

export class Camera {
  constructor(viewW, viewH) {
    this.w = viewW;
    this.h = viewH;
    this.x = 0;
    this.y = 0;
    this.zoom = 1;
    this.targetZoom = 1;
    this.look = 0;
    this.shake = 0;
    this.sx = 0;
    this.sy = 0;
    this.bounds = { x: 0, y: 0, w: viewW, h: viewH };
    this.reducedMotion = false;
    this.seed = 1;
  }

  setBounds(x, y, w, h) {
    this.bounds = { x, y, w, h };
  }

  /** Jump straight to a focus point (level start, rewind, reality switch). */
  snap(fx, fy) {
    this.x = fx - this.w / 2;
    this.y = fy - this.h / 2;
    this.look = 0;
    this.clamp();
  }

  /**
   * Ease toward a focus point with look-ahead in the facing direction.
   * @param {number} fx @param {number} fy focus (world px)
   * @param {number} face -1 | 0 | 1
   * @param {number} dt seconds of display time
   */
  follow(fx, fy, face, dt) {
    const k = 1 - Math.exp(-dt * 6);
    this.look += (face * 90 - this.look) * (1 - Math.exp(-dt * 2.2));
    this.zoom += (this.targetZoom - this.zoom) * k;
    const vw = this.w / this.zoom;
    const vh = this.h / this.zoom;
    this.x += (fx + this.look - vw / 2 - this.x) * k;
    // Vertical: a soft dead zone so small hops do not move the frame.
    const ty = fy - vh * 0.56;
    const dy = ty - this.y;
    if (Math.abs(dy) > 28) this.y += (dy - Math.sign(dy) * 28) * k;
    this.clamp();
    if (this.shake > 0.01 && !this.reducedMotion) {
      this.seed = (this.seed * 16807) % 2147483647;
      this.sx = ((this.seed % 200) / 100 - 1) * this.shake;
      this.seed = (this.seed * 16807) % 2147483647;
      this.sy = ((this.seed % 200) / 100 - 1) * this.shake;
      this.shake *= Math.exp(-dt * 9);
    } else {
      this.shake = 0;
      this.sx = this.sy = 0;
    }
  }

  clamp() {
    const b = this.bounds;
    const vw = this.w / this.zoom;
    const vh = this.h / this.zoom;
    this.x = Math.max(b.x, Math.min(b.x + b.w - vw, this.x));
    this.y = Math.max(b.y, Math.min(b.y + b.h - vh, this.y));
    if (b.w < vw) this.x = b.x + (b.w - vw) / 2;
    if (b.h < vh) this.y = b.y + (b.h - vh) / 2;
  }

  /** Small impact kick; ignored under reduced motion (a flash-free alternative is the caller's cue). */
  kick(amount) {
    if (!this.reducedMotion) this.shake = Math.min(7, Math.max(this.shake, amount));
  }

  /** Apply the world transform; pair with ctx.restore(). */
  begin(ctx) {
    ctx.save();
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-Math.round(this.x + this.sx), -Math.round(this.y + this.sy));
  }

  /** Offset for a parallax layer at `depth` (0 = fixed sky, 1 = world). */
  parallax(depth) {
    return -(this.x + this.sx) * depth;
  }
}
