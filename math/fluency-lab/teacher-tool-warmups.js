// fl-teacher: "Warm-ups for this unit" in the Class tools tab: Pair Compare and Mix and Match for a Reveal unit,
// printed through the lab's print sheet. New numbers on every press of "New numbers".
import { t } from "./i18n.js";
import { esc } from "./reports-export.js";
import { UNIT_CHECKS } from "./unit-check.js";
import { WARMUP_FORMATS, warmupHtml } from "./warmup-sheets.js";

const html = (state) => {
  const formats = { pair: t("Pair Compare"), match: t("Mix and Match") };
  const langs = { en: "English", es: "Español", both: t("English and Español") };
  return `<section class="t4-section" aria-labelledby="tt-warm-title"><h3 id="tt-warm-title">${esc(t("Warm-ups for this unit"))}</h3>
    <p class="t4-hint">${esc(t("Untimed lesson openers tied to a Reveal unit. Pair Compare: partners solve matching problems with different numbers, then compare their thinking. Mix and Match: cut-out problem and answer cards. The answer key is on its own page."))}</p>
    <form class="t4-form" data-tt-warm novalidate>
      <label>${esc(t("Unit"))}<select name="unit">${UNIT_CHECKS.map((unit) => `<option value="${unit.id}" ${unit.id === state.unit ? "selected" : ""}>${esc(t("Unit {n}", { n: unit.unit }))} · ${esc(unit.en)}</option>`).join("")}</select></label>
      <div class="t4-row"><label>${esc(t("Format"))}<select name="format">${WARMUP_FORMATS.map((id) => `<option value="${id}" ${id === state.format ? "selected" : ""}>${esc(formats[id])}</option>`).join("")}</select></label>
        <label>${esc(t("Language of the printout"))}<select name="lang">${Object.entries(langs).map(([id, label]) => `<option value="${id}" ${id === state.lang ? "selected" : ""}>${esc(label)}</option>`).join("")}</select></label></div>
      <div class="t4-actions"><button type="button" class="fl-btn fl-btn--teal" data-tt-warm-print>${esc(t("Print the warm-up"))}</button>
        <button type="button" class="fl-btn fl-btn--ghost" data-tt-warm-new>${esc(t("New numbers"))}</button></div></form></section>`;
};

export function mountWarmupTool(host, { onPrint, announce } = {}) {
  const state = { unit: UNIT_CHECKS[1].id, format: "pair", lang: "en", seed: 1 };
  const read = () => {
    const data = new FormData(host.querySelector("[data-tt-warm]"));
    state.unit = String(data.get("unit"));
    state.format = WARMUP_FORMATS.includes(data.get("format")) ? data.get("format") : "pair";
    state.lang = ["en", "es", "both"].includes(data.get("lang")) ? data.get("lang") : "en";
  };
  host.addEventListener("click", (event) => {
    if (event.target.closest("[data-tt-warm-new]")) {
      read();
      state.seed += 1;
      announce?.(t("New numbers chosen."));
      return;
    }
    if (!event.target.closest("[data-tt-warm-print]")) return;
    read();
    const unit = UNIT_CHECKS.find((entry) => entry.id === state.unit);
    onPrint?.(warmupHtml({ unit, format: state.format, lang: state.lang, seed: state.seed }));
    announce?.(t("Opening the print dialog."));
  });
  host.innerHTML = html(state);
  return { refresh: () => (host.innerHTML = html(state)) };
}
