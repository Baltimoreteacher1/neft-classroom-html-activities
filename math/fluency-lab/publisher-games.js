// Three longer-form, math-first games for the Fluency Lab. All checks are untimed,
// keyboard operable, and send first-try/support evidence through the shared game seam.
import { t } from "./i18n.js";

const esc = (s) => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const shell = (name, round, total, prompt, board, hint) => `<header class="sig-head"><button type="button" class="tr-link" data-gm-menu>← ${t("Back to games")}</button><p class="sig-overline">${t(name)} · ${t("No timer")}</p><h2>${prompt}</h2><p class="sig-round">${t("Challenge {round} of {total}", { round, total })}</p></header><section class="sig-board" aria-label="${t("Game board")}">${board}</section><p class="sig-feedback" data-feedback role="status" aria-live="polite"></p><div class="sig-actions"><button type="button" class="outline-action" data-hint>${t("Show a hint")}</button><button type="button" class="primary-action" data-check>${t("Check my model")}</button></div><p class="sig-hint" data-hint-copy hidden>${hint}</p>`;
const rand = (seed, n) => ((seed * 1103515245 + 12345) >>> 0) % n;
const recordResult = (id, first, misses, total) => ({ game: id, stars: first === total ? 3 : first >= Math.ceil(total * 0.6) ? 2 : 1, missed: [], line: t("{first} of {total} challenges solved independently on the first try; {revisions} revisions made", { first, total, revisions: misses }) });

export function worldBuilderTask(grade, round) {
  const g = Math.max(0, Math.min(8, Number(grade) || 0));
  const target = g <= 2 ? [6, 8, 9, 10, 12, 14, 15, 16, 18][(round * 3 + g) % 9] : 12 + ((round * 7 + g) % 8) * 3;
  const budget = g <= 2 ? null : target + Math.max(12, Math.floor(target / 2));
  return { target, budget, maxSide: g <= 2 ? 10 : 12, worldId: g <= 2 ? "tenframefactory" : "arrayarchitect" };
}

export function buildHasValidArea(rows, columns, task) {
  if (!Number.isInteger(rows) || !Number.isInteger(columns) || rows < 1 || columns < 1) return false;
  const area = rows * columns;
  const fence = 2 * (rows + columns);
  return area === task.target && (task.budget == null || fence <= task.budget);
}

export function numberPuzzleBoard(grade, round) {
  const g = Math.max(0, Math.min(8, Number(grade) || 0));
  const op = g <= 2 ? "+" : "×";
  const target = op === "+" ? 7 + (round % 4) : [12, 18, 24][round % 3];
  const values = op === "+"
    ? [1, 2, 3, 4, 5, 6, 8]
    : target === 12 ? [1, 2, 3, 4, 6, 12] : target === 18 ? [1, 2, 3, 6, 9, 18] : [2, 3, 4, 6, 8, 12];
  return { op, target, values, pairs: values.flatMap((x, i) => values.slice(i + 1).map((y) => [x, y])).filter(([x, y]) => (op === "+" ? x + y : x * y) === target) };
}

export function rallyTask(grade, round) {
  const g = Math.max(0, Math.min(8, Number(grade) || 0));
  const n = 2 + ((round + g) % 7);
  const factor = g <= 2 ? 1 : 2 + (round % 5);
  const add = 2 + ((round * 3 + g) % 9);
  const expression = `${factor} × ${n} + ${add}`;
  const answer = factor * n + add;
  const routes = [expression, `${factor} × (${n} + ${add})`, `${factor} × ${n} − ${add}`];
  // Put the correct mathematical route in a reproducible position on every challenge.
  const correctIndex = rand(g * 101 + round * 37 + 11, routes.length);
  const choices = [...routes];
  [choices[0], choices[correctIndex]] = [choices[correctIndex], choices[0]];
  return { n, factor, add, expression, answer, choices, correctIndex, worldId: g <= 2 ? "tenframefactory" : g <= 5 ? "arrayarchitect" : "equationfactory" };
}

