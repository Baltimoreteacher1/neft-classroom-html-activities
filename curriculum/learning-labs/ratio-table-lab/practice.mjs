// Station 8: Practice. Endless, seeded problems in new contexts at three
// levels. A problem is fully determined by (seed, number, level), so saving
// three integers restores the exact problem after a reload.

import { coordGraph, moveCursor, PLOT_HELP } from "./graph.mjs";
import { int, obj, str } from "./sanitize.mjs";
import {
  btn,
  header,
  hintBlock,
  hintButton,
  numberInput,
  numeric,
  pairInputs,
  ratioTable,
  submitBtn,
  workbench,
} from "./views.mjs";

export const GOAL = 8;

const CONTEXTS = [
  { a: "Sundaes", b: "Ounces of sauce", one: "sundae", many: "sundaes", unit: "ounces", rates: [2, 3] },
  { a: "Cups of berries", b: "Scoops of yogurt", one: "cup", many: "cups", unit: "scoops", rates: [2, 3, 4] },
  { a: "Packs", b: "Stickers", one: "pack", many: "packs", unit: "stickers", rates: [4, 5, 6, 8] },
  { a: "Tables", b: "Chairs", one: "table", many: "tables", unit: "chairs", rates: [4, 6] },
  { a: "Tickets", b: "Dollars", one: "ticket", many: "tickets", unit: "dollars", rates: [3, 5, 7, 9] },
  { a: "Boxes", b: "Crayons", one: "box", many: "boxes", unit: "crayons", rates: [8, 10, 12] },
  { a: "Batches", b: "Eggs", one: "batch", many: "batches", unit: "eggs", rates: [2, 3, 4] },
  { a: "Teams", b: "Players", one: "team", many: "teams", unit: "players", rates: [5, 9, 11] },
];

const LEVELS = [
  { name: "Warm-up", types: ["missing-y", "pair", "unit"] },
  { name: "On level", types: ["missing-y", "missing-x", "pair", "on-graph", "plot"] },
  { name: "Stretch", types: ["missing-x", "scale-from", "on-graph", "plot", "unit-from"] },
];

function rng(seed) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const plural = (c, n) => (n === 1 ? c.one : c.many);

