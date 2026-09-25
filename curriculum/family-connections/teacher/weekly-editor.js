import { DAYS, normalizeLessons } from "../shared/model.js";
import { loadDraft, loadHistory, saveDraft, publishDraft } from "../shared/api-client.js";
import { addDays, familyLink, renderHomeworkHub, schoolDate } from "../shared/homework-hub.js";
import { weekStartFor } from "../shared/pacing-week.js";
import { addSection } from "./section-manager.js";
const byId = (id) => document.getElementById(id);
let draft;
let lessons = [];
let history = [];
let publishedSnapshot = null;
let sectionId = "";
let dirty = false;
let previewed = false;
let busy = false;
let language = "en";
const section = () => draft.sections.find((item) => item.id === sectionId);
const notify = (message) => {
  byId("publish-status").textContent = message;
};
const markDirty = () => {
  dirty = true;
  previewed = false;
  byId("preview-panel").hidden = true;
  notify("Draft changed. Preview before publishing.");
};
const node = (tag, text) => {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  return element;
};
function preview() {
  if (!valid()) return;
  renderHomeworkHub(byId("family-preview"), draft, lessons, sectionId, language, { preview: true });
  previewed = true;
  byId("preview-panel").hidden = false;
  byId("preview-panel").scrollIntoView({ block: "start", behavior: "smooth" });
  notify(
    `Preview ready for ${section().label}. Publication includes ${draft.sections.map((item) => `${item.label}: ${item.week.startDate || "no week"}`).join("; ")}. Switch classes to review each one.`,
  );
}
function valid() {
  if (!byId("weekly-editor").reportValidity()) return false;
  for (const item of draft.sections) {
    if (!(item.week.days || []).some((day) => day.status === "lesson")) continue;
    const start = item.week.startDate;
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(start || "") ||
      addDays(start, 0) !== start ||
      new Date(`${start}T12:00:00Z`).getUTCDay() !== 1
    ) {
      notify(`Choose a valid Monday for ${item.label} before publishing homework.`);
      return false;
    }
  }
  const start = section().week.startDate;
  if (new Date(`${start}T12:00:00Z`).getUTCDay() !== 1) {
    notify("Choose a Monday for the beginning of the week.");
    byId("week-start").focus();
    return false;
  }
  return true;
}
function renderDays() {
  byId("weekday-editors").replaceChildren();
  for (const day of DAYS) {
    const entry = section().week.days.find((item) => item.day === day);
    const card = node("div");
    card.className = "weekday-editor";
    card.append(node("strong", day));
    const title = lessons.find((item) => item.id === entry.lessonId);
    card.append(
      node(
        "p",
        title && entry.status === "lesson"
          ? `${title.id} · ${title.title}`
          : "No homework assigned",
      ),
    );
    const actions = node("div");
    actions.className = "actions";
    const choose = node("button", "Choose homework");
    choose.type = "button";
    choose.className = "button-secondary";
    choose.addEventListener("click", () => {
      byId("assignment-day").value = day;
      byId("lesson-search").focus();
      byId("lesson-search").scrollIntoView({ block: "center" });
    });
    const remove = node("button", "Clear");
    remove.type = "button";
    remove.className = "button-secondary";
    remove.addEventListener("click", () => {
      Object.assign(entry, { status: "no-class", lessonId: "", dueDate: "", note: "", noteEs: "" });
      markDirty();
      renderDays();
    });
    actions.append(choose, remove);
    card.append(actions);
    if (entry.status === "lesson") {
      const due = node("label", "Due date (optional)");
      const input = node("input");
      input.type = "date";
      input.value = entry.dueDate || "";
      input.addEventListener("change", () => {
        entry.dueDate = input.value;
        markDirty();
      });
      due.append(input);
      card.append(due);
      const notes = node("details");
      notes.append(node("summary", "Optional homework note"));
      for (const [key, label] of [
        ["note", "English"],
        ["noteEs", "Español"],
      ]) {
        const labelEl = node("label", label);
        const input = node("input");
        input.value = entry[key] || "";
        input.maxLength = 180;
        if (key === "noteEs") input.lang = "es";
        input.addEventListener("input", () => {
          entry[key] = input.value;
          markDirty();
        });
        labelEl.append(input);
        notes.append(labelEl);
      }
      card.append(notes);
    }
    byId("weekday-editors").append(card);
  }
}
function renderLessons() {
  const query = byId("lesson-search").value.trim().toLowerCase();
  const matches = lessons.filter((item) =>
    `${item.id} ${item.title}`.toLowerCase().includes(query),
  );
  byId("lesson-results").replaceChildren();
  for (const item of matches) {
    const button = node("button", `${item.id} · ${item.title}`);
    button.type = "button";
    button.addEventListener("click", () => {
      const entry = section().week.days.find((item) => item.day === byId("assignment-day").value);
      Object.assign(entry, { status: "lesson", lessonId: item.id });
      markDirty();
      renderDays();
      notify(`Lesson ${item.id} assigned to ${entry.day}. Homework link added automatically.`);
    });
    byId("lesson-results").append(button);
  }
  if (!matches.length) byId("lesson-results").append(node("p", "No lessons match that search."));
}
function renderEditor() {
  byId("section-editor").replaceChildren(
    ...draft.sections.map((item) => new Option(item.label, item.id, false, item.id === sectionId)),
  );
  byId("week-start").value = section().week.startDate || "";
  byId("week-note").value = section().week.note || "";
  byId("week-note-es").value = section().week.noteEs || "";
  byId("family-link").value = familyLink(sectionId);
  byId("copy-targets").replaceChildren();
  for (const item of draft.sections.filter((item) => item.id !== sectionId)) {
    const label = node("label");
    const input = node("input");
    input.type = "checkbox";
    input.value = item.id;
    label.append(input, document.createTextNode(` ${item.label}`));
    byId("copy-targets").append(label);
  }
  renderDays();
  renderLessons();
}
function shiftWeek(newStart) {
  const oldStart = section().week.startDate;
  const offset = oldStart
    ? Math.round((new Date(`${newStart}T12:00:00Z`) - new Date(`${oldStart}T12:00:00Z`)) / 86400000)
    : 0;
  section().week.startDate = newStart;
  if (Number.isFinite(offset) && offset)
    for (const day of section().week.days)
      if (day.dueDate) day.dueDate = addDays(day.dueDate, offset);
  markDirty();
  renderEditor();
}
async function persist() {
  draft = await saveDraft(draft);
  dirty = false;
  renderEditor();
  return true;
}
async function withBusy(action) {
  if (busy) return;
  busy = true;
  byId("editor-fields").disabled = true;
  try {
    await action();
  } catch (error) {
    notify(
      error.code === "revision-conflict"
        ? "A newer draft exists. Your edits are still here. Open another tab to review the newer version before replacing anything."
        : `Not published: ${error.message}`,
    );
  } finally {
    busy = false;
    byId("editor-fields").disabled = false;
  }
}
byId("section-editor").addEventListener("change", (event) => {
  sectionId = event.target.value;
  previewed = false;
  byId("preview-panel").hidden = true;
  renderEditor();
});
byId("week-start").addEventListener("change", (event) => shiftWeek(event.target.value));
for (const [id, key] of [
  ["week-note", "note"],
  ["week-note-es", "noteEs"],
])
  byId(id).addEventListener("input", (event) => {
    section().week[key] = event.target.value;
    markDirty();
  });
