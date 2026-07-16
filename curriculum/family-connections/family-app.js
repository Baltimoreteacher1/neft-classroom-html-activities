import { translationsEs } from "./shared/copy-defaults.js";
import { createDefaultSnapshot, resolveSection, safeExternalUrl } from "./shared/model.js";
import {
  familyWeekSpeech,
  renderAnnouncements,
  renderHomework,
  renderResources,
  renderSectionOptions,
  renderWeek,
} from "./shared/render.js";

const MANIFEST_URL = "/data/curriculum-manifest.json";
const PUBLISHED_URL = "/api/family-connections/published";
const PREFERENCE_KEY = "eduwonder.familyConnections.preferences.v1";

const translations = { es: translationsEs };

const state = {
  lessons: [],
  snapshot: createDefaultSnapshot(),
  sectionId: "all-families",
  visibleHomework: 12,
  refreshing: false,
  preferences: { language: "en", largeText: false, highContrast: false },
};

const byId = (id) => document.getElementById(id);
const announce = (message) => {
  byId("family-status").textContent = message;
};

function loadPreferences() {
  try {
    state.preferences = {
      ...state.preferences,
      ...JSON.parse(localStorage.getItem(PREFERENCE_KEY)),
    };
  } catch {}
  applyPreferences();
}

function savePreferences() {
  try {
    localStorage.setItem(PREFERENCE_KEY, JSON.stringify(state.preferences));
  } catch {}
}

function applyPreferences() {
  document.body.classList.toggle("large-text", state.preferences.largeText);
  document.body.classList.toggle("high-contrast", state.preferences.highContrast);
  document.documentElement.lang = state.preferences.language;
  byId("text-size-toggle").setAttribute("aria-pressed", String(state.preferences.largeText));
  byId("contrast-toggle").setAttribute("aria-pressed", String(state.preferences.highContrast));
  byId("language-toggle").setAttribute("aria-pressed", String(state.preferences.language === "es"));
  byId("language-toggle").textContent = state.preferences.language === "es" ? "English" : "Español";
  const publishedEdits = state.snapshot?.copy;
  const lang = state.preferences.language;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.dataset.i18n;
    const original = node.dataset.en ?? node.textContent.trim();
    node.dataset.en = original;
    const base = lang === "es" ? (translations.es[key] ?? original) : original;
    node.textContent = publishedEdits?.[lang]?.[key] ?? base;
  });
}

function renderIntegrations() {
  const { classDojoUrl, canvasUrl } = state.snapshot.integrations ?? {};
  const dojo = byId("classdojo-link");
  dojo.hidden = !safeExternalUrl(classDojoUrl);
  if (!dojo.hidden) dojo.href = classDojoUrl;
  const canvas = byId("canvas-link");
  canvas.hidden = !isConfiguredDestination(canvasUrl);
  if (!canvas.hidden) canvas.href = canvasUrl;
}

function isConfiguredDestination(value) {
  if (!safeExternalUrl(value)) return false;
  const url = new URL(value);
  return url.pathname !== "/" || Boolean(url.search || url.hash);
}

function renderHomeworkLibrary(resetLimit = false) {
  if (resetLimit) state.visibleHomework = 12;
  const result = renderHomework(
    byId("homework-grid"),
    state.lessons,
    state.snapshot.homeworkOverrides,
    {
      query: byId("homework-search").value,
      unit: byId("unit-filter").value,
      limit: state.visibleHomework,
    },
  );
  const hasFilters = Boolean(byId("homework-search").value.trim() || byId("unit-filter").value);
  byId("homework-count").textContent = hasFilters
    ? `${result.filtered.length} matching lessons`
    : `${result.all.length} lessons available`;
  byId("clear-homework-filters").hidden = !hasFilters;
  byId("load-more").hidden = result.visible >= result.filtered.length;
}

function renderExperience() {
  const section = resolveSection(state.snapshot, state.sectionId);
  state.sectionId = section.id;
  renderSectionOptions(byId("section-select"), state.snapshot, state.sectionId);
  byId("class-control").hidden =
    (state.snapshot.sections ?? []).filter((item) => item.visible !== false).length < 2;
  renderWeek(byId("week-grid"), state.snapshot, state.lessons, state.sectionId);
  byId("published-week-label").textContent = section.week.label;
  byId("published-week-note").textContent = section.week.note;
  renderAnnouncements(byId("family-announcements"), byId("announcement-grid"), state.snapshot);
  renderResources(byId("resource-grid"), state.snapshot);
  renderIntegrations();
  renderHomeworkLibrary(true);
}

