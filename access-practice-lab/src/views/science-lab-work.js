// Science Investigation Lab: revise, present, reflect and the independent transfer attempt.
import { reflectionPrompts } from "../lang/science-lab.js";
import { canRecord, isRecording, takesFor } from "../recorder.js";
import { html, icon, raw } from "../util.js";
import { evidencePickerHTML } from "./science-lab-argue.js";
import { dataNoteHTML } from "./science-lab-data.js";
import {
  dataRows,
  inputOf,
  pairNotes,
  runCheck,
  runTransfer,
  workOf,
} from "./science-lab-model.js";
import {
  diffPanelHTML,
  partnerHTML,
  posterHTML,
  recapHTML,
  transferSceneHTML,
} from "./science-lab-share.js";
import { echoHTML, feedbackHTML, fieldHTML, savedNote } from "./science-lab-ui.js";

const panel = (id, title, body) =>
  html`<section class="panel sl-work" aria-labelledby="${id}">
    <h2 id="${id}">${title}</h2>
    ${body}
  </section>`;

// ── revise ───────────────────────────────────────────────────────────────────
const TARGETS = [
  ["question", "My question", "Mi pregunta"],
  ["hypothesis", "My prediction", "Mi predicción"],
  ["claim", "My claim", "Mi afirmación"],
  ["reasoning", "My reasoning", "Mi razonamiento"],
];

const SPAN = {
  add: ["You added", "Agregaste"],
  del: ["You took out", "Quitaste"],
};

/** The question someone who disagrees would ask: the first question the check raised on the earlier words. */
function counterQuestionHTML(I, t, target, before) {
  const first = pairNotes(runCheck(target, before, t.caseDef))[0];
  return first
    ? partnerHTML(I, first.en, first.es)
    : partnerHTML(
        I,
        "Someone disagrees with you. What in your data would you show them first?",
        "Alguien no está de acuerdo contigo. ¿Qué de tus datos le mostrarías primero?",
      );
}

function revisionResultHTML(I, t, rec, cs) {
  const res = runCheck("revise", rec.chk, t.caseDef);
  const earlier = pairNotes(runCheck(rec.chk.target, rec.chk.before, t.caseDef));
  const fixed = earlier.filter((n) => res.en.fixed.includes(n.id));
  const spans = (res.en.changed || []).filter((s) => s.op !== "same");
  const extra = html`${
    spans.length
      ? html`<ul class="sl-list sl-changes">
          ${spans.map((s) => html`<li>${I.T(...SPAN[s.op])}: <q class="sl-quote">${s.text}</q></li>`)}
        </ul>`
      : ""
  }
  ${
    fixed.length
      ? html`<p class="ex-kicker">
            ${I.T("Questions from before that your new words now answer", "Preguntas de antes que tus palabras nuevas ya responden")}
          </p>
          <ul class="sl-list">
            ${fixed.map((n) => html`<li>${I.T(n.en, n.es)}</li>`)}
          </ul>`
      : ""
  }`;
  const stale = JSON.stringify(rec.chk) !== JSON.stringify(inputOf("revise", rec, cs));
  return feedbackHTML(I, pairNotes(res), { stale, extra });
}

export function reviseHTML(I, t, cs) {
  const rec = cs.stages.revise || {};
  const target = rec.target || "claim";
  const before = workOf(cs, target);
  const has = Boolean(before.text.trim());
  return html`${panel(
    "slReviseTarget",
    I.T("What will you improve?", "¿Qué vas a mejorar?"),
    html`<fieldset class="sl-choice">
      <legend>
        ${I.T("Choose one piece of your work to revise.", "Elige una parte de tu trabajo para revisar.")}
      </legend>
      ${TARGETS.map(([id, en, es]) => html`<label class="sl-radio"><input type="radio" name="slTarget" value="${id}" data-sl-target ${target === id ? raw("checked") : ""} /> ${I.T(en, es)}</label>`)}
    </fieldset>`,
  )}
  ${
    has
      ? panel(
          "slReviseWork",
          I.T("Earlier and new", "Antes y ahora"),
          html`${counterQuestionHTML(I, t, target, before)}
            ${diffPanelHTML(I, before.text, typeof rec.after === "string" ? rec.after : before.text)}
            ${fieldHTML(I, { stage: "revise", name: "after", label: I.T("Your new version", "Tu versión nueva"), hint: I.T("Change the words so they answer the question above.", "Cambia las palabras para que respondan la pregunta de arriba."), value: typeof rec.after === "string" ? rec.after : before.text, rows: 5, required: true })}
            ${savedNote(I)}
            <div class="row-actions">
              <button type="button" class="btn" data-sl-check="revise">
                ${icon("check")} ${I.T("Compare my new version", "Comparar mi versión nueva")}
              </button>
            </div>
            ${rec.chk ? revisionResultHTML(I, t, rec, cs) : ""}`,
        )
      : panel(
          "slReviseWork",
          I.T("Nothing written yet for this piece", "Todavía no hay nada escrito para esta parte"),
          html`<p>
            ${I.T("Choose another piece, or go back and write it first.", "Elige otra parte, o regresa y escríbela primero.")}
          </p>`,
        )
  }`;
}

