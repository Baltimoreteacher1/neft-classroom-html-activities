// Round construction and the solver. Rounds are pure functions of (skillId, level, rng, grade) and hold no learner
// state, so a seed rebuilds them exactly. @fm2 FM-050 FM-060 FM-061 FM-065 FM-019
import { EARLY } from "./gen-early.js";
import { LATE } from "./gen-late.js";
import { MID } from "./gen-mid.js";
import { gcd, lcm, measure, rectCells, times } from "./measure.js";
import { planModel, solverCuts } from "./model.js";
import { polyText } from "./poly.js";
import { bestArea, rectIssue, requiredList } from "./rules.js";

const GENERATORS = { ...EARLY, ...MID, ...LATE };
export const SKILL_IDS = Object.keys(GENERATORS);

export function makeRound(skillId, level, rng, grade) {
  const generate = GENERATORS[skillId];
  if (!generate) throw new RangeError(`Unknown Array Architect skill: ${skillId}`);
  return { v: 1, skillId, level, grade, ...generate(level, rng, grade) };
}

// Every rectangle that fits the grid and the constraints, smallest first.
export function rectSolutions(round, rowCap = round.grid.rows, colCap = round.grid.cols) {
  const out = [];
  for (let r = 1; r <= rowCap; r += 1) {
    for (let c = 1; c <= colCap; c += 1) {
      const m = measure(rectCells(r, c));
      if (!rectIssue(round.task, m)) out.push([r, c]);
    }
  }
  // Prefer the roomiest rectangle (sides closest together): it is the one a person would call typical.
  return out.sort((a, b) => Math.abs(a[0] - a[1]) - Math.abs(b[0] - b[1]) || a[0] - b[0]);
}

function prismSolution(round) {
  const t = round.task;
  for (let layers = 1; layers <= 8; layers += 1) {
    for (let r = 1; r <= round.grid.rows; r += 1) {
      for (let c = 1; c <= round.grid.cols; c += 1) {
        const ok =
          (t.layers == null || t.layers === layers) &&
          (t.rows == null || (t.rows === r && t.cols === c)) &&
          (t.volume == null || t.volume === layers * r * c) &&
          (t.minLayers == null || layers >= t.minLayers) &&
          (t.minSide == null || Math.min(r, c) >= t.minSide);
        if (ok) return { rows: r, cols: c, layers };
      }
    }
  }
  throw new RangeError("No prism satisfies this round");
}

function decomposeAssignment(shape) {
  const byColumn = new Map();
  for (const [r, c] of shape) byColumn.set(c, [...(byColumn.get(c) || []), r]);
  const out = [];
  let tool = 0;
  let previous = "";
  for (const c of [...byColumn.keys()].sort((a, b) => a - b)) {
    const rows = byColumn.get(c).sort((a, b) => a - b);
    const signature = `${rows[0]}-${rows.at(-1)}`;
    if (signature !== previous) tool += 1;
    previous = signature;
    for (const r of rows) out.push([r, c, tool]);
  }
  return out;
}

function modelAnswer(round) {
  const cuts = solverCuts(round);
  const plan = planModel(round, cuts);
  const partials = Object.fromEntries(plan.flat.map((r) => [r.id, r.text]));
  return { cuts, partials, total: plan.totalText };
}

