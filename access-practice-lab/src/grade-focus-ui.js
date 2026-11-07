// The Grade 6 / 7 / 8 focus control for the 6-8 band, used by the skill room, the activity library and the home
// grade picker. One component; main.js handles its clicks for every view (`data-grade-focus`).
import { GRADE_FOCUS, gradeFocusLabel } from "./grade-focus.js";
import { html } from "./util.js";

/** Spoken after a focus is chosen. */
export const announceGradeFocus = (I, focus) =>
  focus
    ? I.S(
        `Showing activities for ${gradeFocusLabel(focus)[0]} and activities that work for every grade.`,
        `Mostrando actividades para ${gradeFocusLabel(focus)[1].toLowerCase()} y actividades que sirven para todos los grados.`,
      )
    : I.S("Showing every activity in grades 6 to 8.", "Mostrando todas las actividades de 6.º a 8.º grado.");

/**
 * The control. `counts` (optional, from content/index.json gradeBands[6-8].gradeFocus) adds how many activities
 * each choice lists. `labelId` must be unique on the page.
 */
export function gradeFocusHTML(I, focus, { labelId = "gradeFocusLabel", counts = null, note = true } = {}) {
  const count = (id) => counts?.find((c) => c.id === id)?.count;
  return html`<div class="grade-focus">
    <p class="grade-focus-label" id="${labelId}">${I.T("Grade focus", "Enfoque por grado")}</p>
    <div class="band-switch" role="group" aria-labelledby="${labelId}">
      ${GRADE_FOCUS.map((f) => {
        const n = count(f.id);
        return html`<button type="button" class="band-btn" data-grade-focus="${f.id}" aria-pressed="${f.id === focus}"
          >${I.T(f.label[0], f.label[1])}${n == null ? "" : html` <span class="grade-focus-n">${n}</span>`}</button
        >`;
      })}
    </div>
    ${note ? html`<p class="fine grade-focus-note">${focus ? I.T("Shows activities written for this grade and activities that work for every grade. Nothing is locked.", "Muestra actividades escritas para este grado y actividades que sirven para todos los grados. Nada está bloqueado.") : I.T("Shows every activity. Choose a grade to see the ones written for it.", "Muestra todas las actividades. Elige un grado para ver las escritas para él.")}</p>` : ""}
  </div>`;
}
