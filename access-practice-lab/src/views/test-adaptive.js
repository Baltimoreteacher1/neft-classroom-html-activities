// "Rehearsal that adapts" — the view side of src/lang/rehearsal-route.js for the practice-test runner.
// Learners see only that the next part was chosen from their answers; the set (easier/harder prompt set) is shown
// in the teacher view of the report (?tab=review), never on a learner screen, and never as a tier, level or score.
import { loadDomain } from "../content.js";
import {
  adaptiveEligible,
  buildRoute,
  isRoutedDomain,
  routedTest,
  routeTeacherText,
  ROUTE_SETS,
} from "../lang/rehearsal-route.js";
import { BASE, html, icon, raw } from "../util.js";

export { adaptiveEligible, isRoutedDomain };

const pools = new Map(); // band → Promise<{ Speaking: {A, C}, Writing: {A, C} }>

/** The more-supported and more-demanding prompt sets for a band, from the lab's own Speaking and Writing content. */
export function loadPools(band) {
  if (!pools.has(band))
    pools.set(
      band,
      Promise.all(["Speaking", "Writing"].map((d) => loadDomain(band, d).catch(() => null))).then(
        ([sp, wr]) => {
          const pick = (data) =>
            Object.fromEntries(
              Object.values(ROUTE_SETS).map((lv) => [lv, data?.levels?.[lv]?.activities || []]),
            );
          return { Speaking: pick(sp), Writing: pick(wr) };
        },
      ),
    );
  return pools.get(band);
}

/** `/test/<id>?adapt=1` (from the test list) turns the adaptive flow on before a run starts. */
export const requestedAdaptive = () =>
  new URLSearchParams(globalThis.location?.search || "").get("adapt") === "1";
export const teacherView = () =>
  new URLSearchParams(globalThis.location?.search || "").get("tab") === "review";

/** Route once, from the run so far. Returns the record to store, with the time it was decided. */
export function decideRoute(test, outcomes, pool) {
  return { ...buildRoute(test, outcomes, pool), at: new Date().toISOString() };
}
export const applyRoute = (test, route, pool) =>
  route && pool ? routedTest(test, route, pool) : test;
export const routeApplied = (route) => Boolean(route && Object.keys(route.items || {}).length);

/** Opt-in switch on the intro screen. Off by default; the fixed form is unchanged unless the learner turns it on. */
export function adaptiveOptionHTML(I, rec, { started }) {
  return html`<fieldset class="test-adapt">
    <legend>
      ${icon("growth")}
      ${I.T("Rehearsal that adapts (optional)", "Ensayo que se adapta (opcional)")}
    </legend>
    <label class="timer-opt opt-row"
      ><input
        type="checkbox"
        data-adaptive
        ${rec.adaptive ? raw("checked") : ""}
        ${started ? raw("disabled") : ""}
      />
      <span
        >${I.T("After Listening and Reading, choose my Speaking and Writing tasks from my answers, like the real test does.", "Después de Escuchar y Leer, elegir mis tareas de Hablar y Escribir según mis respuestas, como lo hace la prueba real.")}</span
      ></label
    >
    <p class="fine">
      ${started ? I.T("Start over to change this.", "Empieza de nuevo para cambiar esto.") : I.T("Off: everyone gets the same fixed tasks. This is practice, not a score.", "Desactivado: todos reciben las mismas tareas fijas. Esto es práctica, no un puntaje.")}
    </p>
  </fieldset>`;
}

/** Shown on the first question of each routed part. Says how the part was chosen — never which set it is. */
export function routeNoticeHTML(I) {
  return html`<p class="section-directions test-route-note" role="note">
    ${icon("growth")}<span
      >${I.T("Your next part was chosen from your answers, like the real test does. This is practice, not a score.", "Tu siguiente parte se eligió según tus respuestas, como lo hace la prueba real. Esto es práctica, no un puntaje.")}</span
    >
  </p>`;
}

/** Results page: a link to the teacher view, and in that view the route as "easier/harder prompt set". */
export function teacherRouteHTML(I, rec, testId, band) {
  if (!rec.adaptive) return "";
  if (!teacherView())
    return html`<p class="fine test-teacher-link">
      ${icon("teacher")}
      <a href="${BASE}/test/${testId}?grades=${band}&tab=review"
        >${I.T("Teacher view of this report", "Vista docente de este informe")}</a
      >
    </p>`;
  const r = rec.route;
  const body = !r
    ? I.T(
        "Rehearsal that adapts was on, but the run ended before Speaking and Writing, so no prompt set was chosen.",
        "El ensayo que se adapta estaba activado, pero la prueba terminó antes de Hablar y Escribir, así que no se eligió ningún conjunto de tareas.",
      )
    : !routeApplied(r)
      ? I.T(
          "Rehearsal that adapts was on, but the prompt sets could not load, so the form's fixed Speaking and Writing tasks were used.",
          "El ensayo que se adapta estaba activado, pero los conjuntos de tareas no cargaron, así que se usaron las tareas fijas de Hablar y Escribir.",
        )
      : I.T(
          `Speaking and Writing came from the ${routeTeacherText(r)[0]}, chosen from ${r.right} of ${r.total} auto-checked Listening and Reading answers. This routes practice prompts only; it is not a tier, level or placement.`,
          `Hablar y Escribir vinieron del ${routeTeacherText(r)[1]}, elegido a partir de ${r.right} de ${r.total} respuestas de Escuchar y Leer revisadas automáticamente. Esto solo elige tareas de práctica; no es un tier, nivel ni ubicación.`,
        );
  return html`<section class="panel test-teacher-route" aria-labelledby="routeTitle">
    <h2 id="routeTitle">
      ${icon("teacher")}
      ${I.T("For the teacher: rehearsal that adapts", "Para el docente: ensayo que se adapta")}
    </h2>
    <p>${body}</p>
  </section>`;
}
