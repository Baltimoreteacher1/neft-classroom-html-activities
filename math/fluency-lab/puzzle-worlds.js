// Math-native puzzle worlds. Level data, model rendering, and answer checks
// share one small runner so visual state and mathematical state cannot drift.
import { t } from "./i18n.js";
import { getGrade } from "./problem-bank.js";

const esc = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const int = (value) => typeof value === "string" && value.trim() === "" ? NaN : Number.isSafeInteger(Number(value)) ? Number(value) : NaN;
const sameFraction = (a, b, c, d) => Number.isSafeInteger(a) && Number.isSafeInteger(b) && Number.isSafeInteger(c) && Number.isSafeInteger(d) && b > 0 && d > 0 && BigInt(a) * BigInt(d) === BigInt(c) * BigInt(b);

export const PUZZLE_WORLDS = [
  { id: "equationfactory", name: "Equation Engineers", blurb: "Route values through machines, repair a missing input, and reverse a transformation.", theme: "factory", icon: "⚙️" },
  { id: "fractionbridge", name: "Fraction Bridge", blurb: "Fit exact fractional spans together to cross each gap without overlaps.", theme: "bridge", icon: "🌉" },
  { id: "balancestation", name: "Balance Station", blurb: "Move the balance point by solving equal expressions, including integers.", theme: "station", icon: "⚖️" },
  { id: "ratiocity", name: "Ratio Racers", blurb: "Scale building plans and supplies while keeping quantities proportional.", theme: "city", icon: "🏙️" },
  { id: "tenframefactory", name: "Ten-Frame Factory", blurb: "Build and balance quantities with counters on a ten-frame.", theme: "factory", icon: "🧮" },
  { id: "divisionharbor", name: "Division Harbor", blurb: "Share cargo equally across docks and make sense of what remains.", theme: "harbor", icon: "⚓" },
  { id: "decimaldashboards", name: "Decimal Dashboards", blurb: "Use place-value controls to balance decimal quantities.", theme: "dashboard", icon: "📊" },
  { id: "integerexpedition", name: "Integer Expedition", blurb: "Navigate a number line with positive and negative moves.", theme: "expedition", icon: "🧭" },
  { id: "graphcity", name: "Graph City", blurb: "Plot coordinates to connect a rule to a city route.", theme: "graph", icon: "📍" },
];

