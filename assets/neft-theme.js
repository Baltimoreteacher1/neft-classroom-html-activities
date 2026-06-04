/* =========================================================================
   Neft Teacher — Theme Toggle (drop-in, zero dependencies, offline-first)
   -------------------------------------------------------------------------
   WHAT IT DOES
     • Injects a fixed top-right ☀️/🌙 toggle button (accessible + keyboard).
     • Persists choice in localStorage key "neft-theme".
     • Defaults to the OS prefers-color-scheme when no saved choice exists.
     • Applies the theme via document.documentElement.dataset.theme
       ('light' | 'dark'), which drives the --nt-* vars in neft-theme.css.

   HOW TO INCLUDE (in any page <head> or end of <body>)
       <link rel="stylesheet" href="/assets/neft-theme.css">
       <script src="/assets/neft-theme.js" defer></script>

   Then style the page with the --nt-* variables documented in
   neft-theme.css (--nt-bg, --nt-surface, --nt-text, --nt-muted,
   --nt-accent, --nt-border, --nt-focus).

   OPTIONAL API (global window.NeftTheme)
       NeftTheme.get()           -> 'light' | 'dark'
       NeftTheme.set('dark')     -> apply + persist
       NeftTheme.toggle()        -> flip current theme
     Listen for changes:
       window.addEventListener('neft-theme-change', e => e.detail.theme)
   ========================================================================= */
(function () {
  "use strict";

  var STORAGE_KEY = "neft-theme";
  var root = document.documentElement;

  function osPrefersDark() {
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  }

  function stored() {
    try {
      var v = localStorage.getItem(STORAGE_KEY);
      return v === "light" || v === "dark" ? v : null;
    } catch (e) {
      return null;
    }
  }

  function resolveInitial() {
    return stored() || (osPrefersDark() ? "dark" : "light");
  }

  function apply(theme, persist) {
    theme = theme === "dark" ? "dark" : "light";
    root.dataset.theme = theme;
    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch (e) {}
    }
    syncButton(theme);
    window.dispatchEvent(
      new CustomEvent("neft-theme-change", { detail: { theme: theme } }),
    );
    return theme;
  }

  // Apply early to minimize flash (script is deferred, so DOM head exists).
  apply(resolveInitial(), false);

  var btn = null;

  function syncButton(theme) {
    if (!btn) return;
    var dark = theme === "dark";
    btn.textContent = dark ? "☀️" : "🌙"; // ☀️ when dark (offers light) / 🌙 when light
    var next = dark ? "light" : "dark";
    var label = "Switch to " + next + " mode";
    btn.setAttribute("aria-label", label);
    btn.setAttribute("title", label);
    btn.setAttribute("aria-pressed", String(dark));
  }

  function buildButton() {
    btn = document.createElement("button");
    btn.type = "button";
    btn.className = "nt-theme-toggle";
    btn.setAttribute("aria-live", "polite");
    btn.addEventListener("click", function () {
      apply(root.dataset.theme === "dark" ? "light" : "dark", true);
    });
    syncButton(root.dataset.theme || "light");
    document.body.appendChild(btn);
  }

  function init() {
    if (document.body) buildButton();
    else
      document.addEventListener("DOMContentLoaded", buildButton, {
        once: true,
      });

    // Follow OS changes only while the user has not made an explicit choice.
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      var onChange = function (e) {
        if (!stored()) apply(e.matches ? "dark" : "light", false);
      };
      if (mq.addEventListener) mq.addEventListener("change", onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  // Public API
  window.NeftTheme = {
    get: function () {
      return root.dataset.theme === "dark" ? "dark" : "light";
    },
    set: function (t) {
      return apply(t, true);
    },
    toggle: function () {
      return apply(root.dataset.theme === "dark" ? "light" : "dark", true);
    },
  };
})();
