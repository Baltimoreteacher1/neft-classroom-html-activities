import {
  DAYS,
  HOMEWORK_PATH_PATTERN,
  homeworkLabel,
  normalizeLessons,
  resolveSection,
  pickLang,
  weekNote,
  safeExternalUrl,
} from "./model.js";

export function schoolDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function addDays(iso, count) {
  const d = new Date(`${iso}T12:00:00Z`);
  if (!Number.isFinite(d.getTime())) return "";
  d.setUTCDate(d.getUTCDate() + count);
  return d.toISOString().slice(0, 10);
}
export function weekPhase(start, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start || "") || addDays(start, 0) !== start) return "empty";
  const today = schoolDate(now);
  return today < start ? "upcoming" : today > addDays(start, 6) ? "past" : "current";
}
export function familyLink(sectionId, lang = "en", origin = "https://eduwonderlab.com") {
  const url = new URL("/curriculum/family-connections/", origin);
  url.searchParams.set("section", sectionId);
  if (lang === "es") url.searchParams.set("lang", "es");
  return url.href;
}
export function isHomeworkEditorPath(pathname) {
  return /^\/curriculum\/family-connections\/teacher\/homework(?:\.html)?\/?$/i.test(pathname);
}
export function messageDestination(snapshot) {
  const candidate = snapshot?.integrations?.classDojoUrl;
  if (safeExternalUrl(candidate)) {
    const u = new URL(candidate);
    if (
      (u.hostname === "classdojo.com" || u.hostname.endsWith(".classdojo.com")) &&
      u.pathname !== "/"
    )
      return u.href;
  }
  return "https://home.classdojo.com/";
}
export function assignedHomework(snapshot, lessons, sectionId) {
  const section = resolveSection(snapshot, sectionId);
  const byId = new Map(normalizeLessons(lessons).map((item) => [item.id, item]));
  const assignments = [];
  for (const day of DAYS) {
    const entry = section.week?.days?.find((item) => item.day === day);
    if (!entry) continue;
    const lesson = byId.get(entry.lessonId);
    if (
      entry.status !== "lesson" ||
      !lesson ||
      snapshot.homeworkOverrides?.[lesson.id]?.visible === false
    )
      continue;
    assignments.push({ ...lesson, entry });
  }
  return assignments;
}
const el = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
};
const dateLabel = (iso, lang) =>
  new Intl.DateTimeFormat(lang === "es" ? "es-US" : "en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${iso}T12:00:00Z`));
const mondayOf = (iso) => addDays(iso, -(new Date(`${iso}T12:00:00Z`).getUTCDay() + 6) % 7);

/** The public page and authenticated preview use exactly the same view. */
export function renderHomeworkHub(
  root,
  snapshot,
  lessons,
  sectionId,
  lang = "en",
  { preview = false, archive = false, now = new Date() } = {},
) {
  const es = lang === "es";
  const t = (en, spanish) => (es ? spanish : en);
  const section = resolveSection(snapshot, sectionId);
  const phase = weekPhase(section.week?.startDate, now);
  const today = schoolDate(now);
  const displayStart =
    phase === "empty" || (phase === "past" && !preview && !archive)
      ? mondayOf(today)
      : section.week.startDate;
  root.replaceChildren();
  const week = el("section", undefined, "hub-panel");
  week.id = "family-week";
  week.append(el("p", section.label, "eyebrow"));
  if (
    section.id === "all-families" &&
    snapshot.sections?.some((item) => item.visible !== false && item.id !== "all-families")
  )
    week.append(
      el(
        "p",
        t(
          "Shared class updates appear here. Choose your class above for homework assigned to your class.",
          "Aquí aparecen los avisos para todas las clases. Elige tu clase arriba para ver la tarea asignada a tu clase.",
        ),
        "class-guidance",
      ),
    );
  week.append(
    el(
      "h2",
      phase === "past" && !preview && !archive
        ? t("Waiting for this week’s homework", "Esperando las tareas de esta semana")
        : archive && phase === "past"
          ? t("Previous homework", "Tareas anteriores")
          : phase === "upcoming"
            ? t("Upcoming homework", "Próximas tareas")
            : t("This week’s homework", "Tareas de esta semana"),
    ),
  );
  week.append(
    el(
      "p",
      `${dateLabel(displayStart, lang)} – ${dateLabel(addDays(displayStart, 4), lang)}`,
      "week-dates",
    ),
  );
  if (
    (phase !== "past" || archive || preview) &&
    phase !== "empty" &&
    snapshot.publishedAt &&
    Number.isFinite(Date.parse(snapshot.publishedAt))
  ) {
    const updated = new Intl.DateTimeFormat(es ? "es-US" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "America/New_York",
    }).format(new Date(snapshot.publishedAt));
    week.append(
      el(
        "p",
        `${t("Published for this week", "Publicado para esta semana")}: ${updated} · ${t("Eastern time", "hora del Este")}`,
        "quiet last-updated",
      ),
    );
  }
  if (archive && phase === "past")
    week.append(
      el(
        "p",
        t(
          "Previous homework — these dates have passed. Use this plan to review or catch up.",
          "Tareas anteriores: estas fechas ya pasaron. Usa este plan para repasar o ponerte al día.",
        ),
        "archive-notice",
      ),
    );
  const assignments = assignedHomework(snapshot, lessons, section.id);
  if (phase === "past" && !preview && !archive) {
    week.append(
      el(
        "p",
        t(
          "Mr. Neft has not posted a new plan yet. Check ClassDojo for the latest update.",
          "El Sr. Neft aún no ha publicado un plan nuevo. Consulta ClassDojo para ver novedades.",
        ),
        "empty-state",
      ),
    );
    week.append(
      el(
        "p",
        `${t("Last posted", "Última publicación")}: ${dateLabel(section.week.startDate, lang)} – ${dateLabel(addDays(section.week.startDate, 4), lang)}`,
        "quiet last-posted",
      ),
    );
  } else if (phase === "empty") {
    week.append(
      el(
        "p",
        t(
          "No homework is posted for this week. Check back here or message Mr. Neft on ClassDojo.",
          "No hay tareas publicadas para esta semana. Vuelve a consultar o envía un mensaje al Sr. Neft por ClassDojo.",
        ),
        "empty-state",
      ),
    );
  } else {
    if (preview && phase === "past")
      week.append(
        el(
          "p",
          t(
            "Preview: these dates have passed. Families will see a waiting-for-update message.",
            "Vista previa: estas fechas ya pasaron. Las familias verán un aviso de actualización pendiente.",
          ),
          "empty-state",
        ),
      );
    if (!assignments.length) {
      const allNoHomework = DAYS.every(
        (day) => section.week.days?.find((entry) => entry.day === day)?.status === "no-class",
      );
      week.append(
        el(
          "p",
          allNoHomework
            ? t("No homework assigned this week.", "No hay tareas asignadas esta semana.")
            : t(
                "Some homework has not been posted yet. Check the daily statuses below.",
                "Algunas tareas aún no se han publicado. Consulta el estado de cada día abajo.",
              ),
          "empty-state",
        ),
      );
    }
    const note = weekNote(section.week, lang);
    if (note) week.append(el("p", note));
    const list = el("div", undefined, "homework-list");
    const byDay = new Map(assignments.map((item) => [item.entry.day, item]));
    for (const [index, day] of DAYS.entries()) {
      const item = byDay.get(day);
      const card = el("article", undefined, "homework-card");
      const dayDate = addDays(section.week.startDate, index);
      const dayHeading = el("div", undefined, "day-heading");
      dayHeading.append(
        el(
          "h3",
          t(
            day,
            {
              Monday: "Lunes",
              Tuesday: "Martes",
              Wednesday: "Miércoles",
              Thursday: "Jueves",
              Friday: "Viernes",
            }[day],
          ),
        ),
      );
      dayHeading.append(el("span", dateLabel(dayDate, lang), "day-date"));
      if (phase === "current" && dayDate === today) {
        card.classList.add("is-today");
        dayHeading.append(el("span", t("Today", "Hoy"), "today-badge"));
      }
      card.append(dayHeading);
      const content = el("div", undefined, "day-work");
      if (!item) {
        const entry = section.week.days?.find((value) => value.day === day);
        const labels = {
          "no-class": t("No homework assigned.", "No hay tarea asignada."),
          review: t(
            "Review day — see the teacher’s note.",
            "Día de repaso: consulta la nota docente.",
          ),
          assessment: t(
            "Assessment day — see the teacher’s note.",
            "Día de evaluación: consulta la nota docente.",
          ),
        };
        const unavailable = entry?.status === "lesson";
        content.append(
          el(
            "p",
            unavailable
              ? t(
                  "Homework link unavailable. Contact Mr. Neft on ClassDojo.",
                  "El enlace de la tarea no está disponible. Contacta al Sr. Neft por ClassDojo.",
                )
              : labels[entry?.status] || t("Not posted yet.", "Aún no se ha publicado."),
            "quiet",
          ),
        );
        const note = pickLang(entry?.note, entry?.noteEs, lang);
        if (note) content.append(el("p", note));
        card.append(content);
        list.append(card);
        continue;
      }
      content.append(
        el(
          "p",
          item.kind === "unit-review"
            ? `${homeworkLabel(item, lang)} · ${t("Work through it together, a part at a time", "Háganlo juntos, una parte a la vez")}`
            : `${homeworkLabel(item, lang)} · ${t("Choose 20 or 30 minutes", "Elige 20 o 30 minutos")}`,
          "eyebrow",
        ),
      );
      const override = snapshot.homeworkOverrides?.[item.id];
      content.append(
        el("h4", pickLang(override?.title || item.title, override?.titleEs || item.titleEs, lang)),
      );
      const noteText = pickLang(item.entry.note, item.entry.noteEs, lang);
      if (noteText) content.append(el("p", noteText));
      if (
        item.entry.dueDate &&
        /^\d{4}-\d{2}-\d{2}$/.test(item.entry.dueDate) &&
        addDays(item.entry.dueDate, 0) === item.entry.dueDate
      )
        content.append(
          el("p", `${t("Due", "Entrega")}: ${dateLabel(item.entry.dueDate, lang)}`, "due-date"),
        );
      else
        content.append(
          el(
            "p",
            t(
              "Due date: ask Mr. Neft if needed.",
              "Fecha de entrega: consulta al Sr. Neft si la necesitas.",
            ),
            "quiet",
          ),
        );
      content.append(
        el(
          "p",
          t(
            "Complete one route. Work saves on this device; bring your work or questions to class. It is not sent automatically.",
            "Completa una ruta. El trabajo se guarda en este dispositivo; lleva tu trabajo o preguntas a clase. No se envía automáticamente.",
          ),
          "assignment-guidance",
        ),
      );
      const link = el("a", t("Open homework", "Abrir tarea"), "button");
      const path = HOMEWORK_PATH_PATTERN.test(item.homeworkPath)
        ? item.homeworkPath
        : `/lessons/${item.id}/homework.html`;
      link.href = `${path}?route=core&lang=${lang}&section=${encodeURIComponent(section.id)}`;
      card.append(content, link);
      list.append(card);
    }
    week.append(list);
    week.append(
      el(
        "p",
        t(
          "Paper and pencil are enough. Students can practice on their own or with a trusted adult.",
          "Basta con papel y lápiz. El estudiante puede practicar solo o con un adulto de confianza.",
        ),
        "quiet",
      ),
    );
  }
  if (!assignments.length && !preview) {
    const optional = el(
      "p",
      t("Optional review, not assigned homework: ", "Repaso opcional, no tarea asignada: "),
      "optional-review",
    );
    const guide = el("a", t("Family math guides", "Guías de matemáticas para familias"));
    guide.href = "/families/";
    optional.append(guide);
    week.append(optional);
  }
  const message = el("section", undefined, "message-panel");
  const messageCopy = el("div", undefined, "message-copy");
  messageCopy.append(el("h2", t("Need to reach Mr. Neft?", "¿Necesitas contactar al Sr. Neft?")));
  messageCopy.append(
    el(
      "p",
      t(
        "Sign in to ClassDojo, open Messages, and choose your conversation with Mr. Neft.",
        "Inicia sesión en ClassDojo, abre Mensajes y elige tu conversación con el Sr. Neft.",
      ),
    ),
  );
  const link = el(
    "a",
    t("Open ClassDojo · sign in", "Abrir ClassDojo · iniciar sesión"),
    "button button-secondary",
  );
  link.href = messageDestination(snapshot);
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  message.append(messageCopy, link);
  root.append(week, message);
}
