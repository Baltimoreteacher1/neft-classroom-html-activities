// My Vocabulary — the student dashboard (/vocabulary-academy). Core-owned.
// Where am I (grade + pathway), what do I continue, what is due, what should I do next, how are my words doing.
import { formatDate, html } from "../../util.js";
import { LESSONS, SHIPPED_GRADES, STATES } from "../contract.js";
import { getIndex, getUnit, parseUnitId, lessonHref, vaHref, gradeHref } from "../data.js";
import { setPathway, studentSummary, unitStatus } from "../model.js";
import { reviewLoad } from "../srs.js";
import { gradeName, gradeNameS, onSetGrade, stateBadge, suggestedGrades } from "../ui.js";

const lessonName = (I, letter) => {
  const l = LESSONS.find((x) => x.id === letter);
  return l ? I.T(l.en, l.es) : "";
};

/** Where Continue learning goes: the exact unit and lesson letter the learner stopped at, else the first undone one. */
export function continueTarget(progress, index) {
  const published = new Map();
  for (const [g, grade] of Object.entries(index?.grades || {}))
    for (const u of grade.units || []) published.set(u.id, { ...u, grade: g });
  const pick = (unit, from = "a") => {
    const st = unitStatus(progress, unit.id);
    const order = LESSONS.map((l) => l.id);
    const start = order.indexOf(from);
    const letter = [...order.slice(start), ...order.slice(0, start)].find(
      (l) => !st.lessons[l].done,
    );
    return letter ? { unit, letter, doneCount: st.doneCount } : null;
  };
  const last = progress.last;
  if (last && published.has(last.unit)) {
    const unit = published.get(last.unit);
    const hit = pick(unit, last.lesson);
    const lessonState = unitStatus(progress, unit.id).lessons[last.lesson];
    if (hit) return { ...hit, kind: lessonState.done ? "next" : "resume" };
  }
  const grades = progress.grade && SHIPPED_GRADES.includes(progress.grade) ? [progress.grade] : SHIPPED_GRADES;
  for (const g of grades)
    for (const unit of (index?.grades?.[g]?.units || []).map((u) => ({ ...u, grade: g }))) {
      const hit = pick(unit);
      if (hit) return { ...hit, kind: hit.doneCount ? "next" : "start" };
    }
  return null;
}

/** One recommended activity with the reason it was chosen. Pure. */
export function recommend({ load, summary, hasContinue, I }) {
  const learning = summary.words.byState.learning || 0;
  if (load.today > 0)
    return {
      id: "review",
      href: vaHref("review"),
      label: I.T("Review today's words", "Repasar las palabras de hoy"),
      reason: I.T(
        `${load.today} of your words are ready to see again. Coming back to a word after a few days is how it stays with you.`,
        `${load.today} de tus palabras están listas para verse otra vez. Volver a una palabra después de unos días es lo que ayuda a que se quede contigo.`,
      ),
    };
  if (learning >= 3)
    return {
      id: "practice",
      href: vaHref("practice"),
      label: I.T("Play a practice game", "Jugar un juego de práctica"),
      reason: I.T(
        `${learning} of your words are still new to you. A short game is a good way to meet them again.`,
        `${learning} de tus palabras todavía son nuevas para ti. Un juego corto es una buena manera de volver a verlas.`,
      ),
    };
  if (summary.words.total > 0)
    return {
      id: "word-study",
      href: vaHref("word-study"),
      label: I.T("Explore word parts", "Explorar partes de palabras"),
      reason: I.T(
        "Prefixes, suffixes and roots help you work out words you have never seen.",
        "Los prefijos, sufijos y raíces te ayudan a descifrar palabras que nunca has visto.",
      ),
    };
  return {
    id: "start",
    href: hasContinue ? "" : vaHref("grades"),
    label: hasContinue ? "" : I.T("Choose a grade", "Elegir un grado"),
    reason: I.T(
      "You have not met any words yet. Open a lesson and begin with its Word List.",
      "Todavía no has conocido ninguna palabra. Abre una lección y comienza con su Lista de palabras.",
    ),
  };
}