// Each level is a reusable, auditable data record. Values vary by grade while
// retaining small exact integers so the models are readable and reliable.
export function worldLevel(worldId, grade, round) {
  const g = Math.max(1, Math.min(8, int(grade) || 1));
  const r = Math.max(0, int(round) || 0);
  const n = (g + r * 2) % 7 + 2;
  if (worldId === "tenframefactory") {
    const total = 5 + (r % 6);
    const filled = Math.max(0, total - 3 - (r % 3));
    return { prompt: t("The ten-frame factory needs {total} counters. Add enough counters to finish the batch.", { total }), mode: "tenframe", label: "Counters to add", answer: total, model: { kind: "tenframe", total, filled }, hint: t("Fill the frame one space at a time. Count the full set, not just the empty spaces.") };
  }
  if (worldId === "divisionharbor") {
    const docks = 2 + (r % 4);
    const perDock = 3 + (r % 5);
    const remainder = r % 3;
    const cargo = docks * perDock + remainder;
    return { prompt: t("Share {cargo} crates equally across {docks} docks. How many full crates go to each dock?", { cargo, docks }), mode: "harbor", label: "Crates per dock", answer: perDock, remainder, model: { kind: "harbor", cargo, docks, perDock, remainder }, hint: t("Make equal groups first. Any leftover crates are the remainder.") };
  }
  if (worldId === "decimaldashboards") {
    const tenths = 12 + r;
    const hundredths = 35 + r * 7;
    const answer = Number((tenths / 10 + hundredths / 100).toFixed(2));
    return { prompt: t("Set the dashboard total: {a} + {b} = ?", { a: (tenths / 10).toFixed(1), b: (hundredths / 100).toFixed(2) }), mode: "decimal", label: "Dashboard total", answer, model: { kind: "decimal", a: (tenths / 10).toFixed(1), b: (hundredths / 100).toFixed(2), answer }, hint: t("Line up decimal points. Combine tenths with tenths and hundredths with hundredths.") };
  }
  if (worldId === "integerexpedition") {
    const start = -4 + (r % 5);
    const move = 2 + (r % 4);
    const direction = r % 2 ? "left" : "right";
    const answer = start + (direction === "right" ? move : -move);
    return { prompt: t("Start at {start}. Move {direction} {move} spaces. Where do you land?", { start, direction: t(direction), move }), mode: "input", label: "Landing point", answer, model: { kind: "integerline", start, move, direction, answer }, hint: t("A move right adds. A move left subtracts, even when you cross zero.") };
  }
  if (worldId === "graphcity") {
    const x = 1 + (r % 5);
    const rate = 2 + (r % 3);
    const intercept = r % 4;
    const y = rate * x + intercept;
    return { prompt: t("A route follows y = {rate}x + {intercept}. Which point is on the route when x = {x}?", { rate, intercept, x }), mode: "coordinate", label: "Coordinate point", answer: [x, y], model: { kind: "graph", rate, intercept, x, y }, hint: t("Substitute the x-coordinate into the rule, then plot the ordered pair (x, y).") };
  }
  if (worldId === "equationfactory") {
    const levels = [
      { prompt: t("A machine adds {n}, then shows {total}. What went in?", { n, total: n + 7 }), mode: "input", label: "Input value", answer: 7, model: { kind: "machine", input: "?", steps: [`+${n}`, "output"], output: n + 7 }, hint: t("Undo the +{n} step to find the input.", { n }) },
      { prompt: t("{n}x = {total}. Which value balances the machine?", { n, total: n * 4 }), mode: "input", label: "Value of x", answer: 4, model: { kind: "machine", input: "x", steps: [`×${n}`], output: n * 4 }, hint: t("Use the inverse operation: divide {total} by {n}.", { total: n * 4, n }) },
      { prompt: t("The output is {total}. The machine subtracts 2 after multiplying by {n}. Find the input.", { total: n * 3 - 2, n }), mode: "input", label: "Input value", answer: 3, model: { kind: "machine", input: "?", steps: [`×${n}`, "−2"], output: n * 3 - 2 }, hint: t("Reverse the steps in the opposite order.") },
      { prompt: t("A two-step machine changes x to {total}: multiply by 2, then add 5. What is x?", { total: n * 2 + 5 }), mode: "input", label: "Value of x", answer: n, model: { kind: "machine", input: "x", steps: ["×2", "+5"], output: n * 2 + 5 }, hint: t("Undo +5 first, then undo ×2.") },
      { prompt: t("Choose the inverse route that returns {value} to its starting value after +4.", { value: n + 4 }), mode: "choice", answer: "subtract", choices: ["subtract", "add", "multiply"], model: { kind: "machine", input: n, steps: ["+4", "?"], output: n + 4 }, hint: t("An inverse operation undoes the change.") },
    ];
    return levels[r % levels.length];
  }
  if (worldId === "fractionbridge") {
    const levels = [
      { prompt: t("Join two equal spans to make 3/4 of the bridge."), mode: "fraction-pair", target: [3, 4], parts: 2, answer: [[1, 4], [1, 2]], model: { kind: "bridge", target: [3, 4] }, hint: "Try a fourth and a half. Rename the half in fourths to compare." },
      { prompt: t("Two matching spans must cover 2/3 of the bridge. Enter one span."), mode: "fraction-pair", target: [2, 3], parts: 2, answer: [[1, 3], [1, 3]], model: { kind: "bridge", target: [2, 3] }, hint: "Two copies of one third cover two thirds." },
      { prompt: t("Build a 5/6 span from two different pieces."), mode: "fraction-pair", target: [5, 6], parts: 2, answer: [[1, 2], [1, 3]], model: { kind: "bridge", target: [5, 6] }, hint: "Rename one half as sixths before adding." },
      { prompt: t("A 1 1/4-long route has a 3/4 piece. What length is still missing?"), mode: "fraction-pair", target: [1, 2], parts: 2, answer: [[1, 2], [0, 1]], model: { kind: "bridge", target: [1, 2] }, hint: "Subtract 3/4 from 1 1/4. Think in fourths." },
      { prompt: t("Make an equivalent span for 2/5 using tenths."), mode: "fraction-single", target: [2, 5], denominator: 10, answer: [4, 10], model: { kind: "bridge", target: [2, 5] }, hint: "Multiply numerator and denominator by the same number." },
    ];
    return levels[r % levels.length];
  }
  if (worldId === "balancestation") {
    const levels = [
      { prompt: t("The pans show x + {n} = {total}. Find x.", { n, total: n + 6 }), mode: "input", label: "Value of x", answer: 6, model: { kind: "balance", left: `x + ${n}`, right: n + 6, x: "?" }, hint: t("Remove {n} from both pans.", { n }) },
      { prompt: t("Balance 2x + 3 = {total}. Find x.", { total: n * 2 + 3 }), mode: "input", label: "Value of x", answer: n, model: { kind: "balance", left: "2x + 3", right: n * 2 + 3, x: "?" }, hint: "Undo +3 on both sides, then split the remaining weight into two equal groups." },
      { prompt: t("The balance reads x − {n} = 4. What value belongs on the x pan?", { n }), mode: "input", label: "Value of x", answer: n + 4, model: { kind: "balance", left: `x − ${n}`, right: 4, x: "?" }, hint: t("Add {n} to both sides to keep equality.", { n }) },
      { prompt: t("A positive {n} tile and a negative {n} tile make what net change?", { n }), mode: "choice", answer: "0", choices: ["0", String(n), String(-n)], model: { kind: "balance", left: `+${n} and −${n}`, right: "?", x: "?" }, hint: "Equal opposite values cancel to zero." },
      { prompt: t("Solve 3x − 2 = {total}. Find x.", { total: 3 * n - 2 }), mode: "input", label: "Value of x", answer: n, model: { kind: "balance", left: "3x − 2", right: 3 * n - 2, x: "?" }, hint: "Add 2 to each side, then divide each side into three equal groups." },
    ];
    return levels[r % levels.length];
  }
  if (worldId === "ratiocity") {
    const levels = [
      { prompt: t("A park uses {n} trees for every 2 paths. How many trees for 6 paths?", { n }), mode: "input", label: "Trees", answer: n * 3, model: { kind: "ratio", a: n, b: 2, scale: 3, unitA: "trees", unitB: "paths" }, hint: t("Scale both quantities by the same factor from 2 paths to 6.") },
      { prompt: t("A blueprint uses 3 blocks for every 2 floors. Scale it to 8 floors."), mode: "input", label: "Blocks", answer: 12, model: { kind: "ratio", a: 3, b: 2, scale: 4, unitA: "blocks", unitB: "floors" }, hint: t("Find the scale factor from 2 floors to 8 floors.") },
      { prompt: t("A paint mix is 2 blue to 5 white. How many blue parts for 20 white?"), mode: "input", label: "Blue parts", answer: 8, model: { kind: "ratio", a: 2, b: 5, scale: 4, unitA: "blue", unitB: "white" }, hint: t("20 white is four groups of 5. Keep the same four groups of blue.") },
      { prompt: t("A plaza is 25% garden. What percent is paved?"), mode: "choice", answer: "75", choices: ["25", "50", "75"], model: { kind: "percent", percent: 25 }, hint: t("The whole is 100%. Find what remains after the garden.") },
      { prompt: t("A 4-meter wall costs ${cost}. At the same rate, what does a 7-meter wall cost?", { cost: n * 12 }), mode: "input", label: "Cost in dollars", answer: 21 * n, model: { kind: "ratio", a: n * 12, b: 4, scale: 1.75, unitA: "dollars", unitB: "meters" }, hint: t("Find the cost for one meter, then multiply by 7.") },
    ];
    return levels[r % levels.length];
  }
  return null;
}

