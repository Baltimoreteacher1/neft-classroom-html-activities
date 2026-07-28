/*
 * EduWonderLab — Assessment results evidence adapter
 * =============================================================================
 * READ-ONLY normalization of the shared results log into evidence events.
 *
 * assets/nt-results.js appends rows to localStorage["nt_results_log"] in the
 * CSV schema that neft-data-studio and teacher-data-dashboard already ingest:
 *
 *   { "Student Name", "Class", "Assessment", "Score", "Percent", "Standard",
 *     "Skill", "Question/Item", "Date", "ESOL Level", "ACCESS Level",
 *     "Intervention Group", "Attendance %", "IEP/504", "Teacher" }
 *
 * This adapter never writes to that log and never changes how any assessment
 * behaves. Remove it and nothing about results export changes.
 *
 * PRIVACY — THE IMPORTANT PART
 *   That log contains a real, student-entered NAME, and in some deployments an
 *   ESOL level and an IEP/504 marker. None of it is copied into an evidence
 *   event. The evidence layer derives its own pseudonymous learner id, and the
 *   fields carried across are strictly: assessment title, standard, score,
 *   item count, and date. `Student Name`, `ESOL Level`, `IEP/504`,
 *   `Intervention Group`, `Attendance %`, and `Teacher` are read past and
 *   dropped. test/award-portfolio.test.mjs asserts a name in the log never
 *   reaches an evidence event.
 *
 * WHY ONLY THE "Overall" ROWS
 *   nt-results writes one row per section PLUS an "Overall" row whose score is
 *   the sum of the sections. Recording both would double-count every
 *   assessment. The section rows are per-skill aggregates, not per-item
 *   attempts, so they are not `item_attempted` either — the honest reading is
 *   one `assessment_scored` per Overall row, and the section detail stays in
 *   the results log where the teacher dashboards already read it.
 *
 * Load order on a page:
 *   learning-evidence.js -> this
 * =============================================================================
 */
(function (global) {
  "use strict";

  var PRODUCT_ID = "personalized-math-path";
  var ADAPTER = "assessment-results";
  var LOG_KEY = "nt_results_log";

  /* Columns that must never leave the results log. Enumerated rather than
   * relying on an allow-list by omission, so a new sensitive column added
   * upstream is a visible decision here rather than a silent leak. */
  var NEVER_COPY = [
    "Student Name",
    "ESOL Level",
    "IEP/504",
    "Intervention Group",
    "Attendance %",
    "Teacher",
    "Class",
  ];

  function readJson(key) {
    try {
      var raw = global.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (_e) {
      return null;
    }
  }

  function num(value) {
    if (value == null || value === "") return null;
    var n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  /** "20 items" -> 20. Returns null when the cell is not in that shape. */
  function itemCount(cell) {
    var match = /^(\d+)\s+items?$/i.exec(String(cell || "").trim());
    return match ? Number(match[1]) : null;
  }

  /** A YYYY-MM-DD date becomes a stable, sortable ISO timestamp. */
  function timestampFor(date) {
    var d = String(date || "").trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d + "T00:00:00.000Z" : new Date().toISOString();
  }

  function collect() {
    var rows = readJson(LOG_KEY);
    if (!Array.isArray(rows)) return [];

    var events = [];

    rows.forEach(function (row) {
      if (!row || typeof row !== "object") return;
      // Only the roll-up row; see the note above on double counting.
      if (String(row.Skill || "").trim() !== "Overall") return;

      var assessment = String(row.Assessment || "").trim();
      if (!assessment) return;

      var score = num(row.Score);
      var max = itemCount(row["Question/Item"]);
      var standard = String(row.Standard || "").trim();
      var date = String(row.Date || "").trim();

      events.push({
        eventId: "as:" + assessment + ":" + date + ":" + (score == null ? "ns" : score) + "/" + (max == null ? "nm" : max),
        timestamp: timestampFor(date),
        productId: PRODUCT_ID,
        activityId: assessment,
        standardIds: standard ? [standard] : [],
        eventType: "assessment_scored",
        completionStatus: "completed",
        score: score,
        maxScore: max,
        attemptCount: max,
        source: ADAPTER,
      });
    });

    return events;
  }

  global.EWLAssessmentAdapter = {
    collect: collect,
    itemCount: itemCount,
    NEVER_COPY: NEVER_COPY,
    PRODUCT_ID: PRODUCT_ID,
    LOG_KEY: LOG_KEY,
  };

  if (global.EWLEvidence && typeof global.EWLEvidence.registerAdapter === "function") {
    global.EWLEvidence.registerAdapter(ADAPTER, collect);
  }
})(typeof window !== "undefined" ? window : globalThis);
