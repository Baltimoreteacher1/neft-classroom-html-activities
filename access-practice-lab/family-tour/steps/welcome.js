// Step 1: one calm promise and the two choices that shape the tour: what to practice and the child's grade.
// A ?grades= link arrives with the grade already chosen.
import { t } from "../i18n.js";
import { bandOptions, callout, choiceGroup, focusOptions } from "./shared.js";

export function render({ state }) {
  const ready = Boolean(state.focus && state.band);
  return {
    ready,
    hint: ready ? "" : t("welcome.needChoices"),
    html: `${callout(t("welcome.promiseTitle"), t("welcome.promise"), "calm")}
      ${choiceGroup({ name: "focus", legend: t("welcome.focusLegend"), value: state.focus, options: focusOptions() })}
      ${choiceGroup({ name: "band", legend: t("welcome.bandLegend"), value: state.band, options: bandOptions(), cols: 5 })}`,
  };
}
