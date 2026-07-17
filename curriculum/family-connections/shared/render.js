import {
  mergeHomework,
  normalizeLessons,
  resolveSection,
  weekHasMeaningfulContent,
} from "./model.js";

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function link(label, href, className = "") {
  const node = element("a", className, label);
  node.href = href;
  if (/^https:\/\//.test(href)) {
    node.target = "_blank";
    node.rel = "noopener";
  }
  return node;
}

function todayName() {
  return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date());
}

const LABELS = {
  en: {
    talk: "Ask at home",
    spotlightKicker: "Try one together",
    spotlightFocus: "This week's focus",
    startPractice: "Start optional practice",
    openHelp: "Open family help",
    vocabTitle: "Words this week",
    vocabHint: "Ask your student to explain each word in their own words.",
    prompts: [
      "Ask them to teach you one step.",
      "Ask what part was tricky.",
      "Ask for one example.",
      "Ask how they checked their answer.",
      "Ask what they noticed.",
    ],
  },
  es: {
    talk: "Pregunte en casa",
    spotlightKicker: "Prueben una juntos",
    spotlightFocus: "El enfoque de esta semana",
    startPractice: "Comenzar práctica opcional",
    openHelp: "Abrir ayuda familiar",
    vocabTitle: "Palabras de esta semana",
    vocabHint: "Pídale a su estudiante que explique cada palabra con sus propias palabras.",
    prompts: [
      "Pídale que le enseñe un paso.",
      "Pregunte qué parte fue difícil.",
      "Pida un ejemplo.",
      "Pregunte cómo comprobó su respuesta.",
      "Pregunte qué notó.",
    ],
  },
};

const labelsFor = (lang) => LABELS[lang === "es" ? "es" : "en"];

function weekLessonDays(snapshot, inputLessons, sectionId) {
  const byId = new Map(normalizeLessons(inputLessons).map((lesson) => [lesson.id, lesson]));
  const section = resolveSection(snapshot, sectionId);
  const days = (section.week?.days ?? [])
    .filter((entry) => entry.status === "lesson" && byId.has(entry.lessonId))
    .map((entry) => ({ entry, lesson: byId.get(entry.lessonId) }));
  return { section, days };
}

export function renderSectionOptions(select, snapshot, selectedId) {
  select.replaceChildren();
  const visible = (snapshot?.sections ?? []).filter((section) => section.visible !== false);
  for (const section of visible) {
    const option = element("option", "", section.label);
    option.value = section.id;
    option.selected = section.id === selectedId;
    select.append(option);
  }
}

export function renderWeek(root, snapshot, inputLessons, sectionId, lang = "en") {
  const t = labelsFor(lang);
  const lessons = normalizeLessons(inputLessons);
  const byId = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const section = resolveSection(snapshot, sectionId);
  root.replaceChildren();
  const meaningful = weekHasMeaningfulContent(section);
  root.classList.toggle("is-empty", !meaningful);
  if (!meaningful) {
    const empty = element("article", "week-empty-state");
    empty.append(
      element("span", "week-empty-icon", "Calendar ready"),
      element("h3", "", "The weekly plan is being prepared."),
      element(
        "p",
        "",
        "Check back soon for this week's lessons. Optional practice is still available below whenever it works for your family.",
      ),
      link("Browse optional practice", "#homework-library"),
    );
    root.append(empty);
    return section;
  }
  let lessonIndex = 0;
  for (const entry of section.week?.days ?? []) {
    const lesson = byId.get(entry.lessonId);
    const isToday = entry.day === todayName();
    const card = element("article", `day-card${isToday ? " current" : ""}`);
    const dayHeading = element("div", "day-heading");
    dayHeading.append(element("p", "day-name", entry.day));
    if (isToday) {
      dayHeading.append(element("span", "today-badge", "Today"));
      card.setAttribute("aria-label", `${entry.day}, today`);
    }
    card.append(dayHeading);
    if (entry.status === "lesson" && lesson) {
      card.append(
        element(
          "strong",
          "lesson-number",
          `Lesson ${lesson.id.replace("-flagship", " · Spotlight")}`,
        ),
      );
      card.append(element("p", "lesson-title", lesson.title));
      if (entry.note) card.append(element("p", "day-note", entry.note));
      const talk = element("p", "day-talk");
      talk.append(
        element("span", "day-talk-label", `${t.talk}: `),
        document.createTextNode(t.prompts[lessonIndex % t.prompts.length]),
      );
      card.append(talk);
      lessonIndex += 1;
      const actions = element("div", "day-links");
      actions.append(link("Open lesson", lesson.lessonPath));
      actions.append(link("Optional family practice", lesson.homeworkPath));
      card.append(actions);
    } else {
      const labels = {
        review: "Review & practice",
        assessment: "Learning check",
        "no-class": "No lesson posted",
      };
      card.append(element("strong", "lesson-number", labels[entry.status] ?? "Update coming soon"));
      card.append(element("p", "day-note", entry.note || "Check back for an update."));
    }
    root.append(card);
  }
  return section;
}

