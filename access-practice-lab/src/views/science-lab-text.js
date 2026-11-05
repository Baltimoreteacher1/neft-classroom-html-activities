// Science Investigation Lab: the writing stages that run a check (notice, question, prediction, plan, claim, reasoning).
// The saved `chk` is a snapshot of the exact words checked, so reloading shows the same questions.
import { html, icon, raw } from "../util.js";
import { chosenRowsHTML } from "./science-lab-data.js";
import { inputOf, pairNotes, runCheck } from "./science-lab-model.js";
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
  return html`<section class="ex-manuscript sl-phenomenon" aria-labelledby="slPhTitle">
      <p class="ex-kicker">${I.T("The phenomenon", "El fenómeno")}</p>
      <h2 id="slPhTitle" class="visually-hidden">
        ${I.T("Read and look closely", "Lee y observa con cuidado")}
      </h2>
      <p class="ex-manuscript-prompt">${I.TO(t.caseDef.phenomenon)}</p>
    </section>
    ${panel(
      I,
      "slNoticeTitle",
      I.T("What do you notice? What do you wonder?", "¿Qué observas? ¿Qué te preguntas?"),
      html`${fieldHTML(I, { stage: "notice", name: "notice", label: I.T("I notice that…", "Noto que…"), value: rec.notice || "", required: true })}
      ${fieldHTML(I, { stage: "notice", name: "wonder", label: I.T("I wonder…", "Me pregunto…"), value: rec.wonder || "" })}
      ${savedNote(I)}`,
    )}`;
}

export function questionHTML(I, t, cs) {
  const rec = cs.stages.question || {};
  return panel(
    I,
    "slQuestionTitle",
    I.T("Write a question you can test", "Escribe una pregunta que puedas comprobar"),
    html`${echoHTML(I, I.T("Earlier you wondered", "Antes te preguntaste"), cs.stages.notice?.wonder)}
    ${fieldHTML(I, { stage: "question", name: "text", label: I.T("Your question", "Tu pregunta"), hint: I.T("A test should be able to answer it.", "Una prueba debería poder responderla."), value: rec.text || "", rows: 3, required: true })}
    ${savedNote(I)}${checkBlockHTML(I, t, cs, "question")}`,
  );
}

export function hypothesisHTML(I, t, cs) {
  const rec = cs.stages.hypothesis || {};
  return panel(
    I,
    "slHypTitle",
    I.T("Write a prediction with a reason", "Escribe una predicción con una razón"),
    html`${echoHTML(I, I.T("Your question", "Tu pregunta"), cs.stages.question?.text)}
    ${fieldHTML(I, { stage: "hypothesis", name: "text", label: I.T("Your prediction", "Tu predicción"), hint: I.T("Say what you will change, what you think will happen, and why.", "Di qué vas a cambiar, qué crees que pasará y por qué."), value: rec.text || "", rows: 4, required: true })}
    ${savedNote(I)}${checkBlockHTML(I, t, cs, "hypothesis")}`,
  );
}

const CHOICES = [
  ["change", "I will change it", "Lo voy a cambiar"],
  ["held", "I will keep it the same", "Lo voy a mantener igual"],
  ["none", "Not decided yet", "Todavía no lo decido"],
];

function variableHTML(I, v, rec) {
  const now = (rec.changed || []).includes(v.id)
    ? "change"
    : (rec.held || []).includes(v.id)
      ? "held"
      : "none";
  return html`<fieldset class="sl-choice sl-var">
    <legend>${I.TO(v.label)}</legend>
    <p class="fine">${v.values.map((x) => I.S(x.label.en, x.label.es)).join(", ")}</p>
    ${CHOICES.map(([id, en, es]) => html`<label class="sl-radio"><input type="radio" name="slvar-${v.id}" value="${id}" data-sl-var="${v.id}" ${now === id ? raw("checked") : ""} /> ${I.T(en, es)}</label>`)}
  </fieldset>`;
}

export function planHTML(I, t, cs) {
  const rec = cs.stages.plan || {};
  return html`${panel(
    I,
    "slPlanVars",
    I.T(
      "What will you change and what will you keep the same?",
      "¿Qué vas a cambiar y qué vas a mantener igual?",
    ),
    html`${echoHTML(I, I.T("Your prediction", "Tu predicción"), cs.stages.hypothesis?.text)}
    ${t.caseDef.variables.map((v) => variableHTML(I, v, rec))}`,
  )}
  ${panel(
    I,
    "slPlanMeasure",
    I.T("What will you measure, and how many times?", "¿Qué vas a medir y cuántas veces?"),
    html`${fieldHTML(I, { stage: "plan", name: "measure", label: I.T("What will you measure?", "¿Qué vas a medir?"), value: rec.measure || "", rows: 2 })}
      <div class="field sl-field">
        <label for="slf-plan-trials"
          >${I.T("How many times will you repeat each test?", "¿Cuántas veces repetirás cada prueba?")}</label
        >
        <input
          id="slf-plan-trials"
          type="number"
          min="1"
          max="20"
          inputmode="numeric"
          data-sl-field="plan:trials"
          value="${rec.trials || ""}"
        />
      </div>
      ${fieldHTML(I, { stage: "plan", name: "steps", label: I.T("Steps (optional)", "Pasos (opcional)"), value: rec.steps || "", rows: 3 })}
      ${savedNote(I)}${checkBlockHTML(I, t, cs, "plan")}`,
  )}`;
}

export function claimHTML(I, t, cs) {
  const rec = cs.stages.claim || {};
  return panel(
    I,
    "slClaimTitle",
    I.T("Make a claim", "Haz una afirmación"),
    html`${echoHTML(I, I.T("The question your claim answers", "La pregunta que responde tu afirmación"), I.S(t.caseDef.question.en, t.caseDef.question.es))}
    ${fieldHTML(I, { stage: "claim", name: "text", label: I.T("Your claim", "Tu afirmación"), hint: I.T("Say what you compared and what you found.", "Di qué comparaste y qué encontraste."), value: rec.text || "", rows: 4, required: true })}
    ${savedNote(I)}${checkBlockHTML(I, t, cs, "claim")}`,
  );
}

export function reasoningHTML(I, t, cs) {
  const rec = cs.stages.reasoning || {};
  return panel(
    I,
    "slReasonTitle",
    I.T(
      "Explain why your evidence supports your claim",
      "Explica por qué tu evidencia apoya tu afirmación",
    ),
    html`${echoHTML(I, I.T("Your claim", "Tu afirmación"), cs.stages.claim?.text)}
    ${chosenRowsHTML(I, t.caseDef, cs.stages.evidence?.ids || [])}
    ${fieldHTML(I, { stage: "reasoning", name: "text", label: I.T("Your reasoning", "Tu razonamiento"), hint: I.T("Connect the tests you chose to your claim.", "Conecta las pruebas que elegiste con tu afirmación."), value: rec.text || "", rows: 5, required: true })}
    ${savedNote(I)}${checkBlockHTML(I, t, cs, "reasoning")}`,
  );
}
