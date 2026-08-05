/* =============================================================================
 * curriculum-ready-next.js — DAG-driven readiness chips on the curriculum hub.
 *
 * Joins the Curriculum Nervous System prerequisite graph
 * (/data/curriculum-nervous-system.json) with this device's local progress
 * (localStorage "curriculumProgress", same store the progress checkboxes use)
 * to tell the student, per selected lesson:
 *
 *   ✅ "You're ready for this lesson"      — every prerequisite standard has
 *                                            been worked on on this device
 *   🧭 "Warm up first: <lesson link>"      — a prerequisite standard has no
 *                                            recorded work; link to the first
 *                                            lesson that teaches it
 *
 * Additive and fail-silent by design: if either JSON fails to load, if a
 * standard doesn't resolve to a graph node, or if the hub API is absent, the
 * hub renders exactly as before with no chip. Reads localStorage only — no
 * identity, no network writes, student-safe in both modes.
 * ========================================================================== */
(function () {
  "use strict";

  var GRAPH_URL = "/data/curriculum-nervous-system.json";
  var MANIFEST_URL = "/data/curriculum-manifest.json";
  var STORAGE_PROGRESS = "curriculumProgress";

  var graph = null;
  var aliasToNode = null; // normalized/aliased standard id -> graph node
  var lessonStandard = null; // lesson id -> raw standard code
  var lessonsByStandard = null; // node id -> [{id, title, path}] ordered by unit/lesson
  var hubApi = null;

  function loadJson(url) {
    return fetch(url, { credentials: "same-origin" }).then(function (r) {
      if (!r.ok) throw new Error(url + " " + r.status);
      return r.json();
    });
  }

  function readProgress() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_PROGRESS) || "{}") || {};
    } catch (_e) {
      return {};
    }
  }

  /** Lesson ids with at least one checked-off activity on this device. */
  function startedLessonIds() {
    var progress = readProgress();
    var started = {};
    Object.keys(progress).forEach(function (key) {
      if (!progress[key]) return;
      var id = key.split("::")[0];
      if (id) started[id] = true;
    });
    return started;
  }

  function nodeForStandard(code) {
    if (!code || !aliasToNode) return null;
    return aliasToNode[String(code).trim()] || null;
  }

  /** Standards covered = any lesson teaching them has recorded work. */
  function coveredStandards() {
    var started = startedLessonIds();
    var covered = {};
    Object.keys(lessonStandard).forEach(function (lessonId) {
      var isStarted =
        started[lessonId] ||
        started[lessonId + "-flagship"] ||
        Object.keys(started).some(function (s) {
          return s === lessonId || s.indexOf(lessonId + "-") === 0;
        });
      if (!isStarted) return;
      var node = nodeForStandard(lessonStandard[lessonId]);
      if (node) covered[node.id] = true;
    });
    return covered;
  }

  function chipFor(lessonId) {
    if (!graph || !lessonId) return null;
    var baseId = lessonId.replace("-flagship", "");
    var node = nodeForStandard(lessonStandard[baseId] || lessonStandard[lessonId]);
    if (!node || !Array.isArray(node.prereqs) || !node.prereqs.length) return null;

    var covered = coveredStandards();
    var started = startedLessonIds();
    if (started[lessonId] || started[baseId]) return null; // already working on it

    var unmet = node.prereqs.filter(function (pre) {
      return !covered[pre] && (lessonsByStandard[pre] || []).length > 0;
    });

    if (!unmet.length) {
      return {
        kind: "ready",
        html:
          '<span class="nt-ready-ico" aria-hidden="true">✅</span> ' +
          "You’re ready for this lesson — every skill it builds on has work recorded.",
      };
    }
    var pre = unmet[0];
    var preNode = aliasToNode[pre];
    var target = lessonsByStandard[pre][0];
    return {
      kind: "review",
      html:
        '<span class="nt-ready-ico" aria-hidden="true">🧭</span> ' +
        "Warm up first: <strong>" +
        escapeHtml(preNode && preNode.shortLabel ? preNode.shortLabel : pre) +
        '</strong> — try <a href="' +
        escapeHtml(target.path) +
        '">' +
        escapeHtml(target.title) +
        "</a>",
    };
  }

  function escapeHtml(text) {
    var div = document.createElement("div");
    div.textContent = String(text == null ? "" : text);
    return div.innerHTML;
  }

  function injectStyle() {
    if (document.getElementById("nt-ready-next-style")) return;
    var style = document.createElement("style");
    style.id = "nt-ready-next-style";
    style.textContent =
      ".nt-ready-chip{display:flex;gap:8px;align-items:flex-start;margin:8px 0;padding:9px 12px;" +
      "border-radius:10px;font-size:14px;line-height:1.45}" +
      ".nt-ready-chip a{font-weight:600;text-decoration:underline}" +
      ".nt-ready-chip.nt-ready{background:#e8f7ee;border:1px solid #b7e4c7;color:#14532d}" +
      ".nt-ready-chip.nt-review{background:#fff7e6;border:1px solid #fde3a7;color:#7c4a03}" +
      ".nt-ready-chip.nt-review a{color:#7c4a03}";
    document.head.appendChild(style);
  }

  function decorateCard(card, unit) {
    var lessonSelect = card.querySelector(".lesson-select");
    var infoBlock = card.querySelector(".lesson-info");
    if (!lessonSelect || !infoBlock) return;
    var lesson = unit.lessons[parseInt(lessonSelect.value, 10) || 0];
    var existing = infoBlock.querySelector(".nt-ready-chip");
    var chip = lesson ? chipFor(lesson.lessonId || "") : null;
    if (!chip) {
      if (existing) existing.remove();
      return;
    }
    var cls = "nt-ready-chip " + (chip.kind === "ready" ? "nt-ready" : "nt-review");
    if (existing && existing.className === cls && existing.innerHTML === chip.html) return;
    var el = existing || document.createElement("div");
    el.className = cls;
    el.innerHTML = chip.html;
    if (!existing) {
      var obj = infoBlock.querySelector(".lesson-info-obj");
      if (obj && obj.parentNode) obj.parentNode.insertBefore(el, obj);
      else infoBlock.insertBefore(el, infoBlock.firstChild);
    }
  }

  function unitForCard(card) {
    // The hub renders cards in several layouts (grid, single-card detail
    // mode), so index pairing is unreliable — read the card's own "Unit N"
    // label and match it against unitsData.
    var numEl = card.querySelector(".unit-card-num");
    var text = numEl ? numEl.textContent : "";
    var m = /Unit\s+(\d+)/i.exec(text || "");
    if (!m) return null;
    var wanted = m[1];
    var units = hubApi.unitsData || [];
    for (var i = 0; i < units.length; i++) {
      var um = /Unit\s+(\d+)/i.exec(units[i].num || "");
      if (um && um[1] === wanted) return units[i];
    }
    return null;
  }

  function decorateAll() {
    if (!hubApi || !hubApi.hubEl || !graph || !lessonStandard) return;
    var cards = hubApi.hubEl.querySelectorAll(".unit-card");
    cards.forEach(function (card) {
      var unit = unitForCard(card);
      if (unit) decorateCard(card, unit);
    });
  }

  function start() {
    injectStyle();
    var timer = null;
    var observer = new MutationObserver(function () {
      if (timer) return;
      timer = setTimeout(function () {
        timer = null;
        decorateAll();
      }, 200);
    });
    observer.observe(hubApi.hubEl, { childList: true, subtree: true });
    // Progress toggled in another tab (or by the checkboxes, which write the
    // same store) should refresh readiness.
    window.addEventListener("storage", function (e) {
      if (e.key === STORAGE_PROGRESS) decorateAll();
    });
    decorateAll();
  }

  function waitForHub(tries) {
    hubApi = window.CurriculumHub;
    if (hubApi && hubApi.hubEl) {
      start();
      return;
    }
    if (tries < 50) setTimeout(waitForHub.bind(null, tries + 1), 120);
  }

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  ready(function () {
    Promise.all([loadJson(GRAPH_URL), loadJson(MANIFEST_URL)])
      .then(function (results) {
        graph = results[0];
        var manifest = results[1];
        aliasToNode = {};
        (graph.nodes || []).forEach(function (node) {
          aliasToNode[node.id] = node;
          (node.aliases || []).forEach(function (a) {
            aliasToNode[a] = node;
          });
          (node.oldIds || []).forEach(function (a) {
            aliasToNode[a] = node;
          });
        });
        lessonStandard = {};
        lessonsByStandard = {};
        (manifest.lessons || [])
          .filter(function (l) {
            return l.status !== "hidden";
          })
          .sort(function (a, b) {
            return a.unit - b.unit || a.lesson - b.lesson;
          })
          .forEach(function (l) {
            lessonStandard[l.id] = l.standard;
            var node = nodeForStandard(l.standard);
            if (!node) return;
            (lessonsByStandard[node.id] = lessonsByStandard[node.id] || []).push({
              id: l.id,
              title: l.title,
              path: l.lessonPath || "/lessons/" + l.id + "/",
            });
          });
        waitForHub(0);
      })
      .catch(function () {
        /* fail silent: the hub is complete without readiness chips */
      });
  });
})();
