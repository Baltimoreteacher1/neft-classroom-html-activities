// Stations 5–7: Graph, Compare, Check.
// Graph: plot table columns as ordered pairs, find the origin, read the line,
// name the unit rate point. Compare: decide which tables hold equivalent
// ratios and see why on the graph. Check: the Reveal 4-bag error hunt.

import { coordGraph, moveCursor, PLOT_HELP } from "./graph.mjs";
import { bool, int, intSet, obj, oneOf, str } from "./sanitize.mjs";
import {
  btn,
  choiceList,
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

const RATE = 6;
const GRID = { xMax: 6, yMax: 36, yStep: 6 };

/* ---------------------------------------------------------------- Graph */

const TABLE_X = [1, 2, 3, 5];

const ORIGIN_CHOICES = [
  ["unit", "At (1, 6)"],
  ["origin", "At (0, 0), the origin"],
  ["six", "At (0, 6)"],
];
const UNIT_CHOICES = [
  ["flip", "(6, 1)"],
  ["zero", "(0, 0)"],
  ["unit", "(1, 6)"],
  ["five", "(5, 30)"],
];

function plotMessage(x, y, plotted) {
  if (y === x * RATE && TABLE_X.includes(x)) {
    return plotted.includes(x)
      ? [`(${x}, ${y}) is already plotted. Find a column you have not plotted yet.`, ""]
      : null;
  }
  if (x === 0 && y === 0) return ["The origin (0, 0) fits: 0 bags hold 0 balls. Now plot the table’s columns.", ""];
  if (y === x * RATE) return [`(${x}, ${y}) fits the ratio, but ${x} bags is not in this table. Plot the table’s columns.`, ""];
  if (x === 0) return [`(0, ${y}) would mean 0 bags hold ${y} balls. Start with a column from the table.`, "error"];
  return [`(${x}, ${y}) would mean ${x} ${x === 1 ? "bag holds" : "bags hold"} ${y} balls. ${x} ${x === 1 ? "bag holds" : "bags hold"} ${x * RATE} balls. Go right ${x}, then up to ${x * RATE}.`, "error"];
}

export const graphStation = {
  id: "graph",
  label: "Graph",
  fresh: () => ({ phase: 0, plotted: [], cursor: { x: 0, y: 0 }, line: false, origin: "", read: "", unit: "" }),
  restore(s) {
    const c = obj(s.cursor);
    return {
      phase: int(s.phase, 0, 4, 0),
      plotted: intSet(s.plotted, 1, 5).filter((x) => TABLE_X.includes(x)),
      cursor: { x: int(c.x, 0, GRID.xMax, 0), y: int(c.y, 0, GRID.yMax, 0) - (int(c.y, 0, GRID.yMax, 0) % GRID.yStep) },
      line: bool(s.line),
      origin: oneOf(s.origin, ORIGIN_CHOICES.map(([v]) => v)),
      read: str(s.read),
      unit: oneOf(s.unit, UNIT_CHOICES.map(([v]) => v)),
    };
  },
  done: (s) => s.phase >= 4,
  render(ctx) {
    const s = ctx.s;
    const points = s.plotted.map((x) => ({ x, y: x * RATE, cls: "plotted", label: s.phase === 0 ? `(${x}, ${x * RATE})` : "" }));
    if (s.phase >= 1 && s.line) points.push({ x: 0, y: 0, cls: "origin", label: s.phase >= 2 ? "(0, 0)" : "" });
    if (s.phase >= 3) points.push({ x: 4, y: 24, cls: "new", label: "(4, 24)" });
    if (s.phase >= 4) points.push({ x: 1, y: 6, cls: "unit", label: "(1, 6)" });
    const graph = coordGraph({
      ...GRID,
      id: "plot-board",
      interactive: s.phase === 0,
      cursor: s.cursor,
      points,
      lines: s.line ? [{ rate: RATE }] : [],
      guide: s.phase === 2 ? { x: 4, y: 24 } : null,
      label: s.phase === 0 ? "Plotting grid. Bags on x from 0 to 6, soccer balls on y from 0 to 36 by sixes." : "Graph of bags and soccer balls",
    });
    const table = ratioTable({
      top: TABLE_X,
      bottom: TABLE_X.map((x) => x * RATE),
      marked: s.plotted.map((x) => TABLE_X.indexOf(x) + 1),
      caption: "Plot every column as (bags, balls)",
    });
    let task = "";
    let coach = "";
    if (s.phase === 0) {
      coach = `<h3>Plot the table.</h3><p>Each column is an ordered pair. <strong>Bags → go right.</strong> <strong>Balls → go up.</strong></p><p class="points-note" id="plot-board-help">${PLOT_HELP}</p><div class="notice">Plotted ${s.plotted.length} of ${TABLE_X.length} columns.</div>${hintBlock(ctx, "Start with 1 bag and 6 balls: go right 1 space, then up 1 space (each space up is 6 balls).")}${hintButton(ctx)}`;
    } else if (s.phase === 1) {
      task = s.line ? `<form id="origin-form">${choiceList("origin", "Extend the line back. Where does it start?", ORIGIN_CHOICES, s.origin)}</form>` : "";
      coach = `<h3>Look for a pattern.</h3><p>Every point is 1 space right and 6 balls up from the last bag count.</p>${s.line ? submitBtn("origin-form", "Check where it starts") : btn("draw-line", "Connect the points")}`;
    } else if (s.phase === 2) {
      task = `<form id="read-form" class="inline-form" novalidate>${numberInput("read-answer", s.read, "Soccer balls for 4 bags, read from the line", true)}</form>`;
      coach = `<h3>Read between the columns.</h3><p>The table has no 4-bag column. Follow the dashed guide from 4 bags up to the line, then across to the balls.</p>${submitBtn("read-form", "Check my reading")}${hintBlock(ctx, "4 bags is halfway between the 3-bag point (18) and the 5-bag point (30). Or use the rule: 4 × 6.")}${hintButton(ctx)}`;
    } else if (s.phase === 3) {
      task = `<form id="unit-form">${choiceList("unit", "Which point is the unit rate point?", UNIT_CHOICES, s.unit)}</form>`;
      coach = `<h3>Find the amount for one.</h3><p>The unit rate point shows how many balls go with exactly 1 bag.</p>${submitBtn("unit-form", "Check the point")}`;
    } else {
      task = '<div class="finish compact"><h3>This is a proportional relationship.</h3><ul class="checklist"><li>The points form a <strong>straight line</strong>.</li><li>The line passes through the <strong>origin (0, 0)</strong>.</li><li>The <strong>unit rate point (1, 6)</strong> shows 6 balls per bag.</li><li>Any point on the line, like (4, 24), is an <strong>equivalent ratio</strong>.</li></ul></div>';
      coach = `<h3>Graph complete.</h3><p>“The points line up because every bag holds ___ balls.”</p>${btn("next", "Go to Compare", "success")}`;
    }
    const counters = ["Plot 4 points", "Find the start", "Read the line", "Unit rate point", "Graph complete"];
    const titles = ["A column becomes a point.", "Connect the points.", "Use the line.", "Name the unit rate point.", "Equivalent ratios make a line."];
    const directions = [
      "Plot each column of the table on the coordinate plane.",
      "Draw the line through your points. Then decide where it starts.",
      "How many balls go with 4 bags? Read it from the graph.",
      "One point tells the amount for exactly one bag.",
      "Table, ordered pairs, and line all show 6 balls per bag.",
    ];
    const board = `${table}<div class="graph-wrap">${graph}</div>${task}`;
    return header(titles[s.phase], directions[s.phase], counters[s.phase]) + workbench(board, coach);
  },
  plot(x, y, ctx) {
    const s = ctx.s;
    s.cursor = { x, y };
    const message = plotMessage(x, y, s.plotted);
    if (message) {
      ctx.say(message[0], message[1]);
      ctx.refresh("plot-board");
      return;
    }
    s.plotted.push(x);
    if (s.plotted.length === TABLE_X.length) {
      s.phase = 1;
      ctx.hint = false;
      ctx.say("All 4 columns plotted. The points climb in a steady pattern.", "success");
      ctx.refresh("act-draw-line");
    } else {
      ctx.say(`Plotted (${x}, ${y}): ${x} ${x === 1 ? "bag" : "bags"} and ${y} balls.`, "success");
      ctx.refresh("plot-board");
    }
  },
  action(name, el, ctx) {
    if (name === "plot" && ctx.s.phase === 0) {
      this.plot(Number(el.dataset.x), Number(el.dataset.y), ctx);
      return true;
    }
    if (name === "draw-line") {
      ctx.s.line = true;
      ctx.say("The points line up. Follow the line down and to the left.", "success");
      ctx.refresh("origin-unit");
      return true;
    }
    return false;
  },
  key(e, ctx) {
    if (e.target.id !== "plot-board" || ctx.s.phase !== 0) return false;
    if (e.key === "Enter" || e.key === " ") {
      this.plot(ctx.s.cursor.x, ctx.s.cursor.y, ctx);
      return true;
    }
    const next = moveCursor(ctx.s.cursor, e.key, GRID);
    if (!next) return false;
    ctx.s.cursor = next;
    ctx.say(`Ring at (${next.x}, ${next.y}).`);
    ctx.refresh("plot-board");
    return true;
  },
  input(el, ctx) {
    const s = ctx.s;
    if (el.name === "origin") s.origin = el.value;
    else if (el.name === "unit") s.unit = el.value;
    else if (el.id === "read-answer") s.read = el.value;
    else return false;
    return true;
  },
  submit(id, ctx) {
    const s = ctx.s;
    if (id === "origin-form") {
      if (s.origin !== "origin") {
        ctx.feedback(s.origin === "six" ? "(0, 6) would mean 0 bags hold 6 balls. With no bags, there are no balls." : "The line keeps going below (1, 6). Where are 0 bags and 0 balls?", "error");
        return true;
      }
      s.phase = 2;
      ctx.say("Yes. 0 bags hold 0 balls, so the line starts at the origin (0, 0).", "success");
      ctx.refresh("read-answer");
      return true;
    }
    if (id === "read-form") {
      const v = numeric(s.read);
      if (v !== 24) {
        ctx.invalid("read-answer");
        ctx.feedback(v === 28 ? "Adding 10 skips the pattern. Each bag adds 6 balls: 18 + 6 = ?" : "Follow the guide up from 4 bags to the line. Each bag adds 6 balls.", "error");
        return true;
      }
      s.phase = 3;
      ctx.hint = false;
      ctx.say("(4, 24) is on the line, so 4 : 24 is another equivalent ratio.", "success");
      ctx.refresh("unit-flip");
      return true;
    }
    if (id === "unit-form") {
      if (s.unit !== "unit") {
        const why = { flip: "(6, 1) is reversed. Bags come first: x is 1 bag.", zero: "(0, 0) is the origin: 0 bags, 0 balls.", five: "(5, 30) is a point on the line, but it shows 5 bags, not 1." };
        ctx.feedback(why[s.unit] ?? "Choose a point.", "error");
        return true;
      }
      s.phase = 4;
      ctx.say("(1, 6) is the unit rate point: 1 bag holds 6 balls.", "success");
      ctx.refresh("act-next");
      return true;
    }
    return false;
  },
};

/* -------------------------------------------------------------- Compare */

const TEAMS = [
  { id: "blue", name: "Team Blue", pairs: [[2, 12], [4, 24], [7, 42]], equivalent: true, why: "12 ÷ 2, 24 ÷ 4, and 42 ÷ 7 all equal 6. Every point sits on one line through the origin." },
  { id: "gold", name: "Team Gold", pairs: [[1, 8], [2, 14], [3, 20]], equivalent: false, why: "Gold adds 6 each time, but 1 : 8 is 8 per bag and 2 : 14 is 7 per bag. The line misses the origin, so the ratios are not equivalent." },
  { id: "green", name: "Team Green", pairs: [[2, 10], [3, 15], [6, 30]], equivalent: true, why: "10 ÷ 2, 15 ÷ 3, and 30 ÷ 6 all equal 5. A different ratio from ours, but all three columns match each other." },
];
const TEAM_IDS = TEAMS.map((t) => t.id);
const STEEP_CHOICES = [
  ["green", "Team Green’s line"],
  ["blue", "Team Blue’s line"],
  ["same", "They are equally steep"],
];

function teamGraph(team) {
  const rate = team.pairs[0][1] / team.pairs[0][0];
  const lines = team.equivalent ? [{ rate, cls: team.id }] : [{ from: [0, 2], to: [5.66, 36], cls: team.id }];
  const points = team.pairs.map(([x, y]) => ({ x, y, cls: team.id }));
  if (!team.equivalent) points.push({ x: 0, y: 2, cls: "miss", label: "misses (0, 0)" });
  return coordGraph({ xMax: 7, yMax: 42, yStep: 6, points, lines, xLabel: "Bags", yLabel: "Balls", label: `${team.name} graph`, cls: "mini-graph" });
}

export const compare = {
  id: "compare",
  label: "Compare",
  fresh: () => ({ verdicts: {}, solved: [], steep: "", finished: false }),
  restore(s) {
    const v = obj(s.verdicts);
    return {
      verdicts: Object.fromEntries(TEAM_IDS.map((id) => [id, oneOf(v[id], ["yes", "no"])])),
      solved: Array.isArray(s.solved) ? [...new Set(s.solved.filter((id) => TEAM_IDS.includes(id)))] : [],
      steep: oneOf(s.steep, STEEP_CHOICES.map(([v]) => v)),
      finished: bool(s.finished),
    };
  },
  done: (s) => s.finished,
  render(ctx) {
    const s = ctx.s;
    const cards = TEAMS.map((t) => {
      const solved = s.solved.includes(t.id);
      const verdict = s.verdicts[t.id];
      const choice = (value, text) => `<button type="button" class="verdict" data-action="verdict" data-team="${t.id}" data-value="${value}" id="verdict-${t.id}-${value}" aria-pressed="${verdict === value}" ${solved ? "disabled" : ""}>${text}</button>`;
      return `<section class="team-card ${t.id}${solved ? " solved" : ""}" aria-labelledby="team-${t.id}"><h3 id="team-${t.id}">${t.name}</h3>${ratioTable({ top: t.pairs.map((p) => p[0]), bottom: t.pairs.map((p) => p[1]), caption: "Bags and balls", cls: "mini-table" })}<div class="verdicts" role="group" aria-label="${t.name}: are these ratios equivalent?">${choice("yes", "Equivalent")}${choice("no", "Not equivalent")}</div>${solved ? `<p class="small">${t.why}</p>${teamGraph(t)}` : ""}</section>`;
    }).join("");
    const allSolved = s.solved.length === TEAMS.length;
    const final = allSolved
      ? `<div class="final-compare">${coordGraph({ xMax: 7, yMax: 42, yStep: 6, points: [...TEAMS[0].pairs.map(([x, y]) => ({ x, y, cls: "blue" })), ...TEAMS[2].pairs.map(([x, y]) => ({ x, y, cls: "green" }))], lines: [{ rate: 6, cls: "blue" }, { rate: 5, cls: "green" }], xLabel: "Bags", yLabel: "Balls", label: "Team Blue and Team Green lines on one graph" })}<form id="steep-form">${choiceList("steep", "Which line is steeper?", STEEP_CHOICES, s.steep)}</form></div>`
      : "";
    const coach = allSolved
      ? `<h3>Compare the lines.</h3><p>Blue packs <strong>6</strong> balls per bag. Green packs <strong>5</strong>.</p>${s.finished ? `<div class="notice">More per bag → steeper line. Both proportional lines still start at (0, 0).</div>${btn("next", "Go to Check", "success")}` : submitBtn("steep-form", "Check my choice")}`
      : `<h3>Test every column.</h3><p>Divide balls by bags in each column. If every column gives the <strong>same</strong> amount per bag, the ratios are equivalent.</p><p class="points-note">Solved ${s.solved.length} of ${TEAMS.length} teams.</p>${hintBlock(ctx, "Gold: 8 ÷ 1 = 8, but 14 ÷ 2 = 7. When the per-bag amount changes, the ratios are not equivalent.")}${hintButton(ctx)}`;
    return header("Equivalent or not?", "Three teams packed soccer balls. Decide which tables show equivalent ratios.", allSolved ? "Final question" : `${s.solved.length} / 3 teams`) + workbench(`<div class="team-grid">${cards}</div>${final}`, coach);
  },
  action(name, el, ctx) {
    if (name !== "verdict") return false;
    const s = ctx.s;
    const team = TEAMS.find((t) => t.id === el.dataset.team);
    s.verdicts[team.id] = el.dataset.value;
    const right = (el.dataset.value === "yes") === team.equivalent;
    if (right) {
      if (!s.solved.includes(team.id)) s.solved.push(team.id);
      ctx.say(`${team.name}: ${team.equivalent ? "equivalent" : "not equivalent"}. ${team.why}`, "success");
      const next = TEAMS.find((t) => !s.solved.includes(t.id));
      ctx.refresh(next ? `verdict-${next.id}-yes` : "steep-green");
    } else {
      ctx.say(team.equivalent ? `Check again: divide balls by bags in every ${team.name} column.` : `Check again: 8 ÷ 1 and 14 ÷ 2 give different amounts per bag.`, "error");
      ctx.refresh(el.id);
    }
    return true;
  },
  input(el, ctx) {
    if (el.name !== "steep") return false;
    ctx.s.steep = el.value;
    return true;
  },
  submit(id, ctx) {
    if (id !== "steep-form") return false;
    if (ctx.s.steep !== "blue") {
      ctx.feedback(ctx.s.steep === "green" ? "At 6 bags Green reaches 30 balls, but Blue reaches 36. Which line climbs faster?" : "Look at 6 bags: Blue is at 36, Green at 30. The lines climb at different rates.", "error");
      return true;
    }
    ctx.s.finished = true;
    ctx.say("Yes. Blue’s line is steeper because Blue puts more balls in each bag.", "success");
    ctx.refresh("act-next");
    return true;
  },
};

/* ---------------------------------------------------------------- Check */

const CHECK_BAGS = [1, 2, 4, 10];
const REASONS = [
  ["six", "Multiply bags by 6 to find balls."],
  ["add", "Add 6 to bags to find balls."],
  ["ten", "Multiply both numbers by 10 every time."],
];

export const check = {
  id: "check",
  label: "Check",
  fresh: () => ({ phase: 0, repair: "", reason: "", pairX: "", pairY: "" }),
  restore: (s) => ({ phase: int(s.phase, 0, 4, 0), repair: str(s.repair), reason: oneOf(s.reason, REASONS.map(([v]) => v)), pairX: str(s.pairX), pairY: str(s.pairY) }),
  done: (s) => s.phase === 4,
  render(ctx) {
    const s = ctx.s;
    const phase = s.phase;
    const balls = [6, 12, phase < 2 ? 20 : 24, 60];
    const bottom = balls.map((n, i) => {
      if (phase === 0) return `<button type="button" class="check-cell" data-action="error-cell" data-i="${i}" id="error-${i}" aria-label="Check ${CHECK_BAGS[i]} bags and ${n} balls">${n}</button>`;
      if (phase === 1 && i === 2) return numberInput("repair-answer", s.repair, "Correct soccer balls for 4 bags");
      return n;
    });
    const titles = ["Find the table mistake.", "Repair this column.", "Why does the repaired table work?", "Read the matching pair.", "You connected the ideas."];
    const directions = ["One ball count breaks the rule. Choose that value.", "Keep 6 balls in each of the 4 bags.", "Choose the rule that works for every column.", "Turn the 4-bag column into an ordered pair.", "A ratio table keeps matching quantities together."];
    let content = "";
    let coach = "";
    if (phase === 0) coach = `<h3>Be the table detective.</h3><p>Check one column at a time:<br><strong>bags × 6 = balls</strong>.</p>${hintBlock(ctx, "The columns for 1, 2, and 10 bags keep 6 balls per bag. Check the 4-bag column.")}${hintButton(ctx)}`;
    if (phase === 1) coach = `<h3>4 bags × 6 balls each</h3><p>Replace the incorrect value in the table.</p>${submitBtn("repair-form", "Check my repair")}${hintBlock(ctx, "Double the known pair 2 bags and 12 balls. Double both quantities: 4 bags and __ balls.")}${hintButton(ctx)}`;
    if (phase === 2) {
      content = `<form id="reason-form">${choiceList("reason", "All four columns follow which rule?", REASONS, s.reason)}</form>`;
      coach = `<h3>Check the relationship.</h3><p>Try your rule on 1 bag, then on 4 bags.</p>${submitBtn("reason-form", "Check the rule")}`;
    }
    if (phase === 3) {
      content = `<form id="pair-form" novalidate>${pairInputs("pair", s.pairX, s.pairY, "bags", "balls")}</form>`;
      coach = `<h3>Use the highlighted column.</h3><p>Bags go first. Balls go second. Keep the values from the same column together.</p>${submitBtn("pair-form", "Check my pair")}`;
    }
    if (phase === 4) {
      content = '<div class="finish"><div class="finish-mark" aria-hidden="true">✓</div><h3>Final check complete.</h3><p><strong>4 bags → 24 balls → (4, 24)</strong></p><p>You kept the same relationship: 6 balls for every bag.</p></div>';
      coach = `<h3>Explain your table.</h3><p class="frame">“These ratios are equivalent because every bag has ___ balls.”</p><div class="notice"><strong>Table → point</strong><br>One column gives both coordinates.</div>${btn("next", "Go to Practice", "success")}`;
    }
    const table = ratioTable({ top: CHECK_BAGS, bottom, active: phase > 0 ? 3 : 0, caption: "Same relationship: 6 balls per bag", cls: "check-table" });
    return header(titles[phase], directions[phase], phase === 4 ? "Check complete" : `${phase + 1} / 4 checks`) + workbench((phase === 1 ? `<form id="repair-form" novalidate>${table}</form>` : table) + content, coach);
  },
  action(name, el, ctx) {
    if (name !== "error-cell") return false;
    const i = Number(el.dataset.i);
    if (i === 2) {
      ctx.s.phase = 1;
      ctx.hint = false;
      ctx.say("You found it. Four bags with 6 balls each need more than 20 balls.", "success");
      ctx.refresh("repair-answer");
    } else {
      const n = CHECK_BAGS[i];
      ctx.feedback(`${n} × 6 = ${n * 6}. This column fits the rule. Try another ball count.`, "error");
    }
    return true;
  },
  input(el, ctx) {
    const s = ctx.s;
    if (el.id === "repair-answer") s.repair = el.value;
    else if (el.name === "reason") s.reason = el.value;
    else if (el.id === "pair-x") s.pairX = el.value;
    else if (el.id === "pair-y") s.pairY = el.value;
    else return false;
    return true;
  },
  submit(id, ctx) {
    const s = ctx.s;
    if (id === "repair-form") {
      if (numeric(s.repair) !== 24) {
        ctx.invalid("repair-answer");
        ctx.feedback("Keep 6 balls in all 4 bags. Find 4 × 6.", "error");
        return true;
      }
      s.phase = 2;
      ctx.hint = false;
      ctx.say("Repaired: 4 bags go with 24 balls. Now choose the rule that makes every column work.", "success");
      ctx.refresh("reason-six");
      return true;
    }
    if (id === "reason-form") {
      if (s.reason !== "six") {
        ctx.feedback(s.reason === "add" ? "Adding 6 would give 7 balls for 1 bag. This table shows 6 balls for 1 bag. Try a multiplication rule." : "Choose the rule that connects bags to balls in every column. Test it on 2 bags and 12 balls.", "error");
        return true;
      }
      s.phase = 3;
      ctx.say("Yes. Balls = 6 × bags in every column. Read the 4-bag column as an ordered pair.", "success");
      ctx.refresh("pair-x");
      return true;
    }
    if (id === "pair-form") {
      const x = numeric(s.pairX);
      const y = numeric(s.pairY);
      ctx.invalid("pair-x", x !== 4);
      ctx.invalid("pair-y", y !== 24);
      if (x !== 4 || y !== 24) {
        ctx.feedback(x === 24 && y === 4 ? "The values are reversed. Bags go on x first, and balls go on y second." : "Use the same column: x is 4 bags; y is the matching number of balls.", "error");
        return true;
      }
      s.phase = 4;
      ctx.say("(4, 24) means 4 bags hold 24 balls. The ratio, table column, and graph point describe the same quantities.", "success");
      ctx.refresh("stage-title");
      return true;
    }
    return false;
  },
};

export const GRAPH_STATIONS = [graphStation, compare, check];
