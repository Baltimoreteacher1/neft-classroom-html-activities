/* =============================================================================
 * weekly-sheet/sheet-render.js — the Weekly Family Practice Sheet, as markup.
 * -----------------------------------------------------------------------------
 * ONE renderer for three outputs: the digital page (live checkboxes), the
 * browser's "Print this week", and the PDFs scripts/generate-weekly-sheets.mjs
 * prints with Chromium. Pure string building — no DOM, no fetch — so Node and
 * the browser run exactly the same code.
 *
 * `week` comes from weeks.json (built from the pacing plan by
 * scripts/generate-weekly-sheets.mjs). Nothing here decides the schedule.
 * ========================================================================== */

export const LANGS = Object.freeze(["en", "es"]);
export const SITE = "eduwonderlab.com";

export const COPY = Object.freeze({
  en: {
    title: "Weekly Family Practice",
    course: "Grade 6 Math · Mr. Neft",
    student: "Student name",
    period: "Class",
    how: "Practice a little each night. A grown-up checks the box and adds their initials. Bring this sheet to class on the turn-in day for bonus points.",
    colDay: "Night",
    colTask: "What to practice",
    colDone: "Done",
    colInitials: "Grown-up initials",
    lesson: (label, title) => `Family homework · Lesson ${label}: ${title}`,
    review: "Review night: redo one problem from this week’s homework, or play a Fluency Lab round.",
    assessment: "Learning check coming: look over your notes and one past homework.",
    noSchool: "No school",
    turnIn: "Bring this sheet to class today",
    reflect: "One thing I learned or figured out this week:",
    signature: "Grown-up signature",
    date: "Date",
    goal: (goal, nights) =>
      `Bonus goal: practice ${goal} of ${nights} night${nights === 1 ? "" : "s"}.`,
    teacher: "Teacher use",
    teacherNights: "Nights counted",
    teacherBonus: "Bonus given",
    teacherInitials: "Initials",
    footer: "Practice pages and answers:",
  },
  es: {
    title: "Práctica familiar semanal",
    course: "Matemáticas de 6.º grado · Sr. Neft",
    student: "Nombre del estudiante",
    period: "Clase",
    how: "Practiquen un poco cada noche. Un adulto marca la casilla y escribe sus iniciales. Traigan esta hoja a clase el día de entrega para ganar puntos extra.",
    colDay: "Noche",
    colTask: "Qué practicar",
    colDone: "Listo",
    colInitials: "Iniciales del adulto",
    lesson: (label, title) => `Tarea familiar · Lección ${label}: ${title}`,
    review:
      "Noche de repaso: repitan un problema de la tarea de esta semana, o jueguen una ronda del Laboratorio de Fluidez.",
    assessment:
      "Se acerca una evaluación: repasen sus apuntes y una tarea anterior.",
    noSchool: "No hay clases",
    turnIn: "Traigan esta hoja a clase hoy",
    reflect: "Algo que aprendí o descubrí esta semana:",
    signature: "Firma del adulto",
    date: "Fecha",
    goal: (goal, nights) =>
      `Meta para el punto extra: practicar ${goal} de ${nights} noche${nights === 1 ? "" : "s"}.`,
    teacher: "Uso del maestro",
    teacherNights: "Noches contadas",
    teacherBonus: "Punto extra dado",
    teacherInitials: "Iniciales",
    footer: "Páginas de práctica y respuestas:",
  },
});

const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch],
  );

const LOCALE = { en: "en-US", es: "es-US" };

/** Dates are plain YYYY-MM-DD; format in UTC so a device timezone never shifts the day. */
function formatDate(iso, lang, options) {
  return new Intl.DateTimeFormat(LOCALE[lang], { timeZone: "UTC", ...options }).format(
    new Date(`${iso}T00:00:00Z`),
  );
}

export function weekRange(week, lang) {
  const first = week.days[0].date;
  const last = week.days[week.days.length - 1].date;
  const month = (iso) => formatDate(iso, lang, { month: "long" });
  const day = (iso) => Number(iso.slice(8, 10));
  const year = last.slice(0, 4);
  const sameMonth = first.slice(0, 7) === last.slice(0, 7);
  if (lang === "es") {
    return sameMonth
      ? `${day(first)}–${day(last)} de ${month(first)} de ${year}`
      : `${day(first)} de ${month(first)} – ${day(last)} de ${month(last)} de ${year}`;
  }
  return sameMonth
    ? `${month(first)} ${day(first)}–${day(last)}, ${year}`
    : `${month(first)} ${day(first)} – ${month(last)} ${day(last)}, ${year}`;
}

function taskCell(day, copy, lang) {
  if (day.status === "lesson") {
    const title = day.title[lang] || day.title.en;
    return `<a href="https://${SITE}${day.url}">${escapeHtml(copy.lesson(day.label, title))}</a>
      <span class="ws-url">${SITE}${escapeHtml(day.url)}</span>`;
  }
  return escapeHtml(day.status === "assessment" ? copy.assessment : copy.review);
}