export function validateWorldAnswer(worldId, level, values) {
  if (!level || !values) return false;
  if (level.mode === "input") return int(values.answer) === level.answer;
  if (level.mode === "decimal") return Number.isFinite(Number(values.answer)) && Math.round(Number(values.answer) * 100) === Math.round(level.answer * 100);
  if (level.mode === "tenframe") return Number(values.answer) === level.answer;
  if (level.mode === "harbor") {
    const docks = Array.isArray(values.docks) ? values.docks.map(int) : [];
    return docks.length === level.model.docks && docks.every((value) => Number.isSafeInteger(value) && value === level.answer) && docks.reduce((sum, value) => sum + value, 0) + level.remainder === level.model.cargo;
  }
  if (level.mode === "coordinate") return int(values.x) === level.answer[0] && int(values.y) === level.answer[1];
  if (level.mode === "choice") return String(values.choice) === String(level.answer);
  if (level.mode === "fraction-single") {
    const [a, b] = level.answer;
    const n = int(values.numerator), d = int(values.denominator);
    return Math.abs(n) <= 100 && Math.abs(d) <= 100 && sameFraction(n, d, a, b);
  }
  if (level.mode === "fraction-pair") {
    const a = int(values.numerator1), b = int(values.denominator1), c = int(values.numerator2), d = int(values.denominator2);
    if (![a, b, c, d].every(Number.isSafeInteger) || [a, b, c, d].some((value) => Math.abs(value) > 100) || b <= 0 || d <= 0 || a < 0 || c < 0 || a > b || c > d) return false;
    return BigInt(a) * BigInt(d) * BigInt(level.target[1]) + BigInt(c) * BigInt(b) * BigInt(level.target[1]) === BigInt(level.target[0]) * BigInt(b) * BigInt(d);
  }
  return false;
}