// Highlight one lesson for the "Try one together" spotlight: today's lesson when
// today is a lesson day, otherwise the first lesson of the week.
export function renderSpotlight(root, snapshot, inputLessons, sectionId, lang = "en") {
  const t = labelsFor(lang);
  const { days } = weekLessonDays(snapshot, inputLessons, sectionId);
  root.replaceChildren();
  root.hidden = days.length === 0;
  if (!days.length) return;
  const today = todayName();
  const pick = days.find(({ entry }) => entry.day === today) ?? days[0];
  const { lesson } = pick;
  const card = element("article", "spotlight-card");
  card.append(element("p", "spotlight-kicker", t.spotlightKicker));
  const focus = element("p", "spotlight-focus");
  focus.append(
    element("strong", "", `${t.spotlightFocus}: `),
    document.createTextNode(lesson.title),
  );
  card.append(focus);
  if (lesson.objective) card.append(element("p", "spotlight-objective", lesson.objective));
  const actions = element("div", "spotlight-actions");
  actions.append(link(t.startPractice, lesson.homeworkPath, "button button-secondary"));
  if (lesson.familyPath) actions.append(link(t.openHelp, lesson.familyPath, "text-link"));
  card.append(actions);
  root.append(card);
}

// Vocabulary preview drawn from the week's lessons (ESOL-friendly study list).
export function renderWeekVocab(root, snapshot, inputLessons, sectionId, lang = "en") {
  const t = labelsFor(lang);
  const { days } = weekLessonDays(snapshot, inputLessons, sectionId);
  const words = [...new Set(days.flatMap(({ lesson }) => lesson.vocabulary ?? []))]
    .filter(Boolean)
    .slice(0, 10);
  root.replaceChildren();
  root.hidden = words.length === 0;
  if (!words.length) return;
  const card = element("article", "vocab-card");
  card.append(element("p", "vocab-title", t.vocabTitle));
  const chips = element("ul", "vocab-chips");
  for (const word of words) chips.append(element("li", "vocab-chip", word));
  card.append(chips);
  card.append(element("p", "vocab-hint", t.vocabHint));
  root.append(card);
}

export function renderAnnouncements(section, root, snapshot) {
  const items = (snapshot?.announcements ?? [])
    .filter((item) => item.visible !== false)
    .slice()
    .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)));
  section.hidden = items.length === 0;
  root.replaceChildren();
  for (const item of items) {
    const card = element("article", `announcement-card${item.pinned ? " is-pinned" : ""}`);
    const head = element("div", "announcement-head");
    head.append(element("h3", "", item.title));
    if (item.pinned) head.append(element("span", "announcement-pin", "Pinned"));
    if (item.date) head.append(element("span", "announcement-date", item.date));
    card.append(head, element("p", "", item.body));
    root.append(card);
  }
}

export function renderResources(root, snapshot) {
  root.replaceChildren();
  for (const item of (snapshot?.resources ?? []).filter((resource) => resource.visible !== false)) {
    const card = link(item.title, item.url, "resource-link");
    if (item.description) card.append(element("span", "", item.description));
    root.append(card);
  }
}

export function filterHomework(homework, query, unit) {
  const needle = String(query ?? "")
    .trim()
    .toLowerCase();
  return homework.filter((item) => {
    const unitMatches = !unit || String(item.unit) === String(unit);
    const searchMatches =
      !needle ||
      [item.id, item.title, item.objective, item.standard, ...item.vocabulary]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    return unitMatches && searchMatches;
  });
}

