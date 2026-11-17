// Step 3: choose tonight's activity. Up to three real activities for the family's grade and focus; the first one is
// already chosen when the step opens (main.js), so Continue always works and choosing is optional.
// The returning-family home reuses this list with `compact`, where grade, focus and time can still be changed.
import { byId, recommend } from "../picks.js";
import { getLang, t } from "../i18n.js";
import { art, esc, hasArt, icon } from "../util.js";
import { bandOptions, choiceGroup, focusOptions, minuteOptions } from "./shared.js";

export const recsFor = (picks, state) =>
  recommend(picks, { band: state.band, focus: state.focus, minutes: state.minutes });

function card(p, state) {
  const chosen = state.pick === p.id;
  const skill = getLang() === "es" ? p.skillEs : p.skill;
  return `<article class="rec ${chosen ? "is-chosen" : ""}" aria-labelledby="rec-${esc(p.id)}">
    ${hasArt(p) ? `<div class="rec-art">${art(p, { lang: getLang(), decorative: true })}</div>` : `<div class="rec-noimg" aria-hidden="true">${icon(p.domain === "Speaking" ? "speak" : "write")}</div>`}
    <div class="rec-body">
      <p class="tag">${esc(t(p.domain === "Speaking" ? "choice.speaking" : "choice.writing"))} · ${esc(t("kit.about", { n: p.minutes }))} · ${esc(t(`plan.level${p.level}`))}</p>
      <h3 id="rec-${esc(p.id)}" lang="en">${esc(p.title)}</h3>
      <p>${esc(t("plan.practices"))} ${esc(skill)}</p>
      <button type="button" class="btn-quiet" data-act="choose" data-v="${esc(p.id)}" aria-pressed="${chosen}">${chosen ? icon("check") : ""}<span>${esc(t(chosen ? "plan.chosen" : "plan.choose"))}</span></button>
    </div></article>`;
}

export function render({ state, picks, compact = false }) {
  const recs = recsFor(picks, state);
  const chosen = byId(picks, state.pick);
  const ready = Boolean(chosen);
  const controls = compact
    ? `${chosen && !recs.includes(chosen) ? `<p class="current">${esc(t("plan.current"))} <strong lang="en">${esc(chosen.title)}</strong></p>` : ""}
      <div class="plan-controls">
        ${choiceGroup({ name: "band", legend: t("welcome.bandLegend"), value: state.band, options: bandOptions(), cols: 5 })}
        ${choiceGroup({ name: "focus", legend: t("welcome.focusLegend"), value: state.focus, options: focusOptions() })}
        ${choiceGroup({ name: "minutes", legend: t("plan.minutesLegend"), value: state.minutes, options: minuteOptions() })}
      </div>`
    : "";
  return {
    ready,
    hint: ready ? "" : t("plan.needOne"),
    html: `${controls}<div class="recs">${recs.length ? recs.map((p) => card(p, state)).join("") : `<p>${esc(t("plan.none"))}</p>`}</div>`,
  };
}
