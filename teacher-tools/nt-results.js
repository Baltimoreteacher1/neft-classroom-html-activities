/* nt-results.js — Neft Teacher shared results exporter.
 *
 * Lets any assessment activity emit a results CSV in the schema that
 * neft-data-studio / teacher-data-dashboard already ingest, and append the
 * same rows to a same-origin localStorage log (nt_results_log) so a teacher
 * can pull a class set off one device.
 *
 * Usage on an activity's summary screen:
 *
 *   NTResults.finish({
 *     student: "Amina Hassan",          // required (student-entered name)
 *     assessment: "Unit 2 Review",       // required (activity title)
 *     standard: "6.NS.1",                // optional (unit standard code)
 *     level: "",                          // "1" | "2" | "" (activity level, NOT student label)
 *     sections: [                         // optional per-section breakdown
 *       { name: "Vocabulary", correct: 4, total: 5 },
 *       { name: "Challenge",  correct: 3, total: 5 },
 *     ],
 *     correct: 16, total: 20,             // overall (falls back to summing sections)
 *   });
 *
 * finish() downloads "<assessment>-<student>.csv" AND logs to localStorage.
 * Pass { download:false } to log only, or { log:false } to download only.
 */
(function (global) {
  "use strict";

  // neft-data-studio CSV schema — keep column order/labels exact.
  var COLUMNS = [
    "Student Name",
    "Class",
    "Assessment",
    "Score",
    "Percent",
    "Standard",
    "Skill",
    "Question/Item",
    "Date",
    "ESOL Level",
    "ACCESS Level",
    "Intervention Group",
    "Attendance %",
    "IEP/504",
    "Teacher",
  ];
  var LOG_KEY = "nt_results_log";

  function csvCell(v) {
    v = v == null ? "" : String(v);
    return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }

  function pct(correct, total) {
    return total > 0 ? Math.round((correct / total) * 100) : 0;
  }

  function todayISO() {
    // Activity runs in the browser; local date is the assessment date.
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }

  // Build the row objects (one per section + one TOTAL) for a result.
  function buildRows(opts) {
    var student = opts.student || "";
    var assessment = opts.assessment || "Assessment";
    var standard = opts.standard || "";
    var teacher = opts.teacher || "";
    var klass = opts.class || opts.klass || "";
    var date = opts.date || todayISO();
    // Level is the activity tier (1/2), recorded under the teacher-facing
    // "ACCESS Level" column for planning; never a student-facing label.
    var level = opts.level ? "Level " + opts.level : "";

    var sections = Array.isArray(opts.sections) ? opts.sections : [];
    var totCorrect =
      opts.correct != null
        ? opts.correct
        : sections.reduce(function (a, s) {
            return a + (s.correct || 0);
          }, 0);
    var totTotal =
      opts.total != null
        ? opts.total
        : sections.reduce(function (a, s) {
            return a + (s.total || 0);
          }, 0);

    var rows = [];
    sections.forEach(function (s) {
      rows.push({
        "Student Name": student,
        Class: klass,
        Assessment: assessment,
        Score: s.correct,
        Percent: pct(s.correct, s.total),
        Standard: standard,
        Skill: s.name || "",
        "Question/Item": (s.total || 0) + " items",
        Date: date,
        "ESOL Level": "",
        "ACCESS Level": level,
        "Intervention Group": "",
        "Attendance %": "",
        "IEP/504": "",
        Teacher: teacher,
      });
    });
    rows.push({
      "Student Name": student,
      Class: klass,
      Assessment: assessment,
      Score: totCorrect,
      Percent: pct(totCorrect, totTotal),
      Standard: standard,
      Skill: "Overall",
      "Question/Item": totTotal + " items",
      Date: date,
      "ESOL Level": "",
      "ACCESS Level": level,
      "Intervention Group": "",
      "Attendance %": "",
      "IEP/504": "",
      Teacher: teacher,
    });
    return rows;
  }

  function rowsToCSV(rows, withHeader) {
    var lines = [];
    if (withHeader) lines.push(COLUMNS.map(csvCell).join(","));
    rows.forEach(function (r) {
      lines.push(
        COLUMNS.map(function (c) {
          return csvCell(r[c]);
        }).join(","),
      );
    });
    return lines.join("\n");
  }

  function download(filename, csv) {
    try {
      var blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      /* non-fatal */
    }
  }

  function appendLog(rows) {
    try {
      var prev = JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
      if (!Array.isArray(prev)) prev = [];
      localStorage.setItem(LOG_KEY, JSON.stringify(prev.concat(rows)));
    } catch (e) {
      /* quota / disabled — non-fatal */
    }
  }

  var NTResults = {
    columns: COLUMNS.slice(),
    logKey: LOG_KEY,

    // Main entry: build rows, download CSV, and log them.
    finish: function (opts) {
      opts = opts || {};
      var rows = buildRows(opts);
      if (opts.log !== false) appendLog(rows);
      if (opts.download !== false) {
        var safe = (
          (opts.assessment || "results") +
          "-" +
          (opts.student || "student")
        )
          .replace(/[^a-z0-9]+/gi, "-")
          .replace(/^-+|-+$/g, "");
        download(safe + ".csv", rowsToCSV(rows, true));
      }
      return rows;
    },

    // Read everything logged on this device (for a class-results tool).
    readLog: function () {
      try {
        var v = JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
        return Array.isArray(v) ? v : [];
      } catch (e) {
        return [];
      }
    },

    // Export the whole device log as one combined CSV.
    exportLog: function (filename) {
      var rows = this.readLog();
      if (!rows.length) return false;
      download(filename || "neft-class-results.csv", rowsToCSV(rows, true));
      return true;
    },

    clearLog: function () {
      try {
        localStorage.removeItem(LOG_KEY);
      } catch (e) {}
    },

    // Exposed for testing.
    _buildRows: buildRows,
    _rowsToCSV: rowsToCSV,
  };

  if (typeof module !== "undefined" && module.exports)
    module.exports = NTResults;
  if (global) global.NTResults = NTResults;
})(
  typeof window !== "undefined"
    ? window
    : typeof globalThis !== "undefined"
      ? globalThis
      : this,
);
