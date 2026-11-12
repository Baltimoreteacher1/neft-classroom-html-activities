/* Shared by all three practice areas.
   1. Language: a family that chose Español on the family home gets Spanish in the practice apps on first use.
      Classic script, so it runs before the apps' deferred modules read their settings. It only fills keys that
      are absent; it never overwrites a choice made inside an app.
   2. "Family home" button for the installed family app. An installed app on iPhone has no browser back button, so
      every practice area offers a way back to /family-app/. Shows only when the page runs as an installed app. */
(function () {
  try {
    var fam = localStorage.getItem("ewl-family-lang");
    if (fam === "en" || fam === "es") {
      if (localStorage.getItem("ewl-fluency-lang-v1") === null) localStorage.setItem("ewl-fluency-lang-v1", JSON.stringify(fam));
      if (localStorage.getItem("accessPracticeLab:v1:prefs") === null) localStorage.setItem("accessPracticeLab:v1:prefs", JSON.stringify({ lang: fam }));
    }
  } catch (e) {}
})();
(function () {
  // The iPhone app (Capacitor) is a web view, which reports neither standalone signal.
  var nativeApp = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  var standalone = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || navigator.standalone || nativeApp;
  if (!standalone || location.pathname.indexOf("/family-app/") === 0) return;
  var lang = "en";
  try {
    lang = localStorage.getItem("ewl-family-lang") || ((navigator.language || "").slice(0, 2) === "es" ? "es" : "en");
  } catch (e) {}
  var a = document.createElement("a");
  a.href = "/family-app/";
  a.textContent = lang === "es" ? "⌂ Inicio" : "⌂ Family home";
  a.setAttribute("aria-label", lang === "es" ? "Volver al inicio de la app familiar" : "Back to the family app home");
  a.style.cssText =
    "position:fixed;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:2147483000;min-height:44px;padding:0 16px;" +
    "display:inline-flex;align-items:center;border-radius:22px;background:#12343b;color:#fff;font:700 15px system-ui,-apple-system,sans-serif;" +
    "text-decoration:none;box-shadow:0 2px 8px rgba(0,0,0,.3)";
  document.body.appendChild(a);
})();
