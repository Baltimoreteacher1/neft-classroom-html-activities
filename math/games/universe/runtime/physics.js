// Deterministic 2D movement for the Math Gaming Runtime. No DOM.
//
// Everything is plain data inside the world (see sim.js): a body is an object,
// solids are an array of rectangles, velocities are pixels per fixed tick.
// Results are snapped with q() so a replay lands on identical numbers.

import { IN, q } from "./sim.js";

/** Platformer feel, in pixels and ticks (60 per second). */
export const FEEL = {
  run: 3.5,
  accel: 0.55,
  airAccel: 0.34,
  friction: 0.62,
  gravity: 0.56,
  maxFall: 11,
  jump: -10.6,
  jumpCut: 0.45,
  coyote: 7, // ticks after leaving a ledge when a jump still counts
  buffer: 8, // ticks before landing when a jump press is remembered
  dash: 7.6,
  dashTicks: 9,
  dashCooldown: 28,
};

export function makeBody(x, y, w = 26, h = 40) {
  return {
    x,
    y,
    w,
    h,
    vx: 0,
    vy: 0,
    face: 1,
    ground: 0,
    coyote: 0,
    buffer: 0,
    dashT: 0,
    dashCd: 0,
    plat: -1,
    landed: 0, // ticks since landing, for squash
  };
}

export function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/**
 * Move a kinematic platform along its path and remember how far it went this
 * tick (dx, dy) so riders are carried. Path: from (x0,y0) to (x1,y1), ping-pong
 * over `period` ticks, eased; `on` = 0 freezes it where it is.
 */
export function movePlatform(p, tick) {
  const px = p.x;
  const py = p.y;
  if (p.on) p.phase = (p.phase + 1) % (p.period * 2);
  const u = p.phase < p.period ? p.phase / p.period : 2 - p.phase / p.period;
  const e = u * u * (3 - 2 * u);
  p.x = q(p.x0 + (p.x1 - p.x0) * e);
  p.y = q(p.y0 + (p.y1 - p.y0) * e);
  p.dx = q(p.x - px);
  p.dy = q(p.y - py);
  return tick;
}

/**
 * One tick of platformer movement against `solids` (rectangles with optional
 * dx/dy for moving platforms and `oneWay` for jump-through ledges).
 * Pushes "jump" | "land" | "dash" events.
 */
