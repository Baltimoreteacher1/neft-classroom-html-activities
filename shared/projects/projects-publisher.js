/* ==========================================================================
   Projects PUBLISHER — publisher-grade pedagogy layer for the unit
   culminating-project wizard pages. Companion to projects-publisher.css;
   same contract as the PRO / GOLD layers:

     • Only activates on <body class="pro-projects"> pages.
     • Purely additive and defensive: every feature is try/caught, every DOM
       lookup guarded; a missing element is a no-op, never a throw.
     • Idempotent: re-running (or double-injection) is a no-op.
     • Wraps — never replaces — the page's own globals, preserving behavior.

   Features:
     1. Sentence starters: every written-response <textarea> inside a
        .step-panel gets a "Need a starter?" chip row. Frames come from the
        page's ./publisher.json (keyed by textarea id) with generic academic-
        language fallbacks, so Level 1 students always have language support.
     2. Exemplar panel ("What strong work looks like"): rendered from
        ./publisher.json into the final step. Samples model the STRUCTURE of
        a great answer in a parallel scenario — never this project's numbers —
        so it scaffolds without giving anything away.
     3. Rubric self-assessment: the static rubric grows a "Rate My Work"
        panel — one rating row per criterion, keyboard/SR accessible,
        persisted per page in localStorage, with a live summary and a
        "my next improvement" goal box. buildReport() is wrapped so the
        student's self-assessment is appended to the printed/copied report.

   Injected by tools/inject-projects-publisher.mjs
   (sentinel: projects-publisher).
   ========================================================================== */
