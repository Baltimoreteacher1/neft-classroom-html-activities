import {
  publicHomeworkWeeks,
  weeksForSection,
  defaultHomeworkWeek,
  snapshotForWeek,
  homeworkWeekLabel,
} from "./shared/homework-weeks.js";
import {
  publicationChecks,
  renderPublicationChecks,
  homeworkLinkErrors,
  addHomeworkLinkErrors,
} from "./shared/publication-checks.js";
import {
  DAYS,
  createDefaultSnapshot,
  homeworkLabel,
  normalizeLessons,
  resolveSection,
} from "./shared/model.js";
import { loadDraft, publishDraft, saveDraft } from "./shared/api-client.js";
import { normalizeWelcome } from "./shared/family-welcome.js";
import { readLanguageMode, resolveHubLanguage, writeLanguageMode } from "./shared/hub-language.js";
import { PRODUCT_NAME } from "./shared/hub-routes.js";
import { paintWeeklySheetLinks } from "./shared/weekly-sheet-links.js";
import {
  addDays,
  familyLink,
  isHomeworkEditorPath,
  renderHomeworkHub,
  weekPhase,
} from "./shared/homework-hub.js";
const query = new URL(location.href).searchParams;
function safeStorage() {
  try {
    return localStorage;
  } catch {
    return null;
  }
}
// Old invitations and Canvas meeting anchors keep their existing destination.
if (query.has("meeting") || location.hash === "#family-scheduler") {
  location.replace(`/curriculum/family-connections/meetings/${location.search}${location.hash}`);
}
const key = "eduwonder.familyConnections.preferences.v1";
let preferences = {};
try {
  preferences = JSON.parse(localStorage.getItem(key)) || {};
} catch {}
const startLanguage = resolveHubLanguage({
  queryLang: query.get("lang") || "",
  storedMode: readLanguageMode(safeStorage()),
  saved: preferences,
  browserLanguages: navigator.languages?.length ? navigator.languages : [navigator.language || ""],
});
let language = startLanguage.language;
// Only a language the family chose is carried in links; a browser-detected one is a default.
let languageChosen = startLanguage.chosen;
let sectionId = query.get("section") || preferences.sectionId || "";
// "All Families" was saved automatically before the hub recorded choices, so it is not one.
let classChosen =
  query.has("section") ||
  preferences.sectionChosen === true ||
  Boolean(preferences.sectionId && preferences.sectionId !== "all-families");
let welcome = normalizeWelcome(null);
let snapshot = createDefaultSnapshot();
let publishedWeeks = [];
let selectedWeek = query.get("week") || "";
let lessons = [];
let lessonChoices = [];
let loaded = false;
let loadFailed = false;
let editDraft = null;
let editDirty = false;
let editReviewed = false;
let editBusy = false;
const editRequested = isHomeworkEditorPath(location.pathname);
const byId = (id) => document.getElementById(id);
const editingSection = () => resolveSection(editDraft, sectionId);
const editStatus = (message) => {
  byId("editor-status").textContent = message;
};
function editorLoginUrl() {
  const url = new URL("/curriculum/family-connections/teacher/login.html", location.origin);
  if (sectionId) url.searchParams.set("section", sectionId);
  if (language === "es") url.searchParams.set("lang", "es");
  return url.href;
}
// Old bookmarks enter through the same server-protected teacher route.
if (!editRequested && query.get("edit") === "1") location.replace(editorLoginUrl());
function renderFamilyView() {
  const root = byId("family-homework");
  if (editDraft) {
    renderHomeworkHub(root, editDraft, lessons, sectionId, language, { preview: true });
    return;
  }
  const es = language === "es";
  const weeks = weeksForSection(publishedWeeks, sectionId);
  const explicit = weeks.find((item) => item.week.startDate === selectedWeek);
  if (!explicit) selectedWeek = "";
  const record = explicit || defaultHomeworkWeek(weeks);
  renderHomeworkHub(root, snapshotForWeek(snapshot, record), lessons, sectionId, language, {
    archive: Boolean(explicit),
    linkLang: languageChosen ? language : "",
    welcome,
  });
  if (weeks.length) {
    const nav = document.createElement("div");
    nav.className = "week-navigation";
    const label = document.createElement("label");
    label.htmlFor = "homework-week-select";
    label.textContent = es ? "Semana de tareas" : "Homework week";
    const select = document.createElement("select");
    select.id = label.htmlFor;
    select.append(new Option(es ? "Plan actual / próximo" : "Current / upcoming plan", ""));
    for (const item of weeks) {
      const phase = weekPhase(item.week.startDate);
      const labels = es
        ? { current: "Esta semana", upcoming: "Próximas", past: "Anteriores" }
        : { current: "This week", upcoming: "Upcoming", past: "Previous" };
      select.append(
        new Option(
          `${labels[phase]} · ${homeworkWeekLabel(item.week.startDate, language)}`,
          item.week.startDate,
        ),
      );
    }
    select.value = selectedWeek;
    select.addEventListener("change", () => {
      selectedWeek = select.value;
      render();
      byId("homework-week-select").focus();
    });
    label.append(select);
    nav.append(label);
    root.prepend(nav);
  }
}