/** Build one problem. Every answer is computed, never typed in by hand. */
export function makeProblem(seed, number, level) {
  const r = rng(seed * 7919 + number * 104729 + level * 13);
  const pick = (list) => list[Math.floor(r() * list.length)];
  const c = pick(CONTEXTS);
  const rate = pick(c.rates);
  const type = pick(LEVELS[level].types);
  const xs = [1, 2, 3, 4, 5, 6];
  const base = { type, c, rate };

  if (type === "missing-y") {
    const k = pick(level === 0 ? [2, 3, 4, 5] : [3, 4, 5, 6, 7, 8, 9]);
    const known = level === 0 ? 1 : pick([2, 3].filter((n) => n !== k));
    return { ...base, known, k, answer: k * rate, prompt: `How many ${c.unit} go with ${k} ${plural(c, k)}?`, explain: `${k} × ${rate} = ${k * rate} ${c.unit}.`, hint: level === 0 ? `1 ${c.one} → ${rate} ${c.unit}. So ${k} ${c.many} → ${k} × ${rate}.` : `First find the amount for 1 ${c.one}: ${known * rate} ÷ ${known} = ${rate}. Then multiply by ${k}.` };
  }
  if (type === "missing-x") {
    const k = pick([3, 4, 5, 6, 7, 8]);
    const known = pick([1, 2]);
    return { ...base, known, k, answer: k, prompt: `How many ${c.many} go with ${k * rate} ${c.unit}?`, explain: `${k * rate} ÷ ${rate} = ${k} ${c.many}.`, hint: `Each ${c.one} has ${rate} ${c.unit}. Divide: ${k * rate} ÷ ${rate}.` };
  }
  if (type === "scale-from") {
    const known = pick([2, 3, 4]);
    const f = pick([2, 3, 5].filter((n) => known * n <= 12));
    const k = known * f;
    return { ...base, known, k, answer: k * rate, prompt: `The table shows ${known} ${c.many} and ${known * rate} ${c.unit}. How many ${c.unit} go with ${k} ${c.many}?`, explain: `${known} × ${f} = ${k}, and ${known * rate} × ${f} = ${k * rate} ${c.unit}.`, hint: `${known} × ${f} = ${k}. Multiply the ${c.unit} by ${f} too: ${known * rate} × ${f}.` };
  }
  if (type === "pair") {
    const cols = xs.slice(0, 4);
    const k = pick(cols.slice(1));
    return { ...base, cols, k, answer: [k, k * rate], prompt: `Write the ordered pair for the highlighted column. ${c.a} are x. ${c.b} are y.`, explain: `(${k}, ${k * rate}) means ${k} ${c.many} and ${k * rate} ${c.unit}.`, hint: `The column shows ${k} ${c.many} and ${k * rate} ${c.unit}. x comes first.` };
  }
  if (type === "unit" || type === "unit-from") {
    const known = type === "unit" ? pick([2, 3, 4]) : pick([4, 5, 6]);
    return { ...base, known, answer: rate, prompt: `${known} ${c.many} go with ${known * rate} ${c.unit}. What is the unit rate point (1, ?)`, explain: `${known * rate} ÷ ${known} = ${rate}, so the unit rate point is (1, ${rate}).`, hint: `Divide both by ${known}: ${known} ÷ ${known} = 1 and ${known * rate} ÷ ${known} = ?` };
  }
  if (type === "on-graph") {
    // The graph already shows x = 1..3, so ask about a point it does not draw.
    const k = pick([4, 5]);
    const fits = r() < 0.5;
    const y = fits ? k * rate : pick([k + rate, k * rate + rate, k * rate - 1].filter((v) => v > 0 && v !== k * rate));
    return { ...base, k, y, answer: fits ? "yes" : "no", prompt: `The graph shows ${rate} ${c.unit} for every ${c.one}. Is the point (${k}, ${y}) on this graph?`, explain: fits ? `${k} × ${rate} = ${y}, so (${k}, ${y}) is on the line.` : `${k} × ${rate} = ${k * rate}, not ${y}, so (${k}, ${y}) is off the line.`, hint: `Check: ${k} × ${rate} = ${k * rate}. Does it match ${y}?` };
  }
  // plot
  const k = pick([2, 3, 4, 5]);
  return { ...base, k, answer: [k, k * rate], prompt: `Plot the point for ${k} ${c.many}. ${c.a} go right on x; ${c.b.toLowerCase()} go up on y.`, explain: `(${k}, ${k * rate}): ${k} ${c.many} and ${k * rate} ${c.unit}.`, hint: `${k} ${c.many} → ${k} × ${rate} = ${k * rate} ${c.unit}. Go right ${k}, then up to ${k * rate}.` };
}

function problemTable(p, value) {
  const { c, rate } = p;
  if (p.type === "pair") return ratioTable({ top: p.cols, bottom: p.cols.map((x) => x * rate), active: p.k, caption: `${c.a} and ${c.b.toLowerCase()}`, topLabel: c.a, bottomLabel: c.b });
  if (p.type === "missing-y" || p.type === "scale-from") return ratioTable({ top: [p.known, p.k], bottom: [p.known * rate, numberInput("practice-answer", value, `${c.b} for ${p.k} ${plural(c, p.k)}`)], active: 2, caption: `${c.a} and ${c.b.toLowerCase()}`, topLabel: c.a, bottomLabel: c.b });
  if (p.type === "missing-x") return ratioTable({ top: [p.known, numberInput("practice-answer", value, `${c.a} for ${p.k * rate} ${c.unit}`)], bottom: [p.known * rate, p.k * rate], active: 2, caption: `${c.a} and ${c.b.toLowerCase()}`, topLabel: c.a, bottomLabel: c.b });
  if (p.type === "unit" || p.type === "unit-from") return ratioTable({ top: [1, p.known], bottom: [numberInput("practice-answer", value, `${c.b} for 1 ${c.one}`), p.known * rate], active: 1, caption: `${c.a} and ${c.b.toLowerCase()}`, topLabel: c.a, bottomLabel: c.b });
  return "";
}

