// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
/* ==========================================================================
   Neft Teacher — Projects DISCOURSE layer (shared)

   Two additive, config-driven pieces for the unit culminating-project wizards:

   C2 · TURN & TALK — one collapsed discourse prompt per step panel, matching
        the lesson engine's pedagogy (engine/core/discourse.js): a rigorous
        "explain / compare / convince" question plus bilingual sentence
        starters. Rendered as a collapsed pill at the FOOT of the step (just
        before .nav-row), so it can never push the math work below the fold.

   C3 · STRUCTURED PEER COMPARISON — upgrades the unstructured "interview a
        classmate" step in place. Adds sentence frames, NAMED capture fields
        for the partner's values, and an explicit compare-and-justify prompt
        ("Whose unit rate is the better deal? Prove it with numbers."). The
        page's own partner inputs are left completely alone (Save/Resume owns
        them); the new fields persist under `nt-project-peer:<pathname>` and
        are appended to the printed report via the universal `buildReport`
        hook.

   Config lives beside the check layer in
   /shared/projects/projects-check-config.json:
       pages["<pathname>"].steps["step-N"].talk   → { question, stems, probe }
       pages["<pathname>"].peer                   → { step, capture, compare }
   Both fall back to sensible generated defaults, so an unconfigured page still
   gets a usable Turn & Talk.

   Gated on <body class="pro-projects">. Idempotent. No existing id is renamed.
   Injected by tools/inject-projects-discourse.mjs.
   ========================================================================== */
