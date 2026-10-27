// Scientific-notation builder (grade 8): digit steppers for the coefficient and a stepper for the power of ten.
// Up/Down arrow keys change the digit or exponent under the focus. @fm2 FM-007 FM-021 FM-038 FM-039
import { SCI_EXP, SCI_PLACES, sciCoefText, sciValue } from "./logic-modes.js";
import { SCI_PLACE_NAMES, t } from "./copy.js";
import { sup } from "./copy-text.js";
import { toDecimalString } from "../../rational.js";
import {
  actionsHtml,
  createFlow,
  esc,
  focusKey,
  keptHtml,
  lockWhenDone,
  restoreFocus,
  rulesHtml,
} from "./ui-shared.js";
import { fmtNum } from "./words.js";

const PLACE_VALUES = ["100", "10", "1", "0.1", "0.01"];

export function mountSci(root, ctx) {
  const round = ctx.round;
  let lang = ctx.lang;
  let state = { digits: Array(SCI_PLACES).fill(0), exp: 0 };
  let history = [];
  const copy = (s) => ({ digits: [...s.digits], exp: s.exp });
  const snapshot = () => history.push(copy(state));
  const build = () => copy(state);
  const api = {
    build,
    blank: () => ({ digits: Array(SCI_PLACES).fill(0), exp: 0 }),
    load: (b) => {
      snapshot();
      state = copy(b);
    },
    refresh: () => update(),
  };
  const flow = createFlow(ctx, api);
  const lock = lockWhenDone(root, ctx);
  const coefDisplay = () => fmtNum(sciCoefText(state.digits));
  const line = () =>
    `${coefDisplay()} × 10${sup(state.exp)} = ${fmtNum(toDecimalString(sciValue(state), 9) ?? "?")}`;

  function update() {
    root.querySelectorAll("[data-digit]").forEach((cell) => {
      const i = Number(cell.dataset.digit);
      cell.querySelector("output").textContent = state.digits[i];
      cell
        .querySelector("[data-up]")
        .setAttribute(
          "aria-label",
          `${t("digitUp", lang, { place: SCI_PLACE_NAMES[lang][i] })}. ${t("digitValue", lang, { place: SCI_PLACE_NAMES[lang][i], d: state.digits[i] })}`,
        );
      cell
        .querySelector("[data-down]")
        .setAttribute("aria-label", t("digitDown", lang, { place: SCI_PLACE_NAMES[lang][i] }));
    });
    root.querySelector("[data-expval]").textContent = String(state.exp).replace("-", "−");
    root
      .querySelector('[data-exp="up"]')
      .setAttribute("aria-label", `${t("expUp", lang)}. ${t("exponent", lang)}: ${state.exp}`);
    root.querySelector("[data-readout]").textContent = line();
    root.querySelector("[data-rules]").innerHTML = rulesHtml(round, build(), flow.kept, lang);
    root.querySelector("[data-kept]").innerHTML = keptHtml(round, flow.kept, lang);
    root.querySelector('[data-act="check"]').textContent = flow.label(lang);
    lock.sync();
  }

  function render() {
    const focus = focusKey(root);
    const cells = state.digits
      .map(
        (
          _,
          i,
        ) => `${i === 3 ? '<li class="nb-point" aria-hidden="true">.</li>' : ""}<li class="nb-digit" data-digit="${i}">
          <button type="button" class="nb-step-btn" data-up="${i}"><span aria-hidden="true">+</span></button>
          <output class="nb-dval">0</output>
          <button type="button" class="nb-step-btn" data-down="${i}" aria-label=""><span aria-hidden="true">−</span></button>
          <span class="nb-place" aria-hidden="true">${PLACE_VALUES[i]}</span><span class="fm2-sr">${esc(SCI_PLACE_NAMES[lang][i])}</span></li>`,
      )
      .join("");
    root.innerHTML = `<div class="nb" data-nb data-mode="sci">
      <div class="nb-rules" data-rules></div>
      <h3 class="nb-h">${esc(t("sciTitle", lang))}</h3>
      <div class="nb-sci"><div class="nb-coef"><h4 class="nb-sub-h">${esc(t("coefficient", lang))}</h4><ul class="nb-digits">${cells}</ul></div>
      <span class="nb-times" aria-hidden="true">× 10</span>
      <div class="nb-expo"><h4 class="nb-sub-h">${esc(t("exponent", lang))}</h4>
        <button type="button" class="nb-step-btn" data-exp="up" aria-label="${esc(t("expUp", lang))}"><span aria-hidden="true">+</span></button>
        <output class="nb-dval" data-expval></output>
        <button type="button" class="nb-step-btn" data-exp="down" aria-label="${esc(t("expDown", lang))}"><span aria-hidden="true">−</span></button></div></div>
      <p class="nb-readout" data-readout></p>
      ${actionsHtml(lang, flow)}
      <div class="nb-kept" data-kept></div></div>`;
    root
      .querySelectorAll("[data-down]")
      .forEach((b) =>
        b.setAttribute(
          "aria-label",
          t("digitDown", lang, { place: SCI_PLACE_NAMES[lang][Number(b.dataset.down)] }),
        ),
      );
    update();
    restoreFocus(root, focus);
  }

  function changeDigit(i, delta) {
    if (ctx.locked()) return;
    const next = state.digits[i] + delta;
    if (next < 0 || next > 9) return ctx.announce(t("edge", lang));
    snapshot();
    state.digits[i] = next;
    update();
    ctx.announce(line());
  }
  function changeExp(delta) {
    if (ctx.locked()) return;
    const next = state.exp + delta;
    if (next < SCI_EXP[0] || next > SCI_EXP[1]) return ctx.announce(t("edge", lang));
    snapshot();
    state.exp = next;
    update();
    ctx.announce(line());
  }

  const onClick = (event) => {
    const target = event.target.closest("button");
    if (!target || !root.contains(target)) return;
    if (target.dataset.up !== undefined) changeDigit(Number(target.dataset.up), 1);
    else if (target.dataset.down !== undefined) changeDigit(Number(target.dataset.down), -1);
    else if (target.dataset.exp) changeExp(target.dataset.exp === "up" ? 1 : -1);
    else if (target.dataset.edit) flow.edit(Number(target.dataset.edit));
    else if (target.dataset.act === "check") flow.press(lang);
    else if (target.dataset.act === "clear") {
      if (ctx.locked()) return;
      snapshot();
      state = api.blank();
      update();
      ctx.announce(t("cleared", lang));
    } else if (target.dataset.act === "undo") {
      if (ctx.locked()) return;
      if (!history.length) return ctx.announce(t("nothingToUndo", lang));
      state = history.pop();
      update();
      ctx.announce(line());
    }
  };
  const onKey = (event) => {
    if (!["ArrowUp", "ArrowDown"].includes(event.key)) return;
    const delta = event.key === "ArrowUp" ? 1 : -1;
    const cell = event.target.closest("[data-digit]");
    if (cell) {
      event.preventDefault();
      changeDigit(Number(cell.dataset.digit), delta);
    } else if (event.target.closest(".nb-expo")) {
      event.preventDefault();
      changeExp(delta);
    }
  };
  root.addEventListener("click", onClick);
  root.addEventListener("keydown", onKey);
  render();
  return {
    destroy() {
      root.removeEventListener("click", onClick);
      root.removeEventListener("keydown", onKey);
      lock.destroy();
      root.innerHTML = "";
    },
    setLang(next) {
      lang = next;
      render();
    },
  };
}
