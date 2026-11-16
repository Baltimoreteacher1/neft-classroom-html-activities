// Balance Breakout — simulation rules. No DOM. Deterministic.
//
// Player action -> mathematics -> state change -> visible result:
//   use the Twin Crane to lift a 3 off BOTH pans -> x + 3 = 8 becomes x = 5
//   -> both pans lose the same weight -> the beam stays level, the crate now
//   stands alone, and the door's reader weighs it: 5.
//   Take a 3 off ONE pan -> the sides are no longer equal -> the beam tips
//   toward the heavier pan and the door's lock jams until balance returns.

import { FEEL, stepBody } from "../../runtime/physics.js";
import { q } from "../../runtime/sim.js";
import {
  balanced,
  cancelPairs,
  doubled,
  equationText,
  isolated,
  isolatedValue,
  oneGroup,
  splittable,
  weight,
} from "./math.js";
import { FLOOR, PAN_DX } from "./levels.js";

const TILT_PER_UNIT = 0.035;
const TILT_MAX = 0.32;

export const roomAt = (w, i) => w.rooms[i];
export const isLevel = (r) => balanced(r.left, r.right, r.x);
export const panOf = (r, pan) => (pan === "left" ? r.left : r.right);

/** The room the player is in. */
export function currentRoom(w) {
  const px = w.p.x + w.p.w / 2;
  let best = w.rooms[0];
  for (const r of w.rooms) if (px >= r.x0) best = r;
  return best;
}

/** A carried block weighs the player down: a lower jump and a slower run. */
function feelFor(w) {
  if (!w.carry) return FEEL;
  const v = Math.abs(w.carry.v || 0);
  const k = Math.max(0.72, 1 - 0.035 * v);
  return { ...FEEL, jump: FEEL.jump * k, run: FEEL.run * Math.max(0.8, k) };
}

function stepBeams(w) {
  for (const r of w.rooms) {
    // The beam tips toward the heavier pan, in proportion to the difference.
    const diff = weight(r.left, r.x) - weight(r.right, r.x);
    const target = Math.max(-TILT_MAX, Math.min(TILT_MAX, diff * TILT_PER_UNIT));
    r.av = q((r.av + (target - r.angle) * 0.02) * 0.9);
    r.angle = q(r.angle + r.av);
  }
}

/** Pan height (top of its plate) given the beam's angle: left goes down when heavier. */
export function panY(r, pan) {
  const lift = Math.sin(r.angle) * PAN_DX;
  return FLOOR - 70 + (pan === "left" ? lift : -lift);
}

function settleRoom(w, r, ev, before) {
  // A balloon and a block of the same size on one pan cancel out: they pop together.
  for (const pan of ["left", "right"]) {
    const items = panOf(r, pan);
    const kept = cancelPairs(items);
    if (kept.length !== items.length) {
      items.length = 0;
      items.push(...kept);
      ev.push({ type: "pop", room: r.i, pan });
    }
  }
  const level = isLevel(r);
  const gate = w.solids[r.gate];
  if (before && !level) ev.push({ type: "tilt", room: r.i });
  if (!before && level) ev.push({ type: "level", room: r.i });
  if (r.mode === "isolate" && !r.solved && level && isolated(r.left, r.right)) {
    r.solved = 1;
    gate.open = 1;
    ev.push({
      type: "outcome",
      ok: true,
      key: "isolated",
      vars: { x: isolatedValue(r.left, r.right), eq: equationText(r.left, r.right) },
      mechanic: "isolate-x",
      lesson: w.level === 1 ? "8-2" : "8-3",
      detail: { x: r.x },
    });
    ev.push({ type: "solved", room: r.i });
  }
}

