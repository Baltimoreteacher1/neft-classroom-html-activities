/**
 * Curriculum audit badges + filters (additive enhancement).
 * --------------------------------------------------------------------------
 * Loaded by curriculum/index.html alongside curriculum-enhancements.js. Fetches
 * the generated manifest (/data/curriculum-manifest.json) and, for each existing
 * lesson card, injects:
 *   - a small status badge strip (Ready / Needs Review / Missing, + Level 1)
 *   - Family / Student Help / Teacher Notes resource pills (the newly generated
 *     support pages), so they are discoverable from the hub.
 *   - a teacher-only "Lesson status" filter in the controls bar.
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
      ".audit-badge{font-size:13px;font-weight:700;border-radius:999px;padding:2px 10px;border:1px solid transparent;line-height:1.5;}" +
      ".audit-badge.ok{background:#e3f4ea;color:#1f7a44;border-color:#9ed8b6;}" +
      ".audit-badge.review{background:#fef0d8;color:#9a6b12;border-color:#f2c15b;}" +
      ".audit-badge.missing{background:#fde4e1;color:#a33124;border-color:#f0a89f;}" +
      ".audit-badge.info{background:#dff2ee;color:#0f6b67;border-color:#5fbdb7;}" +
      ".audit-badge.gray{background:#eef2f6;color:#5f6f80;border-color:#d7e2ed;}" +
      ".res[data-audit-pill]{border-style:dashed;}" +
      ".audit-controls{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:0 0 8px;}" +
      ".audit-controls label{font-size:13.5px;color:#5f6f80;display:flex;align-items:center;gap:6px;}" +
      ".audit-controls select{min-height:40px;border:1px solid #d7e2ed;border-radius:8px;padding:0 8px;background:#fff;color:#21313f;}" +
      "body.audit-filter-attention details.lesson[data-audit-status=ready]{display:none!important;}" +
      "body.audit-filter-ready details.lesson:not([data-audit-status=ready]){display:none!important;}" +
      "body.audit-filter-review details.lesson:not([data-audit-status=review]){display:none!important;}" +
      "body.audit-filter-missing details.lesson:not([data-audit-status=problem]){display:none!important;}" +
      // The static details.lesson list above is hidden on screen (the unit rail
      // replaced it), so every rule above only ever affects the print view.
      // These mirror them onto the VISIBLE hub items, which is where a teacher
      // actually reads and filters them. The strip itself is rendered ONCE per
      // lesson (see lessonStrip), never per resource.
      ".audit-badges--lesson{margin:0 0 14px;}" +
      ".units-lesson-heading + .audit-badges--lesson{margin:-8px 24px 16px;}" +
      ".search-result-item .audit-badges--lesson{margin:0 0 10px;}" +
      "@media (max-width:780px){.units-lesson-heading + .audit-badges--lesson{margin-inline:20px;}}" +
      "body.audit-filter-attention .lesson-outline-item[data-audit-status=ready]{display:none!important;}" +
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

  /**
   * The full strip, used on the hidden print list. `compact` drops the chips
   * that only restate links already in the lesson's resource list (Family
   * Page, Teacher Notes, Digital + print) and the standard, which the card
   * shows as its own badge — on screen those read as noise, not information.
   */
  function badgeStrip(entry, status, compact) {
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
    if (entry.timeEstimate) wrap.appendChild(el("span", "audit-badge gray", entry.timeEstimate));
    if (compact) return wrap;
    var r = entry.resources || {};
    if (entry.standard) wrap.appendChild(el("span", "audit-badge gray", entry.standard));
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
    // problem = missing resources; the "Lesson status" filter reads these values.
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
        row.appendChild(supportPill("Family Page", r.familyPage.path, false));
      if (r.studentHelp && r.studentHelp.exists)
        row.appendChild(supportPill("Student Help", r.studentHelp.path, false));
      if (r.teacherNotes && r.teacherNotes.exists)
        row.appendChild(supportPill("Teacher Notes", r.teacherNotes.path, true));
    }
  }

  /** "/lessons/6-13/" -> "1-1", the manifest key. */
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
      if (item.hasAttribute("data-audit-status")) return;
      var link = item.querySelector("a[href*='/lessons/']");
      var entry = link && byId[lessonIdFromHref(link.getAttribute("href"))];
      if (!entry) return;
      var status = statusOf(entry);
      item.setAttribute("data-quality-source", "curriculum-manifest");
      item.setAttribute(
        "data-audit-status",
        status === "ready" ? "ready" : status === "review" ? "review" : "problem",
      );
      n += 1;
    });
    var containers = document.querySelectorAll(
      "#interactive-hub .unit-card, #interactive-hub .search-result-item",
    );
    Array.prototype.forEach.call(containers, function (container) {
      lessonStrip(container, byId);
    });
    return n;
  }

  /**
   * One strip per rendered lesson. Every resource row of a lesson shares the
   * same status, support level and time, so stamping the strip on each row
   * repeated ~7 chips a dozen times per lesson and squeezed the links into
   * narrow columns. The strip now sits under the lesson title and is replaced
   * when the card switches lesson.
   */
  function lessonStrip(container, byId) {
    var outline = container.querySelector(".lesson-outline-list");
    var link = outline && outline.querySelector(".lesson-outline-item a[href*='/lessons/']");
    var id = link ? lessonIdFromHref(link.getAttribute("href")) : "";
    var entry = id && byId[id];
    var existing = container.querySelector(
      ":scope > [data-audit-strip], :scope > * > [data-audit-strip]",
    );
    if (!entry) {
      if (existing && existing.classList.contains("audit-badges--lesson")) existing.remove();
      return;
    }
    if (existing && existing.getAttribute("data-audit-lesson") === id) return;
    if (existing && existing.classList.contains("audit-badges--lesson")) existing.remove();
    var strip = badgeStrip(entry, statusOf(entry), true);
    strip.className += " audit-badges--lesson hub-teacher-only";
    strip.setAttribute("data-audit-lesson", id);
    var anchor =
      container.querySelector(".units-lesson-heading") ||
      container.querySelector(".search-result-header");
    if (anchor) anchor.insertAdjacentElement("afterend", strip);
    else outline.parentNode.insertBefore(strip, outline);
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

    // One labelled control. It drives the lesson finder (which listens for
    // ewl:audit-filter) and, through the body classes, the printed list.
    var selLabel = el("label", null, "Lesson status");
    selLabel.setAttribute("for", "audit-status-filter");
    var sel = el("select");
    sel.id = "audit-status-filter";
    [
      ["all", "All lessons"],
      ["attention", "Needs attention"],
      ["ready", "Ready"],
      ["review", "Needs review"],
      ["missing", "Missing resources"],
    ].forEach(function (o) {
      var opt = el("option", null, o[1]);
      opt.value = o[0];
      sel.appendChild(opt);
    });
    sel.addEventListener("change", function () {
      var b = document.body;
      b.classList.remove(
        "audit-filter-attention",
        "audit-filter-ready",
        "audit-filter-review",
        "audit-filter-missing",
      );
      if (sel.value !== "all") b.classList.add("audit-filter-" + sel.value);
      if (sel.value === "all") delete b.dataset.auditFilter;
      else b.dataset.auditFilter = sel.value;
      document.dispatchEvent(new CustomEvent("ewl:audit-filter"));
    });

    bar.appendChild(selLabel);
    bar.appendChild(sel);
    controls.parentNode.insertBefore(bar, controls.nextSibling);
  }

  // Routed through /assets/curriculum-json-cache.js so the hub fetches each
  // data file once instead of once per feature script. A missing manifest still
  // resolves to null, which the next step treats as "render no badges".
  function loadManifest() {
    var cache = window.NTJsonCache;
    if (cache) {
      return cache.json(MANIFEST_URL).catch(function () {
        return null;
      });
    }
    return fetch(MANIFEST_URL).then(function (r) {
      return r.ok ? r.json() : null;
    });
  }

  function run() {
    loadManifest()
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
