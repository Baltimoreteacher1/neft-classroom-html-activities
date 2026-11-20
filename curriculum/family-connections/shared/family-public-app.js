import { publicHomeworkWeeks, weeksForSection, defaultHomeworkWeek, snapshotForWeek } from "./homework-weeks.js";
import { normalizeLessons, resolveSection } from "./model.js";
import { readLanguageMode, resolveHubLanguage, writeLanguageMode } from "./hub-language.js";
import { familyLink, renderHomeworkHub } from "./homework-hub.js";
import { normalizeWelcome } from "./family-welcome.js";

const $ = (id) => document.getElementById(id);
let storage = null;
try { storage = localStorage; } catch {}
const query = new URLSearchParams(location.search);
if (query.has("meeting") || location.hash === "#family-scheduler") location.replace(`/curriculum/family-connections/meetings/${location.search}${location.hash}`);
if (query.get("edit") === "1") location.replace(`/curriculum/family-connections/teacher/login.html${location.search}`);
const prefsKey = "eduwonder.familyConnections.preferences.v1";
let preferences = {};
try { preferences = JSON.parse(storage?.getItem(prefsKey) || "{}") || {}; } catch {}
const start = resolveHubLanguage({ queryLang: query.get("lang") || "", storedMode: readLanguageMode(storage), saved: preferences, browserLanguages: navigator.languages || [navigator.language || ""] });
let language = start.language;
let sectionId = query.get("section") || preferences.sectionId || "";
let sectionChosen = query.has("section") || preferences.sectionChosen === true || Boolean(preferences.sectionId && preferences.sectionId !== "all-families");
let selectedWeek = query.get("week") || "";
let snapshot;
let publishedWeeks = [];
let lessons = [];
let welcome = { enabled: false, weeks: {} };

function render() {
  const es = language === "es";
  document.documentElement.lang = language;
  $("hub-title").textContent = es ? "Estudio familiar de matemáticas" : "Family Math Studio";
  $("hub-intro").textContent = es ? "Unos minutos de matemáticas en casa. Opcional. Sin calificaciones." : "A few minutes of math at home. Optional. No grades.";
  $("edition-label").textContent = es ? "Una nota semanal del Sr. Neft" : "A weekly note from Mr. Neft";
  $("family-status").textContent = "";
  $("teacher-access").textContent = es ? "Acceso docente" : "Teacher sign in";
  const visible = snapshot.sections.filter((item) => item.visible !== false);
  const needsClass = !sectionChosen && visible.some((item) => !item.isDefault);
  const selected = resolveSection(snapshot, sectionId);
  sectionId = selected.id;
  $("section-select").replaceChildren(...visible.map((item) => new Option(item.label, item.id, false, item.id === sectionId)));
  if (needsClass) $("section-select").prepend(new Option(es ? "Elige tu clase" : "Pick your class", "", true, true));
  $("section-select").value = needsClass ? "" : sectionId;
  const records = weeksForSection(publishedWeeks, sectionId);
  const record = records.find((item) => item.week.startDate === selectedWeek) || defaultHomeworkWeek(records);
  if (!record || record.week.startDate !== selectedWeek) selectedWeek = "";
  renderHomeworkHub($("family-homework"), snapshotForWeek(snapshot, record), lessons, sectionId, language, { linkLang: language, welcome });
  preferences = { ...preferences, sectionId, sectionChosen };
  try { storage?.setItem(prefsKey, JSON.stringify(preferences)); } catch {}
  const url = new URL(familyLink(sectionId, language, location.origin));
  if (selectedWeek) url.searchParams.set("week", selectedWeek);
  history.replaceState(null, "", url);
}

$("section-select").addEventListener("change", (event) => { sectionId = event.target.value; sectionChosen = true; render(); });
for (const button of document.querySelectorAll("#language-switch [data-lang]")) button.addEventListener("click", () => { language = button.dataset.lang; writeLanguageMode(storage, language); render(); });
$("text-size-toggle").addEventListener("click", () => { preferences.largeText = !preferences.largeText; document.body.classList.toggle("large-text", preferences.largeText); });
$("contrast-toggle").addEventListener("click", () => { preferences.highContrast = !preferences.highContrast; document.body.classList.toggle("high-contrast", preferences.highContrast); });

try {
  const welcomeData = await window.NTJsonCache?.json("/data/family-welcome.json").catch(() => null);
  welcome = normalizeWelcome(welcomeData);
  const [manifestResponse, publishedResponse] = await Promise.all([fetch("/data/curriculum-manifest.json"), fetch("/api/family-connections/published", { cache: "no-store" })]);
  if (!manifestResponse.ok || !publishedResponse.ok) throw new Error("unavailable");
  const [manifest, body] = await Promise.all([manifestResponse.json(), publishedResponse.json()]);
  snapshot = body.published;
  if (!Array.isArray(snapshot?.sections)) throw new Error("unavailable");
  publishedWeeks = Array.isArray(body.weeks) ? body.weeks : publicHomeworkWeeks(snapshot);
  lessons = normalizeLessons([...(manifest.lessons || []), ...(manifest.familyHomework || [])]);
  render();
} catch {
  $("family-status").textContent = language === "es" ? "No se pudo cargar la semana. Vuelve a cargar la página." : "This week could not load. Reload the page.";
}
