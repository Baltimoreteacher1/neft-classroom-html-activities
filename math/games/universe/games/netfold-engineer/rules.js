// NetFold Engineer — simulation rules. No DOM. Deterministic.
//
// Player action -> mathematics -> state change -> visible result:
//   pick a net -> it folds on its own hinges, tick by tick -> its faces meet
//   in a closed crate, or two faces land on the same side, or a side stays open.
//   cut 46 square units of paper for a 4 × 3 × 2 box (surface area 52) -> the
//   box is wrapped face by face -> the last 6 square units of the top stay bare.

import { stepBody } from "../../runtime/physics.js";
import { q } from "../../runtime/sim.js";
import { closes, fold, prismSA, prismV, pyramidSA, squareNet } from "./geo3d.js";
import { FLOOR } from "./levels.js";

const JOB_TICKS = 150;

export function currentRoom(w) {
  const px = w.p.x + w.p.w / 2;
  let best = w.rooms[0];
  for (const r of w.rooms) if (px >= r.x0) best = r;
  return best;
}

/** The right answer for a bench (the net's index, the area, the volume, the design). */
export function answerOf(r) {
  if (r.kind === "net") return r.choices.findIndex((c) => closes(fold(squareNet(c), 1)).ok);
  if (r.kind === "wrap") return r.solid === "prism" ? prismSA(r.l, r.w, r.h) : pyramidSA(r.b, r.s);
  if (r.kind === "fill") return prismV(r.l, r.w, r.h);
  const sa = r.options.map(([a, b, c]) => prismSA(a, b, c));
  return sa.indexOf(Math.min(...sa));
}

function judge(r, a) {
  const right = answerOf(r);
  if (r.kind === "net") {
    const res = closes(fold(squareNet(r.choices[a.choice]), 1));
    return {
      ok: res.ok,
      why: res.why,
      key: res.ok ? "netOk" : res.why === "gap" ? "netGap" : "netOverlap",
    };
  }
  if (r.kind === "design")
    return { ok: a.choice === right, key: a.choice === right ? "designOk" : "designMore" };
  const v = a.value;
  const ok = Math.abs(v - right) < 1e-9;
  if (r.kind === "wrap") {
    let misconception;
    if (!ok && r.solid === "pyramid" && Math.abs(v - (r.b * r.b + 4 * r.b * r.s)) < 1e-9)
      misconception = "geom-triangle-area-no-half";
    if (!ok && r.solid === "prism" && Math.abs(v - prismV(r.l, r.w, r.h)) < 1e-9)
      misconception = "geom-surface-area-as-volume";
    if (!ok && r.solid === "prism" && Math.abs(v - (r.l * r.w + r.l * r.h + r.w * r.h)) < 1e-9)
      misconception = "geom-surface-area-as-volume";
    return {
      ok,
      key: ok ? "wrapOk" : v < right ? "wrapShort" : "wrapOver",
      misconception,
      diff: Math.abs(v - right),
    };
  }
  let misconception;
  if (!ok && Math.abs(v - prismSA(r.l, r.w, r.h)) < 1e-9)
    misconception = "geom-surface-area-as-volume";
  if (!ok && Math.abs(v - (r.l + r.w + r.h)) < 1e-9) misconception = "geom-volume-added-dimensions";
  return {
    ok,
    key: ok ? "fillOk" : v < right ? "fillShort" : "fillOver",
    misconception,
    diff: Math.abs(v - right),
  };
}

function stepJobs(w, ev) {
  for (const r of w.rooms) {
    const j = r.job;
    if (!j || j.t >= JOB_TICKS) continue;
    j.t++;
    j.k = q(Math.min(1, j.t / (JOB_TICKS - 30)));
    if (j.t === JOB_TICKS) {
      const res = j.result;
      ev.push({
        type: "outcome",
        ok: res.ok,
        key: res.key,
        vars: { diff: res.diff, value: j.value, answer: answerOf(r) },
        mechanic:
          r.kind === "net"
            ? "net-topology"
            : r.kind === "wrap"
              ? "surface-area"
              : r.kind === "fill"
                ? "volume"
                : "optimize-material",
        lesson:
          r.kind === "net"
            ? "5-6"
            : r.kind === "wrap"
              ? r.solid === "pyramid"
                ? "5-8"
                : "5-7"
              : r.kind === "fill"
                ? r.cube < 1
                  ? "5-10"
                  : "5-5"
                : "5-7",
        misconception: res.misconception,
        detail: { choice: j.choice, value: j.value },
      });
      if (res.ok) {
        r.done = 1;
        w.solids[r.gate].open = 1;
        ev.push({ type: "solved", room: r.i });
      }
    }
  }
}

function step(w, mask, prevMask, ev) {
  stepJobs(w, ev);
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
    case "build": {
      if (r.done || (r.job && r.job.t < JOB_TICKS)) return;
      r.tries++;
      r.job = { t: 0, k: 0, choice: a.choice ?? null, value: a.value ?? null, result: judge(r, a) };
      ev.push({ type: "build", room: r.i, kind: r.kind });
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
export { JOB_TICKS };
