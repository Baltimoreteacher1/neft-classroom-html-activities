// Vocabulary Academy · the one teacher-only panel inside the Lesson Builder (the lab's Resource Studio and Lesson
// Planner). It picks a unit from the Vocabulary Academy index, then hands the real work to the Lesson Builder's own
// model and print path (resource-studio.js, planner.js). The panel renders nothing unless this device is in teacher
// mode (the lab's existing audience memory or site teacher key, via the Core store's isTeacherMode).
import { html, icon } from "../../util.js";
import { getIndex, getUnit, getUnitsOfGrade } from "../data.js";
import { LESSONS } from "../contract.js";
import { isTeacherMode } from "../store.js";
import { PHASES } from "../../lesson-builder/rules.js";
import {
  RESOURCE_KINDS,
  applyUnitVocabulary,
  glossaryFromUnit,
  printHref,
  resourceHTML,
  resourceSheet,
} from "./resource-studio.js";
import { addStepToDay, addStepToPhase, planStep } from "./planner.js";

const ui = {
  grades: [],
  grade: "",
  units: [],
  unitId: "",
  unit: null,
  applied: false,
  tier: "B",
  key: false,
  letter: "",
  target: "",
};

/** Load the grade list once (cheap, cached by data.js). Safe to call on every render. */
export async function prepareStudioPanel() {
  if (!isTeacherMode() || ui.grades.length) return;
  const index = await getIndex();
  ui.grades = Object.entries(index.grades || {})
    .filter(([, g]) => g.unitCount > 0)
    .map(([id]) => id);
}

/** The unit's words, as the pack export's glossary, once the teacher has put the unit into the lesson. */
export const studioGlossary = () => (ui.applied && ui.unit ? glossaryFromUnit(ui.unit) : null);

const opt = (value, label, current) =>
  html`<option value="${value}" ${String(current) === String(value) ? "selected" : ""}>
    ${label}
  </option>`;

export function studioPanelHTML(I, { lesson = null, week = null } = {}) {
  if (!isTeacherMode()) return "";
  const phaseName = (k) => PHASES[k]?.name?.[0] || k;
  return html`<section class="panel va-int-studio" aria-labelledby="vaStudioTitle">
    <h2 id="vaStudioTitle" class="workbook-heading">
      ${icon("words")} ${I.T("Vocabulary Academy", "Academia de Vocabulario")}
    </h2>
    <p class="fine">
      ${I.T("Use a lesson's words in this lesson, print a resource made from the lesson, or add a lesson or lesson to your plan. Teacher tools; students do not see this.", "Usa las palabras de una lección en esta lección, imprime un recurso hecho con la lección o agrega una lección o lección a tu plan. Herramientas para docentes; los estudiantes no ven esto.")}
    </p>
    ${
      ui.grades.length
        ? html`<div class="va-int-row">
            <label class="field"
              >${I.T("Grade", "Grado")}
              <select data-va-studio="grade">
                ${opt("", I.S("Choose", "Elige"), ui.grade)}${ui.grades.map((g) => opt(g, g === "K" ? I.S("Kindergarten", "Kínder") : I.S(`Grade ${g}`, `Grado ${g}`), ui.grade))}
              </select>
            </label>
            <label class="field"
              >${I.T("Lesson", "Lección")}
              <select data-va-studio="unit" ${ui.units.length ? "" : "disabled"}>
                ${opt("", I.S("Choose", "Elige"), ui.unitId)}${ui.units.map((u) => opt(u.id, `${u.n}. ${u.title}`, ui.unitId))}
              </select>
            </label>
          </div>`
        : html`<p class="fine">
            ${I.T("No Vocabulary Academy lessons are published yet.", "Todavía no hay lecciones publicadas de la Academia de Vocabulario.")}
          </p>`
    }
    ${ui.unit ? unitTools(I, { lesson, week, phaseName }) : ""}
    <p class="fine" role="status" data-va-studio-status></p>
  </section>`;
}

