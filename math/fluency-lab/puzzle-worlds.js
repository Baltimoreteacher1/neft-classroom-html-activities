// Four math-native puzzle worlds. Level data, model rendering, and answer checks
// share one small runner so visual state and mathematical state cannot drift.
import { t } from "./i18n.js";

const esc = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const int = (value) => typeof value === "string" && value.trim() === "" ? NaN : Number.isSafeInteger(Number(value)) ? Number(value) : NaN;
const sameFraction = (a, b, c, d) => Number.isSafeInteger(a) && Number.isSafeInteger(b) && Number.isSafeInteger(c) && Number.isSafeInteger(d) && b > 0 && d > 0 && BigInt(a) * BigInt(d) === BigInt(c) * BigInt(b);

export const PUZZLE_WORLDS = [
  { id: "equationfactory", name: "Equation Factory", blurb: "Route values through machines, repair a missing input, and reverse a transformation.", theme: "factory", icon: "⚙️" },
  { id: "fractionbridge", name: "Fraction Bridge", blurb: "Fit exact fractional spans together to cross each gap without overlaps.", theme: "bridge", icon: "🌉" },
  { id: "balancestation", name: "Balance Station", blurb: "Move the balance point by solving equal expressions, including integers.", theme: "station", icon: "⚖️" },
  { id: "ratiocity", name: "Ratio City", blurb: "Scale building plans and supplies while keeping quantities proportional.", theme: "city", icon: "🏙️" },
];

// Each level is a reusable, auditable data record. Values vary by grade while
// retaining small exact integers so the models are readable and reliable.
export function worldLevel(worldId, grade, round) {
  const g = Math.max(1, Math.min(8, int(grade) || 1));
  const r = Math.max(0, int(round) || 0);
  const n = (g + r * 2) % 7 + 2;
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
  if (m.kind === "machine") return `<div class="pw-machine" role="img" aria-label="${t("Input through {route} gives output {output}", { route: m.steps.join(" then "), output: m.output })}"><strong>${esc(m.input)}</strong>${m.steps.map((step) => `<span class="pw-machine-step">${esc(step)}</span>`).join("")}<strong>${m.output}</strong></div>`;
  if (m.kind === "bridge") return `<div class="pw-bridge" role="img" aria-label="${t("Bridge target {target}", { target: `${m.target[0]}/${m.target[1]}` })}"><span>⚓</span><div class="pw-bridge-deck" style="--parts:${m.target[1]}">${Array.from({ length: m.target[1] }, (_, i) => `<i class="${i < m.target[0] ? "filled" : ""}"></i>`).join("")}</div><span>⚓</span></div><div class="pw-built-track" data-pw-built-track role="img" aria-label="${t("Your bridge pieces")}"><div class="pw-built-bar" data-pw-built-bar></div></div>`;
  if (m.kind === "balance") return `<div class="pw-scale" role="img" aria-label="${t("Balance model: {left} equals {right}", { left: m.left, right: m.right })}"><div class="pw-pan">${esc(m.left)}</div><div class="pw-beam" aria-hidden="true"></div><div class="pw-pan">${esc(m.right)}</div><div class="pw-scale-base" aria-hidden="true"></div></div>`;
  if (m.kind === "ratio") return `<div class="pw-ratio" role="img" aria-label="${t("{a} {unitA} for {b} {unitB}; scale factor {scale}", { a: m.a, unitA: t(m.unitA), b: m.b, unitB: t(m.unitB), scale: m.scale })}"><div><b>${m.a}</b><span>${esc(t(m.unitA))}</span></div><i>↔</i><div><b>${m.b}</b><span>${esc(t(m.unitB))}</span></div><small>× ${m.scale}</small><p data-pw-ratio-output>${t("Scaled result")} · —</p></div>`;
  return `<div class="pw-percent" role="img" aria-label="${t("A 100 percent city block")}"><span style="--percent:${m.percent}%">${m.percent}% garden</span><span>${100 - m.percent}% paved</span></div>`;
}