function modelHtml(level) {
  const m = level.model;
  if (m.kind === "tenframe") return `<div class="pw-tenframe" role="img" aria-label="${t("Ten-frame with {filled} counters and {empty} empty spaces", { filled: m.filled, empty: m.total - m.filled })}">${Array.from({ length: 10 }, (_, i) => `<span class="${i < m.filled ? "filled" : ""}" aria-hidden="true">${i < m.filled ? "●" : "○"}</span>`).join("")}<strong>${m.filled} + ? = ${m.total}</strong></div>`;
  if (m.kind === "harbor") return `<div class="pw-harbor" role="img" aria-label="${t("{cargo} crates shared across {docks} docks", { cargo: m.cargo, docks: m.docks })}">${Array.from({ length: m.docks }, (_, i) => `<div><span aria-hidden="true">⚓</span><b>${t("Dock {n}", { n: i + 1 })}</b><small>${t("equal share")}</small></div>`).join("")}<p>${m.cargo} ${t("crates")}${m.remainder ? ` · ${m.remainder} ${t("left over")}` : ""}</p></div>`;
  if (m.kind === "decimal") return `<div class="pw-decimal" role="img" aria-label="${t("Decimal place value: {a} plus {b}", { a: m.a, b: m.b })}"><span>${m.a}</span><b>+</b><span>${m.b}</span><b>=</b><strong>?</strong><small>${t("ones · tenths · hundredths")}</small></div>`;
  if (m.kind === "integerline") return `<div class="pw-integerline" role="img" aria-label="${t("Start at {start}; move {direction} {move}", { start: m.start, direction: t(m.direction), move: m.move })}">${Array.from({ length: 21 }, (_, i) => { const value = i - 10; return `<span class="${value === 0 ? "zero" : ""} ${value === m.start ? "start" : ""}" data-integer-value="${value}"><b>${value}</b>${value === m.start ? `<small>${t("start")}</small>` : ""}</span>`; }).join("")}</div>`;
  if (m.kind === "graph") return `<div class="pw-graph" role="img" aria-label="${t("Coordinate grid for plotting a point on the route")}"><span class="pw-graph-axis-x"></span><span class="pw-graph-axis-y"></span><span class="pw-graph-point" data-pw-graph-point hidden></span><p>y = ${m.rate}x + ${m.intercept}</p></div>`;
  if (m.kind === "machine") return `<div class="pw-machine" role="img" aria-label="${t("Input through {route} gives output {output}", { route: m.steps.join(" then "), output: m.output })}"><strong>${esc(m.input)}</strong>${m.steps.map((step) => `<span class="pw-machine-step">${esc(step)}</span>`).join("")}<strong>${m.output}</strong></div>`;
  if (m.kind === "bridge") return `<div class="pw-bridge" role="img" aria-label="${t("Bridge target {target}", { target: `${m.target[0]}/${m.target[1]}` })}"><span>⚓</span><div class="pw-bridge-deck" style="--parts:${m.target[1]}">${Array.from({ length: m.target[1] }, (_, i) => `<i class="${i < m.target[0] ? "filled" : ""}"></i>`).join("")}</div><span>⚓</span></div><div class="pw-built-track" data-pw-built-track role="img" aria-label="${t("Your bridge pieces")}"><div class="pw-built-bar" data-pw-built-bar></div></div>`;
  if (m.kind === "balance") return `<div class="pw-scale" role="img" aria-label="${t("Balance model: {left} equals {right}", { left: m.left, right: m.right })}"><div class="pw-pan">${esc(m.left)}</div><div class="pw-beam" aria-hidden="true"></div><div class="pw-pan">${esc(m.right)}</div><div class="pw-scale-base" aria-hidden="true"></div></div>`;
  if (m.kind === "ratio") return `<div class="pw-ratio" role="img" aria-label="${t("{a} {unitA} for {b} {unitB}; scale factor {scale}", { a: m.a, unitA: t(m.unitA), b: m.b, unitB: t(m.unitB), scale: m.scale })}"><div><b>${m.a}</b><span>${esc(t(m.unitA))}</span></div><i>↔</i><div><b>${m.b}</b><span>${esc(t(m.unitB))}</span></div><small>× ${m.scale}</small><p data-pw-ratio-output>${t("Scaled result")} · —</p></div>`;
  return `<div class="pw-percent" role="img" aria-label="${t("A 100 percent city block")}"><span style="--percent:${m.percent}%">${m.percent}% garden</span><span>${100 - m.percent}% paved</span></div>`;
}

