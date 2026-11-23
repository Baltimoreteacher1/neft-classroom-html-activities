// physics.js — the Skyline Runner movement engine. DOM-free and deterministic.
//
// Fixed-timestep simulation (120 Hz) fed by an accumulator, so the result depends on elapsed time and the inputs, not
// on how the browser slices frames: a 16 ms frame, a 50 ms frame (GameLoop's cap) and a 4x-capped 66 ms frame all
// land on the same state. At the 820 px/s fall cap one substep moves 6.8 px, far less than a 16 px platform, so
// nothing tunnels. Units are pixels and seconds; y grows downward.
//
// Feel: acceleration and deceleration on the ground, weaker steering in the air, variable jump height (releasing the
// button cuts the rise), coyote time (a jump still works for a moment after walking off a ledge), input buffering (a
// jump pressed just before landing fires on landing), AABB collision against solid blocks and one-way islands, and
// moving platforms that carry the rider.

export const TILE = 32;
export const DT = 1 / 120;
export const PHYS = Object.freeze({
  gravUp: 1500, // rising, jump held
  gravCut: 3600, // rising, jump released: the short hop
  gravDown: 2300, // falling
  maxFall: 820,
  jumpV: 640,
  runAccel: 1700,
  runDecel: 2300,
  turnAccel: 3400,
  airAccel: 1150,
  airDrag: 350,
  speed: 210,
  coyote: 0.1,
  buffer: 0.14,
  bw: 22,
  bh: 34,
});
export const physFor = (o = {}) => Object.freeze({ ...PHYS, ...o });

/** Highest rise of a full jump, and the longest same-level jump at full speed (from the closed-form motion). */
export const maxJumpHeight = (p = PHYS) => (p.jumpV * p.jumpV) / (2 * p.gravUp);
export function maxJumpRange(p = PHYS) {
  const up = p.jumpV / p.gravUp;
  const down = Math.sqrt((2 * maxJumpHeight(p)) / p.gravDown);
  return p.speed * (up + down);
}

export const makeBody = (x, y, p = PHYS) => ({
  x,
  y,
  w: p.bw,
  h: p.bh,
  vx: 0,
  vy: 0,
  grounded: false,
  plat: -1,
  coyote: 0,
  buf: 0,
  facing: 1,
  jumping: false,
  ev: 0,
  fell: false,
  air: 0,
  landV: 0,
});
export const cloneBody = (b, into = {}) => Object.assign(into, b);

export const makeWorld = (plats, killY = 2000) => ({ t: 0, acc: 0, plats, killY });

/** Position of a platform at time t: a sinusoidal ping-pong along one axis (smooth, so carrying never jerks). */
function offsetAt(pl, t) {
  const m = pl.mv;
  return m.range * 0.5 * (1 - Math.cos((2 * Math.PI * t) / m.period + m.phase));
}
/** Set every moving platform's x/y/dx/dy as a pure function of world time. Idempotent: safe to call after a lookahead. */
export function syncPlatforms(w) {
  for (const pl of w.plats) {
    if (!pl.mv) continue;
    const o = offsetAt(pl, w.t);
    const o0 = offsetAt(pl, w.t - DT);
    if (pl.mv.axis === "x") {
      pl.x = pl.x0 + o;
      pl.dx = o - o0;
      pl.dy = 0;
    } else {
      pl.y = pl.y0 + o;
      pl.dy = o - o0;
      pl.dx = 0;
    }
  }
}
/** Prepare a plain platform description for simulation (runtime fields: base position, current delta, active flag). */
export const prepPlatform = (p, id) => ({
  on: true,
  solid: false,
  mv: null,
  ...p,
  id,
  x0: p.x,
  y0: p.y,
  dx: 0,
  dy: 0,
});

const approach = (v, target, d) => (v < target ? Math.min(target, v + d) : Math.max(target, v - d));
const overlapX = (b, p) => b.x < p.x + p.w && b.x + b.w > p.x;

