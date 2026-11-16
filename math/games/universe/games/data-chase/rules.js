// The Data Chase — simulation rules. No DOM. Deterministic.
//
// Player action -> mathematics -> state change -> visible result:
//   ask a question only one person can answer -> one value, no variability
//   -> one source appears and the notebook's dot plot holds a single dot.
//   publish "typical commute: mean 26.4" with a 95-minute outlier in the data
//   -> the fact-checker counts who is below that number -> 8 of 9 are: the
//   headline misleads, and the median would not have.

import { stepBody } from "../../runtime/physics.js";
import { q } from "../../runtime/sim.js";
import { dataFor, FLOOR, QUESTIONS } from "./levels.js";
import {
  countBelow,
  fiveNumbers,
  histogram,
  iqr,
  mean,
  median,
  near,
  num,
  range,
  tallest,
} from "./math.js";

const REACH = 50;

export const sourceX = (s, tick) => s.x + Math.round(Math.sin((tick + s.phase) / 90) * 28);

/** A desk is open once every desk before it is done (and its data is in). */
export function deskOpen(w, d) {
  if (d.done) return false;
  for (const e of w.desks) {
    if (e.id === d.id) break;
    if (!e.done) return false;
  }
  if (d.kind === "question" || d.kind === "mean") return true;
  return w.sources.length > 0 && w.sources.every((s) => s.got);
}

function step(w, mask, prevMask, ev) {
  stepBody(w.p, w.solids, mask, prevMask, ev);
  const p = w.p;
  if (p.x < 0) p.x = 0;
  if (p.x > w.w - p.w) p.x = w.w - p.w;
  if (!w.done && w.desks.every((d) => d.done)) {
    w.done = 1;
    ev.push({ type: "complete" });
  }
}

function outcome(ev, o) {
  ev.push({ type: "outcome", ...o });
}

function apply(w, a, ev) {
  const d = a.desk !== undefined ? w.desks[a.desk] : null;
  // A desk works only when it is open: earlier desks done and its data collected.
  if (d && !deskOpen(w, d) && !(a.type === "question" && !d.done)) {
    ev.push({ type: "refuse", key: "deskLocked" });
    return;
  }
  switch (a.type) {
    case "ask": {
      const s = w.sources.find((x) => x.id === a.source);
      if (!s || s.got) return;
      s.got = 1;
      w.notebook.push({ v: s.v, who: s.who });
      ev.push({ type: "ask", v: s.v });
      if (w.sources.every((x) => x.got)) ev.push({ type: "allData" });
      return;
    }
    case "question": {
      const qn = QUESTIONS.find((x) => x.id === a.q);
      w.question = a.q;
      w.notebook = [];
      w.sources = qn.statistical ? w.trail.map((s) => ({ ...s })) : [{ ...w.lonely }];
      outcome(ev, {
        ok: qn.statistical,
        key: qn.statistical ? "questionOk" : "questionLonely",
        vars: {},
        mechanic: "statistical-question",
        lesson: "2-1",
        misconception: qn.statistical ? undefined : "stat-question-no-variability",
        detail: { question: a.q },
      });
      if (qn.statistical) d.done = 1;
      ev.push({ type: "trail", n: w.sources.length });
      return;
    }
    case "histogram": {
      const data = dataFor(w, d);
      const bins = histogram(data, a.width);
      const ok = tallest(bins).some((b) => b.from === a.from);
      d.answer = { width: a.width, from: a.from };
      outcome(ev, {
        ok,
        key: ok ? "histOk" : "histNo",
        vars: { from: a.from, to: a.from + a.width },
        mechanic: "histogram",
        lesson: "2-2",
        misconception: ok ? undefined : "stat-frequency-vs-value",
        detail: { width: a.width, bins: bins.map((b) => b.n) },
      });
      if (ok) d.done = 1;
      return;
    }
    case "headline": {
      const data = dataFor(w, d);
      const m = a.measure === "median" ? median(data) : mean(data);
      const right = a.measure === "median" && near(a.value, median(data));
      // The stepper moves in halves: the mean (26.4…) counts when it is the nearest half.
      const misleading = a.measure === "mean" && Math.abs(a.value - mean(data)) <= 0.25 + 1e-9;
      d.answer = {
        measure: a.measure,
        value: a.value,
        below: countBelow(data, a.value),
        n: data.length,
      };
      outcome(ev, {
        ok: right,
        key: right
          ? "headlineOk"
          : misleading
            ? "headlineMisleads"
            : near(a.value, m)
              ? "headlineOk"
              : "headlineWrong",
        vars: { value: num(a.value), below: countBelow(data, a.value), n: data.length },
        mechanic: "choose-measure",
        lesson: "2-10",
        misconception: right ? undefined : misleading ? "stat-mean-skewed-by-outlier" : undefined,
        detail: { measure: a.measure, value: a.value },
      });
      if (right) d.done = 1;
      return;
    }
    case "mean": {
      const data = dataFor(w, d);
      const ok = near(a.value, mean(data));
      const sum = data.reduce((s, v) => s + v, 0);
      outcome(ev, {
        ok,
        key: ok ? "meanOk" : "meanNo",
        vars: { value: num(a.value) },
        mechanic: "mean",
        lesson: "2-8",
        misconception: ok
          ? undefined
          : near(a.value, sum)
            ? "stat-summed-instead-of-averaged"
            : near(a.value, median(data))
              ? "stat-mean-vs-median"
              : undefined,
        detail: { value: a.value },
      });
      if (ok) d.done = 1;
      return;
    }
    case "boxplot": {
      const data = dataFor(w, d);
      const want = fiveNumbers(data);
      const got = a.five;
      const wrong = Object.keys(want).filter((k) => !near(got[k], want[k]));
      d.answer = got;
      outcome(ev, {
        ok: wrong.length === 0,
        key: wrong.length ? "boxNo" : "boxOk",
        vars: { wrong: wrong.join(", "), set: d.set },
        mechanic: "box-plot",
        lesson: "2-4",
        misconception:
          wrong.length && near(got.q3 - got.q1, range(data)) ? "stat-range-for-iqr" : undefined,
        detail: { five: got },
      });
      if (!wrong.length) d.done = 1;
      return;
    }
    case "compare": {
      const north = w.notebook.filter((n) => n.who === "north").map((n) => n.v);
      const south = w.notebook.filter((n) => n.who === "south").map((n) => n.v);
      const steadier = iqr(north) < iqr(south) ? "north" : "south";
      const byRange = range(north) < range(south) ? "north" : "south";
      const ok = a.pick === steadier;
      outcome(ev, {
        ok,
        key: ok ? "compareOk" : "compareNo",
        vars: { pick: a.pick, iqrN: num(iqr(north)), iqrS: num(iqr(south)) },
        mechanic: "compare-spread",
        lesson: "2-5",
        misconception: !ok && a.pick === byRange ? "stat-range-for-iqr" : undefined,
        detail: { pick: a.pick },
      });
      if (ok) d.done = 1;
      return;
    }
    case "travel":
      w.p.x = a.x - w.p.w / 2;
      w.p.y = (a.y ?? FLOOR) - w.p.h;
      w.p.vx = w.p.vy = 0;
      return;
  }
}

export const rules = { step, apply };
export { q };