function step(w, mask, prevMask, ev) {
  stepBeams(w);
  const p = w.p;
  stepBody(p, w.solids, mask, prevMask, ev, feelFor(w));
  if (p.x < 0) p.x = 0;
  if (p.x > w.w - p.w) p.x = w.w - p.w;
  if (p.ground && w.tick % 20 === 0) {
    w.safe.x = p.x;
    w.safe.y = p.y;
  }
  if (p.y > w.h + 80) {
    p.x = w.safe.x;
    p.y = w.safe.y - 2;
    p.vx = p.vy = 0;
    ev.push({ type: "respawn" });
  }
  for (const c of w.checkpoints) {
    if (!c.hit && Math.abs(p.x + p.w / 2 - c.x) < 40) {
      c.hit = 1;
      ev.push({ type: "checkpoint", id: c.id });
    }
  }
  const e = w.exit;
  if (!w.done && w.rooms.every((r) => r.solved) && p.x + p.w > e.x && p.x < e.x + e.w) {
    w.done = 1;
    ev.push({ type: "complete" });
  }
}

const mech = (w) => (w.level === 0 ? "equation-solution" : "equality-transform");
const lesson = (w) => ["8-1", "8-2", "8-3"][w.level];

/** A change to ONE pan in a room that must stay level: the beam tips, and that is the outcome. */
function oneSided(w, r, ev, before, what) {
  if (r.mode === "isolate" && before && !isLevel(r))
    ev.push({
      type: "outcome",
      ok: false,
      key: "tilted",
      vars: { what, eq: equationText(r.left, r.right) },
      mechanic: mech(w),
      lesson: lesson(w),
      detail: { oneSided: what },
    });
}