byId("lesson-search").addEventListener("input", renderLessons);
byId("preview-draft").addEventListener("click", preview);
byId("preview-language").addEventListener("click", () => {
  language = language === "en" ? "es" : "en";
  byId("preview-language").textContent = language === "en" ? "Español" : "English";
  preview();
});
byId("save-draft").addEventListener("click", () => {
  if (!valid()) return;
  withBusy(async () => {
    await persist();
    notify("Draft saved. The family page has not changed.");
  });
});
byId("weekly-editor").addEventListener("submit", (event) => {
  event.preventDefault();
  if (!valid()) return;
  if (!previewed) {
    preview();
    notify("Review the family preview below, then choose Publish homework again.");
    return;
  }
  withBusy(async () => {
    if (dirty) await persist();
    draft = await publishDraft(draft.revision);
    publishedSnapshot = structuredClone(draft);
    dirty = false;
    previewed = false;
    renderEditor();
    notify("Published. Families can now open this homework using their class link.");
    try {
      history = await loadHistory();
    } catch {
      /* Publication already succeeded; history is optional. */
    }
  });
});
byId("copy-family-link").addEventListener("click", async () => {
  const value = familyLink(sectionId);
  try {
    await navigator.clipboard.writeText(value);
    notify("Class link copied. It always opens the published week for this class.");
  } catch {
    byId("family-link").focus();
    byId("family-link").select();
    notify("Select and copy the class link shown below.");
  }
});
byId("next-week").addEventListener("click", () =>
  shiftWeek(addDays(section().week.startDate || weekStartFor(schoolDate()), 7)),
);
byId("duplicate-week").addEventListener("click", () => {
  const source = [publishedSnapshot, ...history]
    .filter(Boolean)
    .map((item) => item.sections?.find((s) => s.id === sectionId))
    .find(Boolean);
  if (!source) {
    notify("No earlier published week is available for this class.");
    return;
  }
  const targetDate = section().week.startDate || weekStartFor(schoolDate());
  section().week = structuredClone(source.week);
  shiftWeek(targetDate);
  notify("Published assignments copied into the draft. Check dates and preview before publishing.");
});
byId("copy-week").addEventListener("click", () => {
  const ids = [...byId("copy-targets").querySelectorAll("input:checked")].map(
    (input) => input.value,
  );
  if (!ids.length) {
    notify("Select at least one class to copy to.");
    return;
  }
  for (const target of draft.sections)
    if (ids.includes(target.id)) target.week = structuredClone(section().week);
  markDirty();
  notify(`Week copied to ${ids.length} class${ids.length === 1 ? "" : "es"} in the draft.`);
});
byId("add-section").addEventListener("click", () => {
  try {
    const result = addSection(draft.sections, byId("new-section-name").value, section());
    draft.sections = result.sections;
    sectionId = result.section.id;
    markDirty();
    renderEditor();
    byId("new-section-name").value = "";
  } catch (error) {
    notify(error.message);
  }
});
window.addEventListener("beforeunload", (event) => {
  if (dirty) {
    event.preventDefault();
    event.returnValue = "";
  }
});
async function initialize() {
  try {
    const [saved, manifestResponse, past] = await Promise.all([
      loadDraft(),
      fetch("/data/curriculum-manifest.json"),
      loadHistory().catch(() => []),
    ]);
    if (!manifestResponse.ok) throw new Error("Lesson list could not load.");
    draft = saved;
    lessons = normalizeLessons((await manifestResponse.json()).lessons);
    history = past;
    try {
      const response = await fetch("/api/family-connections/published", { cache: "no-store" });
      if (response.ok) publishedSnapshot = (await response.json()).published;
    } catch {}
    sectionId = draft.sections.find((item) => item.isDefault)?.id || draft.sections[0].id;
    renderEditor();
    byId("editor-fields").disabled = false;
    notify(
      draft.publishedAt
        ? "Saved draft loaded. Preview any changes before publishing."
        : "Draft loaded. Choose a week to begin.",
    );
  } catch (error) {
    notify(`Editor unavailable: ${error.message}. Reload to try again.`);
  }
}
initialize();
