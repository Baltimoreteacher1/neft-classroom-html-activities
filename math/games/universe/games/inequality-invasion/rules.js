// Inequality Invasion — simulation rules. No DOM. Deterministic.
//
// Player action -> mathematics -> state change -> visible result:
//   set the gate to x ≤ 8 and release the wave -> each glimmer's number is
//   tested against the rule at the gate -> it flows on into the garden or is
//   guided down the side stream -> a glimmer carrying exactly 8 shows whether
//   the boundary was included.

import { stepBody } from "../../runtime/physics.js";
import { q } from "../../runtime/sim.js";
import { FLOOR } from "./levels.js";
import { passesAll, ruleText, satisfies, slipOf } from "./math.js";

const SPEED = 2.4;
const SPACING = 80;
const START = 160;
const GARDEN = 900;

export function currentRoom(w) {
  const px = w.p.x + w.p.w / 2;
  let best = w.rooms[0];
  for (const r of w.rooms) if (px >= r.x0) best = r;
  return best;
}

function stepRun(w, r, ev) {
  let busy = false;
  for (const g of r.run.glimmers) {
    if (g.state === "garden" || g.state === "side") continue;
    busy = true;
    g.x = q(g.x + SPEED);
    if (g.x < r.x0 + START) continue;
    g.state = g.state === "wait" ? "path" : g.state;
    if (g.state === "falling") {
      g.drop = q(g.drop + 3);
      if (g.drop > 70) {
        g.state = "side";
        ev.push({ type: "side", room: r.i, v: g.v });
      }
      continue;
    }
    while (g.gate < r.gatesX.length && g.x >= r.gatesX[g.gate]) {
      const ok = satisfies(r.rules[g.gate], g.v);
      ev.push({ type: ok ? "pass" : "divert", room: r.i, gate: g.gate, v: g.v });
      if (!ok) {
        g.state = "falling";
        g.drop = 0;
        break;
      }
      g.gate++;
    }
    if (g.state === "path" && g.x >= r.x0 + GARDEN) {
      g.state = "garden";
      ev.push({ type: "garden", room: r.i, v: g.v });
    }
  }
  if (!busy) finish(w, r, ev);
}

function finish(w, r, ev) {
  const wrong = r.run.glimmers.filter((g) => (g.state === "garden") !== passesAll(r.want, g.v));
  const ok = wrong.length === 0;
  let misconception;
  if (!ok)
    for (let i = 0; i < r.want.length && !misconception; i++)
      misconception = slipOf(r.want[i], r.rules[i]);
  ev.push({
    type: "outcome",
    ok,
    key: ok ? "sorted" : "missorted",
    vars: {
      wrong: [...new Set(wrong.map((g) => g.v))].join(", "),
      rules: r.rules.map((x) => ruleText(x)).join(" and "),
    },
    mechanic:
      r.kind === "words"
        ? "write-inequality"
        : r.kind === "solve"
          ? "solve-inequality"
          : "compound-inequality",
    lesson: r.kind === "words" ? "8-4" : r.kind === "solve" ? "8-6" : "8-7",
    misconception,
    detail: { rules: r.rules.map((x) => ({ ...x })), wrong: wrong.map((g) => g.v) },
  });
  r.last = r.run.glimmers;
  r.run = null;
  if (ok) {
    r.done = 1;
    w.solids[r.gate].open = 1;
    ev.push({ type: "solved", room: r.i });
  }
}

function step(w, mask, prevMask, ev) {
  for (const r of w.rooms) if (r.run) stepRun(w, r, ev);
  const p = w.p;
  stepBody(p, w.solids, mask, prevMask, ev);
  if (p.x < 0) p.x = 0;
  if (p.x > w.w - p.w) p.x = w.w - p.w;
  for (const c of w.checkpoints)
    if (!c.hit && Math.abs(p.x + p.w / 2 - c.x) < 40) {
      c.hit = 1;
      ev.push({ type: "checkpoint", id: c.id });
    }
  const e = w.exit;
  if (!w.done && w.rooms.every((r) => r.done) && p.x + p.w > e.x && p.x < e.x + e.w) {
    w.done = 1;
    ev.push({ type: "complete" });
  }
}

function apply(w, a, ev) {
  const r = a.room !== undefined ? w.rooms[a.room] : null;
  switch (a.type) {
    case "rule":
      if (r.run || r.done) return;
      r.rules[a.gate] = { sym: a.sym, k: a.k };
      ev.push({ type: "ruleSet", room: r.i, gate: a.gate });
      return;
    case "release":
      if (r.run || r.done) return;
      r.runs++;
      r.last = null;
      r.run = {
        glimmers: r.wave.map((v, i) => ({
          v,
          x: r.x0 + START - i * SPACING,
          gate: 0,
          state: "wait",
          drop: 0,
          seed: i,
        })),
      };
      ev.push({ type: "release", room: r.i });
      return;
    case "travel":
      w.p.x = a.x - w.p.w / 2;
      w.p.y = FLOOR - w.p.h;
      w.p.vx = w.p.vy = 0;
      return;
  }
}

export const rules = { step, apply };
export { GARDEN, START };
