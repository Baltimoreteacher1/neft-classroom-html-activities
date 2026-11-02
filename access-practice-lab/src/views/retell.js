// "Retell it": after a Reading or Listening answer is right, say what it was about in your own words.
// It reuses the lab's recorder and stays on this device. The checks are the learner's own; nothing here
// is scored, and "On my own" shows no frames.
import { recorderHTML } from "../components.js";
import { isRecording } from "../recorder.js";
import { html, icon } from "../util.js";

export const RETELL_CHECKS = Object.freeze([
  { id: "main", en: "I said the main idea.", es: "Dije la idea principal." },
  { id: "detail", en: "I gave one detail.", es: "Di un detalle." },
  { id: "order", en: "I told it in an order that makes sense.", es: "Lo conté en un orden que tiene sentido." },
]);
const FRAMES = Object.freeze([
  { en: "This was about …", es: "Esto trataba de …" },
  { en: "One important detail is …", es: "Un detalle importante es …" },
  { en: "In the end, … / So …", es: "Al final, … / Entonces …" },
]);

/** Recorder takes for a retell are kept apart from the activity's own Speaking takes. */
export const retellKey = (activityId) => `${activityId}~retell`;

/** Flip one check in the saved record. Returns the new value of that check. Never throws on a bad id. */
export function toggleRetellCheck(record, activityId, check, now = new Date()) {
  if (!RETELL_CHECKS.some((c) => c.id === check)) return null;
  record.retell ||= {};
  const row = (record.retell[activityId] ||= { checks: {}, t: "" });
  row.checks[check] = !row.checks[check];
  row.t = now.toISOString();
  return row.checks[check];
}

export function retellHTML(I, { activity, domain, level, mode, record }) {
  const key = retellKey(activity.id);
  const checks = record.retell?.[activity.id]?.checks || {};
  const verb = domain === "Listening" ? I.T("heard", "escuchaste") : I.T("read", "leíste");
  return html`<section class="retell" aria-labelledby="retell-${activity.id}">
    <h3 id="retell-${activity.id}">${icon("speaking")} ${I.T("Retell it", "Cuéntalo")}</h3>
    <p>${I.T("Tell a partner what you", "Cuéntale a un compañero lo que")} ${verb} ${I.T("in your own words. You can also record yourself.", "con tus propias palabras. También puedes grabarte.")}</p>
    ${
      mode === "supported"
        ? html`<ul class="retell-frames">${FRAMES.map((f) => html`<li>${I.T(f.en, f.es)}</li>`)}</ul>`
        : ""
    }
    ${recorderHTML(key, { level, recording: isRecording(key), i18n: I })}
    <fieldset class="retell-checks">
      <legend>${I.T("Check what you did", "Marca lo que hiciste")}</legend>
      ${RETELL_CHECKS.map(
        (c) => html`<label class="check-row"><input type="checkbox" data-retell-check="${c.id}" ${checks[c.id] ? "checked" : ""} /> ${I.T(c.en, c.es)}</label>`,
      )}
    </fieldset>
  </section>`;
}
