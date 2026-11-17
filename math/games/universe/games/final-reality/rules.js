// The Final Reality — simulation rules. No DOM. Deterministic.
//
// Player action -> mathematics -> state change -> visible result:
//   at the barrier console set x ≥ 7 and x < 12 -> the Engine tests its seven
//   access codes against both dials -> exactly 7, 8 and 11 pass -> the barrier
//   ring collapses; any other setting lets a wrong code through and the ring
//   holds. The other rings work the same way with the year's other systems.
//   The mathematics is shared with the other Math Universe games (inequality
//   rules from Inequality Invasion, expression lines from Expression Factory).

import { stepBody } from "../../runtime/physics.js";
import { q } from "../../runtime/sim.js";
import { equivalent } from "../expression-factory/math.js";
import { passesAll, ruleText, slipOf } from "../inequality-invasion/math.js";
import { FLOOR } from "./levels.js";

export const current = (w) => w.stages[w.stage] || null;

function outcome(ev, o) {
  ev.push({ type: "outcome", ...o });
}

function solveStage(w, s, ev) {
  s.done = 1;
  w.stage++;
  ev.push({ type: "ringDown", stage: s.i });
  // Each ring that falls makes the Engine's pulses slower: calmer as it unravels.
  w.pulse.period = 360 + w.stage * 90;
  if (!current(w) && !w.done) {
    w.done = 1;
    w.pulse.period = 0;
    ev.push({ type: "complete" });
  }
}

function step(w, mask, prevMask, ev) {
  const p = w.p;
  // Floor pulses: a glow at the Engine's base 70 ticks before, then a wave out to both walls.
  const P = w.pulse;
  if (P.period) {
    P.t = (P.t + 1) % P.period;
    if (P.t === P.period - 70) ev.push({ type: "pulseWarn" });
    if (P.t === 0) {
      P.x = 0;
      ev.push({ type: "pulse" });
    }
    if (P.x >= 0) {
      P.x = q(P.x + 4.2);
      if (P.x > 760) P.x = -1;
      else {
        const cx = p.x + p.w / 2;
        if (w.stun === 0 && p.y + p.h > FLOOR - 24 && Math.abs(Math.abs(cx - 720) - P.x) < 16) {
          w.stun = 28;
          p.vx = cx < 720 ? -5 : 5;
          p.vy = -6;
          ev.push({ type: "bump" });
        }
      }
    }
  }
  let m = mask;
  if (w.stun > 0) {
    w.stun--;
    m = 0;
  }
  stepBody(p, w.solids, m, w.stun > 0 ? 0 : prevMask, ev);
}

