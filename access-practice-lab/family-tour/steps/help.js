// Step 4: three common moments and what to say, do and let the child try. The family marks the ones they will use.
import { toggleSpeech } from "../audio.js";
import { getLang, speechLang, t } from "../i18n.js";
import { canSpeak } from "../audio.js";
import { en, esc, icon } from "../util.js";
import { callout } from "./shared.js";

export const view = { open: "" };
const SITUATIONS = ["unsure", "mistake", "frustrated"];

function panel(id, state) {
  const say = t(`help.s.${id}.say`);
  const todo = t(`help.s.${id}.do`);
  const tryNext = t(`help.s.${id}.try`);
  const chosen = state.strategies.includes(id);
  return `<div class="situation" id="sit-${id}" tabindex="-1">
    <div class="three">
      <section><h3>${esc(t("help.say"))}</h3><ul class="say">${say
        .map(
          (s) => `<li>${esc(s.home)}${canSpeak() ? ` <button type="button" class="btn-listen sm" data-act="listen" data-text="${esc(s.home)}" data-speech="${speechLang()}" aria-pressed="false" aria-label="${esc(t("shell.listenTo", { what: s.home }))}">${icon("listen")}</button>` : ""}${s.en && getLang() !== "en" ? `<br><span class="en-line">${en(s.en)}</span>` : ""}</li>`,
        )
        .join("")}</ul></section>
      <section><h3>${esc(t("help.do"))}</h3><ul>${todo.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></section>
      <section><h3>${esc(t("help.try"))}</h3><ul class="frames">${tryNext.map((x) => `<li>${en(x)}</li>`).join("")}</ul></section>
    </div>
    <button type="button" class="btn-primary ${chosen ? "is-chosen" : ""}" data-act="strategy" data-v="${id}" aria-pressed="${chosen}">${chosen ? icon("check") : icon("heart")}<span>${esc(t(chosen ? "help.chosen" : "help.choose"))}</span></button>
  </div>`;
}

export function render({ state }) {
  const cards = SITUATIONS.map(
    (id) => `<button type="button" class="situation-card ${view.open === id ? "is-on" : ""}" data-act="situation" data-v="${id}" aria-expanded="${view.open === id}" aria-controls="sit-${id}">
      <span class="sit-title">${esc(t(`help.s.${id}.title`))}</span>${state.strategies.includes(id) ? `<span class="seen">${icon("check")}${esc(t("help.chosenShort"))}</span>` : ""}</button>`,
  ).join("");
  const ready = state.strategies.length > 0;
  return {
    ready,
    hint: ready ? "" : t("help.needOne"),
    html: `<p class="lead">${esc(t("help.lead"))}</p>
      ${callout(t("help.principleTitle"), t("help.principle"), "calm")}
      <h2 class="h-sm">${esc(t("help.pick"))}</h2>
      <div class="situations">${cards}</div>
      ${view.open ? panel(view.open, state) : ""}
      <p class="fine">${esc(t("help.homeLanguage"))}</p>`,
  };
}