(function () {
  "use strict";

  if (typeof document === "undefined") return;

  var STORE_PREFIX = "nt-pub:";

  var GENERIC_STARTERS = [
    "I noticed that ___ because ___.",
    "My strategy was to ___ so that ___.",
    "This shows ___ , which means ___.",
  ];

  function storeKey(suffix) {
    var path = "";
    try {
      path = location.pathname || "";
    } catch (e) {}
    return STORE_PREFIX + path + ":" + suffix;
  }

  function readStore(suffix) {
    try {
      return localStorage.getItem(storeKey(suffix));
    } catch (e) {
      return null;
    }
  }

  function writeStore(suffix, value) {
    try {
      localStorage.setItem(storeKey(suffix), value);
    } catch (e) {}
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function init() {
    var body = document.body;
    if (!body || !body.classList.contains("pro-projects")) return;
    if (body.dataset.pubInit === "1") return; // idempotent
    body.dataset.pubInit = "1";

    var content = null;
    var apply = function () {
      try {
        buildStarters(content);
      } catch (e) {}
      try {
        buildExemplar(content);
      } catch (e) {}
      try {
        buildSelfAssessment();
      } catch (e) {}
      try {
        foldIntoReport();
      } catch (e) {}
    };

    // publisher.json lives next to each page; a 404 / file:// failure just
    // means generic starters and no exemplar — never an error.
    if (typeof fetch === "function") {
      fetch("./publisher.json", { cache: "no-cache" })
        .then(function (res) {
          return res && res.ok ? res.json() : null;
        })
        .then(function (json) {
          content = json && typeof json === "object" ? json : null;
        })
        .catch(function () {
          content = null;
        })
        .then(apply, apply);
    } else {
      apply();
    }
  }

  /* --- 1. Sentence starters on written-response boxes ---------------------- */
  function buildStarters(content) {
    var frames = (content && content.starters) || {};
    var areas = document.querySelectorAll(".step-panel textarea");
    areas.forEach(function (area) {
      if (area.dataset.pubStarters === "1") return;
      area.dataset.pubStarters = "1";

      var list = (area.id && frames[area.id]) || frames._default || GENERIC_STARTERS;
      if (!list || !list.length) return;

      var wrap = el("div", "pub-starters no-print");
      var label = el("span", "pub-starters-label", "Need a starter?");
      wrap.appendChild(label);

      list.slice(0, 3).forEach(function (frame) {
        var chip = el("button", "pub-chip", frame.replace(/___/g, "…"));
        chip.type = "button";
        chip.setAttribute("aria-label", "Insert sentence starter: " + frame);
        chip.addEventListener("click", function () {
          var starter = frame; // keep ___ blanks visible so students see where to write
          var current = area.value;
          area.value = current ? current.replace(/\s*$/, "\n") + starter : starter;
          area.focus();
          try {
            area.setSelectionRange(area.value.length, area.value.length);
          } catch (e) {}
          try {
            area.dispatchEvent(new Event("input", { bubbles: true }));
          } catch (e) {}
        });
        wrap.appendChild(chip);
      });

      if (area.parentNode) area.parentNode.insertBefore(wrap, area.nextSibling);
    });
  }

  /* --- 2. Exemplar: what strong work looks like ---------------------------- */
  function buildExemplar(content) {
    var ex = content && content.exemplar;
    if (!ex || !ex.traits || !ex.traits.length) return;
    if (document.querySelector(".pub-exemplar")) return;

    var rubric = document.querySelector("table.rubric");
    var host = rubric
      ? rubric.closest(".gold-scroll") || rubric
      : document.querySelector(".step-panel:last-of-type .card, .step-panel:last-of-type");
    if (!host || !host.parentNode) return;

    var details = el("details", "pub-exemplar");
    var summary = el("summary", "pub-exemplar-summary");
    summary.appendChild(el("span", "pub-exemplar-badge", "★"));
    summary.appendChild(el("span", null, ex.title || "What strong work looks like"));
    details.appendChild(summary);

    var inner = el("div", "pub-exemplar-body");
    if (ex.intro) inner.appendChild(el("p", "pub-exemplar-intro", ex.intro));

    ex.traits.forEach(function (t) {
      if (!t || !t.trait) return;
      var card = el("div", "pub-trait");
      card.appendChild(el("div", "pub-trait-name", t.trait));
      if (t.sample) {
        var q = el("blockquote", "pub-trait-sample");
        q.textContent = "“" + t.sample + "”";
        card.appendChild(q);
      }
      if (t.why) card.appendChild(el("div", "pub-trait-why", "Why it works: " + t.why));
      inner.appendChild(card);
    });

    inner.appendChild(
      el(
        "p",
        "pub-exemplar-note",
        "These samples come from a different project — borrow the moves, not the numbers.",
      ),
    );
    details.appendChild(inner);
    host.parentNode.insertBefore(details, host);
  }

  /* --- 3. Rubric self-assessment ------------------------------------------- */
  var RATING_LABELS = ["Getting started", "On my way", "Got it", "Teaching level"];

  function rubricCriteria() {
    var rubric = document.querySelector("table.rubric");
    if (!rubric) return [];
    var rows = rubric.querySelectorAll("tr");
    var out = [];
    rows.forEach(function (row) {
      var first = row.querySelector("td");
      if (!first) return; // header row
      var name = (first.textContent || "").trim();
      if (name) out.push(name);
    });
    return out;
  }

  function buildSelfAssessment() {
    var rubric = document.querySelector("table.rubric");
    if (!rubric || document.querySelector(".pub-selfassess")) return;
    var criteria = rubricCriteria();
    if (!criteria.length) return;

    var host = rubric.closest(".gold-scroll") || rubric;
    if (!host.parentNode) return;

    var saved = {};
    try {
      saved = JSON.parse(readStore("selfassess") || "{}") || {};
    } catch (e) {
      saved = {};
    }

    var panel = el("section", "pub-selfassess");
    panel.setAttribute("aria-label", "Rate my work self-assessment");
    panel.appendChild(el("h3", "pub-selfassess-title", "Rate My Work"));
    panel.appendChild(
      el(
        "p",
        "pub-selfassess-hint",
        "You get to grade your work first. Rate each row of the rubric honestly — then pick one thing to level up.",
      ),
    );

    var live = el("p", "pub-selfassess-summary");
    live.setAttribute("role", "status");
    live.setAttribute("aria-live", "polite");

    criteria.forEach(function (name, idx) {
      var row = el("div", "pub-sa-row");
      var label = el("span", "pub-sa-name", name);
      var group = el("div", "pub-sa-group");
      group.setAttribute("role", "group");
      group.setAttribute("aria-label", "Rating for " + name);

      RATING_LABELS.forEach(function (rating, r) {
        var btn = el("button", "pub-sa-btn", rating);
        btn.type = "button";
        btn.dataset.crit = String(idx);
        btn.dataset.val = String(r + 1);
        btn.setAttribute("aria-pressed", saved[idx] === r + 1 ? "true" : "false");
        if (saved[idx] === r + 1) btn.classList.add("active");
        btn.addEventListener("click", function () {
          saved[idx] = r + 1;
          group.querySelectorAll(".pub-sa-btn").forEach(function (b) {
            var on = b === btn;
            b.classList.toggle("active", on);
            b.setAttribute("aria-pressed", on ? "true" : "false");
          });
          writeStore("selfassess", JSON.stringify(saved));
          updateSummary();
        });
        group.appendChild(btn);
      });

      row.appendChild(label);
      row.appendChild(group);
      panel.appendChild(row);
    });

    var goalLabel = el(
      "label",
      "pub-sa-goal-label",
      "One thing I will improve before I turn this in:",
    );
    var goal = document.createElement("textarea");
    goal.className = "pub-sa-goal";
    goal.id = "pub-sa-goal";
    goal.rows = 2;
    goal.value = readStore("goal") || "";
    goalLabel.setAttribute("for", goal.id);
    goal.addEventListener("input", function () {
      writeStore("goal", goal.value);
    });

    panel.appendChild(live);
    panel.appendChild(goalLabel);
    panel.appendChild(goal);

    function updateSummary() {
      var rated = Object.keys(saved).length;
      if (!rated) {
        live.textContent = "";
        return;
      }
      var lowest = null;
      Object.keys(saved).forEach(function (k) {
        if (lowest === null || saved[k] < saved[lowest]) lowest = k;
      });
      var msg = "You rated " + rated + " of " + criteria.length + " rows.";
      if (lowest !== null && saved[lowest] < RATING_LABELS.length) {
        msg += " Growth spot: " + criteria[lowest] + ".";
      } else if (rated === criteria.length) {
        msg += " All at teaching level — make sure your evidence backs it up!";
      }
      live.textContent = msg;
    }
    updateSummary();

    host.parentNode.insertBefore(panel, host.nextSibling);
  }

  /* --- 4. Fold self-assessment into the student report --------------------- */
  function foldIntoReport() {
    if (typeof window.buildReport !== "function") return;
    var orig = window.buildReport;
    window.buildReport = function () {
      var out = orig.apply(this, arguments);
      try {
        var box = document.getElementById("reportBox");
        if (box && box.textContent && box.textContent.indexOf("SELF-ASSESSMENT") === -1) {
          var saved = {};
          try {
            saved = JSON.parse(readStore("selfassess") || "{}") || {};
          } catch (e) {}
          var criteria = rubricCriteria();
          var lines = [];
          criteria.forEach(function (name, idx) {
            if (saved[idx]) lines.push("  " + name + ": " + RATING_LABELS[saved[idx] - 1]);
          });
          var goal = readStore("goal") || "";
          if (lines.length || goal.trim()) {
            var block = "\n\nSELF-ASSESSMENT (Rate My Work)\n" + lines.join("\n");
            if (goal.trim()) block += "\n  My improvement goal: " + goal.trim();
            box.textContent += block;
          }
        }
      } catch (e) {}
      return out;
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
