/*
 * Neft Math Brain — Recommendation Engine
 * Pure module. Input: mastery state + content graph → ranked next-best activities.
 * No DOM, no network. Browser: window.NeftBrain.Recommend. Node: module.exports.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.NeftBrain = root.NeftBrain || {};
  root.NeftBrain.Recommend = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // level fit per band: struggling -> supported, developing -> on-level, proficient -> enrichment
  var LEVEL_FOR_BAND = {
    struggling: [0, 1],
    developing: [1],
    proficient: [2, 1],
  };
  var BAND_URGENCY = { struggling: 100, developing: 50, proficient: 15 };

  /*
   * recommend(mastery, opts)
   *   mastery: output of Mastery.compute()  ({ standards, overall })
   *   opts.entries: array of content-graph entries {url,title,standard,level,misconceptions,type}
   *   opts.completedUrls: array of urls the student already finished (deprioritized)
   *   opts.limit: max recommendations (default 8)
   * returns array of { url, title, standard, level, type, reason, score }
   */
  function recommend(mastery, opts) {
    opts = opts || {};
    var entries = opts.entries || [];
    var done = {};
    (opts.completedUrls || []).forEach(function (u) {
      done[u] = true;
    });
    var limit = opts.limit || 8;
    var stds = (mastery && mastery.standards) || {};

    // active misconceptions across all standards
    var activeMisc = {};
    Object.keys(stds).forEach(function (id) {
      (stds[id].misconceptions || []).forEach(function (m) {
        activeMisc[m] = id;
      });
    });

    var recs = [];
    entries.forEach(function (e) {
      if (!e.standard || e.standard === "NON_MATH") return;
      var s = stds[e.standard];
      var score = 0;
      var reasons = [];

      if (s) {
        var urgency = BAND_URGENCY[s.band] || 30;
        var fitLevels = LEVEL_FOR_BAND[s.band] || [1];
        var levelFit = fitLevels.indexOf(e.level);
        if (levelFit === -1) return; // wrong level for this band
        score += urgency - levelFit * 8; // primary level fits best
        if (s.band === "struggling")
          reasons.push("You're still building " + e.standard);
        else if (s.band === "developing")
          reasons.push("Keep growing on " + e.standard);
        else reasons.push("Stretch yourself on " + e.standard);

        // misconception match: this activity targets a misconception the student shows
        var hit = (e.misconceptions || []).filter(function (m) {
          return activeMisc[m];
        });
        if (hit.length) {
          score += 40;
          reasons.push("targets: " + hit.join(", ").replace(/-/g, " "));
        }
      } else {
        // standard never assessed -> gentle "try something new" at on-level
        if (e.level !== 1) return;
        score += 25;
        reasons.push("New: haven't tried " + e.standard + " yet");
      }

      if (done[e.url]) score -= 60; // allow re-do but strongly deprioritize
      if (e.standard === "MIXED" || e.standard === "FOUNDATIONAL") score -= 10;

      recs.push({
        url: e.url,
        title: e.title,
        standard: e.standard,
        level: e.level,
        type: e.type,
        reason: reasons.join(" — "),
        score: Math.round(score * 10) / 10,
      });
    });

    recs.sort(function (a, b) {
      return b.score - a.score;
    });

    // diversify: avoid more than 2 from the same standard in a row of results
    var perStd = {};
    var out = [];
    for (var i = 0; i < recs.length && out.length < limit; i++) {
      var st = recs[i].standard;
      perStd[st] = (perStd[st] || 0) + 1;
      if (perStd[st] <= 2) out.push(recs[i]);
    }
    return out;
  }

  return { recommend: recommend };
});
