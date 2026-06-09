/*
 * Thinking Trails — Evidence Layer
 * Reusable, local-first student-thinking capture for Neft Teacher HTML activities.
 *
 * Privacy: all data stays in the student's browser (IndexedDB, with a localStorage
 * fallback). Nothing is sent to any server or third party. Data leaves the device
 * only when the user explicitly exports a CSV or prints a report.
 *
 * Public API (window.Evidence):
 *   startSession({ studentNameOrCode, lessonId, activityId, standard, skillFocus, languageSupport })
 *   logAttempt({ problemId, skill, prompt, studentAnswer, correctAnswer, result,
 *                hintUsed, attempts, explanation, misconceptionTag, timestamp })
 *   endSession()
 *   getSessionSummary()
 *   clearSession()
 *   exportCSV()
 *   renderReport(container)
 *
 * Companion files (load before this one is fine; methods resolve helpers lazily):
 *   export-utils.js   -> window.EvidenceCSV
 *   report-renderer.js-> window.EvidenceReport
 *   misconception-tags.json (fetched on demand)
 */
(function (global) {
  "use strict";

  var DB_NAME = "neft-thinking-trails";
  var DB_VERSION = 1;
  var STORE = "sessions";
  var LS_KEY = "neft-evidence-sessions-v1";
  var TAGS_URL = "/shared/evidence/misconception-tags.json";

  // In-memory current session. Persisted to storage after every change so a
  // refresh or crash never loses captured thinking.
  var current = null;
  var dbPromise = null;
  var tagsCache = null;

  /* ----------------------------- id + time helpers ----------------------- */

  function safeRandom() {
    try {
      if (global.crypto && typeof global.crypto.randomUUID === "function") {
        return global.crypto.randomUUID();
      }
    } catch (e) {
      /* fall through */
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function nowISO() {
    try {
      return new Date().toISOString();
    } catch (e) {
      return "" + Date.now();
    }
  }

  /* ----------------------------- IndexedDB layer ------------------------- */

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      if (!global.indexedDB) {
        reject(new Error("no-indexeddb"));
        return;
      }
      var req;
      try {
        req = global.indexedDB.open(DB_NAME, DB_VERSION);
      } catch (e) {
        reject(e);
        return;
      }
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "sessionId" });
        }
      };
      req.onsuccess = function () {
        resolve(req.result);
      };
      req.onerror = function () {
        reject(req.error || new Error("indexeddb-open-failed"));
      };
    });
    return dbPromise;
  }

  function idbPut(session) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put(session);
        tx.oncomplete = function () {
          resolve(true);
        };
        tx.onerror = function () {
          reject(tx.error);
        };
      });
    });
  }

  /* ----------------------------- localStorage fallback ------------------- */

  function lsReadAll() {
    try {
      var raw = global.localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function lsPut(session) {
    try {
      var all = lsReadAll();
      all[session.sessionId] = session;
      global.localStorage.setItem(LS_KEY, JSON.stringify(all));
      return true;
    } catch (e) {
      return false;
    }
  }

  // Persist current session: try IndexedDB, fall back to localStorage. Never throws.
  function persist(session) {
    if (!session) return Promise.resolve(false);
    return idbPut(session).catch(function () {
      return lsPut(session);
    });
  }

  /* ----------------------------- tag loading ----------------------------- */

  function loadTags() {
    if (tagsCache) return Promise.resolve(tagsCache);
    if (!global.fetch) return Promise.resolve(null);
    return global
      .fetch(TAGS_URL, { cache: "force-cache" })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (data) {
        tagsCache = data && Array.isArray(data.tags) ? data : { tags: [] };
        return tagsCache;
      })
      .catch(function () {
        return null;
      });
  }

  function lookupTag(id) {
    if (!id || !tagsCache || !tagsCache.tags) return null;
    for (var i = 0; i < tagsCache.tags.length; i++) {
      if (tagsCache.tags[i].id === id) return tagsCache.tags[i];
    }
    return null;
  }

  /* ----------------------------- explanation scoring --------------------- */

  // Simple, transparent heuristic — not AI scoring.
  var MATH_VOCAB = [
    "mean",
    "average",
    "median",
    "mode",
    "range",
    "order",
    "ordered",
    "middle",
    "divide",
    "divided",
    "add",
    "added",
    "sum",
    "subtract",
    "subtracted",
    "most",
    "appears",
    "repeat",
    "repeats",
    "biggest",
    "smallest",
    "largest",
    "least",
    "greatest",
    "count",
    "data",
    "set",
    "value",
    "values",
    "number",
    "numbers",
    "because",
  ];

  function wordCount(text) {
    if (!text) return 0;
    var t = ("" + text).trim();
    if (!t) return 0;
    return t.split(/\s+/).length;
  }

  function hasMathVocab(text) {
    if (!text) return false;
    var lower = ("" + text).toLowerCase();
    for (var i = 0; i < MATH_VOCAB.length; i++) {
      if (lower.indexOf(MATH_VOCAB[i]) !== -1) return true;
    }
    return false;
  }

  // Returns { level, label, words, hasVocab }
  function scoreExplanation(text) {
    var words = wordCount(text);
    var vocab = hasMathVocab(text);
    var level, label;
    if (words === 0) {
      level = "missing";
      label = "Missing explanation";
    } else if (words <= 5) {
      level = "too_short";
      label = "Too short";
    } else if (words <= 12) {
      level = "basic";
      label = "Basic explanation";
    } else {
      level = vocab ? "strong" : "developing";
      label = vocab ? "Stronger explanation" : "Detailed (add math words)";
    }
    return { level: level, label: label, words: words, hasVocab: vocab };
  }

  /* ----------------------------- public API ------------------------------ */

  function startSession(opts) {
    opts = opts || {};
    // Preload tags so report language is ready by session end (non-blocking).
    loadTags();
    current = {
      sessionId: safeRandom(),
      studentNameOrCode:
        ("" + (opts.studentNameOrCode || "Student")).trim() || "Student",
      lessonId: opts.lessonId || "",
      activityId: opts.activityId || "",
      activityTitle: opts.activityTitle || "",
      standard: opts.standard || "",
      skillFocus: opts.skillFocus || "",
      languageSupport: opts.languageSupport || "",
      startedAt: nowISO(),
      endedAt: null,
      attempts: [],
    };
    persist(current);
    return current.sessionId;
  }

  function logAttempt(entry) {
    if (!current) {
      // Defensive: auto-start an anonymous session rather than dropping data.
      startSession({ studentNameOrCode: "Student" });
    }
    entry = entry || {};
    var explanation = entry.explanation == null ? "" : "" + entry.explanation;
    var record = {
      problemId: entry.problemId == null ? "" : "" + entry.problemId,
      skill: entry.skill || "",
      prompt: entry.prompt || "",
      studentAnswer:
        entry.studentAnswer == null ? "" : "" + entry.studentAnswer,
      correctAnswer:
        entry.correctAnswer == null ? "" : "" + entry.correctAnswer,
      result: entry.result || "incorrect",
      hintUsed: !!entry.hintUsed,
      attempts: typeof entry.attempts === "number" ? entry.attempts : 1,
      explanation: explanation,
      misconceptionTag: entry.misconceptionTag || "",
      explanationScore: scoreExplanation(explanation),
      timestamp: entry.timestamp || nowISO(),
    };
    current.attempts.push(record);
    persist(current);
    return record;
  }

  function endSession() {
    if (!current) return null;
    current.endedAt = nowISO();
    persist(current);
    return getSessionSummary();
  }

  function getSessionSummary() {
    if (!current) return null;
    var a = current.attempts;
    var total = a.length;
    var correct = 0;
    var hints = 0;
    var bySkill = {};
    var tagCounts = {};
    var solvedNotExplained = 0;

    for (var i = 0; i < total; i++) {
      var r = a[i];
      var isCorrect = r.result === "correct";
      if (isCorrect) correct++;
      if (r.hintUsed) hints++;
      var s = r.skill || "general";
      if (!bySkill[s])
        bySkill[s] = { skill: s, total: 0, correct: 0, hints: 0 };
      bySkill[s].total++;
      if (isCorrect) bySkill[s].correct++;
      if (r.hintUsed) bySkill[s].hints++;
      if (r.misconceptionTag) {
        tagCounts[r.misconceptionTag] =
          (tagCounts[r.misconceptionTag] || 0) + 1;
      }
      if (
        isCorrect &&
        r.explanationScore &&
        (r.explanationScore.level === "missing" ||
          r.explanationScore.level === "too_short")
      ) {
        solvedNotExplained++;
      }
    }

    var skills = Object.keys(bySkill).map(function (k) {
      var b = bySkill[k];
      b.accuracy = b.total ? Math.round((b.correct / b.total) * 100) : 0;
      return b;
    });
    skills.sort(function (x, y) {
      return y.accuracy - x.accuracy;
    });

    var topTags = Object.keys(tagCounts)
      .map(function (id) {
        return { id: id, count: tagCounts[id], tag: lookupTag(id) };
      })
      .sort(function (x, y) {
        return y.count - x.count;
      });

    return {
      sessionId: current.sessionId,
      studentNameOrCode: current.studentNameOrCode,
      lessonId: current.lessonId,
      activityId: current.activityId,
      activityTitle: current.activityTitle,
      standard: current.standard,
      skillFocus: current.skillFocus,
      languageSupport: current.languageSupport,
      startedAt: current.startedAt,
      endedAt: current.endedAt,
      totalProblems: total,
      correct: correct,
      scorePct: total ? Math.round((correct / total) * 100) : 0,
      hintCount: hints,
      hintRate: total ? Math.round((hints / total) * 100) : 0,
      solvedNotExplained: solvedNotExplained,
      skills: skills,
      topMisconceptions: topTags,
      attempts: a.slice(),
    };
  }

  function getCurrentSession() {
    return current;
  }

  function clearSession() {
    var id = current ? current.sessionId : null;
    current = null;
    // Remove from both stores; ignore failures.
    try {
      var all = lsReadAll();
      if (id && all[id]) {
        delete all[id];
        global.localStorage.setItem(LS_KEY, JSON.stringify(all));
      }
    } catch (e) {
      /* ignore */
    }
    if (id) {
      openDB()
        .then(function (db) {
          var tx = db.transaction(STORE, "readwrite");
          tx.objectStore(STORE).delete(id);
        })
        .catch(function () {});
    }
    return true;
  }

  function exportCSV() {
    var summary = getSessionSummary();
    if (!summary) return "";
    if (global.EvidenceCSV && typeof global.EvidenceCSV.build === "function") {
      return global.EvidenceCSV.build(summary);
    }
    return "";
  }

  function downloadCSV(filename) {
    var csv = exportCSV();
    if (!csv) return false;
    if (
      global.EvidenceCSV &&
      typeof global.EvidenceCSV.download === "function"
    ) {
      return global.EvidenceCSV.download(
        csv,
        filename || defaultFileName("csv"),
      );
    }
    return false;
  }

  function defaultFileName(ext) {
    var s = current || {};
    var who = (s.studentNameOrCode || "student").replace(/[^a-z0-9_-]+/gi, "-");
    var act = (s.activityId || "activity").replace(/[^a-z0-9_-]+/gi, "-");
    return ("thinking-trails-" + who + "-" + act + "." + ext).toLowerCase();
  }

  function renderReport(container) {
    var summary = getSessionSummary();
    if (!container || !summary) return false;
    return loadTags().then(function () {
      // Re-read summary so tag objects resolve after async load.
      var s = getSessionSummary();
      if (
        global.EvidenceReport &&
        typeof global.EvidenceReport.render === "function"
      ) {
        global.EvidenceReport.render(container, s, {
          tags: tagsCache,
          onExportCSV: function () {
            downloadCSV();
          },
          onClear: function () {
            clearSession();
          },
        });
        return true;
      }
      return false;
    });
  }

  global.Evidence = {
    startSession: startSession,
    logAttempt: logAttempt,
    endSession: endSession,
    getSessionSummary: getSessionSummary,
    getCurrentSession: getCurrentSession,
    clearSession: clearSession,
    exportCSV: exportCSV,
    downloadCSV: downloadCSV,
    renderReport: renderReport,
    scoreExplanation: scoreExplanation,
    loadTags: loadTags,
    lookupTag: lookupTag,
    defaultFileName: defaultFileName,
  };
})(typeof window !== "undefined" ? window : this);
