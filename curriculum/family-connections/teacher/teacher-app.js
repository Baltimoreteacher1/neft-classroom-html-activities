import {
  buildCanvasAnnouncement,
  buildCanvasExport,
  buildCanvasModuleLinks,
  buildCanvasSyncBundle,
  createDefaultSnapshot,
  mergeHomework,
  normalizeLessons,
  parseCanvasCourseUrl,
  safeExternalUrl,
} from "../shared/model.js";
import { loadDraft, loadHistory, publishDraft, saveDraft } from "../shared/api-client.js";
import { resolveYear } from "../../../shared/pacing/engine.js";
import { buildWeekFromPacing, pacingWeekStarts, weekStartFor } from "../shared/pacing-week.js";
import { buildFamilyWeekNote } from "../shared/family-week-note.js";
import { renderPacingCalendar } from "./pacing-calendar.js";
import {
  loadFamilyResponse,
  renderFamilyResponse,
  saveTeacherKey,
  teacherKey,
} from "./family-response.js";
import { weekLessonIds } from "../shared/family-week-note.js";
import {
  renderCollection,
  renderCopyEditor,
  renderFamilyPreview,
  renderLessonPicker,
  renderSectionEditor,
  renderWeekdayEditors,
} from "./editors.js";
import {
  addSection,
  deleteSection,
  renameSection,
  renderSectionManager,
  setDefaultSection,
} from "./section-manager.js";

const state = {
  draft: createDefaultSnapshot(),
  lessons: [],
  history: [],
  sectionId: "all-families",
  lessonId: "",
  copyLang: "en",
  dirty: false,
  previewed: false,
  pacingBaseline: null,
  pacingDays: null,
  pacingStarts: [],
  pacingMonth: "",
  noteBank: null,
};

const byId = (id) => document.getElementById(id);
const section = () =>
  state.draft.sections.find((item) => item.id === state.sectionId) ?? state.draft.sections[0];
const lesson = () => state.lessons.find((item) => item.id === state.lessonId);

function notify(message) {
  const status = byId("teacher-status");
  status.textContent = message;
  status.classList.add("show");
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => status.classList.remove("show"), 4200);
}

function markDirty(message = "Draft has unpublished changes") {
  state.dirty = true;
  state.previewed = false;
  byId("publish-status").textContent = message;
  byId("publish-detail").textContent =
    `Draft revision ${state.draft.revision} · Preview before publishing`;
}

function updatePublicationStatus() {
  const date = state.draft.publishedAt ? new Date(state.draft.publishedAt) : null;
  byId("publish-status").textContent = state.dirty
    ? "Draft has unpublished changes"
    : "Draft saved";
  byId("publish-detail").textContent = date
    ? `Live version ${state.draft.revision} · ${date.toLocaleString()}`
    : `Draft revision ${state.draft.revision} · Not published yet`;
}

function setSectionValue(key, value) {
  const current = section();
  if (key === "label") current.label = value;
  else current.week[key === "weekLabel" ? "label" : key] = value;
  markDirty();
}

function renderWeekEditor() {
  const current = section();
  renderSectionEditor(byId("section-editor"), state.draft, current.id);
  renderSectionManager(byId("section-manager"), state.draft.sections, current.id, {
    select(id) {
      state.sectionId = id;
      renderWeekEditor();
    },
    rename(id, name) {
      try {
        state.draft.sections = renameSection(state.draft.sections, id, name);
        markDirty();
        renderWeekEditor();
      } catch (error) {
        notify(error.message);
        renderWeekEditor();
      }
    },
    setDefault(id) {
      state.draft.sections = setDefaultSection(state.draft.sections, id);
      markDirty();
      renderWeekEditor();
    },
    remove(id) {
      const target = state.draft.sections.find((item) => item.id === id);
      if (!target) return;
      if (
        !window.confirm(
          `Delete “${target.label}”? Publishing will remove this section and its Canvas feed.`,
        )
      )
        return;
      try {
        const result = deleteSection(state.draft.sections, id, state.sectionId);
        state.draft.sections = result.sections;
        state.sectionId = result.activeId;
        markDirty();
        renderWeekEditor();
      } catch (error) {
        notify(error.message);
      }
    },
  });
  byId("section-label").value = current.label;
  byId("week-label").value = current.week.label;
  byId("week-start").value = current.week.startDate;
  byId("week-note").value = current.week.note;
  byId("week-note-es").value = current.week.noteEs ?? "";
  renderWeekdayEditors(byId("weekday-editors"), current, state.lessons, (dayName, entry) => {
    const index = current.week.days.findIndex((day) => day.day === dayName);
    current.week.days[index] = entry;
    markDirty();
  });
  updateCanvasConnection();
}

