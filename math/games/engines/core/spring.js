// Damped harmonic springs for every moving part of an engine game.
//
// One SpringBank holds N springs in typed arrays, allocated once in initWorld().
// step() is the implicit-Euler damped spring (unconditionally stable at any dt),
// so it never explodes on a slow Chromebook frame and allocates nothing.
// Default damping ratio 0.7 and angular frequency 14 rad/s give a crisp snap
// with one small overshoot: f(t) = 1 - e^(-ζωt) cos(ω√(1-ζ²) t).

export class SpringBank {
  /**
   * @param {number} count
   * @param {number} [zeta]
   * @param {number} [omega]
   */
  constructor(count, zeta = 0.7, omega = 14) {
    this.count = count;
    this.pos = new Float64Array(count);
    this.vel = new Float64Array(count);
    this.target = new Float64Array(count);
    this.zeta = zeta;
    this.omega = omega;
  }

  /** Jump a spring to a value with no motion. */
  snap(i, value) {
    this.pos[i] = value;
    this.vel[i] = 0;
    this.target[i] = value;
  }

  setTarget(i, value) {
    this.target[i] = value;
  }

  /** Add velocity (a kick) without moving the rest point. */
  impulse(i, dv) {
    this.vel[i] += dv;
  }

  get(i) {
    return this.pos[i];
  }

  /** True when every spring is within eps of its target and nearly still. */
  settled(eps = 0.001) {
    for (let i = 0; i < this.count; i++) {
      if (Math.abs(this.pos[i] - this.target[i]) > eps || Math.abs(this.vel[i]) > eps * 10)
        return false;
    }
    return true;
  }

  /** @param {number} dt seconds */
  step(dt) {
    const w = this.omega;
    const f = 1 + 2 * dt * this.zeta * w;
    const ho = dt * w * w;
    const hho = dt * ho;
    const detInv = 1 / (f + hho);
    const pos = this.pos;
    const vel = this.vel;
    const target = this.target;
    for (let i = 0; i < this.count; i++) {
      const x = (f * pos[i] + dt * vel[i] + hho * target[i]) * detInv;
      vel[i] = (vel[i] + ho * (target[i] - pos[i])) * detInv;
      pos[i] = x;
    }
  }
}

// Warm step() into optimized code at module load: interpreted code boxes every
// intermediate double, and the first seconds of play would otherwise allocate.
{
  const warm = new SpringBank(8);
  for (let i = 0; i < 8; i++) warm.setTarget(i, i + 0.5);
  for (let k = 0; k < 20000; k++) warm.step(1 / 60);
}