function gradePicker(I, current, labBand) {
  const suggested = suggestedGrades(labBand);
  return html`<div
    class="va-grade-picker"
    role="group"
    aria-label="${I.S("Choose your grade", "Elige tu grado")}"
  >
    ${SHIPPED_GRADES.map(
      (g) =>
        html`<button
          type="button"
          class="btn va-btn va-grade-btn"
          data-va-set-grade="${g}"
          aria-pressed="${g === current}"
        >
          <span class="va-grade-btn-n">${g}</span>
          ${suggested.includes(g) ? html`<span class="va-suggested">${I.T("suggested", "sugerido")}</span>` : ""}
          <span class="visually-hidden">${gradeNameS(I, g)}</span>
        </button>`,
    )}
  </div>`;
}

function continueCard(I, cont) {
  if (!cont)
    return html`<p>
        ${I.T(
          "There is no lesson to continue yet. When lessons are published for your grade they will appear here.",
          "Todavía no hay una lección para continuar. Cuando se publiquen lecciones para tu grado, aparecerán aquí.",
        )}
      </p>
      <p>
        <a class="btn va-btn" href="${vaHref("grades")}"
          >${I.T("See all grades", "Ver todos los grados")}</a
        >
      </p>`;
  const { unit, letter, kind, doneCount } = cont;
  const verb = kind === "resume" ? I.T("Continue", "Continuar") : I.T("Start", "Comenzar");
  return html`<p class="va-kicker">
      ${gradeName(I, unit.grade)} · ${I.T("Lesson", "Lección")} ${unit.n}
    </p>
    <p class="va-card-title">${unit.title}</p>
    <p>
      ${I.T("Lesson", "Lección")} ${letter.toUpperCase()}: ${lessonName(I, letter)}
      <span class="fine">· ${doneCount}/8 ${I.T("lessons done", "lecciones completas")}</span>
    </p>
    <p>
      <a class="btn btn-primary va-btn" href="${lessonHref(unit.grade, unit.n, letter)}"
        >${verb} ${I.T("Lesson", "Lección")} ${letter.toUpperCase()}</a
      >
      <a class="btn va-btn" href="${lessonHref(unit.grade, unit.n)}"
        >${I.T("All lessons in this lesson", "Todas las lecciones de esta lección")}</a
      >
    </p>`;
}

