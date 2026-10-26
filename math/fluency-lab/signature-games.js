// Three untimed, model-first games that make the mathematical decision visible.
import { t } from "./i18n.js";
const escape = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const randomInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const shell = (name, prompt, round, total, board, hint) => `
  <header class="sig-head"><button type="button" class="tr-link" data-gm-menu>← ${t("Back to games")}</button><p class="sig-overline">${escape(t(name))} · ${t("No timer")}</p><h2>${escape(prompt)}</h2><p class="sig-round">${t("Challenge {round} of {total}", { round, total })}</p></header>
  <section class="sig-board" aria-label="${t("Game board")}">${board}</section>
  <p class="sig-feedback" data-feedback role="status" aria-live="polite"></p>
  <div class="sig-actions"><button type="button" class="outline-action" data-hint>${t("Show a hint")}</button><button type="button" class="primary-action" data-check>${t("Check my model")}</button></div>
  <p class="sig-hint" data-hint-copy hidden>${escape(hint)}</p>
  <p class="sig-language"><strong>${t("Math talk:")}</strong> ${t("I chose ___ because ___.")}</p>`;

function begin(container, id, onFinish, onEvidence, grade, worldId) {
  const state = { round: 0, firstTry: 0, misses: 0, total: 5, locked: false, roundMissed: false, roundHinted: false };
  const done = () => onFinish({
    game: id,
    stars: state.firstTry === state.total ? 3 : state.firstTry >= 3 ? 2 : 1,
    missed: [],
    line: t("{first} of {total} challenges solved independently on the first try; {revisions} revisions made", { first: state.firstTry, total: state.total, revisions: state.misses }),
  });
  const feedback = (right, message) => {
    const panel = container.querySelector("[data-feedback]");
    panel.dataset.state = right ? "right" : "retry";
    panel.textContent = message;
  };
  const record = (correct, independent = true) => onEvidence({ worldId, grade, correct, independent });
  return { state, done, feedback, record };
}

