// Teacher: assign a unit or lesson, and make differentiated versions. Everything goes through the lab's EXISTING class
// assignment flow (class-access.assignToClass → POST /api/class/settings, rows built with src/class/assign.js
// toAssignment). A differentiated version is the SAME unit with a different supports override and/or fewer words:
// the grade-level objective never changes.
import { html } from "../../util.js";
import { SUPPORT_KEYS, sectionTitle } from "../contract.js";
import { lessonsPerUnit, unitOfLesson } from "../data.js";
import { SUPPORT_LABEL } from "../supports.js";
import { absoluteLink, assignmentCompletion, classRows } from "./class-view.js";
import { assignToClass, classApi, savedClasses } from "./class-access.js";
import { assignableStops, differentiate, unitStops } from "./assign.js";
import { T, chooseClass, intIn, setRegion, statusLine } from "./kit.js";
import { allPresets, presetById } from "./ui-supports.js";
import { normalizeProfile } from "../supports.js";

/** The variant (supports override and/or word subset) the form describes, or null when it is not on. */
export function currentVariant(unit) {
  const v = T.variant;
  if (!v.on) return null;
  const preset = v.preset ? presetById(v.preset) : null;
  const words = [...v.words].sort((a, b) => a - b);
  const all = unit?.words?.length || 0;
  return {
    bands: preset ? normalizeProfile(preset).bands : null,
    fade: v.fade < 100 ? v.fade / 100 : null,
    on: [...v.add],
    off: [...v.drop],
    words: words.length && words.length < all ? words : [],
  };
}
const variantIsEmpty = (v) =>
  !v || (!v.bands && v.fade === null && !v.on.length && !v.off.length && !v.words.length);

const supportBoxes = (I, group, set) =>
  SUPPORT_KEYS.map(
    (k) =>
      html`<label class="vat-check"
        ><input
          type="checkbox"
          data-vat="var-${group}"
          data-k="${k}"
          ${set.has(k) ? "checked" : ""}
        />
        ${I.T(...SUPPORT_LABEL[k])}</label
      >`,
  );

function variantForm(I, unit) {
  const v = T.variant;
  const presets = allPresets(I);
  return html`<fieldset class="vat-variant">
    <legend>${I.T("Differentiated version", "Versión diferenciada")}</legend>
    <label class="vat-check"
      ><input type="checkbox" id="vatVarOn" data-vat="var-on" ${v.on ? "checked" : ""} />
      ${I.T("Give this assignment different supports or fewer words", "Dar a esta tarea apoyos distintos o menos palabras")}</label
    >
    ${
      v.on
        ? html`<p class="fine">
              ${I.T("Same lesson and same grade-level goal. Only the supports and the number of words change.", "La misma lección y la misma meta del grado. Solo cambian los apoyos y la cantidad de palabras.")}
            </p>
            <div class="vat-row">
              <label for="vatVarLabel"
                >${I.T("Group name (shown in the title, 16 characters)", "Nombre del grupo (se muestra en el título, 16 caracteres)")}</label
              >
              <input
                id="vatVarLabel"
                type="text"
                maxlength="16"
                value="${v.label}"
                data-vat="var-label"
                autocomplete="off"
              />
            </div>
            <div class="vat-row">
              <label for="vatVarPreset">${I.T("Supports", "Apoyos")}</label>
              <select id="vatVarPreset" data-vat="var-preset">
                <option value="">
                  ${I.S("Keep each student's own supports", "Mantener los apoyos de cada estudiante")}
                </option>
                ${presets.map((x) => html`<option value="${x.id}" ${x.id === v.preset ? "selected" : ""}>${x.label}</option>`)}
              </select>
            </div>
            <div class="vat-row">
              <label for="vatVarFade"
                >${I.T("Support strength", "Fuerza del apoyo")}:
                <output id="vatVarFadeOut" for="vatVarFade">${v.fade}%</output></label
              >
              <input
                id="vatVarFade"
                type="range"
                min="0"
                max="100"
                step="5"
                value="${v.fade}"
                data-vat="var-fade"
              />
            </div>
            <details class="vat-details">
              <summary>
                ${I.T("Always add or remove a support", "Agregar o quitar siempre un apoyo")}
              </summary>
              <fieldset>
                <legend>${I.T("Always add", "Agregar siempre")}</legend>
                ${supportBoxes(I, "add", v.add)}
              </fieldset>
              <fieldset>
                <legend>${I.T("Always remove", "Quitar siempre")}</legend>
                ${supportBoxes(I, "drop", v.drop)}
              </fieldset>
            </details>
            ${
              unit?.words?.length
                ? html`<fieldset>
                    <legend>
                      ${I.T("Words in this version (none ticked keeps all)", "Palabras en esta versión (si no marcas ninguna, quedan todas)")}
                    </legend>
                    <ul class="vat-checks">
                      ${unit.words.map(
                        (w, i) =>
                          html`<li>
                            <label class="vat-check"
                              ><input
                                type="checkbox"
                                data-vat="var-word"
                                data-i="${i + 1}"
                                ${v.words.has(i + 1) ? "checked" : ""}
                              />
                              <span lang="en">${w.hw}</span></label
                            >
                          </li>`,
                      )}
                    </ul>
                  </fieldset>`
                : ""
            }`
        : ""
    }
  </fieldset>`;
}

