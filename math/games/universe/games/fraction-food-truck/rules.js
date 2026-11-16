// Fraction Food Truck — simulation rules. No DOM. Deterministic.
//
// Player action -> mathematics -> state change -> visible result:
//   set "4 bowls" for 3 cups of soup in 3/4-cup portions and serve -> the
//   ladle takes 3/4 cup from the pot for each bowl in turn -> every bowl full
//   and the pot empty; with 5 bowls the last one gets nothing, with 3 a bowl's
//   worth of soup stays in the pot.

import { stepBody } from "../../runtime/physics.js";
import { FLOOR } from "./levels.js";
import { div, eq, F, isZero, mul, portions, serveCount, slipOf, sub, text } from "./math.js";

export const LADLE_TICKS = 34;

export const order = (w) => w.orders[w.current] || null;

/** The amount each serving should get, and how many servings, for the order as answered. */
function plan(o, a) {
  if (o.kind === "share") return serveCount(o.total, a.each, o.plates);
  return serveCount(o.total, o.portion, a.count);
}

function judge(o, a, result) {
  if (o.kind === "share") return eq(mul(a.each, F(o.plates)), o.total);
  if (o.kind === "full") return a.count === portions(o.total, o.portion).whole;
  return result.got.every((g) => eq(g, o.portion)) && isZero(result.rest);
}

function step(w, mask, prevMask, ev) {
  const s = w.serving;
  if (s) {
    s.t++;
    const i = Math.floor(s.t / LADLE_TICKS);
    if (s.t % LADLE_TICKS === 0 && i <= s.got.length)
      ev.push({
        type: "ladle",
        i: i - 1,
        short: i - 1 < s.got.length && !eq(s.got[i - 1], s.full),
      });
    if (i > s.got.length + 1) finish(w, ev);
  }
  stepBody(w.p, w.solids, mask, prevMask, ev);
}

function finish(w, ev) {
  const s = w.serving;
  const o = order(w);
  const ok = s.ok;
  const answer = o.kind === "share" ? s.each : F(s.count);
  const shortBowls = s.got.filter((g) => !eq(g, s.full)).length;
  ev.push({
    type: "outcome",
    ok,
    key: ok ? (o.kind === "full" ? "fullOk" : "served") : shortBowls ? "short" : "leftover",
    vars: { answer: text(answer), rest: text(s.rest), short: shortBowls },
    mechanic:
      o.kind === "share"
        ? "share-division"
        : o.kind === "full"
          ? "division-remainder"
          : "measurement-division",
    lesson: ["6-1", "6-2", "6-11"][w.level],
    misconception: ok ? undefined : slipOf(o, answer),
    detail: {
      total: text(o.total),
      portion: o.portion && text(o.portion),
      plates: o.plates,
      answer: text(answer),
    },
  });
  w.served.push({ order: w.current, ok, got: s.got, rest: s.rest, full: s.full });
  w.serving = null;
  if (ok) {
    w.current++;
    ev.push({ type: "nextOrder" });
    if (!order(w) && !w.done) {
      w.done = 1;
      ev.push({ type: "complete" });
    }
  }
}

function apply(w, a, ev) {
  switch (a.type) {
    case "serve": {
      const o = order(w);
      if (!o || w.serving) return;
      const result = plan(o, a);
      w.serving = {
        t: 0,
        count: a.count ?? o.plates,
        each: a.each ? F(a.each.n, a.each.d) : null,
        got: result.got,
        rest: result.rest,
        full: o.kind === "share" ? F(a.each.n, a.each.d) : o.portion,
        ok: judge(o, a.each ? { each: F(a.each.n, a.each.d) } : a, result),
      };
      ev.push({ type: "serve" });
      return;
    }
    case "travel":
      w.p.x = a.x - w.p.w / 2;
      w.p.y = FLOOR - w.p.h;
      w.p.vx = w.p.vy = 0;
      return;
  }
}

export const rules = { step, apply };
export { div, portions, sub };