// ── present ──────────────────────────────────────────────────────────────────
export const PRESENT_KEY = "science-lab-present";

function recorderHTML(I) {
  if (!canRecord())
    return html`<p class="fine">
      ${I.T("This browser cannot record. Say your talk aloud to a partner, then type what you said.", "Este navegador no puede grabar. Di tu presentación en voz alta a un compañero y luego escribe lo que dijiste.")}
    </p>`;
  const takes = takesFor(PRESENT_KEY);
  const recording = isRecording(PRESENT_KEY);
  return html`<div class="sl-recorder">
    <p class="fine">
      ${I.T("Recording is optional. It stays in this tab and is never saved. Typing what you said is the part that counts.", "Grabar es opcional. Se queda en esta pestaña y nunca se guarda. Escribir lo que dijiste es la parte que cuenta.")}
    </p>
    ${
      recording
        ? html`<button type="button" class="btn" data-rec-stop="${PRESENT_KEY}">
              ${icon("stop")} ${I.T("Stop recording", "Detener la grabación")}
            </button>
            <p role="status">
              ${I.T("Recording. Press Stop when you are done.", "Grabando. Pulsa Detener cuando termines.")}
            </p>`
        : html`<button
            type="button"
            class="btn"
            data-rec-start="${PRESENT_KEY}"
            data-rec-prep="0"
            data-rec-max="0"
          >
            ${icon("play")}
            ${takes.length ? I.T("Record again", "Grabar otra vez") : I.T("Record my talk", "Grabar mi presentación")}
          </button>`
    }
    ${
      takes.length
        ? html`<ol class="sl-takes">
            ${takes.map((tk, i) => html`<li>${I.T(`Try ${i + 1}`, `Intento ${i + 1}`)} <audio controls preload="none" src="${tk.url}" aria-label="${I.S(`Play recording ${i + 1}`, `Reproducir la grabación ${i + 1}`)}"></audio></li>`)}
          </ol>`
        : ""
    }
  </div>`;
}

export function presentHTML(I, t, cs) {
  const rec = cs.stages.present || {};
  const outline = html`${echoHTML(I, I.T("My question", "Mi pregunta"), cs.stages.question?.text)}${echoHTML(I, I.T("My claim", "Mi afirmación"), cs.stages.claim?.text)}${echoHTML(I, I.T("My reasoning", "Mi razonamiento"), cs.stages.reasoning?.text)}`;
  return html`${panel("slPresentPoster", I.T("Your poster", "Tu cartel"), posterHTML(I, t, cs))}
  ${panel("slPresentNotes", I.T("Your notes to speak from", "Tus notas para hablar"), outline)}
  ${panel(
    "slPresentTalk",
    I.T("Tell your investigation", "Cuenta tu investigación"),
    html`${recorderHTML(I)}
    ${fieldHTML(I, { stage: "present", name: "transcript", label: I.T("Type what you said", "Escribe lo que dijiste"), hint: I.T("Write your talk the way you would say it to the class.", "Escribe tu presentación como se la dirías a la clase."), value: rec.transcript || "", rows: 7, required: true })}
    ${savedNote(I)}`,
  )}`;
}

