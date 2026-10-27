// The workbench: mounts one round into the stage. The batch control (− / + buttons, a number box, a slider, × and ÷ buttons)
// drives the live table, the picture and the number line; unknown cells and extra answers are typed into real inputs.
// All work lives in `state`, so a language switch redraws every label without losing the batch, the typed amounts or the
// chosen option. No timers. @fm2 FM-014 FM-021 FM-040 FM-077
import { escapeHtml, L, tx } from "../../lang.js";
import { cmp, div, frac, mul, add, sub } from "../../rational.js";
import { UI } from "./copy.js";
import { fmtVal, R } from "./kit.js";
import { readNum } from "./logic.js";
import {
  batchOf,
  headText,
  inputMode,
  liveText,
  modelHtml,
  sourceHtml,
  stripParts,
  tableHtml,
  wordFor,
} from "./ui-view.js";

const esc = escapeHtml;
const floorOf = (r) => Math.floor(r.n / r.d);

export function mount(root, ctx) {
  const round = ctx.round;
  let lang = ctx.lang;
  let alive = true;
  const state = {
    active: 0,
    cols: round.cols.map((c) => ({ batch: fmtVal(c.start, round.style), values: {} })),
    extra: {},
    pick: null,
    message: "",
    done: false,
  };
  const t = (copy, vars) => tx(copy, lang, vars);
  const locked = () => state.done || ctx.locked?.();
  const col = () => round.cols[state.active];
  const multsOf = (c) => c.mult ?? round.mult ?? [];
  const say = (text) => ctx.announce?.(text);

  const clamp = (value, c) => (cmp(value, R(0)) < 0 ? R(0) : cmp(value, c.max) > 0 ? c.max : value);
  const sliderPos = (c, b) =>
    Math.min(floorOf(div(c.max, c.step)), Math.max(0, floorOf(div(b, c.step))));
  const valueText = () => {
    const b = batchOf(round, state, state.active);
    const strip = stripParts(round, state, lang).text;
    return `${fmtVal(b, round.style)} ${wordFor(round, b, lang)}${strip ? `. ${strip}` : ""}`;
  };

  function controlHtml() {
    const c = col();
    const dis = locked() ? "disabled" : "";
    const b = batchOf(round, state, state.active);
    const mults = multsOf(c)
      .map((m) => {
        const divide = m.n === 1;
        const label = divide ? `÷${m.d}` : `×${fmtVal(m, round.style)}`;
        const aria = divide ? t(UI.divide, { n: m.d }) : t(UI.times, { n: fmtVal(m, round.style) });
        return `<button type="button" class="fm2-btn rl-mult" data-rl-mult="${m.n}/${m.d}" data-rl-key="mult-${m.n}-${m.d}" aria-label="${esc(aria)}" ${dis}>${esc(label)}</button>`;
      })
      .join("");
    return `<section class="rl-control" aria-label="${esc(L(round.batchLabel, lang))}">
      <label class="rl-label" for="rl-batch">${esc(L(round.batchLabel, lang))}</label>
      <div class="rl-stepper">
        <button type="button" class="fm2-btn rl-step" data-rl-dec data-rl-key="dec" aria-label="${esc(t(UI.batchSmaller))}" ${dis}>−</button>
        <input type="text" id="rl-batch" class="rl-input rl-batch" inputmode="${inputMode(round)}" autocomplete="off" autocapitalize="off" spellcheck="false" data-rl-batch data-rl-key="batch" value="${esc(state.cols[state.active].batch)}" ${dis}>
        <button type="button" class="fm2-btn rl-step" data-rl-inc data-rl-key="inc" aria-label="${esc(t(UI.batchBigger))}" ${dis}>+</button>
      </div>
      ${mults ? `<div class="rl-mults">${mults}</div>` : ""}
      <input type="range" class="rl-slider" data-rl-slider data-rl-key="slider" min="0" max="${floorOf(div(c.max, c.step))}" step="1" value="${sliderPos(c, b)}" aria-label="${esc(t(UI.slider))}" aria-valuetext="${esc(valueText())}" ${dis}>
      <p class="rl-strip" data-rl-strip>${stripParts(round, state, lang).html}</p>
    </section>`;
  }

  function extrasHtml() {
    const dis = locked() ? "disabled" : "";
    const fields = round.extra
      .map(
        (e) =>
          `<div class="rl-extra"><label for="rl-x-${e.key}">${esc(L(e.label, lang))}</label><input type="text" class="rl-input" id="rl-x-${e.key}" inputmode="${e.kind === "ratio" ? "text" : inputMode(round)}" autocomplete="off" autocapitalize="off" spellcheck="false" ${e.kind === "ratio" ? `placeholder="${esc(t(UI.ratioPlaceholder))}"` : ""} data-rl-extra="${e.key}" data-rl-key="x-${e.key}" value="${esc(state.extra[e.key] || "")}" ${dis}></div>`,
      )
      .join("");
    const pick = round.pick
      ? `<fieldset class="rl-pick"><legend>${esc(L(round.pick.question, lang))}</legend><div class="rl-pick-row">${round.pick.options
          .map(
            (o, i) =>
              `<button type="button" class="fm2-btn rl-opt" data-rl-pick="${i}" data-rl-key="pick-${i}" aria-pressed="${state.pick === i}" ${dis}>${esc(L(o, lang))}</button>`,
          )
          .join("")}</div></fieldset>`
      : "";
    return `${fields}${pick}`;
  }

  function render(focusKey) {
    const key = focusKey ?? document.activeElement?.dataset?.rlKey;
    const chips =
      round.cols.length > 1
        ? `<div class="rl-chips" role="group" aria-label="${esc(t(UI.columns))}">${round.cols
            .map(
              (c, i) =>
                `<button type="button" class="fm2-btn rl-chip" data-rl-col="${i}" data-rl-key="col-${i}" aria-pressed="${i === state.active}">${esc(L(c.label, lang))}</button>`,
            )
            .join("")}</div>`
        : "";
    const model = modelHtml(round, state, lang);
    root.innerHTML = `<div class="rl" data-rl data-view="${round.view}" data-layout="${round.layout || "grid"}">
      ${chips}
      <div class="rl-grid">
        <div class="rl-main">
          ${controlHtml()}
          ${model ? `<figure class="rl-model" data-rl-model>${model}</figure>` : ""}
          <div data-rl-source>${sourceHtml(round, state, lang)}</div>
          <div class="rl-tablewrap" tabindex="0" role="region" aria-label="${esc(t(UI.recipe))}" data-rl-table>${tableHtml(round, state, lang, locked())}</div>
          ${extrasHtml()}
          <p class="rl-msg" role="status" data-rl-msg>${esc(state.message)}</p>
          <button type="button" class="fm2-btn fm2-btn-primary rl-submit" data-rl-submit data-rl-key="submit" ${locked() ? "disabled" : ""}>${esc(t(UI.check))}</button>
        </div>
      </div>
    </div>`;
    if (key) root.querySelector(`[data-rl-key="${key}"]`)?.focus({ preventScroll: true });
  }

  // Everything that depends on the batch, redrawn without touching an input the learner is typing in.
  function refreshLive() {
    const ci = state.active;
    const b = batchOf(round, state, ci);
    const c = col();
    const strip = root.querySelector("[data-rl-strip]");
    if (strip) strip.innerHTML = stripParts(round, state, lang).html;
    for (const cell of root.querySelectorAll("[data-rl-live]")) {
      const [cellCol, rowKey] = cell.dataset.rlLive.split(":");
      cell.textContent = liveText(round, state, Number(cellCol), rowKey);
    }
    for (const head of root.querySelectorAll("[data-rl-head]"))
      head.textContent = headText(round, state, Number(head.dataset.rlHead), lang);
    const model = root.querySelector("[data-rl-model]");
    if (model) model.innerHTML = modelHtml(round, state, lang);
    const source = root.querySelector("[data-rl-source]");
    if (source && round.layout === "stack") source.innerHTML = sourceHtml(round, state, lang);
    const slider = root.querySelector("[data-rl-slider]");
    if (slider) {
      slider.value = String(sliderPos(c, b));
      slider.setAttribute("aria-valuetext", valueText());
    }
    const dec = root.querySelector("[data-rl-dec]");
    const inc = root.querySelector("[data-rl-inc]");
    if (dec) dec.disabled = locked() || cmp(b, R(0)) <= 0;
    if (inc) inc.disabled = locked() || cmp(b, c.max) >= 0;
  }

  function setBatch(value, announce = true) {
    const c = col();
    const next = clamp(value, c);
    state.cols[state.active].batch = fmtVal(next, round.style);
    const input = root.querySelector("[data-rl-batch]");
    if (input) input.value = state.cols[state.active].batch;
    state.message = "";
    const msg = root.querySelector("[data-rl-msg]");
    if (msg) msg.textContent = "";
    refreshLive();
    if (announce) say(valueText());
  }

  function submit() {
    if (locked()) return;
    for (let ci = 0; ci < round.cols.length; ci += 1) {
      if (!readNum(state.cols[ci].batch)) {
        state.active = ci;
        state.message = t(UI.needBatch);
        render("batch");
        return;
      }
      const empty = round.cols[ci].ask.find((k) => !(state.cols[ci].values[k] || "").trim());
      if (empty) {
        state.active = ci;
        state.message = t(UI.needFill);
        render(`f-${ci}-${empty}`);
        return;
      }
    }
    const lost = round.extra.find((e) => !(state.extra[e.key] || "").trim());
    if (lost) {
      state.message = t(UI.needExtra);
      render(`x-${lost.key}`);
      return;
    }
    if (round.pick && state.pick === null) {
      state.message = t(UI.needPick);
      render("pick-0");
      return;
    }
    const response = {
      cols: state.cols.map((c) => ({ batch: c.batch, values: { ...c.values } })),
      extra: { ...state.extra },
      pick: state.pick,
    };
    const result = ctx.submit(response);
    state.message = "";
    if (result.correct) state.done = true;
    render(result.correct ? undefined : "submit");
  }

  function onClick(event) {
    if (!alive || locked()) return;
    const hit = (selector) => event.target.closest(selector);
    const chip = hit("[data-rl-col]");
    const mult = hit("[data-rl-mult]");
    const pick = hit("[data-rl-pick]");
    const c = col();
    const b = batchOf(round, state, state.active);
    if (chip) {
      state.active = Number(chip.dataset.rlCol);
      render(`col-${state.active}`);
      say(`${L(round.cols[state.active].label, lang)}. ${valueText()}`);
    } else if (hit("[data-rl-dec]")) setBatch(sub(b, c.step));
    else if (hit("[data-rl-inc]")) setBatch(add(b, c.step));
    else if (mult) {
      const [n, d] = mult.dataset.rlMult.split("/").map(Number);
      setBatch(b.n === 0 ? frac(n, d) : mul(b, frac(n, d)));
    } else if (pick) {
      state.pick = Number(pick.dataset.rlPick);
      state.message = "";
      render(`pick-${state.pick}`);
      say(L(round.pick.options[state.pick], lang));
    } else if (hit("[data-rl-submit]")) submit();
  }

  function onInput(event) {
    if (!alive) return;
    const target = event.target;
    if (target.matches?.("[data-rl-batch]")) {
      state.cols[state.active].batch = target.value;
      refreshLive();
    } else if (target.matches?.("[data-rl-slider]"))
      setBatch(mul(col().step, frac(Number(target.value))));
    else if (target.matches?.("[data-rl-field]")) {
      const [ci, key] = target.dataset.rlField.split(":");
      state.cols[Number(ci)].values[key] = target.value;
    } else if (target.matches?.("[data-rl-extra]"))
      state.extra[target.dataset.rlExtra] = target.value;
  }

  function onKeydown(event) {
    if (!alive || locked()) return;
    const target = event.target;
    if (event.key === "Enter" && target.matches?.("input[type=text]")) {
      event.preventDefault();
      submit();
    } else if (
      target.matches?.("[data-rl-batch]") &&
      (event.key === "ArrowUp" || event.key === "ArrowDown")
    ) {
      event.preventDefault();
      const b = batchOf(round, state, state.active);
      setBatch(event.key === "ArrowUp" ? add(b, col().step) : sub(b, col().step));
    }
  }

  root.addEventListener("click", onClick);
  root.addEventListener("input", onInput);
  root.addEventListener("keydown", onKeydown);
  render();
  // "Show me" ends the round from the shell: freeze the workbench when the shell says the round is locked.
  const freeze = () => {
    if (alive && !state.done) {
      state.done = true;
      render();
    }
  };
  ctx.onLock?.(freeze);
  return {
    destroy() {
      alive = false;
      root.removeEventListener("click", onClick);
      root.removeEventListener("input", onInput);
      root.removeEventListener("keydown", onKeydown);
      root.innerHTML = "";
    },
    setLang(next) {
      lang = next;
      render();
    },
  };
}
