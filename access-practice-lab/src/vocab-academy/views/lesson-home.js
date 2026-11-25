// One lesson (/vocabulary-academy/grade/<G>/lesson/<N>, or lesson/cu_<slug> for a teacher's list). Core-owned.
// Laid out like a Wordly Wise-style lesson: the ten words as a Word List (pronunciation, part of speech, meaning, an
// example sentence, word forms, Spanish), then the sections in order (the word list study, Exercises A to F, the lesson
// review) with their real status and a Start / Continue / Review button, then practice and games with these words.
// A lesson with no published file says so plainly. The teacher strip exists in the DOM ONLY on a teacher device.
import { BASE, html, raw } from "../../util.js";
import { speak } from "../../speech.js";
import { LESSONS, sectionTitle } from "../contract.js";
import {
  getGradeOverview,
  getUnit,
  getWords,
  gradeHref,
  isCustomId,
  lessonHref,
  unitHref,
  unitOfLesson,
  vaHref,
  wordHref,
} from "../data.js";
import { unitStatus, wordEntry } from "../model.js";
import {
  STRAND,
  crumbs,
  gradeName,
  gradeNameS,
  lessonLabel,
  lessonTrail,
  notPublishedPanel,
  posName,
  progressMeter,
  stateBadge,
  unitCover,
} from "../ui.js";

/** The section this learner should open next in the lesson: where they stopped, else the first one not done. Pure. */
export function nextLesson(progress, unitId) {
  const st = unitStatus(progress, unitId);
  const order = LESSONS.map((l) => l.id);
  const from = progress.last?.unit === unitId ? order.indexOf(progress.last.lesson) : 0;
  const start = Math.max(0, from);
  const letter = [...order.slice(start), ...order.slice(0, start)].find((l) => !st.lessons[l].done);
  const resume = Boolean(letter) && (st.lessons[letter].seenAt || progress.last?.unit === unitId);
  return { letter: letter || "", resume: Boolean(resume), doneCount: st.doneCount };
}

/** "done" | "started" | "open" for one section record. Pure. */
export const lessonStatus = (l) => (l?.done ? "done" : l?.seenAt ? "started" : "open");

const sectionName = (I, letter, n) => I.T(...sectionTitle(letter, n));
const sectionNameS = (I, letter, n) => I.S(...sectionTitle(letter, n));

const sectionList = (I, g, unit, key, progress, published) => {
  const st = unitStatus(progress, unit.id, unit.wordIds);
  const next = nextLesson(progress, unit.id);
  return html`<ol class="va-lessons">
    ${LESSONS.map((l) => {
      const status = lessonStatus(st.lessons[l.id]);
      const cta =
        status === "done"
          ? I.T("Review", "Repasar")
          : status === "started" || (next.letter === l.id && next.resume)
            ? I.T("Continue", "Continuar")
            : I.T("Start", "Comenzar");
      const text =
        status === "done"
          ? I.T("Done", "Completa")
          : status === "started"
            ? I.T("In progress", "En curso")
            : I.T("Not started", "Sin empezar");
      return html`<li
        class="va-lesson"
        data-status="${published ? status : "later"}"
        ${next.letter === l.id && published ? raw('data-next="true"') : ""}
      >
        <span class="va-lesson-letter" aria-hidden="true"
          >${l.code || (l.id === "a" ? "W" : "R")}</span
        >
        <span class="va-lesson-body">
          <strong>${sectionName(I, l.id, key)}</strong>
          <span class="fine"
            >${published ? text : I.T("Not yet published", "Todavía no publicada")}</span
          >
        </span>
        ${
          published
            ? html`<a
                class="btn ${next.letter === l.id ? "btn-primary" : ""} va-btn"
                href="${lessonHref(g, key, l.id)}"
                aria-label="${cta}: ${sectionNameS(I, l.id, key)}"
                >${cta}</a
              >`
            : ""
        }
      </li>`;
    })}
  </ol>`;
};

