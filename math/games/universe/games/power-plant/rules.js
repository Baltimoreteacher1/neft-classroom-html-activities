// Power Plant — simulation rules. No DOM. Deterministic: everything lives in
// the world, and every number a device moves by comes from math.js.
//
// Player action -> mathematics -> state change -> visible result:
//   set a reactor's base and exponent -> base^exp (coils fire one factor at a
//   time) -> the lift rises / the bridge extends by exactly that many units ->
//   it docks only if the power is exactly what the structure needs; too little
//   stops short, too much trips the breaker and it comes back down.

import { overlaps, stepBody } from "../../runtime/physics.js";
import { q } from "../../runtime/sim.js";
import { asMultiplication, clamps, evaluate, leftToRight, power } from "./math.js";

export const COIL_TICKS = 22;
const TRIP_WAIT = 45;

export const machineOf = (w, id) => w.machines.find((m) => m.id === id);
export const deviceOf = (w, id) => w.devices.find((d) => d.id === id);
export const busy = (d) => d.phase === "move" || d.phase === "trip" || d.phase === "reset";

/** What a machine would put out with its current settings. */
export function output(w, m) {
  if (m.kind === "power") return power(m.base, m.exp);
  if (m.kind === "ops") return evaluate(m.tokens, m.group).value;
  const [a, b, c] = m.parts.map((id) => output(w, machineOf(w, id)));
  return evaluate([a, "+", b, "×", c]).value;
}

function chargeTicks(m) {
  if (m.kind === "power") return Math.max(1, m.exp) * COIL_TICKS + 18;
  if (m.kind === "ops") return evaluate(m.tokens, m.group).steps.length * 30 + 18;
  return 110;
}

/** The exponent that makes base^exp equal target, or 0 when there is none in range. */
export function solveExp(base, target, maxExp) {
  for (let e = 1; e <= maxExp; e++) if (power(base, e) === target) return e;
  return 0;
}

/** The clamp (or null for none) that makes the expression equal target; undefined when none does. */
export function solveClamp(tokens, target) {
  if (evaluate(tokens).value === target) return null;
  return clamps(tokens).find((g) => evaluate(tokens, g).value === target);
}

/** Every barrier left of x must be docked before a stop at x can be reached. */
export function reachable(w, x) {
  for (const d of w.devices) {
    const edge =
      d.kind === "lift"
        ? d.x + d.w
        : d.kind === "bridge"
          ? d.x + d.span
          : d.gateSolid >= 0
            ? w.solids[d.gateSolid].x
            : Infinity;
    if (edge < x && d.phase !== "dock") return false;
  }
  return true;
}

function start(d, out) {
  d.next = out;
  d.phase = d.value > 0 ? "reset" : "move";
  if (d.phase === "move") begin(d);
}

function begin(d) {
  d.out = d.next;
  d.goal = d.out > d.need ? d.need * 1.2 : d.out;
  d.phase = "move";
  d.wait = 0;
}

function place(w, d) {
  if (d.solid < 0) return;
  const s = w.solids[d.solid];
  if (d.kind === "lift") {
    const y = q(d.y - d.value * d.unit);
    s.dy = q(y - s.y);
    s.y = y;
  } else {
    s.w = q(d.value * d.unit);
    s.open = s.w < 2 ? 1 : 0;
  }
}

function outcome(ev, w, d, ok, side) {
  const m =
    w.machines.find((x) => x.drives === d.id && x.state === "fire") ||
    w.machines.find((x) => x.drives === d.id);
  let misconception;
  if (!ok && m.kind === "power" && asMultiplication(m.base, m.exp) === m.target)
    misconception = "exponent-as-multiplication";
  if (!ok && m.kind === "ops" && !m.group && leftToRight(m.tokens) === m.target)
    misconception = "order-of-operations-left-to-right";
  if (!ok && m.kind === "combo") {
    const [a, b, c] = m.parts.map((id) => output(w, machineOf(w, id)));
    if ((a + b) * c === d.need) misconception = "order-of-operations-left-to-right";
  }
  ev.push({
    type: "outcome",
    ok,
    key: `${d.kind}${ok ? "Dock" : side}${m.by === "ori" ? "Ori" : ""}`,
    byOri: m.by === "ori",
    vars: { out: d.out, need: d.need },
    who: m.by === "ori" ? "ori" : "wren",
    mechanic:
      m.kind === "power"
        ? "exponent-power"
        : m.kind === "ops"
          ? "order-of-operations"
          : "core-combiner",
    lesson: m.kind === "power" ? "6-3" : "6-4",
    misconception,
    device: d.id,
    machine: m.id,
    detail:
      m.kind === "power"
        ? { base: m.base, exp: m.exp, out: d.out, need: d.need }
        : { out: d.out, need: d.need, group: m.group || null },
  });
}

