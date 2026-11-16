import { t } from "../i18n.js";
import { esc } from "../util.js";

/** A group of native radio buttons drawn as large cards. `name` is the state key the change event writes. */
export function choiceGroup({ name, legend, value, options, cols = 3 }) {
  return `<fieldset class="choices cols-${cols}"><legend>${esc(legend)}</legend>${options
    .map(
      (o) => `<label class="choice ${String(value) === String(o.value) ? "is-on" : ""}">
        <input type="radio" name="${name}" value="${esc(o.value)}" data-act="set" data-k="${name}" ${String(value) === String(o.value) ? "checked" : ""}>
        <span class="choice-title">${esc(o.title)}</span>${o.text ? `<span class="choice-text">${esc(o.text)}</span>` : ""}
      </label>`,
    )
    .join("")}</fieldset>`;
}

export const focusOptions = () => [
  { value: "speaking", title: t("choice.speaking") },
  { value: "writing", title: t("choice.writing") },
  { value: "both", title: t("choice.both") },
];
export const bandOptions = () => [
  { value: "K", title: t("choice.bandK") },
  { value: "1", title: t("choice.band1") },
  { value: "2-3", title: t("choice.band2") },
  { value: "3-5", title: t("choice.band35") },
  { value: "6-8", title: t("choice.band68") },
];
export const minuteOptions = () => [5, 10, 15].map((n) => ({ value: n, title: t("kit.minutes", { n }) }));

export const callout = (title, text, tone = "") => `<aside class="callout ${tone}"><strong>${esc(title)}</strong><p>${esc(text)}</p></aside>`;