const teacherStrip = (I, g, key, unit) =>
  html`<nav
    class="va-teacher-strip"
    aria-label="${I.S("Teacher tools for this lesson", "Herramientas docentes de esta lección")}"
  >
    <strong>${I.T("For teachers", "Para docentes")}</strong>
    <a
      class="btn va-btn"
      href="${vaHref("present", g, isCustomId(key) ? key.replace(".", "_") : key)}"
      >${I.T("Present", "Presentar")}</a
    >
    ${
      isCustomId(key)
        ? ""
        : html`<a class="btn va-btn" href="${vaHref("print", g, key, "workbook")}"
              >${I.T("Print", "Imprimir")}</a
            >
            <a class="btn va-btn" href="${vaHref("print", g, key, "teacher")}"
              >${I.T("Notes", "Notas")}</a
            >`
    }
    <a class="btn va-btn" href="${vaHref("teacher")}?assign=${encodeURIComponent(unit.id)}"
      >${I.T("Assign", "Asignar")}</a
    >
    ${
      isCustomId(key)
        ? ""
        : html`<a
            class="btn va-btn"
            data-customize-activity
            href="${BASE}/activity-studio/customize?family=vocab-academy&ref=${encodeURIComponent(unit.id)}"
            >${I.T("Customize Activity", "Personalizar actividad")}</a
          >`
    }
    ${unit.pacingDays ? html`<span class="fine">${I.T(`About ${unit.pacingDays} class days`, `Unos ${unit.pacingDays} días de clase`)}</span>` : ""}
  </nav>`;

function plannedWords(I, row) {
  if (!row.words.length) return "";
  return html`<section class="va-card va-card-wide" aria-labelledby="vaPlanWordsH">
    <h2 id="vaPlanWordsH">
      ${I.T("Words planned for this lesson", "Palabras planeadas para esta lección")}
    </h2>
    <ul class="va-chips" lang="en">
      ${row.words.map((w) => html`<li class="va-chip va-chip-static">${w.hw} <span class="fine">${posName(I, w.pos)}</span></li>`)}
    </ul>
    ${row.why ? html`<p class="fine" lang="en">${row.why}</p>` : ""}
  </section>`;
}

/** One dictionary-style entry of the Word List. */
function entryHTML(I, w, i, progress) {
  const state = wordEntry(progress, w.id).state;
  const forms = (w.family || []).map((f) => (typeof f === "string" ? f : f.w)).filter(Boolean);
  return html`<li class="va-wl-entry" id="vaw-${i + 1}">
    <div class="va-wl-head">
      <span class="va-wl-n" aria-hidden="true">${i + 1}</span>
      <h3 class="va-wl-hw" lang="en"><a href="${wordHref(w.id)}">${w.hw}</a></h3>
      ${w.pron ? html`<span class="va-wl-pron" lang="en">(${w.pron})</span>` : ""}
      <span class="va-wl-pos"><em>${posName(I, w.pos)}</em></span>
      <button
        type="button"
        class="btn va-btn va-wl-say"
        data-va-say="${w.hw}"
        aria-label="${I.S(`Hear “${w.hw}”`, `Escuchar “${w.hw}”`)}"
      >
        <span aria-hidden="true">🔊</span>
      </button>
      ${stateBadge(I, state)}
    </div>
    <p class="va-wl-def" lang="en">${w.def}</p>
    ${w.ex ? html`<p class="va-wl-ex" lang="en"><em>${w.ex}</em></p>` : ""}
    ${w.ex2 ? html`<p class="va-wl-ex" lang="en"><em>${w.ex2}</em></p>` : ""}
    ${
      forms.length || w.es?.gloss
        ? html`<p class="va-wl-more fine">
            ${forms.length ? html`<span lang="en"><strong>${I.T("Word forms", "Formas")}:</strong> ${forms.join(", ")}</span>` : ""}
            ${w.es?.gloss ? html`<span><strong>${I.T("Spanish", "Español")}:</strong> <span lang="es">${w.es.gloss}</span>${w.es.cognate ? html` <span class="va-wl-cog">${I.T("cognate", "cognado")}</span>` : ""}</span>` : ""}
          </p>`
        : ""
    }
  </li>`;
}

