import { DAYS, normalizeLessons, resolveSection, pickLang, weekNote, safeExternalUrl } from "./model.js";

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
  }).format(new Date(`${iso}T12:00:00Z`));

/** The public page and authenticated preview use exactly the same view. */
export function renderHomeworkHub(
  root,
  snapshot,
  lessons,
  sectionId,
  lang = "en",
  { preview = false, now = new Date() } = {},
) {
  const es = lang === "es";
  const t = (en, spanish) => (es ? spanish : en);
  const section = resolveSection(snapshot, sectionId);
  const phase = weekPhase(section.week?.startDate, now);
  root.replaceChildren();
  const week = el("section", undefined, "hub-panel");
  week.id = "family-week";
  week.append(el("p", section.label, "eyebrow"));
  week.append(
    el(
      "h2",
      phase === "upcoming"
        ? t("Upcoming homework", "Próximas tareas")
        : t("This week’s homework", "Tareas de esta semana"),
    ),
  );
  if (phase !== "empty")
    week.append(
      el(
        "p",
        `${dateLabel(section.week.startDate, lang)} – ${dateLabel(addDays(section.week.startDate, 4), lang)}`,
        "week-dates",
      ),
    );
  const assignments = assignedHomework(snapshot, lessons, section.id);
  if (phase === "past" && !preview) {
    week.append(
      el(
        "p",
        t(
          "A new week has not been posted yet. These dates are from the last posted week. Please check ClassDojo for an update.",
          "Aún no se ha publicado la nueva semana. Estas fechas son de la última semana publicada. Consulta ClassDojo para ver novedades.",
        ),
        "empty-state",
      ),
    );
  } else if (phase === "empty" || !assignments.length) {
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
    const note = weekNote(section.week, lang);
    if (note) week.append(el("p", note));
    const list = el("div", undefined, "homework-list");
    const byDay = new Map(assignments.map((item) => [item.entry.day, item]));
    for (const day of DAYS) {
      const item = byDay.get(day);
      const card = el("article", undefined, "homework-card");
      card.append(el("h3", t(day, { Monday: "Lunes", Tuesday: "Martes", Wednesday: "Miércoles", Thursday: "Jueves", Friday: "Viernes" }[day])));
      if (!item) {
        card.append(el("p", t("No homework posted for this day.", "No hay tarea publicada para este día."), "quiet"));
        list.append(card);
        continue;
      }
      card.append(
        el(
          "p",
          `${t("Lesson", "Lección")} ${item.id} · ${t("About 10 minutes", "Unos 10 minutos")}`,
          "eyebrow",
        ),
      );
      const override = snapshot.homeworkOverrides?.[item.id];
      card.append(el("h4", pickLang(override?.title || item.title, override?.titleEs || item.titleEs, lang)));
      const noteText = pickLang(item.entry.note, item.entry.noteEs, lang);
      if (noteText) card.append(el("p", noteText));
      if (
        item.entry.dueDate &&
        /^\d{4}-\d{2}-\d{2}$/.test(item.entry.dueDate) &&
        addDays(item.entry.dueDate, 0) === item.entry.dueDate
      )
        card.append(el("p", `${t("Due", "Entrega")}: ${dateLabel(item.entry.dueDate, lang)}`, "due-date"));
      const link = el("a", t("Open homework", "Abrir tarea"), "button");
      const path = /^\/lessons\/\d{1,2}-\d{1,2}(?:-flagship)?\/homework(?:\.html)?\/?$/.test(
        item.homeworkPath,
      )
        ? item.homeworkPath
        : `/lessons/${item.id}/homework.html`;
      link.href = `${path}?route=quick&lang=${lang}`;
      card.append(link);
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
  const message = el("section", undefined, "hub-panel message-panel");
  message.append(el("h2", t("Message Mr. Neft", "Enviar un mensaje al Sr. Neft")));
  message.append(
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
  message.append(link);
  root.append(week, message);
}
