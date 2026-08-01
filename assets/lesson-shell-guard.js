/*!
 * lesson-shell-guard.js — friendly recovery card if a lesson app fails to boot.
 *
 * The lesson launchers are JS-rendered (<div id="app"> + a module script). If
 * the module fails to load or throws before first paint (flaky school wifi,
 * cached bad build, unsupported browser), students previously saw a silent
 * blank page. This watchdog waits for window load + a grace period; if #app is
 * still completely empty it shows a calm, student-friendly card with a Reload
 * button and a link back to the Curriculum Hub. It never touches a page that
 * rendered anything at all.
 *
 * Injected by tools/inject-enterprise-head.js. Self-contained, no dependencies.
 */
(function () {
  if (window.__ntShellGuard) return; // idempotent
  window.__ntShellGuard = true;

  var GRACE_MS = 9000; // after window load — generous for slow devices
  var sawScriptError = false;

  window.addEventListener(
    "error",
    function (e) {
      // Track resource/script failures so we can show the card sooner.
      if (
        e &&
        (e.filename || (e.target && /** @type {HTMLElement} */ (e.target).tagName === "SCRIPT"))
      ) {
        sawScriptError = true;
      }
    },
    true,
  );

  function appIsEmpty() {
    var app = document.getElementById("app");
    if (!app) return false;
    return app.childElementCount === 0 && app.textContent.replace(/\s+/g, "") === "";
  }

  function showFallback() {
    if (!appIsEmpty()) return;
    if (document.getElementById("nt-shell-fallback")) return;
    var app = document.getElementById("app");
    var box = document.createElement("div");
    box.id = "nt-shell-fallback";
    box.setAttribute("role", "alert");
    box.style.cssText =
      "max-width:520px;margin:64px auto;padding:32px 28px;background:#fff;" +
      "border:1px solid #d7e2ed;border-radius:16px;box-shadow:0 10px 30px rgba(18,53,91,.10);" +
      "font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#21313f;text-align:center;";
    box.innerHTML =
      '<div style="font-size:44px;line-height:1" aria-hidden="true">📚</div>' +
      '<h1 style="font-size:22px;color:#12355b;margin:14px 0 8px">This lesson is having trouble loading</h1>' +
      '<p style="font-size:16px;line-height:1.5;color:#5f6f80;margin:0 0 20px">' +
      "Don't worry — your saved work is safe. Try reloading the page. " +
      "If it still doesn't load, tell your teacher.</p>" +
      '<button type="button" id="nt-shell-reload" style="background:#12355b;color:#fff;border:0;' +
      'border-radius:10px;padding:12px 26px;font-size:16px;font-weight:700;cursor:pointer;min-height:44px">' +
      "Reload lesson</button>" +
      '<p style="margin:16px 0 0"><a href="/curriculum/" style="color:#0d7a76;font-size:15px;font-weight:600">' +
      "← Back to the Curriculum Hub</a></p>";
    app.appendChild(box);
    var btn = document.getElementById("nt-shell-reload");
    if (btn) {
      btn.addEventListener("click", function () {
        window.location.reload();
      });
    }
  }

  function arm() {
    // If a script already failed, check quickly; otherwise wait out the grace period.
    setTimeout(showFallback, sawScriptError ? 1500 : GRACE_MS);
  }

  if (document.readyState === "complete") {
    arm();
  } else {
    window.addEventListener("load", arm);
    // Belt-and-suspenders: never wait forever for a hung `load` event.
    setTimeout(showFallback, GRACE_MS * 3);
  }
})();