export function playNumberQuest(container, { grade, finish, onEvidence = () => {} }) {
  const game = begin(container, "numberquest", finish, onEvidence, grade, "numbergarden");
  let challenge;
  const minimum = grade >= 6 ? -50 : 0;
  const maximum = grade >= 6 ? 50 : grade === 0 ? 10 : grade === 1 ? 20 : 100;
  let position = (minimum + maximum) / 2;
  let benchmark = null;
  let timer;
  const make = () => {
    game.state.locked = false;
    game.state.roundMissed = false;
    game.state.roundHinted = false;
    const target = grade >= 6 ? randomInt(-4, 3) * 10 + randomInt(1, 9) : grade === 0 ? randomInt(0, 10) : grade === 1 ? randomInt(1, 19) : randomInt(1, 9) * 10 + randomInt(1, 9);
    challenge = { target, ones: target - Math.floor(target / 10) * 10 };
    position = (minimum + maximum) / 2;
    benchmark = null;
  };
  const update = () => {
    const marker = container.querySelector("[data-number-marker]");
    const readout = container.querySelector("[data-number-readout]");
    if (marker) marker.style.left = `${((position - minimum) / (maximum - minimum)) * 100}%`;
    if (readout) readout.textContent = String(Math.round(position));
  };
  const render = () => {
    const lower = Math.floor(challenge.target / 10) * 10;
    const upper = lower + 10;
    const garden = grade === 0;
    container.innerHTML = shell("Number Garden", garden ? t("Plant {target} seeds by placing your marker on the number line.", { target: challenge.target }) : t("Place {target} on the number line. Which ten is closer?", { target: challenge.target }), game.state.round + 1, game.state.total, `
      <p class="sig-instruction">${t("Move the marker, then choose the closer benchmark.")}</p>
      <div class="sig-numberline" data-target-number="${challenge.target}" role="group" aria-label="${t("Number line from {min} to {max}", { min: minimum, max: maximum })}">
        <div class="sig-line" aria-hidden="true"><span class="sig-tick" style="left:0%">${minimum}</span><span class="sig-tick" style="left:25%">${minimum + (maximum - minimum) / 4}</span><span class="sig-tick" style="left:50%">${minimum + (maximum - minimum) / 2}</span><span class="sig-tick" style="left:75%">${minimum + (3 * (maximum - minimum)) / 4}</span><span class="sig-tick" style="left:100%">${maximum}</span><span class="sig-marker" data-number-marker style="left:${((position - minimum) / (maximum - minimum)) * 100}%"></span></div>
        <label class="sig-range-label" for="sig-number-range">${t("Your point:")} <output data-number-readout>${position}</output></label>
        <input id="sig-number-range" type="range" min="${minimum}" max="${maximum}" step="1" value="${position}" data-number-position aria-label="${t("Move your point from {min} to {max}", { min: minimum, max: maximum })}" />
      </div>
      ${garden ? `<p class="sig-instruction">${t("Use the slider with your keyboard or touch. Place it exactly on the target number.")}</p>` : `<div class="sig-benchmarks" role="group" aria-label="${t("Choose the closer ten")}"><button type="button" data-benchmark="${lower}" aria-pressed="false">${lower}</button><span>${t("or")}</span><button type="button" data-benchmark="${upper}" aria-pressed="false">${upper}</button></div>`}`, t(garden ? "Count the steps from 0 and line up the marker with the target." : "Find the two tens around {target}. Compare how far the target is from each one.", { target: challenge.target }));
  };
  const next = () => { game.state.round += 1; if (game.state.round >= game.state.total) return game.done(); make(); render(); container.querySelector("[data-number-position]")?.focus(); };
  make(); render();
  container.oninput = (event) => { if (event.target.matches("[data-number-position]")) { position = Number(event.target.value); update(); } };
  container.onclick = (event) => {
    const choice = event.target.closest("[data-benchmark]");
    if (choice) { benchmark = Number(choice.dataset.benchmark); container.querySelectorAll("[data-benchmark]").forEach((button) => button.setAttribute("aria-pressed", String(button === choice))); return; }
    if (event.target.closest("[data-hint]")) { const panel = container.querySelector("[data-hint-copy]"); panel.hidden = !panel.hidden; game.state.roundHinted = true; return; }
    if (!event.target.closest("[data-check]")) return;
    if (!Number.isInteger(benchmark) && grade !== 0) { game.feedback(false, t("Choose which ten is closer, then check your model.")); return; }
    const nearest = challenge.ones < 5 ? challenge.target - challenge.ones : challenge.target + (10 - challenge.ones);
    const placed = Math.abs(position - challenge.target) <= 1;
    if (game.state.locked) return;
    if (placed && (grade === 0 || benchmark === nearest)) { game.state.firstTry += game.state.roundMissed || game.state.roundHinted ? 0 : 1; game.state.locked = true; game.record(true, !game.state.roundMissed && !game.state.roundHinted); game.feedback(true, grade === 0 ? t("You planted {target} seeds. Your marker matches the quantity.", { target: challenge.target }) : t("You placed {target} near {near}. It is {distance} away from {near}, so that is the closer ten.", { target: challenge.target, near: nearest, distance: Math.abs(challenge.target - nearest) })); timer = window.setTimeout(next, 700); }
    else { game.state.misses += 1; game.state.roundMissed = true; game.record(false, !game.state.roundHinted); game.feedback(false, !placed ? t(grade === 0 ? "Your marker is at {point}. Move it to {target} to plant the seeds." : "Your marker is at {point}. Move it closer to {target}, then compare the distances.", { point: Math.round(position), target: challenge.target }) : t("The point is close. Compare {target} to {lower} and {upper}.", { target: challenge.target, lower: Math.floor(challenge.target / 10) * 10, upper: Math.floor(challenge.target / 10) * 10 + 10 })); }
  };
  return () => { window.clearTimeout(timer); container.oninput = null; container.onclick = null; };
}