function reviewCard(I, load) {
  if (load.today > 0)
    return html`<p class="va-big-number">
        <strong>${load.today}</strong>
        <span
          >${I.T(load.today === 1 ? "word to review" : "words to review", load.today === 1 ? "palabra por repasar" : "palabras por repasar")}</span
        >
      </p>
      <p class="fine">
        ${I.T(`Today's review is up to ${load.cap} words${load.due > load.today ? `; ${load.due - load.today} more are waiting for tomorrow` : ""}.`, `El repaso de hoy es de hasta ${load.cap} palabras${load.due > load.today ? `; otras ${load.due - load.today} esperan hasta mañana` : ""}.`)}
      </p>
      <p>
        <a class="btn btn-primary va-btn" href="${vaHref("review")}"
          >${I.T("Start review", "Comenzar el repaso")}</a
        >
      </p>`;
  return html`<p>
      ${
        load.doneToday > 0
          ? I.T(
              `You reviewed ${load.doneToday} ${load.doneToday === 1 ? "word" : "words"} today. That is your review done for now.`,
              `Hoy repasaste ${load.doneToday} ${load.doneToday === 1 ? "palabra" : "palabras"}. Con eso terminaste el repaso por ahora.`,
            )
          : I.T("No words are due today.", "Hoy no hay palabras por repasar.")
      }
      ${load.next ? html`<span class="fine">${I.T("Next review:", "Próximo repaso:")} ${formatDate(load.next)}</span>` : ""}
    </p>
    <p>
      <a class="btn va-btn" href="${vaHref("review")}"
        >${I.T("Open Review & Assess", "Abrir Repaso y evaluación")}</a
      >
    </p>`;
}

function stateSummary(I, summary) {
  const total = summary.words.total;
  if (!total)
    return html`<p>
      ${I.T("No words yet. Open a lesson and your first words will show up here.", "Todavía no hay palabras. Abre una lección y tus primeras palabras aparecerán aquí.")}
    </p>`;
  return html`<p>
      ${I.T(`${total} ${total === 1 ? "word" : "words"} so far. ${summary.learned} you can use in context.`, `${total} ${total === 1 ? "palabra" : "palabras"} hasta ahora. ${summary.learned} que puedes usar en contexto.`)}
    </p>
    <ul class="va-states" aria-label="${I.S("Words by state", "Palabras por estado")}">
      ${STATES.map((s) => html`<li>${stateBadge(I, s, summary.words.byState[s])}</li>`)}
    </ul>`;
}

async function completedUnits(I, progress, index) {
  const done = [];
  for (const [g, grade] of Object.entries(index?.grades || {}))
    for (const u of grade.units || [])
      if (unitStatus(progress, u.id).doneCount === LESSONS.length) done.push({ ...u, grade: g });
  if (!done.length)
    return html`<p>
      ${I.T("No lessons finished yet. Each lesson has a word list, Exercises A to F and a lesson review.", "Todavía no terminaste ninguna lección. Cada lección tiene una lista de palabras, los Ejercicios A a F y un repaso.")}
    </p>`;
  return html`<ul class="va-list">
    ${done.map((u) => html`<li><a href="${lessonHref(u.grade, u.n)}">${gradeName(I, u.grade)} · ${I.T("Lesson", "Lección")} ${u.n}: ${u.title}</a></li>`)}
  </ul>`;
}

export async function render(ctx, va) {
  const { I, progress } = va;
  const now = new Date();
  const index = await getIndex();
  const gradeOf = (id) => index.words?.[id]?.grade;
  const summary = studentSummary(progress, { now, gradeOf });
  const load = reviewLoad(progress, now);
  const cont = continueTarget(progress, index);
  const rec = recommend({ load, summary, hasContinue: Boolean(cont), I });
  const grade = SHIPPED_GRADES.includes(progress.grade) ? progress.grade : "";
  const gradeUnits = grade ? index.grades?.[grade]?.unitCount || 0 : 0;
  // Warm the unit the learner is about to open (a miss is fine: the unit page says so truthfully).
  if (cont) getUnit(cont.unit.id);

  return {
    title: I.S("My Vocabulary", "Mi vocabulario"),
    html: html`<header class="va-hero">
        <p class="eyebrow">${I.T("Vocabulary Academy", "Academia de Vocabulario")}</p>
        <h1 id="vaTitle" tabindex="-1">${I.T("My Vocabulary", "Mi vocabulario")}</h1>
        <p class="va-lead">
          ${I.T("Learn words in short lessons, see them again at the right time, and use them in your own reading and writing.", "Aprende palabras en lecciones breves, vuelve a verlas en el momento justo y úsalas al leer y escribir.")}
        </p>
      </header>

      <div class="va-grid">
        <section class="va-card va-card-wide" aria-labelledby="vaGradeH">
          <h2 id="vaGradeH">${I.T("My grade and pathway", "Mi grado y mi ruta")}</h2>
          ${
            grade
              ? html`<p class="va-grade-now">
                    <strong>${gradeName(I, grade)}</strong>
                    <span class="fine"
                      >${gradeUnits ? I.T(`${gradeUnits} lessons published`, `${gradeUnits} lecciones publicadas`) : I.T("Lessons are not published for this grade yet", "Todavía no hay lecciones publicadas para este grado")}</span
                    >
                  </p>
                  <p>
                    <a class="btn va-btn" href="${gradeHref(grade)}"
                      >${I.T("Open this grade", "Abrir este grado")}</a
                    >
                    <a class="btn va-btn" href="${vaHref("grades")}"
                      >${I.T("Change grade", "Cambiar de grado")}</a
                    >
                  </p>`
              : html`<p>
                    ${I.T("Choose the grade you want to work on. You can change it any time.", "Elige el grado en el que quieres trabajar. Puedes cambiarlo cuando quieras.")}
                  </p>
                  ${gradePicker(I, grade, ctx.band)}`
          }
          <fieldset class="va-fieldset">
            <legend>${I.T("My pathway", "Mi ruta")}</legend>
            <label class="va-choice"
              ><input
                type="radio"
                name="vaPathway"
                value="grade"
                data-va-pathway
                ${progress.pathway !== "support" ? "checked" : ""}
              />
              <span>${I.T("Grade-level pathway", "Ruta de mi grado")}</span></label
            >
            <label class="va-choice"
              ><input
                type="radio"
                name="vaPathway"
                value="support"
                data-va-pathway
                ${progress.pathway === "support" ? "checked" : ""}
              />
              <span
                >${I.T("Grade-level pathway with extra language support", "Ruta de mi grado con más apoyo de idioma")}</span
              ></label
            >
            <p class="fine">
              ${I.T("Either way you stay with your grade's words. Extra support shows more helps, such as pictures, audio and sentence frames, where a lesson offers them. It never moves you to easier words.", "De cualquier forma te quedas con las palabras de tu grado. El apoyo extra muestra más ayudas, como imágenes, audio y marcos de oración, donde la lección las ofrece. Nunca te pasa a palabras más fáciles.")}
            </p>
          </fieldset>
        </section>

        <section class="va-card" aria-labelledby="vaContinueH">
          <h2 id="vaContinueH">${I.T("Continue learning", "Seguir aprendiendo")}</h2>
          ${continueCard(I, cont)}
        </section>

        <section class="va-card" aria-labelledby="vaReviewH">
          <h2 id="vaReviewH">${I.T("Words to review today", "Palabras por repasar hoy")}</h2>
          ${reviewCard(I, load)}
        </section>

        <section class="va-card" aria-labelledby="vaNextH">
          <h2 id="vaNextH">${I.T("Recommended next", "Lo siguiente que te recomendamos")}</h2>
          <p class="va-card-title">${rec.label || I.T("Open a lesson", "Abre una lección")}</p>
          <p>${I.T("Why:", "Por qué:")} ${rec.reason}</p>
          ${rec.href ? html`<p><a class="btn btn-primary va-btn" href="${rec.href}">${rec.label}</a></p>` : ""}
        </section>

        <section class="va-card va-card-wide" aria-labelledby="vaWordsH">
          <h2 id="vaWordsH">${I.T("My words", "Mis palabras")}</h2>
          ${stateSummary(I, summary)}
          <p class="fine">
            ${I.T("A word moves forward only when you show it in several ways and again on later days, not after one answer.", "Una palabra avanza solo cuando la muestras de varias maneras y otra vez en días posteriores, no después de una sola respuesta.")}
          </p>
        </section>

        <section class="va-card va-card-wide" aria-labelledby="vaDoneH">
          <h2 id="vaDoneH">${I.T("Completed lessons", "Lecciones terminadas")}</h2>
          ${await completedUnits(I, progress, index)}
        </section>
      </div>

      <nav
        class="va-more"
        aria-label="${I.S("More in Vocabulary Academy", "Más en la Academia de Vocabulario")}"
      >
        <a class="btn va-btn" href="${vaHref("grades")}"
          >${I.T("Grade levels", "Niveles por grado")}</a
        >
        <a class="btn va-btn" href="${vaHref("practice")}"
          >${I.T("Games & practice", "Juegos y práctica")}</a
        >
        <a class="btn va-btn" href="${vaHref("word-study")}"
          >${I.T("Word Study Lab", "Laboratorio de palabras")}</a
        >
        <a class="btn va-btn" href="${vaHref("review")}"
          >${I.T("Review & Assess", "Repaso y evaluación")}</a
        >
        <a class="btn va-btn" href="${vaHref("family")}">${I.T("For families", "Para familias")}</a>
        <a class="btn va-btn" href="/access-practice-lab/passport"
          >${I.T("Move my progress to another device", "Llevar mi progreso a otro dispositivo")}</a
        >
      </nav>`,
  };
}

export function onClick(e, ctx, va) {
  return onSetGrade(e, ctx, va);
}

export function onChange(e, ctx, va) {
  const radio = e.target.closest?.("[data-va-pathway]");
  if (!radio) return false;
  setPathway(va.progress, radio.value);
  va.save();
  return true;
}

export { parseUnitId };