function resolveX(w, b) {
  for (const p of w.plats) {
    if (!p.on || !p.solid) continue;
    if (!(b.x < p.x + p.w && b.x + b.w > p.x && b.y + b.h > p.y + 0.01 && b.y < p.y + p.h))
      continue;
    const left = b.x + b.w - p.x;
    const right = p.x + p.w - b.x;
    if (left < right) b.x = p.x - b.w;
    else b.x = p.x + p.w;
    b.vx = 0;
  }
}

function resolveY(w, b, prevTop, prevBottom, rode) {
  for (let i = 0; i < w.plats.length; i += 1) {
    const p = w.plats[i];
    if (!p.on || !overlapX(b, p)) continue;
    // a rider was already carried with the platform this step, so it is compared with the platform's CURRENT top
    const pTopPrev = i === rode ? p.y : p.y - p.dy;
    if (b.vy >= 0 && prevBottom <= pTopPrev + 0.5 && b.y + b.h >= p.y) {
      b.y = p.y - b.h;
      b.landV = b.vy;
      b.vy = 0;
      b.grounded = true;
      b.plat = i;
      continue;
    }
    if (p.solid && b.vy < 0 && prevTop >= p.y + p.h - 0.5 && b.y < p.y + p.h) {
      b.y = p.y + p.h;
      b.vy = 0;
    }
  }
}

function sub(w, b, inp, p) {
  w.t += DT;
  syncPlatforms(w);
  if (b.grounded && b.plat >= 0) {
    const pl = w.plats[b.plat];
    if (pl && pl.on) {
      b.x += pl.dx;
      b.y += pl.dy;
    }
  }
  b.buf = Math.max(0, b.buf - DT);
  b.coyote = Math.max(0, b.coyote - DT);
  let jumped = false;
  if (b.buf > 0 && (b.grounded || b.coyote > 0)) {
    b.vy = -p.jumpV;
    b.grounded = false;
    b.plat = -1;
    b.coyote = 0;
    b.buf = 0;
    b.jumping = true;
    b.ev |= 1;
    jumped = true;
  }
  const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
  const target = dir * p.speed;
  let a;
  if (b.grounded)
    a = !dir ? p.runDecel : Math.sign(b.vx) === -dir && b.vx !== 0 ? p.turnAccel : p.runAccel;
  else a = dir ? p.airAccel : p.airDrag;
  b.vx = approach(b.vx, target, a * DT);
  if (dir) b.facing = dir;
  b.x += b.vx * DT;
  resolveX(w, b);
  const g = b.vy < 0 ? (inp.jump ? p.gravUp : p.gravCut) : p.gravDown;
  b.vy = Math.min(p.maxFall, b.vy + g * DT);
  const prevTop = b.y;
  const prevBottom = b.y + b.h;
  b.y += b.vy * DT;
  const was = b.grounded;
  const rode = was ? b.plat : -1;
  b.grounded = false;
  b.plat = -1;
  resolveY(w, b, prevTop, prevBottom, rode);
  if (b.grounded) {
    if (!was) {
      b.ev |= 2;
      b.jumping = false;
    }
    b.coyote = p.coyote;
    b.air = 0;
  } else {
    b.air += DT;
    if (was && !jumped) b.coyote = p.coyote;
  }
  if (b.y > w.killY) b.fell = true;
}

/**
 * Advance the world and the body by dt seconds. `inp` = { left, right, jump (held), jumpPressed (edge) }.
 * Returns the number of substeps run. body.ev carries event bits since the caller last cleared it: 1 jump, 2 landing.
 */
export function step(w, b, inp, dt, p = PHYS) {
  if (inp.jumpPressed) b.buf = p.buffer;
  w.acc += dt;
  let n = 0;
  while (w.acc >= DT) {
    sub(w, b, inp, p);
    w.acc -= DT;
    n += 1;
  }
  return n;
}

/** Place the body on top of a platform at x (clamped onto it), at rest. */
export function standOn(b, pl, x, idx = -1) {
  b.x = Math.min(Math.max(x, pl.x), pl.x + pl.w - b.w);
  b.y = pl.y - b.h;
  b.vx = 0;
  b.vy = 0;
  b.grounded = true;
  b.plat = idx;
  b.coyote = 0;
  b.buf = 0;
  b.fell = false;
  b.air = 0;
}
