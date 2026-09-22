import { downloadWeekCalendar } from "./calendar-event.js";
import { translationsEs } from "./shared/copy-defaults.js";
import {
  createDefaultSnapshot,
  resolveSection,
  safeExternalUrl,
  weekNote,
} from "./shared/model.js";
import {
  familyWeekShare,
  familyWeekSpeech,
  renderAnnouncements,
  renderHomework,
  renderResources,
  renderSectionOptions,
  renderSpotlight,
  renderWeek,
  renderWeekPractice,
  renderWeekVocab,
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
  preferences: { language: "en", largeText: false, highContrast: false, sectionId: "" },
};

const FAMILY_PAGE_URL = `${location.origin}/curriculum/family-connections/`;
let weekShareData = null;
let weekCalendarData = null;

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
  if (state.preferences.sectionId) state.sectionId = state.preferences.sectionId;
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
  window.dispatchEvent(new CustomEvent("family-language-change", { detail: lang }));
}

function renderIntegrations() {
  const { classDojoUrl, canvasUrl } = state.snapshot.integrations ?? {};
  document.querySelectorAll("[data-classdojo-link]").forEach((dojo) => {
    dojo.hidden = !safeExternalUrl(classDojoUrl);
    if (!dojo.hidden) dojo.href = classDojoUrl;
  });
  const canvas = byId("canvas-link");
  canvas.hidden = !isConfiguredDestination(canvasUrl);
  if (!canvas.hidden) canvas.href = canvasUrl;
}

function isConfiguredDestination(value) {
  if (!safeExternalUrl(value)) return false;
  const url = new URL(value);
  return url.pathname !== "/" || Boolean(url.search || url.hash);
}

// Practice tied to the posted week. The teacher publishes the calendar; this is
// the same set families see on the day cards, surfaced as full practice cards.
function renderPostedPractice(lang) {
  return renderWeekPractice(
    byId("week-practice"),
    byId("week-practice-grid"),
    state.snapshot,
    state.lessons,
    state.snapshot.homeworkOverrides,
    state.sectionId,
    lang,
  );
}

function renderHomeworkLibrary(resetLimit = false) {
  if (resetLimit) state.visibleHomework = 12;
  const lang = state.preferences.language;
  const es = lang === "es";
  const postedCount = renderPostedPractice(lang);
  const result = renderHomework(
    byId("homework-grid"),
    state.lessons,
    state.snapshot.homeworkOverrides,
    {
      query: byId("homework-search").value,
      unit: byId("unit-filter").value,
      limit: state.visibleHomework,
      lang,
    },
  );
  const hasFilters = Boolean(byId("homework-search").value.trim() || byId("unit-filter").value);
  const chip = byId("homework-count");
  if (hasFilters) {
    chip.textContent = es
      ? `${result.filtered.length} lecciones coinciden`
      : `${result.filtered.length} matching lessons`;
  } else if (postedCount) {
    const plural = postedCount === 1 ? "" : "s";
    chip.textContent = es
      ? `${postedCount} ${postedCount === 1 ? "lección publicada" : "lecciones publicadas"} esta semana`
      : `${postedCount} lesson${plural} posted this week`;
  } else {
    chip.textContent = es
      ? `${result.all.length} lecciones disponibles`
      : `${result.all.length} lessons available`;
  }
  byId("clear-homework-filters").hidden = !hasFilters;
  byId("load-more").hidden = result.visible >= result.filtered.length;
}

function renderExperience() {
  const lang = state.preferences.language;
  const section = resolveSection(state.snapshot, state.sectionId);
  state.sectionId = section.id;
  renderSectionOptions(byId("section-select"), state.snapshot, state.sectionId);
  byId("class-control").hidden =
    (state.snapshot.sections ?? []).filter((item) => item.visible !== false).length < 2;
  renderWeek(byId("week-grid"), state.snapshot, state.lessons, state.sectionId, lang);
  renderSpotlight(byId("week-spotlight"), state.snapshot, state.lessons, state.sectionId, lang);
  renderWeekVocab(byId("week-vocab"), state.snapshot, state.lessons, state.sectionId, lang);
  byId("published-week-label").textContent = section.week.label;
  byId("published-week-note").textContent = weekNote(section.week, lang);
  renderFreshness();
  updateWeekActions(section, lang);
  renderAnnouncements(byId("family-announcements"), byId("announcement-grid"), state.snapshot);
  renderResources(byId("resource-grid"), state.snapshot);
  renderIntegrations();
  renderHomeworkLibrary(true);
}

