/* "Family home" button for the installed family app. An installed app on iPhone has no browser back button, so every
   practice area offers a way back to /family-app/. Shows only when the page runs as an installed app. */
(function () {
  var standalone = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || navigator.standalone;
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
