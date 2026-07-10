/**
 * canvas-grade-core.js — shared logic for the Canvas grading tools.
 *
 * Single source of truth for: CSV parse/serialize, student-name matching,
 * class-roster persistence, score scaling, and building Canvas-import CSVs.
 * Used by BOTH:
 *   - teacher-tools/canvas-grades/   (grade from pasted completion codes)
 *   - teacher-tools/canvas-dashboard/ (grade from the EduPulse gradebook, no codes)
 *
 * Pure/no-DOM so it can be unit-tested in Node. Attaches to window.NeftGradeCore.
 */
(function (global) {
  "use strict";

  var ROSTER_KEY = "nt_canvas_roster_v1";
  var MANUAL_MAP_KEY = "nt_canvas_manual_map_v1";
  var SETTINGS_KEY = "nt_canvas_dashboard_settings_v1";

  /* ---------------- CSV ---------------- */
  function parseCSV(text) {
    var rows = [],
      row = [],
      field = "",
      i = 0,
      inQ = false;
    text = String(text || "")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n");
    while (i < text.length) {
      var c = text[i];
      if (inQ) {
        if (c === '"') {
          if (text[i + 1] === '"') {
            field += '"';
            i += 2;
            continue;
          }
          inQ = false;
          i++;
          continue;
        }
        field += c;
        i++;
        continue;
      }
      if (c === '"') {
        inQ = true;
        i++;
        continue;
      }
      if (c === ",") {
        row.push(field);
        field = "";
        i++;
        continue;
      }
      if (c === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
        i++;
        continue;
      }
      field += c;
      i++;
    }
    if (field.length || row.length) {
      row.push(field);
      rows.push(row);
    }
    return rows;
  }
  function serializeCSV(rows) {
    return rows
      .map(function (r) {
        return r
          .map(function (c) {
            c = c == null ? "" : String(c);
            return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c;
          })
          .join(",");
      })
      .join("\r\n");
  }

  /* ---------------- name matching ---------------- */
  function norm(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
  }
  function nameKeys(s) {
    s = String(s || "").trim();
    var keys = {};
    keys[norm(s)] = 1;
    if (s.indexOf(",") >= 0) {
      var p = s.split(",");
      keys[norm(p[1] + p[0])] = 1;
    } else {
      var w = s.split(/\s+/);
      if (w.length >= 2) keys[norm(w[w.length - 1] + w.slice(0, -1).join(""))] = 1;
    }
    delete keys[""];
    return Object.keys(keys);
  }
  /** Build a key->rosterIndex lookup. roster = [{name,...}]. */
  function rosterLookup(roster) {
    var map = {};
    roster.forEach(function (stu, i) {
      nameKeys(stu.name).forEach(function (k) {
        if (!(k in map)) map[k] = i;
      });
    });
    return map;
  }
  /** Find roster index for a free-form name, or -1. */
  function matchIndex(lookup, name) {
    var keys = nameKeys(name);
    for (var i = 0; i < keys.length; i++) if (keys[i] in lookup) return lookup[keys[i]];
    return -1;
  }

  /* ---------------- roster persistence ---------------- */
  function loadRoster() {
    try {
      return JSON.parse(global.localStorage.getItem(ROSTER_KEY) || "[]") || [];
    } catch (e) {
      return [];
    }
  }
  function saveRoster(list) {
    try {
      global.localStorage.setItem(ROSTER_KEY, JSON.stringify(list || []));
    } catch (e) {}
    return list;
  }
  var NON_ASSIGN =
    /^(student|id|sis user id|sis login id|integration id|section|current score|current points|final score|final points|unposted .*|root account)$/i;
  /** Parse a Canvas gradebook export grid into {header, ppRow, studentRows, roster, assignmentCols}. */
  function readCanvasGrid(grid) {
    var header = grid[0] || [];
    var ppRow = -1;
    var studentRows = [];
    for (var r = 1; r < grid.length; r++) {
      var cell = (grid[r][0] || "").trim();
      if (/^points possible$/i.test(cell)) {
        ppRow = r;
        continue;
      }
      if (!cell || /test student/i.test(cell)) continue;
      studentRows.push(r);
    }
    var col = function (re) {
      return header.findIndex(function (h) {
        return re.test((h || "").trim());
      });
    };
    var idC = col(/^id$/i),
      sisC = col(/^sis login id$/i),
      secC = col(/^section$/i);
    var roster = studentRows.map(function (r) {
      return {
        name: (grid[r][0] || "").trim(),
        id: idC >= 0 ? (grid[r][idC] || "").trim() : "",
        sis: sisC >= 0 ? (grid[r][sisC] || "").trim() : "",
        section: secC >= 0 ? (grid[r][secC] || "").trim() : "",
      };
    });
    var assignmentCols = [];
    header.forEach(function (h, idx) {
      var name = (h || "").replace(/\s*\(\d+\)\s*$/, "").trim();
      if (idx === 0 || NON_ASSIGN.test(name)) return;
      assignmentCols.push({ index: idx, label: h });
    });
    return {
      header: header,
      ppRow: ppRow,
      studentRows: studentRows,
      roster: roster,
      assignmentCols: assignmentCols,
    };
  }

  /* ---------------- manual name map ----------------
   * A teacher-resolved override for names that don't auto-match.
   * Stored as { normalizedSourceName: rosterName } — keyed by the ROSTER
   * NAME (a stable string), so it survives roster reordering. */
  function loadManualMap() {
    try {
      return JSON.parse(global.localStorage.getItem(MANUAL_MAP_KEY) || "{}") || {};
    } catch (e) {
      return {};
    }
  }
  function saveManualMap(map) {
    try {
      global.localStorage.setItem(MANUAL_MAP_KEY, JSON.stringify(map || {}));
    } catch (e) {}
    return map;
  }
  /** Build a normalized(sourceName) -> rosterIndex lookup from a manual map. */
  function manualLookup(roster, manualMap) {
    var nameToIndex = {};
    roster.forEach(function (stu, i) {
      nameToIndex[norm(stu.name)] = i;
    });
    var out = {};
    Object.keys(manualMap || {}).forEach(function (srcKey) {
      var rosterName = manualMap[srcKey];
      var idx = nameToIndex[norm(rosterName)];
      if (idx != null) out[norm(srcKey)] = idx;
    });
    return out;
  }

  /* ---------------- dashboard settings persistence ----------------
   * Remembers the last assignment mapping so a returning teacher can go
   * straight from "fetch" to "download". Pure key/value over localStorage. */
  function loadSettings() {
    try {
      return JSON.parse(global.localStorage.getItem(SETTINGS_KEY) || "{}") || {};
    } catch (e) {
      return {};
    }
  }
  function saveSettings(obj) {
    try {
      global.localStorage.setItem(SETTINGS_KEY, JSON.stringify(obj || {}));
    } catch (e) {}
    return obj;
  }

  /* ---------------- scoring ---------------- */
  function scaleGrade(percent, rawScore, pointsPossible) {
    if (pointsPossible != null && percent != null)
      return Math.round((percent / 100) * pointsPossible);
    return rawScore == null ? 0 : rawScore;
  }

  /**
   * Match a list of result entries to the roster and compute Canvas grades.
   * entries: [{ name, percent, score, max }]
   * Optional manualMap: { normalizedSourceName: rosterName } — teacher-resolved
   * overrides applied AFTER auto-match, so a mismatch never recurs. Omitting it
   * preserves the original behavior exactly.
   * returns { matched:[{name,code,grade,rosterIndex}], unmatched:[...], gradeByIndex:{} }
   * entries[].label (optional) overrides the default "score/max (percent%)"
   * text shown in the preview — used by sources that carry only a percent
   * (e.g. the live gradebook, where "90%" is clearer than "90/undefined (90%)").
   */
  function applyScores(roster, entries, pointsPossible, manualMap) {
    var lookup = rosterLookup(roster);
    var manual = manualMap ? manualLookup(roster, manualMap) : null;
    var matched = [],
      unmatched = [],
      gradeByIndex = {};
    entries.forEach(function (e) {
      var grade = scaleGrade(e.percent, e.score, pointsPossible);
      var idx = matchIndex(lookup, e.name);
      if (idx < 0 && manual) {
        var mk = norm(e.name);
        if (mk in manual) idx = manual[mk];
      }
      var label = e.label != null ? e.label : e.score + "/" + e.max + " (" + e.percent + "%)";
      if (idx >= 0) {
        gradeByIndex[idx] = grade;
        matched.push({
          name: roster[idx].name,
          code: label,
          grade: grade,
          rosterIndex: idx,
        });
      } else {
        unmatched.push({
          name: e.name || "(no name)",
          code: label,
          grade: grade,
        });
      }
    });
    var missing = roster
      .map(function (s, i) {
        return i in gradeByIndex ? null : s.name;
      })
      .filter(Boolean);
    return {
      matched: matched,
      unmatched: unmatched,
      gradeByIndex: gradeByIndex,
      missing: missing,
    };
  }

  /** Build a minimal Canvas-import grid from the roster + grades. */
  function buildImportCsv(roster, assignmentName, pointsPossible, gradeByIndex) {
    var out = [
      ["Student", "ID", "SIS Login ID", "Section", assignmentName],
      ["    Points Possible", "", "", "", pointsPossible != null ? String(pointsPossible) : ""],
    ];
    roster.forEach(function (stu, i) {
      out.push([
        stu.name,
        stu.id,
        stu.sis,
        stu.section,
        i in gradeByIndex ? String(gradeByIndex[i]) : "",
      ]);
    });
    return out;
  }

  /** Decode pasted completion codes (needs window.NeftCanvasCodec). */
  function decodeCodes(text) {
    var lines = String(text || "")
      .split("\n")
      .map(function (l) {
        return l.trim();
      })
      .filter(Boolean);
    var valid = [],
      forged = [],
      junk = [],
      seen = {};
    lines.forEach(function (line) {
      var res = global.NeftCanvasCodec.decode(line);
      if (res.ok) {
        var key = norm(res.payload.n) + "|" + (res.payload.a || "");
        if (seen[key]) return;
        seen[key] = 1;
        valid.push(res.payload);
      } else if (res.reason === "checksum") forged.push(res.code || line);
      else junk.push(line);
    });
    return { valid: valid, forged: forged, junk: junk };
  }

  var api = {
    ROSTER_KEY: ROSTER_KEY,
    parseCSV: parseCSV,
    serializeCSV: serializeCSV,
    norm: norm,
    nameKeys: nameKeys,
    rosterLookup: rosterLookup,
    matchIndex: matchIndex,
    loadRoster: loadRoster,
    saveRoster: saveRoster,
    MANUAL_MAP_KEY: MANUAL_MAP_KEY,
    loadManualMap: loadManualMap,
    saveManualMap: saveManualMap,
    manualLookup: manualLookup,
    SETTINGS_KEY: SETTINGS_KEY,
    loadSettings: loadSettings,
    saveSettings: saveSettings,
    readCanvasGrid: readCanvasGrid,
    scaleGrade: scaleGrade,
    applyScores: applyScores,
    buildImportCsv: buildImportCsv,
    decodeCodes: decodeCodes,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.NeftGradeCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
