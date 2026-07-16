import { COPY_FIELDS } from "../shared/copy-defaults.js";
import { DAYS, mergeHomework, normalizeLessons, resolveSection } from "../shared/model.js";

const node = (tag, className, text) => {
  const item = document.createElement(tag);
  if (className) item.className = className;
  if (text !== undefined) item.textContent = text;
  return item;
};

function option(value, label, selected = false) {
  const item = node("option", "", label);
  item.value = value;
  item.selected = selected;
  return item;
}

export function renderSectionEditor(select, snapshot, selectedId) {
  select.replaceChildren();
  for (const section of snapshot.sections) {
    select.append(option(section.id, section.label, section.id === selectedId));
  }
}

export function renderWeekdayEditors(root, section, lessons, onChange) {
  const normalized = normalizeLessons(lessons);
  root.replaceChildren();
  for (const dayName of DAYS) {
    const entry = section.week.days.find((day) => day.day === dayName);
    const card = node("div", "weekday-editor");
    card.append(node("strong", "", dayName));
    const statusLabel = node("label", "", "Day type");
    const status = node("select");
    for (const [value, label] of [
      ["lesson", "Lesson"],
      ["review", "Review & practice"],
      ["assessment", "Learning check"],
      ["no-class", "No class / no post"],
    ])
      status.append(option(value, label, entry.status === value));
    statusLabel.append(status);
    const lessonLabel = node("label", "", "Lesson number");
    const lesson = node("select");
    lesson.append(option("", "Choose a lesson", !entry.lessonId));
    for (const item of normalized) {
      lesson.append(option(item.id, `${item.id} · ${item.title}`, entry.lessonId === item.id));
    }
    lesson.disabled = entry.status !== "lesson";
    lessonLabel.append(lesson);
    const noteLabel = node("label", "", "Family note");
    const note = node("input");
    note.maxLength = 180;
    note.value = entry.note ?? "";
    noteLabel.append(note);
    const update = () => {
      lesson.disabled = status.value !== "lesson";
      onChange(dayName, {
        day: dayName,
        status: status.value,
        lessonId: lesson.value,
        note: note.value,
      });
    };
    status.addEventListener("change", update);
    lesson.addEventListener("change", update);
    note.addEventListener("input", update);
    card.append(statusLabel, lessonLabel, noteLabel);
    root.append(card);
  }
}

export function renderLessonPicker(root, lessons, query, selectedId, onSelect) {
  const needle = String(query ?? "")
    .trim()
    .toLowerCase();
  const matches = normalizeLessons(lessons).filter((lesson) =>
    [lesson.id, lesson.title, lesson.standard, lesson.objective]
      .join(" ")
      .toLowerCase()
      .includes(needle),
  );
  root.replaceChildren();
  for (const lesson of matches) {
    const button = node("button", "lesson-choice");
    button.type = "button";
    button.setAttribute("role", "option");
    button.setAttribute("aria-selected", String(lesson.id === selectedId));
    button.append(node("strong", "", `Lesson ${lesson.id}`), node("span", "", lesson.title));
    button.addEventListener("click", () => onSelect(lesson.id));
    root.append(button);
  }
}

export function renderCollection(root, items, onRemove) {
  root.replaceChildren();
  for (const item of items) {
    const card = node("div", "collection-item");
    const copy = node("div");
    copy.append(
      node("strong", "", item.title),
      node("p", "", item.body || item.description || item.url),
    );
    const remove = node("button", "remove-button", "Remove");
    remove.type = "button";
    remove.addEventListener("click", () => onRemove(item.id));
    card.append(copy, remove);
    root.append(card);
  }
}

export function renderCopyEditor(root, draft, lang, onChange) {
  const overrides = draft.copy?.[lang] ?? {};
  root.replaceChildren();
  let currentGroup = "";
  for (const field of COPY_FIELDS) {
    if (field.group !== currentGroup) {
      currentGroup = field.group;
      root.append(node("h3", "copy-group", currentGroup));
    }
    const defaultText = lang === "es" ? field.es : field.en;
    const label = node("label", "copy-field");
    label.append(node("span", "copy-label", field.label));
    const long = defaultText.length > 60;
    const input = node(long ? "textarea" : "input");
    if (long) input.rows = 2;
    input.maxLength = 600;
    input.value = overrides[field.key] ?? "";
    input.placeholder = defaultText;
    input.addEventListener("input", () => onChange(field.key, input.value));
    label.append(input);
    root.append(label);
  }
}

export function renderFamilyPreview(root, snapshot, inputLessons, sectionId) {
  const section = resolveSection(snapshot, sectionId);
  const lessons = normalizeLessons(inputLessons);
  const byId = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const title = node("div");
  title.append(
    node("p", "step-label", section.label),
    node("h3", "", section.week.label),
    node("p", "", section.week.note),
  );
  const week = node("div", "preview-week");
  for (const entry of section.week.days) {
    const lesson = byId.get(entry.lessonId);
    const card = node("article", "preview-day");
    card.append(node("strong", "", entry.day));
    card.append(
      node(
        "span",
        "",
        lesson
          ? `Lesson ${lesson.id} · ${lesson.title}`
          : entry.note || entry.status.replace("-", " "),
      ),
    );
    week.append(card);
  }
  const homeworkTitle = node("h3", "", "Optional family practice preview");
  homeworkTitle.style.marginTop = "1rem";
  const homeworkGrid = node("div", "preview-homework");
  const assigned = new Set(section.week.days.map((day) => day.lessonId).filter(Boolean));
  const homework = mergeHomework(inputLessons, snapshot.homeworkOverrides)
    .filter((item) => assigned.has(item.id))
    .slice(0, 5);
  for (const item of homework) {
    const card = node("article");
    card.append(
      node("strong", "", `Lesson ${item.id} · ${item.title}`),
      node("p", "", item.directions),
    );
    homeworkGrid.append(card);
  }
  if (!homework.length)
    homeworkGrid.append(node("p", "", "Assign a lesson to preview this week's homework."));
  root.replaceChildren(title, week, homeworkTitle, homeworkGrid);
}