function apply(w, a, ev) {
  const r = a.room !== undefined ? roomAt(w, a.room) : null;
  const before = r ? isLevel(r) : false;
  switch (a.type) {
    case "rackTake": {
      const rack = r.racks[a.rack];
      if (w.carry || !rack.items[a.index]) return;
      w.carry = rack.items.splice(a.index, 1)[0];
      ev.push({ type: "pickup" });
      return;
    }
    case "rackPut": {
      if (!w.carry) return;
      r.racks[a.rack].items.push(w.carry);
      w.carry = null;
      ev.push({ type: "putdown" });
      return;
    }
    case "take": {
      const items = panOf(r, a.pan);
      const it = items[a.index];
      if (w.carry || !it || it.k === "x" || it.k === "half" || it.k === "b") return;
      items.splice(a.index, 1);
      w.carry = it;
      ev.push({ type: "pickup" });
      oneSided(w, r, ev, before, `−${it.v}`);
      break;
    }
    case "put": {
      if (!w.carry) return;
      panOf(r, a.pan).push(w.carry);
      const v = w.carry.v;
      w.carry = null;
      ev.push({ type: "putdown" });
      oneSided(w, r, ev, before, `+${v}`);
      break;
    }
    case "craneRemove": {
      const li = r.left.findIndex((it) => it.k === "w" && it.v === a.v);
      const ri = r.right.findIndex((it) => it.k === "w" && it.v === a.v);
      if (li < 0 || ri < 0) {
        ev.push({ type: "refuse", key: "craneNeedsBoth", vars: { v: a.v } });
        return;
      }
      r.left.splice(li, 1);
      r.right.splice(ri, 1);
      ev.push({ type: "crane", room: r.i, v: a.v, dir: -1 });
      ev.push({
        type: "outcome",
        ok: true,
        key: "craneRemoved",
        vars: { v: a.v, eq: equationText(r.left, r.right) },
        mechanic: "equality-transform",
        lesson: lesson(w),
        detail: { remove: a.v },
      });
      break;
    }
    case "craneAdd": {
      const pi = r.pairs.indexOf(a.v);
      if (pi < 0) return;
      r.pairs.splice(pi, 1);
      r.left.push({ k: "w", v: a.v });
      r.right.push({ k: "w", v: a.v });
      ev.push({ type: "crane", room: r.i, v: a.v, dir: 1 });
      // Adding moves toward x alone only when it cancels a balloon on x's side.
      const useful =
        r.left.some((it) => it.k === "b" && it.v === a.v) ||
        r.right.some((it) => it.k === "b" && it.v === a.v);
      ev.push({
        type: "outcome",
        ok: useful,
        key: useful ? "craneAdded" : "craneAddedAway",
        vars: { v: a.v },
        mechanic: "equality-transform",
        lesson: lesson(w),
        misconception: useful ? undefined : "equation-not-inverse-operation",
        detail: { add: a.v },
      });
      break;
    }
    case "change": {
      const items = panOf(r, a.pan);
      const it = items[a.index];
      if (!it || it.k !== "w" || a.a < 1 || a.a >= it.v) return;
      items.splice(a.index, 1, { k: "w", v: a.a }, { k: "w", v: it.v - a.a });
      ev.push({ type: "change", room: r.i, pan: a.pan });
      break;
    }
    case "divide": {
      if (!splittable(r.left, a.k) || !splittable(r.right, a.k)) {
        ev.push({ type: "refuse", key: "cannotSplit", vars: { k: a.k } });
        ev.push({
          type: "outcome",
          ok: false,
          key: "cannotSplit",
          vars: { k: a.k },
          mechanic: "equality-transform",
          lesson: lesson(w),
          detail: { divide: a.k },
        });
        return;
      }
      const l = oneGroup(r.left, a.k);
      const rr = oneGroup(r.right, a.k);
      r.left.splice(0, r.left.length, ...l);
      r.right.splice(0, r.right.length, ...rr);
      ev.push({ type: "divide", room: r.i, k: a.k });
      ev.push({
        type: "outcome",
        ok: true,
        key: "divided",
        vars: { k: a.k, eq: equationText(r.left, r.right) },
        mechanic: "equality-transform",
        lesson: lesson(w),
        detail: { divide: a.k },
      });
      break;
    }
    case "double": {
      // Doubling moves toward x alone only when it turns a half-crate into a whole one.
      const hadHalf = r.left.some((it) => it.k === "half") || r.right.some((it) => it.k === "half");
      const l = doubled(r.left);
      const rr = doubled(r.right);
      r.left.splice(0, r.left.length, ...l);
      r.right.splice(0, r.right.length, ...rr);
      ev.push({ type: "double", room: r.i });
      ev.push({
        type: "outcome",
        ok: hadHalf,
        key: hadHalf ? "doubled" : "doubledAway",
        vars: { eq: equationText(r.left, r.right) },
        mechanic: "equality-transform",
        lesson: lesson(w),
        misconception: hadHalf ? undefined : "equation-not-inverse-operation",
        detail: { double: true },
      });
      break;
    }
    case "keypad": {
      const level = isLevel(r);
      const ok = level && a.value === r.x;
      let misconception;
      if (!ok && level) {
        const given = [...r.left, ...r.right]
          .filter((it) => it.k === "w")
          .reduce((s, it) => s + it.v, 0);
        const rightTotal = weight(r.right, r.x);
        if (a.value === rightTotal || a.value === given)
          misconception = "equation-answered-with-given-number";
      }
      ev.push({
        type: "outcome",
        ok,
        key: !level ? "keypadTilted" : ok ? "keypadOk" : "keypadWrong",
        vars: { value: a.value, eq: equationText(r.left, r.right) },
        mechanic: "equation-solution",
        lesson: "8-1",
        misconception,
        detail: { value: a.value, eq: equationText(r.left, r.right) },
      });
      if (ok) {
        r.solved = 1;
        w.solids[r.gate].open = 1;
        ev.push({ type: "solved", room: r.i });
      }
      return;
    }
    case "travel": {
      w.p.x = a.x - w.p.w / 2;
      w.p.y = FLOOR - w.p.h;
      w.p.vx = w.p.vy = 0;
      w.safe.x = w.p.x;
      w.safe.y = w.p.y;
      return;
    }
  }
  if (r) settleRoom(w, r, ev, before);
}

export const rules = { step, apply };