// The unit this lesson belongs to (a published grade's lessons grouped by data.js groupLessons); 0 lessons = no unit rows.
let lessonCount = 0;
const unitSpan = (unit) => {
  if (unit.custom || !lessonCount) return null;
  const size = lessonsPerUnit(lessonCount);
  const u = unitOfLesson(unit.n, lessonCount);
  return { grade: String(unit.grade), u, first: (u - 1) * size + 1, last: u * size };
};
/** Stop keys: "" (the whole lesson), a section letter, or "unit:" / "unit:crossword" / "unit:test". */
const unitStopsOf = (unit) => {
  const span = unitSpan(unit);
  return span ? unitStops(span).map((s) => ({ ...s, lesson: `unit:${s.activity}` })) : [];
};
const stopsOf = (unit) => [
  ...assignableStops({
    unit,
    variant: currentVariant(unit),
    groupLabel: T.variant.on ? T.variant.label : "",
  }),
  ...unitStopsOf(unit),
];
const stopLabel = (I, s) => {
  if (s.lesson.startsWith("unit:"))
    return s.activity === "crossword"
      ? I.S(`Unit ${s.u} crossword (every word of lessons ${s.title.match(/Lessons (\d+-\d+)/)?.[1]})`, `Crucigrama de la unidad ${s.u} (todas las palabras de las lecciones ${s.title.match(/Lessons (\d+-\d+)/)?.[1]})`)
      : s.activity === "test"
        ? I.S(`Unit ${s.u} test`, `Prueba de la unidad ${s.u}`)
        : I.S(`The whole of unit ${s.u} (its lessons, crossword, test and games)`, `Toda la unidad ${s.u} (lecciones, crucigrama, prueba y juegos)`);
  return s.lesson
    ? I.S(...sectionTitle(s.lesson, s.custom ? "" : s.n))
    : I.S("The whole lesson (word list, Exercises A to F and the review)", "Toda la lección (lista de palabras, Ejercicios A a F y el repaso)");
};

function classPicker(I) {
  const list = savedClasses();
  if (!list.length)
    return html`<p class="vat-note">
      ${I.T("No class is open on this device. Open or create a class in the Teacher Hub, then come back. You can still copy a student link below.", "No hay una clase abierta en este dispositivo. Abre o crea una clase en el Centro docente y vuelve. Aun así puedes copiar un enlace para estudiantes abajo.")}
      <a href="/access-teacher/">${I.T("Open the Teacher Hub", "Abrir el Centro docente")}</a>
    </p>`;
  return html`<div class="vat-row">
    <label for="vatClass">${I.T("Class", "Clase")}</label>
    <select id="vatClass" data-vat="class">
      ${list.map((c) => html`<option value="${c.code}" ${c.code === T.classCode ? "selected" : ""}>${c.title || c.code} (${c.code})</option>`)}
    </select>
    <label for="vatDue">${I.T("Due date (optional)", "Fecha de entrega (opcional)")}</label>
    <input id="vatDue" type="date" value="${T.due}" data-vat="due" />
  </div>`;
}

function existingList(I) {
  const rows = classRows(T.roster);
  if (!rows.length) return "";
  const done = assignmentCompletion(
    T.roster,
    rows.map((r) => r.a),
  );
  return html`<h3>
      ${I.T("Vocabulary Academy assignments in this class", "Tareas de la Academia de Vocabulario en esta clase")}
    </h3>
    <ul class="vat-list">
      ${rows.map(
        (r, i) =>
          html`<li>
            <strong>${r.a.title}</strong>
            <span class="fine"
              >${done[i].done}/${done[i].total}
              ${I.T("done", "completas")}${r.p.variant ? ` · ${I.S("differentiated", "diferenciada")}` : ""}</span
            >
            ${r.p.kind !== "practice" && r.p.kind !== "unit" ? html` <button type="button" class="btn va-btn va-btn-quiet" data-vat="differentiate" data-id="${r.a.id}">${I.T("Assign a differentiated copy", "Asignar una copia diferenciada")}</button>` : ""}
          </li>`,
      )}
    </ul>`;
}