/* ── The weekly note, in both languages ────────────────────────────────────────
 * Written from the lessons that are posted, using the same curated bilingual
 * material families already read in the homework. Never machine-translated: if
 * a sentence has no curated Spanish it is dropped from BOTH lanes rather than
 * leaving English in the Spanish column. */
async function familyNoteBank() {
  if (state.noteBank) return state.noteBank;
  const response = await fetch("/data/family-week-notes.json", { cache: "no-store" });
  if (!response.ok) throw new Error("The curated family notes are unavailable right now.");
  state.noteBank = await response.json();
  return state.noteBank;
}

async function writeWeekNotes({ silent = false } = {}) {
  const status = byId("week-note-status");
  const current = section();
  try {
    const bank = await familyNoteBank();
    const note = buildFamilyWeekNote(current.week.days, bank);
    if (!note.en) {
      status.textContent =
        "Post at least one lesson this week and the note will write itself in both languages.";
      return null;
    }
    current.week.note = note.en;
    current.week.noteEs = note.es;
    byId("week-note").value = note.en;
    byId("week-note-es").value = note.es;
    markDirty("Weekly note rewritten from this week's lessons");
    renderPreview(false);
    const gaps = note.missing.length
      ? ` No curated family notes yet for ${note.missing.join(", ")} — check the Spanish before publishing.`
      : "";
    status.textContent = `Written from ${note.lessonIds.join(", ")} in English and Spanish.${gaps}`;
    if (!silent) notify("Weekly note written in English and Spanish. Edit it before publishing.");
    return note;
  } catch (error) {
    status.textContent = error.message;
    return null;
  }
}

/* ── How families used the week ────────────────────────────────────────────────
 * Teacher-gated reporting, and deliberately opt-in: nothing loads until the
 * teacher asks for it, so the publisher never blocks on a reporting call. */
async function showFamilyResponse() {
  const report = byId("family-response-report");
  const button = byId("family-response-load");
  const typed = byId("family-response-key").value.trim();
  if (typed) {
    saveTeacherKey(typed);
    byId("family-response-key").value = "";
  }
  const lessonIds = weekLessonIds(section().week.days);
  button.disabled = true;
  renderFamilyResponse(report, null, { message: "Reading family activity…" });
  try {
    const data = await loadFamilyResponse(byId("family-response-days").value);
    renderFamilyResponse(report, data, { lessonIds });
  } catch (error) {
    renderFamilyResponse(report, null, { message: error.message });
  } finally {
    button.disabled = false;
  }
}

/* ── Fill from the pacing plan ─────────────────────────────────────────────────
 * The teacher's dated plan already says which lesson lands on which day. Re-
 * picking it here is duplicated work and a second source of truth, so this pulls
 * the week across and leaves it as a draft to edit. */

/* Family sections are named by the teacher ("Period 601", "All Families"); the
 * planner keys its class overlay by course code. Match on the code when the
 * label carries one, otherwise use the shared plan. */
const PACING_SECTIONS = ["601", "602", "603"];

function pacingSectionFor(current) {
  const haystack = `${current?.id ?? ""} ${current?.label ?? ""}`;
  return PACING_SECTIONS.find((code) => haystack.includes(code)) ?? "";
}

async function pacingBaseline() {
  if (state.pacingBaseline) return state.pacingBaseline;
  const response = await fetch("/data/pacing-baseline-2026-27.json", { cache: "no-store" });
  if (!response.ok) throw new Error("The pacing plan is unavailable right now.");
  state.pacingBaseline = await response.json();
  return state.pacingBaseline;
}

/* The planner's live edits live in D1. If that call fails the published baseline
 * is still a correct plan, so fill from it rather than refusing outright. */
async function resolvedPacingDays(sectionCode) {
  const baseline = await pacingBaseline();
  let overlay = {};
  /* `live` means the planner ANSWERED, not that it had edits. An empty overlay is
   * a correct answer — reporting it as "unavailable" would train the teacher to
   * distrust a fill that is perfectly current. */
  let live = true;
  try {
    const response = await fetch(
      `/api/pacing/state?section=${encodeURIComponent(sectionCode)}`,
      { credentials: "same-origin", headers: { accept: "application/json" } },
    );
    if (response.ok) overlay = (await response.json())?.overlay ?? {};
    else live = false;
  } catch {
    live = false;
  }
  return { days: resolveYear(baseline, overlay), live };
}

