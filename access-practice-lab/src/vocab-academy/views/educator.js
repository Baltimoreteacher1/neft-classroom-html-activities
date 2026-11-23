// Vocabulary Academy — teacher dashboard (/vocabulary-academy/teacher). Teacher-gated twice: index.js refuses the route on a
// device that is not a teacher's, and render() checks again, so a student never receives these controls or any teacher
// field in the page. The path itself also sits behind the site's teacher password (it contains "teacher").
//
// URL state: ?grade=6 · ?grade=6&unit=3 · &tab=browse|supports|assign|results · ?assign=<unitId> (Core's unit page links here)
// · ?custom=<cu id> (a unit from the Teacher Library). The controls themselves live in ../educator/ui-*.js.
import { html } from "../../util.js";
import { DISCLAIMER, LESSONS, PRINT_KINDS, SHIPPED_GRADES, sectionTitle } from "../contract.js";
import { getGradeOverview, getUnit, groupLessons, lessonHref, parseUnitId, unitHref, vaHref } from "../data.js";
import { crumbs, gradeName, gradeNameS, posName, rootCrumb } from "../ui.js";
import { customSegment } from "../educator/assign.js";
import { getCustom, listCustom } from "../educator/custom.js";
import { T } from "../educator/kit.js";
import {
  ASSIGN_CHANGE,
  ASSIGN_CLICK,
  assignChange,
  assignClick,
  assignMount,
  assignPanel,
} from "../educator/ui-assign.js";
import {
  RES_CHANGE,
  RES_CLICK,
  resultsChange,
  resultsClick,
  resultsMount,
  resultsPanel,
} from "../educator/ui-results.js";
import {
  SUP_CHANGE,
  SUP_CLICK,
  supportsChange,
  supportsClick,
  supportsPanel,
} from "../educator/ui-supports.js";

const TABS = [
  ["browse", "Plan and preview", "Planear y ver"],
  ["supports", "Supports", "Apoyos"],
  ["assign", "Assign", "Asignar"],
  ["results", "Results", "Resultados"],
];
const PRINT_LABEL = {
  workbook: ["Student workbook", "Cuaderno del estudiante"],
  teacher: ["Teacher guide with answers", "Guía docente con respuestas"],
  review: ["Review pages", "Páginas de repaso"],
  assessment: ["Assessment", "Evaluación"],
  "assessment-key": ["Assessment answer key", "Clave de la evaluación"],
  words: ["Word cards", "Tarjetas de palabras"],
};
const INPUT_ACTS = new Set([
  "fade",
  "var-fade",
  "var-label",
  "preset-name",
  "sched-every",
  "sched-step",
  "due",
]);

const here = (q, extra = {}) => {
  const p = new URLSearchParams();
  const all = { grade: q.grade, unit: q.unit, custom: q.custom, tab: q.tab, ...extra };
  for (const [k, v] of Object.entries(all)) if (v) p.set(k, v);
  const s = p.toString();
  return `${vaHref("teacher")}${s ? `?${s}` : ""}`;
};

/** Normalise the query into { grade, n, custom, tab }, honouring Core's ?assign=<unitId> contract. Pure. */
export function readQuery(q = {}) {
  const asg = q.assign ? parseUnitId(q.assign) : null;
  const custom = q.custom || (String(q.assign || "").startsWith("cu.") ? q.assign : "");
  const grade = asg ? asg.grade : SHIPPED_GRADES.includes(String(q.grade)) ? String(q.grade) : "";
  const n = asg ? asg.n : /^\d+$/.test(String(q.unit || "")) ? Number(q.unit) : 0;
  const tab = q.assign ? "assign" : TABS.some((t) => t[0] === q.tab) ? q.tab : "browse";
  return { grade, n, custom, tab };
}