export function assignPanel(I, unit, count = 0) {
  lessonCount = count;
  // A custom unit saved with a supports preset starts its assignment form with that differentiated version on.
  if (unit?.custom && unit.supports?.preset && T.variant.seeded !== unit.id) {
    T.variant.seeded = unit.id;
    if (presetById(unit.supports.preset)) Object.assign(T.variant, { on: true, preset: unit.supports.preset });
  }
  const stops = unit ? stopsOf(unit) : [];
  return html`<section class="vat-panel" id="vatAssign" aria-labelledby="vatAssignH">
    <h2 id="vatAssignH">${I.T("Assign", "Asignar")}</h2>
    ${
      unit
        ? html` ${classPicker(I)}
            <fieldset class="vat-stops">
              <legend>${I.T("What to assign", "Qué asignar")}</legend>
              <ul class="vat-checks">
                ${stops.map(
                  (s) =>
                    html`<li>
                      <label class="vat-check"
                        ><input
                          type="checkbox"
                          data-vat="stop"
                          data-lesson="${s.lesson}"
                          ${T.stops.has(s.lesson) ? "checked" : ""}
                        />
                        ${stopLabel(I, s)}</label
                      >
                    </li>`,
                )}
              </ul>
            </fieldset>
            ${variantForm(I, unit)}
            <div class="vat-actions">
              ${savedClasses().length ? html`<button type="button" class="btn btn-primary va-btn" data-vat="assign">${I.T("Assign to the class", "Asignar a la clase")}</button>` : ""}
              <button type="button" class="btn va-btn" data-vat="copy-link">
                ${I.T("Copy student link", "Copiar enlace para estudiantes")}
              </button>
            </div>
            <div id="vatAssignStatus" role="status" aria-live="polite"></div>
            ${unit.custom ? html`<p class="vat-note">${I.T("A custom lesson lives on the device that made it. Students need the lesson file (Export in the custom lesson builder) before this link will open it for them.", "Una lección personalizada vive en el dispositivo que la creó. Los estudiantes necesitan el archivo de la lección (Exportar en el creador de lecciones) antes de que este enlace se abra para ellos.")}</p>` : ""}
            <div id="vatExisting">${existingList(I)}</div>`
        : html`<p>${I.T("Choose a lesson first.", "Primero elige una lección.")}</p>`
    }
  </section>`;
}

const status = (text, tone = "") => setRegion("vatAssignStatus", statusLine(text, tone));
const REASON = {
  "already-assigned": ["already assigned", "ya asignada"],
  "class-full": ["the class is full", "la clase está llena"],
  "path-too-long": ["link too long", "enlace demasiado largo"],
  "bad-id": ["bad id", "id no válido"],
};

async function loadRoster(ctx, va) {
  const cls = savedClasses().find((c) => c.code === T.classCode);
  if (!cls || T.rosterBusy || T.rosterFor === cls.code) return;
  T.rosterBusy = true;
  const res = await classApi(cls).roster();
  T.rosterBusy = false;
  T.rosterFor = cls.code;
  T.roster = res.ok ? res : null;
  setRegion("vatExisting", existingList(va.I));
}
/** After mount: pick the first saved class and load its assignments. */
export function assignMount(ctx, va) {
  const list = savedClasses();
  if (list.length && !list.some((c) => c.code === T.classCode)) chooseClass(list[0].code);
  return loadRoster(ctx, va);
}