/* The <select> owns the chosen week; the calendar is a second way to set it.
 * Re-rendering from the select after every change is what keeps them honest. */
function paintPacingCalendar() {
  const selected = byId("pacing-week").value;
  if (!state.pacingDays) return;
  if (!state.pacingMonth) state.pacingMonth = (selected || "").slice(0, 7);
  renderPacingCalendar(byId("pacing-calendar"), state.pacingDays, {
    monthKey: state.pacingMonth,
    selectedWeek: selected,
    onPick(weekStart) {
      byId("pacing-week").value = weekStart;
      state.pacingMonth = weekStart.slice(0, 7);
      paintPacingCalendar();
    },
    onMonth(monthKey) {
      state.pacingMonth = monthKey;
      paintPacingCalendar();
    },
  });
}

async function renderPacingWeeks() {
  const select = byId("pacing-week");
  const status = byId("pacing-fill-status");
  try {
    const baseline = await pacingBaseline();
    state.pacingDays = resolveYear(baseline, {});
    state.pacingStarts = pacingWeekStarts(state.pacingDays);
    const today = new Date().toISOString().slice(0, 10);
    const preferred = section().week.startDate || weekStartFor(today);
    select.replaceChildren();
    for (const week of state.pacingStarts) {
      const item = document.createElement("option");
      item.value = week.startDate;
      item.textContent = `${week.label} (${week.startDate})`;
      select.append(item);
    }
    const match = state.pacingStarts.find((week) => week.startDate === preferred);
    select.value = (match ?? state.pacingStarts[0])?.startDate ?? "";
    state.pacingMonth = select.value.slice(0, 7);
    paintPacingCalendar();
  } catch (error) {
    byId("pacing-fill").hidden = true;
    byId("pacing-calendar").hidden = true;
    status.textContent = error.message;
  }
}

async function applyPacingFill() {
  const button = byId("pacing-fill-apply");
  const status = byId("pacing-fill-status");
  const current = section();
  const startDate = byId("pacing-week").value;
  if (!startDate) return;
  const hasContent = current.week.days.some(
    (day) => day.status !== "no-class" || day.lessonId || String(day.note ?? "").trim(),
  );
  if (
    hasContent &&
    !window.confirm(`Replace the five days already planned for “${current.label}”?`)
  )
    return;
  button.disabled = true;
  status.textContent = "Reading your pacing plan…";
  try {
    const sectionCode = pacingSectionFor(current);
    const { days, live } = await resolvedPacingDays(sectionCode);
    const week = buildWeekFromPacing(days, startDate, state.lessons.map((item) => item.id));
    current.week.label = week.label;
    current.week.startDate = week.startDate;
    current.week.days = week.days;
    markDirty(`Week filled from the pacing plan (${week.label})`);
    renderWeekEditor();
    await writeWeekNotes({ silent: true });
    renderPreview(false);
    const source = sectionCode ? `class ${sectionCode}` : "the shared plan";
    const count = week.needsReview.length;
    const flags = count
      ? ` ${count === 1 ? "1 day needs" : `${count} days need`} a look: ${week.needsReview
          .map((item) => `${item.day} — ${item.reason}`)
          .join(" ")}`
      : " Nothing needs a second look.";
    status.textContent = `Filled ${week.label} from ${source}${live ? "" : " (baseline only — live planner edits were unavailable)"}: ${week.lessonCount} lesson${week.lessonCount === 1 ? "" : "s"} with family practice.${flags}`;
    notify(`Week filled from the pacing plan. Review it, then publish.`);
  } catch (error) {
    status.textContent = error.message;
    notify(error.message);
  } finally {
    button.disabled = false;
  }
}

function renderHomeworkPicker() {
  renderLessonPicker(
    byId("homework-editor"),
    state.lessons,
    byId("homework-editor-search").value,
    state.lessonId,
    selectLesson,
  );
}

