// Stations 1–4: Learn, Explore, Build, Strategies.
// Context: the Reveal Math Lesson 3.4 soccer-ball relationship, 6 balls per bag.

import { coordGraph } from "./graph.mjs";
import { bool, int, intSet, oneOf, strList } from "./sanitize.mjs";
import {
  bags,
  btn,
  choiceList,
  DASH,
  EMPTY,
  header,
  hintBlock,
  hintButton,
  numberInput,
  numeric,
  ratioTable,
  submitBtn,
  workbench,
} from "./views.mjs";

const RATE = 6;

/* ---------------------------------------------------------------- Learn */

const VOCAB = [
  ["Ratio", "A comparison of two quantities.", "1 bag : 6 balls"],
  ["Ratio table", "A table of equivalent ratios. Matching values share a column.", "1 | 2 | 3 over 6 | 12 | 18"],
  ["Equivalent ratios", "Ratios that show the same relationship. Multiply or divide both quantities by the same number.", "2 : 12 = 4 : 24"],
  ["Ordered pair", "Two numbers (x, y) that locate a point. x comes first, y second.", "(3, 18)"],
  ["Coordinate plane", "A grid with a line going across (x-axis) and a line going up (y-axis).", "bags across, balls up"],
  ["Origin", "The point (0, 0), where the two axes cross.", "0 bags → 0 balls"],
  ["Unit rate point", "The point (1, r), where r is the amount for one.", "(1, 6)"],
  ["Proportional", "Two amounts that grow together at the same rate. The graph is a straight line through the origin.", "always 6 balls per bag"],
];

const LEARN_CHOICES = [
  ["nine", "3 bags : 9 balls"],
  ["add", "7 bags : 12 balls"],
  ["right", "3 bags : 18 balls"],
  ["flip", "6 bags : 1 ball"],
];

const LEARN_FEEDBACK = {
  nine: "3 bags : 9 balls is only 3 balls per bag. Our bags hold 6 each.",
  add: "Adding 6 to both numbers changes the relationship. 7 bags : 12 balls is less than 2 balls per bag.",
  flip: "Order matters. Bags come first, then balls: 1 : 6, not 6 : 1.",
};

export const learn = {
  id: "learn",
  label: "Learn",
  fresh: () => ({ answer: "", solved: false }),
  restore: (s) => ({ answer: oneOf(s.answer, LEARN_CHOICES.map(([v]) => v)), solved: bool(s.solved) }),
  done: (s) => s.solved,
  render(ctx) {
    const s = ctx.s;
    const views = `<div class="trio" role="list">
<section class="view-card" role="listitem"><h3><span class="tag">Words</span> A ratio</h3>${bags(1, { label: false })}<p>For every <strong class="green">1 bag</strong>, there are <strong class="orange">6 soccer balls</strong>.</p><p class="big-ratio">1 : 6</p></section>
<section class="view-card" role="listitem"><h3><span class="tag">Table</span> Equivalent ratios</h3>${ratioTable({ top: [1, 2, 3], bottom: [6, 12, 18], caption: "Each column is one ratio", cls: "mini-table" })}<p class="small">Multiply <em>both</em> rows by the same number to make a new column.</p></section>
<section class="view-card" role="listitem"><h3><span class="tag">Graph</span> Ordered pairs</h3>${coordGraph({ xMax: 4, yMax: 24, points: [{ x: 0, y: 0, cls: "origin" }, { x: 1, y: 6 }, { x: 2, y: 12 }, { x: 3, y: 18, label: "(3, 18)" }], lines: [{ rate: RATE }], label: "Points (1, 6), (2, 12), and (3, 18) on a straight line through the origin", cls: "mini-graph" })}<p class="small">Each column becomes a point (bags, balls).</p></section>
</div>`;
    const vocab = `<h3 class="section-title">Words to use</h3><dl class="vocab-grid">${VOCAB.map(([term, def, ex]) => `<div class="vocab-card"><dt>${term}</dt><dd>${def}<span class="vocab-ex">${ex}</span></dd></div>`).join("")}</dl>`;
    const quiz = `<form id="learn-form" class="quick-check">${choiceList("learn", "Quick check: Which ratio is equivalent to 1 bag : 6 balls?", LEARN_CHOICES, s.answer)}</form>`;
    const coach = `<h3>Say it with a frame.</h3><p class="frame">“For every ___ bag, there are ___ soccer balls.”</p><p>Every view shows the <strong>same relationship</strong>: 6 balls for every bag.</p>${s.solved ? `<div class="notice"><strong>Ready.</strong> 3 : 18 keeps 6 balls in every bag.</div>${btn("next", "Start exploring", "success")}` : submitBtn("learn-form", "Check my answer")}`;
    return header("One relationship, three views.", "Study the words, table, and graph. Then answer the quick check.", s.solved ? "Check complete" : "1 quick check") + workbench(views + vocab + quiz, coach);
  },
  input(el, ctx) {
    if (el.name !== "learn") return false;
    ctx.s.answer = el.value;
    return true;
  },
  submit(id, ctx) {
    if (id !== "learn-form") return false;
    const s = ctx.s;
    if (s.answer === "right") {
      s.solved = true;
      ctx.say("Yes. 3 bags : 18 balls is 1 : 6 multiplied by 3. Both ratios show 6 balls per bag.", "success");
      ctx.refresh("stage-title");
    } else ctx.feedback(LEARN_FEEDBACK[s.answer] ?? "Choose one ratio, then check it.", "error");
    return true;
  },
};

