/*
 * Thinking Trails — CSV export utilities (window.EvidenceCSV)
 * Local-only. Builds an RFC-4180-correct CSV string from a session summary and
 * triggers a browser download. No network involved.
 */
(function (global) {
  "use strict";

  // RFC 4180 escaping: wrap in quotes when the field contains a comma, quote,
  // CR, or LF; double any embedded quotes. Blank/undefined -> empty field.
  function esc(value) {
    if (value === null || value === undefined) return "";
    var s = "" + value;
    if (/[",\r\n]/.test(s)) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  function row(fields) {
    var out = [];
    for (var i = 0; i < fields.length; i++) out.push(esc(fields[i]));
    return out.join(",");
  }

  var HEADERS = [
    "sessionId",
    "studentNameOrCode",
    "lessonId",
    "activityId",
    "standard",
    "problemId",
    "skill",
    "result",
    "attempts",
    "hintUsed",
    "misconceptionTag",
    "explanation",
    "timestamp",
  ];

  function build(summary) {
    if (!summary) return "";
    var lines = [row(HEADERS)];
    var attempts = summary.attempts || [];
    for (var i = 0; i < attempts.length; i++) {
      var a = attempts[i];
      lines.push(
        row([
          summary.sessionId,
          summary.studentNameOrCode,
          summary.lessonId,
          summary.activityId,
          summary.standard,
          a.problemId,
          a.skill,
          a.result,
          a.attempts,
          a.hintUsed ? "yes" : "no",
          a.misconceptionTag,
          a.explanation,
          a.timestamp,
        ]),
      );
    }
    // CRLF line endings per RFC 4180 — opens cleanly in Excel/Sheets.
    return lines.join("\r\n");
  }

  function download(csv, filename) {
    try {
      // Prepend BOM so Excel reads UTF-8 (accents, ñ) correctly.
      var blob = new global.Blob(["﻿" + csv], {
        type: "text/csv;charset=utf-8;",
      });
      var url = global.URL.createObjectURL(blob);
      var a = global.document.createElement("a");
      a.href = url;
      a.download = filename || "thinking-trails.csv";
      global.document.body.appendChild(a);
      a.click();
      global.document.body.removeChild(a);
      global.setTimeout(function () {
        global.URL.revokeObjectURL(url);
      }, 1000);
      return true;
    } catch (e) {
      return false;
    }
  }

  global.EvidenceCSV = { build: build, download: download, esc: esc };
})(typeof window !== "undefined" ? window : this);