const gradePicker = (I, sel, q) =>
  html`<nav class="vat-grades" aria-label="${I.S("Grade", "Grado")}">
    <ul>
      ${SHIPPED_GRADES.map((g) => html`<li><a class="btn va-btn ${g === sel ? "btn-primary" : ""}" href="${here({}, { grade: g, tab: q.tab === "browse" ? "" : q.tab })}" ${g === sel ? html`aria-current="page"` : ""}>${gradeName(I, g)}</a></li>`)}
    </ul>
    <p class="fine">
      ${I.T("Grades 9 to 12 are not part of this release.", "Los grados 9 a 12 no forman parte de esta versión.")}
    </p>
  </nav>`;

const tabNav = (I, q, active) =>
  html`<nav class="vat-tabs" aria-label="${I.S("Teacher tools", "Herramientas docentes")}">
    <ul>
      ${TABS.map(([id, en, es]) => html`<li><a class="vat-tab" href="${here(q, { tab: id === "browse" ? "" : id })}" ${id === active ? html`aria-current="page"` : ""}>${I.T(en, es)}</a></li>`)}
    </ul>
  </nav>`;

function unitGrid(I, overview, q) {
  const g = overview.grade;
  return html`<section class="vat-panel" aria-labelledby="vatUnitsH">
    <h2 id="vatUnitsH">${gradeName(I, g)}: ${I.T("units and lessons", "unidades y lecciones")}</h2>
    ${groupLessons(overview.units).map(
      (gr) => html`<section class="vat-unit-group" aria-labelledby="vatU${gr.u}">
        <h3 id="vatU${gr.u}">
          ${I.T("Unit", "Unidad")} ${gr.u}
          <span class="fine">· ${I.T("Lessons", "Lecciones")} ${gr.first}–${gr.last}</span>
        </h3>
        <p class="vat-actions">
          <a class="btn va-btn" href="${unitHref(g, gr.u)}">${I.T("Unit page", "Página de la unidad")}</a>
          <a class="btn va-btn" href="${unitHref(g, gr.u, "crossword")}">${I.T("Unit crossword", "Crucigrama de la unidad")}</a>
          <a class="btn va-btn" href="${unitHref(g, gr.u, "test")}">${I.T("Unit test", "Prueba de la unidad")}</a>
        </p>
        <ul class="vat-units">
          ${gr.lessons.map(
            (u) =>
              html`<li class="vat-unit">
                <h4>${I.T("Lesson", "Lección")} ${u.n}: ${u.title}</h4>
                <p class="fine">${u.theme} · ${u.wordCount} ${I.T("words", "palabras")}</p>
                ${u.published ? html`<a class="btn va-btn" href="${here({ grade: g, tab: q.tab === "browse" ? "" : q.tab }, { unit: u.n })}">${I.T("Open this lesson", "Abrir esta lección")}</a>` : html`<span class="fine">${I.T("Not published yet", "Todavía no publicada")}</span>`}
              </li>`,
          )}
        </ul>
      </section>`,
    )}
  </section>`;
}

const teacherNote = (unit, w) => unit.teacher?.notes?.[w.id] || "";