function selectLesson(id) {
  state.lessonId = id;
  const selected = lesson();
  if (!selected) return;
  const merged = mergeHomework([selected], state.draft.homeworkOverrides)[0];
  const override = state.draft.homeworkOverrides[id] ?? {};
  byId("selected-lesson-number").textContent = `Lesson ${selected.id}`;
  byId("selected-lesson-title").textContent = selected.title;
  byId("homework-visible").checked = override.visible !== false;
  byId("homework-title").value = override.title || selected.title;
  byId("homework-directions").value = override.directions || merged.directions;
  byId("homework-time").value = override.estimatedTime || merged.estimatedTime;
  byId("homework-materials").value = override.materials || merged.materials;
  byId("homework-language").value = override.languageSupport || merged.languageSupport;
  byId("homework-link-label").value = override.supplementalLinks?.[0]?.label ?? "";
  byId("homework-link-url").value = override.supplementalLinks?.[0]?.url ?? "";
  renderHomeworkPicker();
}

function applyHomework(event) {
  event.preventDefault();
  if (!state.lessonId) return notify("Choose a lesson before applying edits.");
  const label = byId("homework-link-label").value.trim();
  const url = byId("homework-link-url").value.trim();
  if (url && !safeExternalUrl(url)) return notify("Supplemental links must begin with https://.");
  state.draft.homeworkOverrides[state.lessonId] = {
    visible: byId("homework-visible").checked,
    title: byId("homework-title").value.trim(),
    directions: byId("homework-directions").value.trim(),
    estimatedTime: byId("homework-time").value.trim(),
    materials: byId("homework-materials").value.trim(),
    languageSupport: byId("homework-language").value.trim(),
    supplementalLinks: label && url ? [{ id: "primary", label, url }] : [],
  };
  markDirty(`Lesson ${state.lessonId} edits applied`);
  notify(`Lesson ${state.lessonId} is updated in this draft.`);
}

function renderCollections() {
  renderCollection(byId("announcement-editor"), state.draft.announcements, (id) => {
    state.draft.announcements = state.draft.announcements.filter((item) => item.id !== id);
    markDirty();
    renderCollections();
  });
  renderCollection(byId("resource-editor"), state.draft.resources, (id) => {
    state.draft.resources = state.draft.resources.filter((item) => item.id !== id);
    markDirty();
    renderCollections();
  });
}

function renderCopyPanel() {
  renderCopyEditor(byId("copy-editor"), state.draft, state.copyLang, setCopyValue);
}

function setCopyValue(key, value) {
  const lane = state.draft.copy[state.copyLang];
  const clean = value.trim();
  if (clean) lane[key] = clean;
  else delete lane[key];
  markDirty(`Page wording updated (${state.copyLang === "es" ? "Español" : "English"})`);
}

function addAnnouncement() {
  const title = byId("announcement-title").value.trim();
  const body = byId("announcement-body").value.trim();
  if (!title || !body) return notify("Add both a title and a family update.");
  const date = byId("announcement-date").value.trim();
  const pinned = byId("announcement-pinned").checked;
  state.draft.announcements.push({
    id: `update-${Date.now()}`,
    title,
    body,
    date,
    pinned,
    visible: true,
  });
  byId("announcement-title").value = "";
  byId("announcement-body").value = "";
  byId("announcement-date").value = "";
  byId("announcement-pinned").checked = false;
  markDirty();
  renderCollections();
}

function addResource() {
  const title = byId("resource-title").value.trim();
  const description = byId("resource-description").value.trim();
  const url = byId("resource-url").value.trim();
  const valid = /^\/(?!\/)/.test(url) || safeExternalUrl(url);
  if (!title || !valid) return notify("Add a title and a local or https:// resource link.");
  state.draft.resources.push({
    id: `resource-${Date.now()}`,
    title,
    description,
    url,
    visible: true,
  });
  for (const id of ["resource-title", "resource-description", "resource-url"]) byId(id).value = "";
  markDirty();
  renderCollections();
}