export async function assignClick(e, ctx, va, unit) {
  const b = e.target.closest?.("[data-vat]");
  if (!b) return false;
  const I = va.I;
  const act = b.dataset.vat;
  if (act === "copy-link" || act === "assign") {
    const rows = stopsOf(unit).filter((s) => T.stops.has(s.lesson));
    if (!rows.length)
      return (
        status(
          I.S("Tick at least one thing to assign.", "Marca al menos algo para asignar."),
          "warn",
        ) || true
      );
    if (T.variant.on && variantIsEmpty(currentVariant(unit)))
      return (
        status(
          I.S(
            "Choose supports, a strength below 100%, or fewer words for the differentiated version.",
            "Elige apoyos, una fuerza menor a 100% o menos palabras para la versión diferenciada.",
          ),
          "warn",
        ) || true
      );
    if (act === "copy-link") {
      const text = rows.map((r) => absoluteLink(r.path)).join("\n");
      try {
        await navigator.clipboard.writeText(text);
        status(
          I.S(`Copied ${rows.length} link(s).`, `Se copiaron ${rows.length} enlace(s).`),
          "ok",
        );
      } catch {
        status(text, "");
      }
      return true;
    }
    const cls = savedClasses().find((c) => c.code === T.classCode);
    if (!cls)
      return status(I.S("Choose a class first.", "Primero elige una clase."), "warn") || true;
    status(I.S("Assigning…", "Asignando…"));
    const r = await assignToClass(classApi(cls), rows, { due: T.due || null });
    T.rosterFor = "";
    if (!r.ok)
      status(
        r.httpStatus === 401
          ? I.S(
              "The class passcode or teacher key was not accepted.",
              "No se aceptó el código de la clase ni la clave docente.",
            )
          : I.S(
              "Could not reach the class. Nothing was assigned.",
              "No se pudo llegar a la clase. No se asignó nada.",
            ),
        "warn",
      );
    else {
      const skip = r.skipped
        .map((s) => `${s.id}: ${I.S(...(REASON[s.reason] || [s.reason, s.reason]))}`)
        .join("; ");
      status(
        `${I.S(`Assigned ${r.added.length}.`, `Se asignaron ${r.added.length}.`)}${skip ? ` ${I.S("Skipped", "Omitidas")}: ${skip}` : ""}`,
        r.added.length ? "ok" : "warn",
      );
      await loadRoster(ctx, va);
    }
    return true;
  }
  if (act === "differentiate") {
    const base = classRows(T.roster).find((r) => r.a.id === b.dataset.id)?.a;
    const variant = currentVariant(unit);
    if (!base || variantIsEmpty(variant))
      return (
        status(
          I.S(
            "Turn on the differentiated version above and choose what changes, then try again.",
            "Activa la versión diferenciada arriba y elige qué cambia; luego inténtalo de nuevo.",
          ),
          "warn",
        ) || true
      );
    const copy = differentiate(base, { variant, groupLabel: T.variant.label });
    const cls = savedClasses().find((c) => c.code === T.classCode);
    if (!copy || !cls) return false;
    const r = await assignToClass(classApi(cls), [copy], { due: base.due });
    T.rosterFor = "";
    status(
      r.ok && r.added.length
        ? I.S("Differentiated copy assigned.", "Copia diferenciada asignada.")
        : I.S(
            "That version is already assigned or could not be saved.",
            "Esa versión ya está asignada o no se pudo guardar.",
          ),
      r.ok && r.added.length ? "ok" : "warn",
    );
    await loadRoster(ctx, va);
    return true;
  }
  return false;
}

/** Change/input events of the assign panel. Returns true when handled. */
export function assignChange(e, ctx, va) {
  const el = e.target.closest?.("[data-vat]");
  if (!el) return false;
  const v = T.variant;
  const act = el.dataset.vat;
  if (act === "class") {
    chooseClass(el.value);
    loadRoster(ctx, va);
  } else if (act === "due") T.due = el.value;
  else if (act === "stop")
    el.checked ? T.stops.add(el.dataset.lesson) : T.stops.delete(el.dataset.lesson);
  else if (act === "var-on") {
    v.on = el.checked;
    ctx.rerender();
  } else if (act === "var-label") v.label = el.value.slice(0, 16);
  else if (act === "var-preset") v.preset = el.value;
  else if (act === "var-fade") {
    v.fade = intIn(el.value, 0, 100, 100);
    const out = document.getElementById("vatVarFadeOut");
    if (out) out.textContent = `${v.fade}%`;
  } else if (act === "var-add" || act === "var-drop") {
    const set = act === "var-add" ? v.add : v.drop;
    el.checked ? set.add(el.dataset.k) : set.delete(el.dataset.k);
  } else if (act === "var-word") {
    const n = Number(el.dataset.i);
    el.checked ? v.words.add(n) : v.words.delete(n);
  } else return false;
  return true;
}

export const ASSIGN_CLICK = new Set(["assign", "copy-link", "differentiate"]);
export const ASSIGN_CHANGE = new Set(["class", "due", "stop", "var-on", "var-label", "var-preset", "var-fade", "var-add", "var-drop", "var-word"]);
