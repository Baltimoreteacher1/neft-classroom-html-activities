// The place-value widget: choose how many ones, tenths, hundredths and thousandths scoops go in the pitcher. For
// repeating decimals the learner may instead say "this can never be filled exactly" and name the repeating digits.
// @fm2 FM-040 FM-054 FM-059
import { vesselSvg } from "../../art/fractions.js";
import { cmp, frac, sub, toString } from "../../rational.js";
import { ING, PLACE_NAMES, cap, placeCount } from "./copy.js";
import { placeValue } from "./model.js";
import { button, esc, mountWidget, stepper, u } from "./ui-core.js";
import { cupsText, decimalOf } from "./words.js";

const UNIT_TEXT = ["1", "0.1", "0.01", "0.001"];

const partsText = (digits, lang) => {
  const parts = digits.map((d, i) => (d ? placeCount(i, d, lang) : null)).filter(Boolean);
  return parts.length ? parts.join(" + ") : u("nothingYet", lang);
};

export const placeWidget = {
  init: () => ({ digits: [0, 0, 0, 0], never: false, block: null }),
  view({ state, round, lang, canUndo }) {
    const value = placeValue(state.digits);
    const over = cmp(value, frac(round.cap)) > 0;
    const level = over ? frac(round.cap) : value;
    const label = u("pitcherLabel", lang, { value: cupsText(value, lang), food: ING[round.ingredient][lang] });
    const steppers = round.places.map((i) =>
      stepper({
        fk: `digit-${i}`,
        label: u("placeScoop", lang, { name: cap(PLACE_NAMES[lang][i]), unit: UNIT_TEXT[i] }),
        value: state.digits[i],
        text: String(state.digits[i]),
        min: 0,
        max: 9,
        step: "digit",
        attrs: `data-i="${i}"`,
        visibleLabel: true,
        lang,
      }),
    );
    const repeat = round.mode === "repeat";
    const gap = sub(round.target, value);
    const need = cmp(gap, frac(0)) >= 0 ? u("stillNeeded", lang, { gap: toString(gap) }) : u("overBy", lang, { gap: toString(frac(-gap.n, gap.d)) });
    const blocks = repeat && state.never
      ? `<div class="fk-tool"><span class="fk-tool-label" id="fk-block-label">${u("blockAsk", lang)}</span><div class="fk-ticks" role="group" aria-labelledby="fk-block-label">
          ${round.blocks.map((b) => button({ act: "block", v: b, fk: `block-${b}`, cls: "fk-block-btn", pressed: state.block === b, label: `<span class="fk-bar">${esc(b)}</span>`, aria: u("blockOption", lang, { b }) })).join("")}</div></div>`
      : "";
    return `
      <figure class="fk-model fk-pitcher">${vesselSvg({ level, cap: round.cap, marks: 1, pitcher: true, goal: round.target, label })}</figure>
      <p class="fk-eq" data-fk="eq">${u("eqPlace", lang, { parts: partsText(state.digits, lang), dec: decimalOf(value), frac: toString(value) })}</p>
      ${repeat ? `<p class="fk-eq fk-need">${need}</p>` : ""}
      <div class="fk-tools">
        <div class="fk-tool fk-places">${steppers.join("")}</div>
        ${repeat ? `<div class="fk-tool">${button({ act: "never", fk: "never", cls: "fk-never-btn", pressed: state.never, label: u("never", lang) })}</div>` : ""}
        ${blocks}
        <div class="fk-actions">${button({ act: "undo", fk: "undo", label: u("undo", lang), disabled: !canUndo })}${button({ act: "submit", fk: "submit", cls: "fm2-btn-primary", label: u("submitPlace", lang) })}</div>
      </div>`;
  },
  act(state, name, data) {
    if (name === "digit") {
      const i = Number(data.i);
      const digit = Math.min(9, Math.max(0, state.digits[i] + Number(data.v)));
      if (digit === state.digits[i]) return null;
      const digits = state.digits.map((d, at) => (at === i ? digit : d));
      const value = placeValue(digits);
      return { state: { ...state, digits }, say: { en: `${digit} ${PLACE_NAMES.en[i]} scoops. ${decimalOf(value)} cup in the pitcher.`, es: `${digit} cucharones de ${PLACE_NAMES.es[i]}. ${decimalOf(value)} de taza en la jarra.` } };
    }
    if (name === "never") {
      const never = !state.never;
      return { state: { ...state, never, block: never ? state.block : null }, say: never ? { en: "You said it can never be filled exactly.", es: "Dijiste que nunca se puede llenar con exactitud." } : { en: "Back to filling.", es: "De vuelta a llenar." } };
    }
    if (name === "block") return { state: { ...state, block: data.v }, say: { en: `Repeating digits ${data.v} chosen.`, es: `Dígitos que se repiten: ${data.v}.` } };
    return null;
  },
  response: (state) => ({ digits: state.digits, never: state.never, block: state.block }),
};

export const mountPlace = (root, ctx) => mountWidget(root, ctx, placeWidget);