function unitTools(I, { lesson, week, phaseName }) {
  return html` <h3>${I.T("Make a resource", "Crear un recurso")}</h3>
    <div class="row-actions">
      ${RESOURCE_KINDS.map((k) => html`<button type="button" class="btn small" data-va-res="${k.id}">${I.T(k.label[0], k.label[1])}</button>`)}
    </div>
    <div class="va-int-row">
      <label class="field"
        >${I.T("Support for differentiated practice", "Apoyo para la práctica diferenciada")}
        <select data-va-studio="tier">
          ${opt("A", I.S("A · most help", "A · más ayuda"), ui.tier)}${opt("B", I.S("B · some help", "B · algo de ayuda"), ui.tier)}${opt("C", I.S("C · less help", "C · menos ayuda"), ui.tier)}
        </select>
      </label>
      <label class="check-row"
        ><input type="checkbox" data-va-studio="key" ${ui.key ? "checked" : ""} />
        ${I.T("Add a teacher answer key page", "Agregar una página con la clave para el docente")}</label
      >
    </div>
    ${
      lesson
        ? html`<h3>${I.T("Use in this lesson", "Usar en esta lección")}</h3>
            <div class="row-actions">
              <button type="button" class="btn small btn-primary" data-va-apply>
                ${I.T("Use this lesson's words in the vocabulary phase", "Usar las palabras de la lección en la fase de vocabulario")}
              </button>
            </div>`
        : ""
    }
    ${
      lesson || week
        ? html`<h3>${I.T("Add to my plan", "Agregar a mi plan")}</h3>
            <div class="va-int-row">
              <label class="field"
                >${I.T("What to add", "Qué agregar")}
                <select data-va-studio="letter">
                  ${opt("", I.S("The whole lesson", "La lección completa"), ui.letter)}${LESSONS.map((l) => opt(l.id, `${l.id.toUpperCase()} · ${I.S(l.en, l.es)}`, ui.letter))}
                </select>
              </label>
              <label class="field"
                >${I.T("Where", "Dónde")}
                <select data-va-studio="target">
                  ${week ? week.days.map((d, i) => opt(`day:${i}`, I.S(d.name[0], d.name[1]), ui.target)) : lesson.phases.map((p) => opt(`phase:${p.key}`, phaseName(p.key), ui.target))}
                </select>
              </label>
              <button type="button" class="btn small" data-va-plan>
                ${I.T("Add to plan", "Agregar al plan")}
              </button>
            </div>`
        : html`<p class="fine">
            ${I.T("Build a lesson or a week above to add this lesson to it.", "Crea arriba una lección o una semana para agregarle esta lección.")}
          </p>`
    }`;
}

const say = (text) => {
  const el = document.querySelector("[data-va-studio-status]");
  if (el) el.textContent = text;
};

/** Select changes. Returns true when handled. */
export async function studioOnChange(e, ctx) {
  const t = e.target.closest?.("[data-va-studio]");
  if (!t) return false;
  const field = t.dataset.vaStudio;
  if (field === "grade") {
    ui.grade = t.value;
    ui.units = ui.grade ? await getUnitsOfGrade(ui.grade) : [];
    ui.unitId = "";
    ui.unit = null;
    ui.applied = false;
  } else if (field === "unit") {
    ui.unitId = t.value;
    ui.unit = ui.unitId ? await getUnit(ui.unitId) : null;
    ui.applied = false;
  } else if (field === "key") ui.key = t.checked;
  else if (["tier", "letter", "target"].includes(field)) ui[field] = t.value;
  ctx.rerender();
  return true;
}

/** Button clicks. `hooks`: { lesson, week, printSheet, origin }. Returns true when handled. */
export function studioOnClick(e, ctx, { lesson, week, printSheet, origin = "" }) {
  const t = e.target.closest?.("button");
  if (!t || !ui.unit) return false;
  if (t.matches("[data-va-res]")) {
    const kind = RESOURCE_KINDS.find((k) => k.id === t.dataset.vaRes);
    if (!kind) return true;
    if (kind.via === "print") {
      window.open(printHref(ui.unit, kind.printKind), "_blank", "noopener");
      return true;
    }
    const sheet = resourceSheet(kind.id, ui.unit, { tier: ui.tier });
    if (!sheet)
      say("This lesson does not have the content this resource needs, so nothing was printed.");
    else printSheet(resourceHTML(sheet, { unit: ui.unit, withKey: ui.key }));
    return true;
  }
  if (t.matches("[data-va-apply]") && lesson) {
    const done = applyUnitVocabulary(lesson, ui.unit);
    ui.applied = done.ok;
    ctx.rerender();
    requestAnimationFrame(() =>
      say(
        done.ok
          ? `Put ${done.words.length} words into the vocabulary phase.`
          : "This lesson has no vocabulary phase; restore it first.",
      ),
    );
    return true;
  }
  if (t.matches("[data-va-plan]")) {
    const step = planStep(ui.unit, ui.letter);
    const [kind, where] = String(ui.target || (week ? "day:0" : "phase:opening")).split(":");
    const done = step
      ? kind === "day"
        ? addStepToDay(week, Number(where), step)
        : addStepToPhase(lesson, where, step, { origin })
      : { ok: false };
    ctx.rerender();
    requestAnimationFrame(() =>
      say(
        done.ok
          ? done.added
            ? "Added to your plan."
            : "Already in your plan."
          : "Could not add that to the plan.",
      ),
    );
    return true;
  }
  return false;
}