const GRID_FOR = (p) => ({ xMax: 6, yMax: p.rate * 6, yStep: p.rate });

export const practice = {
  id: "practice",
  label: "Practice",
  fresh: () => ({ seed: Math.floor(Math.random() * 1e6) + 1, number: 0, level: 1, correct: 0, streak: 0, tries: 0, solved: false, value: "", x: "", y: "", choice: "", cursor: { x: 0, y: 0 }, plotted: null }),
  restore(s) {
    const c = obj(s.cursor);
    const p = obj(s.plotted);
    return {
      seed: int(s.seed, 1, 1e6, Math.floor(Math.random() * 1e6) + 1),
      number: int(s.number, 0, 1e5, 0),
      level: int(s.level, 0, 2, 1),
      correct: int(s.correct, 0, 1e5, 0),
      streak: int(s.streak, 0, 1e5, 0),
      tries: int(s.tries, 0, 3, 0),
      solved: s.solved === true,
      value: str(s.value),
      x: str(s.x),
      y: str(s.y),
      choice: s.choice === "yes" || s.choice === "no" ? s.choice : "",
      cursor: { x: int(c.x, 0, 6, 0), y: int(c.y, 0, 108, 0) },
      plotted: Number.isInteger(p.x) && Number.isInteger(p.y) ? { x: int(p.x, 0, 6, 0), y: int(p.y, 0, 108, 0) } : null,
    };
  },
  done: (s) => s.correct >= GOAL,
  problem(s) {
    return makeProblem(s.seed, s.number, s.level);
  },
  render(ctx) {
    const s = ctx.s;
    const p = this.problem(s);
    const reveal = s.solved || s.tries >= 2;
    let work = problemTable(p, s.value);
    if (p.type === "pair") work += `<form id="practice-form" novalidate>${pairInputs("practice", s.x, s.y, p.c.many, p.c.unit)}</form>`;
    else if (["missing-y", "missing-x", "scale-from", "unit", "unit-from"].includes(p.type)) work = `<form id="practice-form" novalidate>${work}</form>`;
    else if (p.type === "on-graph") {
      const pts = [1, 2, 3].map((x) => ({ x, y: x * p.rate, cls: "plotted" }));
      if (s.solved) pts.push({ x: p.k, y: p.y, cls: p.answer === "yes" ? "new" : "miss", label: `(${p.k}, ${p.y})` });
      work = `<div class="graph-wrap">${coordGraph({ ...GRID_FOR(p), points: pts, lines: [{ rate: p.rate }], xLabel: p.c.a, yLabel: p.c.b, label: `Graph of ${p.rate} ${p.c.unit} per ${p.c.one}` })}</div><div class="verdicts" role="group" aria-label="Is the point on the graph?"><button type="button" class="verdict" data-action="practice-choice" data-value="yes" id="practice-yes" aria-pressed="${s.choice === "yes"}" ${s.solved ? "disabled" : ""}>Yes, it is on the line</button><button type="button" class="verdict" data-action="practice-choice" data-value="no" id="practice-no" aria-pressed="${s.choice === "no"}" ${s.solved ? "disabled" : ""}>No, it is off the line</button></div>`;
    } else if (p.type === "plot") {
      const pts = s.plotted ? [{ ...s.plotted, cls: s.solved ? "new" : "miss", label: `(${s.plotted.x}, ${s.plotted.y})` }] : [];
      if (s.tries >= 2 && !s.solved) pts.push({ x: p.answer[0], y: p.answer[1], cls: "new", label: `(${p.answer[0]}, ${p.answer[1]})` });
      work = `<div class="graph-wrap">${coordGraph({ ...GRID_FOR(p), id: "practice-board", interactive: !s.solved && s.tries < 2, cursor: s.cursor, points: pts, xLabel: p.c.a, yLabel: p.c.b, label: `Plotting grid for ${p.c.a.toLowerCase()} and ${p.c.b.toLowerCase()}` })}</div><p class="points-note" id="practice-board-help">${PLOT_HELP}</p>`;
    }
    const answerText = Array.isArray(p.answer) ? `(${p.answer[0]}, ${p.answer[1]})` : p.answer === "yes" ? "Yes, on the line" : p.answer === "no" ? "No, off the line" : p.answer;
    const solution = reveal && !s.solved ? `<div class="hint"><strong>Worked answer:</strong> ${answerText}. ${p.explain}</div>` : "";
    const needsSubmit = ["missing-y", "missing-x", "scale-from", "unit", "unit-from", "pair"].includes(p.type);
    const actions = s.solved || s.tries >= 2 ? btn("practice-next", "Next problem", "success") : needsSubmit ? submitBtn("practice-form", "Check") : "";
    const levels = `<div class="level-tabs" role="group" aria-label="Choose a level">${LEVELS.map((l, i) => `<button type="button" class="level" data-action="level" data-level="${i}" id="level-${i}" aria-pressed="${s.level === i}">${l.name}</button>`).join("")}</div>`;
    const pct = Math.min(100, Math.round((s.correct / GOAL) * 100));
    const meter = `<div class="meter"><div class="meter-label"><span>Goal: ${GOAL} correct</span><strong>${Math.min(s.correct, GOAL)} / ${GOAL}</strong></div><div class="meter-track" role="progressbar" aria-label="Practice goal" aria-valuemin="0" aria-valuemax="${GOAL}" aria-valuenow="${Math.min(s.correct, GOAL)}"><span style="width:${pct}%"></span></div>${s.streak >= 2 ? `<p class="small">🔥 ${s.streak} in a row</p>` : ""}</div>`;
    const board = `<p class="problem-kicker">Problem ${s.number + 1} · ${LEVELS[s.level].name}</p><p class="problem-prompt" id="practice-prompt">${p.prompt}</p>${work}${solution}${s.correct >= GOAL ? '<div class="finish compact"><div class="finish-mark" aria-hidden="true">★</div><h3>Practice goal reached.</h3><p>Keep going, or try the Stretch level.</p></div>' : ""}`;
    const coach = `${meter}${levels}${actions}${s.solved || s.tries >= 2 ? "" : hintBlock(ctx, p.hint) + hintButton(ctx)}<p class="points-note">New contexts, same idea: every equivalent ratio keeps the same amount for one.</p>`;
    return header("Practice with new ratios.", "Solve each problem. Two tries each, then see the worked answer.", `${s.correct} correct`) + workbench(board, coach);
  },
  grade(ctx, right, wrongMsg) {
    const s = ctx.s;
    const p = this.problem(s);
    if (right) {
      s.solved = true;
      s.correct++;
      s.streak++;
      ctx.hint = false;
      ctx.say(`Correct. ${p.explain}`, "success");
      ctx.refresh("act-practice-next");
      return;
    }
    s.tries++;
    s.streak = 0;
    if (s.tries >= 2) {
      ctx.say("Not yet. Study the worked answer, then try the next problem.", "error");
      ctx.refresh("act-practice-next");
    } else {
      ctx.say(wrongMsg, "error");
      ctx.refresh(p.type === "plot" ? "practice-board" : p.type === "pair" ? "practice-x" : p.type === "on-graph" ? "practice-yes" : "practice-answer");
    }
  },
  nextProblem(ctx) {
    Object.assign(ctx.s, { number: ctx.s.number + 1, tries: 0, solved: false, value: "", x: "", y: "", choice: "", cursor: { x: 0, y: 0 }, plotted: null });
    ctx.hint = false;
    ctx.say("");
  },
  action(name, el, ctx) {
    const s = ctx.s;
    const p = this.problem(s);
    if (name === "practice-next") {
      this.nextProblem(ctx);
      const q = this.problem(s);
      ctx.refresh(q.type === "plot" ? "practice-board" : q.type === "pair" ? "practice-x" : q.type === "on-graph" ? "practice-yes" : "practice-answer");
      return true;
    }
    if (name === "level") {
      s.level = Number(el.dataset.level);
      this.nextProblem(ctx);
      ctx.say(`${LEVELS[s.level].name} problems.`);
      ctx.refresh(el.id);
      return true;
    }
    if (name === "practice-choice" && !s.solved && s.tries < 2) {
      s.choice = el.dataset.value;
      this.grade(ctx, s.choice === p.answer, p.answer === "no" ? `Check with multiplication: ${p.k} × ${p.rate} = ${p.k * p.rate}, not ${p.y}.` : `${p.k} × ${p.rate} = ${p.y}, so the point fits the ratio.`);
      return true;
    }
    if (name === "plot" && p.type === "plot" && !s.solved && s.tries < 2) {
      this.plotAt(ctx, Number(el.dataset.x), Number(el.dataset.y));
      return true;
    }
    return false;
  },
  plotAt(ctx, x, y) {
    const s = ctx.s;
    const p = this.problem(s);
    s.cursor = { x, y };
    s.plotted = { x, y };
    const [ax, ay] = p.answer;
    let msg = `(${x}, ${y}) is not the point for ${ax} ${p.c.many}. Go right ${ax}, then up to ${ay}.`;
    if (x === ax) msg = `Right column, wrong height. ${ax} × ${p.rate} = ${ay}.`;
    this.grade(ctx, x === ax && y === ay, msg);
  },
  key(e, ctx) {
    const s = ctx.s;
    const p = this.problem(s);
    if (e.target.id !== "practice-board" || p.type !== "plot" || s.solved || s.tries >= 2) return false;
    if (e.key === "Enter" || e.key === " ") {
      this.plotAt(ctx, s.cursor.x, s.cursor.y);
      return true;
    }
    const next = moveCursor(s.cursor, e.key, GRID_FOR(p));
    if (!next) return false;
    s.cursor = next;
    ctx.say(`Ring at (${next.x}, ${next.y}).`);
    ctx.refresh("practice-board");
    return true;
  },
  input(el, ctx) {
    const s = ctx.s;
    if (el.id === "practice-answer") s.value = el.value;
    else if (el.id === "practice-x") s.x = el.value;
    else if (el.id === "practice-y") s.y = el.value;
    else return false;
    return true;
  },
  submit(id, ctx) {
    if (id !== "practice-form") return false;
    const s = ctx.s;
    if (s.solved || s.tries >= 2) return true;
    const p = this.problem(s);
    if (p.type === "pair") {
      const x = numeric(s.x);
      const y = numeric(s.y);
      ctx.invalid("practice-x", x !== p.answer[0]);
      ctx.invalid("practice-y", y !== p.answer[1]);
      this.grade(ctx, x === p.answer[0] && y === p.answer[1], x === p.answer[1] && y === p.answer[0] ? `The values are reversed. ${p.c.a} are x, so they come first.` : "Use both numbers from the highlighted column.");
      return true;
    }
    const v = numeric(s.value);
    if (v === null) {
      ctx.invalid("practice-answer");
      ctx.feedback("Type a number in the table first.", "error");
      return true;
    }
    let msg = `Not yet. ${p.type === "missing-x" ? "Divide" : "Multiply"} to keep the same amount per ${p.c.one}.`;
    if (p.type === "missing-y" && v === p.k + p.rate) msg = `Adding ${p.rate} changes the relationship. Each ${p.c.one} has ${p.rate} ${p.c.unit}, so multiply.`;
    if (p.type === "missing-x" && v === p.k * p.rate * p.rate) msg = `You multiplied. To find the number of ${p.c.many}, divide by ${p.rate}.`;
    this.grade(ctx, v === p.answer, msg);
    return true;
  },
};

