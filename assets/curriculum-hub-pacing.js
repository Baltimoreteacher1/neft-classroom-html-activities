/* Curriculum Hub — extracted from curriculum/index.html.
 * Loaded with defer at the same document position: defer scripts execute
 * after parsing in document order, so this keeps its relative order with
 * the other hub scripts and still runs before /assets/curriculum-*.js.
 * Keep the ?v= stamp in the hub in sync with this file's content hash;
 * tools/curriculum-hub-assets.test.mjs enforces that.
 */
// Pacing & Scope Map (#2) + Close the Loop (#4). Self-contained,
// ES5, no build step: both read the static curriculum DOM and the
// per-device NTSignal store already loaded on this page.
(function () {
  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function stdFromSearch(ds) {
    var s = String(ds || "");
    var m = s.match(/6\.[a-z]{1,4}\.[0-9]+[a-z]?/i) || s.match(/6\.[a-z]{1,4}/i);
    return m ? m[0].toUpperCase() : "";
  }
  // Canonical standard→asset map (same source Resource Finder
  // uses). Keyed by the curriculum's own MCCRS codes, which is
  // what NTSignal records — so loop coverage matches real signals
  // (the DOM's data-search carries CCSS aliases and can't be
  // trusted for this). Loaded once, degrades gracefully offline.
  var _mapPromise = null;
  function loadMap() {
    if (_mapPromise) return _mapPromise;
    _mapPromise = fetch("/data/asset-concept-map.json", {
      credentials: "same-origin",
    })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (j) {
        var byStd = {};
        var lessonStd = {};
        var bs = (j && j.byStandard) || {};
        Object.keys(bs).forEach(function (code) {
          var e = bs[code];
          byStd[String(code).toUpperCase()] = e;
          (e.assets || []).forEach(function (a) {
            if (a.category === "Lesson" && a.path && !lessonStd[a.path]) {
              lessonStd[a.path] = { standard: e.standard, label: e.label || "" };
            }
          });
        });
        return { byStd: byStd, lessonStd: lessonStd, ok: !!j };
      })
      .catch(function () {
        return { byStd: {}, lessonStd: {}, ok: false };
      });
    return _mapPromise;
  }

  // Build the core lesson spine once, from the hub's canonical
  // scrape (window.NTHubUnits) — the static details.unit DOM is
  // consumed by the hub render, so we reuse its result rather than
  // re-scraping. Dedupes base/flagship, keeps only real lesson
  // slots (/lessons/<n>-<n>/), skips End-of-Unit + variant rows.
  var _spine = null;
  function spine() {
    if (_spine) return _spine;
    var src = window.NTHubUnits || [];
    var units = [];
    src.forEach(function (u) {
      var seen = {};
      var lessons = [];
      (u.lessons || []).forEach(function (l) {
        if (l.isEndOfUnit) return;
        var id = String(l.lessonId || "");
        var base = id.replace(/-(?:group[12]|flagship)$/i, "");
        if (!/^\d+-\d+$/.test(base) || seen[base]) return;
        var ds = String(l.dataSearch || "");
        if (/\b(small group|catch-?up|reteach|intervention)\b/i.test(ds)) return;
        seen[base] = 1;
        lessons.push({
          id: base,
          href: "/lessons/" + base + "/",
          title: (l.title || "Lesson " + base).replace(/\s+/g, " ").trim(),
          obj: (l.objective || "").replace(/\s+/g, " ").trim(),
          standard: stdFromSearch(ds),
        });
      });
      if (lessons.length) units.push({ num: u.num || "", name: u.name || "", lessons: lessons });
    });
    _spine = units;
    return units;
  }

  function renderPacing(host) {
    var units = spine();
    if (!units.length) {
      host.innerHTML = '<p class="mf-empty">Curriculum data is not available on this page.</p>';
      return;
    }
    host.innerHTML = '<p class="mf-empty">Building the pacing map…</p>';
    loadMap().then(function (m) {
      // Prefer the canonical standard for this lesson path; fall
      // back to the code scraped from the hub (CCSS alias) offline.
      function stdFor(l) {
        var c = m.lessonStd[l.href];
        return (c && c.standard) || l.standard || "";
      }
      var DPW = 5;
      var day = 0;
      var totalLessons = 0;
      var rows = [];
      units.forEach(function (u) {
        var startDay = day + 1;
        var n = u.lessons.length;
        day += n; // one instructional day per lesson
        day += 1; // + end-of-unit assessment / project day
        totalLessons += n;
        var startWeek = Math.ceil(startDay / DPW);
        var endWeek = Math.ceil(day / DPW);
        var stds = {};
        u.lessons.forEach(function (l) {
          var s = stdFor(l);
          if (s) stds[s] = 1;
        });
        var stdCount = Object.keys(stds).length;
        var EXTENSION_LESSONS = {
          "2-11": 1, "2-12": 1,
          "3-8": 1, "3-9": 1, "3-10": 1,
          "5-9": 1, "5-10": 1,
          "6-9": 1, "6-10": 1, "6-11": 1, "6-12": 1, "6-13": 1, "6-14": 1, "6-15": 1,
          "7-8": 1, "7-9": 1,
          "8-6": 1, "8-7": 1
        };
        var det = u.lessons
          .map(function (l, i) {
            var s = stdFor(l);
            var isExt = EXTENSION_LESSONS[l.id];
            var isProbe = l.id === "2-8" || l.id === "5-8" || l.id === "7-7";
            var badge = isExt
              ? ' <span class="pace-badge pace-ext">🚀 Extension</span>'
              : ' <span class="pace-badge pace-core">📌 Core Pacing</span>';
            var probeHtml = isProbe
              ? '<div class="pace-probe-callout">🧪 <strong>Formative Math Probe</strong> — Administer 0.5-day diagnostic probe before progressing</div>'
              : '';
            return (
              '<li><span class="pace-day">Day ' +
              (startDay + i) +
              '</span><a href="' +
              esc(l.href) +
              '" target="_blank" rel="noopener">' +
              esc(l.title) +
              "</a>" +
              badge +
              (s ? ' <span class="pace-std">' + esc(s) + "</span>" : "") +
              (l.obj ? '<span class="pace-obj">' + esc(l.obj) + "</span>" : "") +
              probeHtml +
              "</li>"
            );
          })
          .join("");
        rows.push(
          '<details class="pace-unit"><summary>' +
            '<span class="pace-wk">Weeks ' +
            startWeek +
            "–" +
            endWeek +
            '</span><span class="pace-unum">' +
            esc(u.num) +
            '</span><span class="pace-uname">' +
            esc(u.name) +
            '</span><span class="pace-count">' +
            n +
            " lessons · " +
            stdCount +
            ' standards</span></summary><ul class="pace-list">' +
            det +
            "</ul></details>",
        );
      });
      var weeks = Math.ceil(day / DPW);
      host.innerHTML =
        '<p class="pace-summary"><strong>' +
        units.length +
        " units · " +
        totalLessons +
        " lessons · ≈" +
        day +
        " instructional days (" +
        weeks +
        " weeks)</strong> " +
        '<span class="pace-note">against a typical 36-week (180-day) year</span></p>' +
        '<div class="pace-units">' +
        rows.join("") +
        "</div>";
    });
  }

  function renderLoop(host) {
    var NT = window.NTSignal;
    var weak = NT && typeof NT.weakStandards === "function" ? NT.weakStandards(6) : [];
    if (!weak || !weak.length) {
      host.innerHTML =
        '<p class="mf-empty">No class learning signals on this device yet. Signals build as students work lessons here — or open the full class diagnosis in Insight Brief.</p>' +
        '<div class="mf-actions"><a class="mf-btn solid" href="/teacher-tools/insight-brief/">Open Insight Brief</a></div>';
      return;
    }
    host.innerHTML = '<p class="mf-empty">Matching signals to lessons…</p>';
    loadMap().then(function (m) {
      // Best reteach target for a standard: a Lesson, else its Get
      // Ready readiness, else the first tagged asset.
      function pickLesson(assets) {
        var i;
        for (i = 0; i < assets.length; i++) if (assets[i].category === "Lesson") return assets[i];
        for (i = 0; i < assets.length; i++)
          if (assets[i].category === "Readiness") return assets[i];
        return assets.length ? assets[0] : null;
      }
      var rows = weak
        .map(function (w) {
          var pct = Math.round((Number(w.rate) || 0) * 100);
          var entry = m.byStd[String(w.standard).toUpperCase()];
          var assets = (entry && entry.assets) || [];
          var lesson = pickLesson(assets);
          var lessonCount = 0;
          assets.forEach(function (a) {
            if (a.category === "Lesson") lessonCount++;
          });
          var label =
            entry && entry.label ? ' <span class="loop-label">' + esc(entry.label) + "</span>" : "";
          var next = lesson
            ? 'Reteach → <a href="' +
              esc(lesson.path) +
              '" target="_blank" rel="noopener">' +
              esc(lesson.title) +
              "</a>" +
              (lessonCount > 1
                ? ' <span class="loop-more">+' + (lessonCount - 1) + " more</span>"
                : "")
            : '<span class="loop-none">No lesson tagged — open Resource Finder</span>';
          var rf =
            '<a class="loop-find" href="/teacher-tools/resource-finder/?standard=' +
            encodeURIComponent(w.standard) +
            '">all resources</a>';
          var cls = pct < 50 ? "is-low" : pct < 75 ? "is-mid" : "is-ok";
          return (
            '<div class="loop-row ' +
            cls +
            '"><div class="loop-sig"><span class="loop-std">' +
            esc(w.standard) +
            "</span>" +
            label +
            '<span class="loop-rate">' +
            pct +
            "% mastery <em>(" +
            (Number(w.correct) || 0) +
            "/" +
            (Number(w.attempts) || 0) +
            ')</em></span></div><div class="loop-arrow" aria-hidden="true">→</div><div class="loop-act">' +
            next +
            " " +
            rf +
            "</div></div>"
          );
        })
        .join("");
      host.innerHTML =
        '<p class="loop-lead">Weakest standards on this device → the exact lesson to reteach.</p>' +
        '<div class="loop-rows">' +
        rows +
        '</div><p class="pace-note">Device-local signal · full class diagnosis in <a href="/teacher-tools/insight-brief/">Insight Brief</a>.</p>';
    });
  }

  function wire(btnId, panelId, render) {
    var btn = document.getElementById(btnId);
    var panel = document.getElementById(panelId);
    if (!btn || !panel) return;
    var built = false;
    btn.addEventListener("click", function () {
      var opening = panel.hasAttribute("hidden");
      if (opening) {
        if (!built) {
          render(panel);
          built = true;
        }
        panel.removeAttribute("hidden");
        btn.setAttribute("aria-expanded", "true");
        btn.textContent = btn.getAttribute("data-close") || "Hide";
      } else {
        panel.setAttribute("hidden", "");
        btn.setAttribute("aria-expanded", "false");
        btn.textContent = btn.getAttribute("data-open") || "Open";
      }
    });
  }

  ready(function () {
    wire("pace-toggle", "pace-panel", renderPacing);
    wire("loop-toggle", "loop-panel", renderLoop);
  });
})();