/* -------------------------------------------------------------- Explore */

export const explore = {
  id: "explore",
  label: "Explore",
  fresh: () => ({ bags: 1 }),
  restore: (s) => ({ bags: int(s.bags, 1, 6, 1) }),
  done: (s) => s.bags >= 3,
  render(ctx) {
    const n = ctx.s.bags;
    const top = [];
    const bottom = [];
    for (let i = 1; i <= 6; i++) {
      top.push(i <= n ? i : DASH);
      bottom.push(i <= n ? i * RATE : DASH);
    }
    const board = `${ratioTable({ top, bottom, active: n })}<p class="table-note">Read down the highlighted column: <strong>${n} ${n === 1 ? "bag goes" : "bags go"} with ${n * RATE} balls.</strong></p>${bags(n)}<div class="math-strip"><span class="green">+ 1 bag</span><span>means</span><span class="orange">+ 6 balls</span><span class="divider" aria-hidden="true"></span><span>Down each column:</span><strong>bags × 6 = balls</strong></div>`;
    const coach = `<h3>One bag holds 6 balls.</h3><p>A new bag brings a new group of six. Keep each bag count with its matching ball count.</p>${btn("add-bag", n === 6 ? "All 6 bags packed" : "Add a bag", "primary", n === 6 ? "disabled" : "")}${btn("remove-bag", "Remove a bag", "secondary", n === 1 ? "disabled" : "")}${n >= 3 ? '<div class="notice"><strong>Same relationship.</strong><br>The totals grow. Each bag still holds 6 balls, so every column is an equivalent ratio.</div>' : '<p class="points-note">Add at least 2 more bags to see the pattern.</p>'}`;
    return header("Grow the table.", "Add a bag. Watch both rows change together.", `${n} / 6 bags`) + workbench(board, coach);
  },
  action(name, _el, ctx) {
    const s = ctx.s;
    if (name === "add-bag" && s.bags < 6) {
      s.bags++;
      ctx.say(`Added 1 bag and 6 balls. ${s.bags} bags now go with ${s.bags * RATE} balls.`, "success");
      ctx.refresh(s.bags === 6 ? "next" : "act-add-bag");
      return true;
    }
    if (name === "remove-bag" && s.bags > 1) {
      s.bags--;
      ctx.say(`Removed 1 bag and 6 balls. ${s.bags} ${s.bags === 1 ? "bag goes" : "bags go"} with ${s.bags * RATE} balls.`);
      ctx.refresh(s.bags === 1 ? "act-add-bag" : "act-remove-bag");
      return true;
    }
    return false;
  },
};

/* ---------------------------------------------------------------- Build */

