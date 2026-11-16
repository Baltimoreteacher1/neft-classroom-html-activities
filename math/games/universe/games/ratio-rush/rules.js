// Ratio Rush — simulation rules. No DOM. Deterministic: everything lives in
// the world, and every position on a run is computed from elapsed ticks and
// the exact rate (never accumulated), so two equivalent rates stay in exact
// lockstep for as long as they run.
//
// Player action -> mathematics -> state change -> visible result:
//   set a gear d : t -> the train covers d miles every t minutes -> it leaves
//   the signal beside the partner train -> they stay side by side only if
//   d : t is equivalent to the partner's rate, and the crane couples them only
//   if they arrive at the same moment.

import { IN, q } from "../../runtime/sim.js";
import { additive, equivalent } from "./math.js";
import { LANE_Y, TICKS_PER_MIN } from "./levels.js";

const DRIVE_MAX = 2.4 / TICKS_PER_MIN; // miles per tick when driving by hand
const DRIVE_ACCEL = 0.0016;
const DRIVE_BRAKE = 0.0032;
const RESET_SPEED = 3 / TICKS_PER_MIN;
const ZONE = 0.45; // miles either side of a stop where the train can use it

export const stopAt = (w, id) => w.stops.find((s) => s.id === id);

/** The stop the train is standing at (stopped, in its zone, on its lane), or null. */
export function standingAt(w) {
  const tr = w.train;
  if (tr.mode !== "drive" || Math.abs(tr.v) > 0.0004 || tr.laneT) return null;
  return (
    w.stops.find(
      (s) => !s.done && s.lane === tr.lane && Math.abs(tr.x - s.x) < ZONE,
    ) || null
  );
}

/** First unfinished stop: the train may not drive past it. */
export function nextStop(w) {
  return w.stops.find((s) => !s.done) || null;
}

/** Miles covered after `elapsed` ticks at rate d miles per t minutes (exact, then snapped). */
export function covered(rate, elapsed) {
  return q((rate.d * elapsed) / (rate.t * TICKS_PER_MIN));
}

/** Tick count (from launch) at which a rate covers `miles`: exact rational ceiling. */
export function arrivalTicks(rate, miles) {
  return Math.ceil((miles * rate.t * TICKS_PER_MIN) / rate.d);
}

function outcome(ev, o) {
  ev.push({ type: "outcome", ...o });
}

// ---------- runs ----------
function launch(w, s, ev) {
  w.lastStop = s.id;
  const tr = w.train;
  tr.mode = "run";
  tr.v = 0;
  tr.x = s.x;
  if (s.kind === "couple") {
    w.run = {
      stop: s.id,
      kind: "couple",
      t0: w.tick,
      x0: s.x,
      rate: { ...s.gear },
      partner: { ...s.partner },
      you: 0,
      them: 0,
      youAt: -1,
      themAt: -1,
    };
  } else if (s.kind === "junction") {
    const mine = s.branch === 1 ? s.upper : s.lower;
    const rival = s.branch === 1 ? s.lower : s.upper;
    w.run = {
      stop: s.id,
      kind: "junction",
      t0: w.tick,
      x0: s.x,
      branch: s.branch,
      mine: { ...mine },
      rival: { ...rival },
      you: 0,
      them: 0,
      youAt: -1,
      themAt: -1,
    };
  } else {
    w.run = {
      stop: s.id,
      kind: "depot",
      t0: w.tick,
      x0: s.x,
      // charge carries the train cells × d / t miles; it runs at 2 miles a minute
      reach: (s.cells * s.rate.d) / s.rate.t,
      you: 0,
      youAt: -1,
    };
  }
  ev.push({ type: "launch", kind: s.kind });
}

function finishCouple(w, s, r, ev) {
  const ok = r.youAt === r.themAt;
  let misconception;
  const g = r.rate;
  const p = r.partner;
  if (!ok) {
    if (g.d !== p.d && g.d - p.d === g.t - p.t)
      misconception = "ratio-scaled-additively";
    else if (g.d * p.d === g.t * p.t) misconception = "ratio-inverted";
  }
  outcome(ev, {
    ok,
    key: ok ? "coupled" : r.youAt < r.themAt ? "coupleEarly" : "coupleLate",
    vars: {
      name: s.name,
      you: fmtMin(r.youAt),
      them: fmtMin(r.themAt),
      d: g.d,
      t: g.t,
      pd: p.d,
      pt: p.t,
    },
    mechanic: "equivalent-rates",
    lesson: "3-3",
    misconception,
    detail: { gear: g, partner: p, span: s.span },
  });
  if (ok) complete(w, s, ev);
  else returnHome(w);
}