(function () {
  "use strict";
  if (typeof document === "undefined") return;

  var CONFIG_URL = "/shared/projects/projects-check-config.json";
  var PEER_KEY_PREFIX = "nt-project-peer:";

  function ready(fn) {
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function bi(en, es) {
    return (
      '<span class="en-text">' +
      esc(en) +
      "</span>" +
      '<span class="es-text">' +
      esc(es) +
      "</span>"
    );
  }

  function pagePath() {
    var p = location.pathname.replace(/index\.html?$/i, "");
    if (p.charAt(p.length - 1) !== "/") p += "/";
    return p;
  }

  function peerKey() {
    return PEER_KEY_PREFIX + pagePath();
  }

  function stepTitle(panel) {
    var h = panel.querySelector(".card-title, h2, h3");
    if (!h) return "";
    var en = h.querySelector(".en-text");
    return ((en || h).textContent || "").replace(/\s+/g, " ").trim();
  }

  /* ---------- Turn & Talk ------------------------------------------------ */

  // Mirrors engine/core/discourse.js DEFAULT_STEMS.
  var DEFAULT_STEMS = [
    { en: "I think ___ because ___.", es: "Pienso que ___ porque ___." },
    { en: "My strategy was ___.", es: "Mi estrategia fue ___." },
    {
      en: "I agree / disagree because ___.",
      es: "Estoy de acuerdo / en desacuerdo porque ___.",
    },
  ];

  // Mirrors engine/core/discourse.js PROBE_QUESTIONS (reciprocal questioning).
  var PROBES = [
    { en: "How do you know?", es: "¿Cómo lo sabes?" },
    { en: "Why does that work?", es: "¿Por qué funciona eso?" },
    { en: "Can you show me another way?", es: "¿Puedes mostrarme otra forma?" },
    { en: "What if the numbers changed?", es: "¿Y si cambiaran los números?" },
    {
      en: "Where could someone go wrong?",
      es: "¿Dónde podría equivocarse alguien?",
    },
  ];

  // Stable, non-random fallback prompts (deterministic hash on the step title).
  var FALLBACK_QUESTIONS = [
    {
      en: "Explain to your partner HOW you got your numbers on this step — then have them explain theirs.",
      es: "Explícale a tu compañero CÓMO obtuviste tus números en este paso, y luego escucha los suyos.",
    },
    {
      en: "Compare one number you wrote on this step with your partner's. Why are they different? Does that make sense?",
      es: "Compara un número que escribiste en este paso con el de tu compañero. ¿Por qué son diferentes? ¿Tiene sentido?",
    },
    {
      en: "Convince your partner that your answer on this step is reasonable. Use the numbers, not just the words.",
      es: "Convence a tu compañero de que tu respuesta en este paso es razonable. Usa los números, no solo las palabras.",
    },
    {
      en: "What is one mistake someone could make on this step — and how would you catch it?",
      es: "¿Qué error podría cometer alguien en este paso, y cómo lo detectarías?",
    },
  ];

  function hashKey(s) {
    var h = 0;
    var str = String(s || "step");
    for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return h;
  }

  function buildTalk(panel, talkCfg) {
    if (panel.querySelector(".ntt-talk")) return false;

    var title = stepTitle(panel);
    var q =
      talkCfg && talkCfg.question && talkCfg.question.en
        ? talkCfg.question
        : FALLBACK_QUESTIONS[hashKey(title) % FALLBACK_QUESTIONS.length];
    var stems =
      talkCfg && Array.isArray(talkCfg.stems) && talkCfg.stems.length
        ? talkCfg.stems
        : DEFAULT_STEMS;
    var probe = PROBES[hashKey(title + "|probe") % PROBES.length];

    var wrap = document.createElement("div");
    wrap.className = "ntt-talk no-print";

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ntt-trigger";
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML =
      '<span aria-hidden="true">💬</span> ' +
      bi("Turn & Talk", "Comenta con un compañero") +
      ' <span class="ntt-caret" aria-hidden="true">▸</span>';

    var body = document.createElement("div");
    body.className = "ntt-body";
    body.hidden = true;

    var html = '<p class="ntt-q">' + bi(q.en, q.es || q.en) + "</p>";
    html += '<p class="ntt-sub">' + bi("Sentence starters", "Frases para empezar") + "</p><ul>";
    stems.forEach(function (s) {
      html += "<li>" + bi(s.en || "", s.es || s.en || "") + "</li>";
    });
    html += "</ul>";
    html +=
      '<p class="ntt-probe"><strong>' +
      bi("Then ask your partner:", "Después pregúntale a tu compañero:") +
      "</strong> " +
      bi(probe.en, probe.es) +
      "</p>";
    body.innerHTML = html;

    btn.addEventListener("click", function () {
      var open = body.hidden;
      body.hidden = !open;
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      wrap.classList.toggle("is-open", open);
    });

    wrap.appendChild(btn);
    wrap.appendChild(body);

    var nav = panel.querySelector(".nav-row");
    if (nav && nav.parentNode === panel) panel.insertBefore(wrap, nav);
    else panel.appendChild(wrap);
    return true;
  }

  /* ---------- Structured peer comparison --------------------------------- */

  var DEFAULT_FRAMES = [
    {
      en: "My ___ is ___, and my partner's ___ is ___.",
      es: "Mi ___ es ___, y el/la ___ de mi compañero es ___.",
    },
    {
      en: "That means ___ is the better deal, because ___.",
      es: "Eso significa que ___ es la mejor opción, porque ___.",
    },
    {
      en: "I can prove it with numbers: ___ compared to ___.",
      es: "Puedo probarlo con números: ___ comparado con ___.",
    },
  ];

  var DEFAULT_COMPARE = {
    en: "Whose numbers are the better deal? Prove it with numbers, not opinions.",
    es: "¿Los números de quién son la mejor opción? Pruébalo con números, no con opiniones.",
  };

  function loadPeer() {
    try {
      var raw = localStorage.getItem(peerKey());
      return raw ? JSON.parse(raw) || {} : {};
    } catch (_e) {
      return {};
    }
  }

  function savePeer(data) {
    try {
      localStorage.setItem(peerKey(), JSON.stringify(data));
    } catch (_e) {
      /* storage full / disabled — the UI still works for this session */
    }
  }

  function buildPeer(panel, peerCfg) {
    if (panel.querySelector(".ntp-peer")) return false;

    var capture = (peerCfg && peerCfg.capture) || [];
    var frames =
      peerCfg && Array.isArray(peerCfg.frames) && peerCfg.frames.length
        ? peerCfg.frames
        : DEFAULT_FRAMES;
    var compare = (peerCfg && peerCfg.compare) || DEFAULT_COMPARE;
    var stored = loadPeer();

    var wrap = document.createElement("section");
    wrap.className = "ntp-peer";
    wrap.setAttribute("aria-labelledby", "ntp-peer-h");

    var head =
      '<h3 class="ntp-h" id="ntp-peer-h"><span aria-hidden="true">🤝</span> ' +
      bi("Structured partner compare", "Comparación estructurada con tu compañero") +
      "</h3>";

    var intro =
      '<p class="ntp-intro">' +
      bi(
        "Ask your partner for each number below and write it down. Then answer the compare question with numbers.",
        "Pídele a tu compañero cada número de abajo y anótalo. Después responde la pregunta de comparación con números.",
      ) +
      "</p>";

    var fieldsHtml = '<div class="ntp-grid">';
    capture.forEach(function (c) {
      var id = "ntp-" + c.id;
      var type = c.type === "text" ? "text" : "number";
      fieldsHtml +=
        '<div class="ntp-field"><label class="lbl" for="' +
        esc(id) +
        '">' +
        bi(c.label && c.label.en ? c.label.en : c.id, c.label && c.label.es ? c.label.es : c.id) +
        "</label>" +
        '<input type="' +
        type +
        '" id="' +
        esc(id) +
        '" data-ntp-id="' +
        esc(c.id) +
        '" value="' +
        esc(stored[c.id] == null ? "" : stored[c.id]) +
        '"' +
        (type === "number" ? ' step="any"' : "") +
        " /></div>";
    });
    fieldsHtml += "</div>";

    var framesHtml =
      '<p class="ntp-sub">' + bi("Sentence frames", "Frases para comparar") + "</p><ul>";
    frames.forEach(function (f) {
      framesHtml += "<li>" + bi(f.en || "", f.es || f.en || "") + "</li>";
    });
    framesHtml += "</ul>";

    var proveId = "ntp-justify";
    var proveHtml =
      '<p class="ntp-q">' +
      bi(compare.en, compare.es || compare.en) +
      "</p>" +
      '<label class="lbl" for="' +
      proveId +
      '">' +
      bi("Prove it with numbers", "Pruébalo con números") +
      "</label>" +
      '<textarea id="' +
      proveId +
      '" rows="3" data-ntp-id="justify">' +
      esc(stored.justify || "") +
      "</textarea>";

    wrap.innerHTML = head + intro + fieldsHtml + framesHtml + proveHtml;

    wrap.addEventListener("input", function (ev) {
      var t = ev.target;
      if (!t || !t.getAttribute) return;
      var id = t.getAttribute("data-ntp-id");
      if (!id) return;
      var data = loadPeer();
      data[id] = t.value;
      savePeer(data);
    });

    var nav = panel.querySelector(".nav-row");
    if (nav && nav.parentNode === panel) panel.insertBefore(wrap, nav);
    else panel.appendChild(wrap);
    return true;
  }

  /* Append the peer-compare capture to the printed report. `buildReport` is the
     one hook present on all 23 pages; wrap it rather than replacing it. */
  function hookReport(peerCfg) {
    if (typeof window.buildReport !== "function") return;
    if (window.buildReport.__ntPeerWrapped) return;
    var original = window.buildReport;
    var wrapped = function () {
      var out = original.apply(this, arguments);
      try {
        var box = document.getElementById("reportBox");
        if (!box) return out;
        var data = loadPeer();
        var lines = [];
        ((peerCfg && peerCfg.capture) || []).forEach(function (c) {
          var v = data[c.id];
          if (v == null || String(v).trim() === "") return;
          var label = c.label && c.label.en ? c.label.en : c.id;
          lines.push("  " + label + ": " + v);
        });
        if (data.justify && String(data.justify).trim()) {
          lines.push("  Prove it with numbers: " + String(data.justify).trim());
        }
        if (!lines.length) return out;
        var block = "\n\nPARTNER COMPARE\n" + lines.join("\n") + "\n";
        if (box.textContent.indexOf("PARTNER COMPARE") === -1) box.textContent += block;
      } catch (_e) {
        /* never block the report */
      }
      return out;
    };
    wrapped.__ntPeerWrapped = true;
    window.buildReport = wrapped;
  }

  /* ---------- boot -------------------------------------------------------- */

  function mount(cfg) {
    var page = ((cfg && cfg.pages) || {})[pagePath()] || {};
    var steps = page.steps || {};
    var panels = document.querySelectorAll(".step-panel[id^='step-']");
    var talks = 0;

    Array.prototype.forEach.call(panels, function (panel) {
      // Step 1 is the vocabulary/launch card and the last step is
      // finish-and-submit — discourse belongs on the working steps.
      var hasWork = panel.querySelector("input, textarea, select");
      var isFinish = !!panel.querySelector("#checklist, .rubric");
      if (!hasWork || isFinish) return;
      var stepCfg = steps[panel.id] || {};
      if (stepCfg.talk === false) return;
      if (buildTalk(panel, stepCfg.talk)) talks++;
    });

    var peerCfg = page.peer;
    if (peerCfg && peerCfg.step) {
      var peerPanel = document.getElementById(peerCfg.step);
      if (peerPanel && peerPanel.classList.contains("step-panel")) {
        buildPeer(peerPanel, peerCfg);
        hookReport(peerCfg);
      }
    }
    return talks;
  }

  function run() {
    if (!document.body || !document.body.classList.contains("pro-projects")) return;
    if (document.body.dataset.ntDiscourseInit === "1") return;
    document.body.dataset.ntDiscourseInit = "1";
    fetch(CONFIG_URL, { credentials: "same-origin" })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (cfg) {
        mount(cfg || {});
      })
      .catch(function () {
        mount({});
      });
  }

  ready(run);
  window.NTDiscourse = { run: run, peerKey: peerKey, load: loadPeer };
})();