function markEditDirty() {
  editDirty = true;
  editReviewed = false;
  byId("inline-publish-confirm").hidden = true;
  byId("inline-publication-checks").hidden = true;
  editStatus("Draft changed. Check the family preview below, then save or publish.");
}
function renderEditor() {
  if (!editDraft) return;
  const week = editingSection().week;
  byId("inline-week-start").value = week.startDate || "";
  const list = byId("inline-days");
  list.replaceChildren();
  for (const [index, day] of DAYS.entries()) {
    const entry = week.days.find((item) => item.day === day);
    const row = document.createElement("section");
    row.className = "inline-day";
    const heading = document.createElement("h3");
    heading.textContent = day;
    heading.id = `inline-day-${index}`;
    row.setAttribute("aria-labelledby", heading.id);
    row.append(heading);
    if (week.startDate) {
      const date = document.createElement("span");
      date.className = "quiet day-date";
      date.textContent = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${addDays(week.startDate, index)}T12:00:00Z`));
      row.append(date);
    }
    const field = document.createElement("div");
    field.className = "day-choice";
    const label = document.createElement("label");
    label.htmlFor = `inline-day-select-${index}`;
    label.textContent = `Family homework for ${day}`;
    const select = document.createElement("select");
    select.id = label.htmlFor;
    select.append(new Option("Not posted yet", ""), new Option("No homework assigned", "no-class"));
    let currentUnit = null;
    let group = null;
    for (const lesson of lessonChoices) {
      if (lesson.unit !== currentUnit) {
        currentUnit = lesson.unit;
        group = document.createElement("optgroup");
        group.label = `Unit ${currentUnit}`;
        select.append(group);
      }
      group.append(new Option(`${homeworkLabel(lesson)} · ${lesson.title}`, lesson.id));
    }
    select.value =
      entry.status === "lesson" ? entry.lessonId : entry.status === "no-class" ? "no-class" : "";
    select.addEventListener("change", () => {
      const choice = select.value;
      const status = choice === "no-class" ? "no-class" : choice ? "lesson" : "pending";
      const lessonId = status === "lesson" ? choice : "";
      if (lessonId === entry.lessonId && entry.status === status) return;
      Object.assign(entry, { status, lessonId, dueDate: "", note: "", noteEs: "" });
      markEditDirty();
      render();
      byId(`inline-day-select-${index}`).focus();
    });
    field.append(label, select);
    if (entry.status === "lesson") {
      const selectedLesson = lessonChoices.find((lesson) => lesson.id === entry.lessonId);
      if (selectedLesson) {
        const selectionPreview = document.createElement("p");
        selectionPreview.className = "selection-preview";
        selectionPreview.textContent = `${homeworkLabel(selectedLesson)} · ${selectedLesson.title}`;
        field.append(selectionPreview);
      }
    }
    row.append(field);
    if (entry.status === "lesson") {
      const options = document.createElement("details");
      options.className = "day-options";
      const summary = document.createElement("summary");
      summary.textContent = "Due date & optional note";
      options.append(summary);
      for (const [key, text, type] of [
        ["dueDate", "Due date", "date"],
        ["note", "Family note (English)", "text"],
        ["noteEs", "Nota para familias (Español)", "text"],
      ]) {
        const optionLabel = document.createElement("label");
        optionLabel.textContent = text;
        const input = document.createElement("input");
        input.type = type;
        input.value = entry[key] || "";
        if (type === "text") input.maxLength = 180;
        if (key === "noteEs") input.lang = "es";
        input.addEventListener("input", () => {
          entry[key] = input.value;
          markEditDirty();
          renderFamilyView();
        });
        optionLabel.append(input);
        options.append(optionLabel);
      }
      row.append(options);
    }
    list.append(row);
  }
}
/* Everything on the page that is not the week itself: it needs no data, so the
   family's language shows from the first paint instead of after the fetch. */
function renderChrome() {
  const es = language === "es";
  document.documentElement.lang = language;
  document.documentElement.classList.toggle("large-text", Boolean(preferences.largeText));
  document.body.classList.toggle("large-text", Boolean(preferences.largeText));
  document.body.classList.toggle("high-contrast", Boolean(preferences.highContrast));
  byId("edition-label").textContent = editRequested
    ? es
      ? "Espacio docente"
      : "Teacher workspace"
    : es
      ? "Una nota semanal del Sr. Neft"
      : "A weekly note from Mr. Neft";
  byId("hub-title").textContent = editRequested
    ? es
      ? "Tareas para la familia"
      : "Family homework"
    : PRODUCT_NAME[language];
  byId("hub-intro").textContent = es
    ? editRequested
      ? "Elige las tareas que las familias verán cada noche."
      : "Unos minutos de matemáticas en casa. Opcional. Sin calificaciones."
    : editRequested
      ? "Choose the homework families will see each night."
      : "A few minutes of math at home. Optional. No grades.";
  if (!editRequested) document.title = `${PRODUCT_NAME[language]} · EduWonderLab`;
  paintWeeklySheetLinks(byId("weekly-sheet-links"), language, editRequested);
  byId("class-label").textContent = editRequested
    ? es
      ? "Clase"
      : "Class"
    : es
      ? "Elige tu clase"
      : "Pick your class";
  byId("display-options-label").textContent = es ? "Opciones de lectura" : "Display options";
  const legacyToggle = byId("language-toggle");
  if (legacyToggle) {
    legacyToggle.textContent = es ? "English" : "Español";
    legacyToggle.setAttribute("aria-pressed", String(es));
  }
  for (const button of document.querySelectorAll("#language-switch [data-lang]"))
    button.setAttribute("aria-pressed", String(button.dataset.lang === language));
  const languageLabel = byId("language-label");
  if (languageLabel) languageLabel.textContent = "Language / Idioma";
  if (!loaded && !loadFailed)
    byId("family-status").textContent = es
      ? "Cargando la tarea de esta semana…"
      : "Loading this week’s homework…";
  byId("text-size-toggle").textContent = es ? "Texto grande" : "Larger text";
  byId("contrast-toggle").textContent = es ? "Contraste" : "Contrast";
  byId("text-size-toggle").setAttribute("aria-pressed", String(Boolean(preferences.largeText)));
  byId("contrast-toggle").setAttribute("aria-pressed", String(Boolean(preferences.highContrast)));
  byId("teacher-access").textContent = editRequested
    ? es
      ? "Ver la página familiar"
      : "View family page"
    : es
      ? "Acceso docente"
      : "Teacher sign in";
  byId("teacher-access").href = editRequested
    ? familyLink(sectionId, language, location.origin)
    : editorLoginUrl();
}
function render() {
  const es = language === "es";
  const visible = editDraft || snapshot;
  const section = resolveSection(visible, sectionId);
  sectionId = section.id;
  renderChrome();
  const classes = visible.sections.filter((s) => s.visible !== false);
  const needsClass = !editRequested && !classChosen && classes.some((s) => !s.isDefault);
  const options = classes.map((s) => new Option(s.label, s.id, false, !needsClass && s.id === sectionId));
  if (needsClass) {
    const placeholder = new Option(es ? "Elige tu clase" : "Pick your class", "", true, true);
    placeholder.disabled = true;
    options.unshift(placeholder);
  }
  byId("section-select").replaceChildren(...options);
  const classHint = byId("class-hint");
  if (classHint) classHint.hidden = !needsClass;
  if (classHint) classHint.textContent = needsClass
    ? es
      ? `Elige tu clase (${classes.filter((s) => !s.isDefault).map((s) => s.label).join(", ")}) para ver tu tarea. Recordamos tu elección en este dispositivo. “${classes.find((s) => s.isDefault)?.label ?? ""}” muestra los avisos de todas las clases.`
      : `Pick your class (${classes.filter((s) => !s.isDefault).map((s) => s.label).join(", ")}) to see your homework. We remember your choice on this device. “${classes.find((s) => s.isDefault)?.label ?? ""}” shows notes for every class.`
    : "";
  const classLink = byId("class-link");
  if (classLink) classLink.replaceChildren();
  if (classLink && !editRequested && section.id !== "all-families") {
    classLink.append(
      document.createTextNode(es ? `Clase ${section.label}: ` : `Class ${section.label}: `),
    );
    const bookmark = document.createElement("a");
    bookmark.href = familyLink(section.id, language, location.origin);
    bookmark.textContent = es
      ? "Guarda el enlace de esta clase"
      : "Bookmark this class's homework link";
    classLink.append(bookmark);
  }
  if (editRequested) {
    byId("teacher-inline").hidden = !editDraft;
    byId("draft-preview-panel").hidden = !editDraft;
    byId("inline-publish-confirm").hidden = !editReviewed;
  }
  if (editDraft) renderEditor();
  renderFamilyView();
  preferences = { ...preferences, sectionId, sectionChosen: classChosen };
  // The hub's own language is only remembered once a family chose it; a
  // browser-detected default must stay a default.
  if (languageChosen) preferences = { ...preferences, language, languageChosen: true };
  try {
    localStorage.setItem(key, JSON.stringify(preferences));
  } catch {}
  if (loaded) {
    const url = new URL(
      editRequested ? location.pathname : familyLink(sectionId, language, location.origin),
      location.origin,
    );
    url.searchParams.set("section", sectionId);
    if (language === "es") url.searchParams.set("lang", "es");
    if (!editRequested && selectedWeek) url.searchParams.set("week", selectedWeek);
    history.replaceState(null, "", url);
  }
}
byId("section-select").addEventListener("change", (e) => {
  sectionId = e.target.value;
  classChosen = true;
  selectedWeek = "";
  editReviewed = false;
  render();
});
function chooseLanguage(next) {
  language = next;
  languageChosen = true;
  // The lesson pages read this key, so the choice follows the family there.
  writeLanguageMode(safeStorage(), next);
  render();
}
for (const button of document.querySelectorAll("#language-switch [data-lang]"))
  button.addEventListener("click", () => chooseLanguage(button.dataset.lang));
byId("language-toggle")?.addEventListener("click", () =>
  chooseLanguage(language === "en" ? "es" : "en"),
);
byId("text-size-toggle").addEventListener("click", () => {
  preferences.largeText = !preferences.largeText;
  render();
});
byId("contrast-toggle").addEventListener("click", () => {
  preferences.highContrast = !preferences.highContrast;
  render();
});
function validEditor() {
  if (!byId("inline-week-form").reportValidity()) return false;
  for (const item of editDraft.sections) {
    if (!item.week.days.some((day) => day.status === "lesson")) continue;
    const start = item.week.startDate;
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(start || "") ||
      addDays(start, 0) !== start ||
      new Date(`${start}T12:00:00Z`).getUTCDay() !== 1
    ) {
      editStatus(`Choose a valid Monday for ${item.label} before publishing.`);
      return false;
    }
  }
  return true;
}
async function withEditorBusy(action) {
  if (editBusy) return;
  editBusy = true;
  byId("inline-editor-fields").disabled = true;
  byId("inline-publish-confirm").disabled = true;
  try {
    await action();
  } catch (error) {
    editStatus(
      error.code === "revision-conflict"
        ? "A newer draft exists. Your edits are still here; reload to review it before saving."
        : `Not published: ${error.message}`,
    );
  } finally {
    editBusy = false;
    byId("inline-editor-fields").disabled = false;
    byId("inline-publish-confirm").disabled = false;
  }
}
if (editRequested) {
  byId("inline-week-start").addEventListener("change", (event) => {
    if (!editDraft) return;
    const week = editingSection().week;
    const oldStart = week.startDate;
    const newStart = event.target.value;
    const offset =
      oldStart && newStart
        ? Math.round(
            (new Date(`${newStart}T12:00:00Z`) - new Date(`${oldStart}T12:00:00Z`)) / 86400000,
          )
        : 0;
    week.startDate = newStart;
    if (Number.isFinite(offset) && offset)
      for (const day of week.days) if (day.dueDate) day.dueDate = addDays(day.dueDate, offset);
    markEditDirty();
    render();
  });
  byId("inline-save").addEventListener("click", () => {
    if (!editDraft || !validEditor()) return;
    withEditorBusy(async () => {
      editDraft = await saveDraft(editDraft);
      editDirty = false;
      render();
      editStatus("Draft saved. Families still see the published week.");
    });
  });
  byId("inline-week-form").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!editDraft || !validEditor()) return;
    const checks = publicationChecks(editDraft, lessons);
    renderPublicationChecks(byId("inline-publication-checks"), checks);
    if (checks.some((check) => check.errors.length)) {
      editStatus("Fix the publication errors below, then review the family preview.");
      byId("inline-publication-checks").scrollIntoView({ block: "start" });
      return;
    }
    if (!editReviewed || !byId("draft-preview-panel").open) {
      editReviewed = true;
      editStatus("Review the family preview below, then choose Confirm publish.");
      byId("draft-preview-panel").open = true;
      byId("inline-publish-confirm").hidden = false;
      byId("draft-preview-panel").scrollIntoView({ block: "start", behavior: "smooth" });
      return;
    }
    withEditorBusy(async () => {
      editStatus("Checking assigned homework links before publishing…");
      addHomeworkLinkErrors(checks, await homeworkLinkErrors(editDraft, lessons));
      renderPublicationChecks(byId("inline-publication-checks"), checks);
      if (checks.some((check) => check.errors.length)) {
        editReviewed = false;
        byId("inline-publish-confirm").hidden = true;
        editStatus("Not published. Fix the homework links or connection, then review again.");
        return;
      }
      if (editDirty) editDraft = await saveDraft(editDraft);
      const previous = snapshot;
      snapshot = await publishDraft(editDraft.revision);
      publishedWeeks = publicHomeworkWeeks(snapshot, [previous]);
      editDraft = structuredClone(snapshot);
      editDirty = false;
      editReviewed = false;
      render();
      editStatus("Published. Families can now see this week's homework.");
    });
  });
}
window.addEventListener("beforeunload", (event) => {
  if (!editDirty) return;
  event.preventDefault();
  event.returnValue = "";
});
async function load() {
  try {
    // Mr. Neft's optional weekly note rides alongside; it is read through the
    // shared one-request-per-file cache and can never block or break the hub.
    const welcomeRequest =
      window.NTJsonCache?.json("/data/family-welcome.json").catch(() => null) ??
      Promise.resolve(null);
    const [manifestResponse, publishedResponse] = await Promise.all([
      fetch("/data/curriculum-manifest.json"),
      fetch("/api/family-connections/published", { cache: "no-store" }),
    ]);
    if (!manifestResponse.ok || !publishedResponse.ok) throw new Error("unavailable");
    const manifest = await manifestResponse.json();
    const body = await publishedResponse.json();
    snapshot = body.published;
    publishedWeeks = Array.isArray(body.weeks) ? body.weeks : publicHomeworkWeeks(snapshot);
    if (!Array.isArray(snapshot?.sections)) throw new Error("unavailable");
    // End-of-unit family homework pages are assignable alongside lessons.
    lessons = [...(manifest.lessons || []), ...(manifest.familyHomework || [])];
    lessonChoices = normalizeLessons(lessons);
    welcome = normalizeWelcome(await welcomeRequest);
    loaded = true;
    byId("family-status").textContent = "";
    render();
    if (editRequested) {
      try {
        editDraft = await loadDraft();
        render();
        editStatus("Teacher mode is ready. Changes stay private until you publish.");
      } catch {
        byId("family-status").textContent =
          "Teacher editing needs sign-in. Use Teacher Login / Edit above to sign in and return here.";
      }
    }
  } catch {
    loadFailed = true;
    render();
    byId("family-status").textContent =
      language === "es"
        ? "No se pudo cargar la semana. Vuelve a cargar la página o consulta ClassDojo."
        : "This week could not load. Reload the page or check ClassDojo.";
  }
}
// Update the old service worker once so it can remove its own stale caches.
if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
renderChrome();
load();