export const build = {
  id: "build",
  label: "Build",
  fresh: () => ({ index: 0, values: ["", "", "", ""], solved: [] }),
  restore: (s) => ({ index: int(s.index, 0, 3, 0), values: strList(s.values, 4), solved: intSet(s.solved, 0, 3) }),
  done: (s) => s.solved.length === 4,
  render(ctx) {
    const { index, values, solved } = ctx.s;
    const n = index + 3;
    const done = solved.includes(index);
    const bottom = [6, 12];
    for (let i = 0; i < 4; i++) {
      if (solved.includes(i)) bottom.push((i + 3) * RATE);
      else if (i === index) bottom.push(numberInput("build-answer", values[i], `Soccer balls for ${n} bags`));
      else bottom.push(EMPTY);
    }
    const board = `<form id="build-form" novalidate>${ratioTable({ top: [1, 2, 3, 4, 5, 6], bottom, active: n })}</form><p class="table-note"><span class="pair-chip">${n} bags</span><span>× 6 balls per bag</span></p>${ctx.hint ? bags(n) : '<div class="math-strip"><span>Every column keeps</span><strong>6 balls in each bag.</strong></div>'}`;
    const coach = `<h3>${n} bags. How many balls?</h3><p>Type the missing value directly in the table.</p>${done ? btn("build-next", index === 3 ? "Table complete · go to Strategies" : "Next column", "success") : submitBtn("build-form", "Check this column")}${hintBlock(ctx, `${n} groups of 6 means ${n} × 6. Count the balls in the model, or add 6 a total of ${n} times.`)}${hintButton(ctx)}`;
    return header("Fill the matching value.", "How many balls go with the highlighted bag count?", `${index + 1} / 4 columns`) + workbench(board, coach);
  },
  input(el, ctx) {
    if (el.id !== "build-answer") return false;
    ctx.s.values[ctx.s.index] = el.value;
    return true;
  },
  action(name, _el, ctx) {
    if (name !== "build-next") return false;
    if (ctx.s.index === 3) ctx.go(ctx.step + 1);
    else {
      ctx.s.index++;
      ctx.hint = false;
      ctx.say("");
      ctx.refresh("build-answer");
    }
    return true;
  },
  submit(id, ctx) {
    if (id !== "build-form") return false;
    const s = ctx.s;
    const n = s.index + 3;
    const answer = numeric(s.values[s.index]);
    if (answer === n * RATE) {
      if (!s.solved.includes(s.index)) s.solved.push(s.index);
      ctx.say(`${n} × 6 = ${answer}. The column ${n} : ${answer} keeps 6 balls per bag.`, "success");
      ctx.refresh("act-build-next");
    } else {
      ctx.invalid("build-answer");
      ctx.feedback(answer === n + RATE ? `Adding 6 to the bag count changes the relationship. Use ${n} groups of 6 balls.` : `Try ${n} groups of 6. Multiply ${n} × 6, then enter the ball count.`, "error");
    }
    return true;
  },
};

/* ----------------------------------------------------------- Strategies */

const STRATEGIES = [
  { name: "Multiply both", known: [[2, 12]], target: 6, moves: [["x2", "× 2"], ["x3", "× 3"], ["p4", "+ 4"]], correct: "x3", hint: "6 ÷ 2 = 3. Multiply the bags AND the balls by 3." },
  { name: "Divide both", known: [[12, 72]], target: 2, moves: [["d2", "÷ 2"], ["d6", "÷ 6"], ["m10", "− 10"]], correct: "d6", hint: "12 ÷ 6 = 2. Divide the bags AND the balls by 6." },
  { name: "Add two columns", known: [[2, 12], [3, 18]], target: 5, moves: [["add", "Add the columns"], ["x5", "× 5"], ["p3", "+ 3"]], correct: "add", hint: "2 bags + 3 bags = 5 bags. Add the matching balls too: 12 + 18." },
  { name: "Find the unit rate", known: [[5, 30]], target: 1, moves: [["d5", "÷ 5"], ["d6", "÷ 6"], ["m4", "− 4"]], correct: "d5", hint: "5 ÷ 5 = 1. Divide the 30 balls by 5 as well. The answer is the amount for ONE bag." },
  { name: "Use the unit rate", known: [[1, 6]], target: 10, moves: [["x10", "× 10"], ["x6", "× 6"], ["p9", "+ 9"]], correct: "x10", hint: "1 × 10 = 10. Multiply the 6 balls by 10 too." },
];

const MOVE_IDS = STRATEGIES.flatMap((q) => q.moves.map(([id]) => id));

function applyMove(move, q, row) {
  const values = q.known.map((col) => col[row]);
  if (move === "add") return values.reduce((a, b) => a + b, 0);
  const n = Number(move.replace(/^\D+/, ""));
  const v = values[0];
  return { x: v * n, d: v / n, p: v + n, m: v - n }[move[0]];
}

function moveText(move, q, row) {
  const values = q.known.map((col) => col[row]);
  if (move === "add") return values.join(" + ");
  const n = move.replace(/^\D+/, "");
  return `${values[0]} ${{ x: "×", d: "÷", p: "+", m: "−" }[move[0]]} ${n}`;
}