function mount(container, name, gameId, grade, onEvidence, finish, makeRound, renderBoard, checkRound, bindBoard = () => {}) {
  const total = 5;
  const state = { round: 0, first: 0, misses: 0, hinted: false, failed: false, locked: false, selected: null, roundSolved: false, foundPairs: [] };
  let task = makeRound(state.round);
  state.rows = task.rows ?? 2;
  state.columns = task.columns ?? 2;
  state.selected = task.selected ?? null;
  const render = () => {
    container.innerHTML = shell(name, state.round + 1, total, task.prompt, renderBoard(task, state), task.hint);
    bindBoard(task, state, container);
    container.querySelector("[data-hint]")?.addEventListener("click", () => { state.hinted = true; container.querySelector("[data-hint-copy]").hidden = false; });
    container.querySelector("[data-check]")?.addEventListener("click", () => {
      if (state.locked) return;
      const result = checkRound(task, state, container);
      const feedback = container.querySelector("[data-feedback]");
      feedback.dataset.state = result.ok ? "right" : "retry";
      feedback.textContent = result.message;
      state.failed ||= !result.ok;
      if (!result.ok) { onEvidence({ worldId: task.worldId, grade, correct: false, independent: !state.hinted }); state.misses += 1; return; }
      if (!state.roundSolved) {
        if (!state.failed && !state.hinted) state.first += 1;
        onEvidence({ worldId: task.worldId, grade, correct: true, independent: !state.hinted && !state.failed });
        state.roundSolved = true;
      }
      state.locked = true;
      if (result.exploreMore) {
        const explore = document.createElement("button");
        explore.type = "button"; explore.className = "outline-action"; explore.textContent = t("Find another valid pair");
        explore.addEventListener("click", () => { state.locked = false; state.selected = []; render(); container.querySelector("[data-choice]")?.focus(); });
        container.querySelector(".sig-actions").append(explore);
      }
      const next = document.createElement("button");
      next.type = "button"; next.className = "primary-action"; next.textContent = state.round + 1 === total ? t("Finish game") : t("Next challenge");
      next.addEventListener("click", () => {
        state.round += 1;
        if (state.round >= total) { finish(recordResult(gameId, state.first, state.misses, total)); return; }
        state.hinted = false; state.failed = false; state.locked = false; state.roundSolved = false; state.foundPairs = []; task = makeRound(state.round); state.rows = task.rows ?? 2; state.columns = task.columns ?? 2; state.selected = task.selected ?? null; render(); container.querySelector("[data-choice], input")?.focus();
      });
      container.querySelector(".sig-actions").append(next);
    });
  };
  render();
  return () => { container.replaceChildren(); };
}

