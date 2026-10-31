import { mountFeedback, phaseFor } from "./feedback-host.js";
import { answerOf, answerText, gameProblem } from "./game-pool.js";
import { profileKey, profiles, readLocal, writeLocal } from "./school-tools.js";
import { t } from "./i18n.js";

const node = (tag, className, value) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (value != null) element.textContent = String(value);
  return element;
};
const fmt = (number) => Number(number.toFixed(4)).toString();
const action = (label, className, handler) => { const b = node("button", className, label); b.type = "button"; b.addEventListener("click", handler); return b; };
const header = (title, detail, onExit) => {
  const bar = node("div", "gm-bar");
  bar.append(action(t("← Games"), "tr-back", onExit), node("b", "", title), node("span", "", detail));
  return bar;
};

// Results use the shared feedback panel, which sits beside the game's status line. Plain guidance (a hint, a repeat
// entry) stays in the status line and hides the panel, so a stale "Not quite" never sits over new guidance.
function resultPanel(status, onAction) {
  const copy = node("p", "gm-note");
  status.after(copy);
  const panel = mountFeedback(copy, { onAction });
  return {
    say(message) { panel.clear(); status.hidden = false; status.textContent = message; },
    show(phase, ctx, message) { status.hidden = true; panel.show(phase, ctx, message); },
  };
}
const nextLabel = (last, label = t("Next")) => (last ? t("See results") : label);

/** Safe arithmetic parser. Values must come from the displayed tiles, each at most once. */
export function evaluateHiveExpression(expression, tiles, target) {
  const source = String(expression || "").replaceAll("−", "-").replaceAll("×", "*").replaceAll("÷", "/");
  const tokens = [];
  const re = /\s*(\d+(?:\.\d+)?|[()+\-*/])\s*/gy;
  let cursor = 0;
  while (cursor < source.length) { re.lastIndex = cursor; const match = re.exec(source); if (!match) return { ok: false, reason: "syntax" }; tokens.push(match[1]); cursor = re.lastIndex; }
  if (!tokens.length) return { ok: false, reason: "syntax" };
  let at = 0; const used = [];
  const atom = (sign = 1) => {
    const token = tokens[at];
    if (token === "+" || token === "-") { at += 1; return atom(sign * (token === "-" ? -1 : 1)); }
    if (token === "(") { at += 1; const value = sum(); if (tokens[at] !== ")") throw Error("paren"); at += 1; return sign * value; }
    if (!/^\d/.test(token || "")) throw Error("number");
    at += 1; const value = Number(token) * sign; used.push(value); return value;
  };
  const product = () => { let value = atom(); while (["*", "/"].includes(tokens[at])) { const op = tokens[at++]; const next = atom(); value = op === "*" ? value * next : next === 0 ? NaN : value / next; } return value; };
  const sum = () => { let value = product(); while (["+", "-"].includes(tokens[at])) { const op = tokens[at++]; const next = product(); value = op === "+" ? value + next : value - next; } return value; };
  let value;
  try { value = sum(); if (at !== tokens.length || !Number.isFinite(value)) return { ok: false, reason: "syntax" }; } catch { return { ok: false, reason: "syntax" }; }
  const available = new Map(); for (const tile of tiles) available.set(Number(tile), (available.get(Number(tile)) || 0) + 1);
  for (const number of used) { const count = available.get(number) || 0; if (!count) return { ok: false, reason: "tiles", value }; available.set(number, count - 1); }
  const ok = Math.abs(value - target) < 1e-8;
  return { ok, value, reason: ok ? "match" : "target" };
}

export function hiveTilesFor(target) {
  const value = Number(target);
  if (!Number.isFinite(value)) throw new TypeError("Hive target must be finite");
  if (value === 0) return [1, -1, 2, -2];
  return value > 0 ? [value - 2, 2, value + 1, 1] : [value + 2, -2, value - 1, -1];
}

function matchModelKind(item) {
  const question = String(item.question || "").replaceAll("−", "-").replaceAll("×", "*").replaceAll("÷", "/");
  if (/^\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?/.test(question)) return "fraction";
  if (/^\d+(?:\.\d+)?\s*\*\s*\d+(?:\.\d+)?/.test(question)) return "array";
  if (/^\d+(?:\.\d+)?\s*[+-]\s*\d+(?:\.\d+)?/.test(question)) return "numberline";
  return "quantity";
}

