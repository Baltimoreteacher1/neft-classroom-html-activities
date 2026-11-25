// Teach It Back: the markup for choosing, learning and planning. Pure functions of data: no storage, no recorder.
// Concept text follows the lab language mode (I.T); key words always carry their Spanish; the learner's own words
// are never relabelled. Handlers live in views/teach-back.js.
import { html, icon, raw } from "../util.js";
import { SUBJECT_LABEL, bySubject } from "./concepts.js";
import { visualSVG } from "./visuals.js";

export const STEP_LABEL = [
  ["Learn", "Aprende"],
  ["Plan", "Planea"],
  ["Teach", "Enseña"],
  ["Feedback", "Comentarios"],
  ["On my own", "Por mi cuenta"],
  ["Done", "Listo"],
];

const stepIndex = (sess) =>
  sess.step === "done" ? 5 : sess.phase === "own" || sess.step === "own" ? 4 : { learn: 0, plan: 1, teach: 2, feedback: 3 }[sess.step] ?? 0;

/** "Step 3 of 6" as a list. The current step is named in text and marked, never shown by colour alone. */
export function stepperHTML(I, sess) {
  const at = stepIndex(sess);
  return html`<ol class="tb-steps" aria-label="${I.S("Steps", "Pasos")}">
    ${STEP_LABEL.map(
      ([en, es], i) =>
        html`<li class="tb-step" aria-current="${i === at ? "step" : "false"}">
          <span class="tb-step-n" aria-hidden="true">${i < at ? icon("check") : i + 1}</span>
          <span>${I.T(en, es)}${i === at ? html`<span class="sr-only"> (${I.S("you are here", "estás aquí")})</span>` : ""}</span>
        </li>`,
    )}
  </ol>`;
}

export const pointTitle = (I, p) => I.T(p.en, p.es);

const backToIdeas = (I) =>
  html`<button type="button" class="btn ghost" data-tb-home>${icon("arrow-left")} ${I.T("All ideas", "Todas las ideas")}</button>`;

function resumeHTML(I, state, concept) {
  const sess = state.session;
  if (!concept) return "";
  const where = STEP_LABEL[stepIndex(sess)];
  return html`<section class="panel tb-resume" aria-labelledby="tbResumeH">
    <h2 id="tbResumeH">${I.T("Pick up where you left off", "Sigue donde lo dejaste")}</h2>
    <p>
      <strong>${I.T(concept.title.en, concept.title.es)}</strong> ·
      ${I.T("step", "paso")}: ${I.T(...where)}
    </p>
    <button type="button" class="btn primary" data-tb-resume>${icon("arrow-right")} ${I.T("Continue", "Continuar")}</button>
    <p class="fine">${I.T("Choosing a different idea below replaces this one.", "Elegir otra idea abajo reemplaza esta.")}</p>
  </section>`;
}

export function pickHTML(I, band, state, resumeConcept) {
  return html`${state.session ? resumeHTML(I, state, resumeConcept) : ""}
    ${bySubject(band).map(
      ({ subject, items }) =>
        html`<section class="tb-subject" aria-labelledby="tbSub-${subject.replace(/\s/g, "-")}">
          <h2 id="tbSub-${subject.replace(/\s/g, "-")}">${I.T(...SUBJECT_LABEL[subject])}</h2>
          <ul class="tb-cards">
            ${items.map(
              (c) =>
                html`<li>
                  <button type="button" class="tb-card" data-tb-pick="${c.id}">
                    <span class="tb-card-title">${I.T(c.title.en, c.title.es)}</span>
                    ${state.explained[c.id] ? html`<span class="tb-chip">${icon("check")} ${I.T("Explained before", "Ya lo explicaste")}</span>` : ""}
                  </button>
                </li>`,
            )}
          </ul>
        </section>`,
    )}`;
}

export function termsHTML(I, concept) {
  return html`<dl class="tb-terms">
    ${concept.terms.map(
      (t) =>
        html`<div class="tb-term">
          <dt><span lang="en">${t.w}</span> <span class="tb-es" lang="es">${t.es}</span></dt>
          <dd lang="en">${t.gloss}</dd>
        </div>`,
    )}
  </dl>`;
}

export function learnHTML(I, concept, sess) {
  const own = sess.phase === "own";
  return html`<section aria-labelledby="tbStepH" class="tb-learn">
    <h2 id="tbStepH" tabindex="-1">${own ? I.T("On my own: learn this idea", "Por mi cuenta: aprende esta idea") : I.T("Learn the idea", "Aprende la idea")}</h2>
    <p class="tb-idea-title">${I.T(concept.title.en, concept.title.es)}</p>
    <div class="tb-learn-grid">
      <div class="panel tb-idea">
        <h3>${I.T("The idea", "La idea")}</h3>
        <p>${I.T(concept.idea.en, concept.idea.es)}</p>
      </div>
      ${concept.visual ? html`<figure class="panel tb-figure">${raw(visualSVG(concept.visual, `tbV-${concept.id}`))}</figure>` : ""}
    </div>
    <div class="panel">
      <h3>${I.T("Key words", "Palabras clave")}</h3>
      ${termsHTML(I, concept)}
    </div>
    <p class="tb-job"><strong>${I.T("Your job", "Tu tarea")}:</strong> ${I.T(concept.audience.en, concept.audience.es)}</p>
    ${own ? html`<p class="fine">${I.T("This time there are no sentence frames. Same thinking, fewer supports.", "Esta vez no hay estructuras de oración. El mismo pensamiento, con menos apoyos.")}</p>` : ""}
    <div class="row-actions">
      ${backToIdeas(I)}
      <button type="button" class="btn primary" data-tb-go="${own ? "teach" : "plan"}">
        ${own ? I.T("Explain it on my own", "Explicarlo por mi cuenta") : I.T("Plan what to say", "Planear qué decir")} ${icon("arrow-right")}
      </button>
    </div>
  </section>`;
}

export function planHTML(I, concept, sess) {
  return html`<section aria-labelledby="tbStepH" class="tb-plan">
    <h2 id="tbStepH" tabindex="-1">${I.T("Plan what to say", "Planea qué decir")}</h2>
    <p class="lead">${I.T("Tick the key points you plan to include. This is your own plan. It is not graded.", "Marca las ideas clave que piensas incluir. Es tu propio plan. No se califica.")}</p>
    <fieldset class="tb-plan-set">
      <legend>${I.T("My plan", "Mi plan")}</legend>
      ${concept.points.map(
        (p, i) =>
          html`<label class="tb-plan-card">
            <input type="checkbox" name="tbPlan" value="${p.id}" ${sess.plan.includes(p.id) ? "checked" : ""} />
            <span><strong>${I.T("Key point", "Idea clave")} ${i + 1}</strong><br />${pointTitle(I, p)}</span>
          </label>`,
      )}
    </fieldset>
    <div class="row-actions">
      <button type="button" class="btn ghost" data-tb-go="learn">${icon("arrow-left")} ${I.T("Back", "Atrás")}</button>
      <button type="button" class="btn primary" data-tb-go="teach">${I.T("Start teaching", "Empezar a enseñar")} ${icon("arrow-right")}</button>
    </div>
  </section>`;
}

