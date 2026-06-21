/*!
 * lesson-platform.js — Neft Lesson Platform · single loader / bootstrap.
 *
 * One <script src="/assets/lesson-platform.js" defer> per lesson pulls in and
 * boots the whole shared lesson-platform stack so individual lessons only carry
 * a single tag (mirrors how tools/inject-lesson-platform.js injects exactly one
 * css link + one script per page).
 *
 * What it does:
 *   - Dynamically ensures each layer's CSS/JS is present (injects <link>/<script>
 *     for the layers that ship assets) if not already loaded, so a single
 *     platform tag pulls everything. Missing layer files are tolerated — the
 *     loader never assumes a layer exists.
 *   - Boots the layers in a defined order, each wrapped in its own try/catch:
 *       1. NTtelemetry   (assets/lesson-telemetry.js)   — invisible, offline-first
 *       2. NTa11y        (assets/lesson-a11y.js)         — accessibility hardening
 *       3. NTAdaptive    (assets/adaptive-engine.js)     — mastery / re-teach
 *       4. NTJuice       (assets/lesson-juice.js)        — engagement / production
 *       5. NeftTutor     (assets/ai-tutor.js)            — Socratic AI tutor
 *     Each layer is self-booting + idempotent on its own; this loader only
 *     guarantees presence + ordering + a single safe failure boundary per layer.
 *
 * Hard rules: never throws into the host lesson (everything guarded + try/catch),
 * every DOM lookup is null-checked, idempotent (window sentinel), honors
 * prefers-reduced-motion and window.NT_MUTED implicitly (it adds no motion or
 * sound of its own; layers handle that). The only new global is
 * window.NeftLessonPlatform. Loads at most once per page.
 *
 * See docs/superpowers/specs/INTEGRATION-CONTRACT.md.
 */
