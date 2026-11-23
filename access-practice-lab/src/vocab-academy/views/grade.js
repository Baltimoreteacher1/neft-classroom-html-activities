// One grade (/vocabulary-academy/grade/<G>). Core-owned.
// The grade's focus and the year's arc (from grade.json), then its units in order. A unit is a group of lessons (data.js
// groupLessons); each lesson teaches its own ten words, so a unit builds a set of 30 to 40. Every lesson card shows a
// CSS-built cover, its words and this learner's progress; a lesson that is not published is shown as planned, never ready.
import { html } from "../../util.js";
import { LESSONS, PLAN, bandOfGrade } from "../contract.js";
import { getGradeOverview, groupLessons, lessonHref, unitHref, vaHref } from "../data.js";
import { unitStatus, wordState } from "../model.js";
import {
  BAND_NAME,
  STRAND,
  crumbs,
  gradeName,
  gradeNameS,
  notPublishedPanel,
  onSetGrade,
  progressMeter,
  rootCrumb,
  statusPill,
  unitCover,
} from "../ui.js";

const learnedIn = (progress, ids) =>
  ids.filter((id) => ["applying", "secure"].includes(wordState(progress.words?.[id]))).length;

function unitCard(I, g, unit, progress) {
  const st = unitStatus(progress, unit.id, unit.wordIds);
  const learned = unit.published ? learnedIn(progress, unit.wordIds) : 0;
  const strand = STRAND[unit.strand] ? I.T(...STRAND[unit.strand]) : "";
  return html`<li class="va-unit-card" data-published="${unit.published}">
    <a class="va-unit-link" href="${lessonHref(g, unit.n)}">
      ${unitCover(unit.n, unit.strand)}
      <span class="va-unit-body">
        <span class="va-kicker"
          >${I.T("Lesson", "Lección")} ${unit.n}${strand ? html` · ${strand}` : ""}</span
        >
        <strong class="va-card-title">${unit.title}</strong>
        ${unit.theme ? html`<span class="va-unit-theme">${unit.theme}</span>` : ""}
        <span class="fine"
          >${I.T(`${unit.wordCount} words`, `${unit.wordCount} palabras`)}${unit.morphFocus && unit.morphFocus !== "none" ? html` · ${I.T("word parts:", "partes de palabras:")} ${unit.morphFocus}` : ""}</span
        >
      </span>
    </a>
    <div class="va-unit-foot">
      ${
        unit.published
          ? html`${progressMeter(I, st.doneCount, LESSONS.length, I.S(`Sections done in lesson ${unit.n}`, `Secciones completas en la lección ${unit.n}`))}
              <span class="fine"
                >${I.T(`${st.doneCount} of 8 sections`, `${st.doneCount} de 8 secciones`)} ·
                ${I.T(`${learned} of ${unit.wordCount} words learned`, `${learned} de ${unit.wordCount} palabras aprendidas`)}</span
              >`
          : statusPill(I.T("Being written", "En preparación"))
      }
    </div>
  </li>`;
}

/** One unit: its heading, what it builds, its activities, and its lesson cards. */
function unitSection(I, g, gr, progress) {
  const words = gr.lessons.reduce((n, u) => n + u.wordCount, 0);
  const ids = gr.lessons.flatMap((u) => (u.published ? u.wordIds : []));
  const learned = learnedIn(progress, ids);
  const ready = gr.lessons.every((u) => u.published);
  return html`<section class="va-ugroup" aria-labelledby="vaU${gr.u}">
    <header class="va-ugroup-head">
      <div>
        <p class="va-kicker">
          ${I.T("Lessons", "Lecciones")} ${gr.first}–${gr.last} · ${I.T(`${words} words`, `${words} palabras`)}
        </p>
        <h3 id="vaU${gr.u}"><a href="${unitHref(g, gr.u)}">${I.T("Unit", "Unidad")} ${gr.u}</a></h3>
        <p class="fine">
          ${ids.length ? I.T(`${learned} of ${ids.length} words learned`, `${learned} de ${ids.length} palabras aprendidas`) : I.T("Being written", "En preparación")}
        </p>
      </div>
      ${
        ready
          ? html`<p class="va-actions">
              <a class="btn btn-primary va-btn" href="${unitHref(g, gr.u)}">${I.T("Open the unit", "Abrir la unidad")}</a>
              <a class="btn va-btn" href="${unitHref(g, gr.u, "crossword")}">${I.T("Crossword", "Crucigrama")}</a>
              <a class="btn va-btn" href="${unitHref(g, gr.u, "test")}">${I.T("Unit test", "Prueba de la unidad")}</a>
            </p>`
          : ""
      }
    </header>
    <ul class="va-unit-grid">
      ${gr.lessons.map((u) => unitCard(I, g, u, progress))}
    </ul>
  </section>`;
}

function comingLater(I, g) {
  return notPublishedPanel(I, {
    title: I.T(`${gradeName(I, g)} is coming later`, `${gradeName(I, g)} llegará más adelante`),
    text: I.T(
      "This release of Vocabulary Academy covers Kindergarten to Grade 8. Grades 9 to 12 are planned but not written yet.",
      "Esta versión de la Academia de Vocabulario cubre de Kínder a 8.º grado. Los grados 9 a 12 están planeados, pero todavía no están escritos.",
    ),
    href: vaHref("grades"),
    label: I.T("See the grades that are ready", "Ver los grados que están listos"),
  });
}

