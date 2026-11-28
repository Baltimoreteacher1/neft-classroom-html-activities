// Math Literacy Studio: the eighteen grade 1-5 manipulatives (inventory.json, bands "1-2" and "3-5"), defined with defineManip (manip-kit.js).
// Every one is controls -> state -> a Visuals spec (visuals.js) plus a plain-language summary that STATES the values, so the picture is never
// the only way to read it. Nothing is drag-only: every control is a stepper (+ / - buttons and a typed field), a choice, a toggle or a button.
// Rules every model follows: it never throws; it clamps a number that depends on another control and SAYS so in the summary (or, when the state
// has no valid reading, returns `error` text instead of a picture); the summary always matches what is drawn.
// Styles: the framework classes live in mls-play.css; the few extras here (action buttons, the decimal grid, tables) use mls-play-manips-a.css,
// which this file asks for lazily (util.js ensureStylesheet) and which works without being loaded.
import { gcd, MINUS, num, TIMES } from "./kit.js";
import { defineManip } from "./manip-kit.js";
import { h } from "./ui-kit.js";
import { renderVisual } from "./visuals.js";

/* ---------------------------------------------------------------- shared helpers */

let cssAsked = false;
function loadCss() {
  if (cssAsked || typeof document === "undefined") return;
  cssAsked = true;
  import("../util.js").then((m) => m.ensureStylesheet("mls-play-manips-a.css")).catch(() => {});
}
/** start(opts): a caller may pass { start: { controlId: value } } to open a manipulative on chosen values. */
const seed = (opts) => {
  loadCss();
  return opts && typeof opts === "object" && opts.start && typeof opts.start === "object" ? opts.start : {};
};
/** A whole number from any input, clamped to [lo, hi]; anything unreadable becomes lo. */
const I = (v, lo, hi) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : lo;
};
const oneOf = (v, allowed, dflt) => (allowed.map(String).includes(String(v)) ? String(v) : dflt);
const plural = (n, one, many = `${one}s`) => (n === 1 ? one : many);
const list = (xs) => (xs.length <= 1 ? xs.join("") : xs.length === 2 ? xs.join(" and ") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
/** Lowest terms of n/d with an integer-aware label ("0", "1", "3/4"). */
const lowest = (n, d) => {
  const g = gcd(n, d);
  return { n: n / g, d: d / g, text: d / g === 1 ? String(n / g) : `${n / g}/${d / g}` };
};
/** Exact decimal text of n / 10^places (trailing zeros trimmed), no floating point. */
const decText = (n, places) => {
  const s = String(Math.abs(n)).padStart(places + 1, "0");
  const i = s.slice(0, s.length - places);
  const f = s.slice(s.length - places).replace(/0+$/, "");
  return `${n < 0 ? MINUS : ""}${i}${f ? `.${f}` : ""}`;
};
const svgNode = (spec, label) => {
  const v = renderVisual(spec);
  const d = h("div", { class: "ml-man-svg" });
  d.innerHTML = v.svg; // our own generated SVG (escaped by visuals.js)
  return label ? h("figure", { class: "ml-man-sub" }, h("figcaption", {}, label), d) : d;
};
/** Rows of a manipulative's control panel that are not relevant to the current mode are hidden (and so leave the tab order). */
function showControls(node, ids) {
  queueMicrotask(() => {
    const root = node.closest?.(".ml-man");
    if (!root) return;
    root.querySelectorAll(".ml-man-controls [data-ctl]").forEach((n) => {
      const row = n.closest(".ml-man-row");
      if (!row) return;
      const off = !ids.includes(n.dataset.ctl);
      row.hidden = off;
      row.style.display = off ? "none" : "";
    });
  });
}
/** Change a control from a button: the framework's own input handles the change, so state, summary and picture stay in one place. */
function poke(root, ctl, value) {
  const f = root?.querySelector(`[data-ctl="${ctl}"]`);
  if (!f) return;
  if (f.tagName === "SELECT" && ![...f.options].some((o) => o.value === String(value))) f.append(h("option", { value: String(value) }, String(value)));
  f.value = String(value);
  f.dispatchEvent(new Event("change", { bubbles: true }));
}
/** A real button. A button that cannot act now stays focusable (aria-disabled) so keyboard focus is not lost when a press makes it unavailable. */
function action(key, label, enabled, run) {
  const b = h(
    "button",
    {
      type: "button",
      class: "btn small",
      "data-act": key,
      "aria-disabled": enabled ? null : "true",
      onclick: () => {
        const root = b.closest(".ml-man");
        if (!enabled || !root) return;
        run(root);
        root.querySelector(`[data-act="${key}"]`)?.focus();
      },
    },
    label,
  );
  return b;
}
const box = (...kids) => h("div", { class: "ml-man-extra" }, ...kids);
const actions = (...btns) => h("div", { class: "ml-man-actions", role: "group", "aria-label": "Actions" }, ...btns);
const note = (t) => h("p", { class: "ml-man-note" }, t);
const step = (id, label, min, max, value, st = 1) => ({ id, label, type: "stepper", min, max, step: st, value });
const choice = (id, label, options, value) => ({ id, label, type: "choice", options, value });
const toggle = (id, label, value = false) => ({ id, label, type: "toggle", value });

/* ---------------------------------------------------------------- grades 1-2 */

const tenframe = defineManip({
  id: "tenframe",
  title: "Ten frames",
  band: "1-2",
  purpose: "Build a number on a ten frame to see how it is made of ten and some more, and how many more make ten.",
  notice: ["How many more counters make ten? How do you know without counting them all?", "What does the frame look like when the top row is full? What does 8 look like compared with 10?", "What changes when you go past ten and the second frame starts?"],
  controls: [step("n", "Counters on the frame", 0, 20, 7), toggle("two", "Use two frames", false)],
  start: seed,
  model(s) {
    const n = I(s.n, 0, 20);
    const frames = n > 10 || s.two ? 2 : 1;
    const f1 = Math.min(n, 10);
    const f2 = n - f1;
    let t = `${n} ${plural(n, "counter")} on ${frames === 1 ? "one ten frame" : "two ten frames"}. `;
    t += frames === 1 ? `${n} ${plural(n, "space")} filled and ${10 - n} empty. ` : `Frame 1 has ${f1} filled and ${10 - f1} empty. Frame 2 has ${f2} filled and ${10 - f2} empty. `;
    if (n < 10) t += `${10 - n} more ${plural(10 - n, "counter")} make ten: ${n} + ${10 - n} = 10.`;
    else if (n === 10) t += "The frame is full. That is ten.";
    else t += `${n} is ten and ${n - 10} more: 10 + ${n - 10} = ${n}.`;
    if (n > 10 && !s.two) t += " The second frame is shown because there are more than 10 counters.";
    return { spec: { kind: "tenframe", n, frames }, summary: t };
  },
});

const bonds = defineManip({
  id: "bonds",
  title: "Number bonds",
  band: "1-2",
  purpose: "Break a whole into two parts and find the missing number so the two parts always total the whole.",
  notice: ["Which two numbers make this whole? Can you find another pair?", "Hide a part. What goes with the part you can see to make the whole?", "If one part gets bigger by 1, what must happen to the other part?"],
  controls: [
    step("a", "Part A", 0, 20, 4),
    step("b", "Part B", 0, 20, 6),
    choice("hide", "Hide one number", [["none", "Show all three"], ["whole", "Hide the whole"], ["a", "Hide part A"], ["b", "Hide part B"]], "b"),
    step("guess", "My number for the hidden spot", 0, 20, 0),
    toggle("check", "Check my number", false),
  ],
  start: seed,
  model(s) {
    const a = I(s.a, 0, 20);
    const b = I(s.b, 0, 20);
    const g = I(s.guess, 0, 20);
    const w = a + b;
    if (w > 20) return { error: "The two parts make more than 20. This number bond stops at 20, so make the parts total 20 or less." };
    const hide = oneOf(s.hide, ["none", "whole", "a", "b"], "none");
    if (hide === "none") return { spec: { kind: "bond", whole: w, a, b, hide: null }, summary: `A number bond. The whole is ${w}. The parts are ${a} and ${b}. ${a} + ${b} = ${w}.` };
    const names = { whole: "the whole", a: "part A", b: "part B" };
    const known = { whole: `The parts are ${a} and ${b}.`, a: `The whole is ${w} and part B is ${b}.`, b: `The whole is ${w} and part A is ${a}.` }[hide];
    const right = g === { whole: w, a, b }[hide];
    let t = `A number bond with ${names[hide]} hidden. ${known} Your number for the hidden spot is ${g}. `;
    if (!s.check) t += "Turn on Check to test it.";
    else if (hide === "whole") t += right ? `Check: ${a} + ${b} = ${g}. Yes. The parts total your whole.` : `Check: ${a} and ${b} do not total ${g}. Not yet. Add the two parts again.`;
    else {
      const other = hide === "a" ? b : a;
      t += right ? `Check: ${g} + ${other} = ${w}. Yes. The parts total the whole.` : `Check: ${g} + ${other} is ${g + other}, not ${w}. Not yet. What goes with ${other} to make ${w}?`;
    }
    return { spec: { kind: "bond", whole: w, a, b, hide: s.check && right ? null : hide }, summary: t };
  },
});

const counters = defineManip({
  id: "counters",
  title: "Counting objects",
  band: "1-2",
  purpose: "Count a set of objects by grouping them in 2s, 5s or 10s so you can count faster and see how many.",
  notice: ["How is counting by 5s faster than counting by 1s?", "What is left over when you make groups of 5? How does that change the total?", "Does the total change when you change the group size?"],
  controls: [step("n", "How many objects", 0, 30, 17), choice("group", "Group them by", [["0", "Not grouped (rows of 10)"], ["2", "2s"], ["5", "5s"], ["10", "10s"]], "5"), choice("shape", "Shape", [["circle", "Circles"], ["square", "Squares"], ["star", "Stars"], ["triangle", "Triangles"]], "circle")],
  start: seed,
  model(s) {
    const n = I(s.n, 0, 30);
    const g = Number(oneOf(s.group, [0, 2, 5, 10], "0"));
    const shape = oneOf(s.shape, ["circle", "square", "star", "triangle"], "circle");
    const names = { circle: "circles", square: "squares", star: "stars", triangle: "triangles" };
    if (n === 0) return { spec: { kind: "counters", n: 0, perRow: g || 10, shape }, summary: "There are no objects. The total is 0." };
    let t = `${n} ${names[shape]} in all. `;
    if (g === 0) t += "They are shown in rows of 10.";
    else {
      const full = Math.floor(n / g);
      const left = n % g;
      const skip = Array.from({ length: full }, (_, i) => (i + 1) * g);
      t += `Grouped by ${g}s in rows of ${g}: ${full} full ${plural(full, "group")} of ${g}${left ? ` and ${left} left over` : " and none left over"}. `;
      if (full) t += `Counting by ${g}s: ${skip.join(", ")}${left ? `, then ${left} more makes ${n}` : ""}. `;
      t += `${full} ${TIMES} ${g}${left ? ` + ${left}` : ""} = ${n}.`;
    }
    return { spec: { kind: "counters", n, perRow: g || 10, shape }, summary: t };
  },
});

const placevalue = defineManip({
  id: "placevalue",
  title: "Place-value blocks",
  band: "1-2",
  purpose: "Build a number from hundreds, tens and ones, and trade blocks (10 ones for a ten) without changing the number.",
  notice: ["What stays the same when you trade 10 ones for 1 ten? What changes?", "How many blocks are there with 10 ones, and how many after you trade them? Why is the second way easier to read?", "Which digit tells you how many tens?"],
  controls: [step("hundreds", "Hundreds (flats)", 0, 9, 1), step("tens", "Tens (rods)", 0, 20, 2), step("ones", "Ones (cubes)", 0, 30, 13)],
  start: seed,
  model(s) {
    const hu = I(s.hundreds, 0, 9);
    const te = I(s.tens, 0, 20);
    const on = I(s.ones, 0, 30);
    const total = 100 * hu + 10 * te + on;
    if (total > 999) return { error: "These blocks make more than 999. This tool stops at 999, so use fewer blocks." };
    const tens = Math.floor((total % 100) / 10);
    const ones = total % 10;
    const hundredsDigit = Math.floor(total / 100);
    let t = total === 0 ? "There are no blocks. The number is 0." : `The blocks show ${hu} ${plural(hu, "hundred")}, ${te} ${plural(te, "ten")} and ${on} ${plural(on, "one")}: ${[hu && `${hu * 100}`, te && `${te * 10}`, on && `${on}`].filter(Boolean).join(" + ")} = ${total}. `;
    if (total > 0) {
      if (on >= 10 || te >= 10) t += `Some blocks can be traded: written with the fewest blocks, ${total} is ${hundredsDigit} ${plural(hundredsDigit, "hundred")}, ${tens} ${plural(tens, "ten")} and ${ones} ${plural(ones, "one")}.`;
      else t += `The digits are ${hu}, ${te}, ${on}, so the number is ${total}.`;
    }
    const canTradeOnes = on >= 10 && te < 20;
    const canTradeTens = te >= 10 && hu < 9;
    const canBreakTen = te >= 1 && on <= 20;
    const canBreakHundred = hu >= 1 && te <= 10;
    const trade = (first, second) => (root) => {
      poke(root, first[0], first[1]);
      poke(root, second[0], second[1]);
    };
    const ex = box(
      total === 0 ? note("No blocks yet. Add some with the steppers.") : null,
      actions(
        action("t-ones", "Trade 10 ones for 1 ten", canTradeOnes, trade(["ones", on - 10], ["tens", te + 1])),
        action("t-tens", "Trade 10 tens for 1 hundred", canTradeTens, trade(["tens", te - 10], ["hundreds", hu + 1])),
        action("b-ten", "Break 1 ten into 10 ones", canBreakTen, trade(["tens", te - 1], ["ones", on + 10])),
        action("b-hundred", "Break 1 hundred into 10 tens", canBreakHundred, trade(["hundreds", hu - 1], ["tens", te + 10])),
      ),
    );
    return total === 0 ? { extra: ex, summary: t } : { spec: { kind: "placevalue", hundreds: hu, tens: te, ones: on }, extra: ex, summary: t };
  },
});

const numberline = defineManip({
  id: "numberline",
  title: "Number lines",
  band: "1-2",
  purpose: "Place a number on a line, hop forward or back, and see whole numbers, fractions and decimals as points in order.",
  notice: ["Where is the marker, and how far is it from 0? From the end?", "Which way do you hop to add? To subtract? Where do you land?", "Between which two whole numbers is the marker? How do you know?"],
  controls: [
    choice("mode", "Kind of number", [["whole", "Whole numbers"], ["frac", "Fractions from 0 to 1"], ["dec", "Decimals between two whole numbers"]], "whole"),
    choice("max", "The line goes from 0 to", [["10", "10"], ["20", "20"], ["50", "50"], ["100", "100"]], "20"),
    choice("tick", "Tick marks every", [["1", "1"], ["2", "2"], ["5", "5"], ["10", "10"]], "1"),
    choice("den", "Equal parts in 1 (denominator)", [["2", "halves (2)"], ["3", "thirds (3)"], ["4", "fourths (4)"], ["5", "fifths (5)"], ["6", "sixths (6)"], ["8", "eighths (8)"], ["10", "tenths (10)"], ["12", "twelfths (12)"]], "4"),
    step("win", "The line starts at the whole number", 0, 9, 0),
    step("marker", "Marker (the number, the numerator, or hundredths)", 0, 100, 7),
    step("hop", "Hop (positive is forward, negative is back)", -20, 20, 5),
  ],
  start: seed,
  model(s) {
    const mode = oneOf(s.mode, ["whole", "frac", "dec"], "whole");
    const marker = I(s.marker, 0, 100);
    const hop = I(s.hop, -20, 20);
    const sign = (v) => (v > 0 ? "+" : MINUS);
    let spec;
    let t;
    if (mode === "whole") {
      const M = Number(oneOf(s.max, [10, 20, 50, 100], "20"));
      const tk = Number(oneOf(s.tick, [1, 2, 5, 10], "1"));
      const m = Math.min(marker, M);
      const to = Math.max(0, Math.min(M, m + hop));
      const real = to - m;
      const marks = [{ at: m, label: String(m) }];
      if (real) marks.push({ at: to, label: String(to), hollow: true });
      spec = { kind: "numberline", min: 0, max: M, ticks: M / tk, show: "int", marks, hops: real ? [{ from: m, to, label: `${sign(real)}${Math.abs(real)}` }] : [] };
      t = `A number line from 0 to ${M} with tick marks every ${tk}. The marker is at ${m}.`;
      if (marker > M) t += ` (The marker you set, ${marker}, is past the end of this line, so it sits at ${M}.)`;
      if (real) t += ` A hop of ${sign(real)}${Math.abs(real)} goes from ${m} to ${to}: ${m} ${real > 0 ? "+" : MINUS} ${Math.abs(real)} = ${to}.${hop !== real ? " (The hop stops at the end of the line.)" : ""}`;
      else if (hop) t += " There is no room to hop that way from here.";
    } else if (mode === "frac") {
      const d = Number(oneOf(s.den, [2, 3, 4, 5, 6, 8, 10, 12], "4"));
      const k = Math.min(marker, d);
      const to = Math.max(0, Math.min(d, k + hop));
      const real = to - k;
      const lab = (x) => (x === 0 ? "0" : x === d ? "1" : `${x}/${d}`);
      const marks = [{ at: `${k}/${d}`, label: lab(k) }];
      if (real) marks.push({ at: `${to}/${d}`, label: lab(to), hollow: true });
      spec = { kind: "numberline", min: "0", max: "1", ticks: d, show: "frac", reduce: false, marks, hops: real ? [{ from: `${k}/${d}`, to: `${to}/${d}`, label: `${sign(real)}${Math.abs(real)}/${d}` }] : [] };
      const lo = lowest(k, d);
      t = `A number line from 0 to 1 cut into ${d} equal parts, so each part is 1/${d}. The marker is at ${lab(k)}: ${k} ${plural(k, "part")} of ${d} from 0.`;
      if (marker > d) t += ` (The marker you set, ${marker}, is past 1, so it sits at 1.)`;
      if (k > 0 && k < d) t += lo.d === d ? ` ${k}/${d} is already in lowest terms.` : ` In lowest terms ${k}/${d} is ${lo.text}.`;
      if (real) t += ` A hop of ${Math.abs(real)} ${plural(Math.abs(real), "part")} of 1/${d} ${real > 0 ? "forward" : "back"} goes from ${lab(k)} to ${lab(to)}.${hop !== real ? " (The hop stops at the end of the line.)" : ""}`;
      else if (hop) t += " There is no room to hop that way from here.";
    } else {
      const w = I(s.win, 0, 9);
      const lo = w * 100;
      const pos = lo + marker;
      const to = Math.max(lo, Math.min(lo + 100, pos + hop * 10));
      const real = to - pos;
      const marks = [{ at: decText(pos, 2), label: decText(pos, 2) }];
      if (real) marks.push({ at: decText(to, 2), label: decText(to, 2), hollow: true });
      spec = { kind: "numberline", min: String(w), max: String(w + 1), ticks: 10, show: "dec", marks, hops: real ? [{ from: decText(pos, 2), to: decText(to, 2), label: `${sign(real)}${decText(Math.abs(real), 2)}` }] : [] };
      t = `A number line from ${w} to ${w + 1} cut into 10 equal tenths. The marker is at ${decText(pos, 2)}.`;
      if (real) t += ` A hop of ${sign(real)}${decText(Math.abs(real), 2)} goes from ${decText(pos, 2)} to ${decText(to, 2)}: ${decText(pos, 2)} ${real > 0 ? "+" : MINUS} ${decText(Math.abs(real), 2)} = ${decText(to, 2)}.${hop * 10 !== real ? " (The hop stops at the end of the line.)" : ""}`;
      else if (hop) t += " There is no room to hop that way from here.";
    }
    const ex = box();
    showControls(ex, { whole: ["mode", "max", "tick", "marker", "hop"], frac: ["mode", "den", "marker", "hop"], dec: ["mode", "win", "marker", "hop"] }[mode]);
    return { spec, extra: ex, summary: t };
  },
});

/** The named shape (if any) that a set of attributes truly defines, or an error when no shape has those attributes. */
function classifyShape(s) {
  const kind = oneOf(s.kind, ["poly", "round"], "poly");
  if (kind === "round") {
    const fr = oneOf(s.fraction, ["1", "1/2", "1/4"], "1");
    const facts = {
      1: ["One curved edge, no straight sides and no corners. Every point on the edge is the same distance from the center.", "circle"],
      "1/2": ["One curved edge and one straight side, with 2 corners. The straight side runs through the center, so it is half of a circle.", "half-circle"],
      "1/4": ["One curved edge and two straight sides that meet at a right angle, with 3 corners. It is a quarter of a circle.", "quarter-circle"],
    }[fr];
    return { facts: facts[0], name: facts[1], picture: true };
  }
  const sides = Number(oneOf(s.sides, [3, 4, 5, 6], "4"));
  const eq = !!s.equal;
  const r = I(s.right, 0, 4);
  const p = I(s.parallel, 0, 3);
  const word = { 3: "triangle", 4: "four-sided shape", 5: "five-sided shape", 6: "six-sided shape" }[sides];
  const maxR = { 3: 1, 4: 4, 5: 3, 6: 4 }[sides];
  const maxP = { 3: 0, 4: 2, 5: 2, 6: 3 }[sides];
  if (r > maxR) return { error: `A ${word} can have at most ${maxR} right ${plural(maxR, "angle")}, not ${r}. Change the number of right angles.` };
  if (p > maxP) return { error: `A ${word} can have at most ${maxP} ${plural(maxP, "pair")} of parallel sides, not ${p}. Change the pairs of parallel sides.` };
  if (sides === 3 && eq && r > 0) return { error: "A triangle with three equal sides cannot have a right angle. Change one of the two." };
  if (sides === 4) {
    if (r === 3) return { error: "No four-sided shape has exactly 3 right angles: if three corners are square, the fourth one is too." };
    if (r === 4 && p !== 2) return { error: "A four-sided shape with 4 right angles has 2 pairs of parallel sides. Change the pairs of parallel sides." };
    if (p === 2 && r !== 0 && r !== 4) return { error: "A four-sided shape with 2 pairs of parallel sides has either 0 or 4 right angles. Change the right angles." };
    if (p === 1 && r === 1) return { error: "A four-sided shape with exactly one pair of parallel sides cannot have exactly 1 right angle. Change one of the two." };
    if (eq && p !== 2) return { error: "A four-sided shape with all sides equal always has 2 pairs of parallel sides. Change the pairs of parallel sides." };
    if (eq && r !== 0 && r !== 4) return { error: "A four-sided shape with all sides equal has either 0 or 4 right angles. Change the right angles." };
  }
  const facts = `${sides} straight sides and ${sides} corners. ${eq ? "All sides are the same length." : "The sides are not all the same length."} ${r} right ${plural(r, "angle")}. ${p} ${plural(p, "pair")} of parallel sides.`;
  let name;
  let picture = true;
  if (sides === 3) name = "triangle";
  else if (sides === 5) name = "pentagon";
  else if (sides === 6) name = "hexagon";
  else if (eq && r === 4) name = "square";
  else if (eq && r === 0 && p === 2) name = "rhombus";
  else if (!eq && r === 4 && p === 2) name = "rectangle";
  else if (!eq && p === 1) name = "trapezoid";
  else if (!eq && p === 2 && r === 0) {
    name = "parallelogram";
    picture = false;
  } else {
    name = "quadrilateral";
    picture = false;
  }
  return { facts, name, picture };
}

const shapebuilder = defineManip({
  id: "shapebuilder",
  title: "Shape builders",
  band: "1-2",
  purpose: "Choose sides and other attributes and see which named shape fits exactly those attributes.",
  notice: ["Which attribute changed the name of the shape? Which changes did not?", "How are a square and a rectangle alike? How are they different?", "Can you find attributes that no shape has? What makes them impossible?"],
  controls: [
    choice("kind", "The shape has", [["poly", "Straight sides only"], ["round", "A curved edge"]], "poly"),
    choice("sides", "Straight sides", [["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"]], "4"),
    toggle("equal", "All sides are the same length", false),
    step("right", "Right angles (square corners)", 0, 4, 4),
    step("parallel", "Pairs of parallel sides", 0, 3, 2),
    choice("fraction", "How much of a circle", [["1", "A whole circle"], ["1/2", "Half of a circle"], ["1/4", "A quarter of a circle"]], "1"),
  ],
  start: seed,
  model(s) {
    const c = classifyShape(s);
    if (c.error) return { error: c.error };
    const ex = box(c.picture ? note("The picture shows one example of this kind of shape.") : note(`This tool has no picture for a ${c.name}.`));
    showControls(ex, oneOf(s.kind, ["poly", "round"], "poly") === "round" ? ["kind", "fraction"] : ["kind", "sides", "equal", "right", "parallel"]);
    const summary = `${c.facts} This shape is a ${c.name}.`;
    return c.picture ? { spec: { kind: "shape", name: c.name, labels: true }, extra: ex, summary } : { extra: ex, summary };
  },
});

const MIN_WORD = (m, h12) => {
  const next = h12 === 12 ? 1 : h12 + 1;
  if (m === 0) return `${h12} o'clock`;
  if (m === 15) return `a quarter past ${h12}`;
  if (m === 30) return `half past ${h12}`;
  if (m === 45) return `a quarter to ${next}`;
  return m < 30 ? `${m} ${plural(m, "minute")} past ${h12}` : `${60 - m} ${plural(60 - m, "minute")} to ${next}`;
};
const clockText = (h24, m) => {
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return { digital: `${h12}:${String(m).padStart(2, "0")} ${h24 < 12 ? "am" : "pm"}`, words: MIN_WORD(m, h12), h12 };
};
const hm = (mins) => `${Math.floor(mins / 60) ? `${Math.floor(mins / 60)} ${plural(Math.floor(mins / 60), "hour")}` : ""}${Math.floor(mins / 60) && mins % 60 ? " " : ""}${mins % 60 || !mins ? `${mins % 60} ${plural(mins % 60, "minute")}` : ""}`;

const clock = defineManip({
  id: "clock",
  title: "Interactive clocks",
  band: "1-2",
  purpose: "Set the hour and minute, watch both hands move together, and find how much time has passed.",
  notice: ["Where is the hour hand when the minute hand points to 6? Why is it not exactly on a number?", "What happens to the hour hand as the minutes go up?", "How many minutes pass from this time to the next hour?"],
  controls: [
    choice("mode", "What to do", [["show", "Show a time"], ["elapsed", "Find the time after a while"]], "show"),
    step("hour", "Hour", 1, 12, 3),
    step("minute", "Minutes", 0, 59, 25, 5),
    choice("ampm", "Morning or afternoon", [["am", "am"], ["pm", "pm"]], "pm"),
    step("elapsed", "Minutes that pass", 0, 360, 45, 5),
  ],
  start: seed,
  model(s) {
    const hr = I(s.hour, 1, 12);
    const m = I(s.minute, 0, 59);
    const pm = oneOf(s.ampm, ["am", "pm"], "am") === "pm";
    const h24 = (hr % 12) + (pm ? 12 : 0);
    const c = clockText(h24, m);
    const elapsedMode = s.mode === "elapsed";
    let t = `The clock shows ${c.digital}, which is ${c.words}. The hour hand ${m === 0 ? `points straight at the ${c.h12}` : `is ${m}/60 of the way from the ${c.h12} to the ${c.h12 === 12 ? 1 : c.h12 + 1}`}, and the minute hand points to ${m} minutes${m % 5 === 0 ? ` (the ${m / 5 === 0 ? 12 : m / 5})` : ""}.`;
    let ex = box();
    if (elapsedMode) {
      const e = I(s.elapsed, 0, 360);
      const total = h24 * 60 + m + e;
      const day = Math.floor(total / 1440);
      const end = total % 1440;
      const eh = Math.floor(end / 60);
      const em = end % 60;
      const ce = clockText(eh, em);
      t += ` Time that passes: ${hm(e)} (${e} ${plural(e, "minute")}). The end time is ${ce.digital}${day ? " the next day" : ""}, which is ${ce.words}.`;
      ex = box(svgNode({ kind: "clock", h: eh, m: em }, `After ${hm(e)}: ${ce.digital}`));
    }
    showControls(ex, elapsedMode ? ["mode", "hour", "minute", "ampm", "elapsed"] : ["mode", "hour", "minute", "ampm"]);
    return { spec: { kind: "clock", h: h24, m }, extra: ex, summary: t };
  },
});

const RULERS = { cm10: ["cm", 10], cm15: ["cm", 15], in6: ["in", 6], in12: ["in", 12] };
const EIGHTHS = ["0", "1/8", "1/4", "3/8", "1/2", "5/8", "3/4", "7/8"];
/** A length in the ruler's smallest marks (mm or sixteenths) as plain text. */
const lenText = (u, unit) => {
  if (unit === "cm") return u % 10 === 0 ? `${u / 10} cm` : `${decText(u, 1)} cm`;
  const w = Math.floor(u / 16);
  const r = u % 16;
  const lo = lowest(r, 16);
  return `${w ? `${w}` : ""}${w && r ? " " : ""}${r ? lo.text : w ? "" : "0"} in`;
};
const measure = defineManip({
  id: "measure",
  title: "Measurement tools",
  band: "1-2",
  purpose: "Line up an object with a ruler, read where it starts and ends, and compare its length with another object.",
  notice: ["Where does the object start? Is it at 0? How does that change how you find the length?", "How can you find the length by counting the units between the two ends?", "Which object is longer, and by how much?"],
  controls: [
    choice("ruler", "Ruler", [["cm15", "15 centimeters"], ["cm10", "10 centimeters"], ["in6", "6 inches"], ["in12", "12 inches"]], "cm15"),
    step("start", "Object starts at (whole units)", 0, 14, 2),
    step("whole", "Object length: whole units", 0, 29, 5),
    choice("mm", "Plus millimeters", Array.from({ length: 10 }, (_, i) => [String(i), `${i} mm`]), "4"),
    choice("eighths", "Plus part of an inch", EIGHTHS.map((l, i) => [String(i), l === "0" ? "none" : `${l} in`]), "0"),
    toggle("compare", "Compare with a second object", false),
    step("second", "Second object length (whole units)", 1, 29, 8),
  ],
  start: seed,
  model(s) {
    const [unit, len] = RULERS[oneOf(s.ruler, Object.keys(RULERS), "cm15")];
    const per = unit === "cm" ? 10 : 16;
    const from = I(s.start, 0, 14) * per;
    const frac = unit === "cm" ? I(s.mm, 0, 9) : I(s.eighths, 0, 7) * 2;
    const l1 = I(s.whole, 0, 29) * per + frac;
    if (l1 === 0) return { error: "The object has no length. Make it longer than 0 so it can be measured." };
    const to = from + l1;
    if (to > len * per) return { error: `The object would stick out past the end of the ${len} ${unit} ruler. Make it shorter or start it closer to 0.` };
    const at = (u) => u / per;
    let t = `A ruler in ${unit === "cm" ? "centimeters" : "inches"} from 0 to ${len}. The object starts at ${lenText(from, unit)} and ends at ${lenText(to, unit)}. Its length is ${lenText(to, unit)} ${MINUS} ${lenText(from, unit)} = ${lenText(l1, unit)}${unit === "cm" ? ` (${l1} mm)` : ""}.`;
    let ex = box();
    if (s.compare) {
      const l2 = I(s.second, 1, 29) * per;
      if (l2 > len * per) return { error: `The second object is longer than the ${len} ${unit} ruler. Make it shorter.` };
      const d = Math.abs(l1 - l2);
      t += ` The second object starts at 0 and is ${lenText(l2, unit)} long. ${d === 0 ? "The two objects are the same length." : `The ${l1 > l2 ? "first" : "second"} object is longer by ${lenText(d, unit)}.`}`;
      ex = box(svgNode({ kind: "ruler", unit, length: len, objectFrom: 0, objectTo: at(l2) }, "Second object"));
    }
    showControls(ex, ["ruler", "start", "whole", unit === "cm" ? "mm" : "eighths", "compare", ...(s.compare ? ["second"] : [])]);
    return { spec: { kind: "ruler", unit, length: len, objectFrom: at(from), objectTo: at(to) }, extra: ex, summary: t };
  },
});

const THEMES = {
  pets: { title: "Our favorite pets", unit: "votes", cats: ["Dogs", "Cats", "Fish", "Birds"] },
  fruit: { title: "Our favorite fruit", unit: "votes", cats: ["Apples", "Bananas", "Grapes", "Pears"] },
  sports: { title: "Our favorite sports", unit: "votes", cats: ["Soccer", "Swimming", "Running", "Dancing"] },
  rides: { title: "How we get to school", unit: "students", cats: ["Bus", "Walk", "Car", "Bike"] },
};
const picturegraph = defineManip({
  id: "picturegraph",
  title: "Picture graphs",
  band: "1-2",
  purpose: "Turn counts into a picture graph where each symbol stands for 1 or 2, and read what the graph says.",
  notice: ["What does one picture stand for? How does the graph change when each picture stands for 2?", "Which category has the most? The fewest? How many more is that?", "How can you find the total from the graph?"],
  controls: [
    choice("theme", "Topic", [["pets", "Pets"], ["fruit", "Fruit"], ["sports", "Sports"], ["rides", "Getting to school"]], "pets"),
    step("c0", "Count for the 1st category", 0, 20, 6),
    step("c1", "Count for the 2nd category", 0, 20, 4),
    step("c2", "Count for the 3rd category", 0, 20, 2),
    step("c3", "Count for the 4th category", 0, 20, 5),
    choice("per", "Each picture stands for", [["1", "1"], ["2", "2"]], "1"),
    toggle("bar", "Show it as a bar graph instead", false),
  ],
  start: seed,
  model(s) {
    const th = THEMES[oneOf(s.theme, Object.keys(THEMES), "pets")];
    const counts = [s.c0, s.c1, s.c2, s.c3].map((v) => I(v, 0, 20));
    const per = Number(oneOf(s.per, [1, 2], "1"));
    const total = counts.reduce((a, b) => a + b, 0);
    const max = Math.max(...counts);
    const min = Math.min(...counts);
    const pics = (c) => {
      const f = Math.floor(c / per);
      const half = c % per !== 0;
      if (!half) return `${f} ${plural(f, "picture")}`;
      return f ? `${f} and a half pictures` : "a half picture";
    };
    const reads = th.cats.map((c, i) => `${c}: ${counts[i]}${s.bar ? "" : ` (${pics(counts[i])})`}`);
    let t = `${s.bar ? "Bar graph" : `Picture graph. Each picture stands for ${per} ${per === 1 ? th.unit.replace(/s$/, "") : th.unit}`}${s.bar ? "" : ", a half picture for 1"}. ${reads.join(". ")}. Total: ${total}. `;
    if (total === 0) t += "Nothing is counted yet.";
    else {
      const top = th.cats.filter((_, i) => counts[i] === max);
      const bottom = th.cats.filter((_, i) => counts[i] === min);
      t += max === min ? "Every category has the same count." : `${list(top)} ${top.length > 1 ? "have" : "has"} the most (${max}); ${list(bottom)} ${bottom.length > 1 ? "have" : "has"} the fewest (${min}), a difference of ${max - min}.`;
    }
    const spec = s.bar ? { kind: "bar", title: th.title, cats: th.cats, values: counts, scale: 1, orient: "v", showValues: true, axisLabel: th.unit } : { kind: "bar", title: th.title, cats: th.cats, values: counts, scale: per, orient: "v", picture: true, unit: th.unit };
    return { spec, summary: t };
  },
});

/* ---------------------------------------------------------------- grades 3-5 */

const array = defineManip({
  id: "array",
  title: "Arrays",
  band: "3-5",
  purpose: "Arrange equal rows to see multiplication as rows of a number, and see that turning the array gives the same total.",
  notice: ["How many rows and how many in each row? What is the multiplication sentence?", "What happens to the rows and columns when you turn the array? Does the total change?", "How can you split the array into two smaller arrays and still get the same total?"],
  controls: [step("rows", "Rows", 1, 12, 3), step("cols", "Columns (in each row)", 1, 12, 4), step("split", "Split after this many columns (0 for no split)", 0, 11, 0), toggle("turn", "Turn the array on its side", false)],
  start: seed,
  model(s) {
    const rows = I(s.rows, 1, 12);
    const cols = I(s.cols, 1, 12);
    const total = rows * cols;
    const turn = !!s.turn;
    const sp = I(s.split, 0, 11);
    const okSplit = sp >= 1 && sp < cols;
    const R = turn ? cols : rows;
    const C = turn ? rows : cols;
    let t = `${turn ? "Turned array" : "Array"}: ${R} ${plural(R, "row")} of ${C}, so ${R} ${TIMES} ${C} = ${total}. `;
    t += turn ? `Before turning it was ${rows} rows of ${cols}: ${rows} ${TIMES} ${cols} = ${total}. ` : `Turned on its side it is ${cols} rows of ${rows}: ${cols} ${TIMES} ${rows} = ${total}. `;
    t += "The total is the same because it is the same dots.";
    if (okSplit) {
      const other = cols - sp;
      t += ` Split into ${rows} ${TIMES} ${sp} and ${rows} ${TIMES} ${other}: ${rows * sp} + ${rows * other} = ${total}.`;
    } else if (sp) t += ` (A split after ${sp} columns is not inside an array with ${cols} columns, so the array is not split.)`;
    const spec = { kind: "array", rows: R, cols: C };
    if (okSplit) spec.shade = turn ? { rows: sp, cols: C } : { rows: R, cols: sp };
    return { spec, summary: t };
  },
});

const areamodel = defineManip({
  id: "areamodel",
  title: "Area models",
  band: "3-5",
  purpose: "Split a rectangle into smaller rectangles to find partial products and see that they add up to the whole product.",
  notice: ["What is the area of each small rectangle? How did you find it?", "What do the partial products add up to? Is that the same as the whole product?", "How does splitting by tens and ones make the multiplying easier?"],
  controls: [
    step("a", "Width", 1, 99, 23),
    step("b", "Height", 1, 99, 14),
    choice("how", "Split the sides", [["place", "By place value (tens and ones)"], ["custom", "Where I choose"], ["none", "Do not split"]], "place"),
    step("sa", "Split the width after (custom)", 0, 98, 0),
    step("sb", "Split the height after (custom)", 0, 98, 0),
  ],
  start: seed,
  model(s) {
    const a = I(s.a, 1, 99);
    const b = I(s.b, 1, 99);
    const how = oneOf(s.how, ["place", "custom", "none"], "place");
    const tensCut = (v) => (v > 10 && v % 10 !== 0 ? Math.floor(v / 10) * 10 : 0);
    const raw = how === "place" ? [tensCut(a), tensCut(b)] : how === "custom" ? [I(s.sa, 0, 98), I(s.sb, 0, 98)] : [0, 0];
    const ca = raw[0] > 0 && raw[0] < a ? raw[0] : 0;
    const cb = raw[1] > 0 && raw[1] < b ? raw[1] : 0;
    const wParts = ca ? [ca, a - ca] : [a];
    const hParts = cb ? [cb, b - cb] : [b];
    const partials = [];
    for (const hh of hParts) for (const ww of wParts) partials.push({ ww, hh, p: ww * hh });
    const total = a * b;
    let t = `An area model: a rectangle ${a} wide and ${b} tall. `;
    if (how === "custom" && ((raw[0] && !ca) || (raw[1] && !cb))) t += "(A split must be inside the side it cuts, so that side is not split.) ";
    if (partials.length === 1) t += `It is not split, so the area is ${a} ${TIMES} ${b} = ${num(total)}.`;
    else t += `The width is split into ${list(wParts.map(String))}${ca ? "" : " (not split)"} and the height into ${list(hParts.map(String))}${cb ? "" : " (not split)"}. Partial products: ${partials.map((q) => `${q.ww} ${TIMES} ${q.hh} = ${num(q.p)}`).join(", ")}. Added together: ${partials.map((q) => num(q.p)).join(" + ")} = ${num(total)}, the same as ${a} ${TIMES} ${b} = ${num(total)}.`;
    const spec = { kind: "areamodel", w: a, h: b };
    if (ca) spec.cutW = ca;
    if (cb) spec.cutH = cb;
    const ex = box();
    showControls(ex, how === "custom" ? ["a", "b", "how", "sa", "sb"] : ["a", "b", "how"]);
    return { spec, extra: ex, summary: t };
  },
});

const fracText = (n, d) => `${n}/${d}`;
const relWord = (c) => (c > 0 ? "is greater than" : c < 0 ? "is less than" : "is equal to");
const fracstrips = defineManip({
  id: "fracstrips",
  title: "Fraction strips",
  band: "3-5",
  purpose: "Shade equal parts of strips of the same length to compare fractions, find equivalent fractions and add fractions with the same size parts.",
  notice: ["Which strip has more shaded? How can you tell when the parts are different sizes?", "What happens to the number of parts and the shaded parts when you cut every part in equal pieces?", "When the parts are the same size, what do you add and what stays the same?"],
  controls: [
    choice("mode", "What to do", [["compare", "Compare two fractions"], ["equivalent", "Find an equivalent fraction"], ["add", "Add fractions with the same parts"]], "compare"),
    step("pa", "Strip A: equal parts", 1, 12, 3),
    step("sa", "Strip A: shaded parts", 0, 12, 2),
    step("pb", "Strip B: equal parts", 1, 12, 4),
    step("sb", "Strip B: shaded parts", 0, 12, 3),
    step("mult", "Cut each part into this many equal pieces", 1, 6, 2),
  ],
  start: seed,
  model(s) {
    const mode = oneOf(s.mode, ["compare", "equivalent", "add"], "compare");
    const pa = I(s.pa, 1, 12);
    const sa = Math.min(I(s.sa, 0, 12), pa);
    const clampNote = (p, v, who) => (I(v, 0, 12) > p ? ` (Strip ${who}: only ${p} parts, so shaded parts is ${p}.)` : "");
    let t = "";
    let spec;
    let ex = box();
    let ids;
    if (mode === "compare") {
      const pb = I(s.pb, 1, 12);
      const sb = Math.min(I(s.sb, 0, 12), pb);
      const c = Math.sign(sa * pb - sb * pa);
      t = `Strip A shades ${fracText(sa, pa)} and strip B shades ${fracText(sb, pb)}. ${fracText(sa, pa)} ${relWord(c)} ${fracText(sb, pb)}.`;
      if (c === 0) t += ` They are equivalent: both are ${lowest(sa, pa).text} in lowest terms.`;
      t += clampNote(pa, s.sa, "A") + clampNote(pb, s.sb, "B");
      spec = { kind: "fracstrip", parts: pa, shaded: sa, compare: { parts: pb, shaded: sb } };
      ids = ["mode", "pa", "sa", "pb", "sb"];
    } else if (mode === "equivalent") {
      const m = Math.max(1, Math.min(I(s.mult, 1, 6), Math.floor(24 / pa)));
      t = `Strip A shades ${fracText(sa, pa)}. Cut each part into ${m} equal ${plural(m, "piece")}: strip B has ${pa * m} parts with ${sa * m} shaded, ${fracText(sa * m, pa * m)}. ${fracText(sa, pa)} = ${fracText(sa * m, pa * m)} because both the shaded parts and the total parts are multiplied by ${m}. In lowest terms both are ${lowest(sa, pa).text}.`;
      if (m !== I(s.mult, 1, 6)) t += ` (Strips stop at 24 parts, so each part is cut into ${m}.)`;
      t += clampNote(pa, s.sa, "A");
      spec = { kind: "fracstrip", parts: pa, shaded: sa, compare: { parts: pa * m, shaded: sa * m } };
      ids = ["mode", "pa", "sa", "mult"];
    } else {
      const sb = Math.min(I(s.sb, 0, 12), pa);
      const sum = sa + sb;
      t = `Both strips have ${pa} equal parts. Strip A shades ${fracText(sa, pa)} and strip B shades ${fracText(sb, pa)}. Added: ${sa} + ${sb} = ${sum}, so ${fracText(sa, pa)} + ${fracText(sb, pa)} = ${fracText(sum, pa)}. The size of the parts stays ${fracText(1, pa)}; only the number of parts is added.`;
      if (sum > pa) t += ` That is more than one whole: ${fracText(sum, pa)} = 1 ${lowest(sum - pa, pa).text}.`;
      else if (sum === pa) t += " That is exactly one whole.";
      t += clampNote(pa, s.sa, "A") + (I(s.sb, 0, 12) > pa ? ` (Strip B: only ${pa} parts, so shaded parts is ${pa}.)` : "");
      spec = { kind: "fracstrip", parts: pa, shaded: sa, compare: { parts: pa, shaded: sb } };
      ex = box(svgNode(sum <= pa ? { kind: "fracstrip", parts: pa, shaded: sum } : { kind: "fracstrip", parts: pa, shaded: pa, compare: { parts: pa, shaded: sum - pa } }, sum <= pa ? `Total shaded: ${fracText(sum, pa)}` : `Total: one whole and ${fracText(sum - pa, pa)} more`));
      ids = ["mode", "pa", "sa", "sb"];
    }
    showControls(ex, ids);
    return { spec, extra: ex, summary: t };
  },
});

const fracline = defineManip({
  id: "fracline",
  title: "Fraction number lines",
  band: "3-5",
  purpose: "Place a fraction on a number line cut into equal parts and see which other fractions name the same point.",
  notice: ["How many equal parts is each whole cut into? What does one jump from 0 stand for?", "Which other fractions land on the same point? What do their tops and bottoms have in common?", "When the point is past 1, how can you write it as a mixed number?"],
  controls: [
    step("den", "Equal parts in each whole (denominator)", 2, 12, 4),
    step("num", "Jumps of one part from 0 (numerator)", 0, 24, 3),
    choice("range", "The line goes from 0 to", [["1", "1"], ["2", "2"]], "1"),
    toggle("mixed", "Write numbers past 1 as mixed numbers", false),
  ],
  start: seed,
  model(s) {
    const d = I(s.den, 2, 12);
    const r = Number(oneOf(s.range, [1, 2], "1"));
    const k = Math.min(I(s.num, 0, 24), r * d);
    const mixed = !!s.mixed;
    const lo = lowest(k, d);
    const whole = Math.floor(k / d);
    const rem = k % d;
    const lab = k === 0 ? "0" : mixed && k > d && rem ? `${whole} ${rem}/${d}` : k % d === 0 ? String(k / d) : `${k}/${d}`;
    let t = `A number line from 0 to ${r} with each whole cut into ${d} equal parts, each part ${fracText(1, d)}. The marker is ${k} ${plural(k, "jump")} of ${fracText(1, d)} from 0, at ${fracText(k, d)}${k % d === 0 ? ` (which is ${k / d})` : ""}.`;
    if (I(s.num, 0, 24) > r * d) t += ` (The numerator you set is past the end of the line, so the marker sits at ${r}.)`;
    if (k > 0 && k % d !== 0) t += lo.d === d ? ` ${fracText(k, d)} is already in lowest terms.` : ` In lowest terms ${fracText(k, d)} is ${lo.text}.`;
    if (k > d && rem) t += ` As a mixed number it is ${whole} ${rem}/${d}.`;
    const eq = [];
    for (let q = 2; q <= 12; q++) if (q !== d && (k * q) % d === 0) eq.push(`${(k * q) / d}/${q}`);
    if (eq.length) t += ` Other fractions at this point with a denominator up to 12: ${eq.join(", ")}.`;
    const spec = { kind: "numberline", min: "0", max: String(r), ticks: r * d, show: "frac", reduce: false, mixed, marks: [{ at: `${k}/${d}`, label: lab }] };
    return { spec, summary: t };
  },
});

/** The 10 x 10 grid is drawn here (no Visuals kind for it): tenths are columns, hundredths are single squares; meaning is not colour alone (shaded squares carry a dot). */
function decimalSvg(total) {
  const cell = 30;
  const m = 14;
  const W = cell * 10 + m * 2;
  let body = "";
  for (let c = 0; c < 10; c++)
    for (let r = 0; r < 10; r++) {
      const on = c * 10 + r < total;
      const x = m + c * cell;
      const y = m + r * cell;
      body += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${on ? "#1FA6A2" : "#FFFFFF"}" stroke="#C5CFD8" stroke-width="1.5"/>`;
      if (on) body += `<circle cx="${x + cell / 2}" cy="${y + cell / 2}" r="4" fill="#17324D"/>`;
    }
  for (let c = 0; c <= 10; c++) body += `<line x1="${m + c * cell}" y1="${m}" x2="${m + c * cell}" y2="${m + 10 * cell}" stroke="#17324D" stroke-width="${c === 0 || c === 10 ? 4 : 2.5}"/>`;
  body += `<line x1="${m}" y1="${m}" x2="${m + 10 * cell}" y2="${m}" stroke="#17324D" stroke-width="4"/><line x1="${m}" y1="${m + 10 * cell}" x2="${m + 10 * cell}" y2="${m + 10 * cell}" stroke="#17324D" stroke-width="4"/>`;
  const alt = `A 10 by 10 grid with ${total} of 100 squares shaded`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${W}" role="img" aria-label="${alt}" style="width:100%;max-width:22rem;height:auto"><title>${alt}</title>${body}</svg>`;
}
const decimalgrid = defineManip({
  id: "decimalgrid",
  title: "Decimal grids",
  band: "3-5",
  purpose: "Shade tenths and hundredths of a 10 by 10 grid and read the same amount as a fraction, a decimal and a percent.",
  notice: ["How many hundredths are in one tenth? What do you see in the grid?", "Is 0.3 the same as 0.30? How does the grid show it?", "How are the fraction, the decimal and the percent the same amount written three ways?"],
  controls: [step("tenths", "Tenths (whole columns)", 0, 10, 3), step("hundredths", "Extra hundredths (single squares)", 0, 9, 7)],
  start: seed,
  model(s) {
    const te = I(s.tenths, 0, 10);
    const hu = te === 10 ? 0 : I(s.hundredths, 0, 9);
    const total = te * 10 + hu;
    const lo = lowest(total, 100);
    const two = `${Math.floor(total / 100)}.${String(total % 100).padStart(2, "0")}`;
    let t = `A 10 by 10 grid with ${total} of the 100 squares shaded: ${te} ${plural(te, "tenth")} (whole columns) and ${hu} extra ${plural(hu, "hundredth")}. As a fraction: ${total}/100${lo.d === 100 ? "" : `, which is ${lo.text} in lowest terms`}. As a decimal: ${two}${two.endsWith("0") && total % 100 !== 0 ? `, the same as ${decText(total, 2)}` : ""}. As a percent: ${total}%.`;
    if (te === 10 && I(s.hundredths, 0, 9) > 0) t += " (All 10 tenths is the whole grid, so there are no extra hundredths.)";
    const ex = box(h("div", { class: "ml-man-svg ml-man-dgrid" }));
    ex.firstChild.innerHTML = decimalSvg(total); // generated here from two integers
    return { extra: ex, summary: t };
  },
});

const volume = defineManip({
  id: "volume",
  title: "Volume builders",
  band: "3-5",
  purpose: "Build a rectangular prism from unit cubes, layer by layer, and see that volume is the cubes in one layer times the number of layers.",
  notice: ["How many cubes are in one layer? How do you know without counting every cube?", "What happens to the volume when you add a layer? When you double the length?", "Does it matter which side you call the base? Try a different one and compare the volume."],
  controls: [step("l", "Length (cubes)", 1, 10, 4), step("w", "Width (cubes)", 1, 10, 3), step("hh", "Height (layers)", 1, 10, 2), toggle("one", "Show only the bottom layer", false)],
  start: seed,
  model(s) {
    const l = I(s.l, 1, 10);
    const w = I(s.w, 1, 10);
    const hh = I(s.hh, 1, 10);
    const base = l * w;
    const vol = base * hh;
    let t = `A rectangular prism ${l} cubes long, ${w} cubes wide and ${hh} ${plural(hh, "cube")} tall. One layer is ${l} ${TIMES} ${w} = ${base} ${plural(base, "cube")}. With ${hh} ${plural(hh, "layer")}: ${hh} ${TIMES} ${base} = ${vol} cubes, and ${l} ${TIMES} ${w} ${TIMES} ${hh} = ${vol}. The volume is ${vol} cubic units.`;
    if (s.one) t += ` The picture shows only the bottom layer, ${base} ${plural(base, "cube")}; the whole prism has ${hh} ${plural(hh, "layer")} like it.`;
    return { spec: { kind: "prism", l, w, h: s.one ? 1 : hh, units: true }, summary: t };
  },
});

const MAXP = 8;
const decodePts = (v) =>
  String(v || "")
    .split(";")
    .filter(Boolean)
    .map((p) => p.split(",").map(Number))
    .filter(([x, y]) => Number.isInteger(x) && Number.isInteger(y) && x >= 0 && x <= 10 && y >= 0 && y <= 10)
    .slice(0, MAXP)
    .map(([x, y]) => ({ x, y }));
const encodePts = (pts) => pts.map((p) => `${p.x},${p.y}`).join(";");
const coordinate = defineManip({
  id: "coordinate",
  title: "Coordinate planes",
  band: "3-5",
  purpose: "Find points in the first quadrant by going right then up, add points, and read each as an ordered pair.",
  notice: ["Which number tells how far to go right? Which tells how far to go up? Does the order matter?", "What do you notice about points that sit on the same horizontal or vertical line?", "How far apart are two points on the same grid line? How can you find it without counting?"],
  controls: [step("x", "x: how far right from 0", 0, 10, 3), step("y", "y: how far up from 0", 0, 10, 4), { id: "pts", label: "Points on the plane (a list the buttons keep)", type: "choice", options: [["", "no points yet"]], value: "" }],
  start: seed,
  model(s) {
    const x = I(s.x, 0, 10);
    const y = I(s.y, 0, 10);
    const pts = decodePts(s.pts);
    const letter = (i) => String.fromCharCode(65 + i);
    const dup = pts.some((p) => p.x === x && p.y === y);
    const full = pts.length >= MAXP;
    let t = `A coordinate grid from 0 to 10 on both axes. The next point is (${x}, ${y}): go ${x} right from 0, then ${y} up. It is ${x} ${plural(x, "unit")} along the x-axis and ${y} ${plural(y, "unit")} up. `;
    t += pts.length ? `Points on the plane: ${pts.map((p, i) => `${letter(i)} (${p.x}, ${p.y})`).join(", ")}. ` : "No points are on the plane yet. ";
    if (pts.length >= 2) {
      const a = pts[pts.length - 2];
      const b = pts[pts.length - 1];
      const nm = `${letter(pts.length - 2)} and ${letter(pts.length - 1)}`;
      if (a.y === b.y && a.x !== b.x) t += `${nm} are on the same horizontal line, ${Math.abs(a.x - b.x)} units apart (${Math.max(a.x, b.x)} ${MINUS} ${Math.min(a.x, b.x)}).`;
      else if (a.x === b.x && a.y !== b.y) t += `${nm} are on the same vertical line, ${Math.abs(a.y - b.y)} units apart (${Math.max(a.y, b.y)} ${MINUS} ${Math.min(a.y, b.y)}).`;
      else t += `${nm} are not on the same grid line, so there is no distance along one line.`;
    }
    const lines = [{ x }, { m: 0, b: y }];
    const spec = { kind: "coord", xmin: 0, xmax: 10, ymin: 0, ymax: 10, step: 1, labelAxes: ["x", "y"], lines, points: pts.map((p, i) => ({ x: p.x, y: p.y, label: letter(i) })) };
    const ex = box(
      actions(
        action("add", `Add point (${x}, ${y})`, !dup && !full, (root) => poke(root, "pts", encodePts([...pts, { x, y }]))),
        action("remove", "Remove the last point", pts.length > 0, (root) => poke(root, "pts", encodePts(pts.slice(0, -1)))),
        action("clear", "Clear all points", pts.length > 0, (root) => poke(root, "pts", "")),
      ),
      dup ? note(`(${x}, ${y}) is already on the plane.`) : full ? note(`The plane holds at most ${MAXP} points.`) : null,
      pts.length
        ? h("table", { class: "ml-man-table" }, h("caption", {}, "Ordered pairs"), h("thead", {}, h("tr", {}, h("th", { scope: "col" }, "Point"), h("th", { scope: "col" }, "(x, y)"))), h("tbody", {}, pts.map((p, i) => h("tr", {}, h("th", { scope: "row" }, letter(i)), h("td", {}, `(${p.x}, ${p.y})`)))))
        : null,
    );
    showControls(ex, ["x", "y"]);
    return { spec, extra: ex, summary: t };
  },
});

const kindOf = (d) => (d < 90 ? "acute" : d === 90 ? "right" : d < 180 ? "obtuse" : "straight");
const kindText = (d) => ({ acute: "an acute angle (less than 90°)", right: "a right angle (exactly 90°)", obtuse: "an obtuse angle (more than 90° and less than 180°)", straight: "a straight angle (exactly 180°, a straight line)" })[kindOf(d)];
const angle = defineManip({
  id: "angle",
  title: "Angle manipulatives",
  band: "3-5",
  purpose: "Open an angle from 0 to 180 degrees, name its kind, and find the supplementary angle that makes a straight line.",
  notice: ["When does an angle change from acute to right to obtuse?", "What do an angle and its partner add up to? Why?", "How can you read the angle from the protractor, starting at 0?"],
  controls: [step("deg", "Angle in degrees", 5, 180, 60, 5), toggle("protractor", "Show a protractor", false), toggle("partner", "Show the supplementary angle", true)],
  start: seed,
  model(s) {
    const d = I(s.deg, 5, 180);
    let t = `An angle of ${d}°, which is ${kindText(d)}.`;
    if (s.protractor) t += " A protractor is placed on it, with 0 on one side of the angle.";
    let ex = box();
    if (s.partner) {
      const p = 180 - d;
      if (p === 0) t += " Its supplementary angle is 180° − 180° = 0°: a straight angle leaves no angle to make a straight line.";
      else {
        t += ` Its supplementary angle is 180° ${MINUS} ${d}° = ${p}°, ${kindText(p)}. ${d}° + ${p}° = 180°, a straight line.`;
        ex = box(svgNode({ kind: "angle", deg: p }, `Supplementary angle: ${p}°`));
      }
    }
    return { spec: { kind: "angle", deg: d, protractor: !!s.protractor }, extra: ex, summary: t };
  },
});

const counts0 = [0, 2, 3, 4, 2, 1, 1];
const dataviz = defineManip({
  id: "dataviz",
  title: "Data visualization tools",
  band: "3-5",
  purpose: "Build a line plot or a bar graph from how often each value occurs, and see how the mean, median, mode and range describe the data.",
  notice: ["Where is the data bunched up? Where is it spread out? How does the range show that?", "What happens to the mean, the median and the mode when you add one value far from the others?", "Why can the mean be a number that is not in the data?"],
  controls: [
    choice("display", "Show as", [["lineplot", "Line plot"], ["bar", "Bar graph"]], "lineplot"),
    choice("from", "First value", [["0", "0"], ["1", "1"], ["5", "5"], ["10", "10"]], "1"),
    choice("by", "Values go up by", [["1", "1"], ["2", "2"], ["5", "5"]], "1"),
    ...counts0.map((c, i) => step(`c${i}`, `How many times value ${i + 1} of 7 occurs`, 0, 8, c)),
  ],
  start: seed,
  model(s) {
    const from = Number(oneOf(s.from, [0, 1, 5, 10], "1"));
    const by = Number(oneOf(s.by, [1, 2, 5], "1"));
    const cs = Array.from({ length: 7 }, (_, i) => I(s[`c${i}`], 0, 8));
    const vals = cs.map((_, i) => from + i * by);
    const n = cs.reduce((a, b) => a + b, 0);
    const ex = box(
      h("table", { class: "ml-man-table" }, h("caption", {}, "Data: how many times each value occurs"), h("thead", {}, h("tr", {}, h("th", { scope: "col" }, "Value"), h("th", { scope: "col" }, "Times"))), h("tbody", {}, vals.map((v, i) => h("tr", {}, h("th", { scope: "row" }, String(v)), h("td", {}, String(cs[i])))))),
    );
    if (n === 0) return { extra: ex, summary: "There is no data yet. Raise a count to add values." };
    const data = vals.flatMap((v, i) => Array(cs[i]).fill(v));
    const sum = data.reduce((a, b) => a + b, 0);
    const mean = lowest(sum, n);
    const meanDec = (Math.round((sum / n) * 100) / 100).toString();
    const exact = (sum * 100) % n === 0;
    const mid = data.length % 2 ? data[(data.length - 1) / 2] : (data[data.length / 2 - 1] + data[data.length / 2]) / 2;
    const most = Math.max(...cs);
    const modes = vals.filter((_, i) => cs[i] === most);
    const distinct = cs.filter((c) => c > 0).length;
    const modeText = distinct > 1 && cs.filter((c) => c > 0).every((c) => c === most) ? "no mode, because every value that occurs occurs the same number of times" : list(modes.map(String));
    const lo = Math.min(...data);
    const hi = Math.max(...data);
    const where = vals.map((v, i) => (cs[i] ? `${v} (${cs[i]} ${plural(cs[i], "time")})` : null)).filter(Boolean);
    let t = `${s.display === "bar" ? "A bar graph" : "A line plot"} of ${n} ${plural(n, "value")}: ${where.join(", ")}. Mean: ${sum} ÷ ${n} = ${mean.d === 1 ? mean.text : `${mean.text} ${exact ? "=" : "≈"} ${meanDec}`}. Median: ${num(mid)}. Mode: ${modeText}. Range: ${hi} ${MINUS} ${lo} = ${hi - lo}.`;
    const spec = s.display === "bar" ? { kind: "bar", title: "How many times each value occurs", cats: vals.map(String), values: cs, scale: 1, orient: "v", showValues: true, axisLabel: "times" } : { kind: "lineplot", min: vals[0], max: vals[6], step: by, values: data, label: "Data values" };
    return { spec, extra: ex, summary: t };
  },
});

export const MANIPS = { tenframe, bonds, counters, placevalue, numberline, shapebuilder, clock, measure, picturegraph, array, areamodel, fracstrips, fracline, decimalgrid, volume, coordinate, angle, dataviz };