function stepDevices(w, ev) {
  for (const d of w.devices) {
    if (d.solid >= 0) w.solids[d.solid].dy = 0;
    if (d.kind === "core" || d.kind === "gate") continue;
    const speed = d.need / 170;
    if (d.phase === "reset") {
      d.value = Math.max(0, q(d.value - speed * 1.6));
      place(w, d);
      if (d.value === 0) begin(d);
    } else if (d.phase === "move") {
      d.value = Math.min(d.goal, q(d.value + speed));
      place(w, d);
      if (d.value >= d.goal) {
        if (d.out === d.need) {
          d.phase = "dock";
          if (d.gateSolid >= 0) w.solids[d.gateSolid].open = 1;
          outcome(ev, w, d, true, "");
        } else if (d.out < d.need) {
          d.phase = "short";
          outcome(ev, w, d, false, "Low");
        } else {
          d.phase = "trip";
          d.wait = TRIP_WAIT;
          outcome(ev, w, d, false, "High");
        }
        for (const m of w.machines) if (m.drives === d.id && m.state === "fire") m.state = "idle";
      }
    } else if (d.phase === "trip") {
      if (d.wait > 0) d.wait--;
      else {
        d.value = Math.max(0, q(d.value - speed * 1.6));
        place(w, d);
        if (d.value === 0) d.phase = "idle";
      }
    }
  }
}

/** A gate fed by several reactors: opens when the feeds together deliver exactly `need`. */
function settleGate(w, d, ev) {
  const feeds = d.feeds.map((id) => machineOf(w, id));
  if (feeds.some((m) => m.state !== "fire")) return;
  d.out = feeds.reduce((sum, m) => sum + m.out, 0);
  const ok = d.out === d.need;
  if (ok) {
    d.phase = "dock";
    w.solids[d.gateSolid].open = 1;
  }
  outcome(ev, w, d, ok, d.out < d.need ? "Low" : "High");
  for (const m of feeds) m.state = "idle";
}

function settleCore(w, d, m, ev) {
  d.need = m.loads[d.phaseIndex];
  d.out = m.out;
  const ok = d.out === d.need;
  outcome(ev, w, d, ok, d.out < d.need ? "Low" : "High");
  m.state = "idle";
  if (!ok) return;
  d.phaseIndex++;
  if (d.phaseIndex >= m.loads.length) {
    d.phase = "dock";
    w.solids[d.gateSolid].open = 1;
    if (w.pulse) w.pulse.period = 0;
  }
}

function stepMachines(w, ev) {
  for (const m of w.machines) {
    if (m.state !== "charge") continue;
    m.t++;
    if (m.t < chargeTicks(m)) continue;
    m.out = output(w, m);
    m.state = "fire";
    ev.push({ type: "fired", machine: m.id, out: m.out });
    const d = deviceOf(w, m.drives);
    if (m.kind === "combo") settleCore(w, d, m, ev);
    else if (d.kind === "gate") {
      // Ori's twin spark: the second feed mirrors the first with an equivalent form.
      const twin = w.machines.find(
        (x) => x.drives === d.id && x.by === "twin" && x.state === "idle",
      );
      if (twin && m.by === "wren" && w.know.twin) {
        const alt = twin.bases.find((b) => b !== m.base && solveExp(b, m.out, twin.maxExp));
        twin.base = alt || (twin.bases.includes(m.base) ? m.base : twin.bases[0]);
        twin.exp = solveExp(twin.base, m.out, twin.maxExp) || m.exp;
        twin.state = "charge";
        twin.t = 0;
        ev.push({
          type: "say",
          who: "ori",
          key: "oriTwin",
          mood: "focused",
          vars: { base: twin.base, exp: twin.exp, out: m.out },
        });
      }
      settleGate(w, d, ev);
    } else start(d, m.out);
  }
}

function bump(w, ev, dir) {
  if (w.stun > 0) return;
  w.stun = 26;
  w.p.vx = dir * 5;
  w.p.vy = -6.5;
  w.p.dashT = 0;
  ev.push({ type: "bump", x: w.p.x + w.p.w / 2, y: w.p.y + w.p.h / 2 });
}

