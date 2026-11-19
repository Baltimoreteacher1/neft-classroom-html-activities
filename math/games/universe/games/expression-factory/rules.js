// Expression Factory — simulation rules. No DOM. Deterministic.
//
// Player action -> mathematics -> state change -> visible result:
//   set the slots to × 3 then + 2 and pull the lever -> each crate's x goes
//   through 3x + 2 one machine at a time -> its label changes at every stamp
//   -> the truck takes it only if it carries what the order asks for at that x;
//   a line that is right for one crate and wrong for another shows exactly
//   which crates it fails.

import { stepBody } from "../../runtime/physics.js";
import { q } from "../../runtime/sim.js";
import { BELT_X0, BELT_X1, FLOOR, slotX } from "./levels.js";
import { eqFrac, equivalent, evaluate, frac, isLinear, linear, runMachine, sameChain } from "./math.js";

const SPEED = 3;
const SPACING = 70;

export const built = (r) => r.line.filter(Boolean);

export function currentRoom(w) {
  const px = w.p.x + w.p.w / 2;
  let best = w.rooms[0];
  for (const r of w.rooms) if (px >= r.x0) best = r;
  return best;
}

function newCrates(r, line) {
  return r.xs.map((x, i) => ({ x, v: frac(x), pos: -i * SPACING, stage: 0, state: "wait", line }));
}

function stepCrates(r, crates, slotsLine, ev, ref) {
  const n = slotsLine.length;
  const len = BELT_X1 - BELT_X0;
  for (const c of crates) {
    if (c.state === "ok" || c.state === "reject") continue;
    c.pos = q(c.pos + SPEED);
    if (c.pos < 0) continue;
    c.state = "belt";
    // Each slot stamps the crate as it passes under it.
    while (c.stage < n && c.pos >= (len * (c.stage + 1)) / (n + 1)) {
      const m = slotsLine[c.stage];
      if (m) {
        c.v = runMachine(m, c.v, c.x);
        ev.push({ type: "stamp", room: r.i, slot: c.stage, ref });
      }
      c.stage++;
    }
    if (c.pos >= len) {
      const want = evaluate(r.target, c.x);
      c.state = eqFrac(c.v, want) ? "ok" : "reject";
      if (!ref) ev.push({ type: c.state === "ok" ? "crateOk" : "crateReject", room: r.i, x: c.x });
    }
  }
}

/** Which slip a wrong line shows, in the site's misconception vocabulary. */
function slipOf(r, line) {
  const t = r.target;
  if (!isLinear(t) || !isLinear(line)) return undefined;
  const want = linear(t);
  const got = linear(line);
  // Most specific first: multiplied the x but not the number (k(x + c) read as kx + c).
  if (eqFrac(want.a, got.a) && !eqFrac(want.b, got.b)) {
    const ks = t.filter((m) => m.op === "*").map((m) => m.k);
    if (ks.some((k) => eqFrac(frac(got.b.n * k, got.b.d), want.b) || eqFrac(frac(want.b.n, want.b.d * k), got.b)))
      return "algebra-distributive-partial";
  }
  // The same machines in another order: worked left to right instead of by structure.
  const parts = (l) => l.map((m) => `${m.op}${m.k ?? ""}`).sort().join();
  if (line.length === t.length && parts(line) === parts(t)) return "order-of-operations-left-to-right";
  return undefined;
}

function finishRun(w, r, ev) {
  const line = r.run.line;
  const allOk = r.run.crates.every((c) => c.state === "ok");
  const differs = r.kind !== "twin" || !sameChain(line, r.target);
  const ok = allOk && differs;
  const misses = r.run.crates.filter((c) => c.state === "reject").map((c) => c.x);
  ev.push({
    type: "outcome",
    ok,
    key: ok ? `${r.kind}Ok` : !allOk ? "cratesRejected" : "twinSame",
    vars: {
      misses: misses.join(", "),
      n: r.run.crates.length - misses.length,
      total: r.run.crates.length,
    },
    mechanic:
      r.kind === "build"
        ? "write-expression"
        : r.kind === "twin"
          ? "equivalent-expressions"
          : "simplify-expression",
    lesson: r.kind === "build" ? "6-5" : r.kind === "twin" ? "6-6" : "6-15",
    misconception: ok ? undefined : allOk ? undefined : slipOf(r, line),
    detail: { line, equivalent: equivalent(line, r.target), misses },
  });
  // The finished crates stay stacked in the truck and the chute until the next run.
  r.lastCrates = r.run.crates;
  r.run = null;
  if (ok) {
    r.done = 1;
    w.solids[r.gate].open = 1;
    ev.push({ type: "solved", room: r.i });
  }
}

function step(w, mask, prevMask, ev) {
  for (const r of w.rooms) {
    if (!r.run) continue;
    stepCrates(r, r.run.crates, r.run.slots, ev, false);
    if (r.run.ref) stepCrates(r, r.run.ref, r.target, ev, true);
    const busy =
      r.run.crates.some((c) => c.state === "wait" || c.state === "belt") ||
      (r.run.ref && r.run.ref.some((c) => c.state === "wait" || c.state === "belt"));
    if (!busy) finishRun(w, r, ev);
  }
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
    case "set":
      if (r.run || r.done) return;
      r.line[a.slot] = a.m ? { ...a.m } : null;
      ev.push({ type: "setSlot", room: r.i, slot: a.slot });
      return;
    case "run": {
      if (r.run || r.done) return;
      r.runs++;
      r.lastCrates = null;
      const line = built(r);
      r.run = {
        line,
        slots: r.line.map((m) => m && { ...m }),
        crates: newCrates(r, line),
        // Twin and streamline rooms run the reference line above, crate for crate.
        ref: r.kind === "build" ? null : newCrates(r, r.target),
      };
      ev.push({ type: "lever", room: r.i });
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
export { slotX };
