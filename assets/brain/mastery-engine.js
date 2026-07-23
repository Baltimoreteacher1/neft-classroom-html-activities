/*
 * Neft Math Brain — Mastery Engine
 * Pure module. Input: graded results (nt_result_v1) + content graph + taxonomy.
 * Output: per-standard mastery state for one student. No DOM, no network.
 * Exposes window.NeftBrain.Mastery (browser) and module.exports (Node/tests).
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.NeftBrain = root.NeftBrain || {};
  root.NeftBrain.Mastery = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var HALF_LIFE_DAYS = 14; // recent attempts weigh more
  var PROFICIENT = 0.8;
  var DEVELOPING = 0.5;
  var MISCONCEPTION_BELOW = 0.7; // a low score on an activity flags its misconceptions

  /* Build a normalizer from the taxonomy: maps shorthand ids (6.AT.3, 6.DS.6d)
     to canonical ids (6.AT.A.3, 6.DS.B.6.d). */
  function buildNormalizer(taxonomy) {
    var canon = {}; // loose key -> canonical id
    var valid = {};
    (taxonomy.standards || []).forEach(function (s) {
      valid[s.id] = true;
      canon[looseKey(s.id)] = s.id;
      canon[s.id.toUpperCase()] = s.id;
    });
    function looseKey(id) {
      // 6.AT.A.4 -> 6RP3C ; 6.NOS.B.2 -> 6NS2
      return String(id)
        .toUpperCase()
        .replace(/\.([A-Z])(?=\.|$)/g, function (_m, letter, _off, str) {
          // drop a standalone cluster letter only when a number follows somewhere
          return /\.\d/.test(str) ? "." : "." + letter + ".";
        })
        .replace(/[^0-9A-Z]/g, "");
    }
    return function normalize(raw) {
      if (!raw) return null;
      var up = String(raw).trim().toUpperCase();
      if (valid[up]) return up;
      var lk = looseKey(up);
      if (canon[lk]) return canon[lk];
      // try progressively less specific: drop trailing sub-letter
      var parts = up.split(".");
      while (parts.length > 2) {
        parts.pop();
        var cand = parts.join(".");
        if (valid[cand]) return cand;
        if (canon[looseKey(cand)]) return canon[looseKey(cand)];
      }
      return null; // unrecognized / non-standard (MIXED, FOUNDATIONAL, NON_MATH, junk)
    };
  }

  function decayWeight(completedAt, now) {
    var t = Date.parse(completedAt);
    if (isNaN(t)) return 1;
    var days = Math.max(0, (now - t) / 86400000);
    return Math.pow(0.5, days / HALF_LIFE_DAYS);
  }

  function band(m) {
    if (m >= PROFICIENT) return "proficient";
    if (m >= DEVELOPING) return "developing";
    return "struggling";
  }

  /*
   * compute(results, opts)
   *   results: array of nt_result_v1 records
   *   opts.contentGraph: { byUrl: {url:entry}, byId: {activityId:entry} } (optional)
   *   opts.taxonomy: standards-taxonomy.json
   *   opts.now: epoch ms (optional, for deterministic tests)
   * returns { standards: {id:{mastery,band,attempts,lastSeen,misconceptions[]}}, overall }
   */
  function compute(results, opts) {
    opts = opts || {};
    var now = opts.now || Date.now();
    var taxonomy = opts.taxonomy || { standards: [] };
    var graph = opts.contentGraph || {};
    var byId = graph.byId || {};
    var byUrl = graph.byUrl || {};
    var normalize = buildNormalizer(taxonomy);

    var acc = {}; // standardId -> { wSum, wScore, attempts, lastSeen, misc:{} }

    (results || []).forEach(function (r) {
      if (!r || typeof r.scorePercent !== "number") return;
      var entry = byId[r.activityId] || byUrl[r.activityId] || null;
      var stdRaw = (entry && entry.standard) || r.standard;
      var std = normalize(stdRaw);
      if (!std) return; // skip MIXED/NON_MATH/foundational for per-standard mastery
      var w = decayWeight(r.completedAt, now);
      var score = Math.max(0, Math.min(1, r.scorePercent / 100));
      var a =
        acc[std] ||
        (acc[std] = {
          wSum: 0,
          wScore: 0,
          attempts: 0,
          lastSeen: null,
          misc: {},
        });
      a.wSum += w;
      a.wScore += w * score;
      a.attempts += 1;
      if (!a.lastSeen || r.completedAt > a.lastSeen) a.lastSeen = r.completedAt;
      if (score < MISCONCEPTION_BELOW && entry && entry.misconceptions) {
        entry.misconceptions.forEach(function (m) {
          a.misc[m] = (a.misc[m] || 0) + 1;
        });
      }
    });

    var standards = {};
    var mSum = 0,
      mCount = 0;
    Object.keys(acc).forEach(function (id) {
      var a = acc[id];
      var m = a.wSum > 0 ? a.wScore / a.wSum : 0;
      m = Math.round(m * 1000) / 1000;
      standards[id] = {
        mastery: m,
        band: band(m),
        attempts: a.attempts,
        lastSeen: a.lastSeen,
        misconceptions: Object.keys(a.misc).sort(function (x, y) {
          return a.misc[y] - a.misc[x];
        }),
      };
      mSum += m;
      mCount += 1;
    });

    return {
      standards: standards,
      overall: mCount ? Math.round((mSum / mCount) * 1000) / 1000 : 0,
      standardsAssessed: mCount,
    };
  }

  return {
    compute: compute,
    buildNormalizer: buildNormalizer,
    BANDS: { PROFICIENT: PROFICIENT, DEVELOPING: DEVELOPING },
  };
});
