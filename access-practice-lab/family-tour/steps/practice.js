// Step 3: one short activity, tried together. The adult asks and waits; the child answers; the family sees one
// specific thing to add and tries again. Typed answers get plain tips; spoken answers are listened to, never scored.
import { demoHTML, demoState, ui } from "../demo.js";
import { demoPick } from "../picks.js";
import { t } from "../i18n.js";
import { esc } from "../util.js";
import { callout } from "./shared.js";

export const view = { help: false };

export function pickFor(state, picks) {
  return demoPick(picks, state.focus === "writing" ? "writing" : "speaking", state.band || "3-5");
}

export function render({ state, picks }) {
  const p = pickFor(state, picks);
  const st = demoState(p.id);
  const rec = ui.recorders[p.id];
  const tried = st.attempts.some((a) => !a.empty) || rec?.state === "recorded";
  const kind = p.domain === "Speaking" ? "speak" : "write";
  return {
    ready: true,
    hint: "",
    html: `<p class="lead">${esc(t("practice.lead"))}</p>
      <section class="adult" aria-labelledby="adult-h">
        <h2 id="adult-h">${esc(t("practice.adultTitle"))}</h2>
        <ol class="steps"><li>${esc(t("practice.adult1"))}</li><li>${esc(t("practice.adult2"))}</li><li>${esc(t("practice.adult3"))}</li></ol>
        <button type="button" class="btn-quiet" data-act="practice-help" aria-expanded="${view.help}" aria-controls="adult-help">${esc(t("practice.unsureBtn"))}</button>
        <p id="adult-help" class="adult-help" ${view.help ? "" : "hidden"}>${esc(t("practice.unsureText"))}</p>
      </section>
      ${demoHTML(p, "practice")}
      ${
        tried
          ? `<section class="done" role="status" aria-live="polite"><h2>${esc(t("practice.doneTitle"))}</h2>
              <p>${esc(t("practice.doneText"))}</p>
              ${kind === "speak" ? callout(t("practice.modelTitle"), t("practice.modelFeedback"), "calm") : ""}
              <h3>${esc(t("practice.repeatTitle"))}</h3>
              <ol class="steps"><li>${esc(t("practice.repeat1"))}</li><li>${esc(t("practice.repeat2"))}</li><li>${esc(t("practice.repeat3"))}</li></ol></section>`
          : `<p class="fine">${esc(t("practice.notYet"))}</p>`
      }`,
  };
}