export function playArrayArchitect(container, { grade, finish, onEvidence = () => {} }) {
  const game = begin(container, "arrayarchitect", finish, onEvidence, grade, "arrayarchitect");
  let target, rows, columns;
  let timer;
  const make = () => { game.state.locked = false; game.state.roundMissed = false; game.state.roundHinted = false; rows = randomInt(grade >= 5 ? 4 : 2, grade >= 5 ? 10 : 7); columns = randomInt(grade >= 5 ? 5 : 2, 10); target = rows * columns; rows = 2; columns = 2; };
  const render = () => {
    const cells = Array.from({ length: rows * columns }, (_, i) => `<span class="${Math.floor(i / columns) < Math.ceil(rows / 2) ? "sig-array-a" : "sig-array-b"}" aria-hidden="true"></span>`).join("");
    container.innerHTML = shell("Array Architect", t("Build an array with {target} tiles.", { target }), game.state.round + 1, game.state.total, `
      <p class="sig-instruction">${t("Change the number of rows and tiles in each row. Any equal-groups array with {target} tiles works.", { target })}</p>
      <div class="sig-array-wrap" data-array-target="${target}"><div class="sig-array" style="--array-columns:${columns}" role="img" aria-label="${t("{rows} rows of {columns} tiles", { rows, columns })}">${cells}</div><p class="sig-equation"><strong data-rows-readout>${rows}</strong> ${t("rows")} × <strong data-columns-readout>${columns}</strong> ${t("in each row")} = <strong data-product-readout>${rows * columns}</strong> ${t("tiles")}</p></div>
      <div class="sig-controls"><label for="sig-array-rows">${t("Rows")} <output data-rows-label>${rows}</output><input id="sig-array-rows" type="range" min="2" max="10" step="1" value="${rows}" data-array-rows aria-label="${t("Choose the number of rows")}" /></label><label for="sig-array-columns">${t("Tiles in each row")} <output data-columns-label>${columns}</output><input id="sig-array-columns" type="range" min="2" max="10" step="1" value="${columns}" data-array-columns aria-label="${t("Choose tiles in each row")}" /></label></div>`, t("Try factor pairs of {target}. Split the array into two parts to see how the equal groups combine.", { target }));
  };
  const next = () => { game.state.round += 1; if (game.state.round >= game.state.total) return game.done(); make(); render(); container.querySelector("[data-array-rows]")?.focus(); };
  const update = () => {
    rows = Number(container.querySelector("[data-array-rows]").value);
    columns = Number(container.querySelector("[data-array-columns]").value);
    const board = container.querySelector(".sig-array");
    board.style.setProperty("--array-columns", columns);
    board.setAttribute("aria-label", t("{rows} rows of {columns} tiles", { rows, columns }));
    board.innerHTML = Array.from({ length: rows * columns }, (_, i) => `<span class="${Math.floor(i / columns) < Math.ceil(rows / 2) ? "sig-array-a" : "sig-array-b"}" aria-hidden="true"></span>`).join("");
    container.querySelector("[data-rows-readout]").textContent = String(rows);
    container.querySelector("[data-columns-readout]").textContent = String(columns);
    container.querySelector("[data-product-readout]").textContent = String(rows * columns);
    container.querySelector("[data-rows-label]").textContent = String(rows);
    container.querySelector("[data-columns-label]").textContent = String(columns);
  };
  make(); render();
  container.oninput = (event) => { if (event.target.matches("[data-array-rows], [data-array-columns]")) update(); };
  container.onclick = (event) => {
    if (event.target.closest("[data-hint]")) { const panel = container.querySelector("[data-hint-copy]"); panel.hidden = !panel.hidden; game.state.roundHinted = true; return; }
    if (!event.target.closest("[data-check]")) return;
    if (game.state.locked) return;
    if (rows * columns === target) { game.state.firstTry += game.state.roundMissed || game.state.roundHinted ? 0 : 1; game.state.locked = true; game.record(true, !game.state.roundMissed && !game.state.roundHinted); game.feedback(true, t("{rows} rows of {columns} make {target} tiles. You built an equal-groups array.", { rows, columns, target })); timer = window.setTimeout(next, 700); }
    else { game.state.misses += 1; game.state.roundMissed = true; game.record(false, !game.state.roundHinted); game.feedback(false, t("This array has {total} tiles. Adjust a factor so the total is {target}.", { total: rows * columns, target })); }
  };
  return () => { window.clearTimeout(timer); container.oninput = null; container.onclick = null; };
}

