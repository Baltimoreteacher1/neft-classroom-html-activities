// Printable pages view: /vocabulary-academy/print/<G>/<N>/<kind>. Renders US-Letter pages from the unit's own JSON.
// Interface: render(ctx, va) -> { title, html }; mount(root, ctx, va); unmount(va); onChange/onClick/onInput/onKey.
// Student kinds are built from the student-safe projection only (print/project.js). Teacher kinds are shown only when
// the lab's teacher detection (va.teacher, from store.isTeacherMode) says so; index.js already gates the route, and
// this view repeats the check so a teacher page can never be reached by loading the module directly.
import { html, raw } from "../../util.js";
import { unitId } from "../contract.js";
import { getUnit, getWords, lessonHref, vaHref } from "../data.js";
import { fitSheets, numberPassageLines } from "../print/lines.js";
import {
  documentTitle,
  isTeacherKind,
  KIND_TITLE,
  pageCss,
  parseSupports,
  renderBody,
} from "../print/render.js";
import { gradeLabel, PRINT_SUPPORTS, STUDENT_KINDS, TEACHER_KINDS } from "../print/shared.js";
import { bandInfo } from "../print/shared.js";

let cleanup = null;

const SUPPORT_LABEL = {
  glossaryEs: ["Spanish glosses", "Glosas en español"],
  frames: ["Sentence starters", "Inicios de oración"],
  wordBank: ["Word bank for writing", "Banco de palabras para escribir"],
  rehearsal: ["Say-it-first prompts", "Indicaciones para decirlo primero"],
};
const OPTIONAL_SUPPORTS = PRINT_SUPPORTS.filter((k) => k !== "picture");

function printHref(grade, n, kind, supports) {
  const on = OPTIONAL_SUPPORTS.filter((k) => supports[k]);
  return `${vaHref("print", grade, n, kind)}${on.length ? `?supports=${on.join(",")}` : ""}`;
}

const notice = (I, title, text, href, label) =>
  html`<section class="vap-notice" role="region" aria-labelledby="vapNoticeTitle">
    <h1 id="vapNoticeTitle" tabindex="-1">${title}</h1>
    <p>${text}</p>
    <p><a class="btn va-btn" href="${href}">${label}</a></p>
  </section>`;

function toolbar(I, { grade, n, kind, supports, teacher, unit }) {
  const kinds = [...STUDENT_KINDS, ...(teacher ? TEACHER_KINDS : [])];
  return html`<header class="vap-toolbar no-print">
    <div>
      <h1>${KIND_TITLE[kind]}</h1>
      <p>${gradeLabel(grade)} · ${I.T("Lesson", "Lección")} ${n} · ${unit.title}</p>
      <p class="vap-toolbar-note">
        ${I.T(
          "Print on US Letter paper. In the print window choose 'Save as PDF' to keep a copy. Print in black and white if you like.",
          "Imprime en papel tamaño carta. En la ventana de impresión elige 'Guardar como PDF' para conservar una copia. Puedes imprimir en blanco y negro.",
        )}
      </p>
    </div>
    <div class="vap-toolbar-row" role="group" aria-label="${I.S("Kind of page", "Tipo de página")}">
      <button type="button" class="is-primary" data-vap-print>
        ${I.T("Print / Save as PDF", "Imprimir / Guardar como PDF")}
      </button>
      ${kinds.map(
        (k) =>
          html`<a
            href="${printHref(grade, n, k, supports)}"
            ${k === kind ? raw('aria-current="page"') : ""}
            >${KIND_TITLE[k]}</a
          >`,
      )}
      <a href="${lessonHref(grade, n)}">${I.T("Back to the lesson", "Volver a la lección")}</a>
    </div>
    ${
      kind === "assessment-key" || kind === "teacher"
        ? ""
        : html`<fieldset class="vap-toolbar-row">
            <legend>${I.T("Add supports to the printout", "Agregar apoyos a la impresión")}</legend>
            ${OPTIONAL_SUPPORTS.map(
              (k) =>
                html`<label
                  ><input
                    type="checkbox"
                    data-vap-support="${k}"
                    ${supports[k] ? raw("checked") : ""}
                  />
                  ${I.T(...SUPPORT_LABEL[k])}</label
                >`,
            )}
          </fieldset>`
    }
  </header>`;
}

export async function render(ctx, va) {
  const { I } = va;
  const { grade, n, kind } = va.params;
  const supports = parseSupports(va.route.q?.supports);
  const back = lessonHref(grade, n);
  const backLabel = I.T("Back to the lesson", "Volver a la lección");
  if (isTeacherKind(kind) && !va.teacher)
    return {
      title: I.S("Teacher materials", "Materiales para docentes"),
      html: notice(
        I,
        I.T("These are teacher materials", "Estos son materiales para docentes"),
        I.T(
          "The Teacher Edition and the assessment answer key are shown to teachers only. Students can print the workbook, the review packet, the assessments and the word list.",
          "La edición del docente y la clave de respuestas solo las ven los docentes. Los estudiantes pueden imprimir el cuaderno, el paquete de repaso, las evaluaciones y la lista de palabras.",
        ),
        back,
        backLabel,
      ),
    };
  const unit = await getUnit(unitId(grade, n));
  if (!unit)
    return {
      title: I.S("Printable pages", "Páginas para imprimir"),
      html: notice(
        I,
        I.T("This lesson is not published yet", "Esta lección todavía no está publicada"),
        I.T(
          "The words for this lesson are still being written, so there is nothing to print yet.",
          "Las palabras de esta lección todavía se están escribiendo, así que aún no hay nada que imprimir.",
        ),
        vaHref("grade", grade),
        I.T("Back to the grade", "Volver al grado"),
      ),
    };
  const reviewWords =
    kind === "review" || kind === "teacher" ? await getWords(unit.review ?? []) : [];
  const body = renderBody(unit, kind, { reviewWords, supports });
  const { band } = bandInfo(unit.grade);
  return {
    title: documentTitle(unit, kind),
    // The @page rules ride inside the page markup: they apply while this page is in the document and vanish with it.
    html: html`<style data-vap-page>${raw(pageCss(unit, kind))}</style>${toolbar(I, { grade, n, kind, supports, teacher: va.teacher, unit })}
      <div class="vap-screenwrap">
        <main
          class="vap-doc"
          data-band="${band}"
          data-kind="${kind}"
          data-pagecss="${kind}"
          aria-label="${documentTitle(unit, kind)}"
        >
          ${raw(body.html)}
        </main>
      </div>`,
  };
}

export function mount(root) {
  cleanup?.();
  const doc = root.querySelector(".vap-doc");
  if (!doc) return;
  const lines = () => {
    fitSheets(doc);
    numberPassageLines(doc);
  };
  document.fonts?.ready?.then(lines);
  window.addEventListener("beforeprint", lines);
  cleanup = () => {
    window.removeEventListener("beforeprint", lines);
    cleanup = null;
  };
}

export function unmount() {
  cleanup?.();
}

export function onClick(event) {
  const button = event.target.closest?.("[data-vap-print]");
  if (!button) return false;
  window.print();
  return true;
}

export function onChange(event, ctx, va) {
  const box = event.target.closest?.("[data-vap-support]");
  if (!box) return false;
  const supports = parseSupports(va.route.q?.supports);
  supports[box.dataset.vapSupport] = box.checked;
  const { grade, n, kind } = va.params;
  va.go(printHref(grade, n, kind, supports));
  return true;
}

export const onInput = () => false;
export const onKey = () => false;