function unitOverview(I, unit, q) {
  const g = unit.grade;
  const custom = unit.custom === true;
  const launch = (letter) => lessonHref(g, custom ? unit.id : unit.n, letter);
  const present = custom
    ? vaHref("present", g, customSegment(unit.id))
    : vaHref("present", g, unit.n);
  return html`<section class="vat-panel" aria-labelledby="vatUnitH">
    <h2 id="vatUnitH">${custom ? "" : html`${I.T("Lesson", "Lección")} ${unit.n}: `}${unit.title}</h2>
    <p class="fine">
      ${gradeName(I, g)} ·
      ${unit.theme}${unit.pacingDays ? ` · ${I.S(`about ${unit.pacingDays} class days`, `unos ${unit.pacingDays} días de clase`)}` : ""}
    </p>
    <div class="vat-actions">
      <a class="btn btn-primary va-btn" href="${present}"
        >${I.T("Open presentation mode", "Abrir el modo de presentación")}</a
      >
      <a class="btn va-btn" href="${launch("")}">${I.T("Launch the lesson", "Iniciar la lección")}</a>
      <a class="btn va-btn" href="${here(q, { tab: "assign" })}">${I.T("Assign", "Asignar")}</a>
    </div>
    ${
      unit.rationale
        ? html`<h3>${I.T("Why these words", "Por qué estas palabras")}</h3>
            <p lang="en">${unit.rationale}</p>`
        : ""
    }
    <h3>${I.T("Objectives", "Objetivos")}</h3>
    <ul class="vat-list" lang="en">
      ${(unit.objectives || []).map((o) => html`<li>${o}</li>`)}
    </ul>
    <h3>${I.T("Lesson sequence", "Secuencia de la lección")}</h3>
    <ol class="vat-seq">
      ${LESSONS.map((l) => html`<li><a href="${launch(l.id)}">${I.T(...sectionTitle(l.id, custom ? "" : unit.n))}</a></li>`)}
    </ol>
    ${
      custom
        ? ""
        : html`<h3>${I.T("Printable materials", "Materiales para imprimir")}</h3>
            <ul class="vat-list">
              ${PRINT_KINDS.map((k) => html`<li><a href="${vaHref("print", g, unit.n, k)}">${I.T(...PRINT_LABEL[k])}</a></li>`)}
            </ul>`
    }
    <h3>${I.T(`The ${unit.words.length} words`, `Las ${unit.words.length} palabras`)}</h3>
    <ul class="vat-words">
      ${unit.words.map(
        (w) =>
          html`<li class="vat-word">
            <details>
              <summary>
                <strong lang="en">${w.hw}</strong> <span class="fine">${posName(I, w.pos)}</span>
              </summary>
              <p lang="en">${w.def}</p>
              <p lang="en"><em>${w.ex}</em></p>
              ${teacherNote(unit, w) ? html`<p class="vat-teacher-note"><strong>${I.T("Teaching note", "Nota docente")}:</strong> <span lang="en">${teacherNote(unit, w)}</span></p>` : ""}
            </details>
          </li>`,
      )}
    </ul>
    ${
      unit.teacher?.model
        ? html`<h3>${I.T("Modeling script", "Guion para modelar")}</h3>
            <p lang="en">${unit.teacher.model}</p>`
        : ""
    }
  </section>`;
}

function libraryPanel(I) {
  const list = listCustom();
  return html`<section class="vat-panel" aria-labelledby="vatLibH">
    <h2 id="vatLibH">
      ${I.T("Teacher Library: your custom lessons", "Biblioteca docente: tus lecciones personalizadas")}
    </h2>
    ${
      list.length
        ? html`<ul class="vat-units">
            ${list.map(
              (u) =>
                html`<li class="vat-unit">
                  <h3>${u.title}</h3>
                  <p class="fine">
                    ${gradeName(I, u.grade)} · ${u.words.length} ${I.T("words", "palabras")}
                  </p>
                  <a class="btn va-btn" href="${here({}, { custom: u.id })}"
                    >${I.T("Open", "Abrir")}</a
                  >
                  <a
                    class="btn va-btn"
                    href="${vaHref("teacher", "custom")}?edit=${encodeURIComponent(u.id)}"
                    >${I.T("Edit", "Editar")}</a
                  >
                </li>`,
            )}
          </ul>`
        : html`<p>
            ${I.T("No custom lessons yet. Make one from your own word list.", "Todavía no hay lecciones personalizadas. Crea una con tu propia lista de palabras.")}
          </p>`
    }
    <p>
      <a class="btn btn-primary va-btn" href="${vaHref("teacher", "custom")}"
        >${I.T("Create a custom lesson", "Crear una lección personalizada")}</a
      >
    </p>
  </section>`;
}