export function playFractionForge(container, { grade, finish, onEvidence = () => {} }) {
  const game = begin(container, "fractionforge", finish, onEvidence, grade, "fractionbridge");
  let target, numerator, denominator;
  let timer;
  const make = () => { game.state.locked = false; game.state.roundMissed = false; game.state.roundHinted = false; denominator = randomInt(grade >= 6 ? 4 : 2, grade >= 6 ? 10 : 6); numerator = randomInt(1, denominator - 1); target = { numerator, denominator }; denominator = denominator + 1; numerator = target.numerator; };
  const bars = (n, d, klass) => `<div class="sig-fraction-bar ${klass}" style="--fraction-parts:${d}" role="img" aria-label="${t("{n} of {d} equal parts shaded", { n, d })}">${Array.from({ length: d }, (_, i) => `<span class="${i < n ? "is-shaded" : ""}" aria-hidden="true"></span>`).join("")}</div>`;
  const render = () => {
    container.innerHTML = shell("Fraction Forge", t("Forge an equivalent fraction for {fraction}.", { fraction: `${target.numerator}/${target.denominator}` }), game.state.round + 1, game.state.total, `
      <p class="sig-instruction">${t("Adjust the equal parts and shaded parts until both bars show the same amount.")}</p>
      <div class="sig-fraction-model" data-fraction-model data-fraction-target="${target.numerator}/${target.denominator}"><div class="sig-fraction-row"><span class="sig-fraction-label">${t("Target")}</span>${bars(target.numerator, target.denominator, "sig-target-bar")}<strong>${target.numerator}/${target.denominator}</strong></div><div class="sig-fraction-row"><span class="sig-fraction-label">${t("Your model")}</span>${bars(numerator, denominator, "sig-answer-bar")}<strong><span data-fraction-numerator>${numerator}</span>/<span data-fraction-denominator>${denominator}</span></strong></div></div>
      <div class="sig-controls"><label for="sig-fraction-denominator">${t("Equal parts")} <output data-denominator-readout>${denominator}</output><input id="sig-fraction-denominator" type="range" min="2" max="20" step="1" value="${denominator}" data-fraction-denominator-input aria-label="${t("Choose the total number of equal parts")}" /></label><label for="sig-fraction-numerator">${t("Shaded parts")} <output data-numerator-readout>${numerator}</output><input id="sig-fraction-numerator" type="range" min="1" max="${denominator - 1}" step="1" value="${numerator}" data-fraction-numerator-input aria-label="${t("Choose the number of shaded parts")}" /></label></div>`, t("Equivalent fractions name the same amount. Try a denominator that is a multiple of {d}, then scale the numerator by the same factor.", { d: target.denominator }));
  };
  const next = () => { game.state.round += 1; if (game.state.round >= game.state.total) return game.done(); make(); render(); container.querySelector("[data-fraction-numerator-input]")?.focus(); };
  const update = () => {
    denominator = Number(container.querySelector("[data-fraction-denominator-input]").value);
    const numeratorControl = container.querySelector("[data-fraction-numerator-input]");
    numeratorControl.max = String(denominator - 1);
    numerator = Math.min(denominator - 1, Math.max(1, Number(numeratorControl.value)));
    numeratorControl.value = String(numerator);
    const model = container.querySelector("[data-fraction-model]");
    model.innerHTML = `<div class="sig-fraction-row"><span class="sig-fraction-label">${t("Target")}</span>${bars(target.numerator, target.denominator, "sig-target-bar")}<strong>${target.numerator}/${target.denominator}</strong></div><div class="sig-fraction-row"><span class="sig-fraction-label">${t("Your model")}</span>${bars(numerator, denominator, "sig-answer-bar")}<strong><span data-fraction-numerator>${numerator}</span>/<span data-fraction-denominator>${denominator}</span></strong></div>`;
    container.querySelector("[data-denominator-readout]").textContent = String(denominator);
    container.querySelector("[data-numerator-readout]").textContent = String(numerator);
  };
  make(); render();
  container.oninput = (event) => { if (event.target.matches("[data-fraction-denominator-input], [data-fraction-numerator-input]")) update(); };
  container.onclick = (event) => {
    if (event.target.closest("[data-hint]")) { const panel = container.querySelector("[data-hint-copy]"); panel.hidden = !panel.hidden; game.state.roundHinted = true; return; }
    if (!event.target.closest("[data-check]")) return;
    if (game.state.locked) return;
    if (numerator * target.denominator === target.numerator * denominator) { game.state.firstTry += game.state.roundMissed || game.state.roundHinted ? 0 : 1; game.state.locked = true; game.record(true, !game.state.roundMissed && !game.state.roundHinted); game.feedback(true, t("{fraction} and {target} cover the same amount. You scaled both parts equally.", { fraction: `${numerator}/${denominator}`, target: `${target.numerator}/${target.denominator}` })); timer = window.setTimeout(next, 700); }
    else { game.state.misses += 1; game.state.roundMissed = true; game.record(false, !game.state.roundHinted); game.feedback(false, t("{fraction} covers a different amount. Keep the whole divided into equal parts and try again.", { fraction: `${numerator}/${denominator}` })); }
  };
  return () => { window.clearTimeout(timer); container.oninput = null; container.onclick = null; };
}