export function solve(round) {
  const t = round.task;
  switch (round.kind) {
    case "rect": {
      const [rows, cols] = rectSolutions(round)[0];
      const out = { cells: rectCells(rows, cols) };
      if (round.ask) out.value = String(round.ask.kind === "cols" ? cols : rows * cols);
      return out;
    }
    case "paint": {
      if (t.rule === "count") {
        const cells = [];
        const width = t.perRow || round.grid.cols;
        for (let i = 0; i < t.total; i += 1) cells.push([Math.floor(i / width), i % width]);
        return { cells };
      }
      if (t.rule === "pairs") {
        const cells = [];
        for (let c = 0; c < Math.floor(t.total / 2); c += 1) cells.push([0, c], [1, c]);
        if (t.total % 2) cells.push([0, Math.floor(t.total / 2)]);
        return { cells: t.axis === "cols" ? cells.map(([r, c]) => [c, r]) : cells, parity: t.total % 2 ? "odd" : "even" };
      }
      if (t.rule === "target")
        return { cells: t.shape.map(([r, c]) => [r, c]), value: String(t.shape.length) };
      return { cells: decomposeAssignment(t.shape), value: String(t.shape.length) };
    }
    case "collect":
      return { list: requiredList(t) };
    case "model":
      return modelAnswer(round);
    case "prism": {
      const { rows, cols, layers } = prismSolution(round);
      const out = { cells: rectCells(rows, cols), layers };
      if (round.ask) out.value = String(rows * cols * layers);
      return out;
    }
    case "scale": {
      const [n, d] = t.k;
      const area = d === 1 ? String(n * n) : `${n * n}/${d * d}`;
      return { cells: rectCells((t.rows * n) / d, (t.cols * n) / d), pick: area };
    }
    case "tiling":
      return { s: t.mode === "gcf" ? gcd(t.a, t.b) : lcm(t.a, t.b) };
    case "tiles": {
      const [c0, c1, c2] = t.target;
      for (let w1 = 0; w1 <= 3; w1 += 1) {
        for (let h1 = 0; h1 <= 3; h1 += 1) {
          for (let w0 = 0; w0 <= 12; w0 += 1) {
            for (let h0 = 0; h0 <= 12; h0 += 1) {
              if (w1 * h1 === c2 && w1 * h0 + w0 * h1 === c1 && w0 * h0 === c0)
                return { w: [w0, w1], h: [h0, h1] };
            }
          }
        }
      }
      throw new RangeError("No tile rectangle for this round");
    }
    default:
      throw new RangeError(`Unknown round kind ${round.kind}`);
  }
}

// Short text of the answer (one valid solution when several exist).
export function answerText(round) {
  const t = round.task;
  const s = solve(round);
  switch (round.kind) {
    case "rect": {
      const m = measure(s.cells);
      return s.value ? `${times(m.rows, m.cols)} = ${s.value}` : times(m.rows, m.cols);
    }
    case "paint":
      if (t.rule === "count") return `${t.total} = ${chunks(s.cells)}`;
      if (t.rule === "pairs")
        return `${t.total} = ${Math.floor(t.total / 2)} pairs + ${t.total % 2} left (${s.parity})`;
      return s.value;
    case "collect":
      return s.list.map(([a, b]) => times(a, b)).join(", ");
    case "model":
      return s.total;
    case "prism": {
      const m = measure(s.cells);
      return `${m.rows} × ${m.cols} × ${s.layers}${s.value ? ` = ${s.value}` : ""}`;
    }
    case "scale": {
      const m = measure(s.cells);
      return `${times(m.rows, m.cols)}, × ${s.pick}`;
    }
    case "tiling":
      return String(s.s);
    default:
      return `(${polyText(s.w)})(${polyText(s.h)})`;
  }
}

function chunks(cells) {
  const rows = new Map();
  for (const [r] of cells) rows.set(r, (rows.get(r) || 0) + 1);
  return [...rows.values()].join(" + ");
}

// Strings that tiers 0-2 of a hint must not contain: the answer in every form a learner could copy.
export function secrets(round) {
  const t = round.task;
  const out = [answerText(round)];
  if (round.kind === "rect")
    for (const [r, c] of rectSolutions(round)) out.push(times(r, c), times(c, r));
  if (round.kind === "collect") for (const [a, b] of requiredList(t)) out.push(times(a, b));
  const s = solve(round);
  if (s.value != null && round.kind !== "paint") out.push(String(s.value));
  if (round.kind === "paint" && t.rule !== "count" && t.rule !== "pairs")
    out.push(String(t.shape.length));
  if (round.kind === "model") {
    const plan = planModel(round, s.cuts);
    out.push(plan.totalText);
    if (plan.mode !== "poly") out.push(...plan.flat.map((r) => r.text).filter((x) => x.length > 1));
  }
  if (round.kind === "tiling") out.push(String(s.s));
  if (round.kind === "scale") out.push(s.pick);
  if (round.kind === "rect" && t.maxArea) out.push(String(bestArea(t.perim)));
  return [...new Set(out)];
}
