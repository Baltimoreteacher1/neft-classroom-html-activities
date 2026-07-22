/**
 * Standards Shift Studio — data layer.
 * Loads the live sources of truth the CLI pipeline itself uses:
 *   /data/ccss-standards.json        — standards registry (2025 MCCRS codes)
 *   /data/curriculum-manifest.json   — one entry per lesson (generated)
 *   /data/standards-crosswalk-2025.json — worked example of a real MSDE re-code
 * Normalizes them into one model the other modules read.
 */
(function () {
  "use strict";

  var URLS = {
    registry: "/data/ccss-standards.json",
    manifest: "/data/curriculum-manifest.json",
    crosswalk2025: "/data/standards-crosswalk-2025.json",
  };

  function fetchJson(url) {
    return fetch(url, { credentials: "same-origin" }).then(function (r) {
      if (!r.ok) throw new Error(url + " → HTTP " + r.status);
      return r.json();
    });
  }

  /** Count how many applicable resources exist for a manifest lesson entry. */
  function resourceStats(entry) {
    var have = 0;
    var total = 0;
    var res = entry.resources || {};
    Object.keys(res).forEach(function (k) {
      if (!res[k] || res[k].applicable === false) return;
      total += 1;
      if (res[k].exists) have += 1;
    });
    return { have: have, total: total };
  }

  function normalize(registry, manifest, crosswalk2025) {
    var standards = {};
    Object.keys(registry.standards || {}).forEach(function (code) {
      var s = registry.standards[code];
      standards[code] = {
        code: code,
        domain: s.domain || "",
        domainName: (registry.domains || {})[s.domain] || s.domain || "",
        cluster: s.cluster || "",
        topic: s.topic || "",
        shortLabel: s.shortLabel || "",
        fullText: s.fullText || "",
        unit: s.unit != null ? s.unit : null,
        oldId: s.oldId || "",
      };
    });

    // Base spine only (unit-lesson ids); variants (-flagship etc.) render the same slot.
    var lessons = (manifest.lessons || [])
      .filter(function (l) {
        return /^\d+-\d+$/.test(l.id);
      })
      .map(function (l) {
        var rs = resourceStats(l);
        return {
          id: l.id,
          unit: l.unit,
          lesson: l.lesson,
          title: l.title || l.id,
          standard: l.standard || "",
          path: l.lessonPath || "/lessons/" + l.id + "/",
          ready: !!(l.status && l.status.ready),
          resourcesHave: rs.have,
          resourcesTotal: rs.total,
        };
      })
      .sort(function (a, b) {
        return a.unit - b.unit || a.lesson - b.lesson;
      });

    var byStandard = {};
    lessons.forEach(function (l) {
      if (!byStandard[l.standard]) byStandard[l.standard] = [];
      byStandard[l.standard].push(l);
    });

    return {
      domains: registry.domains || {},
      standards: standards,
      standardCodes: Object.keys(standards),
      lessons: lessons,
      byStandard: byStandard,
      units: Array.from(
        new Set(
          lessons.map(function (l) {
            return l.unit;
          }),
        ),
      ).sort(function (a, b) {
        return a - b;
      }),
      crosswalk2025: crosswalk2025,
    };
  }

  window.ShiftData = {
    load: function () {
      return Promise.all([
        fetchJson(URLS.registry),
        fetchJson(URLS.manifest),
        fetchJson(URLS.crosswalk2025).catch(function () {
          return null; // worked example is optional — studio still runs without it
        }),
      ]).then(function (results) {
        return normalize(results[0], results[1], results[2]);
      });
    },
  };
})();
