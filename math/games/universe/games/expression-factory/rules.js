// Expression Factory — simulation rules. No DOM. Deterministic.
//
// Player action -> mathematics -> state change -> visible result:
//   set the slots to × 3 then + 2 and pull the lever -> each crate's x goes
//   through 3x + 2 one machine at a time -> its label changes at every stamp
//   -> the truck takes it only if it carries what the order asks for at that x;
//   a line that is right for one crate and wrong for another shows exactly
//   which crates it fails.

import { stepBody } from "../../runtime/physics.js";
import { IN, q } from "../../runtime/sim.js";
import { stepArena, syncArena } from "./arena.js";
import { BELT_X0, BELT_X1, FLOOR, isPick, slotX } from "./levels.js";
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

function stepCrates(r, crates, slotsLine, ev, ref, target) {
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
      const want = evaluate(target, c.x);
      c.state = eqFrac(c.v, want) ? "ok" : "reject";
      if (!ref) ev.push({ type: c.state === "ok" ? "crateOk" : "crateReject", room: r.i, x: c.x });
    }
  }
}

/** Which slip a wrong line shows, in the site's misconception vocabulary. */
function slipOf(t, line) {
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

// The mechanic and lesson each kind of room is evidence for.
const KIND = {
  build: { mechanic: "write-expression", lesson: "6-5" },
  quiz: { mechanic: "evaluate-expression", lesson: "6-5" },
  identify: { mechanic: "match-expression", lesson: "6-5" },
  match: { mechanic: "match-expression", lesson: "6-5" },
  twin: { mechanic: "equivalent-expressions", lesson: "6-6" },
  streamline: { mechanic: "simplify-expression", lesson: "6-15" },
};

function finishRun(w, r, ev) {
  const { line, want } = r.run;
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
    mechanic: KIND[r.kind].mechanic,
    lesson: KIND[r.kind].lesson,
    misconception: ok ? undefined : allOk ? undefined : slipOf(want, line),
    detail: { line, equivalent: equivalent(line, want), misses },
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

/** One pick on the current crate. A right pick moves to the next step; the last step ships the crate. */
function answer(w, r, choice, ev, slot = r.items[r.at].steps[r.step].choices.indexOf(choice)) {
  const item = r.items[r.at];
  const st = item.steps[r.step];
  const ok = choice === st.answer;
  const last = r.step === item.steps.length - 1;
  ev.push({
    type: "outcome",
    ok,
    key: !ok ? "quizMiss" : last ? "quizCrate" : "quizStep",
    room: r.i,
    slot,
    vars: { n: r.at + 1, total: r.items.length },
    mechanic: item.mechanic,
    lesson: "6-5",
    misconception: ok ? undefined : st.slips?.[choice],
    detail: { prompt: item.show || item.phrase.en, ask: st.ask, choice },
  });
  if (!ok) {
    r.miss++;
    r.streak = 0;
    return;
  }
  if (!last) {
    r.step++;
    syncArena(w, r);
    return;
  }
  if (!r.miss) {
    r.firstTry++;
    r.streak++;
    r.best = Math.max(r.best, r.streak);
  }
  r.miss = 0;
  r.step = 0;
  r.at++;
  ev.push({ type: "crateOk", room: r.i, slot, streak: r.streak });
  if (r.at === r.items.length) {
    r.done = 1;
    w.solids[r.gate].open = 1;
    ev.push({ type: "solved", room: r.i });
  }
  syncArena(w, r);
}

function step(w, mask, prevMask, ev) {
  for (const r of w.rooms) {
    if (!r.run) continue;
    stepCrates(r, r.run.crates, r.run.slots, ev, false, r.run.want);
    if (r.run.ref) stepCrates(r, r.run.ref, r.target, ev, true, r.target);
    const busy =
      r.run.crates.some((c) => c.state === "wait" || c.state === "belt") ||
      (r.run.ref && r.run.ref.some((c) => c.state === "wait" || c.state === "belt"));
    if (!busy) finishRun(w, r, ev);
  }
  const p = w.p;
  const vyBefore = p.vy;
  if (p.springT > 0) p.springT--;
  const held = p.springT > 0 && p.vy < 0 ? IN.JUMP : 0;
  stepBody(p, w.solids, mask | held, prevMask | held, ev);
  // Word Crates: a head-bump on a block or a landing on a ledge is an answer.
  const here = currentRoom(w);
  if (here.kind === "quiz") {
    const hit = stepArena(w, here, vyBefore, ev);
    if (hit) answer(w, here, hit.choice, ev, hit.slot);
  }
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
      if (r.run || r.done || isPick(r)) return;
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
        want: r.target,
        slots: r.line.map((m) => m && { ...m }),
        crates: newCrates(r, line),
        // Twin and streamline rooms run the reference line above, crate for crate.
        ref: r.kind === "build" ? null : newCrates(r, r.target),
      };
      ev.push({ type: "lever", room: r.i });
      return;
    }
    case "answer":
      if (r.kind !== "quiz" || r.done) return;
      answer(w, r, a.choice, ev);
      return;
    case "pick": {
      const opt = r.options?.[a.i];
      if (!opt || r.run || r.done) return;
      r.runs++;
      r.lastCrates = null;
      // Identify: the built line is run against the picked expression.
      // Match: the picked line is installed and run against the order.
      if (r.kind === "match") r.line = r.line.map((_, k) => (opt[k] ? { ...opt[k] } : null));
      const line = built(r);
      r.run = {
        line,
        want: r.kind === "match" ? r.target : opt,
        slots: r.line.map((m) => m && { ...m }),
        crates: newCrates(r, line),
        ref: null,
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
