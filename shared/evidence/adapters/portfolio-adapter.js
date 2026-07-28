/*
 * EduWonderLab — Portfolio evidence adapter
 * =============================================================================
 * READ-ONLY normalization of culminating-project completions into shared
 * evidence events.
 *
 * The projects layer keeps its own storage exactly as it always has:
 *   nt-project-complete:v1     — { "<path>": { unit, version, title,
 *                                  completedAt, stars, rubricTotal, rubricMax,
 *                                  level, firstCompletedAt? } }
 *   nt-project-reflect:<path>  — the student's written reflection
 *   nt-project-rubric:<path>   — the rubric selections behind the score
 *
 * This adapter never writes to any of them and never changes project or
 * portfolio behaviour. Remove it and the portfolio is unaffected.
 *
 * WHY THERE IS NO `standardIds` HERE
 *   A completion record names a unit and a project, not a standard. Attributing
 *   a project to every standard in its unit would manufacture per-standard
 *   evidence the student never actually generated, and the recommendation rules
 *   would then reason from it. `unitId` is the honest granularity, so that is
 *   what is reported. Anything finer would be invented.
 *
 * IDEMPOTENCE
 *   Event ids encode the completion timestamp and score, so re-running sync()
 *   after nothing changed records nothing, while a genuine re-completion (a
 *   revised project scored again) produces a new event.
 *
 * Load order on a page:
 *   learning-evidence.js -> this
 * =============================================================================
 */
(function (global) {
  "use strict";

  var PRODUCT_ID = "design-studio";
  var ADAPTER = "portfolio";
  var COMPLETE_KEY = "nt-project-complete:v1";
  var REFLECT_PREFIX = "nt-project-reflect:";

  function readJson(key) {
    try {
      var raw = global.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (_e) {
      return null;
    }
  }

  function readText(key) {
    try {
      return global.localStorage.getItem(key) || "";
    } catch (_e) {
      return "";
    }
  }

  function num(value) {
    var n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  /** "/math/unit-3/projects/version-a/" -> "unit-3", falling back to the record. */
  function unitIdFor(path, record) {
    var match = /\/unit-(\d+)\//.exec(String(path || ""));
    if (match) return "unit-" + match[1];
    if (record && record.unit != null && /^\d+$/.test(String(record.unit))) {
      return "unit-" + record.unit;
    }
    return null;
  }

  function collect() {
    var records = readJson(COMPLETE_KEY);
    if (!records || typeof records !== "object") return [];

    var events = [];

    Object.keys(records).forEach(function (path) {
      var record = records[path];
      if (!record || !record.completedAt) return;

      var total = num(record.rubricTotal);
      var max = num(record.rubricMax);
      var unitId = unitIdFor(path, record);
      var stamp = record.completedAt;
      var scoreTag = total != null && max != null ? total + "/" + max : "nc";

      events.push({
        eventId: "pf:submit:" + path + ":" + stamp + ":" + scoreTag,
        timestamp: stamp,
        productId: PRODUCT_ID,
        activityId: path,
        unitId: unitId,
        eventType: "project_submitted",
        completionStatus: "completed",
        // A project with no rubric selections has no score — reported as
        // unknown rather than as zero.
        score: max != null && max > 0 ? total : null,
        maxScore: max != null && max > 0 ? max : null,
        projectArtifactRef: path,
        portfolioRef: path,
        source: ADAPTER,
      });

      events.push({
        eventId: "pf:saved:" + path + ":" + stamp,
        timestamp: stamp,
        productId: PRODUCT_ID,
        activityId: path,
        unitId: unitId,
        eventType: "portfolio_saved",
        completionStatus: "completed",
        portfolioRef: path,
        exportStatus: "saved",
        source: ADAPTER,
      });

      /* A revision is visible only when the record kept an earlier completion
       * timestamp — that is the projects layer's own signal that this project
       * was completed, changed, and completed again. */
      if (record.firstCompletedAt && record.firstCompletedAt !== stamp) {
        events.push({
          eventId: "pf:revised:" + path + ":" + stamp,
          timestamp: stamp,
          productId: PRODUCT_ID,
          activityId: path,
          unitId: unitId,
          eventType: "project_checkpoint",
          completionStatus: "completed",
          answerRevisions: 1,
          portfolioRef: path,
          source: ADAPTER,
        });
      }

      var reflection = readText(REFLECT_PREFIX + path).trim();
      if (reflection) {
        events.push({
          // Length keys the id so an edited reflection reads as new evidence.
          eventId: "pf:reflect:" + path + ":" + reflection.length,
          timestamp: stamp,
          productId: PRODUCT_ID,
          activityId: path,
          unitId: unitId,
          eventType: "explanation_written",
          writtenExplanation: reflection,
          portfolioRef: path,
          source: ADAPTER,
        });
      }
    });

    return events;
  }

  if (global.EWLEvidence && typeof global.EWLEvidence.registerAdapter === "function") {
    global.EWLEvidence.registerAdapter(ADAPTER, collect);
  }

  global.EWLPortfolioAdapter = {
    collect: collect,
    unitIdFor: unitIdFor,
    PRODUCT_ID: PRODUCT_ID,
    COMPLETE_KEY: COMPLETE_KEY,
  };
})(typeof window !== "undefined" ? window : globalThis);