function nightRow(day, copy, lang, state) {
  const dayName = formatDate(day.date, lang, { weekday: "long" });
  const dateText = formatDate(day.date, lang, { month: "short", day: "numeric" });
  const checked = state?.done?.[day.date] ? " checked" : "";
  const initials = escapeHtml(state?.initials?.[day.date] ?? "");
  return `<tr class="ws-night" data-date="${day.date}">
    <th scope="row"><span class="ws-dayname">${escapeHtml(dayName)}</span><span class="ws-date">${escapeHtml(dateText)}</span></th>
    <td class="ws-task">${taskCell(day, copy, lang)}</td>
    <td class="ws-done"><input class="ws-check" type="checkbox" data-date="${day.date}" aria-label="${escapeHtml(`${copy.colDone}: ${dayName}`)}"${checked} /></td>
    <td class="ws-init"><input class="ws-initials" type="text" maxlength="4" autocomplete="off" data-date="${day.date}" aria-label="${escapeHtml(`${copy.colInitials}: ${dayName}`)}" value="${initials}" /></td>
  </tr>`;
}

function noteRow(day, copy, lang, text, className) {
  const dayName = formatDate(day.date, lang, { weekday: "long" });
  const dateText = formatDate(day.date, lang, { month: "short", day: "numeric" });
  return `<tr class="${className}">
    <th scope="row"><span class="ws-dayname">${escapeHtml(dayName)}</span><span class="ws-date">${escapeHtml(dateText)}</span></th>
    <td colspan="3">${escapeHtml(text)}</td>
  </tr>`;
}

/**
 * @param {object} week a weeks.json week
 * @param {"en"|"es"} lang
 * @param {{name?: string, period?: string, signature?: string, signedOn?: string, reflection?: string,
 *          done?: Record<string, boolean>, initials?: Record<string, string>}} [state]
 */
export function renderSheet(week, lang, state = {}) {
  const copy = COPY[lang];
  const nightDates = new Set(week.nights);
  const rows = week.days
    .map((day) => {
      if (nightDates.has(day.date)) return nightRow(day, copy, lang, state);
      if (day.status === "no-class")
        return noteRow(day, copy, lang, day.note[lang] || copy.noSchool, "ws-off");
      return noteRow(day, copy, lang, copy.turnIn, "ws-turnin");
    })
    .join("");
  const attr = (value) => escapeHtml(value ?? "");
  return `<article class="ws-sheet" lang="${lang}" data-week="${week.start}">
  <header class="ws-head">
    <div>
      <p class="ws-brand">EduWonderLab</p>
      <h1 class="ws-title">${escapeHtml(copy.title)}</h1>
    </div>
    <p class="ws-where"><strong>${escapeHtml(weekRange(week, lang))}</strong><br />${escapeHtml(copy.course)}</p>
  </header>
  <div class="ws-name">
    <label class="ws-field ws-field-name">${escapeHtml(copy.student)}<input class="ws-line" type="text" name="name" maxlength="60" autocomplete="off" value="${attr(state.name)}" /></label>
    <label class="ws-field ws-field-period">${escapeHtml(copy.period)}<input class="ws-line" type="text" name="period" maxlength="12" autocomplete="off" value="${attr(state.period)}" /></label>
  </div>
  <p class="ws-how">${escapeHtml(copy.how)}</p>
  <table class="ws-table">
    <thead><tr><th scope="col">${escapeHtml(copy.colDay)}</th><th scope="col">${escapeHtml(copy.colTask)}</th><th scope="col">${escapeHtml(copy.colDone)}</th><th scope="col">${escapeHtml(copy.colInitials)}</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p class="ws-goal">${escapeHtml(copy.goal(week.goal, week.nights.length))}</p>
  <label class="ws-reflect">${escapeHtml(copy.reflect)}<textarea class="ws-lines" name="reflection" rows="3" maxlength="400">${escapeHtml(state.reflection ?? "")}</textarea></label>
  <div class="ws-sign">
    <label class="ws-field ws-field-sign">${escapeHtml(copy.signature)}<input class="ws-line" type="text" name="signature" maxlength="60" autocomplete="off" value="${attr(state.signature)}" /></label>
    <label class="ws-field ws-field-date">${escapeHtml(copy.date)}<input class="ws-line" type="text" name="signedOn" maxlength="20" autocomplete="off" value="${attr(state.signedOn)}" /></label>
  </div>
  <div class="ws-teacher" aria-label="${escapeHtml(copy.teacher)}">
    <strong>${escapeHtml(copy.teacher)}</strong>
    <span>${escapeHtml(copy.teacherNights)}: <i class="ws-blank"></i> / ${week.nights.length}</span>
    <span>${escapeHtml(copy.teacherBonus)}: <i class="ws-box"></i></span>
    <span>${escapeHtml(copy.teacherInitials)}: <i class="ws-blank"></i></span>
  </div>
  <p class="ws-foot">${escapeHtml(copy.footer)} ${SITE}/curriculum/family-connections/</p>
</article>`;
}