function apply(w, a, ev) {
  if (a.type === "travel") {
    w.p.x = a.x - w.p.w / 2;
    w.p.y = (a.y ?? FLOOR) - w.p.h;
    w.p.vx = w.p.vy = 0;
    return;
  }
  // Rings fall in order: a console for a later ring is not live yet.
  const s = current(w);
  if (!s || a.stage !== s.i) {
    ev.push({ type: "refuse", key: "notYet" });
    return;
  }
  switch (a.type) {
    case "structure": {
      s.tries++;
      const ok = s.l * s.w * a.h === s.volume;
      outcome(ev, {
        ok,
        key: ok ? "structureOk" : s.l * s.w * a.h < s.volume ? "structureLow" : "structureHigh",
        vars: { h: a.h, v: s.l * s.w * a.h, need: s.volume },
        mechanic: "volume",
        lesson: "5-5",
        misconception:
          !ok && s.l + s.w + a.h === s.volume ? "geom-volume-added-dimensions" : undefined,
        detail: { h: a.h },
      });
      if (ok) solveStage(w, s, ev);
      return;
    }
    case "power": {
      s.tries++;
      const target = [
        { op: "+", k: s.c },
        { op: "*", k: s.k },
      ];
      const mine = [
        { op: "*", k: a.a },
        { op: "+", k: a.b },
      ];
      const ok = equivalent(target, mine);
      outcome(ev, {
        ok,
        key: ok ? "powerOk" : "powerNo",
        vars: { a: a.a, b: a.b, k: s.k, c: s.c },
        mechanic: "equivalent-expressions",
        lesson: "6-14",
        misconception:
          !ok && a.a === s.k && a.b === s.c ? "algebra-distributive-partial" : undefined,
        detail: { a: a.a, b: a.b },
      });
      if (ok) solveStage(w, s, ev);
      return;
    }
    case "transport": {
      s.tries++;
      const rate = a.n / a.d;
      const ok = Math.abs(rate - s.d / s.t) < 1e-9;
      outcome(ev, {
        ok,
        key: ok ? "transportOk" : rate > s.d / s.t ? "transportFast" : "transportSlow",
        vars: { rate: a.d === 1 ? a.n : `${a.n}/${a.d}`, d: s.d, t: s.t },
        mechanic: "unit-rate",
        lesson: "3-8",
        misconception: ok
          ? undefined
          : Math.abs(rate - s.t / s.d) < 1e-9
            ? "ratio-inverted"
            : rate === s.d
              ? "rate-not-per-one"
              : undefined,
        detail: { n: a.n, d: a.d },
      });
      if (ok) solveStage(w, s, ev);
      return;
    }
    case "barrier": {
      s.tries++;
      const wrong = s.codes.filter((c) => passesAll(a.rules, c) !== passesAll(s.want, c));
      const ok = wrong.length === 0;
      let misconception;
      for (let i = 0; i < s.want.length && !ok && !misconception; i++)
        misconception = slipOf(s.want[i], a.rules[i]);
      outcome(ev, {
        ok,
        key: ok ? "barrierOk" : "barrierNo",
        vars: { wrong: wrong.join(", "), rules: a.rules.map((r) => ruleText(r)).join(" and ") },
        mechanic: "compound-inequality",
        lesson: "8-7",
        misconception,
        detail: { rules: a.rules },
      });
      if (ok) solveStage(w, s, ev);
      return;
    }
    case "move": {
      // One move on the shutdown equation a·x + b = c. "both" keeps it true; "left" alone does not.
      s.tries++;
      const e = s.eq;
      const before = { ...e };
      if (a.op === "sub") {
        if (a.side === "both") {
          e.b -= a.k;
          e.c -= a.k;
        } else e.b -= a.k;
      } else if (a.op === "add") {
        if (a.side === "both") {
          e.b += a.k;
          e.c += a.k;
        } else e.b += a.k;
      } else if (a.op === "div") {
        if (e.b !== 0 || e.a % a.k !== 0 || e.c % a.k !== 0) {
          ev.push({ type: "refuse", key: "cannotDivide" });
          return;
        }
        e.a /= a.k;
        e.c /= a.k;
      }
      const stillTrue = a.side === "both" || a.op === "div";
      const progress = Math.abs(e.b) < Math.abs(before.b) || e.a < before.a;
      outcome(ev, {
        ok: stillTrue && progress,
        key: !stillTrue ? "moveBroke" : progress ? "moveOk" : "moveAway",
        vars: {
          eq: `${e.a === 1 ? "" : e.a}x${e.b ? (e.b > 0 ? ` + ${e.b}` : ` − ${-e.b}`) : ""} = ${e.c}`,
        },
        mechanic: "solve-equation",
        lesson: "8-3",
        misconception: !stillTrue
          ? undefined
          : !progress
            ? "equation-not-inverse-operation"
            : undefined,
        detail: { op: a.op, k: a.k, side: a.side },
      });
      if (!stillTrue) {
        // A one-sided move breaks the equation: the Engine resets the panel to where it was.
        Object.assign(e, before);
        return;
      }
      if (e.a === 1 && e.b === 0) solveStage(w, s, ev);
      return;
    }
  }
}

export const rules = { step, apply };