export const strategies = {
  id: "strategies",
  label: "Strategies",
  fresh: () => ({ index: 0, moves: ["", "", "", "", ""], values: ["", "", "", "", ""], solved: [] }),
  restore: (s) => ({
    index: int(s.index, 0, 4, 0),
    moves: strList(s.moves, 5).map((m) => oneOf(m, MOVE_IDS)),
    values: strList(s.values, 5),
    solved: intSet(s.solved, 0, 4),
  }),
  done: (s) => s.solved.length === STRATEGIES.length,
  render(ctx) {
    const s = ctx.s;
    const q = STRATEGIES[s.index];
    const move = s.moves[s.index];
    const done = s.solved.includes(s.index);
    const answer = q.target * RATE;
    const top = [...q.known.map((c) => c[0]), q.target];
    const bottom = [...q.known.map((c) => c[1]), done ? answer : numberInput("strategy-answer", s.values[s.index], `Soccer balls for ${q.target} bags`)];
    const strip = move
      ? `<div class="math-strip"><span class="green">Bags: ${moveText(move, q, 0)} = ${applyMove(move, q, 0)}</span><span class="orange">Balls: ${moveText(move, q, 1)} = ${done ? answer : "?"}</span></div>`
      : '<div class="math-strip"><span>Choose a move. Whatever you do to the bags, do to the balls.</span></div>';
    const board = `<form id="strategy-form" novalidate>${ratioTable({ top, bottom, active: top.length, marked: q.known.map((_, i) => i + 1), caption: `Known ${q.known.length > 1 ? "columns" : "column"} → new column` })}</form>${strip}${done ? `<p class="table-note"><strong>${q.known.map((c) => `${c[0]} : ${c[1]}`).join(" and ")} and ${q.target} : ${answer} are equivalent.</strong></p>` : ""}`;
    const toolkit = `<ol class="toolkit" aria-label="Strategy toolkit">${STRATEGIES.map((t, i) => `<li class="${s.solved.includes(i) ? "got" : ""}${i === s.index ? " now" : ""}"><span aria-hidden="true">${s.solved.includes(i) ? "✓" : i + 1}</span>${t.name}${s.solved.includes(i) ? '<span class="sr-only"> (complete)</span>' : ""}</li>`).join("")}</ol>`;
    const moves = `<div class="factor-grid" role="group" aria-label="Choose the move for both rows">${q.moves.map(([id, label]) => `<button type="button" class="factor" data-action="move" data-move="${id}" id="move-${id}" aria-pressed="${move === id}" ${done ? "disabled" : ""}>${label}</button>`).join("")}</div>`;
    const coach = `<h3>${q.name}: ${q.known.map((c) => c[0]).join(" and ")} → ${q.target} ${q.target === 1 ? "bag" : "bags"}</h3><p>Pick the move. Then fill the ball count.</p>${moves}${done ? btn("strategy-next", s.index === STRATEGIES.length - 1 ? "Toolkit complete · go to Graph" : "Next strategy", "success") : submitBtn("strategy-form", "Check both rows")}${hintBlock(ctx, q.hint)}${hintButton(ctx)}${toolkit}`;
    return header("Use a strategy.", "Make a new equivalent ratio from the columns you know.", `${s.index + 1} / ${STRATEGIES.length} strategies`) + workbench(board, coach);
  },
  input(el, ctx) {
    if (el.id !== "strategy-answer") return false;
    ctx.s.values[ctx.s.index] = el.value;
    return true;
  },
  action(name, el, ctx) {
    const s = ctx.s;
    if (name === "move") {
      s.moves[s.index] = el.dataset.move;
      ctx.say("Move selected. Use it on both rows.");
      ctx.refresh(el.id);
      return true;
    }
    if (name === "strategy-next") {
      if (s.index === STRATEGIES.length - 1) ctx.go(ctx.step + 1);
      else {
        s.index++;
        ctx.hint = false;
        ctx.say("");
        ctx.refresh(`move-${STRATEGIES[s.index].moves[0][0]}`);
      }
      return true;
    }
    return false;
  },
  submit(id, ctx) {
    if (id !== "strategy-form") return false;
    const s = ctx.s;
    const q = STRATEGIES[s.index];
    const move = s.moves[s.index];
    if (move !== q.correct) {
      if (!move) ctx.feedback(`Choose a move that turns the known bags into ${q.target}.`, "error");
      else if (/^[pm]/.test(move)) ctx.feedback("Adding or subtracting the same number breaks the relationship. Multiply, divide, or add whole columns instead.", "error");
      else ctx.feedback(`That gives ${applyMove(move, q, 0)} bags. Which move gives ${q.target} ${q.target === 1 ? "bag" : "bags"}?`, "error");
      return true;
    }
    const answer = numeric(s.values[s.index]);
    if (answer !== q.target * RATE) {
      ctx.invalid("strategy-answer");
      ctx.feedback(`The move is right. Do the same to the balls: ${moveText(move, q, 1)} = ?`, "error");
      return true;
    }
    if (!s.solved.includes(s.index)) s.solved.push(s.index);
    ctx.say(`${q.name}: ${moveText(move, q, 1)} = ${answer}. ${q.target} : ${answer} still has 6 balls per bag.`, "success");
    ctx.refresh("act-strategy-next");
    return true;
  },
};

export const CORE_STATIONS = [learn, explore, build, strategies];