export const ventActive = (v) => v.phase > v.period * 0.58;
export const ventWarn = (v) => v.phase > v.period * 0.36 && !ventActive(v);

function stepHazards(w, ev) {
  const p = w.p;
  for (const v of w.vents) {
    v.phase = (v.phase + 1) % v.period;
    if (v.phase === Math.floor(v.period * 0.58))
      ev.push({ type: "vent", x: v.x + v.w / 2, y: v.y });
    if (ventActive(v) && p.x + p.w > v.x + 6 && p.x < v.x + v.w - 6 && p.y + p.h > v.y - 120)
      bump(w, ev, p.x + p.w / 2 < v.x + v.w / 2 ? -1 : 1);
  }
  for (const b of w.bots) {
    b.x = q(b.x + b.dir * 1.2);
    if (b.x > b.x1) b.dir = -1;
    if (b.x < b.x0) b.dir = 1;
    const box = { x: b.x, y: b.y - b.h, w: b.w, h: b.h };
    if (overlaps(p, box)) bump(w, ev, p.x + p.w / 2 < b.x + b.w / 2 ? -1 : 1);
  }
  const s = w.pulse;
  if (s?.period) {
    s.t = (s.t + 1) % s.period;
    if (s.t === s.period - 70) ev.push({ type: "pulseWarn" });
    if (s.t === 0) {
      s.x = 0;
      ev.push({ type: "pulse" });
    }
    if (s.x >= 0) {
      s.x = q(s.x + s.speed);
      if (s.x > w.w) s.x = -1;
      else if (Math.abs(p.x + p.w / 2 - s.x) < 16 && p.y + p.h > 520 - 26) bump(w, ev, 1);
    }
  }
}

/** Ori's own attempt at a machine: correct only if it already holds the concept. */
function oriAttempt(w, m, ev) {
  m.tries++;
  m.t = 0;
  m.state = "charge";
  if (m.kind === "power") {
    const right = solveExp(m.base, m.target, m.maxExp);
    const wrong = Math.min(m.maxExp, Math.max(1, Math.round(m.target / m.base)));
    m.exp = w.know.exp ? right : wrong;
    ev.push({
      type: "say",
      who: "ori",
      key: w.know.exp ? "oriKnowsExp" : "oriPlanExp",
      mood: w.know.exp ? "focused" : "curious",
      vars: { base: m.base, exp: m.exp, target: m.target },
    });
  } else {
    m.group = w.know.ops ? solveClamp(m.tokens, m.target) || null : null;
    ev.push({
      type: "say",
      who: "ori",
      key: w.know.ops ? "oriKnowsOps" : "oriPlanOps",
      mood: w.know.ops ? "focused" : "curious",
      vars: { target: m.target, ltr: leftToRight(m.tokens) },
    });
  }
}

function stepOri(w, ev) {
  const o = w.ori;
  const p = w.p;
  let tx = p.x + p.w / 2 - p.face * 48;
  let ty = p.y - 26;
  if (o.mode === "station") {
    const m = machineOf(w, o.goal);
    tx = m.x;
    ty = m.y - 34;
    if (Math.abs(o.x - tx) < 8 && Math.abs(o.y - ty) < 8 && o.at !== m.id) {
      o.at = m.id;
      if (m.tries === 0) oriAttempt(w, m, ev);
    }
    if (deviceOf(w, m.drives).phase === "dock") o.mode = "follow";
  }
  o.x = q(o.x + (tx - o.x) * 0.07);
  o.y = q(o.y + (ty - o.y) * 0.07);
}

function stepTriggers(w, ev) {
  const p = w.p;
  for (const t of w.triggers) {
    if (t.done || p.x < t.x) continue;
    t.done = 1;
    if (t.say) ev.push({ type: "say", who: t.who, key: t.say, mood: t.mood });
    if (t.ori && deviceOf(w, machineOf(w, t.ori).drives).phase !== "dock") {
      w.ori.mode = "station";
      w.ori.goal = t.ori;
    }
  }
  for (const c of w.checkpoints) {
    if (!c.hit && Math.abs(p.x + p.w / 2 - c.x) < 30 && Math.abs(p.y + p.h - c.y) < 70) {
      c.hit = 1;
      ev.push({ type: "checkpoint", id: c.id });
    }
  }
  if (!w.done && overlaps(p, w.exit)) {
    w.done = 1;
    ev.push({ type: "complete" });
  }
}