export function strategyMatchPairs(items) {
  return items.map((item, index) => ({
    id: `strategy-pair-${index + 1}`,
    item,
    expression: String(item.question || ""),
    answer: String(item.answers?.[0] ?? ""),
    modelKind: matchModelKind(item),
  }));
}

function matchModelSvg(pair) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 240 118");
  svg.setAttribute("width", "240");
  svg.setAttribute("height", "118");
  svg.setAttribute("role", "img");
  const line = (x1, y1, x2, y2, cls = "gm-match-axis") => {
    const element = document.createElementNS(svg.namespaceURI, "line");
    for (const [key, value] of Object.entries({ x1, y1, x2, y2, class: cls })) element.setAttribute(key, String(value));
    return element;
  };
  const textNode = (x, y, value, cls = "gm-match-label") => {
    const element = document.createElementNS(svg.namespaceURI, "text");
    element.setAttribute("x", String(x)); element.setAttribute("y", String(y)); element.setAttribute("class", cls);
    element.setAttribute("text-anchor", "middle"); element.textContent = String(value);
    return element;
  };
  const question = pair.expression.replaceAll("−", "-").replaceAll("×", "*").replaceAll("÷", "/");
  const operands = question.match(/-?\d+(?:\.\d+)?/g)?.map(Number) || [];
  const fractionAnswer = String(pair.answer).match(/^(-?\d+)\s*\/\s*(\d+)$/);
  const answer = Number.isFinite(Number(pair.answer)) ? Number(pair.answer)
    : fractionAnswer && Number(fractionAnswer[2]) ? Number(fractionAnswer[1]) / Number(fractionAnswer[2]) : NaN;
  if (pair.modelKind === "array" && operands.length >= 2) {
    const rows = Math.max(1, Math.min(6, Math.round(operands[0])));
    const cols = Math.max(1, Math.min(10, Math.round(operands[1])));
    const cellW = Math.min(20, 140 / cols), cellH = Math.min(16, 72 / rows), x0 = (240 - cols * cellW) / 2, y0 = 12;
    for (let row = 0; row < rows; row += 1) for (let col = 0; col < cols; col += 1) {
      const cell = document.createElementNS(svg.namespaceURI, "rect");
      for (const [key, value] of Object.entries({ x: x0 + col * cellW, y: y0 + row * cellH, width: cellW - 2, height: cellH - 2, rx: 2, class: "gm-match-cell" })) cell.setAttribute(key, String(value));
      svg.append(cell);
    }
    svg.append(textNode(120, 106, `${pair.expression.replace("= ?", "").trim()} = ${pair.answer}`));
  } else if (pair.modelKind === "numberline" && operands.length >= 2 && Number.isFinite(answer)) {
    const start = operands[0], end = answer, min = Math.min(0, start, end), max = Math.max(10, start, end), span = Math.max(1, max - min);
    const x = (value) => 24 + ((value - min) / span) * 192;
    svg.append(line(24, 70, 216, 70));
    for (const value of [start, end]) { svg.append(line(x(value), 64, x(value), 77, "gm-match-tick")); svg.append(textNode(x(value), 96, value)); }
    const arc = document.createElementNS(svg.namespaceURI, "path");
    arc.setAttribute("d", `M${x(start)} 66 Q${(x(start) + x(end)) / 2} 12 ${x(end)} 66`);
    arc.setAttribute("class", "gm-match-jump"); svg.append(arc);
    svg.append(textNode(120, 112, `${pair.expression.replace("= ?", "").trim()} = ${pair.answer}`));
  } else if (pair.modelKind === "fraction" && Number.isFinite(answer)) {
    const denominator = Math.max(2, Math.min(12, Math.round(Math.abs(answer) <= 1 ? 12 : 10)));
    const shaded = Math.max(0, Math.min(denominator, Math.round(Math.abs(answer) * denominator)));
    const width = 192 / denominator;
    for (let index = 0; index < denominator; index += 1) {
      const part = document.createElementNS(svg.namespaceURI, "rect");
      for (const [key, value] of Object.entries({ x: 24 + index * width, y: 30, width: width - 2, height: 38, rx: 2, class: index < shaded ? "gm-match-cell gm-match-shaded" : "gm-match-cell" })) part.setAttribute(key, String(value));
      svg.append(part);
    }
    svg.append(textNode(120, 96, `${pair.expression.replace("= ?", "").trim()} = ${pair.answer}`));
  } else {
    svg.append(line(34, 70, 206, 70));
    const point = document.createElementNS(svg.namespaceURI, "circle");
    point.setAttribute("cx", "120"); point.setAttribute("cy", "70"); point.setAttribute("r", "12"); point.setAttribute("class", "gm-match-point");
    svg.append(point, textNode(120, 105, `${pair.expression.replace("= ?", "").trim()} = ${pair.answer}`));
  }
  const kindLabels = { array: t("Array model"), numberline: t("Number line model"), fraction: t("Fraction bar model"), quantity: t("Quantity model") };
  svg.setAttribute("aria-label", `${kindLabels[pair.modelKind]}: ${pair.expression}`);
  return svg;
}