// ── reflect ──────────────────────────────────────────────────────────────────
export function reflectHTML(I, t, cs) {
  const answers = cs.stages.reflect?.answers || {};
  return html`${recapHTML(I, t, cs)}${panel(
    "slReflectTitle",
    I.T("Look back", "Mira atrás"),
    html`${reflectionPrompts(cs).map((p) => fieldHTML(I, { stage: "reflect", name: "answers", sub: p.id, label: I.TO(p.text), value: answers[p.id] || "", rows: 3 }))}${savedNote(I)}`,
  )}`;
}

// ── transfer ─────────────────────────────────────────────────────────────────
function transferFeedbackHTML(I, t, rec) {
  const { sections } = runTransfer(rec.chk, t.caseDef);
  const titles = {
    question: ["Your question", "Tu pregunta"],
    claim: ["Your claim", "Tu afirmación"],
    reasoning: ["Your reasoning", "Tu razonamiento"],
  };
  const stale = JSON.stringify(rec.chk) !== JSON.stringify(inputOf("transfer", rec));
  const body = Object.entries(sections).map(([key, res]) => {
    const notes = pairNotes(res);
    return html`<h3>${I.T(...titles[key])}</h3>
      ${
        notes.length
          ? html`<ul class="sl-notes">
              ${notes.map(
                (n) =>
                  html`<li>
                    ${n.quote ? html`<q class="sl-quote">${n.quote}</q>` : ""}
                    <p class="sl-ask">${I.T(n.en, n.es)}</p>
                  </li>`,
              )}
            </ul>`
          : html`<p>${I.T("No new questions here.", "No hay preguntas nuevas aquí.")}</p>`
      }`;
  });
  return feedbackWithSections(I, stale, body);
}

function feedbackWithSections(I, stale, body) {
  return html`<section class="ex-notes sl-feedback" aria-labelledby="slFbTitle" data-sl-feedback>
    <h2 id="slFbTitle" tabindex="-1">
      ${I.T("Questions to think about", "Preguntas para pensar")}
    </h2>
    ${stale ? html`<p class="ex-change">${icon("retry")} ${I.T("You changed your words after this. Check again to see new questions.", "Cambiaste tus palabras después de esto. Revisa otra vez para ver preguntas nuevas.")}</p>` : ""}
    ${body}
  </section>`;
}

export function transferHTML(I, t, cs) {
  const rec = cs.stages.transfer || {};
  const tc = t.caseDef.transfer;
  return html`<section class="ex-manuscript sl-phenomenon" aria-labelledby="slTfTitle">
      <p class="ex-kicker">${I.T("A new phenomenon", "Un fenómeno nuevo")}</p>
      <h2 id="slTfTitle" class="visually-hidden">
        ${I.T("Read the new situation", "Lee la situación nueva")}
      </h2>
      ${transferSceneHTML(I, tc)}
      <p class="ex-manuscript-prompt">${I.TO(tc.phenomenon)}</p>
      <p>${I.TO(tc.prompt)}</p>
    </section>
    ${panel("slTfData", I.T("The data", "Los datos"), html`${dataNoteHTML(I, tc)}<p class="slx-steps">${I.T("Choose the rows that support your claim: tap a bar or a row.", "Elige las filas que apoyan tu afirmación: toca una barra o una fila.")}</p>${evidencePickerHTML(I, tc, dataRows(tc), "transfer:evidenceIds", rec.evidenceIds || [], "slx-tf")}`)}
    ${panel(
      "slTfWrite",
      I.T("Your investigation", "Tu investigación"),
      html`${fieldHTML(I, { stage: "transfer", name: "question", label: I.T("A question you could test", "Una pregunta que podrías comprobar"), value: rec.question || "", rows: 2, required: true })}
        ${fieldHTML(I, { stage: "transfer", name: "claim", label: I.T("A claim about this data", "Una afirmación sobre estos datos"), value: rec.claim || "", rows: 3, required: true })}
        ${fieldHTML(I, { stage: "transfer", name: "reasoning", label: I.T("Your reasoning", "Tu razonamiento"), hint: I.T("Connect the tests you chose to your claim.", "Conecta las pruebas que elegiste con tu afirmación."), value: rec.reasoning || "", rows: 4, required: true })}
        ${savedNote(I)}
        <div class="row-actions">
          <button type="button" class="btn" data-sl-check="transfer">
            ${icon("check")} ${I.T("Check my words", "Revisar mis palabras")}
          </button>
        </div>
        ${rec.chk ? transferFeedbackHTML(I, t, rec) : ""}`,
    )}`;
}

