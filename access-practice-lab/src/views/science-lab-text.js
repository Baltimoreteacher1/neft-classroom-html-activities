// Science Investigation Lab: the writing stages that run a check (notice, question, prediction, plan, claim, reasoning).
// The saved `chk` is a snapshot of the exact words checked, so reloading shows the same questions.
import { html, icon } from "../util.js";
import { cerDiagramHTML, claimSceneHTML } from "./science-lab-argue.js";
import { inputOf, pairNotes, runCheck } from "./science-lab-model.js";
import {
  chipsHTML,
  noticeSceneHTML,
  predictHTML,
  questionBuilderHTML,
} from "./science-lab-steps.js";
import { echoHTML, feedbackHTML, fieldHTML, savedNote } from "./science-lab-ui.js";


/** The check button and, once a check has run, its feedback. */
export function checkBlockHTML(I, t, cs, stage) {
  const rec = cs.stages[stage] || {};
  const button = html`<div class="row-actions">
    <button type="button" class="btn" data-sl-check="${stage}">
      ${icon("check")} ${I.T("Check my words", "Revisar mis palabras")}
    </button>
  </div>`;
  if (!rec.chk) return button;
  const stale = JSON.stringify(rec.chk) !== JSON.stringify(inputOf(stage, rec, cs));
  return html`${button}${feedbackHTML(I, pairNotes(runCheck(stage, rec.chk, t.caseDef)), { stale })}`;
}

const panel = (I, id, title, body) =>
  html`<section class="panel sl-work" aria-labelledby="${id}">
    <h2 id="${id}">${title}</h2>
    ${body}
  </section>`;

export function noticeHTML(I, t, cs) {
  const rec = cs.stages.notice || {};
  const chips = rec.chips || [];
  return html`${noticeSceneHTML(I, t, rec)}
    <details class="ex-manuscript sl-phenomenon" open>
      <summary class="ex-kicker">${I.T("The story", "La historia")}</summary>
      <h2 id="slPhTitle" class="visually-hidden">
        ${I.T("Read and look closely", "Lee y observa con cuidado")}
      </h2>
      <p class="ex-manuscript-prompt">${I.TO(t.caseDef.phenomenon)}</p>
    </details>
    ${panel(
      I,
      "slNoticeTitle",
      I.T("Write what you notice and wonder", "Escribe lo que observas y te preguntas"),
      html`${chipsHTML(I, t.caseDef, chips, "n")}
      ${fieldHTML(I, { stage: "notice", name: "notice", label: I.T("I notice that…", "Noto que…"), hint: I.T("Use your own words. Your notes above can help.", "Usa tus propias palabras. Tus notas de arriba pueden ayudarte."), value: rec.notice || "", required: true })}
      ${chipsHTML(I, t.caseDef, chips, "w")}
      ${fieldHTML(I, { stage: "notice", name: "wonder", label: I.T("I wonder…", "Me pregunto…"), value: rec.wonder || "" })}
      ${savedNote(I)}`,
    )}`;
}

export function questionHTML(I, t, cs) {
  const rec = cs.stages.question || {};
  return html`${questionBuilderHTML(I, t, rec)}${panel(
    I,
    "slQuestionTitle",
    I.T("Write a question you can test", "Escribe una pregunta que puedas comprobar"),
    html`${echoHTML(I, I.T("Earlier you wondered", "Antes te preguntaste"), cs.stages.notice?.wonder)}
    ${fieldHTML(I, { stage: "question", name: "text", label: I.T("Your question", "Tu pregunta"), hint: I.T("A test should be able to answer it.", "Una prueba debería poder responderla."), value: rec.text || "", rows: 3, required: true })}
    ${savedNote(I)}${checkBlockHTML(I, t, cs, "question")}`,
  )}`;
}

export function hypothesisHTML(I, t, cs) {
  const rec = cs.stages.hypothesis || {};
  return html`${predictHTML(I, t, rec)}${panel(
    I,
    "slHypTitle",
    I.T("Write a prediction with a reason", "Escribe una predicción con una razón"),
    html`${echoHTML(I, I.T("Your question", "Tu pregunta"), cs.stages.question?.text)}
    ${fieldHTML(I, { stage: "hypothesis", name: "text", label: I.T("Your prediction", "Tu predicción"), hint: I.T("Say what you will change, what you think will happen, and why.", "Di qué vas a cambiar, qué crees que pasará y por qué."), value: rec.text || "", rows: 4, required: true })}
    ${savedNote(I)}${checkBlockHTML(I, t, cs, "hypothesis")}`,
  )}`;
}

export function claimHTML(I, t, cs) {
  const rec = cs.stages.claim || {};
  return html`${claimSceneHTML(I, t, cs)}${panel(
    I,
    "slClaimTitle",
    I.T("Make a claim", "Haz una afirmación"),
    html`${echoHTML(I, I.T("The question your claim answers", "La pregunta que responde tu afirmación"), I.S(t.caseDef.question.en, t.caseDef.question.es))}
    ${fieldHTML(I, { stage: "claim", name: "text", label: I.T("Your claim", "Tu afirmación"), hint: I.T("Say what you compared and what you found.", "Di qué comparaste y qué encontraste."), value: rec.text || "", rows: 4, required: true })}
    ${savedNote(I)}${checkBlockHTML(I, t, cs, "claim")}`,
  )}`;
}

export function reasoningHTML(I, t, cs) {
  const rec = cs.stages.reasoning || {};
  const diagram = html`<section class="panel sl-scene-panel slx-argue" aria-labelledby="slCerTitle">
    <h2 id="slCerTitle">${I.T("See how your argument fits together", "Mira cómo encaja tu argumento")}</h2>
    ${cerDiagramHTML(I, t, cs, rec.text)}
  </section>`;
  return html`${diagram}${panel(
    I,
    "slReasonTitle",
    I.T(
      "Explain why your evidence supports your claim",
      "Explica por qué tu evidencia apoya tu afirmación",
    ),
    html`${fieldHTML(I, { stage: "reasoning", name: "text", label: I.T("Your reasoning", "Tu razonamiento"), hint: I.T("Connect the tests you chose to your claim. The diagram above fills in as you type.", "Conecta las pruebas que elegiste con tu afirmación. El diagrama de arriba se llena mientras escribes."), value: rec.text || "", rows: 5, required: true })}
    ${savedNote(I)}${checkBlockHTML(I, t, cs, "reasoning")}`,
  )}`;
}
