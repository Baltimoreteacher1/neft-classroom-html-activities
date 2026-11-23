// Vocabulary Academy · the family view (/vocabulary-academy/family[?grade=G&unit=N&assigned=1]).
//
// Interface (same as every Academy sub-view): render(ctx, va) → { title, html }; mount; unmount; event hooks.
// Everything shown comes through family-project.js, a whitelist of student-facing fields: no teacher notes, answer
// keys, rationale, editorial flags or class data ever reach this page. No student progress is read either, except
// which unit the child opened last, so the page can open on it.
//
// Honesty label: "Optional home practice — not assigned by your teacher" unless the family followed a teacher's
// link that carries `assigned=1`; the label never names a class, a roster or another assignment.
import { html } from "../../util.js";
import { SHIPPED_GRADES } from "../contract.js";
import { getUnit, getUnitsOfGrade, gradeHref, normGrade, lessonHref, vaHref } from "../data.js";
import { crumbs, gradeNameS, rootCrumb } from "../ui.js";
import { FAMILY_LABEL, familyUnit, gradeForBand, talkAboutIt } from "./family-project.js";

const UNIT_ID = /^g(K|\d{1,2})-u(\d{1,3})$/;

/** Which unit to open: the query, else the unit the child opened last, else unit 1 of the band's usual grade. */
export function pickUnit({ q = {}, progress = null, band = "" } = {}) {
  const grade = normGrade(q.grade);
  const n = Number(q.unit);
  if (grade && SHIPPED_GRADES.includes(grade) && Number.isInteger(n) && n > 0) return { grade, n };
  const m = UNIT_ID.exec(String(progress?.last?.unit || ""));
  if (m && SHIPPED_GRADES.includes(m[1])) return { grade: m[1], n: Number(m[2]) };
  const g = gradeForBand(band);
  return g ? { grade: g, n: 1 } : { grade: "", n: 0 };
}

const familyHref = (grade, n, assigned = false) =>
  `${vaHref("family")}?grade=${encodeURIComponent(grade)}&unit=${n}${assigned ? "&assigned=1" : ""}`;

const labelHTML = (I, assigned) => {
  const l = assigned ? FAMILY_LABEL.assigned : FAMILY_LABEL.optional;
  return html`<p class="va-pill va-family-label ${assigned ? "is-assigned" : "is-optional"}">
    <span lang="en">${l.en}</span> <span lang="es">${l.es}</span>
  </p>`;
};

const wordHTML = (w) =>
  html`<li class="va-card va-family-word">
    <h3>
      <span class="va-family-glyphs" aria-hidden="true">${w.glyphs.join(" ")}</span>
      <span lang="en">${w.hw}</span>
      ${w.pron ? html`<span class="fine">/${w.pron}/</span>` : ""}
    </h3>
    <p lang="en"><strong>${w.pos}</strong> · ${w.def}</p>
    ${w.ex ? html`<p lang="en"><em>${w.ex}</em></p>` : ""}
    ${w.es ? html`<p lang="es">${w.es.gloss}${w.es.cognate ? " ≈" : ""}</p>` : ""}
  </li>`;

const talkHTML = (t) =>
  html`<li><span lang="en">${t.en}</span><br /><span lang="es" class="fine">${t.es}</span></li>`;

function pickerHTML(I, grade, units, current, assigned) {
  if (!units.length) return "";
  return html`<nav class="va-family-units" aria-label="${I.S("Lessons", "Lecciones")}">
    <ul class="va-chips">
      ${units.map(
        (u) =>
          html`<li>
            <a
              class="btn va-btn${u.n === current ? " btn-primary" : ""}"
              href="${familyHref(grade, u.n, assigned)}"
              aria-current="${u.n === current ? "page" : "false"}"
              >${u.n}. ${u.title}</a
            >
          </li>`,
      )}
    </ul>
  </nav>`;
}

