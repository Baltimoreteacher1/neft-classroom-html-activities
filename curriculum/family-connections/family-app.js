import { createDefaultSnapshot, resolveSection } from "./shared/model.js";
import { familyLink, renderHomeworkHub } from "./shared/homework-hub.js";
const query = new URL(location.href).searchParams;
// Old invitations and Canvas meeting anchors keep their existing destination.
if (query.has("meeting") || location.hash === "#family-scheduler") {
  location.replace(`/curriculum/family-connections/meetings/${location.search}${location.hash}`);
}
const key = "eduwonder.familyConnections.preferences.v1";
let preferences = {};
try {
  preferences = JSON.parse(localStorage.getItem(key)) || {};
} catch {}
let language =
  query.get("lang") === "es" || (!query.has("lang") && preferences.language === "es") ? "es" : "en";
let sectionId = query.get("section") || preferences.sectionId || "";
let snapshot = createDefaultSnapshot();
let lessons = [];
let loaded = false;
const byId = (id) => document.getElementById(id);
function render() {
  const es = language === "es";
  const section = resolveSection(snapshot, sectionId);
  sectionId = section.id;
  document.documentElement.lang = language;
  document.body.classList.toggle("large-text", Boolean(preferences.largeText));
  document.body.classList.toggle("high-contrast", Boolean(preferences.highContrast));
  byId("hub-title").textContent = es ? "Tareas para la familia" : "Family homework";
  byId("hub-intro").textContent = es
    ? "Las tareas de la semana y cómo contactar al Sr. Neft."
    : "Your week’s homework and a way to reach Mr. Neft.";
  byId("class-label").textContent = es ? "Clase" : "Class";
  byId("language-toggle").textContent = es ? "English" : "Español";
  byId("language-toggle").setAttribute("aria-pressed", String(es));
  byId("text-size-toggle").textContent = es ? "Texto grande" : "Larger text";
  byId("contrast-toggle").textContent = es ? "Contraste" : "Contrast";
  byId("text-size-toggle").setAttribute("aria-pressed", String(Boolean(preferences.largeText)));
  byId("contrast-toggle").setAttribute("aria-pressed", String(Boolean(preferences.highContrast)));
  byId("teacher-access").textContent = es ? "Acceso para el docente" : "Teacher sign in";
  byId("section-select").replaceChildren(
    ...snapshot.sections
      .filter((s) => s.visible !== false)
      .map((s) => new Option(s.label, s.id, false, s.id === sectionId)),
  );
  renderHomeworkHub(byId("family-homework"), snapshot, lessons, sectionId, language);
  preferences = { ...preferences, language, sectionId };
  try {
    localStorage.setItem(key, JSON.stringify(preferences));
  } catch {}
  if (loaded) history.replaceState(null, "", familyLink(sectionId, language, location.origin));
}
byId("section-select").addEventListener("change", (e) => {
  sectionId = e.target.value;
  render();
});
byId("language-toggle").addEventListener("click", () => {
  language = language === "en" ? "es" : "en";
  render();
});
byId("text-size-toggle").addEventListener("click", () => {
  preferences.largeText = !preferences.largeText;
  render();
});
byId("contrast-toggle").addEventListener("click", () => {
  preferences.highContrast = !preferences.highContrast;
  render();
});
async function load() {
  try {
    const [manifestResponse, publishedResponse] = await Promise.all([
      fetch("/data/curriculum-manifest.json"),
      fetch("/api/family-connections/published", { cache: "no-store" }),
    ]);
    if (!manifestResponse.ok || !publishedResponse.ok) throw new Error("unavailable");
    const manifest = await manifestResponse.json();
    const body = await publishedResponse.json();
    snapshot = body.published;
    if (!Array.isArray(snapshot?.sections)) throw new Error("unavailable");
    lessons = manifest.lessons || [];
    loaded = true;
    byId("family-status").textContent = "";
    render();
  } catch {
    render();
    byId("family-status").textContent =
      language === "es"
        ? "No se pudo cargar la semana. Vuelve a cargar la página o consulta ClassDojo."
        : "This week could not load. Reload the page or check ClassDojo.";
  }
}
// Update the old service worker once so it can remove its own stale caches.
if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
load();