export function skillIdForWorld(worldId, grade) {
  if (worldId === "numbergarden") return grade === 0 ? "count-cardinality" : grade === 1 ? "count-patterns" : grade === 2 ? "skip-count" : null;
  if (worldId === "arrayarchitect") return grade >= 3 ? "mul-0-5" : null;
  if (worldId === "tenframefactory") return grade === 0 ? "compose-10" : grade === 1 ? "make-10" : grade === 2 ? "facts-20" : null;
  if (worldId === "divisionharbor") return grade >= 5 ? "divide-whole" : grade === 4 ? "division" : grade === 3 ? "division-facts" : null;
  if (worldId === "decimaldashboards") return grade >= 6 ? "decimal-ops" : grade === 5 ? "decimal-add" : null;
  if (worldId === "integerexpedition") return grade >= 7 ? "integer-add" : grade === 6 ? "integers" : null;
  if (worldId === "graphcity") return grade >= 8 ? "functions" : grade === 7 ? "scale-drawing" : null;
  if (worldId === "numbergarden") return grade === 0 ? "count-cardinality" : grade === 1 ? "count-patterns" : grade === 2 ? "skip-count" : null;
  if (worldId === "arrayarchitect") return grade >= 3 ? "mul-0-5" : null;
  if (worldId === "equationfactory") return grade >= 8 ? "linear-equations" : grade >= 7 ? "equations" : "one-step";
  if (worldId === "fractionbridge") return grade >= 5 ? "fraction-add" : "fraction-equiv";
  if (worldId === "balancestation") return grade >= 8 ? "linear-equations" : grade >= 7 ? "equations" : "one-step";
  if (worldId === "ratiocity") return grade >= 7 ? "proportions" : "ratios";
  return null;
}

export function evaluateWorldBuild(worldId, level, values) {
  if (!level || !values) return { ready: false, text: t("Enter a value to test the model.") };
  if (level.mode === "fraction-single") {
    const n = int(values.numerator), d = int(values.denominator);
    if (!Number.isSafeInteger(n) || !Number.isSafeInteger(d) || Math.abs(n) > 100 || Math.abs(d) > 100 || d < 1) return { ready: false, text: t("Enter a numerator and a positive denominator.") };
    return { ready: true, text: t("Fraction {value} compared with {target}", { value: `${n}/${d}`, target: `${level.target[0]}/${level.target[1]}` }), balanced: sameFraction(n, d, ...level.target), fraction: n / d };
  }
  if (level.mode === "fraction-pair") {
    const a = int(values.numerator1), b = int(values.denominator1), c = int(values.numerator2), d = int(values.denominator2);
    if (![a, b, c, d].every(Number.isSafeInteger) || [a, b, c, d].some((value) => Math.abs(value) > 100) || b < 1 || d < 1) return { ready: false, text: t("Enter two fractions with positive denominators.") };
    const balanced = BigInt(a) * BigInt(d) * BigInt(level.target[1]) + BigInt(c) * BigInt(b) * BigInt(level.target[1]) === BigInt(level.target[0]) * BigInt(b) * BigInt(d);
    return { ready: true, text: t("Pieces {first} and {second}; target {target}", { first: `${a}/${b}`, second: `${c}/${d}`, target: `${level.target[0]}/${level.target[1]}` }), balanced, fraction: a / b + c / d };
  }
  if (level.mode === "harbor") {
    const docks = (values.docks || []).map(Number);
    if (docks.length !== level.model.docks || docks.some((value) => !Number.isSafeInteger(value) || value < 0)) return { ready: false, text: t("Enter a whole-number load for each dock.") };
    return { ready: true, text: t("{docks} docks · {share} crates each · {remainder} left over", { docks: docks.length, share: docks[0], remainder: level.remainder }), balanced: docks.every((value) => value === docks[0]) && docks.reduce((sum, value) => sum + value, 0) + level.remainder === level.model.cargo };
  }
  const choice = String(values.choice ?? "");
  const answer = level.mode === "decimal" ? Number(values.answer) : int(values.answer);
  if (level.mode === "tenframe") {
    const count = Number(values.answer);
    return { ready: Number.isInteger(count) && count >= 0 && count <= 10, text: t("You placed {count} of {total} counters.", { count, total: level.answer }), balanced: count === level.answer };
  }
  if (level.mode === "coordinate") {
    const x = int(values.x), y = int(values.y);
    if (!Number.isSafeInteger(x) || !Number.isSafeInteger(y)) return { ready: false, text: t("Enter both coordinates to test the route.") };
    return { ready: true, text: t("Point ({x}, {y}) compared with the route point.", { x, y }), balanced: x === level.answer[0] && y === level.answer[1] };
  }
  if (level.mode === "decimal") {
    if (!Number.isFinite(answer)) return { ready: false, text: t("Enter a decimal total to test the dashboard.") };
    return { ready: true, text: t("Dashboard total: {value}", { value: answer.toFixed(2) }), balanced: Math.round(answer * 100) === Math.round(level.answer * 100) };
  }
  if (level.mode === "choice") return { ready: Boolean(choice), text: choice ? t("Selected: {value}", { value: choice }) : t("Choose a value to test."), balanced: choice === String(level.answer) };
  if (!Number.isSafeInteger(answer)) return { ready: false, text: t("Enter a whole number to test the model.") };
  if (worldId === "equationfactory" && level.model.kind === "machine") {
    let out = answer;
    for (const step of level.model.steps) {
      if (step.startsWith("+")) out += Number(step.slice(1));
      else if (step.startsWith("−")) out -= Number(step.slice(1));
      else if (step.startsWith("×")) out *= Number(step.slice(1));
    }
    return { ready: true, text: t("Input {input} → output {output}; target {target}", { input: answer, output: out, target: level.model.output }), balanced: out === level.model.output, input: answer, output: out };
  }
  if (worldId === "balancestation") {
    const n = Number(level.model.left.match(/\d+/)?.[0] || 0);
    let left = answer;
    if (level.model.left.startsWith("x +")) left += n;
    else if (level.model.left.startsWith("x −")) left -= n;
    else if (level.model.left.startsWith("2x")) left = 2 * answer + 3;
    else if (level.model.left.startsWith("3x")) left = 3 * answer - 2;
    const right = Number(level.model.right);
    return { ready: true, text: t("Left pan: {left}; right pan: {right}", { left, right }), balanced: left === right, difference: left - right, left, right };
  }
  if (worldId === "ratiocity") { const expected = level.model.a * level.model.scale; return { ready: true, text: t("Built quantity: {value} {unit}; scale ×{scale}", { value: answer, unit: t(level.model.unitA), scale: level.model.scale }), balanced: answer === expected, output: expected }; }
  return { ready: true, text: t("Your value: {value}", { value: answer }), balanced: answer === level.answer };
}