export async function render(ctx, va) {
  const { I, progress } = va;
  const g = va.params.grade;
  const overview = await getGradeOverview(g);
  const here = [rootCrumb(I), [I.S("Grade Levels", "Niveles por grado"), vaHref("grades")]];
  if (!overview?.shipped)
    return {
      title: gradeNameS(I, g),
      html: html`${crumbs(I, [...here, [gradeNameS(I, g), ""]])}${comingLater(I, g)}`,
    };

  const { scope, units, status, planned, publishedCount } = overview;
  const mine = progress.grade === g;
  const arc = Array.isArray(scope?.arc) ? scope.arc : [];
  const words = units.reduce((n, u) => n + u.wordCount, 0) || planned * (PLAN[g]?.words || 0);
  const learned = units.reduce((n, u) => n + (u.published ? learnedIn(progress, u.wordIds) : 0), 0);
  const publishedWords = units.reduce((n, u) => n + (u.published ? u.wordCount : 0), 0);

  return {
    title: gradeNameS(I, g),
    html: html`${crumbs(I, [...here, [gradeNameS(I, g), ""]])}
      <header class="va-hero">
        <p class="eyebrow">${I.T(...BAND_NAME[bandOfGrade(g)])}</p>
        <h1 id="vaTitle" tabindex="-1">${gradeName(I, g)}</h1>
        ${
          scope?.focus
            ? html`<p class="va-lead" lang="en">${scope.focus}</p>`
            : html`<p class="va-lead">
                ${I.T("The plan for this grade is being written.", "El plan de este grado se está escribiendo.")}
              </p>`
        }
        <p class="va-actions">
          ${
            mine
              ? statusPill(I.T("This is my grade", "Este es mi grado"), "ok")
              : html`<button type="button" class="btn btn-primary va-btn" data-va-set-grade="${g}">
                  ${I.T("Make this my grade", "Hacer de este mi grado")}
                </button>`
          }
          <a class="btn va-btn" href="${vaHref("grades")}"
            >${I.T("All grades", "Todos los grados")}</a
          >
        </p>
      </header>

      <section class="va-card va-card-wide" aria-labelledby="vaGradeNowH">
        <h2 id="vaGradeNowH">${I.T("This grade at a glance", "Este grado de un vistazo")}</h2>
        <p>
          ${
            status === "ready"
              ? I.T(
                  `All ${groupLessons(units).length} units (${planned} lessons) are ready, ${words} words in all.`,
                  `Las ${groupLessons(units).length} unidades (${planned} lecciones) están listas, ${words} palabras en total.`,
                )
              : status === "partial"
                ? I.T(
                    `${publishedCount} of ${planned} lessons are ready. The rest are being written.`,
                    `${publishedCount} de ${planned} lecciones están listas. Las demás se están escribiendo.`,
                  )
                : I.T(
                    `${planned} lessons are planned for this grade. They are being written, so none is ready to open yet.`,
                    `Hay ${planned} lecciones planeadas para este grado. Se están escribiendo, así que todavía no hay ninguna lista para abrir.`,
                  )
          }
        </p>
        ${
          publishedWords
            ? html`<p>
                <strong>${learned}</strong>
                ${I.T(`of ${publishedWords} words learned so far`, `de ${publishedWords} palabras aprendidas hasta ahora`)}
                <span class="fine"
                  >${I.T("Learned means you used the word in context, not that you saw it once.", "Aprendida significa que usaste la palabra en contexto, no que la viste una vez.")}</span
                >
              </p>`
            : ""
        }
      </section>

      ${
        arc.length
          ? html`<section class="va-card va-card-wide" aria-labelledby="vaArcH">
              <h2 id="vaArcH">${I.T("The year in order", "El año en orden")}</h2>
              <ol class="va-arc" lang="en">
                ${arc.map((line) => html`<li>${line}</li>`)}
              </ol>
              ${
                scope?.selection
                  ? html`<details class="va-details">
                      <summary>
                        ${I.T("How the words were chosen", "Cómo se eligieron las palabras")}
                      </summary>
                      <p lang="en">${scope.selection}</p>
                    </details>`
                  : ""
              }
            </section>`
          : ""
      }

      <section aria-labelledby="vaUnitsH">
        <h2 id="vaUnitsH">${I.T("Units and lessons", "Unidades y lecciones")}</h2>
        <p class="fine">
          ${I.T("Each lesson teaches its own set of new words with a word list, six exercises and a review. A unit puts a few lessons together and ends with a crossword, a unit test and games that use all of its words.", "Cada lección enseña su propio grupo de palabras nuevas con una lista de palabras, seis ejercicios y un repaso. Una unidad junta varias lecciones y termina con un crucigrama, una prueba y juegos con todas sus palabras.")}
        </p>
        ${
          units.length
            ? groupLessons(units).map((gr) => unitSection(I, g, gr, progress))
            : html`<p class="va-note">
                ${I.T("No lessons are listed for this grade yet.", "Todavía no hay lecciones en la lista de este grado.")}
              </p>`
        }
      </section>`,
  };
}

export function onClick(e, ctx, va) {
  return onSetGrade(e, ctx, va);
}