export async function render(ctx, va) {
  const { I } = va;
  if (!va.teacher)
    return {
      title: I.S("For teachers", "Para docentes"),
      html: html`<section class="va-panel va-empty">
        <h1>${I.T("This page is for teachers", "Esta página es para docentes")}</h1>
      </section>`,
    };
  const q = readQuery(va.route.q);
  const custom = q.custom ? getCustom(q.custom) : null;
  const overview =
    q.grade || custom ? await getGradeOverview(custom ? custom.grade : q.grade) : null;
  const row = overview?.units.find((u) => u.n === q.n);
  const unit = custom || (row?.published ? await getUnit(row.id) : null);
  T.unit = unit;
  const gradeSel = custom ? custom.grade : q.grade;
  const urlQ = {
    grade: gradeSel,
    unit: q.n || "",
    custom: custom?.id || "",
    tab: q.tab === "browse" ? "" : q.tab,
  };
  const trail = [
    rootCrumb(I),
    [I.S("Teacher dashboard", "Panel docente"), unit || gradeSel ? vaHref("teacher") : ""],
  ];
  if (gradeSel) trail.push([gradeNameS(I, gradeSel), unit ? here({}, { grade: gradeSel }) : ""]);
  if (unit) trail.push([unit.title, ""]);
  const body =
    q.tab === "supports"
      ? supportsPanel(I)
      : q.tab === "assign"
        ? assignPanel(I, unit, overview?.units?.length || 0)
        : q.tab === "results"
          ? resultsPanel(I, unit)
          : unit
            ? unitOverview(I, unit, urlQ)
            : overview
              ? unitGrid(I, overview, urlQ)
              : html`<section class="vat-panel"><h2>${I.T("Choose a grade", "Elige un grado")}</h2><p>${I.T("Pick a grade above to browse its units, or open a unit from your Teacher Library below.", "Elige un grado arriba para ver sus unidades, o abre una unidad de tu Biblioteca docente abajo.")}</p></section>`;
  return {
    title: I.S("Teacher dashboard", "Panel docente"),
    html: html`<div class="vat">
      ${crumbs(I, trail)}
      <header class="va-hero vat-hero">
        <div>
          <p class="eyebrow">${I.T("For teachers", "Para docentes")}</p>
          <h1 id="vaTitle" tabindex="-1">${I.T("Teacher dashboard", "Panel docente")}</h1>
          <p class="va-lead">
            ${I.T("Plan a lesson, preview its words, assign it with the supports each group needs, and see what to teach next.", "Planea una lección, mira sus palabras, asígnala con los apoyos que necesita cada grupo y ve qué enseñar después.")}
          </p>
        </div>
      </header>
      ${gradePicker(I, gradeSel, q)} ${tabNav(I, urlQ, q.tab)} ${body}
      ${q.tab === "browse" && !unit ? libraryPanel(I) : ""}
      <p class="fine vat-disclaimer">${I.T(DISCLAIMER.en, DISCLAIMER.es)}</p>
    </div>`,
  };
}

export function mount(root, ctx, va) {
  const tab = readQuery(va.route.q).tab;
  if (tab === "assign") assignMount(ctx, va);
  if (tab === "results") resultsMount(ctx, va);
}

const actOf = (e) => e.target.closest?.("[data-vat]")?.dataset.vat || "";
export function onClick(e, ctx, va) {
  const act = actOf(e);
  if (SUP_CLICK.has(act)) return supportsClick(e, ctx, va);
  if (ASSIGN_CLICK.has(act)) {
    assignClick(e, ctx, va, T.unit);
    return true;
  }
  if (RES_CLICK.has(act)) {
    resultsClick(e, ctx, va);
    return true;
  }
  return false;
}
export function onChange(e, ctx, va) {
  const act = actOf(e);
  if (SUP_CHANGE.has(act)) return supportsChange(e, ctx, va);
  if (ASSIGN_CHANGE.has(act)) return assignChange(e, ctx, va);
  if (RES_CHANGE.has(act)) {
    resultsChange(e, ctx, va);
    return true;
  }
  return false;
}
export const onInput = (e, ctx, va) => (INPUT_ACTS.has(actOf(e)) ? onChange(e, ctx, va) : false);
