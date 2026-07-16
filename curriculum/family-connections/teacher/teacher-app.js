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
import {
  renderCollection,
  renderCopyEditor,
  renderFamilyPreview,
  renderLessonPicker,
  renderSectionEditor,
  renderWeekdayEditors,
} from "./editors.js";

const state = {
  draft: createDefaultSnapshot(),
  lessons: [],
  history: [],
  sectionId: "all-families",
  lessonId: "",
  copyLang: "en",
  dirty: false,
  previewed: false,
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
  byId("section-label").value = current.label;
  byId("week-label").value = current.week.label;
  byId("week-start").value = current.week.startDate;
  byId("week-note").value = current.week.note;
  renderWeekdayEditors(byId("weekday-editors"), current, state.lessons, (dayName, entry) => {
    const index = current.week.days.findIndex((day) => day.day === dayName);
    current.week.days[index] = entry;
    markDirty();
  });
  updateCanvasConnection();
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
  state.draft.announcements.push({ id: `update-${Date.now()}`, title, body, visible: true });
  byId("announcement-title").value = "";
  byId("announcement-body").value = "";
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
    const next = state.draft.sections.length + 1;
    const base = createDefaultSnapshot().sections[0];
    const added = {
      ...structuredClone(base),
      id: `class-${next}`,
      label: `Class ${next}`,
      isDefault: false,
    };
    state.draft.sections.push(added);
    state.sectionId = added.id;
    markDirty();
    renderWeekEditor();
  });
  for (const [id, key] of [
    ["section-label", "label"],
    ["week-label", "weekLabel"],
    ["week-start", "startDate"],
    ["week-note", "note"],
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
