// Step 2: see what practice looks like. Two real activities, inside the tour, with a way back that is always on screen.
import { demoHTML, improveHTML } from "../demo.js";
import { demoPick } from "../picks.js";
import { t } from "../i18n.js";
import { esc, icon } from "../util.js";
import { callout } from "./shared.js";

export const view = { open: "" };

export function render({ state, picks }) {
  const band = state.band || "3-5";
  const tabs = ["speaking", "writing"]
    .map((d) => {
      const seen = state.seen.includes(d);
      return `<button type="button" class="concept c-${d === "speaking" ? "speak" : "write"} ${view.open === d ? "is-on" : ""}" data-act="explore-open" data-v="${d}" aria-expanded="${view.open === d}">
        <span class="concept-ico">${icon(d === "speaking" ? "speak" : "write")}</span>
        <span class="concept-name">${esc(t(`explore.${d}`))}</span>
        <span class="concept-line">${esc(t(`explore.${d}_line`))}</span>
        ${seen ? `<span class="seen">${icon("check")}${esc(t("explore.tried"))}</span>` : ""}</button>`;
    })
    .join("");
  let panel = "";
  if (view.open) {
    const p = demoPick(picks, view.open, band);
    panel = `<div class="preview" id="explore-panel" tabindex="-1">
      <div class="preview-head"><button type="button" class="btn-back" data-act="explore-close">← ${esc(t("shell.returnTour"))}</button></div>
      ${demoHTML(p, "explore")}
      ${view.open === "writing" ? improveHTML(p) : ""}
      ${callout(t("explore.tryTitle"), t("explore.tryText"), "calm")}
      <button type="button" class="btn-primary" data-act="explore-close">${esc(t("shell.returnTour"))}</button>
    </div>`;
  }
  return {
    ready: true,
    hint: "",
    html: `<p class="lead">${esc(t("explore.lead"))}</p>
      <div class="concepts two" ${view.open ? 'data-compact="true"' : ""}>${tabs}</div>
      ${panel}
      ${view.open ? "" : `<p class="fine">${esc(t("explore.either"))}</p>`}`,
  };
}
