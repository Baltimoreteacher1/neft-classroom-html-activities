/**
 * Family Practice: the markup of the five steps, built from the lesson's OWN authored sidecar
 * (data/family-homework-notes/<id>.json: v3, conceptSteps, tryTogether, corner, bridge). No unit-level
 * fallback text is invented here; a piece the lesson did not author is simply absent.
 *
 *   1 Look & Learn      connect   goal, one worked example, the model picture
 *   2 Try Together      explore   one guided problem, the interactive model, one optional family question
 *   3 Your Turn         check     three problems one at a time: A understand, B solve, C use
 *   4 Check & Improve   improve   built from what the family did: fix, then a fresh try
 *   5 Finish            done      what was practiced, one strength, one next step, one family question
 *
 * Pure functions: data in, markup out. The runtime that fills Check & Improve and Finish lives in
 * homework-flow-js.mjs.
 */
import { act } from "./homework-actions.mjs";

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const bi = (en, es) =>
  `<span class="lang-en">${esc(en)}</span><span class="lang-es" lang="es">${esc(es ?? en)}</span>`;
const pair = (p) => bi(p?.en, p?.es);

/** The family discussion question for Try Together: the lesson's own corner question, else its prediction prompt. */
export function tryQuestion(notes) {
  return notes?.corner?.question?.en ? notes.corner.question : notes?.v3?.hook?.guess || null;
}

/** The family discussion question for Finish: the lesson's own table prompt. */
export function finishQuestion(notes) {
  return notes?.v3?.kitchenTable?.en ? notes.v3.kitchenTable : notes?.corner?.question || null;
}

const hint = (hintEn, hintEs, moreEn, moreEs) =>
  hintEn
    ? `<details class="fp-hint"><summary>${bi("Hint", "Pista")}</summary>
        <p>${bi(hintEn, hintEs)}</p>
        ${moreEn ? `<details class="fp-hint fp-hint--more"><summary>${bi("More help", "Más ayuda")}</summary><p>${bi(moreEn, moreEs)}</p></details>` : ""}
      </details>`
    : "";

/** A step's heading band: number, name, and the one thing to do. Same markup on every step. */
export function stepHead(n, titleEn, titleEs, leadEn, leadEs) {
  return `
      <header class="fp-head">
        <p class="fp-kicker">${bi(`Step ${n} of 5`, `Paso ${n} de 5`)}</p>
        <h2 class="fp-title">${bi(titleEn, titleEs)}</h2>
        <p class="fp-lead">${bi(leadEn, leadEs)}</p>
      </header>`;
}

/** Step 1. Goal, one worked example (numbered, bilingual), the picture, why it works. */
export function renderLookAndLearn(
  config,
  { modelHtml = "", wordsHtml = "", noticeHtml = "", warmupHtml = "" },
) {
  const notes = config?.familyNotes || {};
  const goal =
    notes.v3?.standardPlain ||
    notes.learningTonight ||
    (config?.title
      ? {
          en: `Practice ${config.title.toLowerCase()} with visual models and step-by-step strategies.`,
          es: `Practica ${config.title.toLowerCase()} con modelos visuales y estrategias paso a paso.`,
        }
      : null);
  const steps = Array.isArray(notes.conceptSteps) ? notes.conceptSteps : [];
  const why = notes.bridge?.why;
  return `
      ${stepHead(1, "Look & Learn", "Mira y aprende", "Read the goal, follow the example, then look at the picture.", "Lean la meta, sigan el ejemplo y luego miren el dibujo.")}
      ${
        goal
          ? `<section class="fp-card fp-goal" aria-labelledby="hw_goal_label">
        <p class="fp-label" id="hw_goal_label">${bi("Today's goal", "La meta de hoy")}</p>
        <p class="fp-goal-text">${pair(goal)}</p>
      </section>`
          : ""
      }
      ${
        steps.length
          ? `<section class="fp-card fp-example" aria-labelledby="hw_example_label">
        <p class="fp-label" id="hw_example_label">${bi("Worked example", "Ejemplo resuelto")}</p>
        <ol class="fp-steps">${steps.map((s) => `<li>${pair(s)}</li>`).join("")}</ol>
        ${why ? `<p class="fp-why"><strong>${bi("Why it works", "Por qué funciona")}</strong> ${pair(why)}</p>` : ""}
      </section>`
          : ""
      }
      ${modelHtml}
      ${wordsHtml ? `<details class="fp-optional"><summary>${bi("Words to know (optional)", "Palabras que conviene saber (opcional)")}</summary>${wordsHtml}</details>` : ""}
      ${noticeHtml ? `<details class="fp-optional"><summary>${bi("Say what you notice (optional)", "Cuenten qué notan (opcional)")}</summary>${noticeHtml}</details>` : ""}
      ${warmupHtml ? `<details class="fp-optional"><summary>${bi("Quick look back (optional)", "Un repaso rápido (opcional)")}</summary>${warmupHtml}</details>` : ""}`;
}