export async function render(ctx, va) {
  const { I } = va;
  const q = va.route?.q || {};
  const pick = pickUnit({ q, progress: va.progress, band: ctx.band });
  const assigned = q.assigned === "1";
  const head = html`${crumbs(I, [rootCrumb(I), [I.S("For families", "Para familias"), ""]])}
    <h1 tabindex="-1">
      ${I.T("Words to talk about at home", "Palabras para conversar en casa")}
    </h1>`;

  if (!pick.grade) {
    return {
      title: I.S("For families", "Para familias"),
      html: html`${head}
        <section class="va-panel">
          <p>
            ${I.T(
              "Choose your child's grade to see this lesson's words and a few things to talk about together.",
              "Elige el grado de tu hijo o hija para ver las palabras de la lección y algo para conversar juntos.",
            )}
          </p>
          <ul class="va-chips">
            ${SHIPPED_GRADES.map(
              (g) =>
                html`<li>
                  <a class="btn va-btn" href="${familyHref(g, 1, assigned)}">${gradeNameS(I, g)}</a>
                </li>`,
            )}
          </ul>
        </section>`,
    };
  }

  const [units, unit] = await Promise.all([
    getUnitsOfGrade(pick.grade),
    getUnit(`g${pick.grade}-u${String(pick.n).padStart(2, "0")}`),
  ]);
  const view = unit ? familyUnit(unit) : null;
  if (!view?.words.length) {
    return {
      title: I.S("For families", "Para familias"),
      html: html`${head}
        <section class="va-panel va-empty">
          <p>
            ${I.T(
              "The words for this lesson are still being written. Pick another lesson from this grade.",
              "Las palabras de esta lección todavía se están escribiendo. Elige otra lección de este grado.",
            )}
          </p>
          ${pickerHTML(I, pick.grade, units, pick.n, assigned)}
          <p>
            <a class="btn va-btn" href="${gradeHref(pick.grade)}"
              >${I.T("See the grade", "Ver el grado")}</a
            >
          </p>
        </section>`,
    };
  }
  const talk = talkAboutIt(unit);
  return {
    title: `${I.S("For families", "Para familias")} · ${view.title}`,
    html: html`${head} ${labelHTML(I, assigned)}
      <section class="va-panel" aria-labelledby="vaFamUnit">
        <h2 id="vaFamUnit">
          ${gradeNameS(I, pick.grade)} · ${I.S("Lesson", "Lección")} ${view.n}: ${view.title}
        </h2>
        ${view.theme ? html`<p class="fine">${view.theme}</p>` : ""}
        <p>
          ${I.T(
            "These are the words your child is learning. You can talk about them in any language you like; the practice itself is in English.",
            "Estas son las palabras que tu hijo o hija está aprendiendo. Pueden conversar sobre ellas en el idioma que prefieran; la práctica es en inglés.",
          )}
        </p>
        ${pickerHTML(I, pick.grade, units, pick.n, assigned)}
      </section>
      <section class="va-panel" aria-labelledby="vaFamTalk">
        <h2 id="vaFamTalk">${I.T("Things to talk about", "Para conversar")}</h2>
        <ol class="va-family-talk">
          ${talk.map(talkHTML)}
        </ol>
      </section>
      <section aria-labelledby="vaFamWords">
        <h2 id="vaFamWords">${I.T("This lesson's words", "Las palabras de esta lección")}</h2>
        <ul class="va-grid">
          ${view.words.map(wordHTML)}
        </ul>
      </section>
      <p class="va-actions">
        <a class="btn btn-primary va-btn" href="${lessonHref(pick.grade, pick.n)}"
          >${I.T("Practice this lesson together", "Practicar esta lección juntos")}</a
        >
        <a class="btn va-btn" href="${vaHref("print", pick.grade, pick.n, "words")}"
          >${I.T("Print the word list", "Imprimir la lista de palabras")}</a
        >
      </p>`,
  };
}

export const mount = () => {};
export const unmount = () => {};
export const onClick = () => false;
export const onChange = () => false;
export const onInput = () => false;
export const onKey = () => false;