function freshnessLabel(when, lang) {
  const es = lang === "es";
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const days = Math.round((startOfDay(new Date()) - startOfDay(when)) / 86_400_000);
  if (days <= 0) return es ? "Actualizado hoy" : "Updated today";
  if (days === 1) return es ? "Actualizado ayer" : "Updated yesterday";
  if (days < 7) {
    const weekday = new Intl.DateTimeFormat(es ? "es-US" : "en-US", { weekday: "long" }).format(
      when,
    );
    return es ? `Actualizado el ${weekday}` : `Updated ${weekday}`;
  }
  const date = new Intl.DateTimeFormat(es ? "es-US" : "en-US", { dateStyle: "medium" }).format(
    when,
  );
  return es ? `Actualizado el ${date}` : `Updated ${date}`;
}

function renderFreshness() {
  const el = byId("week-freshness");
  const when = state.snapshot.publishedAt ? new Date(state.snapshot.publishedAt) : null;
  if (!when || Number.isNaN(when.getTime())) {
    el.hidden = true;
    return;
  }
  el.hidden = false;
  el.textContent = freshnessLabel(when, state.preferences.language);
}

// Build the Email / Text / Send-to-phone / calendar payloads for the current week.
function updateWeekActions(section, lang) {
  const { subject, body } = familyWeekShare(state.snapshot, state.lessons, state.sectionId, lang);
  const fullBody = `${body}\n\n${FAMILY_PAGE_URL}`;
  byId("email-week").href =
    `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(fullBody)}`;
  byId("text-week").href = `sms:?&body=${encodeURIComponent(fullBody)}`;
  const share = byId("share-week");
  share.hidden = typeof navigator.share !== "function";
  weekShareData = { title: subject, text: body, url: FAMILY_PAGE_URL };
  weekCalendarData = {
    title: `${lang === "es" ? "Matemáticas" : "Math"} · ${section.week?.label ?? ""}`.trim(),
    dateISO: section.week?.startDate || "",
    description: body,
    url: FAMILY_PAGE_URL,
    reference: `family-week-${section.id}`,
  };
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
  renderFamilyPracticeHistory();
  // Re-apply wording now that published copy overrides have loaded.
  applyPreferences();
}