export function playStrategyMatch(container, { grade, stop, finish, onEvidence = () => {}, onFact = () => {} }) {
  const items = [];
  for (let attempt = 0; attempt < 40 && items.length < 3; attempt += 1) {
    const candidate = gameProblem(grade, stop);
    if (!items.some((item) => item.question === candidate.question)) items.push(candidate);
  }
  if (!items.length) { finish({ game: "strategymatch", stars: 0, missed: [], line: t("No matching problems are ready right now.") }); return; }
  const pairs = strategyMatchPairs(items);
  const rotation = (Number(grade) + String(stop?.id || stop || "").length) % pairs.length;
  const deck = [
    ...pairs.map((pair) => ({ pair, kind: "expression" })),
    ...pairs.map((pair, index) => ({ pair: pairs[(index + rotation) % pairs.length], kind: "model" })),
  ];
  const state = { open: null, matched: new Set(), misses: 0, turns: 0, done: false };
  const summary = () => ({ game: "strategymatch", stars: state.misses === 0 ? 3 : state.misses < 3 ? 2 : 1, missed: [], line: t("You matched {n} strategies with visual models.", { n: pairs.length }) });
  const render = (message = "", fb = null) => {
    const screen = node("section", "gm-play gm-strategy-match");
    screen.append(header(t("Strategy Match"), t("{n} of {total} matches", { n: state.matched.size, total: pairs.length }), () => finish({ game: "strategymatch", stars: 0, missed: [], line: t("You can return to strategy match anytime.") })));
    screen.append(node("p", "gm-ask", t("Match each expression with a visual model that shows the same quantities. There is no timer.")));
    const grid = node("div", "gm-match-grid"); grid.setAttribute("role", "group"); grid.setAttribute("aria-label", t("Expression and model match cards"));
    for (const [index, card] of deck.entries()) {
      const isOpen = state.open?.index === index || state.open?.otherIndex === index;
      const matched = state.matched.has(card.pair.id);
      const button = action(isOpen || matched ? "" : t("Reveal card"), `gm-match-card ${isOpen || matched ? "revealed" : "face-down"} ${matched ? "matched" : ""}`, () => {
        if (state.done) return;
        if (state.open?.otherIndex != null) { state.open = null; render(t("Keep looking for matching quantities.")); return; }
        if (matched || isOpen) return;
        if (!state.open) { state.open = { index, card }; render(); return; }
        state.turns += 1;
        if (state.open.card.kind !== card.kind && state.open.card.pair.id === card.pair.id) {
          state.matched.add(card.pair.id); onFact(card.pair.item, state.misses === 0);
          onEvidence({ worldId: "strategymatch", grade, correct: true, independent: state.misses === 0 });
          state.open = null;
          const last = state.matched.size === pairs.length;
          state.done = last;
          const ctx = { expected: `${card.pair.expression.replace("= ?", "").trim()} = ${card.pair.answer}`, ...(last ? { next: t("See results") } : {}) };
          render(last ? t("You matched {n} strategies with visual models.", { n: pairs.length }) : t("A strategy pair matches. Find the next one."), { phase: phaseFor("strategymatch", state.misses === 0 ? "right" : "right-after-miss"), ctx });
        } else {
          state.misses += 1;
          onEvidence({ worldId: "strategymatch", grade, correct: false, independent: true });
          state.open.otherIndex = index;
          render(t("Those cards do not match. Choose one card to turn them back over."), { phase: phaseFor("strategymatch", "miss"), ctx: {} });
        }
      });
      button.setAttribute("aria-pressed", String(isOpen || matched));
      button.setAttribute("aria-label", matched || isOpen ? `${card.kind === "expression" ? card.pair.expression : t("Visual model for {expression}", { expression: card.pair.expression })}${matched ? ` · ${t("matched")}` : ""}` : t("Hidden match card {n}", { n: index + 1 }));
      if (isOpen || matched) {
        if (card.kind === "expression") button.append(node("strong", "gm-match-expression", card.pair.expression));
        else button.append(matchModelSvg(card.pair));
      } else button.append(node("span", "gm-match-question", "?"));
      grid.append(button);
    }
    const status = node("p", "gm-note", message || t("Take your time. Match expressions to models, not to a timer.")); status.setAttribute("role", "status"); status.setAttribute("aria-live", "polite");
    screen.append(grid, status);
    const surface = resultPanel(status, (id) => {
      if (id === "next" && state.done) finish(summary());
      else if (id === "try-again" && state.open?.otherIndex != null) { state.open = null; render(t("Keep looking for matching quantities.")); }
    });
    if (fb) surface.show(fb.phase, fb.ctx, message);
    container.replaceChildren(screen);
    screen.querySelector("[data-feedback-action]")?.focus();
  };
  render();
}