function step(w, mask, prevMask, ev) {
  stepMachines(w, ev);
  stepDevices(w, ev);
  stepHazards(w, ev);
  let m = mask;
  if (w.stun > 0) {
    w.stun--;
    m = 0;
  }
  const p = w.p;
  stepBody(p, w.solids, m, w.stun > 0 ? 0 : prevMask, ev);
  if (p.x < 0) p.x = 0;
  if (p.x > w.w - p.w) p.x = w.w - p.w;
  // Remember solid ground; a fall returns Wren there with nothing lost.
  if (p.ground && p.plat >= 0 && w.solids[p.plat].kind === "floor" && w.tick % 20 === 0) {
    w.safe.x = p.x;
    w.safe.y = p.y;
  }
  if (p.y > w.h + 80) {
    p.x = w.safe.x;
    p.y = w.safe.y - 2;
    p.vx = p.vy = 0;
    ev.push({ type: "respawn", x: p.x + p.w / 2, y: p.y + p.h });
  }
  stepOri(w, ev);
  stepTriggers(w, ev);
}

/** Take or return coils so the reactor holds exactly `exp`. False when the budget cannot cover it. */
function hold(w, m, exp) {
  if (w.coils < 0) return true;
  const have = w.coils + m.held;
  if (exp > have) return false;
  w.coils = have - exp;
  m.held = exp;
  return true;
}

function retarget(w, m, target) {
  const d = deviceOf(w, m.drives);
  m.target = target;
  d.need = target;
  if (d.kind === "bridge") d.unit = d.span / target;
}

function apply(w, a, ev) {
  const m = a.id ? machineOf(w, a.id) : null;
  switch (a.type) {
    case "run":
    case "set": {
      // A docked structure keeps its power: its reactor may only be re-formed
      // into an EQUIVALENT power (same output, different coils), which frees or
      // takes coils without moving anything.
      const d = deviceOf(w, m.drives);
      if (a.type === "run" && d.phase === "dock") {
        if (power(a.base, a.exp) !== d.need) {
          ev.push({
            type: "outcome",
            ok: false,
            key: "keepDock",
            vars: { out: power(a.base, a.exp), need: d.need },
            mechanic: "equivalent-powers",
            lesson: "6-3",
            machine: m.id,
            detail: { base: a.base, exp: a.exp, need: d.need },
          });
          return;
        }
        if (!hold(w, m, a.exp)) {
          ev.push({ type: "refuse", key: "noCoils" });
          return;
        }
        m.base = a.base;
        m.exp = a.exp;
        ev.push({
          type: "outcome",
          ok: true,
          key: "reformed",
          vars: { out: d.need, coils: a.exp },
          mechanic: "equivalent-powers",
          lesson: "6-3",
          machine: m.id,
          detail: { base: a.base, exp: a.exp, out: d.need },
        });
        return;
      }
      if (!hold(w, m, a.exp)) {
        ev.push({ type: "refuse", key: "noCoils" });
        return;
      }
      m.base = a.base;
      m.exp = a.exp;
      if (a.type === "run") {
        m.state = "charge";
        m.t = 0;
        m.tries++;
      }
      break;
    }
    case "runOps":
      m.group = a.group;
      m.state = "charge";
      m.t = 0;
      m.tries++;
      break;
    case "engage":
      m.state = "charge";
      m.t = 0;
      m.tries++;
      break;
    case "oriRun":
      // Ori tries again after being taught; `learned` is the apprentice model's verdict.
      if (a.learned) {
        w.know[a.know] = true;
        if (a.know === "exp") w.know.twin = true;
      }
      if (a.tokens) m.tokens = a.tokens;
      if (a.base) m.base = a.base;
      retarget(w, m, a.target);
      if (m.kind === "power") m.exp = a.exp;
      else m.group = a.group;
      m.state = "charge";
      m.t = 0;
      m.tries++;
      break;
    case "travel": {
      if (!reachable(w, a.x)) return;
      w.p.x = a.x - w.p.w / 2;
      w.p.y = a.y - w.p.h;
      w.p.vx = w.p.vy = 0;
      w.safe.x = w.p.x;
      w.safe.y = w.p.y;
      break;
    }
  }
}

export const rules = { step, apply };