export function playMathWorldBuilder(container, { grade, finish, onEvidence = () => {} }) {
  return mount(container, "Math World Builder", "mathworldbuilder", grade, onEvidence, finish, (round) => {
    const spec = worldBuilderTask(grade, round);
    return { ...spec, rows: 2, columns: 2, prompt: t("Build a structure with {area} floor tiles{budget}.", { area: spec.target, budget: spec.budget == null ? "" : t(" and no more than {budget} fence units", { budget: spec.budget }) }), hint: t("The floor area is rows × columns. Each side of the fence uses one unit; compare more than one factor pair.") };
  }, (task, state) => `<p class="sig-instruction">${t("Set the building dimensions. The grid and resource count update as you build.")}</p><div class="sig-array-wrap"><div class="sig-array" data-builder-grid role="img" aria-label="${t("Building grid with {rows} rows and {columns} columns", { rows: state.rows, columns: state.columns })}" style="--array-columns:${state.columns}">${Array.from({ length: state.rows * state.columns }, () => "<span></span>").join("")}</div><p class="sig-equation">${t("Rows")}: <strong data-row-count>${state.rows}</strong> · ${t("Columns")}: <strong data-column-count>${state.columns}</strong> · ${t("Floor area")}: <strong data-area>${state.rows * state.columns}</strong> · ${t("Fence units")}: <strong data-fence>${2 * (state.rows + state.columns)}</strong></p></div><div class="sig-controls"><label>${t("Rows")} <output data-rows-value>${state.rows}</output><input type="range" min="1" max="${task.maxSide}" value="${state.rows}" data-rows aria-label="${t("Choose rows")}" /></label><label>${t("Columns")} <output data-columns-value>${state.columns}</output><input type="range" min="1" max="${task.maxSide}" value="${state.columns}" data-columns aria-label="${t("Choose columns")}" /></label></div>`, (task, state, host) => {
    state.rows = Number(host.querySelector("[data-rows]").value); state.columns = Number(host.querySelector("[data-columns]").value);
    const area = state.rows * state.columns; const fence = 2 * (state.rows + state.columns);
    const result = buildHasValidArea(state.rows, state.columns, task);
    return { ok: result, message: result ? t("Built {rows} rows of {columns}: {area} floor tiles with {fence} fence units.", { rows: state.rows, columns: state.columns, area, fence }) : t("That plan uses {area} floor tiles and {fence} fence units. Adjust the dimensions to meet both project requirements.", { area, fence }) };
  }, (task, state, host) => {
    const update = () => {
      state.rows = Number(host.querySelector("[data-rows]").value);
      state.columns = Number(host.querySelector("[data-columns]").value);
      const grid = host.querySelector("[data-builder-grid]");
      grid.style.setProperty("--array-columns", state.columns);
      grid.setAttribute("aria-label", t("Building grid with {rows} rows and {columns} columns", { rows: state.rows, columns: state.columns }));
      grid.innerHTML = Array.from({ length: state.rows * state.columns }, () => "<span></span>").join("");
      host.querySelector("[data-area]").textContent = String(state.rows * state.columns);
      host.querySelector("[data-fence]").textContent = String(2 * (state.rows + state.columns));
      host.querySelector("[data-row-count]").textContent = String(state.rows);
      host.querySelector("[data-column-count]").textContent = String(state.columns);
      host.querySelector("[data-rows-value]").textContent = String(state.rows);
      host.querySelector("[data-columns-value]").textContent = String(state.columns);
    };
    host.querySelectorAll("[data-rows], [data-columns]").forEach((input) => input.addEventListener("input", update));
  });
}

