// Step 5: choose the first home activity. Three real activities at most, chosen from the family's grade, focus and time,
// each previewed inside the tour before the family picks one.
import { demoHTML } from "../demo.js";
import { byId, recommend } from "../picks.js";
import { getLang, t } from "../i18n.js";
import { esc, icon, pictureSrc } from "../util.js";
import { bandOptions, choiceGroup, focusOptions, minuteOptions } from "./shared.js";

export const view = { preview: "" };

export const recsFor = (picks, state) => recommend(picks, { band: state.band, focus: state.focus, minutes: state.minutes });

function card(p, state) {
  const chosen = state.pick === p.id;
  const src = pictureSrc(p);
  const skill = getLang() === "es" ? p.skillEs : p.skill;
  const help = t(p.domain === "Speaking" ? "plan.helpSpeaking" : "plan.helpWriting");
  return `<article class="rec ${chosen ? "is-chosen" : ""}" aria-labelledby="rec-${esc(p.id)}">
    ${src ? `<img src="${esc(src)}" alt="" width="320" height="200" loading="lazy">` : `<div class="rec-noimg" aria-hidden="true">${icon(p.domain === "Speaking" ? "speak" : "write")}</div>`}
    <div class="rec-body">
      <p class="tag">${esc(t(p.domain === "Speaking" ? "choice.speaking" : "choice.writing"))} · ${esc(t("kit.about", { n: p.minutes }))} · ${esc(t(`plan.level${p.level}`))}</p>
      <h3 id="rec-${esc(p.id)}" lang="en">${esc(p.title)}</h3>
      <p>${esc(t("plan.practices"))} ${esc(skill)}</p>
      <p>${esc(t("plan.youCan"))} ${esc(help)}</p>
      <div class="rec-actions">
        <button type="button" class="btn-primary" data-act="choose" data-v="${esc(p.id)}" aria-pressed="${chosen}">${chosen ? icon("check") : ""}<span>${esc(t(chosen ? "plan.chosen" : "plan.choose"))}</span></button>
        <button type="button" class="btn-quiet" data-act="preview" data-v="${esc(p.id)}">${esc(t("plan.preview"))}</button>
      </div>
    </div></article>`;
}

export function render({ state, picks, compact = false }) {
  const recs = recsFor(picks, state);
  const chosen = byId(picks, state.pick);
  const preview = view.preview && byId(picks, view.preview);
  if (preview)
    return {
      ready: Boolean(chosen),
      hint: "",
      html: `<div class="preview" id="plan-preview" tabindex="-1"><div class="preview-head"><button type="button" class="btn-back" data-act="preview-close">← ${esc(t("plan.backToList"))}</button></div>
        ${demoHTML(preview, "preview")}
        <button type="button" class="btn-primary" data-act="choose" data-v="${esc(preview.id)}">${esc(t("plan.choose"))}</button></div>`,
    };
  const ready = Boolean(chosen);
  return {
    ready,
    hint: ready ? "" : t("plan.needOne"),
    html: `${compact ? "" : `<p class="lead">${esc(t("plan.lead"))}</p>`}
      ${chosen && !recs.includes(chosen) ? `<p class="current">${esc(t("plan.current"))} <strong lang="en">${esc(chosen.title)}</strong></p>` : ""}
      <div class="plan-controls">
        ${choiceGroup({ name: "band", legend: t("welcome.bandLegend"), value: state.band, options: bandOptions(), cols: 2 })}
        ${choiceGroup({ name: "focus", legend: t("plan.focusLegend"), value: state.focus, options: focusOptions() })}
        ${choiceGroup({ name: "minutes", legend: t("plan.minutesLegend"), value: state.minutes, options: minuteOptions() })}
      </div>
      <h2 class="h-sm">${esc(t("plan.picks"))}</h2>
      <div class="recs">${recs.length ? recs.map((p) => card(p, state)).join("") : `<p>${esc(t("plan.none"))}</p>`}</div>`,
  };
}
