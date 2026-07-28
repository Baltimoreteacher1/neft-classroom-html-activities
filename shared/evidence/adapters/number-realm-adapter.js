/*
 * EduWonderLab — Number Realm evidence adapter
 * =============================================================================
 * READ-ONLY normalization of the Number Realm hero profile and realm saves into
 * shared evidence events.
 *
 * Number Realm keeps its own storage exactly as it always has:
 *   mrpg:hero     — the global hero (level, gold, per-standard mastery, stats)
 *   mrpg:unit<N>  — per-realm progress (cleared chapters, boss, done)
 *
 * This adapter never writes to either key and never changes gameplay. It reads
 * what is already there and emits evidence events so Number Realm progress can
 * appear in My Math Progress, the teacher surfaces, and the recommendation
 * loop. If the adapter is removed, Number Realm is unaffected.
 *
 * IDEMPOTENCE
 *   Event ids encode the value they describe (e.g. `nr:mastery:6.AT.1:7/9`), so
 *   re-running sync() after nothing changed records nothing new, while genuine
 *   progress produces a new event. That gives progress surfaces a real series
 *   without duplicating rows.
 *
 * STANDARDS
 *   Number Realm's problem bank uses cluster-qualified codes (6.AT.A.1). The
 *   canonical registry carries those as aliases, so this adapter resolves
 *   through EWLRegistry when it is available and otherwise falls back to a
 *   local strip of the cluster letter — which is the same transformation the
 *   registry encodes.
 *
 * Load order on a page:
 *   learning-evidence.js -> curriculum-registry-client.js (optional) -> this
 * =============================================================================
 */
(function (global) {
  "use strict";

  var PRODUCT_ID = "number-realm";
  var ADAPTER = "number-realm-profile";

  /* Number Realm mastery tiers -> shared evidence mastery levels. */
  var TIER_TO_LEVEL = {
    novice: "novice",
    apprentice: "developing",
    master: "proficient",
  };

  function readJson(key) {
    try {
      var raw = global.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (_e) {
      return null;
    }
  }

  /**
   * 6.AT.A.1 -> 6.AT.1. Prefers the canonical registry's alias table; the
   * inline fallback exists so the adapter still works on an offline realm page
   * that never fetched the registry.
   */
  function canonicalStandard(code) {
    if (!code) return null;
    if (global.EWLRegistry && global.EWLRegistry.isLoaded()) {
      var resolved = global.EWLRegistry.resolve(code);
      if (resolved) return resolved;
    }
    var parts = String(code).split(".");
    if (parts.length === 4 && /^[A-Z]$/.test(parts[2])) {
      return parts[0] + "." + parts[1] + "." + parts[3];
    }
    return String(code);
  }

  /** Number Realm's own tier rule, mirrored so the adapter needs no game code. */
  function tierFor(mastery) {
    if (!mastery || !mastery.total) return null;
    var accuracy = mastery.correct / mastery.total;
    if (mastery.total >= 5 && accuracy >= 0.8) return "master";
    if (accuracy >= 0.6) return "apprentice";
    return "novice";
  }

  function realmSaves() {
    var out = [];
    for (var unit = 1; unit <= 10; unit++) {
      var save = readJson("mrpg:unit" + unit);
      if (save) out.push({ unit: unit, save: save });
    }
    return out;
  }

  /**
   * Build the evidence events. Returns [] when the student has never played,
   * so an empty profile produces no phantom progress.
   */
  function collect() {
    var hero = readJson("mrpg:hero");
    var events = [];
    var now = new Date().toISOString();

    if (hero && hero.mastery) {
      Object.keys(hero.mastery).forEach(function (rawStandard) {
        var mastery = hero.mastery[rawStandard];
        if (!mastery || !mastery.total) return;
        var standard = canonicalStandard(rawStandard);
        var tier = tierFor(mastery);
        events.push({
          eventId: "nr:mastery:" + standard + ":" + mastery.correct + "/" + mastery.total,
          timestamp: now,
          productId: PRODUCT_ID,
          activityId: "number-realm-campaign",
          standardIds: [standard],
          eventType: "mastery_updated",
          score: mastery.correct,
          maxScore: mastery.total,
          masteryLevel: tier ? TIER_TO_LEVEL[tier] : null,
          attemptCount: mastery.total,
          source: ADAPTER,
        });
      });
    }

    if (hero && hero.stats) {
      // One rolled-up hint signal. Number Realm counts hints globally rather
      // than per standard, so this is reported honestly as a campaign-level
      // figure instead of being split across standards it cannot be attributed
      // to.
      if (hero.stats.hintsUsed > 0) {
        events.push({
          eventId: "nr:hints:" + hero.stats.hintsUsed,
          timestamp: now,
          productId: PRODUCT_ID,
          activityId: "number-realm-campaign",
          eventType: "hint_requested",
          hintCount: hero.stats.hintsUsed,
          attemptCount: hero.stats.problemsSolved || null,
          source: ADAPTER,
        });
      }
    }

    if (hero && hero.achievements) {
      Object.keys(hero.achievements).forEach(function (id) {
        if (!hero.achievements[id]) return;
        events.push({
          eventId: "nr:achievement:" + id,
          timestamp: now,
          productId: PRODUCT_ID,
          activityId: "number-realm-campaign",
          eventType: "badge_earned",
          completionStatus: "completed",
          source: ADAPTER,
        });
      });
    }

    realmSaves().forEach(function (entry) {
      var chaptersCleared = entry.save.cleared ? Object.keys(entry.save.cleared).length : 0;
      if (!chaptersCleared && !entry.save.done) return;
      events.push({
        eventId:
          "nr:realm:" + entry.unit + ":" + chaptersCleared + (entry.save.done ? ":done" : ""),
        timestamp: now,
        productId: PRODUCT_ID,
        activityId: "number-realm-unit-" + entry.unit,
        unitId: "unit-" + entry.unit,
        eventType: entry.save.done ? "activity_completed" : "activity_started",
        completionStatus: entry.save.done ? "completed" : "in_progress",
        source: ADAPTER,
      });
    });

    return events;
  }

  if (global.EWLEvidence && typeof global.EWLEvidence.registerAdapter === "function") {
    global.EWLEvidence.registerAdapter(ADAPTER, collect);
  }

  global.EWLNumberRealmAdapter = {
    collect: collect,
    canonicalStandard: canonicalStandard,
    tierFor: tierFor,
    PRODUCT_ID: PRODUCT_ID,
  };
})(typeof window !== "undefined" ? window : globalThis);
