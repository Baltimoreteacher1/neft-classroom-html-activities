// Science Investigation Lab: plan a fair test with a live apparatus preview.
// The radios (data-sl-var) and the trials field are the same saved plan fields as before (changed, held, trials);
// the preview (data-sl-preview) is redrawn in place from them, so focus never moves while the learner builds.
import { html, raw } from "../util.js";
import { setupSceneHTML, varIconSVG } from "./science-lab-scene.js";
import { checkBlockHTML } from "./science-lab-text.js";
import { echoHTML, fieldHTML, savedNote } from "./science-lab-ui.js";

const CHOICES = [
  ["change", "Change it", "Cambiarlo"],
  ["held", "Keep it the same", "Mantenerlo igual"],
  ["none", "Not decided", "Sin decidir"],
];

function variableHTML(I, caseDef, v, rec) {
  const now = (rec.changed || []).includes(v.id)
    ? "change"
    : (rec.held || []).includes(v.id)
      ? "held"
      : "none";
  return html`<fieldset class="sl-choice sl-var slx-var is-${now}">
    <legend>${I.TO(v.label)}</legend>
    <div class="slx-var-head">
      ${varIconSVG(caseDef, v.id)}
      <p class="fine">${v.values.map((x) => I.S(x.label.en, x.label.es)).join(" · ")}</p>
    </div>
    <div class="slx-seg">
      ${CHOICES.map(([id, en, es]) => html`<label class="sl-radio"><input type="radio" name="slvar-${v.id}" value="${id}" data-sl-var="${v.id}" ${now === id ? raw("checked") : ""} /> ${I.T(en, es)}</label>`)}
    </div>
  </fieldset>`;
}

/** The live preview for the saved plan, or for the values on screen when `trials` is passed in. */
export const planPreviewHTML = (I, t, rec, trials = rec.trials) =>
  setupSceneHTML(I, t.caseDef, { changed: rec.changed || [], held: rec.held || [], trials });

export function planHTML(I, t, cs) {
  const rec = cs.stages.plan || {};
  return html`<section class="panel sl-work sl-plan-build" aria-labelledby="slPlanVars">
      <h2 id="slPlanVars">
        ${I.T("Set up a fair test: change one thing, keep the rest the same", "Prepara una prueba justa: cambia una cosa y mantén lo demás igual")}
      </h2>
      ${echoHTML(I, I.T("Your prediction", "Tu predicción"), cs.stages.hypothesis?.text)}
      <div class="slx-builder">
        <div class="slx-builder-controls">
          ${t.caseDef.variables.map((v) => variableHTML(I, t.caseDef, v, rec))}
          <div class="field sl-field slx-trials">
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
        </div>
        <div class="slx-builder-preview" aria-live="polite">${planPreviewHTML(I, t, rec)}</div>
      </div>
    </section>
    <section class="panel sl-work" aria-labelledby="slPlanMeasure">
      <h2 id="slPlanMeasure">${I.T("Write what you will measure", "Escribe qué vas a medir")}</h2>
      ${fieldHTML(I, { stage: "plan", name: "measure", label: I.T("What will you measure?", "¿Qué vas a medir?"), value: rec.measure || "", rows: 2 })}
      ${fieldHTML(I, { stage: "plan", name: "steps", label: I.T("Steps (optional)", "Pasos (opcional)"), value: rec.steps || "", rows: 3 })}
      ${savedNote(I)}${checkBlockHTML(I, t, cs, "plan")}
    </section>`;
}