function populateUnits() {
  const select = byId("unit-filter");
  const first = select.options[0];
  select.replaceChildren(first);
  const units = [...new Set(state.lessons.map((lesson) => lesson.unit))].sort((a, b) => a - b);
  for (const unit of units) {
    const option = document.createElement("option");
    option.value = String(unit);
    option.textContent = `Unit ${unit}`;
    select.append(option);
  }
}

async function getJson(url) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: { accept: "application/json" },
  });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.json();
}

async function refreshPublication() {
  if (state.refreshing || document.visibilityState !== "visible") return;
  state.refreshing = true;
  try {
    const result = await getJson(`${PUBLISHED_URL}?refresh=${Date.now()}`);
    const next = result.published;
    if (next && Number(next.revision) > Number(state.snapshot.revision)) {
      state.snapshot = next;
      renderExperience();
      applyPreferences();
      announce("Family page updated with the teacher's latest changes.");
    }
  } catch {
    // Keep the current family view stable during a temporary refresh failure.
  } finally {
    state.refreshing = false;
  }
}

async function load() {
  const [manifestResult, publicationResult] = await Promise.allSettled([
    getJson(MANIFEST_URL),
    getJson(PUBLISHED_URL),
  ]);
  if (manifestResult.status === "fulfilled") {
    state.lessons = manifestResult.value.lessons ?? [];
    populateUnits();
  } else {
    byId("week-data-status").textContent =
      "Lesson links are temporarily unavailable. Please refresh to try again.";
  }
  if (publicationResult.status === "fulfilled" && publicationResult.value.published) {
    state.snapshot = publicationResult.value.published;
    byId("week-data-status").textContent = state.snapshot.publishedAt
      ? `Updated ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(state.snapshot.publishedAt))}.`
      : "The weekly plan is ready for the first teacher update.";
  } else {
    byId("week-data-status").textContent = state.lessons.length
      ? "The weekly plan is temporarily unavailable. The optional family practice library is ready below."
      : "Family resources are temporarily unavailable. Please refresh to try again.";
  }
  renderExperience();
  // Re-apply wording now that published copy overrides have loaded.
  applyPreferences();
}

function bindEvents() {
  byId("section-select").addEventListener("change", (event) => {
    state.sectionId = event.target.value;
    renderExperience();
  });
  for (const id of ["homework-search", "unit-filter"]) {
    byId(id).addEventListener(id === "homework-search" ? "input" : "change", () =>
      renderHomeworkLibrary(true),
    );
  }
  byId("load-more").addEventListener("click", () => {
    state.visibleHomework += 12;
    renderHomeworkLibrary();
  });
  byId("clear-homework-filters").addEventListener("click", () => {
    byId("homework-search").value = "";
    byId("unit-filter").value = "";
    renderHomeworkLibrary(true);
    byId("homework-search").focus();
    announce("Practice filters cleared. All lessons are available.");
  });
  byId("read-week").addEventListener("click", () => {
    if (!("speechSynthesis" in window))
      return announce("Read aloud is not available in this browser.");
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      familyWeekSpeech(state.snapshot, state.lessons, state.sectionId),
    );
    utterance.lang = state.preferences.language === "es" ? "es-US" : "en-US";
    window.speechSynthesis.speak(utterance);
    announce("Reading this week aloud.");
  });
  byId("language-toggle").addEventListener("click", () => {
    state.preferences.language = state.preferences.language === "es" ? "en" : "es";
    applyPreferences();
    savePreferences();
  });
  byId("text-size-toggle").addEventListener("click", () => {
    state.preferences.largeText = !state.preferences.largeText;
    applyPreferences();
    savePreferences();
  });
  byId("contrast-toggle").addEventListener("click", () => {
    state.preferences.highContrast = !state.preferences.highContrast;
    applyPreferences();
    savePreferences();
  });
}

loadPreferences();
bindEvents();
load();
setInterval(refreshPublication, 30_000);
document.addEventListener("visibilitychange", refreshPublication);