export function personalGhostScore(correct, attempted, elapsedSeconds) {
  if (!attempted || !elapsedSeconds) return 0;
  return Math.round((correct / attempted) * (correct / elapsedSeconds) * 6000) / 100;
}

export function playTargetHive(container, { grade, stop, finish, onEvidence = () => {}, onFact = () => {} }) {
  const total = 3; const state = { round: 0, answers: [], first: 0, hinted: false, missed: false, locked: false, ended: false, misses: 0 };
  let problem; let target; let tiles;
  const draw = () => { problem = gameProblem(grade, stop); target = answerOf(problem); tiles = hiveTilesFor(target); state.answers = []; state.hinted = false; state.missed = false; state.locked = false; };
  const advance = () => {
    if (!state.locked || state.ended) return;
    state.round += 1;
    if (state.round >= total) { state.ended = true; finish({ game: "targethive", stars: state.first >= total ? 3 : state.first ? 2 : 1, missed: [], line: t("You explored {n} targets with different equations.", { n: total }) }); } else { draw(); render(""); }
  };
  const render = (message, fb = null) => {
    const screen = node("section", "gm-play gm-target-hive");
    screen.append(header(t("Target Number Hive"), t("Target {n} of {total}", { n: state.round + 1, total }), () => finish({ game: "targethive", stars: 0, missed: [], line: t("You can return to the hive anytime.") })));
    screen.append(node("p", "gm-ask", t("Use the number tiles and operations to build an expression for the target. Find two different ways. Take your time.")));
    const targetCard = node("div", "gm-hive-target"); targetCard.append(node("span", "", t("Target")), node("strong", "", fmt(target))); screen.append(targetCard);
    const row = node("div", "gm-hive-tiles"); row.setAttribute("role", "group"); row.setAttribute("aria-label", t("Available number tiles"));
    const input = node("input", "tr-input"); input.id = "hive-expression"; input.autocomplete = "off"; input.spellcheck = false; input.setAttribute("aria-label", t("Your expression"));
    for (const value of tiles) row.append(action(fmt(value), "gm-hive-tile", () => { input.value += (input.value && !/[+\-−×÷*/(]$/.test(input.value) ? " " : "") + fmt(value); input.focus(); }));
    screen.append(row);
    const form = node("form", "gm-hive-form"); form.append(node("label", "", t("Your expression"))); form.querySelector("label").htmlFor = input.id;
    const entry = node("div", "gm-hive-entry"); entry.append(input); const submit = node("button", "tr-check", t("Check expression")); submit.type = "submit"; entry.append(submit); form.append(entry);
    form.addEventListener("submit", (event) => {
      event.preventDefault(); if (state.locked) return;
      const result = evaluateHiveExpression(input.value, tiles, target);
      if (!result.ok) { state.misses += 1; state.missed = true; onEvidence({ worldId: "targethive", grade, correct: false, independent: !state.hinted }); const reply = result.reason === "tiles" ? t("Use only the tiles shown, and use each tile no more than once.") : result.reason === "target" ? t("That expression is valid. Check its value against the target.") : t("Enter a math expression with the shown operations."); if (result.reason === "syntax") surface.show("empty", {}, reply); else surface.show(phaseFor("targethive", "miss"), { submitted: input.value.trim(), hintAvailable: !state.hinted }, reply); return; }
      const key = input.value.replace(/\s+/g, "").replaceAll("−", "-").replaceAll("×", "*").replaceAll("÷", "/");
      if (state.answers.some((answer) => answer.key === key)) { surface.say(t("You already found that equation. Try a different arrangement.")); return; }
      state.answers.push({ key, text: input.value }); onFact(problem, !state.hinted); onEvidence({ worldId: "targethive", grade, correct: true, independent: !state.hinted });
      if (!state.hinted && state.answers.length === 1) state.first += 1;
      const found = { phase: phaseFor("targethive", state.hinted || state.missed ? "right-after-miss" : "right"), ctx: { expected: `${input.value.trim()} = ${fmt(target)}` } };
      if (state.answers.length === 1) render(t("That works! Find one more different expression."), found);
      else { state.locked = true; found.ctx.next = nextLabel(state.round + 1 === total, t("Next target")); render(t("Two ways found. Nice flexible thinking!"), found); }
    });
    const ops = node("div", "gm-hive-ops");
    for (const symbol of ["+", "−", "×", "÷", "(", ")"]) ops.append(action(symbol, "outline-action", () => { input.value += symbol; input.focus(); }));
    const status = node("p", "gm-note", fb ? "" : message || t("Find two different expressions. There is no timer.")); status.setAttribute("role", "status"); status.setAttribute("aria-live", "polite");
    const foundList = node("ol", "gm-hive-found"); for (const answer of state.answers) foundList.append(node("li", "", answer.text + " = " + fmt(target)));
    const hintButton = action(t("Show a strategy hint"), "outline-action", () => { if (state.locked) return; state.hinted = true; surface.say(t("Try pairing two tiles with addition, then use a different pair with subtraction.")); });
    hintButton.dataset.hint = "";
    screen.append(form, node("p", "gm-hint", t("Use +, −, ×, ÷, and parentheses. You may use any tile once.")), ops, status, foundList, hintButton);
    const surface = resultPanel(status, (id) => {
      if (id === "next") advance();
      else if (id === "hint") hintButton.click();
      else if (id === "try-again") { surface.say(t("Find two different expressions. There is no timer.")); input.focus(); }
    });
    if (fb) surface.show(fb.phase, fb.ctx, message);
    container.replaceChildren(screen);
    (fb?.ctx.next ? screen.querySelector("[data-feedback-action='next']") : input)?.focus();
  };
  draw(); render("");
}

const GHOST_KEY = "ewl-personal-ghost-v1";
export function playPersonalGhost(container, { grade, stop, finish, onEvidence = () => {}, onFact = () => {} }) {
  const activeProfile = profiles().active; const storageKey = profileKey(GHOST_KEY, activeProfile); const records = readLocal(storageKey, {});
  let items = []; let at = 0; let correct = 0; let attempted = 0; let hinted = false; let hadMiss = false; let settled = false; let started = 0; let closed = false;
  const key = grade + ":" + stop; const previous = records[key]?.score || 0;
  const complete = () => { if (closed) return; closed = true; const elapsed = Math.max(1, Math.round((Date.now() - started) / 1000)); const score = personalGhostScore(correct, attempted, elapsed); if (score > previous) { records[key] = { score, accuracy: attempted ? Math.round(correct / attempted * 100) : 0 }; writeLocal(storageKey, records); } finish({ game: "ghostsprint", stars: correct >= Math.ceil(Math.max(1, attempted) * .8) ? 3 : correct ? 2 : 1, missed: [], line: t("{correct} correct of {attempted} tries · accuracy-adjusted pace {score} · your previous best {best}", { correct, attempted, score, best: Math.max(score, previous) }) }); };
  const start = () => { items = Array.from({ length: 10 }, () => gameProblem(grade, stop)); at = 0; correct = 0; attempted = 0; hinted = false; hadMiss = false; settled = false; started = Date.now(); render(""); };
  const init = () => {
    const screen = node("section", "gm-play gm-ghost-sprint"); screen.append(header(t("Personal Ghost Sprint"), t("Choose a calm run"), () => finish({ game: "ghostsprint", stars: 0, missed: [], line: t("You can return to this game anytime.") })), node("p", "gm-ask", t("Your ghost uses only your earlier accuracy-adjusted pace. There is no class leaderboard.")));
    const status = node("p", "gm-note", t("Your pace stays on this device only.")); status.setAttribute("role", "status");
    screen.append(node("p", "gm-note", t("10 cards · untimed")), action(t("Start my run"), "tr-go", start), status); container.replaceChildren(screen);
  };
  const advance = () => { if (!settled || closed) return; at += 1; hinted = false; hadMiss = false; settled = false; render(""); };
  const render = (message, fb = null) => {
    if (closed) return; if (at >= items.length) { complete(); return; }
    const item = items[at]; const screen = node("section", "gm-play gm-ghost-sprint"); screen.append(header(t("Personal Ghost Sprint"), t("Card {a} of {b}", { a: at + 1, b: items.length }), complete), node("p", "gm-ask", t("Move at your own pace. Your ghost is your earlier accuracy-adjusted result, never another learner.")), node("p", "gm-q", item.question));
    const form = node("form", "gm-ghost-form"); const input = node("input", "tr-input"); input.id = "ghost-answer"; input.type = "text"; input.inputMode = "decimal"; input.autocomplete = "off"; const label = node("label", "", t("Your answer")); label.htmlFor = input.id; const row = node("div", "tr-answer"); const submit = node("button", "tr-check", t("Check")); submit.type = "submit"; row.append(input, submit); form.append(label, row);
    const status = node("p", "gm-note", fb ? "" : message || t("Your previous best: {n}", { n: previous })); status.setAttribute("role", "status"); status.setAttribute("aria-live", "polite");
    form.addEventListener("submit", (event) => {
      event.preventDefault(); if (settled) return;
      const raw = input.value.trim().replaceAll("−", "-").replaceAll(",", ""); const answer = item.answers?.some((n) => String(n).replaceAll("−", "-").replaceAll(",", "") === raw) || Number(raw) === Number(item.answers?.[0]);
      if (answer) { attempted += 1; correct += 1; onFact(item, !hinted && !hadMiss); onEvidence({ worldId: "ghostsprint", grade, correct: true, independent: !hinted && !hadMiss }); settled = true; render(t("Correct. Keep going if you like."), { phase: phaseFor("ghostsprint", hinted || hadMiss ? "right-after-miss" : "right"), ctx: { expected: answerText(item), next: nextLabel(at + 1 >= items.length) } }); }
      else { attempted += 1; hadMiss = true; onEvidence({ worldId: "ghostsprint", grade, correct: false, independent: !hinted }); surface.show(phaseFor("ghostsprint", "miss"), { submitted: input.value.trim(), hintAvailable: !hinted }, t("Not yet. Try another strategy or use a hint.")); }
    });
    const hintButton = action(t("Show a gentle hint"), "outline-action", () => { if (settled) return; hinted = true; surface.say(t(item.hint || "Try a model or break the numbers into friendly parts.")); }); hintButton.dataset.hint = "";
    screen.append(form, hintButton, action(t("Skip this card"), "outline-action", () => { if (settled) return; attempted += 1; hadMiss = true; onEvidence({ worldId: "ghostsprint", grade, correct: false, independent: !hinted }); at += 1; hinted = false; render(t("Card skipped. You can try the next one.")); }), status);
    const surface = resultPanel(status, (id) => {
      if (id === "next") advance();
      else if (id === "hint") hintButton.click();
      else if (id === "try-again") { surface.say(t("Your previous best: {n}", { n: previous })); input.focus(); }
    });
    if (fb) surface.show(fb.phase, fb.ctx, message);
    container.replaceChildren(screen);
    (fb?.ctx.next ? screen.querySelector("[data-feedback-action='next']") : input)?.focus();
  };
  init(); return () => { closed = true; };
}

export function playFactorFractionPath(container, { grade, stop, finish, onEvidence = () => {}, onFact = () => {} }) {
  const total = 5; const items = Array.from({ length: total }, () => gameProblem(grade, stop)); let at = 0; let first = 0; let hinted = false; let missed = false; let settled = false;
  const advance = () => { if (!settled) return; at += 1; hinted = false; missed = false; settled = false; render(""); };
  const render = (message, fb = null) => {
    if (at >= total) { finish({ game: "factorfractionpath", stars: first === total ? 3 : first >= 3 ? 2 : 1, missed: [], line: t("You built {n} bridges at your own pace.", { n: total }) }); return; }
    const item = items[at]; const built = at + (settled ? 1 : 0); const screen = node("section", "gm-play gm-path-builder"); screen.append(header(t("Factor & Fraction Path Builder"), t("Bridge {a} of {b}", { a: at + 1, b: total }), () => finish({ game: "factorfractionpath", stars: 0, missed: [], line: t("You can return to this path anytime.") })));
    const map = node("div", "gm-path-map"); map.setAttribute("role", "img"); map.setAttribute("aria-label", t("A calm path with {n} bridges; {done} are built", { n: total, done: built }));
    for (let i = 0; i < total; i += 1) { if (i) map.append(node("span", "gm-path-arrow", "→")); map.append(node("span", "gm-path-step " + (i < built ? "built" : i === built ? "current" : ""), i < built ? "✓" : i + 1)); }
    screen.append(map, node("p", "gm-ask", t("Solve to place the next bridge. There is no timer and you can ask for a hint at any time.")), node("p", "gm-q", item.question));
    const form = node("form", "gm-path-form"); const input = node("input", "tr-input"); input.id = "path-answer"; input.type = "text"; input.inputMode = "decimal"; const label = node("label", "", t("Your answer")); label.htmlFor = input.id; const row = node("div", "tr-answer"); const submit = node("button", "tr-check", t("Build bridge")); submit.type = "submit"; row.append(input, submit); form.append(label, row);
    const status = node("p", "gm-note", fb ? "" : message || t("Each correct answer moves you forward. Take your time.")); status.setAttribute("role", "status"); status.setAttribute("aria-live", "polite");
    form.addEventListener("submit", (event) => {
      event.preventDefault(); if (settled) return;
      const raw = input.value.trim().replaceAll("−", "-").replaceAll(",", ""); const right = item.answers?.some((n) => String(n).replaceAll("−", "-").replaceAll(",", "") === raw) || Number(raw) === Number(item.answers?.[0]);
      onEvidence({ worldId: "factorfractionpath", grade, correct: right, independent: !hinted });
      if (!right) { missed = true; surface.show(phaseFor("factorfractionpath", "miss"), { submitted: input.value.trim(), hintAvailable: !hinted }, t("Not yet. The bridge stays here while you revise your thinking.")); return; }
      if (!hinted) first += 1; onFact(item, !hinted); settled = true;
      render(t("Bridge built. Ready for the next one?"), { phase: phaseFor("factorfractionpath", hinted || missed ? "right-after-miss" : "right"), ctx: { expected: answerText(item), next: nextLabel(at + 1 >= total) } });
    });
    const hintButton = action(t("Show a hint"), "outline-action", () => { if (settled) return; hinted = true; surface.say(t(item.hint || "Look for a pattern or build a model.")); }); hintButton.dataset.hint = "";
    screen.append(form, hintButton, status);
    const surface = resultPanel(status, (id) => {
      if (id === "next") advance();
      else if (id === "hint") hintButton.click();
      else if (id === "try-again") { surface.say(t("Each correct answer moves you forward. Take your time.")); input.focus(); }
    });
    if (fb) surface.show(fb.phase, fb.ctx, message);
    container.replaceChildren(screen);
    (fb?.ctx.next ? screen.querySelector("[data-feedback-action='next']") : input)?.focus();
  };
  render("");
}
