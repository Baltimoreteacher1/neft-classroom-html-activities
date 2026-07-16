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

const translations = {
  es: {
    eyebrow: "Conexión con las familias",
    title: "Esta semana, de un vistazo.",
    lede: "Vea lo que su estudiante está aprendiendo y elija una manera sencilla de practicar juntos.",
    promiseTitle: "No necesita enseñar la lección.",
    promiseBody: "Pregunte qué nota su estudiante, escuche la estrategia y anime su esfuerzo.",
    weekEyebrow: "Empiece aquí",
    weekTitle: "Esta semana en matemáticas",
    classLabel: "Clase",
    readWeek: "Escuchar",
    updatesEyebrow: "Desde el salón",
    updatesTitle: "Noticias para las familias",
    homeworkEyebrow: "Opcional y sin calificación",
    homeworkTitle: "Práctica familiar opcional",
    homeworkIntro: "Esto es aparte de la tarea regular de su estudiante. Úselo solo cuando funcione para su familia, como una oportunidad para repasar o practicar juntos. No se califica.",
    browsePractice: "Ver la práctica familiar opcional",
    browsePracticeHint: "Busque cualquier lección por número o tema",
    searchLabel: "Buscar lecciones",
    unitLabel: "Unidad",
    supportEyebrow: "Tres maneras de ayudar",
    supportTitle: "Pregunte. Escuche. Anime.",
    askTitle: "Pregunte",
    askBody: "“¿Qué notas?”",
    listenTitle: "Escuche",
    listenBody: "Deje que su estudiante explique una estrategia.",
    encourageTitle: "Anime",
    encourageBody: "Elogie el esfuerzo. Revisaremos las matemáticas en la escuela.",
    aiLink: "Abrir la guía familiar de IA →",
    schoolOptionBody: "Opción equivalente en la escuela: Los estudiantes pueden usar la misma práctica con un adulto de confianza en la escuela.",
    gradingTitle: "La participación familiar no se califica.",
    connectEyebrow: "Sus preguntas son bienvenidas",
    connectTitle: "Sigamos conversando.",
    connectBody: "Use el canal familiar de su escuela para preguntar o compartir lo que notó su estudiante.",
  },
};

const state = {
  lessons: [],
  snapshot: createDefaultSnapshot(),
  sectionId: "all-families",
  visibleHomework: 12,
  preferences: { language: "en", largeText: false, highContrast: false },
};

const byId = (id) => document.getElementById(id);
const announce = (message) => {
  byId("family-status").textContent = message;
};

function loadPreferences() {
  try {
    state.preferences = { ...state.preferences, ...JSON.parse(localStorage.getItem(PREFERENCE_KEY)) };
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
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const original = node.dataset.en ?? node.textContent.trim();
    node.dataset.en = original;
    node.textContent = state.preferences.language === "es"
      ? translations.es[node.dataset.i18n] ?? original
      : original;
  });
}

function renderIntegrations() {
  const { classDojoUrl, canvasUrl } = state.snapshot.integrations ?? {};
  const dojo = byId("classdojo-link");
  dojo.hidden = !safeExternalUrl(classDojoUrl);
  if (!dojo.hidden) dojo.href = classDojoUrl;
  const canvas = byId("canvas-link");
  canvas.hidden = !safeExternalUrl(canvasUrl);
  if (!canvas.hidden) canvas.href = canvasUrl;
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
  byId("homework-count").textContent = `${result.filtered.length} of ${result.all.length} lessons`;
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
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.json();
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
    byId("week-data-status").textContent = "Lesson links are temporarily unavailable. Please refresh to try again.";
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
}

function bindEvents() {
  byId("section-select").addEventListener("change", (event) => {
    state.sectionId = event.target.value;
    renderExperience();
  });
  for (const id of ["homework-search", "unit-filter"]) {
    byId(id).addEventListener(id === "homework-search" ? "input" : "change", () => renderHomeworkLibrary(true));
  }
  byId("load-more").addEventListener("click", () => {
    state.visibleHomework += 12;
    renderHomeworkLibrary();
  });
  byId("read-week").addEventListener("click", () => {
    if (!("speechSynthesis" in window)) return announce("Read aloud is not available in this browser.");
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(familyWeekSpeech(state.snapshot, state.lessons, state.sectionId));
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
