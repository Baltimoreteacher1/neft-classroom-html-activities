// Step 1: what The Language Page is, in three ideas the family can open, and the two choices that shape the tour.
import { demoPick } from "../picks.js";
import { improveHTML } from "../demo.js";
import { t } from "../i18n.js";
import { en, esc, icon, pictureSrc } from "../util.js";
import { bandOptions, callout, choiceGroup, focusOptions } from "./shared.js";

export const view = { concept: "" };

const CONCEPTS = [
  { id: "speak", icon: "speak" },
  { id: "write", icon: "write" },
  { id: "grow", icon: "grow" },
];

function conceptPanel(id, picks, band) {
  const speak = demoPick(picks, "speaking", band);
  const write = demoPick(picks, "writing", band);
  if (id === "speak") {
    const src = pictureSrc(speak);
    return `<div class="mini">${src ? `<img src="${esc(src)}" alt="${esc(speak.picture.alt)}" lang="en" width="640" height="400" loading="lazy">` : ""}
      <div><p class="tag">${esc(t("welcome.studentSees"))}</p><p class="q" lang="en">${esc(speak.prompt)}</p>
      <p class="tag">${esc(t("welcome.studentSays"))}</p><p class="bubble good" lang="en">${esc(speak.models.A)}</p>
      <p>${esc(t("welcome.speakText"))}</p></div></div>`;
  }
  if (id === "write") {
    return `<div class="mini"><div><p class="tag">${esc(t("welcome.studentSees"))}</p><p class="q" lang="en">${esc(write.prompt)}</p>
      <p class="tag">${esc(t("demo.starters"))}</p><ul class="frames">${write.frames.map((f) => `<li>${en(f)}</li>`).join("")}</ul>
      <p class="tag">${esc(t("welcome.studentWrites"))}</p><p class="bubble good" lang="en">${esc(write.models.A)}</p>
      <p>${esc(t("welcome.writeText"))}</p></div></div>`;
  }
  const grow = [speak, write].find((p) => p.models.B) || speak;
  return `<div class="mini mini-grow">${improveHTML(grow)}<p>${esc(t("welcome.growText"))}</p></div>`;
}

export function render({ state, picks }) {
  const band = state.band || "3-5";
  const open = view.concept;
  const cards = CONCEPTS.map(
    (c) => `<button type="button" class="concept c-${c.id} ${open === c.id ? "is-on" : ""}" data-act="concept" data-v="${c.id}" aria-expanded="${open === c.id}" aria-controls="concept-panel">
      <span class="concept-ico">${icon(c.icon)}</span><span class="concept-name">${esc(t(`welcome.c_${c.id}`))}</span><span class="concept-line">${esc(t(`welcome.c_${c.id}_line`))}</span></button>`,
  ).join("");
  const ready = Boolean(state.focus && state.band);
  return {
    ready,
    hint: ready ? "" : t("welcome.needChoices"),
    html: `<p class="lead">${esc(t("welcome.lead"))}</p>
      ${callout(t("welcome.promiseTitle"), t("welcome.promise"), "calm")}
      <h2 class="h-sm">${esc(t("welcome.tapOne"))}</h2>
      <div class="concepts">${cards}</div>
      <div id="concept-panel" class="concept-panel" ${open ? "" : "hidden"} tabindex="-1">${open ? conceptPanel(open, picks, band) : ""}</div>
      <section class="ask" aria-labelledby="ask-h">
        <h2 id="ask-h">${esc(t("welcome.ask"))}</h2>
        ${choiceGroup({ name: "focus", legend: t("welcome.focusLegend"), value: state.focus, options: focusOptions() })}
        ${choiceGroup({ name: "band", legend: t("welcome.bandLegend"), value: state.band, options: bandOptions(), cols: 2 })}
      </section>`,
  };
}