function bindEvents() {
  byId("section-select").addEventListener("change", (event) => {
    state.sectionId = event.target.value;
    state.preferences.sectionId = event.target.value;
    savePreferences();
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
    const es = state.preferences.language === "es";
    const utterance = new SpeechSynthesisUtterance(
      familyWeekSpeech(state.snapshot, state.lessons, state.sectionId, es ? "es" : "en"),
    );
    utterance.lang = es ? "es-US" : "en-US";
    const voice = pickVoice(es ? "es" : "en");
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
    announce(es ? "Leyendo esta semana en voz alta." : "Reading this week aloud.");
  });
  byId("language-toggle").addEventListener("click", () => {
    state.preferences.language = state.preferences.language === "es" ? "en" : "es";
    applyPreferences();
    savePreferences();
    renderExperience();
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
  bindWeekActions();
  bindPulse();
  bindPracticeSignal();
  bindScrollSpy();
}

function bindWeekActions() {
  byId("print-week").addEventListener("click", () => window.print());
  byId("calendar-week").addEventListener("click", () => {
    if (weekCalendarData) downloadWeekCalendar(weekCalendarData);
  });
  byId("share-week").addEventListener("click", async () => {
    if (!weekShareData || typeof navigator.share !== "function") return;
    try {
      await navigator.share(weekShareData);
    } catch {
      // Parent dismissed the share sheet — nothing to do.
    }
  });
}

/* Which entry point families actually use. The beacon is aggregate-only and
 * inherits nt-usage's do-not-track and teacher-mode guards; without it there is
 * no way to tell whether posting the week moved practice opens at all. */
function bindPracticeSignal() {
  document.addEventListener(
    "click",
    (event) => {
      const trigger = event.target.closest?.("[data-practice-open]");
      if (!trigger) return;
      try {
        window.NTUsage?.reportPractice?.(trigger.dataset.lessonId, trigger.dataset.practiceOpen);
      } catch {
        // Measurement must never stand between a family and the practice.
      }
    },
    { capture: true },
  );
}

function bindPulse() {
  const actions = byId("pulse-actions");
  const thanks = byId("pulse-thanks");
  actions.addEventListener("click", (event) => {
    const button = event.target.closest("[data-pulse]");
    if (!button) return;
    for (const item of actions.querySelectorAll("[data-pulse]"))
      item.setAttribute("aria-pressed", String(item === button));
    const dojo = state.snapshot.integrations?.classDojoUrl;
    const tell = byId("pulse-tell");
    if (safeExternalUrl(dojo)) {
      tell.href = dojo;
      tell.target = "_blank";
      tell.rel = "noopener";
      tell.hidden = false;
    } else {
      tell.hidden = true;
    }
    thanks.hidden = false;
  });
}

// Highlight the quick-nav link for whichever section is in view.
function bindScrollSpy() {
  const links = new Map(
    [...document.querySelectorAll(".family-quick-nav a[href^='#']")].map((a) => [
      a.getAttribute("href").slice(1),
      a,
    ]),
  );
  const sections = [...links.keys()].map((id) => byId(id)).filter(Boolean);
  if (!sections.length || !("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        for (const a of links.values()) a.removeAttribute("aria-current");
        links.get(entry.target.id)?.setAttribute("aria-current", "true");
      }
    },
    { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
  );
  for (const section of sections) observer.observe(section);
}

function pickVoice(lang) {
  if (!("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices() ?? [];
  return voices.find((voice) => voice.lang?.toLowerCase().startsWith(lang)) ?? null;
}

function renderFamilyPracticeHistory() {
  const section = byId("family-history");
  if (!section) return;

  const completed = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("hw_parent_signoff_")) {
        const lessonId = key.replace("hw_parent_signoff_", "");
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const data = JSON.parse(raw);
            completed.push({ lessonId, ...data });
          } catch (e) {}
        }
      }
    }
  } catch (e) {}

  if (!completed.length) {
    section.hidden = true;
    return;
  }

  section.hidden = false;
  const countEl = byId("history-completed-count");
  if (countEl) countEl.textContent = String(completed.length);

  // Streak
  let streak = 1;
  try {
    const streakKey = ["hw", "family", "streak", "history"].join("_");
    const history = JSON.parse(localStorage.getItem(streakKey) || "[]");
    if (history.length) {
      for (let i = history.length - 2; i >= 0; i--) {
        const prev = new Date(history[i]);
        const next = new Date(history[i + 1]);
        const diffDays = Math.round((next - prev) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) streak++;
        else if (diffDays === 0) continue;
        else break;
      }
    } else {
      streak = completed.length > 0 ? 1 : 0;
    }
  } catch (e) {}

  const streakEl = byId("history-streak-count");
  if (streakEl) streakEl.textContent = String(streak);
  const streakChip = byId("history-streak-chip");
  if (streakChip) streakChip.textContent = `🔥 ${streak}-night streak`;

  // Vocab review count
  let reviewCount = 0;
  try {
    const reviewDeck = JSON.parse(localStorage.getItem("hw_vocab_review_deck") || "[]");
    reviewCount = reviewDeck.length;
  } catch (e) {}
  const reviewEl = byId("history-review-count");
  if (reviewEl) reviewEl.textContent = String(reviewCount);

  // Recent practice list
  const recentList = byId("history-recent-list");
  if (recentList) {
    completed.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    const topRecent = completed.slice(0, 4);
    recentList.innerHTML = topRecent
      .map(
        (item) => `
        <a class="history-item-card" href="/lessons/${encodeURIComponent(item.lessonId)}/homework.html" style="display:inline-flex; flex-direction:column; padding: 8px 12px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; text-decoration: none; color: inherit; min-width: 140px;">
          <div class="history-item-head" style="display:flex; justify-content:space-between; align-items:center; gap: 8px;">
            <strong style="color: #12355b; font-size: 0.9rem;">${item.lessonTitle || `Lesson ${item.lessonId}`}</strong>
            <span style="font-size: 0.75rem; color: #0c6f6b; font-weight: 700;">✓ Done</span>
          </div>
          <span style="font-size: 0.75rem; color: #64748b; margin-top: 4px;">${item.date ? item.date.split(" at ")[0] : ""}</span>
        </a>
      `,
      )
      .join("");
  }
}

loadPreferences();
bindEvents();
load();
setInterval(refreshPublication, 30_000);
document.addEventListener("visibilitychange", () => {
  refreshPublication();
  renderFamilyPracticeHistory();
});
if ("speechSynthesis" in window) window.speechSynthesis.getVoices();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