export function stepBody(b, solids, mask, prevMask, events, feel = FEEL) {
  const pressedJump = mask & IN.JUMP && !(prevMask & IN.JUMP);
  const pressedDash = mask & IN.DASH && !(prevMask & IN.DASH);
  const dir = (mask & IN.RIGHT ? 1 : 0) - (mask & IN.LEFT ? 1 : 0);
  if (dir) b.face = dir;

  // Carried by the platform it stands on.
  if (b.plat >= 0 && solids[b.plat]) {
    b.x += solids[b.plat].dx || 0;
    b.y += solids[b.plat].dy || 0;
  }

  if (b.dashCd > 0) b.dashCd--;
  if (pressedDash && b.dashCd === 0) {
    b.dashT = feel.dashTicks;
    b.dashCd = feel.dashCooldown;
    b.vy = 0;
    events.push({ type: "dash", x: b.x, y: b.y, face: b.face });
  }

  if (b.dashT > 0) {
    b.dashT--;
    b.vx = b.face * feel.dash;
    b.vy = 0;
  } else {
    const a = b.ground ? feel.accel : feel.airAccel;
    if (dir) b.vx += dir * a;
    else if (b.ground) b.vx *= feel.friction;
    else b.vx *= 0.94;
    if (b.vx > feel.run) b.vx = Math.max(feel.run, b.vx - a * 2);
    if (b.vx < -feel.run) b.vx = Math.min(-feel.run, b.vx + a * 2);
    if (Math.abs(b.vx) < 0.02) b.vx = 0;
    b.vy = Math.min(feel.maxFall, b.vy + feel.gravity);
  }

  // Jump: buffered press + coyote time; release early for a short hop.
  if (pressedJump) b.buffer = feel.buffer;
  else if (b.buffer > 0) b.buffer--;
  if (b.ground) b.coyote = feel.coyote;
  else if (b.coyote > 0) b.coyote--;
  if (b.buffer > 0 && b.coyote > 0) {
    b.vy = feel.jump;
    b.buffer = 0;
    b.coyote = 0;
    b.dashT = 0;
    events.push({ type: "jump", x: b.x + b.w / 2, y: b.y + b.h });
  }
  if (!(mask & IN.JUMP) && b.vy < 0) b.vy *= feel.jumpCut > 0 && b.vy < -2 ? 0.86 : 1;

  // Horizontal, then vertical, resolving against every solid.
  b.x += b.vx;
  for (let i = 0; i < solids.length; i++) {
    const s = solids[i];
    if (s.oneWay || s.open || !overlaps(b, s)) continue;
    // Standing on it (feet within a hair of its top, e.g. a rising lift): that is
    // the vertical pass's job. Treating it as a wall would shove the rider off.
    if (b.y + b.h - s.y < 1.5) continue;
    if (b.vx > 0) b.x = s.x - b.w;
    else if (b.vx < 0) b.x = s.x + s.w;
    else b.x = b.x + b.w / 2 < s.x + s.w / 2 ? s.x - b.w : s.x + s.w;
    b.vx = 0;
  }
  const wasGround = b.ground;
  const bottomBefore = b.y + b.h;
  const fallSpeed = b.vy;
  b.y += b.vy;
  b.ground = 0;
  b.plat = -1;
  for (let i = 0; i < solids.length; i++) {
    const s = solids[i];
    if (s.open || !overlaps(b, s)) continue;
    if (s.oneWay) {
      // Land on a ledge only when falling onto its top; pressing DOWN drops through.
      if (b.vy < 0 || bottomBefore > s.y - (s.dy || 0) + 0.01 || mask & IN.DOWN) continue;
    }
    if (b.vy >= 0 && bottomBefore <= s.y - (s.dy || 0) + Math.max(1, b.vy) + 0.01) {
      b.y = s.y - b.h;
      b.vy = 0;
      b.ground = 1;
      b.plat = i;
    } else if (b.vy < 0 && !s.oneWay) {
      b.y = s.y + s.h;
      b.vy = 0;
    }
  }
  if (b.ground && !wasGround) {
    b.landed = 0;
    events.push({ type: "land", x: b.x + b.w / 2, y: b.y + b.h, speed: q(fallSpeed) });
  } else if (b.landed < 60) b.landed++;

  b.x = q(b.x);
  b.y = q(b.y);
  b.vx = q(b.vx);
  b.vy = q(b.vy);
}

/** Top-down movement with momentum (couriers, explorers): accel toward input, slide to a stop. */
export function stepTopDown(b, solids, mask, feel) {
  const ax = (mask & IN.RIGHT ? 1 : 0) - (mask & IN.LEFT ? 1 : 0);
  const ay = (mask & IN.DOWN ? 1 : 0) - (mask & IN.UP ? 1 : 0);
  const n = ax && ay ? Math.SQRT1_2 : 1;
  b.vx = (b.vx + ax * n * feel.accel) * (ax ? 1 : feel.friction);
  b.vy = (b.vy + ay * n * feel.accel) * (ay ? 1 : feel.friction);
  const sp = Math.hypot(b.vx, b.vy);
  if (sp > feel.max) {
    b.vx = (b.vx / sp) * feel.max;
    b.vy = (b.vy / sp) * feel.max;
  }
  if (sp < 0.03) b.vx = b.vy = 0;
  if (ax || ay) b.heading = Math.atan2(ay, ax);
  b.x += b.vx;
  for (const s of solids) {
    if (s.open || !overlaps(b, s)) continue;
    b.x = b.vx > 0 ? s.x - b.w : s.x + s.w;
    b.vx = 0;
  }
  b.y += b.vy;
  for (const s of solids) {
    if (s.open || !overlaps(b, s)) continue;
    b.y = b.vy > 0 ? s.y - b.h : s.y + s.h;
    b.vy = 0;
  }
  b.x = q(b.x);
  b.y = q(b.y);
  b.vx = q(b.vx);
  b.vy = q(b.vy);
}
