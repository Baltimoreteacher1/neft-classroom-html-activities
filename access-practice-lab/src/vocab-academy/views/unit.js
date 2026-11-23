// One unit (/vocabulary-academy/grade/<G>/unit/<U>): a group of lessons (data.js groupLessons). Core-owned.
// The lessons in order, each building its own ten words; a word wall of every word the unit builds; then the unit
// activities that use ALL of those words: the crossword, the unit test, mixed practice and the games. Progress shown here
// is counts of lessons finished and words learned, never a score or a level.
import { html } from "../../util.js";
import { LESSONS } from "../contract.js";
import { GAMES, fitsGrade } from "../games/index.js";
import {
  getGradeUnits,
  gradeHref,
  groupId,
  lessonHref,
  unitHref,
  vaHref,
  wordHref,
} from "../data.js";
import { EXTRAS } from "../unit/extras.js";
import { gardenHTML, gardenKeyHTML, stageCounts } from "../garden.js";
import { unitStatus, wordEntry, wordState } from "../model.js";
import {
  STRAND,
  crumbs,
  gradeName,
  gradeNameS,
  notPublishedPanel,
  progressMeter,
  rootCrumb,
  unitCover,
} from "../ui.js";

const learned = (progress, ids) =>
  ids.filter((id) => ["applying", "secure"].includes(wordState(progress.words?.[id]))).length;

/** What this learner has done in the unit's activities (progress.unitWork, kept by unit-activity.js). Pure. */
export const unitWork = (progress, gid) => progress?.unitWork?.[gid] || {};

function lessonCard(I, g, row, progress) {
  const st = unitStatus(progress, row.id, row.wordIds);
  const strand = STRAND[row.strand] ? I.T(...STRAND[row.strand]) : "";
  return html`<li class="va-unit-card" data-published="${row.published}">
    <a class="va-unit-link" href="${lessonHref(g, row.n)}">
      ${unitCover(row.n, row.strand)}
      <span class="va-unit-body">
        <span class="va-kicker"
          >${I.T("Lesson", "Lección")} ${row.n}${strand ? html` · ${strand}` : ""}</span
        >
        <strong class="va-card-title">${row.title}</strong>
        <span class="fine" lang="en">${row.words.map((w) => w.hw).join(", ")}</span>
      </span>
    </a>
    <div class="va-unit-foot">
      ${
        row.published
          ? html`${progressMeter(I, st.doneCount, LESSONS.length, I.S(`Parts done in lesson ${row.n}`, `Partes completas en la lección ${row.n}`))}
              <span class="fine"
                >${I.T(`${st.doneCount} of ${LESSONS.length} parts`, `${st.doneCount} de ${LESSONS.length} partes`)}</span
              >`
          : html`<span class="fine">${I.T("Being written", "En preparación")}</span>`
      }
    </div>
  </li>`;
}

const activityCard = (href, icon, title, text, status = "") =>
  html`<li class="va-act-card">
    <a href="${href}">
      <span class="va-act-icon" aria-hidden="true">${icon}</span>
      <strong>${title}</strong>
      <span class="fine">${text}</span>
      ${status ? html`<span class="va-act-status">${status}</span>` : ""}
    </a>
  </li>`;

