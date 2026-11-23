// Grade Levels (/vocabulary-academy/grades). Core-owned.
// Kindergarten to Grade 8 as cards grouped by band, each saying truthfully how much of that grade is published.
// Grades 9 to 12 are not part of this release: one quiet "coming later" note, never a card that opens.
import { html } from "../../util.js";
import { SHIPPED_GRADES } from "../contract.js";
import { gradeHref, getGradeOverview } from "../data.js";
import { unitStatus } from "../model.js";
import {
  BAND_NAME,
  BAND_ORDER,
  crumbs,
  gradeName,
  gradeNameS,
  gradesOfBand,
  onSetGrade,
  rootCrumb,
  statusPill,
  suggestedGrades,
} from "../ui.js";

/** The honest one-line availability of a grade, as { text, tone }. Pure. */
export function availability(I, overview) {
  const { status, publishedCount, planned } = overview;
  if (status === "ready")
    return {
      tone: "ok",
      text: I.T(`All ${planned} lessons are ready`, `Las ${planned} lecciones están listas`),
    };
  if (status === "partial")
    return {
      tone: "warn",
      text: I.T(
        `${publishedCount} of ${planned} lessons ready`,
        `${publishedCount} de ${planned} lecciones listas`,
      ),
    };
  if (status === "writing")
    return {
      tone: "plain",
      text: I.T(
        `${planned} lessons planned, being written`,
        `${planned} lecciones planeadas, en preparación`,
      ),
    };
  return { tone: "plain", text: I.T("Not published yet", "Todavía no publicado") };
}

/** Finished lessons across the published units of a grade (0 when none). */
function gradeProgress(progress, overview) {
  let done = 0;
  let total = 0;
  for (const u of overview.units)
    if (u.published) {
      done += unitStatus(progress, u.id, u.wordIds).doneCount;
      total += 8;
    }
  return { done, total };
}

function gradeCard(I, overview, { progress, suggested }) {
  const g = overview.grade;
  const avail = availability(I, overview);
  const mine = progress.grade === g;
  const { done, total } = gradeProgress(progress, overview);
  return html`<li class="va-grade-card" data-status="${overview.status}">
    <a class="va-grade-link" href="${gradeHref(g)}">
      <span class="va-grade-mark" aria-hidden="true">${g}</span>
      <span class="va-grade-body">
        <strong class="va-card-title">${gradeName(I, g)}</strong>
        <span class="va-grade-avail" data-tone="${avail.tone}">${avail.text}</span>
        ${total ? html`<span class="fine">${I.T(`${done} of ${total} lessons done`, `${done} de ${total} lecciones completas`)}</span>` : ""}
      </span>
    </a>
    <span class="va-grade-flags">
      ${mine ? statusPill(I.T("My grade", "Mi grado"), "ok") : ""}
      ${suggested && !mine ? statusPill(I.T("Suggested", "Sugerido")) : ""}
    </span>
    ${
      mine
        ? ""
        : html`<button
            type="button"
            class="btn va-btn va-btn-quiet"
            data-va-set-grade="${g}"
            aria-label="${I.S(`Make ${gradeNameS(I, g)} my grade`, `Hacer de ${gradeNameS(I, g)} mi grado`)}"
          >
            ${I.T("Make this my grade", "Hacer de este mi grado")}
          </button>`
    }
  </li>`;
}

export async function render(ctx, va) {
  const { I, progress } = va;
  const overviews = new Map(
    (await Promise.all(SHIPPED_GRADES.map((g) => getGradeOverview(g)))).map((o) => [o.grade, o]),
  );
  const suggested = suggestedGrades(ctx.band);
  const anyPublished = [...overviews.values()].some((o) => o.publishedCount > 0);

  return {
    title: I.S("Grade Levels", "Niveles por grado"),
    html: html`${crumbs(I, [rootCrumb(I), [I.S("Grade Levels", "Niveles por grado"), ""]])}
      <header class="va-hero">
        <p class="eyebrow">${I.T("Vocabulary Academy", "Academia de Vocabulario")}</p>
        <h1 id="vaTitle" tabindex="-1">${I.T("Grade Levels", "Niveles por grado")}</h1>
        <p class="va-lead">
          ${I.T("Every grade has its own words, chosen for what students read and write that year. Pick the grade you are working on. You can look at any grade, and change your own at any time.", "Cada grado tiene sus propias palabras, elegidas para lo que los estudiantes leen y escriben ese año. Elige el grado en el que trabajas. Puedes mirar cualquier grado y cambiar el tuyo cuando quieras.")}
        </p>
        ${
          anyPublished
            ? ""
            : html`<p class="va-note">
                ${I.T("Lessons are still being added. Each grade below shows what is planned and what is ready so far.", "Todavía se están agregando lecciones. Cada grado muestra lo que está planeado y lo que ya está listo.")}
              </p>`
        }
      </header>
      ${BAND_ORDER.map((band) => {
        const grades = gradesOfBand(band);
        const headId = `vaBand-${band}`;
        return html`<section
          class="va-band-section"
          data-va-band="${band}"
          aria-labelledby="${headId}"
        >
          <h2 id="${headId}">${I.T(...BAND_NAME[band])}</h2>
          <ul class="va-grade-grid">
            ${grades.map((g) =>
              gradeCard(I, overviews.get(g), { progress, suggested: suggested.includes(g) }),
            )}
          </ul>
        </section>`;
      })}
      <p class="va-note va-later">
        ${I.T("Grades 9 to 12 are coming later. They are not part of Vocabulary Academy yet.", "Los grados 9 a 12 llegarán más adelante. Todavía no forman parte de la Academia de Vocabulario.")}
      </p>`,
  };
}

export function onClick(e, ctx, va) {
  return onSetGrade(e, ctx, va);
}
