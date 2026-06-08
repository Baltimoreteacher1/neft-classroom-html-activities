/**
 * Curriculum audit badges + filters (additive enhancement).
 * --------------------------------------------------------------------------
 * Loaded by curriculum/index.html alongside curriculum-enhancements.js. Fetches
 * the generated manifest (/data/curriculum-manifest.json) and, for each existing
 * lesson card, injects:
 *   - a small status badge strip (Ready / Needs Review / Missing, + ESOL)
 *   - Family / Student Help / Teacher Notes resource pills (the newly generated
 *     support pages), so they are discoverable from the hub.
 *   - a "Show only problems" toggle + status filter in the controls bar.
 *
 * Purely additive and idempotent: it never restructures or removes existing
 * card markup, only appends. If the manifest is missing it does nothing.
 */
(function () {
  "use strict";

  var MANIFEST_URL = "/data/curriculum-manifest.json";

  function lessonIdOf(card) {
    var ds = card.getAttribute("data-search") || "";
    return ds.split(/\s+/)[0] || "";
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function injectStyles() {
    if (document.getElementById("audit-badge-styles")) return;
    var css =
      ".audit-badges{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 0 22px;}" +
      ".audit-badge{font-size:11px;font-weight:700;border-radius:999px;padding:2px 9px;border:1px solid transparent;}" +
      ".audit-badge.ok{background:#e3f4ea;color:#1f7a44;border-color:#9ed8b6;}" +
      ".audit-badge.review{background:#fef0d8;color:#9a6b12;border-color:#f2c15b;}" +
      ".audit-badge.missing{background:#fde4e1;color:#a33124;border-color:#f0a89f;}" +
      ".audit-badge.info{background:#dff2ee;color:#1fa6a2;border-color:#1fa6a2;}" +
      ".audit-badge.gray{background:#eef2f6;color:#5f6f80;border-color:#d7e2ed;}" +
      ".res[data-audit-pill]{border-style:dashed;}" +
      ".audit-controls{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:0 0 8px;}" +
      ".audit-controls label{font-size:13.5px;color:#5f6f80;display:flex;align-items:center;gap:6px;}" +
      ".audit-controls select{min-height:40px;border:1px solid #d7e2ed;border-radius:8px;padding:0 8px;background:#fff;color:#21313f;}" +
      "body.audit-only-problems details.lesson:not([data-audit-status=problem]){display:none!important;}" +
      "body.audit-filter-ready details.lesson:not([data-audit-status=ready]){display:none!important;}" +
      "body.audit-filter-review details.lesson:not([data-audit-status=review]){display:none!important;}" +
      "body.audit-filter-missing details.lesson:not([data-audit-status=problem]){display:none!important;}";
    var s = el("style");
    s.id = "audit-badge-styles";
    s.textContent = css;
    document.head.appendChild(s);
  }

  function statusOf(entry) {
    var st = entry.status || {};
    if (st.needsReview) return "review";
    if (
      (st.missingResources && st.missingResources.length) ||
      (st.brokenLinks && st.brokenLinks.length)
    )
      return "missing";
    return "ready";
  }

  function badgeStrip(entry, status) {
    var wrap = el("div", "audit-badges");
    wrap.setAttribute("data-audit-strip", "1");
    if (status === "ready")
      wrap.appendChild(el("span", "audit-badge ok", "Ready"));
    else if (status === "review")
      wrap.appendChild(el("span", "audit-badge review", "Needs Review"));
    else
      wrap.appendChild(el("span", "audit-badge missing", "Missing Resource"));
    if (entry.supports && entry.supports.esol)
      wrap.appendChild(el("span", "audit-badge info", "ESOL Support"));
    var r = entry.resources || {};
    if (r.familyPage && r.familyPage.exists)
      wrap.appendChild(el("span", "audit-badge gray", "Family Page"));
    if (r.teacherNotes && r.teacherNotes.exists)
      wrap.appendChild(el("span", "audit-badge gray", "Teacher Notes"));
    return wrap;
  }

  function supportPill(label, href, teacherOnly) {
    var a = el("a", "res" + (teacherOnly ? " teacher-only" : ""), label);
    a.setAttribute("href", href);
    a.setAttribute("data-audit-pill", "1");
    return a;
  }

  function enhanceCard(card, entry) {
    var status = statusOf(entry);
    // problem = anything not fully ready, used by the "show only problems" filter.
    card.setAttribute(
      "data-audit-status",
      status === "ready" ? "ready" : status === "review" ? "review" : "problem",
    );

    var head = card.querySelector(".lesson-head");
    if (
      head &&
      head.parentNode &&
      !head.parentNode.querySelector("[data-audit-strip]")
    ) {
      head.parentNode.insertBefore(badgeStrip(entry, status), head.nextSibling);
    }

    var row = card.querySelector(".res-row");
    if (row && !row.querySelector("[data-audit-pill]")) {
      var r = entry.resources || {};
      if (r.familyPage && r.familyPage.exists)
        row.appendChild(
          supportPill("👪 Family Page", r.familyPage.path, false),
        );
      if (r.studentHelp && r.studentHelp.exists)
        row.appendChild(
          supportPill("🙋 Student Help", r.studentHelp.path, false),
        );
      if (r.teacherNotes && r.teacherNotes.exists)
        row.appendChild(
          supportPill("🧑‍🏫 Teacher Notes", r.teacherNotes.path, true),
        );
    }
  }

  function addControls(byId) {
    var controls = document.querySelector(".controls");
    if (!controls || document.querySelector(".audit-controls")) return;
    var bar = el("div", "audit-controls");

    var probLabel = el("label", null, "");
    var cb = el("input");
    cb.type = "checkbox";
    cb.id = "audit-only-problems";
    probLabel.appendChild(cb);
    probLabel.appendChild(document.createTextNode(" Show only problems"));
    cb.addEventListener("change", function () {
      document.body.classList.toggle("audit-only-problems", cb.checked);
    });

    var selLabel = el("label", null, "Status: ");
    var sel = el("select");
    [
      ["all", "All"],
      ["ready", "Ready"],
      ["review", "Needs Review"],
      ["missing", "Missing resources"],
    ].forEach(function (o) {
      var opt = el("option", null, o[1]);
      opt.value = o[0];
      sel.appendChild(opt);
    });
    sel.addEventListener("change", function () {
      var b = document.body;
      b.classList.remove(
        "audit-filter-ready",
        "audit-filter-review",
        "audit-filter-missing",
      );
      if (sel.value !== "all") b.classList.add("audit-filter-" + sel.value);
    });
    selLabel.appendChild(sel);

    bar.appendChild(probLabel);
    bar.appendChild(selLabel);
    controls.parentNode.insertBefore(bar, controls.nextSibling);
  }

  function run() {
    fetch(MANIFEST_URL)
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (manifest) {
        if (!manifest || !Array.isArray(manifest.lessons)) return;
        injectStyles();
        var byId = {};
        manifest.lessons.forEach(function (l) {
          byId[l.id] = l;
        });
        var cards = document.querySelectorAll("details.lesson");
        Array.prototype.forEach.call(cards, function (card) {
          var entry = byId[lessonIdOf(card)];
          if (entry) enhanceCard(card, entry);
        });
        addControls(byId);
      })
      .catch(function () {
        /* no-op: manifest unavailable, leave page untouched */
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      // Defer slightly so curriculum-enhancements.js finishes its first pass.
      setTimeout(run, 0);
    });
  } else {
    setTimeout(run, 0);
  }
})();
