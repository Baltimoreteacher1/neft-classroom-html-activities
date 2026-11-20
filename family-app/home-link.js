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
  // Inside the Language Page app (Capacitor on thelanguagepage.com) there is no family home to go back to: the
  // button returns to the lab home instead, and hides there. Everywhere else it is unchanged.
  var languagePage = nativeApp && /^(www\.)?thelanguagepage\.com$/.test(String(location.hostname || ""));
  // In the Language Page app the label follows the LAB's language (prefs.lang: "en" | "es" | "bi"; EN+ES reads English),
  // never the phone's or the family home's. Everywhere else it is unchanged.
  function pickLang() {
    var l = "en";
    try {
      if (languagePage) return JSON.parse(localStorage.getItem("accessPracticeLab:v1:prefs") || "{}").lang === "es" ? "es" : "en";
      l = localStorage.getItem("ewl-family-lang") || ((navigator.language || "").slice(0, 2) === "es" ? "es" : "en");
    } catch (e) {}
    return l;
  }
  var lang = pickLang();
  var a = document.createElement("a");
  a.href = languagePage ? "/access-practice-lab/" : "/family-app/";
  function label() {
    lang = pickLang();
    if (languagePage) {
      a.textContent = lang === "es" ? "\u2302 Inicio" : "\u2302 Home";
      a.setAttribute("aria-label", lang === "es" ? "Volver al inicio de The Language Page" : "Back to The Language Page home");
    } else {
      a.textContent = lang === "es" ? "\u2302 Inicio" : "\u2302 Family home";
      a.setAttribute("aria-label", lang === "es" ? "Volver al inicio de la app familiar" : "Back to the family app home");
    }
  }
  label();
  a.style.cssText =
    "position:fixed;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:2147483000;min-height:44px;padding:0 " +
    (languagePage ? "12px" : "16px") +
    ";display:inline-flex;align-items:center;border-radius:22px;background:#12343b;color:#fff;font:700 " +
    (languagePage ? "14px" : "15px") +
    " system-ui,-apple-system,sans-serif;text-decoration:none;box-shadow:0 2px 8px rgba(0,0,0,.3)";
  document.body.appendChild(a);
  if (languagePage) {
    // The lab is a single-page app: follow its route changes (history API) and its language switch.
    var sync = function () {
      a.hidden = /^\/access-practice-lab\/?$/.test(location.pathname);
      a.style.display = a.hidden ? "none" : "inline-flex";
      label();
    };
    ["pushState", "replaceState"].forEach(function (m) {
      var orig = history[m];
      history[m] = function () {
        var r = orig.apply(this, arguments);
        setTimeout(sync, 0);
        return r;
      };
    });
    window.addEventListener("popstate", sync);
    document.addEventListener("click", function () { setTimeout(sync, 400); }, true);
    sync();
  }
})();