function renderPreview(scroll = true) {
  renderFamilyPreview(byId("family-preview"), state.draft, state.lessons, state.sectionId);
  state.previewed = true;
  byId("publish-status").textContent = "Preview ready — not live";
  if (scroll) byId("preview-plan").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderHistory() {
  const root = byId("publication-history");
  root.replaceChildren();
  for (const item of state.history) {
    const entry = document.createElement("li");
    entry.textContent = `Version ${item.revision} · ${item.publishedAt ? new Date(item.publishedAt).toLocaleString() : "Initial version"}`;
    root.append(entry);
  }
  if (!state.history.length)
    root.append(
      Object.assign(document.createElement("li"), { textContent: "No earlier publications yet." }),
    );
}

async function persist() {
  const canvasValue = state.draft.integrations.canvasUrl.trim();
  if (canvasValue && !parseCanvasCourseUrl(canvasValue)) {
    notify("Add a valid Canvas course URL before saving this draft.");
    byId("canvas-url").focus();
    return false;
  }
  try {
    state.draft = await saveDraft(state.draft);
    state.dirty = false;
    updatePublicationStatus();
    notify("Draft saved. Family Mode has not changed.");
    return true;
  } catch (error) {
    if (error.code === "revision-conflict") {
      notify(
        "A newer draft exists. Your edits are still here; reload in another tab before replacing anything.",
      );
    } else notify(error.message);
    return false;
  }
}

async function publish() {
  if (!state.previewed) return notify("Preview the complete family page before publishing.");
  if (state.dirty && !(await persist())) return;
  if (!window.confirm("Publish this complete draft to Family Mode now?")) return;
  try {
    state.draft = await publishDraft();
    state.dirty = false;
    state.previewed = false;
    state.history = await loadHistory();
    updatePublicationStatus();
    renderHistory();
    notify("Published live. Families can now see this version.");
  } catch (error) {
    notify(error.message);
  }
}

async function copyText(value, label, output = byId("canvas-copy-output")) {
  output.value = value;
  output.focus();
  output.select();
  try {
    await navigator.clipboard.writeText(value);
    notify(`${label} copied. Open Canvas and paste deliberately.`);
  } catch {
    notify(`${label} is selected. Use your device's copy command, then paste in Canvas.`);
  }
}

function canvasAnnouncement() {
  return buildCanvasAnnouncement(state.draft, state.lessons, state.sectionId);
}

export function canvasDirectPayload() {
  const bundle = buildCanvasSyncBundle(state.draft, state.lessons, state.sectionId);
  return {
    courseUrl: byId("canvas-url").value.trim(),
    title: bundle.title,
    message: bundle.announcement.html,
  };
}

function canvasFeedUrl() {
  const url = new URL("/api/family-connections/canvas-feed", window.location.origin);
  url.searchParams.set("section", state.sectionId);
  url.searchParams.set("v", "1");
  return url.href;
}

function updateCanvasConnection() {
  const input = byId("canvas-url");
  const connection = parseCanvasCourseUrl(input.value);
  const hasValue = Boolean(input.value.trim());
  input.setAttribute("aria-invalid", String(hasValue && !connection));
  byId("canvas-sync-status").textContent = connection
    ? `Ready · ${connection.host} · Course ${connection.courseId}`
    : hasValue
      ? "Use the full secure course URL, including /courses/[course number]."
      : "Paste the course URL to connect Canvas.";
  byId("canvas-sync-status").classList.toggle("is-ready", Boolean(connection));
  byId("prepare-canvas-update").disabled = !connection;
  const destinations = {
    "open-canvas": connection?.courseUrl,
    "open-canvas-announcements": connection?.announcementsUrl,
    "open-canvas-modules": connection?.modulesUrl,
  };
  for (const [id, href] of Object.entries(destinations)) {
    const link = byId(id);
    link.hidden = !href;
    link.href = href || "#";
  }
  byId("canvas-feed-url").value = canvasFeedUrl();
  return connection;
}

function prepareCanvasUpdate() {
  if (!updateCanvasConnection()) return;
  const bundle = buildCanvasSyncBundle(state.draft, state.lessons, state.sectionId);
  copyText(bundle.text, "Canvas weekly update");
}

function downloadCanvasExport() {
  const data = buildCanvasExport(state.draft, state.lessons, state.sectionId);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = `family-week-${section().week.startDate || "draft"}-v${state.draft.revision}.json`;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
  notify("Canvas-ready JSON downloaded.");
}

function bindEvents() {
  byId("section-editor").addEventListener("change", (event) => {
    state.sectionId = event.target.value;
    renderWeekEditor();
  });
  byId("add-section").addEventListener("click", () => {
    const base = createDefaultSnapshot().sections[0];
    try {
      const result = addSection(state.draft.sections, byId("new-section-name").value, base);
      state.draft.sections = result.sections;
      state.sectionId = result.section.id;
      byId("new-section-name").value = "";
      markDirty();
      renderWeekEditor();
    } catch (error) {
      notify(error.message);
      byId("new-section-name").focus();
    }
  });
  for (const [id, key] of [
    ["section-label", "label"],
    ["week-label", "weekLabel"],
    ["week-start", "startDate"],
    ["week-note", "note"],
    ["week-note-es", "noteEs"],
  ]) {
    byId(id).addEventListener("input", (event) => setSectionValue(key, event.target.value));
  }
  byId("homework-editor-search").addEventListener("input", renderHomeworkPicker);
  byId("homework-form").addEventListener("submit", applyHomework);
  byId("add-announcement").addEventListener("click", addAnnouncement);
  byId("add-resource").addEventListener("click", addResource);
  byId("copy-lang").addEventListener("change", (event) => {
    state.copyLang = event.target.value === "es" ? "es" : "en";
    renderCopyPanel();
  });
  byId("save-draft").addEventListener("click", persist);
  byId("preview-draft").addEventListener("click", renderPreview);
  byId("publish-draft").addEventListener("click", publish);
  byId("classdojo-url").addEventListener("input", (event) => {
    state.draft.integrations.classDojoUrl = event.target.value.trim();
    markDirty();
  });
  byId("canvas-url").addEventListener("input", (event) => {
    state.draft.integrations.canvasUrl = event.target.value.trim();
    updateCanvasConnection();
    markDirty();
  });
  byId("canvas-url").addEventListener("blur", (event) => {
    const connection = parseCanvasCourseUrl(event.target.value);
    if (connection) {
      event.target.value = connection.courseUrl;
      state.draft.integrations.canvasUrl = connection.courseUrl;
    }
    updateCanvasConnection();
  });
  byId("prepare-canvas-update").addEventListener("click", prepareCanvasUpdate);
  byId("copy-canvas-feed").addEventListener("click", () =>
    copyText(canvasFeedUrl(), "Canvas sync feed", byId("canvas-feed-url")),
  );
  byId("copy-canvas-announcement").addEventListener("click", () =>
    copyText(canvasAnnouncement().text, "Canvas announcement"),
  );
  byId("copy-canvas-modules").addEventListener("click", () => {
    const links = buildCanvasModuleLinks(state.draft, state.lessons, state.sectionId);
    copyText(
      links
        .map(
          (item) =>
            `${item.day}: ${item.title}\nLesson: ${item.lessonUrl}\nOptional family practice: ${item.homeworkUrl}`,
        )
        .join("\n\n"),
      "Canvas module links",
    );
  });
  byId("download-canvas-json").addEventListener("click", downloadCanvasExport);
  byId("pacing-fill-apply").addEventListener("click", applyPacingFill);
  byId("family-response-load").addEventListener("click", showFamilyResponse);
  byId("week-note-build").addEventListener("click", () => writeWeekNotes());
  byId("pacing-week").addEventListener("change", () => {
    state.pacingMonth = byId("pacing-week").value.slice(0, 7);
    paintPacingCalendar();
  });
  window.addEventListener("beforeunload", (event) => {
    if (state.dirty) event.preventDefault();
  });
}

async function initialize() {
  bindEvents();
  try {
    const manifestResponse = await fetch("/data/curriculum-manifest.json");
    if (!manifestResponse.ok) throw new Error("The curriculum catalog is unavailable.");
    state.lessons = normalizeLessons((await manifestResponse.json()).lessons);
    [state.draft, state.history] = await Promise.all([loadDraft(), loadHistory()]);
    // Older drafts predate the copy field — ensure both language lanes exist.
    state.draft.copy = { en: { ...state.draft.copy?.en }, es: { ...state.draft.copy?.es } };
    state.sectionId =
      state.draft.sections.find((item) => item.isDefault)?.id ?? state.draft.sections[0].id;
    state.lessonId = state.lessons[0]?.id ?? "";
    byId("classdojo-url").value = state.draft.integrations.classDojoUrl;
    byId("canvas-url").value = state.draft.integrations.canvasUrl;
    renderWeekEditor();
    renderPacingWeeks();
    renderFamilyResponse(byId("family-response-report"), null, {
      message: teacherKey()
        ? "Choose a window and show family activity."
        : "Add your teacher key to see how families used this week.",
    });
    renderHomeworkPicker();
    if (state.lessonId) selectLesson(state.lessonId);
    renderCollections();
    renderCopyPanel();
    renderPreview(false);
    state.previewed = false;
    renderHistory();
    updatePublicationStatus();
  } catch (error) {
    byId("publish-status").textContent = "Publishing unavailable";
    byId("publish-detail").textContent = error.message;
    notify(error.message);
  }
}

initialize();