export function playNumberPuzzleStudio(container, { grade, finish, onEvidence = () => {} }) {
  return mount(container, "Number Puzzle Studio", "numberpuzzlestudio", grade, onEvidence, finish, (round) => {
    const board = numberPuzzleBoard(grade, round);
    return { ...board, selected: [], worldId: grade <= 2 ? "tenframefactory" : grade <= 5 ? "arrayarchitect" : "equationfactory", prompt: t("Choose two number tiles and use {op} to make {target}.", { op: board.op, target: board.target }), hint: t("Look for a pair that composes the target. You may find more than one valid pair.") };
  }, (task, state) => `<p class="sig-instruction">${t("Select two different tiles. Use the same operation for both.")}</p><div class="gm-cards cols-4" role="group" aria-label="${t("Number tiles")}">${task.values.map((value, i) => `<button type="button" class="gm-card${state.selected?.includes(i) ? " pick" : ""}" data-choice="${i}" aria-pressed="${state.selected?.includes(i) || false}">${value}</button>`).join("")}</div><p class="sig-equation" aria-live="polite" data-puzzle-equation>${state.selected?.length === 2 ? `${task.values[state.selected[0]]} ${task.op} ${task.values[state.selected[1]]} = ?` : t("Choose two tiles")}</p>`, (task, state, host) => {
    const chosen = [...host.querySelectorAll("[data-choice][aria-pressed=true]")].map((button) => Number(button.dataset.choice));
    state.selected = chosen;
    if (chosen.length !== 2) return { ok: false, message: t("Choose exactly two tiles before checking the puzzle.") };
    const [a, b] = chosen.map((i) => task.values[i]); const value = task.op === "+" ? a + b : a * b;
    const key = chosen.slice().sort((x, y) => x - y).join(":");
    if (value !== task.target) return { ok: false, message: t("That pair makes {value}. Keep one tile and try a different partner.", { value }) };
    if (state.foundPairs.includes(key)) return { ok: false, message: t("You already found that pair. Try a different pair or move to the next challenge.") };
    state.foundPairs.push(key);
    const exploreMore = state.foundPairs.length < task.pairs.length;
    return { ok: true, exploreMore, message: exploreMore ? t("{a} {op} {b} makes {target}. You found {found} of {total} valid pairs. Find another or continue.", { a, op: task.op, b, target: task.target, found: state.foundPairs.length, total: task.pairs.length }) : t("{a} {op} {b} makes {target}. You found every valid pair.", { a, op: task.op, b, target: task.target }) };
  }, (task, state, host) => {
    host.querySelectorAll("[data-choice]").forEach((button) => button.addEventListener("click", () => {
      const i = Number(button.dataset.choice); const chosen = state.selected || [];
      state.selected = chosen.includes(i) ? chosen.filter((n) => n !== i) : chosen.length < 2 ? [...chosen, i] : [chosen[1], i];
      host.querySelectorAll("[data-choice]").forEach((tile) => {
        const selected = state.selected.includes(Number(tile.dataset.choice));
        tile.setAttribute("aria-pressed", String(selected));
        tile.classList.toggle("pick", selected);
      });
      const pair = state.selected.length === 2 ? `${task.values[state.selected[0]]} ${task.op} ${task.values[state.selected[1]]} = ?` : t("Choose two tiles");
      host.querySelector("[data-puzzle-equation]").textContent = pair;
    }));
  });
}

export function playFluencyRally(container, { grade, finish, onEvidence = () => {} }) {
  return mount(container, "Fluency Rally", "fluencyrally", grade, onEvidence, finish, (round) => {
    const item = rallyTask(grade, round);
    return { ...item, worldId: item.worldId, prompt: t("A route checkpoint follows {rule}. Set n = {n}. Find the route distance.", { rule: item.expression, n: item.n }), hint: t("Multiply first, then add. Read each route as an expression, not as a speed challenge.") };
  }, (task, state) => `<p class="sig-instruction">${t("Choose a route, calculate its distance, then enter the checkpoint value. Take the time you need.")}</p><div class="gm-cards cols-3" role="group" aria-label="${t("Choose a route")}">${task.choices.map((route, i) => `<button type="button" class="gm-card${state.selected === i ? " pick" : ""}" data-choice="${i}" aria-pressed="${state.selected === i}"><span>${t("Route {n}", { n: i + 1 })}</span><strong>${esc(route)}</strong></button>`).join("")}</div><label class="sig-instruction">${t("Checkpoint distance")} <input type="number" inputmode="numeric" data-distance aria-label="${t("Enter the route distance")}" /></label>`, (task, state, host) => {
    const selected = Number(host.querySelector('[data-choice][aria-pressed="true"]')?.dataset.choice);
    const value = Number(host.querySelector("[data-distance]").value);
    const correct = selected === task.correctIndex && Number.isFinite(value) && value === task.answer;
    return { ok: correct, message: correct ? t("Route {n} reaches checkpoint {distance}. The route choice and calculation agree.", { n: selected + 1, distance: task.answer }) : t("Check the order: multiply {factor} by {n}, then add {add}. Choose the matching route and enter its distance.", { factor: task.factor, n: task.n, add: task.add }) };
  }, (task, state, host) => host.querySelectorAll("[data-choice]").forEach((button) => button.addEventListener("click", () => {
    state.selected = Number(button.dataset.choice);
    host.querySelectorAll("[data-choice]").forEach((route) => route.setAttribute("aria-pressed", String(route === button)));
    host.querySelector("[data-distance]")?.focus();
  })));
}
