// Coordinate Couriers — simulation rules. No DOM. Deterministic.
//
// Player action -> mathematics -> state change -> visible result:
//   drive to the street corner you read as (−3, 4) and deliver -> the address
//   is compared with the point you are standing on -> the customer takes the
//   parcel, or tells you which point you are really at.
//   set a cable car to 6 units between (−3, 2) and (−3, −4) -> the car runs
//   exactly 6 units along the street -> it docks, or stops over the river.
//   step on the mirror pad at (4, −3) and reflect across the y-axis -> you
//   arrive at (−4, −3) inside a walled district.

import { overlaps, stepTopDown } from "../../runtime/physics.js";
import { q } from "../../runtime/sim.js";
import { fromPx, toPx, UNIT, wet } from "./levels.js";
import { absDifference, gridDistance, pointText, reflect, same, slipOf } from "./math.js";

const FEEL = { accel: 0.42, friction: 0.84, max: 3.8 };
const RIDE_SPEED = 2.4 / 60; // units per tick
const CATCH = 0.24; // units: how close counts as standing on a point
const WARP_TICKS = 42;

/** Where the player stands, in map units. */
export function here(w) {
  return fromPx(w.p.x + w.p.w / 2, w.p.y + w.p.h / 2);
}

/** The street point (intersection or half-block) the player is standing on, or null. */
export function spot(w) {
  const h = here(w);
  const x = Math.round(h.x * 2) / 2;
  const y = Math.round(h.y * 2) / 2;
  if (Math.abs(h.x - x) > CATCH || Math.abs(h.y - y) > CATCH) return null;
  if (!Number.isInteger(x) && !Number.isInteger(y)) return null;
  return { x, y };
}

const roundPoint = (p) => ({ x: Math.round(p.x), y: Math.round(p.y) });
const key = (p) => `${p.x},${p.y}`;

/**
 * Can you drive from street point a to street point b? Breadth-first over the
 * intersections: neighbours are one unit apart, unless the street between them
 * is under water or either corner is fenced.
 */
export function connected(w, a, b) {
  const fenced = new Set(w.fences.map(key));
  const start = roundPoint(a);
  const goal = roundPoint(b);
  if (fenced.has(key(goal)) || fenced.has(key(start))) return key(start) === key(goal);
  const seen = new Set([key(start)]);
  const queue = [start];
  while (queue.length) {
    const p = queue.shift();
    if (key(p) === key(goal)) return true;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const n = { x: p.x + dx, y: p.y + dy };
      if (Math.abs(n.x) > 6 || Math.abs(n.y) > 6 || seen.has(key(n)) || fenced.has(key(n))) continue;
      if (wet(w.water, { x: p.x + dx / 2, y: p.y + dy / 2 }) || wet(w.water, n)) continue;
      seen.add(key(n));
      queue.push(n);
    }
  }
  return false;
}

export const nextDelivery = (w) => w.deliveries.find((d) => !d.done) || null;

/** The cable station the player stands at: { cable, end: "a" | "b" }. */
export function stationAt(w) {
  const s = spot(w);
  if (!s || w.ride) return null;
  for (const c of w.cables) {
    if (same(c.a, s)) return { cable: c, end: "a" };
    if (same(c.b, s) && c.done) return { cable: c, end: "b" };
  }
  return null;
}

export function padAt(w) {
  const s = spot(w);
  if (!s || w.warp) return null;
  return w.pads.find((p) => same(p, s)) || null;
}

function place(w, pt) {
  const c = toPx(pt);
  w.p.x = q(c.X - w.p.w / 2);
  w.p.y = q(c.Y - w.p.h / 2);
  w.p.vx = 0;
  w.p.vy = 0;
}

function stepCars(w, ev) {
  for (const c of w.cars) {
    const len = gridDistance(c.from, c.to);
    c.t = q(c.t + (c.dir * c.speed) / 60 / len);
    if (c.t > 1) {
      c.t = 1;
      c.dir = -1;
    }
    if (c.t < 0) {
      c.t = 0;
      c.dir = 1;
    }
    const at = { x: c.from.x + (c.to.x - c.from.x) * c.t, y: c.from.y + (c.to.y - c.from.y) * c.t };
    const px = toPx(at);
    const box = { x: px.X - 16, y: px.Y - 16, w: 32, h: 32 };
    if (!w.ride && !w.warp && w.p.bump === 0 && overlaps(w.p, box)) {
      const dx = w.p.x + w.p.w / 2 - px.X;
      const dy = w.p.y + w.p.h / 2 - px.Y;
      const d = Math.hypot(dx, dy) || 1;
      w.p.vx = q((dx / d) * 6);
      w.p.vy = q((dy / d) * 6);
      w.p.bump = 24;
      ev.push({ type: "bump" });
    }
  }
}

