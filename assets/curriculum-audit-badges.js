/**
 * Curriculum audit badges + filters (additive enhancement).
 * --------------------------------------------------------------------------
 * Loaded by curriculum/index.html alongside curriculum-enhancements.js. Fetches
 * the generated manifest (/data/curriculum-manifest.json) and, for each existing
 * lesson card, injects:
 *   - a small status badge strip (Ready / Needs Review / Missing, + Level 1)
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
      "body.audit-filter-missing details.lesson:not([data-audit-status=problem]){display:none!important;}" +
      // The static details.lesson list above is hidden on screen (the unit rail
      // replaced it), so every rule above only ever affects the print view.
      // These mirror them onto the VISIBLE hub items, which is where a teacher
      // actually reads and filters them.
      ".lesson-outline-item .audit-badges{margin:4px 0 0;}" +
      "body.audit-only-problems .lesson-outline-item:not([data-audit-status=problem]){display:none!important;}" +
      "body.audit-filter-ready .lesson-outline-item:not([data-audit-status=ready]){display:none!important;}" +
      "body.audit-filter-review .lesson-outline-item:not([data-audit-status=review]){display:none!important;}" +
      "body.audit-filter-missing .lesson-outline-item:not([data-audit-status=problem]){display:none!important;}";
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
    if (status === "ready") wrap.appendChild(el("span", "audit-badge ok", "Ready"));
    else if (status === "review")
      wrap.appendChild(el("span", "audit-badge review", "Needs Review"));
    else wrap.appendChild(el("span", "audit-badge missing", "Missing Resource"));
    // Visible label is "Level 1 Support" -- the site does not surface "ESOL" to
    // students or teachers. The manifest key stays `supports.esol` because it
    // is the published data contract; only the rendered text changes.
    if (entry.supports && entry.supports.esol)
      wrap.appendChild(el("span", "audit-badge info", "Level 1 Support"));
    var r = entry.resources || {};
    if (entry.standard) wrap.appendChild(el("span", "audit-badge gray", entry.standard));
    if (entry.timeEstimate) wrap.appendChild(el("span", "audit-badge gray", entry.timeEstimate));
    if (r.lesson?.exists && (r.guidedNotes?.exists || r.handout?.exists))
      wrap.appendChild(el("span", "audit-badge gray", "Digital + print"));
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
    card.setAttribute("data-quality-source", "curriculum-manifest");
    // problem = anything not fully ready, used by the "show only problems" filter.
    card.setAttribute(
      "data-audit-status",
      status === "ready" ? "ready" : status === "review" ? "review" : "problem",
    );

    var head = card.querySelector(".lesson-head");
    if (head && head.parentNode && !head.parentNode.querySelector("[data-audit-strip]")) {
      head.parentNode.insertBefore(badgeStrip(entry, status), head.nextSibling);
    }

    var row = card.querySelector(".res-row");
    if (row && !row.querySelector("[data-audit-pill]")) {
      var r = entry.resources || {};
      if (r.familyPage && r.familyPage.exists)
        row.appendChild(supportPill("👪 Family Page", r.familyPage.path, false));
      if (r.studentHelp && r.studentHelp.exists)
        row.appendChild(supportPill("🙋 Student Help", r.studentHelp.path, false));
      if (r.teacherNotes && r.teacherNotes.exists)
        row.appendChild(supportPill("🧑‍🏫 Teacher Notes", r.teacherNotes.path, true));
    }
  }

  /** "/lessons/1-1/" -> "1-1", the manifest key. */
  function lessonIdFromHref(href) {
    var m = /\/lessons\/([^/?#]+)/.exec(href || "");
    return m ? m[1] : "";
  }

  /**
   * Decorate the VISIBLE hub. curriculum-sidebar.js re-renders .unit-card on
   * every rail click, so this runs again on each mutation; it is idempotent via
   * the [data-audit-strip] check. Ready/Needs Review/Missing is curriculum QA,
   * not something a student should read, so each strip carries hub-teacher-only
   * — curriculum-top1.css hides that outside body.teacher-mode.
   */
  function enhanceHubItems(byId) {
    var items = document.querySelectorAll("#interactive-hub .lesson-outline-item");
    var n = 0;
    Array.prototype.forEach.call(items, function (item) {
      if (item.querySelector("[data-audit-strip]")) return;
      var link = item.querySelector("a[href*='/lessons/']");
      var entry = link && byId[lessonIdFromHref(link.getAttribute("href"))];
      if (!entry) return;
      var status = statusOf(entry);
      item.setAttribute("data-quality-source", "curriculum-manifest");
      item.setAttribute(
        "data-audit-status",
        status === "ready" ? "ready" : status === "review" ? "review" : "problem",
      );
      var strip = badgeStrip(entry, status);
      strip.className += " hub-teacher-only";
      item.appendChild(strip);
      n += 1;
    });
    return n;
  }

  function watchHub(byId) {
    enhanceHubItems(byId);
    var scheduled = false;
    var observer = new MutationObserver(function () {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(function () {
        scheduled = false;
        enhanceHubItems(byId);
      });
    });
    // Never disconnect: the rail rebuilds the cards for the whole session.
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function addControls(_byId) {
    var controls = document.querySelector(".controls");
    if (!controls || document.querySelector(".audit-controls")) return;
    // Teacher-only: these filter curriculum-QA status. Before this they were
    // injected ungated AND filtered only the hidden static list, so every
    // visitor — students included — saw two controls that did nothing.
    var bar = el("div", "audit-controls hub-teacher-only");

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
      b.classList.remove("audit-filter-ready", "audit-filter-review", "audit-filter-missing");
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
        // The static list is hidden on screen but still prints, so keep
        // decorating it — badges are genuinely useful in the print view.
        var cards = document.querySelectorAll("details.lesson");
        Array.prototype.forEach.call(cards, function (card) {
          var entry = byId[lessonIdOf(card)];
          if (entry) enhanceCard(card, entry);
        });
        watchHub(byId);
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
