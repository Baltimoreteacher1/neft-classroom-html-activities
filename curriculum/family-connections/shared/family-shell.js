const root = "/curriculum/family-connections/";
const path = location.pathname;
const active = path.includes("/weekly-sheet/") ? "week" : path.includes("/math-studio/") ? "studio" : path.includes("/homework.html") ? "tonight" : "tonight";
let storage = null;
try { storage = localStorage; } catch {}
let language = new URLSearchParams(location.search).get("lang") || storage?.getItem("hw_lang_mode") || "en";
const links = [
  ["tonight", "Tonight", "Hoy", root],
  ["week", "This Week", "Esta semana", `${root}weekly-sheet/`],
  ["studio", "Math Studio", "Estudio matemático", `${root}math-studio/`],
];
const nav = document.querySelector(".family-shell");
if (!nav.querySelector("[data-family-tab]")) {
  for (const [id, en, es, href] of links) {
    const anchor = document.createElement("a");
    anchor.dataset.familyTab = id;
    anchor.href = href;
    anchor.textContent = language === "es" ? es : en;
    nav.append(anchor);
  }
  for (const [code, label] of [["en", "EN"], ["es", "ES"]]) {
    const button = document.createElement("button");
    button.dataset.familyLanguage = code;
    button.textContent = label;
    button.setAttribute("aria-label", code === "es" ? "Español" : "English");
    nav.append(button);
  }
}
const setNavLabel = (code) => nav.setAttribute("aria-label", code === "es" ? "Navegación del Estudio familiar" : "Family Math Studio navigation");
setNavLabel(language);
for (const [id, en, es, href] of links) {
  const a = nav.querySelector(`[data-family-tab="${id}"]`);
  a.href = href;
  if (id === active) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  if (!a.querySelector(".lang-en, .lang-es")) a.textContent = language === "es" ? es : en;
  if (id === "studio" && path.includes("/homework.html")) a.href += `?lesson=${encodeURIComponent(path.split("/")[2])}`;
  if (language === "es") a.href += `${a.href.includes("?") ? "&" : "?"}lang=es`;
}
const group = nav;
for (const [code, label, short] of [["en", "English", "EN"], ["es", "Español", "ES"]]) {
  const button = group.querySelector(`[data-family-language="${code}"]`);
  button.textContent = short;
  button.setAttribute("aria-label", label);
  button.setAttribute("aria-pressed", String(language === code));
  button.addEventListener("click", () => {
    language = code;
    setNavLabel(code);
    document.documentElement.lang = code;
    group.querySelectorAll("button").forEach((item) => item.setAttribute("aria-pressed", String(item.dataset.familyLanguage === code)));
    const legacy = document.querySelector(`[data-lang="${code}"]`) || document.querySelector(`[data-lang-mode="${code}"]`) || document.getElementById(`lang-${code}`);
    if (legacy && legacy !== button) legacy.click();
    else {
      try { storage?.setItem("hw_lang_mode", code); } catch {}
      if (path.includes("/weekly-sheet/")) {
        try { storage?.setItem("ws:lang", code); } catch {}
      }
      const url = new URL(location.href);
      if (code === "es") url.searchParams.set("lang", "es"); else url.searchParams.delete("lang");
      location.href = url.href;
    }
  });
}
document.documentElement.lang = language === "es" ? "es" : "en";

// The module is shared by the hub and the weekly sheet; checkboxes keep their
// established ws:v1 keys and are also reflected in the legacy homework-night key.
document.addEventListener("change", (event) => {
  const input = event.target;
  if (input.matches(".ws-check")) import("./family-state.js").then(({ setNight }) => setNight(input.dataset.date, input.checked, storage));
});
document.addEventListener("family-math-complete", () => import("./family-state.js").then(({ markToday }) => markToday(storage)));
