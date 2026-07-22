/**
 * Standards Shift Studio — parsing + matching engine.
 * Turns pasted "proposed standards" text into structured rows, then scores each
 * against the current registry with an IDF-weighted token similarity so the
 * drafted crosswalk survives MSDE's usual rewording. Pure functions, no DOM.
 */
(function () {
  "use strict";

  // Codes like 6.AT.1, 6.AT.A.3, 6.AT.A.3.a, 6.NOS.4, 6.RP.A.3.B
  var CODE_RE = /^(\d+(?:\.[A-Z]{1,4})(?:\.[A-Z])?(?:\.\d+)*(?:\.?[a-z])?)\b/;

  var STOPWORDS = {};
  (
    "a an and are as at be by for from in into is it its of on or that the their them " +
    "to use using understand understanding with within apply solve find given each all " +
    "two both real world mathematical problems problem including include such"
  )
    .split(/\s+/)
    .forEach(function (w) {
      STOPWORDS[w] = true;
    });

  function tokenize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/[\s-]+/)
      .filter(function (t) {
        return t.length > 2 && !STOPWORDS[t];
      })
      .map(function (t) {
        return t.replace(/(?:es|s)$/, ""); // stem-lite so "ratios" ≈ "ratio"
      });
  }

  /**
   * Parse pasted text → [{code, text, line}].
   * Accepts "CODE text", "CODE — text", "CODE, text", "CODE\ttext", or CSV rows.
   * Lines without a leading code are appended to the previous row (wrapped text).
   */
  function parseProposed(raw) {
    var rows = [];
    String(raw || "")
      .split(/\r?\n/)
      .forEach(function (line, i) {
        var s = line.trim().replace(/^"|"$/g, "");
        if (!s) return;
        var m = s.match(CODE_RE);
        if (m) {
          var rest = s
            .slice(m[0].length)
            .replace(/^[\s.:,;|—–-]+/, "")
            .trim();
          rows.push({ code: m[1], text: rest, line: i + 1 });
        } else if (rows.length) {
          rows[rows.length - 1].text += " " + s;
        }
      });
    return rows;
  }

  /** Build inverse-document-frequency weights over the registry corpus. */
  function buildIdf(standards) {
    var df = {};
    var n = 0;
    Object.keys(standards).forEach(function (code) {
      n += 1;
      var seen = {};
      tokenize(standards[code].fullText + " " + standards[code].shortLabel).forEach(function (t) {
        if (!seen[t]) {
          seen[t] = true;
          df[t] = (df[t] || 0) + 1;
        }
      });
    });
    return function idf(t) {
      return Math.log(1 + n / (1 + (df[t] || 0)));
    };
  }

  /** Weighted-overlap similarity in [0,1]. */
  function similarity(tokensA, tokensB, idf) {
    if (!tokensA.length || !tokensB.length) return 0;
    var setB = {};
    tokensB.forEach(function (t) {
      setB[t] = true;
    });
    var shared = 0;
    var totalA = 0;
    var seen = {};
    tokensA.forEach(function (t) {
      if (seen[t]) return;
      seen[t] = true;
      var w = idf(t);
      totalA += w;
      if (setB[t]) shared += w;
    });
    var totalB = 0;
    Object.keys(setB).forEach(function (t) {
      totalB += idf(t);
    });
    var denom = Math.max(totalA, totalB);
    return denom ? shared / denom : 0;
  }

  function normalizeCode(code) {
    return String(code || "").replace(/\s+/g, "");
  }

  /**
   * Collapse a code to its cluster-free short form so format-only differences
   * are recognized: "6.AT.A.3.a" → "6.AT.3a", "6.AT.A.1" → "6.AT.1".
   * The registry keys use the short form; MSDE documents often use the long one.
   */
  function collapseCode(code) {
    var segs = normalizeCode(code).split(".");
    var out = [];
    segs.forEach(function (seg) {
      if (/^[A-Z]$/.test(seg) && out.length >= 2) return; // cluster letter
      if (/^[a-z]$/.test(seg) && out.length) out[out.length - 1] += seg;
      else out.push(seg);
    });
    return out.join(".");
  }

  /** Find the registry key equivalent to a proposed code (exact or collapsed). */
  function registryEquivalent(code, model) {
    var norm = normalizeCode(code);
    if (model.standards[norm]) return norm;
    var collapsed = collapseCode(norm);
    if (model.standards[collapsed]) return collapsed;
    var hit = null;
    model.standardCodes.some(function (key) {
      if (collapseCode(key) === collapsed) {
        hit = key;
        return true;
      }
      return false;
    });
    return hit;
  }

  /**
   * Match every proposed row against the registry.
   * Returns rows decorated with candidates[{code, score}] and an auto verdict:
   *   unchanged — same code, text clearly the same standard
   *   reworded  — same code, text drifted (worth re-reading)
   *   recode    — different code, text clearly matches one current standard
   *   review    — plausible match, needs the teacher's eye
   *   new       — nothing in the current curriculum matches
   */
  function matchAll(proposedRows, model) {
    var idf = buildIdf(model.standards);
    var registryTokens = {};
    model.standardCodes.forEach(function (code) {
      var s = model.standards[code];
      registryTokens[code] = tokenize(s.fullText + " " + s.shortLabel);
    });

    var rows = proposedRows.map(function (row) {
      var pTokens = tokenize(row.text);
      var candidates = model.standardCodes
        .map(function (code) {
          return { code: code, score: similarity(pTokens, registryTokens[code], idf) };
        })
        .sort(function (a, b) {
          return b.score - a.score;
        })
        .slice(0, 5);

      var codeMatch = registryEquivalent(row.code, model);
      var top = candidates[0] || { code: null, score: 0 };
      var verdict;
      var mappedTo;
      if (codeMatch) {
        var selfScore = similarity(pTokens, registryTokens[codeMatch], idf);
        mappedTo = codeMatch;
        verdict = !row.text || selfScore >= 0.55 ? "unchanged" : "reworded";
      } else if (top.score >= 0.72) {
        mappedTo = top.code;
        verdict = "recode";
      } else if (top.score >= 0.42) {
        mappedTo = top.code;
        verdict = "review";
      } else {
        mappedTo = null;
        verdict = "new";
      }
      return {
        code: normalizeCode(row.code),
        text: row.text,
        line: row.line,
        candidates: candidates,
        autoMappedTo: mappedTo,
        autoVerdict: verdict,
      };
    });

    return rows;
  }

  /**
   * Resolve rows + teacher overrides into the final mapping.
   * decisions: { [proposedCode]: currentCodeOr"__new__" }
   * Returns { rows, mappedCurrent:Set-like {}, dropped:[currentCode…] }.
   */
  function resolve(rows, decisions, model) {
    var mappedCurrent = {};
    var resolved = rows.map(function (row) {
      var choice = decisions[row.code];
      var mappedTo = choice === "__new__" ? null : choice || row.autoMappedTo;
      var verdict = row.autoVerdict;
      if (choice === "__new__") verdict = "new";
      else if (choice && choice !== row.autoMappedTo) {
        verdict = choice === row.code ? "unchanged" : "recode";
      }
      if (mappedTo) mappedCurrent[mappedTo] = row.code;
      return {
        code: row.code,
        text: row.text,
        candidates: row.candidates,
        mappedTo: mappedTo,
        verdict: verdict,
        overridden: !!choice,
      };
    });
    var dropped = model.standardCodes.filter(function (code) {
      return !mappedCurrent[code];
    });
    return { rows: resolved, mappedCurrent: mappedCurrent, dropped: dropped };
  }

  window.ShiftMatch = {
    parseProposed: parseProposed,
    matchAll: matchAll,
    resolve: resolve,
    tokenize: tokenize,
  };
})();