/** Step 2. One guided problem tied to the example, the interactive model, one family question. */
export function renderTryTogether(
  config,
  { modelHtml = "", toolHtml = "", morePicturesHtml = "" },
) {
  const notes = config?.familyNotes || {};
  const t = notes.tryTogether || {};
  const steps = Array.isArray(t.steps) ? t.steps : [];
  const q = tryQuestion(notes);
  return `
      ${stepHead(2, "Try Together", "Prueben juntos", "Do this one side by side. Use the model, and ask for a hint whenever you want one.", "Háganlo lado a lado. Usen el modelo y pidan una pista cuando quieran.")}
      <section class="fp-card fp-try" aria-labelledby="hw_try_label">
        <p class="fp-label" id="hw_try_label">${bi("Try this one together", "Prueben este juntos")}</p>
        ${t.scenarioEn ? `<p class="fp-try-scenario">${bi(t.scenarioEn, t.scenarioEs)}</p>` : ""}
        <ol class="fp-steps fp-steps--try">
          ${steps.map((s) => `<li><p>${pair(s)}</p>${hint(s.hint, s.hintEs, s.helpEn, s.helpEs)}</li>`).join("")}
        </ol>
      </section>
      ${modelHtml}
      ${toolHtml}
      ${morePicturesHtml ? `<details class="fp-optional"><summary>${bi("More ways to see it (optional)", "Más formas de verlo (opcional)")}</summary>${morePicturesHtml}</details>` : ""}
      ${q ? `<aside class="fp-family" aria-label="${esc("Family question")}"><p class="fp-label">${bi("Ask together (optional)", "Pregunten juntos (opcional)")}</p><p>${pair(q)}</p></aside>` : ""}`;
}

/** Step 3's header and its A/B/C key. The problems themselves come from the problem renderer. */
export function renderYourTurnHead() {
  return `
      ${stepHead(3, "Your Turn", "Tu turno", "One at a time. Work on your own; a grown-up can watch.", "Uno a la vez. Trabaja solo; un adulto puede observar.")}`;
}

/** Step 4: filled by the runtime from what the family did. Empty until there is something to review. */
export function renderImprove() {
  return `
    <div class="tab-panel-inner" data-tab-panel="improve" id="hw_panel_improve" role="tabpanel" hidden>
      ${stepHead(4, "Check & Improve", "Revisa y mejora", "See what each answer shows. Fix one, then try a fresh one.", "Vean qué muestra cada respuesta. Corrijan una y prueben una nueva.")}
      <p class="fp-empty" data-improve-empty>${bi("Finish Your Turn first. Then this page shows what each answer tells us.", "Primero terminen Tu turno. Luego esta página muestra qué nos dice cada respuesta.")}</p>
      <div class="fp-improve" id="hw_improve" data-improve-body aria-live="polite"></div>
    </div>`;
}

/** The way back from an optional stop. Optional stops are not on the path, so Back/Next are hidden there. */
export const backToPath = `
      <div class="tab-flow-nav fp-nav fp-nav--back">
        <button type="button" class="btn btn-outline-primary" ${act("switchHomeworkTab", "done")}>
          <span class="lang-en">Back to Finish</span><span class="lang-es" lang="es">Volver a Terminar</span>
        </button>
      </div>`;