export function playPuzzleWorld(container, { grade, finish, gameId, onEvidence = () => {} }) {
  const world = PUZZLE_WORLDS.find((entry) => entry.id === gameId);
  if (!world) return () => {};
  const total = 5;
  const state = { round: 0, firstTry: 0, misses: 0, missed: false, hinted: false, locked: false, paused: false };
  let level;
  let timer;
  const feedback = (good, message) => {
    const node = container.querySelector("[data-pw-feedback]");
    node.dataset.state = good ? "right" : "retry";
    node.textContent = message;
  };
  const values = () => ({ answer: level?.mode === "tenframe" ? container.querySelectorAll("[data-frame-counter][aria-pressed=true]").length : container.querySelector("[name=pw-answer]")?.value, x: container.querySelector("[name=pw-x]")?.value, y: container.querySelector("[name=pw-y]")?.value, docks: Array.from(container.querySelectorAll("[name=pw-dock]"), (input) => input.value), choice: container.querySelector("[name=pw-choice]:checked")?.value, numerator: container.querySelector("[name=pw-num]")?.value, denominator: container.querySelector("[name=pw-den]")?.value, numerator1: container.querySelector("[name=pw-num1]")?.value, denominator1: container.querySelector("[name=pw-den1]")?.value, numerator2: container.querySelector("[name=pw-num2]")?.value, denominator2: container.querySelector("[name=pw-den2]")?.value });
  const updateLive = () => {
    const result = evaluateWorldBuild(world.id, level, values());
    const output = container.querySelector("[data-pw-live]");
    if (!output) return;
    output.textContent = t(result.text);
    output.dataset.state = result.balanced === undefined ? "pending" : result.balanced ? "balanced" : "unbalanced";
    const model = container.querySelector(".pw-scene");
    model?.classList.toggle("pw-balanced", result.balanced === true);
    const track = container.querySelector("[data-pw-built-track]");
    const bar = container.querySelector("[data-pw-built-bar]");
    if (track && bar && Number.isFinite(result.fraction)) {
      const target = level.target[0] / level.target[1];
      const percent = Math.min(100, Math.max(0, result.fraction / target * 100));
      bar.style.width = `${percent}%`;
      bar.dataset.overlap = String(result.fraction > target);
      track.setAttribute("aria-label", `${result.text}; target ${level.target[0]}/${level.target[1]}`);
    }
    if (Number.isFinite(result.input)) {
      const inputValue = container.querySelector(".pw-machine strong:first-child");
      if (inputValue) inputValue.textContent = String(result.input);
    }
    if (world.id === "integerexpedition") {
      const value = Number(values().answer);
      container.querySelectorAll("[data-integer-value]").forEach((tick) => tick.dataset.current = String(Number(tick.dataset.integerValue) === value));
    }
    if (level.mode === "coordinate") {
      const point = container.querySelector("[data-pw-graph-point]");
      const x = Number(values().x), y = Number(values().y);
      if (point) { point.hidden = !Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 10 || y < 0 || y > 25; if (!point.hidden) { point.style.setProperty("--x", String(x)); point.style.setProperty("--y", String(y)); } }
    }
    if (Number.isFinite(result.output)) {
      const outputValue = container.querySelector(".pw-machine strong:last-child");
      if (outputValue) outputValue.textContent = String(result.output);
      const ratioOutput = container.querySelector("[data-pw-ratio-output]");
      if (ratioOutput) ratioOutput.textContent = `${t("Scaled result")} · ${result.output} ${t(level.model.unitA || "")}`.trim();
    }
    const scale = container.querySelector(".pw-scale");
    if (scale && Number.isFinite(result.difference)) {
      const tilt = Math.max(-10, Math.min(10, result.difference * 2));
      scale.style.setProperty("--tilt", `${tilt}deg`);
      const pans = scale.querySelectorAll(".pw-pan");
      if (pans[0]) pans[0].textContent = String(result.left);
      if (pans[1]) pans[1].textContent = String(result.right);
    }
  };
  const controls = () => {
    if (level.mode === "tenframe") return `<div class="pw-tenframe pw-tenframe-controls" role="group" aria-label="${t("Tap counters to fill the ten-frame to {total}.", { total: level.answer })}">${Array.from({ length: 10 }, (_, i) => `<button type="button" data-frame-counter aria-pressed="${i < level.model.filled}" aria-label="${t("Counter space {n}", { n: i + 1 })}" ${i < level.model.filled ? "disabled" : ""}>${i < level.model.filled ? "●" : "○"}</button>`).join("")}</div>`;
    if (level.mode === "decimal") return `<label class="pw-answer-label">${t(level.label)}<input name="pw-answer" type="number" step="0.01" min="0" max="20" inputmode="decimal" autocomplete="off"></label>`;
    if (level.mode === "coordinate") return `<div class="pw-coordinate-input"><label>${t("x-coordinate")}<input name="pw-x" type="number" min="0" max="10" step="1" inputmode="numeric"></label><label>${t("y-coordinate")}<input name="pw-y" type="number" min="0" max="25" step="1" inputmode="numeric"></label></div>`;
    if (level.mode === "harbor") return `<div class="pw-harbor-controls">${Array.from({ length: level.model.docks }, (_, i) => `<label>${t("Crates for dock {n}", { n: i + 1 })}<input name="pw-dock" type="number" min="0" max="${level.model.cargo}" step="1" inputmode="numeric"></label>`).join("")}</div>`;
    if (level.mode === "choice") return `<fieldset class="pw-choices"><legend>${t("Choose a value")}</legend>${level.choices.map((choice, i) => `<label><input type="radio" name="pw-choice" value="${esc(choice)}" ${i === 0 ? "checked" : ""}>${esc(t(choice))}${world.id === "ratiocity" && level.model.kind === "percent" ? "%" : ""}</label>`).join("")}</fieldset>`;
    if (level.mode === "fraction-single") return `<div class="pw-fraction-input"><label>${t("Numerator")}<input name="pw-num" type="number" min="0" max="100" value="1" inputmode="numeric"></label><span>/</span><label>${t("Denominator")}<input name="pw-den" type="number" min="1" max="100" value="2" inputmode="numeric"></label></div>`;
    if (level.mode === "fraction-pair") return `<div class="pw-fraction-input"><label>${t("Piece one numerator")}<input name="pw-num1" type="number" min="0" max="100" value="1" inputmode="numeric"></label><span>/</span><label>${t("Denominator")}<input name="pw-den1" type="number" min="1" max="100" value="4" inputmode="numeric"></label><b>+</b><label>${t("Piece two numerator")}<input name="pw-num2" type="number" min="0" max="100" value="1" inputmode="numeric"></label><span>/</span><label>${t("Denominator")}<input name="pw-den2" type="number" min="1" max="100" value="2" inputmode="numeric"></label></div>`;
    return `<label class="pw-answer-label">${t(level.label)}<input name="pw-answer" type="number" step="1" inputmode="numeric" autocomplete="off"></label>`;
  };
  const render = () => {
    level = worldLevel(world.id, grade, state.round);
    container.classList.add("pw-playing", `pw-${world.theme}`);
    container.innerHTML = `<header class="pw-head"><button type="button" class="tr-link" data-gm-menu>← ${t("Back to games")}</button><p class="section-label">${t("Puzzle world")} · ${esc(t(getGrade(grade).label))}</p><h2>${t(world.name)}</h2><p>${t("Stage {n} of {total}", { n: state.round + 1, total })} · ${t("No timer")}</p></header><section class="pw-scene pw-scene-${world.theme}" aria-label="${t(world.name)} puzzle"><p class="pw-prompt">${esc(level.prompt)}</p>${modelHtml(level)}<p class="pw-live" data-pw-live role="status" aria-live="polite">${t("Enter a value to test the model.")}</p><div class="pw-controls">${controls()}</div></section><p data-pw-feedback class="sig-feedback" role="status" aria-live="polite"></p><div class="sig-actions"><button type="button" class="outline-action" data-pw-hint>${t("Show a hint")}</button><button type="button" class="outline-action" data-pw-reset>${t("Reset this stage")}</button><button type="button" class="outline-action" data-pw-replay>${t("Replay model")}</button><button type="button" class="outline-action" data-pw-pause aria-pressed="false">${t("Pause motion")}</button><button type="button" class="primary-action" data-pw-check>${t("Test this model")}</button></div><p class="sig-hint" data-pw-hint-copy hidden>${esc(t(level.hint))}</p><p class="pw-reflect">${t("Predict, test, and revise. What relationship did your model show?")}</p>`;
  };
  const next = () => {
    state.round += 1;
    if (state.round >= total) {
      container.classList.remove("pw-playing", `pw-${world.theme}`);
      finish({ game: world.id, stars: state.firstTry === total ? 3 : state.firstTry >= 3 ? 2 : 1, missed: [], line: t("{first} of {total} stages solved independently on the first try; {revisions} revisions made", { first: state.firstTry, total, revisions: state.misses }) });
      return;
    }
    state.missed = false; state.hinted = false; state.locked = false; state.paused = false; render(); updateLive();
    container.querySelector("input")?.focus();
  };
  render();
  updateLive();
  container.oninput = (event) => { if (event.target.matches("input")) updateLive(); };
  container.onchange = (event) => { if (event.target.matches("input, select")) updateLive(); };
  container.onkeydown = (event) => { if (event.key === "Enter" && event.target.matches("input")) { event.preventDefault(); container.querySelector("[data-pw-check]")?.click(); } };
  container.onclick = (event) => {
    const counter = event.target.closest("[data-frame-counter]");
    if (counter && !state.locked) { counter.setAttribute("aria-pressed", String(counter.getAttribute("aria-pressed") !== "true")); counter.textContent = counter.getAttribute("aria-pressed") === "true" ? "●" : "○"; updateLive(); return; }
    if (event.target.closest("[data-pw-hint]")) { container.querySelector("[data-pw-hint-copy]").hidden = !container.querySelector("[data-pw-hint-copy]").hidden; state.hinted = true; return; }
    if (event.target.closest("[data-pw-reset]")) { state.locked = false; state.paused = false; render(); updateLive(); container.querySelector("input")?.focus(); return; }
    if (event.target.closest("[data-pw-replay]")) { const scene = container.querySelector(".pw-scene"); scene.classList.remove("pw-replay"); void scene.offsetWidth; scene.classList.add("pw-replay"); window.setTimeout(() => scene.classList.remove("pw-replay"), 900); return; }
    if (event.target.closest("[data-pw-pause]")) { state.paused = !state.paused; const button = container.querySelector("[data-pw-pause]"); button.setAttribute("aria-pressed", String(state.paused)); button.textContent = state.paused ? t("Resume motion") : t("Pause motion"); container.querySelector(".pw-scene").classList.toggle("pw-motion-paused", state.paused); return; }
    if (!event.target.closest("[data-pw-check]") || state.locked) return;
    if (validateWorldAnswer(world.id, level, values())) {
      state.firstTry += state.missed || state.hinted ? 0 : 1; state.locked = true; onEvidence({ worldId: world.id, grade, correct: true, independent: !state.missed && !state.hinted });
      feedback(true, t("The model checks out. Your quantities satisfy the relationship."));
      timer = window.setTimeout(next, 800);
    } else {
      state.misses += 1; state.missed = true;
      onEvidence({ worldId: world.id, grade, correct: false, independent: !state.hinted });
      const repair = world.id === "fractionbridge"
        ? "There is a gap or overlap. Compare the total length with the target."
        : world.id === "balancestation"
          ? "The pans are not equal yet. Make the same change to both sides."
          : world.id === "ratiocity"
            ? "The city quantities changed by different factors. Keep the ratio constant."
            : world.id === "tenframefactory"
              ? "Count the filled spaces and the empty spaces together to reach the target."
              : world.id === "divisionharbor"
                ? "Check that every dock has the same load, then account for any crates left over."
                : world.id === "decimaldashboards"
                  ? "Line up the decimal places and combine matching place values."
                  : world.id === "integerexpedition"
                    ? "Check the direction: right increases the value and left decreases it."
                    : world.id === "graphcity"
                      ? "Substitute x into the rule to find y, then check both coordinates."
                      : "That route does not return to the stated output. Check the inverse steps.";
      feedback(false, t(repair));
    }
  };
  return () => { window.clearTimeout(timer); container.onclick = null; container.oninput = null; container.onchange = null; container.onkeydown = null; container.classList.remove("pw-playing", `pw-${world.theme}`); };
}

export const PUZZLE_WORLD_ICONS = Object.fromEntries(PUZZLE_WORLDS.map((world) => [world.id, `<span class="pw-icon" aria-hidden="true">${world.icon}</span>`]));