function finishJunction(w, s, r, ev) {
  const ok = r.youAt < r.themAt;
  outcome(ev, {
    ok,
    key: ok ? "junctionWin" : "junctionLose",
    vars: {
      you: fmtMin(r.youAt),
      them: fmtMin(r.themAt),
      branch: r.branch === 1 ? "upper" : "lower",
    },
    mechanic: "compare-rates",
    lesson: "3-5",
    misconception: ok ? undefined : "ratio-compared-without-common-basis",
    detail: { branch: r.branch, mine: r.mine, rival: r.rival },
  });
  if (ok) complete(w, s, ev);
  else returnHome(w);
}

function finishDepot(w, s, r, ev) {
  const need = (s.span * s.rate.t) / s.rate.d;
  const ok = r.reach >= s.span;
  const wasted = ok ? s.cells - need : 0;
  let misconception;
  if (!ok && s.cells === Math.round(s.span / s.rate.d))
    misconception = "rate-not-per-one";
  outcome(ev, {
    ok,
    key: ok ? (wasted > 0 ? "chargeExtra" : "chargeExact") : "chargeShort",
    vars: {
      reach: fmtMiles(Math.min(r.reach, s.span)),
      span: s.span,
      cells: s.cells,
      wasted,
    },
    mechanic: "unit-rate",
    lesson: "3-8",
    misconception,
    detail: { cells: s.cells, span: s.span, rate: s.rate },
  });
  if (ok) complete(w, s, ev);
  else {
    // A tow crew brings the train back. The cells it used are spent.
    w.train.mode = "tow";
  }
}

function complete(w, s, ev) {
  s.done = 1;
  w.train.mode = "drive";
  w.train.x = s.x + s.span + 0.2;
  w.train.v = 0;
  w.run = null;
  ev.push({ type: "stopDone", stop: s.id });
}

function returnHome(w) {
  w.train.mode = "reset";
}

const fmtMin = (ticks) => Math.round((ticks / TICKS_PER_MIN) * 100) / 100;
const fmtMiles = (m) => Math.round(m * 100) / 100;

function stepRun(w, ev) {
  const r = w.run;
  const s = stopAt(w, r.stop);
  const el = w.tick - r.t0;
  if (r.kind === "couple") {
    if (r.youAt < 0) {
      r.you = Math.min(s.span, covered(r.rate, el));
      if (el >= arrivalTicks(r.rate, s.span)) {
        r.you = s.span;
        r.youAt = el;
        ev.push({ type: "arrive", who: "you" });
      }
    }
    if (r.themAt < 0) {
      r.them = Math.min(s.span, covered(r.partner, el));
      if (el >= arrivalTicks(r.partner, s.span)) {
        r.them = s.span;
        r.themAt = el;
        ev.push({ type: "arrive", who: "them" });
      }
    }
    w.train.x = r.x0 + r.you;
    if (r.youAt >= 0 && r.themAt >= 0) finishCouple(w, s, r, ev);
  } else if (r.kind === "junction") {
    if (r.youAt < 0) {
      const d = covered(r.mine.rate, el);
      r.you = Math.min(1, d / r.mine.len);
      if (el >= arrivalTicks(r.mine.rate, r.mine.len)) {
        r.you = 1;
        r.youAt = el;
        ev.push({ type: "arrive", who: "you" });
      }
    }
    if (r.themAt < 0) {
      const d = covered(r.rival.rate, el);
      r.them = Math.min(1, d / r.rival.len);
      if (el >= arrivalTicks(r.rival.rate, r.rival.len)) {
        r.them = 1;
        r.themAt = el;
        ev.push({ type: "arrive", who: "them" });
      }
    }
    w.train.x = r.x0 + r.you * s.span;
    w.train.lane = r.you > 0 && r.you < 1 ? (r.branch === 1 ? 1 : 2) : 0;
    // The race is decided the moment either train reaches the station.
    if (r.youAt >= 0 || r.themAt >= 0) {
      if (r.youAt < 0) r.youAt = Number.MAX_SAFE_INTEGER;
      if (r.themAt < 0) r.themAt = Number.MAX_SAFE_INTEGER;
      if (r.youAt === r.themAt) r.themAt++;
      finishJunction(w, s, r, ev);
    }
  } else {
    const d = Math.min(r.reach, covered({ d: 2, t: 1 }, el));
    r.you = Math.min(s.span, d);
    w.train.x = r.x0 + r.you;
    const end = Math.min(r.reach, s.span);
    if (r.you >= end - 1e-9 && r.youAt < 0) {
      r.youAt = el;
      if (r.reach < s.span) ev.push({ type: "coast" });
      finishDepot(w, s, r, ev);
    }
  }
}

