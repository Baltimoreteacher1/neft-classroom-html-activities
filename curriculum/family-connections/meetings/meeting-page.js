let savedLanguage = "";
try {
  savedLanguage = JSON.parse(
    localStorage.getItem("eduwonder.familyConnections.preferences.v1"),
  )?.language;
} catch {}
const query = new URL(location.href).searchParams;
let language = (query.get("lang") || savedLanguage) === "es" ? "es" : "en";
const toggle = document.getElementById("meeting-language-toggle");
function apply() {
  document.documentElement.lang = language;
  toggle.textContent = language === "es" ? "English" : "Español";
  toggle.setAttribute("aria-pressed", String(language === "es"));
}
apply();
import("../family-scheduler.js").then(() => {
  toggle.addEventListener("click", () => {
    language = language === "es" ? "en" : "es";
    apply();
    window.dispatchEvent(new CustomEvent("family-language-change", { detail: language }));
  });
});
