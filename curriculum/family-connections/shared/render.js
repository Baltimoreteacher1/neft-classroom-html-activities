import { mergeHomework, normalizeLessons, resolveSection } from "./model.js";

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

export function renderWeek(root, snapshot, inputLessons, sectionId) {
  const lessons = normalizeLessons(inputLessons);
  const byId = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const section = resolveSection(snapshot, sectionId);
  root.replaceChildren();
  for (const entry of section.week?.days ?? []) {
    const lesson = byId.get(entry.lessonId);
    const card = element("article", `day-card${entry.day === todayName() ? " current" : ""}`);
    card.append(element("p", "day-name", entry.day));
    if (entry.status === "lesson" && lesson) {
      card.append(element("strong", "lesson-number", `Lesson ${lesson.id.replace("-flagship", " · Spotlight")}`));
      card.append(element("p", "lesson-title", lesson.title));
      if (entry.note) card.append(element("p", "day-note", entry.note));
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

export function renderAnnouncements(section, root, snapshot) {
  const items = (snapshot?.announcements ?? []).filter((item) => item.visible !== false);
  section.hidden = items.length === 0;
  root.replaceChildren();
  for (const item of items) {
    const card = element("article", "announcement-card");
    card.append(element("h3", "", item.title), element("p", "", item.body));
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
  const needle = String(query ?? "").trim().toLowerCase();
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
    const actions = element("div", "homework-actions");
    actions.append(link("Open optional practice", item.homeworkPath));
    if (item.familyPath) actions.append(link("Open family help", item.familyPath));
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
    root.append(element("p", "empty-state", "No lessons match that search. Try a lesson number or clear a filter."));
  }
  return { all, filtered, visible: Math.min(limit, filtered.length) };
}

export function familyWeekSpeech(snapshot, inputLessons, sectionId) {
  const byId = new Map(normalizeLessons(inputLessons).map((lesson) => [lesson.id, lesson]));
  const section = resolveSection(snapshot, sectionId);
  const days = (section.week?.days ?? []).map((entry) => {
    const lesson = byId.get(entry.lessonId);
    if (entry.status === "lesson" && lesson) return `${entry.day}: Lesson ${lesson.id}, ${lesson.title}. ${entry.note}`;
    return `${entry.day}: ${entry.note || entry.status.replace("-", " ")}.`;
  });
  return `${section.week?.label}. ${section.label}. ${section.week?.note} ${days.join(" ")}`;
}
