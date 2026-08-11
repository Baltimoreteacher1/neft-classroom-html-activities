/* Studio Journey — the curriculum hub's first-90-seconds hook.
 *
 * Renders (1) a "continue where you left off" chip above the interactive hub
 * and (2) a per-unit progress strip on every unit card, lighting the three
 * pillars: lessons completed, small-group studio sessions, Go Deeper wins, and
 * culminating-project evidence. Growth-only display — empty states invite,
 * nothing is ever shown as missing or failed.
 *
 * Additive + idempotent doctrine: reads existing local signals only
 * (curriculumProgress, nt-sg:*, nt-godeeper:*, nt-community-math-studio:v1:*,
 * nt-journey-last), no-ops silently when the hub markup is absent, and never
 * blocks or reorders anything the inline hub script rendered.
 */
(function () {
  "use strict";
  if (typeof document === "undefined") return;

  var MANIFEST_URL = "/data/curriculum-launch-manifest.json";
  var PROJECT_PREFIX = "nt-community-math-studio:v1:";

  function readJson(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || null;
    } catch (_error) {
      return null;
    }
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Word-boundary match for a lesson id inside arbitrary progress keys —
  // substring alone would light "1-1" for "1-10".
  function keyMatchesLesson(key, id) {
    var index = key.indexOf(id);
    while (index !== -1) {
      var before = index === 0 ? "" : key[index - 1];
      var after = index + id.length >= key.length ? "" : key[index + id.length];
      if (!/[0-9]/.test(before) && !/[0-9]/.test(after)) return true;
      index = key.indexOf(id, index + 1);
    }
    return false;
  }

  function collectSignals(manifest) {
    var progress = readJson("curriculumProgress") || {};
    var progressKeys = Object.keys(progress).filter(function (key) {
      return !!progress[key];
    });
    var units = {};
    function unitBucket(unit) {
      var key = String(unit);
      if (!units[key]) {
        units[key] = { lessonsDone: 0, lessonsTotal: 0, studio: 0, deeper: 0, project: false };
      }
      return units[key];
    }

    (manifest.lessons || []).forEach(function (lesson) {
      var bucket = unitBucket(lesson.unit);
      bucket.lessonsTotal += 1;
      var done = progressKeys.some(function (key) {
        return keyMatchesLesson(key, lesson.id);
      });
      if (!done && readJson("nt-sg:" + lesson.id)) done = true;
      if (done) bucket.lessonsDone += 1;
      if (readJson("nt-godeeper:" + lesson.id) && readJson("nt-godeeper:" + lesson.id).done) {
        bucket.deeper += 1;
      }
    });

    (manifest.smallGroups || []).forEach(function (session) {
      var bucket = unitBucket(session.unit);
      var record = readJson("nt-sg:" + session.id);
      if (record && (record.checkSolved || record.reflectDone || record.buildDone)) {
        bucket.studio += 1;
      }
      var deeper = readJson("nt-godeeper:" + session.id);
      if (deeper && deeper.done) bucket.deeper += 1;
    });

    for (var index = 0; index < localStorage.length; index += 1) {
      var storageKey = localStorage.key(index) || "";
      if (storageKey.indexOf(PROJECT_PREFIX) !== 0) continue;
      var match = storageKey.match(/\/math\/(unit-(\d+)|statistics)\/projects\//);
      if (!match) continue;
      var unitId = match[2] ? match[2] : "statistics";
      unitBucket(unitId).project = true;
    }
    return units;
  }

  function pill(lit, emoji, text, labelEn, labelEs) {
    return (
      '<span class="ntj-pill" data-lit="' +
      (lit ? "true" : "false") +
      '" role="listitem" aria-label="' +
      esc(labelEn + " / " + labelEs) +
      '"><span aria-hidden="true">' +
      emoji +
      "</span>" +
      esc(text) +
      "</span>"
    );
  }

  function stripFor(stats) {
    if (!stats) stats = { lessonsDone: 0, lessonsTotal: 0, studio: 0, deeper: 0, project: false };
    var started = stats.lessonsDone || stats.studio || stats.deeper || stats.project;
    var html = '<div class="ntj-strip" role="list" aria-label="Studio Journey / Tu recorrido">';
    html += pill(
      stats.lessonsDone > 0,
      "📘",
      "Lessons " + stats.lessonsDone + "/" + stats.lessonsTotal,
      stats.lessonsDone + " of " + stats.lessonsTotal + " lessons explored",
      stats.lessonsDone + " de " + stats.lessonsTotal + " lecciones exploradas",
    );
    html += pill(
      stats.studio > 0,
      "🧑‍🤝‍🧑",
      "Studio " + stats.studio,
      stats.studio + " small-group studio sessions",
      stats.studio + " sesiones de grupo pequeño",
    );
    html += pill(
      stats.deeper > 0,
      "🚀",
      "Deeper " + stats.deeper,
      stats.deeper + " Go Deeper challenges complete",
      stats.deeper + " retos completados",
    );
    html += pill(
      stats.project,
      "🏛️",
      stats.project ? "Project ✓" : "Project",
      stats.project ? "Culminating project started" : "Culminating project awaits",
      stats.project ? "Proyecto final iniciado" : "El proyecto final te espera",
    );
    if (stats.lessonsTotal > 0 && stats.lessonsDone >= stats.lessonsTotal && stats.project) {
      html += '<span class="ntj-pill ntj-complete" role="listitem">🎉 Unit gallery complete</span>';
    }
    html += "</div>";
    if (!started) {
      html +=
        '<p class="ntj-invite">Start your gallery — every lesson adds a piece.' +
        '<span class="ntj-es" lang="es">Empieza tu galería — cada lección añade una pieza.</span></p>';
    }
    return html;
  }

  function unitKeyForCard(card) {
    var numNode = card.querySelector(".unit-card-num");
    if (!numNode) return null;
    var text = (numNode.textContent || "").trim();
    var match = text.match(/(\d+)/);
    if (match) return match[1];
    if (/stat/i.test(text)) return "statistics";
    return null;
  }

  function renderStrips(unitStats) {
    var cards = document.querySelectorAll("#interactive-hub .unit-card");
    if (!cards.length) return false;
    Array.prototype.forEach.call(cards, function (card) {
      if (card.querySelector(".ntj-strip")) return;
      var key = unitKeyForCard(card);
      if (!key) return;
      var header = card.querySelector(".unit-card-header");
      if (!header) return;
      var mount = document.createElement("div");
      mount.className = "ntj-mount";
      mount.innerHTML = stripFor(unitStats[key]);
      header.insertAdjacentElement("afterend", mount);
    });
    return true;
  }

  function renderContinueChip() {
    var last = readJson("nt-journey-last");
    if (!last || !last.path || !last.id) return;
    var hub = document.getElementById("interactive-hub");
    if (!hub || document.querySelector(".ntj-continue")) return;
    var chip = document.createElement("div");
    chip.className = "ntj-continue";
    chip.innerHTML =
      '<span aria-hidden="true">⏯️</span><strong>Pick up where you left off:</strong> ' +
      '<a href="' +
      esc(last.path) +
      '">' +
      esc(last.title || "Lesson " + last.id) +
      "</a>" +
      '<span class="ntj-es" lang="es">Continúa donde lo dejaste.</span>';
    hub.insertAdjacentElement("beforebegin", chip);
  }

  // Routed through /assets/curriculum-json-cache.js so the hub fetches each
  // data file once instead of once per feature script. A missing manifest still
  // resolves to null, which the next step treats as "nothing to render".
  function loadManifest() {
    var cache = window.NTJsonCache;
    if (cache) {
      return cache.json(MANIFEST_URL).catch(function () {
        return null;
      });
    }
    return fetch(MANIFEST_URL).then(function (response) {
      return response.ok ? response.json() : null;
    });
  }

  function boot() {
    loadManifest()
      .then(function (manifest) {
        if (!manifest || !manifest.lessons) return;
        var unitStats = collectSignals(manifest);
        renderContinueChip();
        renderStrips(unitStats);
        // #interactive-hub renders from an inline script at runtime, and
        // curriculum-sidebar.js removes every non-active .unit-card from the
        // DOM, re-appending one on each rail click. So a successful first pass
        // proves nothing about later units: this used to return early whenever
        // renderStrips found a single card, which skipped installing the
        // observer entirely and left 9 of 10 units strip-less for the session.
        // Watch for the whole session and never disconnect -- renderStrips is
        // idempotent via its .ntj-strip check, and rAF coalesces the bursts our
        // own insertAdjacentElement calls trigger.
        var scheduled = false;
        var observer = new MutationObserver(function () {
          if (scheduled) return;
          scheduled = true;
          requestAnimationFrame(function () {
            scheduled = false;
            renderStrips(unitStats);
          });
        });
        observer.observe(document.body, { childList: true, subtree: true });
      })
      .catch(function () {
        /* offline or manifest missing — the hub works exactly as before */
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