// ---------- driving ----------
function onTrack(w, lane, x) {
  if (lane === 0) return x >= 0 && x <= w.len;
  return w.side.some((s) => s.lane === lane && x >= s.x0 && x <= s.x1);
}

function stepDrive(w, mask, prevMask, ev) {
  const tr = w.train;
  if (tr.bump > 0) {
    tr.bump--;
    return;
  }
  // Lane change at a crossover: Up / Down, a short animated slide.
  if (tr.laneT > 0) {
    tr.laneT--;
    if (tr.laneT === 0) ev.push({ type: "laneDone", lane: tr.lane });
  } else {
    const nearX = w.crossovers.some((c) => Math.abs(c - tr.x) < 0.35);
    const up = mask & IN.UP && !(prevMask & IN.UP);
    const down = mask & IN.DOWN && !(prevMask & IN.DOWN);
    const want = up
      ? tr.lane === 2
        ? 0
        : 1
      : down
        ? tr.lane === 1
          ? 0
          : 2
        : tr.lane;
    if (want !== tr.lane && nearX && onTrack(w, want, tr.x)) {
      tr.from = tr.lane;
      tr.lane = want;
      tr.laneT = 24;
      ev.push({ type: "switch", lane: want });
    } else if ((up || down) && want !== tr.lane) ev.push({ type: "noSwitch" });
  }
  const dir = (mask & IN.RIGHT ? 1 : 0) - (mask & IN.LEFT ? 1 : 0);
  if (dir > 0) tr.v = Math.min(DRIVE_MAX, tr.v + DRIVE_ACCEL);
  else if (dir < 0)
    tr.v =
      tr.v > 0
        ? Math.max(0, tr.v - DRIVE_BRAKE)
        : Math.max(-DRIVE_MAX / 2, tr.v - DRIVE_ACCEL);
  else tr.v *= 0.97;
  if (Math.abs(tr.v) < 0.0002) tr.v = 0;
  if (mask & IN.DASH && tr.v > 0) tr.v = Math.max(0, tr.v - DRIVE_BRAKE * 2);
  if (tr.v) tr.face = tr.v > 0 ? 1 : -1;
  let x = tr.x + tr.v;
  // End of a side track, or the end of the line: buffer stop.
  if (!onTrack(w, tr.lane, x)) {
    x = tr.x;
    if (Math.abs(tr.v) > 0.01)
      ev.push({ type: "buffer", x: tr.x, lane: tr.lane });
    tr.v = 0;
  }
  // A closed signal ahead (the next unfinished stop) halts the train at it.
  const s = nextStop(w);
  if (s && tr.lane === s.lane && x > s.x && tr.x <= s.x + 1e-9) {
    x = s.x;
    if (tr.v > 0.008) ev.push({ type: "signal", stop: s.id });
    tr.v = 0;
  }
  if (s && tr.lane !== 0 && x > s.x - 0.5 && tr.x <= s.x - 0.5) {
    x = s.x - 0.5;
    tr.v = 0;
  }
  tr.x = q(x);
  tr.v = q(tr.v);
  // Maintenance carts share the line: touching one knocks the train back gently.
  for (const c of w.carts) {
    if (c.lane === tr.lane && Math.abs(c.x - tr.x) < 0.45) {
      tr.x = q(tr.x - Math.sign(c.x - tr.x || 1) * 0.5);
      tr.v = 0;
      tr.bump = 30;
      ev.push({ type: "bump", x: tr.x, lane: tr.lane });
    }
  }
  if (
    !w.done &&
    w.stops.every((st) => st.done) &&
    tr.x >= w.exit &&
    tr.lane === 0
  ) {
    w.done = 1;
    ev.push({ type: "complete" });
  }
}

function stepReset(w) {
  const tr = w.train;
  const s = stopAt(w, w.run.stop);
  tr.lane = 0;
  tr.x = q(Math.max(s.x, tr.x - RESET_SPEED * 2));
  if (w.run.kind !== "depot") {
    w.run.you = Math.max(
      0,
      w.run.you - (w.run.kind === "junction" ? 0.06 : RESET_SPEED * 2),
    );
    w.run.them = Math.max(
      0,
      w.run.them - (w.run.kind === "junction" ? 0.06 : RESET_SPEED * 2),
    );
  }
  if (
    tr.x <= s.x &&
    (w.run.kind === "depot" || (w.run.you === 0 && w.run.them === 0))
  ) {
    tr.x = s.x;
    tr.mode = "drive";
    tr.v = 0;
    w.run = null;
  }
}