/** What the student sees when the car stops: docked, short of the station, or past it. */
function cableOutcome(c, L) {
  const dist = gridDistance(c.a, c.b);
  const ok = L === dist;
  const crosses = (c.a.x === c.b.x ? c.a.y * c.b.y : c.a.x * c.b.x) < 0;
  return {
    type: "outcome",
    ok,
    key: ok ? "cableOk" : L < dist ? "cableShort" : "cableLong",
    vars: { L, from: pointText(c.a), to: pointText(c.b) },
    mechanic: "grid-distance",
    lesson: "7-6",
    misconception: !ok && crosses && L === absDifference(c.a, c.b) ? "sign-dropped" : undefined,
    detail: { L, a: c.a, b: c.b },
  };
}

function stepRide(w, ev) {
  const r = w.ride;
  const c = w.cables.find((x) => x.id === r.cable);
  const from = r.end === "a" ? c.a : c.b;
  const to = r.end === "a" ? c.b : c.a;
  const dist = gridDistance(c.a, c.b);
  const ux = Math.sign(to.x - from.x);
  const uy = Math.sign(to.y - from.y);
  if (r.phase === "out") {
    r.d = q(Math.min(r.d + RIDE_SPEED, Math.min(r.L, dist + 0.6)));
    place(w, { x: from.x + ux * r.d, y: from.y + uy * r.d });
    if (r.d >= Math.min(r.L, dist + 0.6) - 1e-9) {
      ev.push(cableOutcome(c, r.L));
      if (r.L === dist) {
        c.done = 1;
        w.ride = null;
        place(w, to);
        ev.push({ type: "dock", cable: c.id });
        return;
      }
      r.phase = "hang";
      r.wait = 40;
      ev.push({
        type: r.L < dist ? "short" : "overshoot",
        over: wet(w.water, { x: from.x + ux * r.d, y: from.y + uy * r.d }),
      });
    }
  } else if (r.phase === "hang") {
    if (--r.wait <= 0) r.phase = "back";
  } else {
    r.d = q(Math.max(0, r.d - RIDE_SPEED * 1.5));
    place(w, { x: from.x + ux * r.d, y: from.y + uy * r.d });
    if (r.d <= 0) {
      w.ride = null;
      ev.push({ type: "returned" });
    }
  }
}

function stepWarp(w, ev) {
  const k = ++w.warp.t;
  if (k === Math.floor(WARP_TICKS / 2)) place(w, w.warp.to);
  if (k >= WARP_TICKS) {
    w.warp = null;
    ev.push({ type: "warped" });
  }
}

function step(w, mask, prevMask, ev) {
  stepCars(w, ev);
  if (w.ride) return stepRide(w, ev);
  if (w.warp) return stepWarp(w, ev);
  const p = w.p;
  if (p.bump > 0) {
    p.bump--;
    stepTopDown(p, w.solids, 0, FEEL);
    return;
  }
  stepTopDown(p, w.solids, mask, FEEL);
}

function apply(w, a, ev) {
  switch (a.type) {
    case "deliver": {
      const d = nextDelivery(w);
      if (!d) return;
      const ok = same(d, a.at);
      ev.push({
        type: "outcome",
        ok,
        key: ok ? "delivered" : "wrongDoor",
        vars: { at: pointText(a.at), address: pointText(d) },
        mechanic: "ordered-pairs",
        lesson:
          w.level === 0
            ? Number.isInteger(d.x) && Number.isInteger(d.y)
              ? "7-8"
              : "7-5"
            : w.level === 1
              ? "7-6"
              : "7-9",
        misconception: ok ? undefined : slipOf(d, a.at) || undefined,
        detail: { address: d, at: a.at },
      });
      if (ok) {
        d.done = 1;
        ev.push({ type: "checkpoint", id: `d${w.deliveries.indexOf(d)}` });
        if (!nextDelivery(w) && !w.done) {
          w.done = 1;
          ev.push({ type: "complete" });
        }
      }
      return;
    }
    case "cable": {
      const c = w.cables.find((x) => x.id === a.cable);
      c.tries++;
      w.ride = { cable: c.id, end: a.end, L: a.L, d: 0, phase: "out", wait: 0 };
      ev.push({ type: "ride" });
      return;
    }
    case "mirror": {
      const pad = w.pads[a.pad];
      const to = reflect(pad, a.axis);
      const land = w.pads.find((p) => same(p, to));
      ev.push({
        type: "outcome",
        ok: !!land,
        key: land ? "mirrorOk" : "mirrorNoPad",
        vars: { from: pointText(pad), to: pointText(to), axis: a.axis },
        mechanic: "reflection",
        lesson: "7-9",
        detail: { from: pad, axis: a.axis, to },
      });
      if (land) {
        w.warp = { t: 0, from: { ...pad }, to };
        ev.push({ type: "warp" });
      }
      return;
    }
    case "travel": {
      // "Guide me there" only drives the streets: it never crosses water or a fence.
      const from = spot(w) || roundPoint(here(w));
      if (w.ride || w.warp || !connected(w, from, a)) return;
      place(w, { x: a.x, y: a.y });
      return;
    }
  }
}

export const rules = { step, apply };
export { UNIT };
