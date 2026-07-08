/* ==========================================================================
   Projects VISUALS — mounts interactive math manipulatives into the unit
   culminating-project wizard pages. Companion to projects-visuals.css;
   same contract as the PRO / GOLD / PUBLISHER layers:

     • Only activates on <body class="pro-projects"> pages.
     • Purely additive and defensive: every feature is try/caught, every DOM
       lookup guarded; a missing element or config is a no-op, never a throw.
     • Idempotent: re-running (or double-injection) is a no-op.
     • Never touches the page's own globals or inputs.

   How it works: fetches the page's ./visuals.json —

     { "version": 1,
       "tools": [ { "step": "step-2", "manip": "ratio-build",
                    "title": { "en": "…", "es": "…" },
                    "why":   { "en": "…", "es": "…" },
                    "data":  { "label-a": "cups of mango", … } } ] }

   — then, per tool, builds a bilingual "Try It" card holding a
   <div class="pki-manip" data-manip="…"> container and inserts it into the
   named step panel just above the step's nav buttons. Finally it lazy-loads
   the matching shared/projects/manip-<name>.js widgets (each is
   self-initializing and scans for its own containers on load, with a 900ms
   rescan safety net). 404 / missing visuals.json → silent no-op.

   Injected by tools/inject-projects-visuals.mjs (sentinel: projects-visuals).
   ========================================================================== */
(function () {
  "use strict";

  if (typeof document === "undefined") return;

  /* Whitelist — only these shared widgets may be loaded. */
  var MANIPS = {
    "area-tiler": 1,
    balance: 1,
    "coord-plot": 1,
    "cube-builder": 1,
    "dot-plot": 1,
    "expr-machine": 1,
    "frac-divide": 1,
    "gcf-bags": 1,
    "line-grapher": 1,
    "number-line": 1,
    "percent-bar": 1,
    "ratio-build": 1,
  };

  var COPY = {
    badge: { en: "Try it — no grade", es: "Pruébalo — sin nota" },
    title: { en: "Math Tool: See It, Then Solve It", es: "Herramienta: Míralo y resuélvelo" },
    why: {
      en: "Play with the numbers here first, then use what you see to answer this step with your own numbers.",
      es: "Primero juega con los números aquí; luego usa lo que ves para responder este paso con tus propios números.",
    },
  };

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  function biText(tag, className, en, es) {
    var el = document.createElement(tag);
    el.className = className;
    var s1 = document.createElement("span");
    s1.className = "en-text";
    s1.textContent = en;
    var s2 = document.createElement("span");
    s2.className = "es-text";
    s2.textContent = es;
    el.appendChild(s1);
    el.appendChild(s2);
    return el;
  }

  function pick(obj, fallback, lang) {
    if (obj && typeof obj[lang] === "string" && obj[lang]) return obj[lang];
    return fallback[lang];
  }

  function mountTool(tool) {
    if (!tool || typeof tool.manip !== "string" || !MANIPS[tool.manip]) return false;
    var panel = typeof tool.step === "string" ? document.getElementById(tool.step) : null;
    if (!panel || !panel.classList.contains("step-panel")) return false;
    if (panel.querySelector('.viz-card .pki-manip[data-manip="' + tool.manip + '"]')) return false;

    var card = document.createElement("section");
    card.className = "viz-card";
    card.setAttribute("aria-label", "Interactive math tool");

    var head = document.createElement("div");
    head.className = "viz-head";
    var icon = document.createElement("span");
    icon.className = "viz-icon";
    icon.textContent = "🧮";
    icon.setAttribute("aria-hidden", "true");
    head.appendChild(icon);
    head.appendChild(
      biText(
        "h3",
        "viz-title",
        pick(tool.title, COPY.title, "en"),
        pick(tool.title, COPY.title, "es"),
      ),
    );
    head.appendChild(biText("span", "viz-badge", COPY.badge.en, COPY.badge.es));
    card.appendChild(head);

    card.appendChild(
      biText("p", "viz-why", pick(tool.why, COPY.why, "en"), pick(tool.why, COPY.why, "es")),
    );

    var holder = document.createElement("div");
    holder.className = "pki-manip";
    holder.setAttribute("data-manip", tool.manip);
    var data = tool.data && typeof tool.data === "object" ? tool.data : {};
    Object.keys(data).forEach(function (key) {
      if (/^[a-z][a-z0-9-]*$/.test(key)) {
        holder.setAttribute("data-" + key, String(data[key]));
      }
    });
    card.appendChild(holder);

    /* Insert above the step's nav-button row so "Next Step" stays last. */
    var navRow = null;
    var kids = panel.children;
    for (var i = kids.length - 1; i >= 0; i--) {
      if (kids[i].querySelector && kids[i].querySelector(".nav-btn")) {
        navRow = kids[i];
        break;
      }
    }
    if (navRow) {
      panel.insertBefore(card, navRow);
    } else {
      panel.appendChild(card);
    }
    return true;
  }

  function loadWidget(manip) {
    var src = "/shared/projects/manip-" + manip + ".js";
    if (document.querySelector('script[src="' + src + '"]')) return;
    var s = document.createElement("script");
    s.src = src;
    s.defer = true;
    document.body.appendChild(s);
  }

  ready(function () {
    try {
      var body = document.body;
      if (!body || !body.classList.contains("pro-projects")) return;
      if (body.dataset.vizInit === "1") return;
      body.dataset.vizInit = "1";
      if (typeof fetch !== "function") return;

      fetch("./visuals.json", { cache: "no-cache" })
        .then(function (res) {
          return res && res.ok ? res.json() : null;
        })
        .then(function (cfg) {
          if (!cfg || !Array.isArray(cfg.tools) || !cfg.tools.length) return;
          var needed = {};
          cfg.tools.forEach(function (tool) {
            try {
              if (mountTool(tool)) needed[tool.manip] = 1;
            } catch (e) {
              /* one bad tool never blocks the rest */
            }
          });
          Object.keys(needed).forEach(loadWidget);
        })
        .catch(function () {
          /* no visuals.json for this page — fine */
        });
    } catch (e) {
      /* never break the page */
    }
  });
})();