export async function render(ctx, va) {
  const { I, progress } = va;
  const { grade: g, u } = va.params;
  const found = await getGradeUnits(g);
  const unit = found?.units.find((x) => x.u === u);
  const trail = [
    rootCrumb(I),
    [I.S("Grade Levels", "Niveles por grado"), vaHref("grades")],
    [gradeNameS(I, g), gradeHref(g)],
  ];
  if (!found?.overview?.shipped || !unit)
    return {
      title: I.S("Unit not found", "Unidad no encontrada"),
      html: html`${crumbs(I, [...trail, [`${I.S("Unit", "Unidad")} ${u}`, ""]])}${notPublishedPanel(
        I,
        {
          title: found?.overview?.shipped
            ? I.T("There is no unit with that number", "No hay una unidad con ese número")
            : I.T(`${gradeName(I, g)} is coming later`, `${gradeName(I, g)} llegará más adelante`),
          text: I.T("Pick a unit from the grade page.", "Elige una unidad en la página del grado."),
          href: found?.overview?.shipped ? gradeHref(g) : vaHref("grades"),
          label: I.T("Back to the grade", "Volver al grado"),
        },
      )}`,
    };

  const gid = groupId(g, u);
  const ready = unit.lessons.every((r) => r.published);
  const ids = unit.lessons.flatMap((r) => (r.published ? r.wordIds : []));
  const words = unit.lessons.reduce((n, r) => n + r.wordCount, 0);
  const lessonsDone = unit.lessons.filter(
    (r) => r.published && unitStatus(progress, r.id, r.wordIds).doneCount === LESSONS.length,
  ).length;
  const work = unitWork(progress, gid);
  const cw = work.crossword;
  const test = work.test;
  const q = (extra) =>
    `?grade=${encodeURIComponent(g)}&unit=${encodeURIComponent(gid)}${extra || ""}`;

  const stateOf = (id) => (id ? wordEntry(progress, id).state : "new");
  const counts = stageCounts(ids.map(stateOf));
  const wall = html`<section class="va-card va-card-wide" aria-labelledby="vaWallH">
    <h2 id="vaWallH">${I.T("Word garden", "Jardín de palabras")}</h2>
    <p class="fine">
      ${I.T(`Every one of the ${ids.length} words this unit builds is a plant. Practise a word and watch it grow.`, `Cada una de las ${ids.length} palabras de esta unidad es una planta. Practica una palabra y mírala crecer.`)}
    </p>
    ${gardenKeyHTML(I, counts)}
    ${unit.lessons.map(
      (r) =>
        html`<h3 class="va-wall-h va-garden-lane">${I.T("Lesson", "Lección")} ${r.n}: ${r.title}</h3>
          ${gardenHTML(
            I,
            r.words.map((w, i) => ({ id: r.wordIds[i], hw: w.hw, state: stateOf(r.wordIds[i]) })),
            wordHref,
          )}`,
    )}
  </section>`;

  const activities = ready
    ? html`<section class="va-card va-card-wide" aria-labelledby="vaActH">
        <h2 id="vaActH">${I.T("Unit activities", "Actividades de la unidad")}</h2>
        <p class="fine">
          ${I.T("Every activity here mixes the words from all the lessons in this unit.", "Cada actividad mezcla las palabras de todas las lecciones de esta unidad.")}
        </p>
        <ul class="va-act-grid">
          ${activityCard(
            unitHref(g, u, "crossword"),
            "▦",
            I.T("Crossword puzzle", "Crucigrama"),
            I.T(
              "Read each meaning and fill in the word.",
              "Lee cada significado y escribe la palabra.",
            ),
            cw?.done ? I.T("Solved", "Resuelto") : cw?.fill ? I.T("In progress", "En curso") : "",
          )}
          ${EXTRAS.map((x) =>
            activityCard(
              unitHref(g, u, x.id),
              x.icon,
              I.T(...x.title),
              I.T(...x.blurb),
              work[x.id]?.done ? I.T(...x.doneLabel) : "",
            ),
          )}
          ${activityCard(
            unitHref(g, u, "test"),
            "✎",
            I.T("Unit test", "Prueba de la unidad"),
            I.T(
              "Questions on words from every lesson. You see how each word went.",
              "Preguntas sobre palabras de cada lección. Ves cómo te fue con cada palabra.",
            ),
            test?.at
              ? I.T(
                  `Last time: ${test.score} of ${test.total}`,
                  `La última vez: ${test.score} de ${test.total}`,
                )
              : "",
          )}
          ${activityCard(
            `${vaHref("practice")}?unit=${encodeURIComponent(gid)}`,
            "↻",
            I.T("Mixed practice", "Práctica mixta"),
            I.T(
              "Choose an activity type and practice all the unit words.",
              "Elige un tipo de actividad y practica todas las palabras de la unidad.",
            ),
          )}
        </ul>
        <h3>${I.T("Games with this unit's words", "Juegos con las palabras de esta unidad")}</h3>
        <ul class="va-chips">
          ${GAMES.filter((game) => fitsGrade(game, g)).map(
            (game) =>
              html`<li>
                <a class="btn va-btn" href="${vaHref("games", game.id)}${q()}"
                  >${I.T(game.title, game.titleEs || game.title)}</a
                >
              </li>`,
          )}
        </ul>
      </section>`
    : html`<section class="va-panel va-empty">
        <p>
          ${I.T("Some lessons in this unit are still being written. The unit activities open when every lesson is ready.", "Algunas lecciones de esta unidad todavía se están escribiendo. Las actividades de la unidad se abren cuando todas las lecciones estén listas.")}
        </p>
      </section>`;

  return {
    title: `${I.S("Unit", "Unidad")} ${u} · ${gradeNameS(I, g)}`,
    html: html`${crumbs(I, [...trail, [`${I.S("Unit", "Unidad")} ${u}`, ""]])}
      <header class="va-hero va-unit-hero">
        ${unitCover(u, unit.lessons[0]?.strand || "thematic")}
        <div>
          <p class="eyebrow">
            ${gradeName(I, g)} · ${I.T("Lessons", "Lecciones")} ${unit.first}–${unit.last}
          </p>
          <h1 id="vaTitle" tabindex="-1">${I.T("Unit", "Unidad")} ${u}</h1>
          <p class="va-lead" lang="en">${unit.lessons.map((r) => r.title).join(" · ")}</p>
        </div>
      </header>

      <section class="va-card va-card-wide va-next" aria-labelledby="vaUnitNowH">
        <h2 id="vaUnitNowH">${I.T("Your progress in this unit", "Tu progreso en esta unidad")}</h2>
        ${progressMeter(I, lessonsDone, unit.lessons.length, I.S("Lessons finished in this unit", "Lecciones terminadas en esta unidad"))}
        <p class="fine">
          ${I.T(`${lessonsDone} of ${unit.lessons.length} lessons finished · ${learned(progress, ids)} of ${words} words learned`, `${lessonsDone} de ${unit.lessons.length} lecciones terminadas · ${learned(progress, ids)} de ${words} palabras aprendidas`)}
        </p>
        <p class="va-actions">
          <a class="btn va-btn" href="${vaHref("album")}?grade=${encodeURIComponent(g)}&unit=${u}"
            >${I.T("See this unit's Word Album cards", "Ver las tarjetas del Álbum de esta unidad")}</a
          >
        </p>
        ${
          va.teacher
            ? html`<p class="va-actions">
                <a
                  class="btn va-btn"
                  href="${vaHref("teacher")}?assign=${encodeURIComponent(unit.lessons[0].id)}"
                  >${I.T("Assign this unit", "Asignar esta unidad")}</a
                >
              </p>`
            : ""
        }
      </section>

      <section aria-labelledby="vaUnitLessonsH">
        <h2 id="vaUnitLessonsH">${I.T("Lessons in this unit", "Lecciones de esta unidad")}</h2>
        <ul class="va-unit-grid">
          ${unit.lessons.map((r) => lessonCard(I, g, r, progress))}
        </ul>
      </section>
      ${activities} ${wall}`,
  };
}
