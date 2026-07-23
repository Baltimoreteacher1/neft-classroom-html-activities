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
    "algebra-tiles": 1,
    "area-tiler": 1,
    balance: 1,
    "coord-plot": 1,
    "cube-builder": 1,
    "dot-plot": 1,
    "expr-machine": 1,
    "frac-divide": 1,
    "fraction-bar": 1,
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

  /* ------------------------------------------------------------------------
     Math Workspace

     Every project gets a local, student-owned Estimate → Model → Explain
     workspace in each step. It deliberately uses student-entered quantities
     rather than task data: the goal is sense-making and model rehearsal, not
     an answer key. Nothing leaves the browser.
     ------------------------------------------------------------------------ */
  function workspaceKey(index) {
    return "nt-project-workspace:" + location.pathname + ":" + index;
  }

  function readWorkspace(index) {
    try {
      return JSON.parse(localStorage.getItem(workspaceKey(index)) || "{}") || {};
    } catch (_e) {
      return {};
    }
  }

  function saveWorkspace(index, data) {
    try {
      localStorage.setItem(workspaceKey(index), JSON.stringify(data));
    } catch (_e) {
      /* private mode / full storage: the workspace remains usable */
    }
  }

  function workspaceField(type, name, value) {
    var input = document.createElement("input");
    input.type = type;
    input.name = name;
    input.value = value || "";
    input.className = "mw-input";
    if (type === "number") {
      input.step = "any";
      input.inputMode = "decimal";
      input.min = "-1000000000";
      input.max = "1000000000";
    }
    return input;
  }

  function workspaceLabel(en, es, control) {
    var label = document.createElement("label");
    label.className = "mw-label";
    label.appendChild(biText("span", "mw-label-text", en, es));
    label.appendChild(control);
    return label;
  }

  function operationSelect(value) {
    var select = document.createElement("select");
    select.name = "op";
    select.className = "mw-input";
    [
      ["add", "+", "+"],
      ["subtract", "−", "−"],
      ["multiply", "×", "×"],
      ["divide", "÷", "÷"],
      ["percent", "% of", "% de"],
    ].forEach(function (item) {
      var option = document.createElement("option");
      option.value = item[0];
      option.textContent = item[1];
      option.dataset.es = item[2];
      if (item[0] === value) option.selected = true;
      select.appendChild(option);
    });
    return select;
  }

  function formatNumber(value) {
    return Math.abs(value) >= 1000 || Number.isInteger(value)
      ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
      : value.toLocaleString(undefined, { maximumFractionDigits: 3 });
  }

  function calculate(a, op, b) {
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
    if (op === "add") return a + b;
    if (op === "subtract") return a - b;
    if (op === "multiply") return a * b;
    if (op === "divide") return b === 0 ? null : a / b;
    if (op === "percent") return (a / 100) * b;
    return null;
  }

  function mountWorkspace(panel, index) {
    if (panel.querySelector(".mw-card")) return;
    var saved = readWorkspace(index);
    var card = document.createElement("details");
    card.className = "mw-card";
    card.open = saved.open === true;

    var summary = document.createElement("summary");
    summary.className = "mw-summary";
    summary.appendChild(biText("span", "mw-kicker", "Math Workspace", "Espacio matemático"));
    summary.appendChild(
      biText("strong", "mw-title", "Estimate → Model → Explain", "Estima → Modela → Explica"),
    );
    card.appendChild(summary);

    var body = document.createElement("div");
    body.className = "mw-body";
    body.appendChild(
      biText(
        "p",
        "mw-intro",
        "Try your own quantities here. This is a private practice space, not the project answer.",
        "Prueba aquí tus propias cantidades. Este es un espacio privado para practicar, no la respuesta del proyecto.",
      ),
    );

    var grid = document.createElement("div");
    grid.className = "mw-grid";
    var estimate = workspaceField("number", "estimate", saved.estimate);
    var quantityA = workspaceField("number", "a", saved.a);
    var operation = operationSelect(saved.op || "multiply");
    var quantityB = workspaceField("number", "b", saved.b);
    var unit = workspaceField("text", "unit", saved.unit);
    unit.placeholder = "items, dollars, miles…";
    grid.appendChild(workspaceLabel("My estimate", "Mi estimación", estimate));
    grid.appendChild(workspaceLabel("Quantity A", "Cantidad A", quantityA));
    grid.appendChild(workspaceLabel("Operation", "Operación", operation));
    grid.appendChild(workspaceLabel("Quantity B", "Cantidad B", quantityB));
    grid.appendChild(workspaceLabel("Unit or label", "Unidad o etiqueta", unit));
    body.appendChild(grid);

    var result = document.createElement("div");
    result.className = "mw-result";
    result.setAttribute("aria-live", "polite");
    body.appendChild(result);

    var explain = document.createElement("textarea");
    explain.name = "explain";
    explain.className = "mw-explain";
    explain.rows = 2;
    explain.value = saved.explain || "";
    explain.placeholder = "What does this result mean in this situation?";
    body.appendChild(
      workspaceLabel(
        "Explain what the result means",
        "Explica lo que significa el resultado",
        explain,
      ),
    );
    card.appendChild(body);

    function refresh() {
      var a = Number(quantityA.value);
      var b = Number(quantityB.value);
      var answer = calculate(a, operation.value, b);
      var estimateValue = Number(estimate.value);
      var opSymbol = operation.options[operation.selectedIndex].textContent;
      var suffix = unit.value.trim() ? " " + unit.value.trim() : "";
      if (!quantityA.value || !quantityB.value) {
        result.innerHTML =
          "<strong>" +
          (document.querySelector("#body.es")
            ? "Escribe dos cantidades para crear un modelo."
            : "Enter two quantities to build a model.") +
          "</strong>";
      } else if (answer === null) {
        result.innerHTML =
          "<strong>" +
          (operation.value === "divide" && b === 0
            ? document.querySelector("#body.es")
              ? "No se puede dividir entre cero. Cambia la segunda cantidad."
              : "You cannot divide by zero. Change Quantity B."
            : document.querySelector("#body.es")
              ? "Usa números válidos para crear un modelo."
              : "Use valid numbers to build a model.") +
          "</strong>";
      } else {
        var equation =
          formatNumber(a) +
          " " +
          opSymbol +
          " " +
          formatNumber(b) +
          " = " +
          formatNumber(answer) +
          suffix;
        var check = "";
        if (estimate.value && Number.isFinite(estimateValue)) {
          var difference = Math.abs(estimateValue - answer);
          var percent = answer === 0 ? null : Math.round((difference / Math.abs(answer)) * 100);
          check =
            "<small>" +
            (document.querySelector("#body.es")
              ? "Tu estimación difiere por "
              : "Your estimate differs by ") +
            formatNumber(difference) +
            suffix +
            (percent === null ? "." : " (" + percent + "%).") +
            "</small>";
        }
        result.innerHTML =
          '<span class="mw-result-label">' +
          (document.querySelector("#body.es") ? "Mi modelo" : "My model") +
          "</span><strong>" +
          equation +
          "</strong>" +
          check;
      }
      saveWorkspace(index, {
        open: card.open,
        estimate: estimate.value,
        a: quantityA.value,
        op: operation.value,
        b: quantityB.value,
        unit: unit.value,
        explain: explain.value,
      });
    }

    [estimate, quantityA, operation, quantityB, unit, explain].forEach(function (field) {
      field.addEventListener("input", refresh);
      field.addEventListener("change", refresh);
    });
    card.addEventListener("toggle", refresh);
    refresh();
    panel.appendChild(card);
  }

  function mountWorkspaces() {
    Array.prototype.forEach.call(document.querySelectorAll(".step-panel"), function (panel, index) {
      try {
        mountWorkspace(panel, index + 1);
      } catch (_e) {
        /* a workspace never blocks the project step */
      }
    });
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
      mountWorkspaces();
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
            } catch (_e) {
              /* one bad tool never blocks the rest */
            }
          });
          Object.keys(needed).forEach(loadWidget);
        })
        .catch(function () {
          /* no visuals.json for this page — fine */
        });
    } catch (_e) {
      /* never break the page */
    }
  });
})();