function step(w, mask, prevMask, ev) {
  for (const c of w.carts) {
    c.x = q(c.x + c.dir * 0.01);
    if (c.x > c.x1) c.dir = -1;
    if (c.x < c.x0) c.dir = 1;
  }
  const tr = w.train;
  if (tr.mode === "drive") stepDrive(w, mask, prevMask, ev);
  else if (tr.mode === "run") stepRun(w, ev);
  else if (tr.mode === "reset" || tr.mode === "tow") stepReset(w);
}

/**
 * A decision sets the condition in the reality the student is in (`only`) and
 * launches EVERY open reality, each with its own condition, so the student
 * watches both versions of the same run.
 */
const mine = (w, a) => a.only === undefined || (w.reality | 0) === a.only;

function apply(w, a, ev) {
  const s = a.stop ? stopAt(w, a.stop) : null;
  switch (a.type) {
    case "gear":
      if (mine(w, a)) s.gear = { d: a.d, t: a.t };
      s.tries++;
      launch(w, s, ev);
      break;
    case "branch":
      if (mine(w, a)) s.branch = a.branch;
      s.tries++;
      launch(w, s, ev);
      break;
    case "load": {
      if (mine(w, a)) s.cells = a.cells;
      if (s.cells > w.budget) {
        ev.push({ type: "refuse", key: "noCells" });
        return;
      }
      w.budget -= s.cells;
      s.tries++;
      launch(w, s, ev);
      break;
    }
    case "travel":
      if (w.train.mode !== "drive") return;
      w.train.x = a.x;
      w.train.lane = 0;
      w.train.v = 0;
      w.train.laneT = 0;
      break;
  }
}

// ---------- the Counterfactual Universe ----------
/** The one condition a Reality Shift may change at the current stop. */
function applyChange(w, change) {
  w.reality = 1;
  const s = stopAt(w, change.stop);
  if (change.variable === "gear") s.gear = { ...change.to };
  if (change.variable === "branch") s.branch = change.to;
  if (change.variable === "cells") s.cells = change.to;
}

/**
 * The stop a comparison is about: the one the train stands at, else the one it
 * last ran (so a run that succeeded in one reality is still compared with the
 * same run in the other), else the next one.
 */
export function focusStop(w) {
  return standingAt(w) || (w.lastStop && stopAt(w, w.lastStop)) || nextStop(w) || w.stops.at(-1);
}

/** What the investigation view compares between the two realities. */
function measure(w) {
  const s = focusStop(w);
  const out = {};
  if (s.kind === "couple") {
    out.yourRate = `${s.gear.d} : ${s.gear.t}`;
    out.partnerRate = `${s.partner.d} : ${s.partner.t}`;
    out.after2 = fmtMiles((s.gear.d * 2) / s.gear.t);
    out.partnerAfter2 = fmtMiles((s.partner.d * 2) / s.partner.t);
    out.arrive = fmtMiles((s.span * s.gear.t) / s.gear.d);
    out.partnerArrive = fmtMiles((s.span * s.partner.t) / s.partner.d);
    out.distance = s.span;
  } else if (s.kind === "junction") {
    const mine = s.branch === 1 ? s.upper : s.lower;
    const rival = s.branch === 1 ? s.lower : s.upper;
    out.branch = s.branch === 1 ? "upper" : "lower";
    out.yourRate = `${mine.rate.d} : ${mine.rate.t}`;
    out.yourLength = mine.len;
    out.arrive = fmtMiles((mine.len * mine.rate.t) / mine.rate.d);
    out.rivalArrive = fmtMiles((rival.len * rival.rate.t) / rival.rate.d);
  } else {
    out.cells = s.cells;
    out.reach = fmtMiles((s.cells * s.rate.d) / s.rate.t);
    out.distance = s.span;
    out.efficiency = `${s.rate.d} : ${s.rate.t}`;
  }
  return out;
}

/** On a reality switch the train keeps its lane and position only when both realities are driving. */
function carry(from, to) {
  if (from.train.mode === "drive" && to.train.mode === "drive") {
    to.train.x = from.train.x;
    to.train.lane = from.train.lane;
  }
}

export const rules = { step, apply, applyChange, measure, carry };
export { additive, equivalent };
export const laneY = (lane) => LANE_Y[lane];
