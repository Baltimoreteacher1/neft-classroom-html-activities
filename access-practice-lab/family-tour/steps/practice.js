// Step 2: one short activity, tried together (optional: Continue always works). The adult asks and waits; the child
// answers. Typed answers get plain tips; spoken answers are listened to, never scored.
import { demoHTML, demoState, ui } from "../demo.js";
import { getLang, t } from "../i18n.js";
import { demoPick } from "../picks.js";
import { esc } from "../util.js";

export function pickFor(state, picks) {
  return demoPick(picks, state.focus === "writing" ? "writing" : "speaking", state.band || "3-5");
}

export function render({ state, picks }) {
  const p = pickFor(state, picks);
  const st = demoState(p.id);
  const tried = st.attempts.some((a) => !a.empty) || ui.recorders[p.id]?.state === "recorded";
  return {
    ready: true,
    hint: "",
    html: `<section class="adult" aria-labelledby="adult-h">
        <h2 id="adult-h">${esc(t("practice.adultTitle"))}</h2>
        <ol class="steps"><li>${esc(t("practice.adult1"))}</li><li>${esc(t("practice.adult2"))}</li><li>${esc(t("practice.adult3"))}</li></ol>
        <a class="btn-listen" href="/access-practice-lab/audio-practice/?view=family&amp;lang=${getLang()}">${esc(t("practice.audioDirections"))}</a>
      </section>
      ${demoHTML(p, "practice")}
      ${tried ? `<section class="done" role="status" aria-live="polite"><h2>${esc(t("practice.doneTitle"))}</h2><p>${esc(t("practice.doneText"))}</p></section>` : ""}`,
  };
}
