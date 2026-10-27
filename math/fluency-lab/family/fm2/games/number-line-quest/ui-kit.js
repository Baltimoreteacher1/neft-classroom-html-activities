// Shared pieces of the Number Line Quest interface: how numbers are written on this round's line, the nudge buttons, and
// the page frame every kind of round uses. @fm2 FM-012 FM-038 FM-040
import { frac, mul } from "../../rational.js";
import { ui } from "./copy.js";
import { placesOf, showNum, spokenNum } from "./format.js";

export const readFn = (round) => (v) => showNum(v, round.mode, placesOf(round.line.step));
export const labelFn = (round) => {
  const places = placesOf(round.line.ticks || round.line.step);
  return (v) => showNum(v, v.d === 1 ? "int" : round.mode, places);
};
export const spokenFn = (round, lang) => (v) => spokenNum(v, round.mode, lang);

// Ten steps is written the natural way: 0.1 steps give 1, quarter steps give 2 1/2.
export function stepTexts(round, step = round.line.step) {
  const bigMode = round.mode === "frac" ? "mixed" : round.mode;
  return { step: showNum(step, round.mode, placesOf(step)), big: showNum(mul(step, frac(10)), bigMode) };
}

export function figureLabel(round, lang) {
  const { min, max, ticks } = round.line;
  const read = labelFn(round);
  return ui("figure", lang, { lo: read(min), hi: read(max), tick: ticks ? read(ticks) : "" });
}

export const baseConfig = (round, lang) => ({
  min: round.line.min,
  max: round.line.max,
  step: round.line.step,
  ticks: round.line.ticks,
  labels: round.line.labels,
  labelText: labelFn(round),
  marks: (round.marks || []).map((m) => ({ ...m })),
  aria: figureLabel(round, lang),
});

export const NUDGE = `<div class="nlq-nudge" role="group" data-nudge-group>
  <button type="button" class="fm2-btn nlq-nudge-btn" data-nudge="-10"></button>
  <button type="button" class="fm2-btn nlq-nudge-btn" data-nudge="-1"></button>
  <button type="button" class="fm2-btn nlq-nudge-btn" data-nudge="1"></button>
  <button type="button" class="fm2-btn nlq-nudge-btn" data-nudge="10"></button>
</div>`;

export function paintNudge(root, lang, texts) {
  const set = (delta, visible, labelKey) => {
    const button = root.querySelector(`[data-nudge="${delta}"]`);
    button.textContent = visible;
    button.setAttribute("aria-label", ui(labelKey, lang, texts));
  };
  set(-10, `◀◀ ${texts.big}`, "leftBig");
  set(-1, `◀ ${texts.step}`, "left");
  set(1, `${texts.step} ▶`, "right");
  set(10, `${texts.big} ▶▶`, "rightBig");
  root.querySelector("[data-nudge-group]").setAttribute("aria-label", ui("nudge", lang));
}

export const frame = (extra = "", { nudge = true, check = true } = {}) => `<div class="nlq">
  <p class="nlq-rule" data-rule></p>
  <div class="nlq-stage" data-board></div>
  <p class="nlq-readout" data-readout></p>
  ${extra}
  ${nudge ? NUDGE : ""}
  <p class="nlq-note" data-note role="status"></p>
  <div class="nlq-actions" data-actions>${check ? `<button type="button" class="fm2-btn fm2-btn-primary" data-check></button>` : ""}</div>
</div>`;

export const queryOf = (root) => (name) => root.querySelector(`[data-${name}]`);