(function () {
  "use strict";

  // Idempotent: load at most once per page.
  if (window.NeftLessonPlatform && window.NeftLessonPlatform.__loaded) return;

  var VERSION = "1.0.0";
  var BASE = "/assets/";

  // Layer manifest, in boot order. `global` is the window key each layer sets
  // when it has booted; `init` (optional) is a method to call after the script
  // is present (most layers auto-boot, so init is best-effort only).
  var LAYERS = [
    {
      name: "telemetry",
      js: "lesson-telemetry.js",
      css: null,
      global: "NTtelemetry",
    },
    { name: "a11y", js: "lesson-a11y.js", css: null, global: "NTa11y" },
    {
      name: "adaptive",
      js: "adaptive-engine.js",
      css: "adaptive-engine.css",
      global: "NTAdaptive",
    },
    {
      name: "juice",
      js: "lesson-juice.js",
      css: "lesson-juice.css",
      global: "NTJuice",
    },
    {
      name: "tutor",
      js: "ai-tutor.js",
      css: "ai-tutor.css",
      global: "NeftTutor",
    },
    {
      name: "focus",
      js: "lesson-focus.js",
      css: "lesson-focus.css",
      global: "NTFocus",
    },
    {
      name: "passport",
      js: "lesson-passport.js",
      css: "lesson-passport.css",
      global: "NTPassport",
    },
  ];

  function logWarn(msg, err) {
    try {
      if (window.console && console.warn) console.warn("[lesson-platform] " + msg, err || "");
    } catch (e) {
      /* ignore */
    }
  }

  // ---- asset presence helpers (all guarded, all no-throw) ----------------

  function hasLink(href) {
    try {
      var links = document.querySelectorAll('link[rel="stylesheet"]');
      for (var i = 0; i < links.length; i++) {
        var h = links[i].getAttribute("href") || "";
        if (h.indexOf(href) !== -1) return true;
      }
    } catch (e) {
      /* ignore */
    }
    return false;
  }

  function hasScript(src) {
    try {
      var scripts = document.querySelectorAll("script[src]");
      for (var i = 0; i < scripts.length; i++) {
        var s = scripts[i].getAttribute("src") || "";
        if (s.indexOf(src) !== -1) return true;
      }
    } catch (e) {
      /* ignore */
    }
    return false;
  }

  function ensureCss(file) {
    if (!file) return;
    try {
      var href = BASE + file;
      if (hasLink(file)) return;
      var head = document.head || document.getElementsByTagName("head")[0];
      if (!head) return;
      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      // A missing CSS file 404s harmlessly; do not block the lesson.
      link.onerror = function () {
        logWarn("optional stylesheet missing: " + href);
      };
      head.appendChild(link);
    } catch (e) {
      logWarn("ensureCss failed for " + file, e);
    }
  }

  // Returns a Promise that resolves once the script is present (loaded or
  // already on the page). Resolves even on load error so a missing layer never
  // stalls the chain.
  function ensureJs(file) {
    return new Promise(function (resolve) {
      try {
        var src = BASE + file;
        if (hasScript(file) || (window.__ntlpScriptsAdded && window.__ntlpScriptsAdded[file])) {
          resolve(true);
          return;
        }
        var head =
          document.head || document.getElementsByTagName("head")[0] || document.documentElement;
        if (!head) {
          resolve(false);
          return;
        }
        window.__ntlpScriptsAdded = window.__ntlpScriptsAdded || {};
        window.__ntlpScriptsAdded[file] = true;
        var s = document.createElement("script");
        s.src = src;
        // Not defer/async here: we control ordering via the Promise chain so the
        // global is present before we attempt to init the next layer.
        s.onload = function () {
          resolve(true);
        };
        s.onerror = function () {
          logWarn("layer script missing or failed: " + src);
          resolve(false);
        };
        head.appendChild(s);
      } catch (e) {
        logWarn("ensureJs failed for " + file, e);
        resolve(false);
      }
    });
  }

  // ---- boot a single layer (own try/catch boundary) ----------------------

  function bootLayer(layer) {
    try {
      ensureCss(layer.css);
    } catch (e) {
      logWarn("css for " + layer.name + " failed", e);
    }
    return ensureJs(layer.js)
      .then(function (present) {
        var status = { name: layer.name, present: !!present, booted: false };
        if (!present) return status;
        try {
          var g = window[layer.global];
          // Most layers auto-boot on load; if a layer exposes an idempotent
          // init() (e.g. NTJuice), calling it is safe and a no-op if already up.
          if (g && typeof g.init === "function") {
            try {
              g.init();
            } catch (e) {
              logWarn("init() threw for " + layer.name, e);
            }
          }
          status.booted = !!window[layer.global];
        } catch (e) {
          logWarn("boot for " + layer.name + " failed", e);
        }
        return status;
      })
      .catch(function (e) {
        logWarn("layer chain error for " + layer.name, e);
        return { name: layer.name, present: false, booted: false };
      });
  }

  // ---- run the whole stack in order --------------------------------------

  function run() {
    var results = [];
    // Sequential chain so each layer's global is available before the next
    // (e.g. NTAdaptive checks for NTtelemetry?.track).
    var chain = Promise.resolve();
    LAYERS.forEach(function (layer) {
      chain = chain.then(function () {
        return bootLayer(layer).then(function (status) {
          results.push(status);
        });
      });
    });
    return chain.then(function () {
      try {
        window.NeftLessonPlatform.layers = results;
      } catch (e) {
        /* ignore */
      }
      return results;
    });
  }

  function ready(fn) {
    try {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", fn, { once: true });
      } else {
        fn();
      }
    } catch (e) {
      // Last-ditch: try to run anyway.
      try {
        fn();
      } catch (e2) {
        /* give up silently — never break the lesson */
      }
    }
  }

  // Public, minimal API.
  window.NeftLessonPlatform = {
    __loaded: true,
    version: VERSION,
    layers: [],
    // Manual (re)boot hook; idempotent because each layer guards itself.
    boot: function () {
      try {
        return run();
      } catch (e) {
        logWarn("manual boot failed", e);
        return Promise.resolve([]);
      }
    },
  };

  ready(function () {
    try {
      run();
    } catch (e) {
      logWarn("auto boot failed", e);
    }
  });
})();