export function skillIdForWorld(worldId, grade) {
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
  const choice = String(values.choice ?? "");
  const answer = int(values.answer);
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
  const values = () => ({ answer: container.querySelector("[name=pw-answer]")?.value, choice: container.querySelector("[name=pw-choice]:checked")?.value, numerator: container.querySelector("[name=pw-num]")?.value, denominator: container.querySelector("[name=pw-den]")?.value, numerator1: container.querySelector("[name=pw-num1]")?.value, denominator1: container.querySelector("[name=pw-den1]")?.value, numerator2: container.querySelector("[name=pw-num2]")?.value, denominator2: container.querySelector("[name=pw-den2]")?.value });
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
    if (level.mode === "choice") return `<fieldset class="pw-choices"><legend>${t("Choose a value")}</legend>${level.choices.map((choice, i) => `<label><input type="radio" name="pw-choice" value="${esc(choice)}" ${i === 0 ? "checked" : ""}>${esc(t(choice))}${world.id === "ratiocity" && level.model.kind === "percent" ? "%" : ""}</label>`).join("")}</fieldset>`;
    if (level.mode === "fraction-single") return `<div class="pw-fraction-input"><label>${t("Numerator")}<input name="pw-num" type="number" min="0" max="100" value="1" inputmode="numeric"></label><span>/</span><label>${t("Denominator")}<input name="pw-den" type="number" min="1" max="100" value="2" inputmode="numeric"></label></div>`;
    if (level.mode === "fraction-pair") return `<div class="pw-fraction-input"><label>${t("Piece one numerator")}<input name="pw-num1" type="number" min="0" max="100" value="1" inputmode="numeric"></label><span>/</span><label>${t("Denominator")}<input name="pw-den1" type="number" min="1" max="100" value="4" inputmode="numeric"></label><b>+</b><label>${t("Piece two numerator")}<input name="pw-num2" type="number" min="0" max="100" value="1" inputmode="numeric"></label><span>/</span><label>${t("Denominator")}<input name="pw-den2" type="number" min="1" max="100" value="2" inputmode="numeric"></label></div>`;
    return `<label class="pw-answer-label">${t(level.label)}<input name="pw-answer" type="number" step="1" inputmode="numeric" autocomplete="off"></label>`;
  };
  const render = () => {
    level = worldLevel(world.id, grade, state.round);
    container.classList.add("pw-playing", `pw-${world.theme}`);
    container.innerHTML = `<header class="pw-head"><button type="button" class="tr-link" data-gm-menu>← ${t("Back to games")}</button><p class="section-label">${t("Puzzle world")} · ${t("Grade {n}", { n: grade })}</p><h2>${t(world.name)}</h2><p>${t("Stage {n} of {total}", { n: state.round + 1, total })} · ${t("No timer")}</p></header><section class="pw-scene pw-scene-${world.theme}" aria-label="${t(world.name)} puzzle"><p class="pw-prompt">${esc(level.prompt)}</p>${modelHtml(level)}<p class="pw-live" data-pw-live role="status" aria-live="polite">${t("Enter a value to test the model.")}</p><div class="pw-controls">${controls()}</div></section><p data-pw-feedback class="sig-feedback" role="status" aria-live="polite"></p><div class="sig-actions"><button type="button" class="outline-action" data-pw-hint>${t("Show a hint")}</button><button type="button" class="outline-action" data-pw-reset>${t("Reset this stage")}</button><button type="button" class="outline-action" data-pw-replay>${t("Replay model")}</button><button type="button" class="outline-action" data-pw-pause aria-pressed="false">${t("Pause motion")}</button><button type="button" class="primary-action" data-pw-check>${t("Test this model")}</button></div><p class="sig-hint" data-pw-hint-copy hidden>${esc(t(level.hint))}</p><p class="pw-reflect">${t("Predict, test, and revise. What relationship did your model show?")}</p>`;
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
    if (event.target.closest("[data-pw-hint]")) { container.querySelector("[data-pw-hint-copy]").hidden = !container.querySelector("[data-pw-hint-copy]").hidden; state.hinted = true; return; }
    if (event.target.closest("[data-pw-reset]")) { state.locked = false; state.paused = false; render(); updateLive(); container.querySelector("input")?.focus(); return; }
    if (event.target.closest("[data-pw-replay]")) { const scene = container.querySelector(".pw-scene"); scene.classList.remove("pw-replay"); void scene.offsetWidth; scene.classList.add("pw-replay"); window.setTimeout(() => scene.classList.remove("pw-replay"), 900); return; }
    if (event.target.closest("[data-pw-pause]")) { state.paused = !state.paused; const button = container.querySelector("[data-pw-pause]"); button.setAttribute("aria-pressed", String(state.paused)); button.textContent = state.paused ? t("Resume motion") : t("Pause motion"); container.querySelector(".pw-scene").classList.toggle("pw-motion-paused", state.paused); return; }
    if (!event.target.closest("[data-pw-check]") || state.locked) return;
    if (validateWorldAnswer(world.id, level, values())) {
      state.firstTry += state.missed || state.hinted ? 0 : 1; state.locked = true; onEvidence({ worldId: world.id, grade, correct: true, independent: !state.missed && !state.hinted });
      feedback(true, t("The model checks out. Your quantities satisfy the relationship."));
      timer = window.setTimeout(next, 800);
    } else { state.misses += 1; state.missed = true; onEvidence({ worldId: world.id, grade, correct: false, independent: !state.hinted }); feedback(false, world.id === "fractionbridge" ? t("There is a gap or overlap. Compare the total length with the target.") : world.id === "balancestation" ? t("The pans are not equal yet. Make the same change to both sides.") : world.id === "ratiocity" ? t("The city quantities changed by different factors. Keep the ratio constant.") : t("That route does not return to the stated output. Check the inverse steps.")); }
  };
  return () => { window.clearTimeout(timer); container.onclick = null; container.oninput = null; container.onchange = null; container.onkeydown = null; container.classList.remove("pw-playing", `pw-${world.theme}`); };
}

export const PUZZLE_WORLD_ICONS = Object.fromEntries(PUZZLE_WORLDS.map((world) => [world.id, `<span class="pw-icon" aria-hidden="true">${world.icon}</span>`]));