export async function render(ctx, va) {
  const { I, progress } = va;
  const { grade: g, n } = va.params;
  const overview = await getGradeOverview(g);
  const count = overview?.units?.length || 0;
  // A teacher's custom list ("cu.<slug>", from /lesson/cu_<slug>) is not in the grade scope: it gets a row of its own.
  const custom = isCustomId(n) ? await getUnit(n) : null;
  const row = custom
    ? {
        n: custom.n || 1,
        id: custom.id,
        title: custom.title,
        theme: custom.theme || "",
        strand: custom.strand || "thematic",
        published: true,
        words: [],
        wordIds: custom.words.map((w) => w.id),
      }
    : overview?.units.find((u) => u.n === n);
  const key = custom ? custom.id : n;
  if (!overview?.shipped || !row)
    return {
      title: I.S("Lesson not found", "Lección no encontrada"),
      html: html`${crumbs(I, lessonTrail(I, g, n, 0, true))}${notPublishedPanel(I, {
        title: overview?.shipped
          ? I.T("There is no lesson with that number", "No hay una lección con ese número")
          : I.T(`${gradeName(I, g)} is coming later`, `${gradeName(I, g)} llegará más adelante`),
        text: overview?.shipped
          ? I.T("Pick a lesson from the grade page.", "Elige una lección en la página del grado.")
          : I.T(
              "Grades 9 to 12 are not part of this release.",
              "Los grados 9 a 12 no forman parte de esta versión.",
            ),
        href: overview?.shipped ? gradeHref(g) : vaHref("grades"),
        label: overview?.shipped
          ? I.T("Back to the grade", "Volver al grado")
          : I.T("See the grades that are ready", "Ver los grados que están listos"),
      })}`,
    };

  const unit = row.published ? await getUnit(row.id) : null;
  const loadFailed = row.published && !unit;
  const strand = STRAND[row.strand] ? I.T(...STRAND[row.strand]) : "";
  const u = custom ? 0 : unitOfLesson(row.n, count);
  const crumbTrail = crumbs(I, lessonTrail(I, g, key, custom ? 0 : count, true));

  const header = html`<header class="va-hero va-unit-hero">
    ${unitCover(row.n, row.strand)}
    <div>
      <p class="eyebrow">
        ${gradeName(I, g)}${u ? html` · ${I.T("Unit", "Unidad")} ${u}` : ""} ·
        ${lessonLabel(I, key)}${strand ? html` · ${strand}` : ""}
      </p>
      <h1 id="vaTitle" tabindex="-1">${row.title}</h1>
      ${row.theme ? html`<p class="va-lead">${row.theme}</p>` : ""}
    </div>
  </header>`;

  if (!row.published)
    return {
      title: row.title,
      html: html`${crumbTrail}${header}
        <section class="va-panel va-empty" aria-labelledby="vaNotPubH">
          <h2 id="vaNotPubH">
            ${I.T("This lesson is not published yet", "Esta lección todavía no está publicada")}
          </h2>
          <p>
            ${I.T("Its words and exercises are still being written, so there is nothing to open yet. Your progress in other lessons is safe.", "Sus palabras y ejercicios se están escribiendo, así que todavía no hay nada que abrir. Tu progreso en otras lecciones está a salvo.")}
          </p>
          <p>
            <a class="btn btn-primary va-btn" href="${gradeHref(g)}"
              >${I.T("Back to the grade", "Volver al grado")}</a
            >
          </p>
        </section>
        ${plannedWords(I, row)}
        <section class="va-card va-card-wide" aria-labelledby="vaLessonsH">
          <h2 id="vaLessonsH">${I.T("In this lesson", "En esta lección")}</h2>
          ${sectionList(I, g, { id: row.id, wordIds: [] }, key, progress, false)}
        </section>`,
    };

  if (loadFailed)
    return {
      title: row.title,
      html: html`${crumbTrail}${header}
        <section class="va-panel va-empty" role="alert" aria-labelledby="vaLoadH">
          <h2 id="vaLoadH">
            ${I.T("We could not load this lesson", "No pudimos cargar esta lección")}
          </h2>
          <p>
            ${I.T("Check your connection and try again. Your progress is safe on this device.", "Revisa tu conexión e inténtalo de nuevo. Tu progreso está a salvo en este dispositivo.")}
          </p>
          <p>
            <button type="button" class="btn btn-primary va-btn" data-va-retry>
              ${I.T("Try again", "Intentar de nuevo")}
            </button>
          </p>
        </section>`,
    };

  const wordIds = unit.words.map((w) => w.id);
  const st = unitStatus(progress, unit.id, wordIds);
  const next = nextLesson(progress, unit.id);
  const reviewWords =
    Array.isArray(unit.review) && unit.review.length ? await getWords(unit.review) : [];
  const chip = (w) => {
    const state = wordEntry(progress, w.id).state;
    return html`<li>
      <a class="va-chip" href="${wordHref(w.id)}" data-state="${state}">
        <span class="va-chip-word" lang="en">${w.hw}</span>
        <span class="fine">${posName(I, w.pos)}</span>
        ${stateBadge(I, state)}
      </a>
    </li>`;
  };
  const assess = ["A", "B"].filter((f) => st.assess[f]);
  const gamesHref = `${vaHref("games")}?grade=${encodeURIComponent(g)}&unit=${encodeURIComponent(unit.id)}`;
  const practiceHref = `${vaHref("practice")}?unit=${encodeURIComponent(unit.id)}`;

  return {
    title: `${lessonLabel(I, key)}: ${unit.title}`,
    html: html`${crumbTrail}${header} ${va.teacher ? teacherStrip(I, g, key, unit) : ""}
      <section class="va-card va-card-wide va-next" aria-labelledby="vaNextH">
        <h2 id="vaNextH">
          ${next.letter ? I.T("Next up", "Lo que sigue") : I.T("Lesson finished", "Lección terminada")}
        </h2>
        ${
          next.letter
            ? html`<p>${sectionName(I, next.letter, key)}</p>
                <p>
                  <a class="btn btn-primary va-btn" href="${lessonHref(g, key, next.letter)}"
                    >${next.resume ? I.T("Continue", "Continuar") : I.T("Start", "Comenzar")}:
                    ${sectionName(I, next.letter, key)}</a
                  >
                </p>`
            : html`<p>
                ${I.T("You finished every part of this lesson. Open any part to review it, or go on to the unit activities.", "Terminaste todas las partes de esta lección. Abre cualquier parte para repasarla o sigue con las actividades de la unidad.")}
              </p>`
        }
        ${progressMeter(I, st.doneCount, LESSONS.length, I.S("Parts of this lesson done", "Partes completas de esta lección"))}
        <span class="fine"
          >${I.T(`${st.doneCount} of ${LESSONS.length} parts done`, `${st.doneCount} de ${LESSONS.length} partes completas`)}</span
        >
      </section>

      <section class="va-card va-card-wide va-wordlist" aria-labelledby="vaWordsH">
        <h2 id="vaWordsH">${I.T("Word List", "Lista de palabras")}</h2>
        <p class="fine">
          ${I.T(`Study the ${wordIds.length} words. Read each meaning and example out loud. Tap the speaker to hear a word.`, `Estudia las ${wordIds.length} palabras. Lee en voz alta cada significado y ejemplo. Toca el altavoz para escuchar una palabra.`)}
        </p>
        <ol class="va-wl">
          ${unit.words.map((w, i) => entryHTML(I, w, i, progress))}
        </ol>
        ${
          reviewWords.length
            ? html`<h3>
                  ${I.T("Words from earlier lessons we will see again", "Palabras de lecciones anteriores que veremos otra vez")}
                </h3>
                <ul class="va-chips">
                  ${reviewWords.map(chip)}
                </ul>`
            : ""
        }
      </section>

      <section class="va-card va-card-wide" aria-labelledby="vaLessonsH">
        <h2 id="vaLessonsH">${I.T("In this lesson", "En esta lección")}</h2>
        ${sectionList(I, g, { id: unit.id, wordIds }, key, progress, true)}
        ${
          assess.length
            ? html`<p class="fine">
                ${assess.map((f) => html`${I.T("Check", "Evaluación")} ${f}: ${st.assess[f].score}/${st.assess[f].total}. `)}
              </p>`
            : ""
        }
      </section>

      <section class="va-card va-card-wide" aria-labelledby="vaObjH">
        <h2 id="vaObjH">${I.T("What you will be able to do", "Lo que podrás hacer")}</h2>
        <ul class="va-list" lang="en">
          ${(unit.objectives || []).map((o) => html`<li>${o}</li>`)}
        </ul>
      </section>

      <section class="va-card va-card-wide" aria-labelledby="vaMoreH">
        <h2 id="vaMoreH">
          ${I.T("Practice and play with these words", "Practica y juega con estas palabras")}
        </h2>
        <p class="va-actions">
          <a class="btn va-btn" href="${practiceHref}"
            >${I.T("Practice activities", "Actividades de práctica")}</a
          >
          <a class="btn va-btn" href="${gamesHref}">${I.T("Word games", "Juegos de palabras")}</a>
          ${u ? html`<a class="btn btn-primary va-btn" href="${unitHref(g, u)}">${I.T(`Unit ${u}: activities with every unit word`, `Unidad ${u}: actividades con todas las palabras`)}</a>` : ""}
        </p>
      </section>`,
  };
}

export function onClick(e, ctx) {
  const say = e.target.closest?.("[data-va-say]");
  if (say) {
    try {
      speak(say.dataset.vaSay, { lang: "en-US" });
    } catch {
      /* no speech on this device: the word is still on the page */
    }
    return true;
  }
  if (!e.target.closest?.("[data-va-retry]")) return false;
  ctx.rerender();
  return true;
}