export function renderHomework(root, inputLessons, overrides, options = {}) {
  const all = mergeHomework(inputLessons, overrides);
  const filtered = filterHomework(all, options.query, options.unit);
  const limit = Number(options.limit) || filtered.length;
  root.replaceChildren();
  for (const item of filtered.slice(0, limit)) {
    const card = element("article", "homework-card");
    const meta = element("div", "homework-meta");
    meta.append(element("span", "", `Lesson ${item.id}`), element("span", "", item.estimatedTime));
    card.append(meta, element("h3", "", item.title));
    if (item.objective) {
      const focus = element("p", "homework-focus");
      focus.append(element("strong", "", "Learning focus: "), item.objective);
      card.append(focus);
    }
    const actions = element("div", "homework-actions");
    actions.append(link("Start optional practice", item.homeworkPath));
    if (item.familyPath) actions.append(link("Open family help", item.familyPath));
    if (item.arcadePath) {
      const arcade = link("Play lesson arcade", item.arcadePath, "arcade-link");
      arcade.setAttribute("aria-label", `Play ${item.arcadeTitle || "lesson arcade"}`);
      actions.append(arcade);
    }
    for (const extra of item.supplementalLinks) actions.append(link(extra.label, extra.url));
    card.append(actions);
    const disclosure = element("details", "homework-details-disclosure");
    disclosure.append(element("summary", "", "Directions & ways to help"));
    const support = element("div", "homework-support-content");
    support.append(element("p", "homework-directions", item.directions));
    const details = element("ul", "homework-details");
    details.append(element("li", "", `Materials: ${item.materials}`));
    details.append(element("li", "", item.languageSupport));
    details.append(element("li", "", item.schoolAlternative));
    support.append(details);
    disclosure.append(support);
    card.append(disclosure);
    root.append(card);
  }
  if (!filtered.length) {
    root.append(
      element(
        "p",
        "empty-state",
        "No lessons match that search. Try a lesson number or clear a filter.",
      ),
    );
  }
  return { all, filtered, visible: Math.min(limit, filtered.length) };
}

export function familyWeekSpeech(snapshot, inputLessons, sectionId) {
  const byId = new Map(normalizeLessons(inputLessons).map((lesson) => [lesson.id, lesson]));
  const section = resolveSection(snapshot, sectionId);
  const days = (section.week?.days ?? []).map((entry) => {
    const lesson = byId.get(entry.lessonId);
    if (entry.status === "lesson" && lesson)
      return `${entry.day}: Lesson ${lesson.id}, ${lesson.title}. ${entry.note}`;
    return `${entry.day}: ${entry.note || entry.status.replace("-", " ")}.`;
  });
  return `${section.week?.label}. ${section.label}. ${section.week?.note} ${days.join(" ")}`;
}

// Plain-text week summary for the Email / Text / calendar description actions.
export function familyWeekShare(snapshot, inputLessons, sectionId, lang = "en") {
  const es = lang === "es";
  const byId = new Map(normalizeLessons(inputLessons).map((lesson) => [lesson.id, lesson]));
  const section = resolveSection(snapshot, sectionId);
  const weekLabel = section.week?.label || (es ? "Esta semana" : "This Week");
  const statusLabel = {
    review: es ? "Repaso y práctica" : "Review & practice",
    assessment: es ? "Evaluación" : "Learning check",
    "no-class": es ? "Sin lección" : "No lesson posted",
  };
  const lines = (section.week?.days ?? []).map((entry) => {
    const lesson = byId.get(entry.lessonId);
    if (entry.status === "lesson" && lesson) {
      return `${entry.day}: ${lesson.title}${entry.note ? ` — ${entry.note}` : ""}`;
    }
    return `${entry.day}: ${entry.note || statusLabel[entry.status] || ""}`.trim();
  });
  const subject = `${es ? "Matemáticas esta semana" : "Math this week"} · ${weekLabel}`;
  const intro = es
    ? "Esto es lo que su estudiante está aprendiendo en matemáticas."
    : "Here is what your student is learning in math.";
  const closer = es
    ? "La práctica familiar es opcional y nunca se califica."
    : "Family practice is optional and never graded.";
  const body = [subject, "", intro, "", ...lines, "", closer].join("\n");
  return { subject, body };
}