export const SIGNATURE_GAME_ICONS = {
  numberquest: '<svg viewBox="0 0 120 90" aria-hidden="true"><path d="M12 61h96" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M22 53v16m19-16v9m19-9v16m19-16v9m19-16v16" stroke="currentColor" stroke-width="3"/><path d="M75 18c-13 0-23 9-23 21s10 21 23 21 23-9 23-21-10-21-23-21Z" fill="currentColor" opacity=".16"/><circle cx="75" cy="39" r="8" fill="currentColor"/><path d="m75 52-8 13m8-13 8 13" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>',
  arrayarchitect: '<svg viewBox="0 0 120 90" aria-hidden="true"><rect x="21" y="14" width="78" height="62" rx="6" fill="none" stroke="currentColor" stroke-width="3"/><path d="M41 14v62M60 14v62M80 14v62M21 35h78M21 55h78" stroke="currentColor" stroke-width="2" opacity=".58"/><path d="M21 14h40v41H21z" fill="currentColor" opacity=".25"/><path d="M27 8v-5m0 0-5 5m5-5 5 5m58 62v5m0 0-5-5m5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  fractionforge: '<svg viewBox="0 0 120 90" aria-hidden="true"><path d="M18 20h84v22H18zM18 52h84v22H18z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M18 20h56v22H18zM18 52h56v22H18z" fill="currentColor" opacity=".34"/><path d="M39 20v22m21-22v22m-31 10v22m20-22v22m20-22v22m20-22v22" stroke="currentColor" stroke-width="2"/><path d="m91 12 2 5 5 1-4 3 1 5-4-3-4 3 1-5-4-3 5-1z" fill="currentColor"/></svg>',
};
