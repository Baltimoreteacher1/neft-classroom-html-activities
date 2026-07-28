/*
 * EduWonderLab — Shared Learning Evidence System (v1)
 * =============================================================================
 * ONE normalized, versioned shape for "something meaningful happened in a
 * learning activity", so Number Realm, lessons, games, projects, and
 * assessments can all feed the same progress views, teacher tools, and
 * recommendation loop without each surface inventing its own record format.
 *
 * WHAT THIS IS NOT
 *   - Not a replacement for any existing store. Save/Resume
 *     (shared/save-resume/save-resume-engine.js), Thinking Trails
 *     (shared/evidence/evidence-layer.js), the Number Realm hero profile
 *     (math-rpg/engine/profile.js), and the portfolio all keep their own
 *     formats and keep working untouched.
 *   - Not a required dependency. An activity that never calls record() is
 *     simply invisible to the evidence layer; nothing breaks.
 *
 * HOW IT CONNECTS
 *   Adapters read an existing store and normalize what is meaningful into
 *   evidence events. Adapters are additive and read-only with respect to the
 *   store they wrap, so an adapter can never corrupt the original data.
 *
 * PRIVACY
 *   - Local-first: events live in this browser's localStorage, under one key.
 *   - The learner id is PSEUDONYMOUS. It is derived from the save/resume code
 *     or the initials + section the student already typed, hashed, and
 *     truncated. A full legal name is never stored in an evidence event, and
 *     `writtenExplanation` is the only free-text field (it is student
 *     mathematical reasoning, not personal information).
 *   - Nothing is transmitted. Data leaves the device only when a person
 *     explicitly exports it.
 *   - No third-party anything. No console logging of event contents.
 *
 * JUDGE / DEMO MODE
 *   useSynthetic(dataset) swaps the backing store for an in-memory synthetic
 *   dataset. While synthetic mode is on, record() never touches localStorage,
 *   so a demonstration can never write into — or read out of — a real
 *   student's data. isSynthetic() is true and every event carries
 *   `synthetic: true`.
 *
 * PUBLIC API (window.EWLEvidence)
 *   record(event)                  -> normalized event (or null if dropped)
 *   all(filter)                    -> array of normalized events
 *   summary(filter)                -> aggregate rollup for progress surfaces
 *   byStandard()                   -> { standardId: rollup }
 *   learnerId()                    -> pseudonymous id for this device
 *   setLearner({ learnerId, classId })
 *   registerAdapter(name, fn)      -> fn() returns raw events to normalize
 *   sync()                         -> run every registered adapter once
 *   exportJSON() / exportCSV()
 *   useSynthetic(dataset) / clearSynthetic() / isSynthetic()
 *   clear()                        -> wipe local evidence (explicit action only)
 *   EVENT_TYPES, SCHEMA_VERSION
 * =============================================================================
 */
(function (global) {
  "use strict";
  if (global.EWLEvidence) return;

  var SCHEMA_VERSION = 1;
  var STORE_KEY = "ewl:evidence:v1";
  var LEARNER_KEY = "ewl:evidence:learner:v1";
  var MAX_EVENTS = 2000; // ring buffer; oldest events drop first

  /* Every event type the system understands. `validate:registries` asserts
   * that data/curriculum-canonical.json's evidenceEventTypes are all present
   * here, so the registry and the runtime cannot drift apart. */
  var EVENT_TYPES = [
    "activity_started",
    "activity_completed",
    "item_attempted",
    "hint_requested",
    "explanation_written",
    "confidence_rated",
    "support_used",
    "mastery_updated",
    "project_checkpoint",
    "project_submitted",
    "portfolio_saved",
    "recommendation_shown",
    "recommendation_accepted",
    "intervention_result",
    "assessment_scored",
    "badge_earned",
  ];

  var MASTERY_LEVELS = ["not_started", "novice", "developing", "proficient", "advanced"];
  var COMPLETION_STATUSES = ["not_started", "in_progress", "completed", "abandoned"];

  /* ---------------------------------------------------------------- storage */

  var synthetic = null; // when set, an in-memory array replaces the real store

  function lsGet(key) {
    try {
      return global.localStorage.getItem(key);
    } catch (_e) {
      return null;
    }
  }

  function lsSet(key, value) {
    try {
      global.localStorage.setItem(key, value);
      return true;
    } catch (_e) {
      return false;
    }
  }

  /* The persisted envelope carries its own version so a future v2 can migrate
   * v1 rows in place instead of discarding a student's history. */
  function readStore() {
    if (synthetic) return synthetic.events;
    var raw = lsGet(STORE_KEY);
    if (!raw) return [];
    var parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (_e) {
      return [];
    }
    return migrate(parsed);
  }

  function writeStore(events) {
    if (synthetic) {
      synthetic.events = events;
      return true;
    }
    var trimmed = events.length > MAX_EVENTS ? events.slice(events.length - MAX_EVENTS) : events;
    return lsSet(STORE_KEY, JSON.stringify({ v: SCHEMA_VERSION, events: trimmed }));
  }

  /**
   * Versioned migration. Two shapes are accepted:
   *   - a bare array  (pre-envelope; treated as v1 rows)
   *   - { v, events } (current)
   * An unknown FUTURE version is left alone and reported as empty rather than
   * being mangled — a newer tab must not lose data to an older one.
   */
  function migrate(parsed) {
    if (Array.isArray(parsed)) {
      return parsed.map(function (e) {
        return normalize(e, { migrating: true });
      });
    }
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.events)) return [];
    var version = Number(parsed.v) || 1;
    if (version > SCHEMA_VERSION) return [];
    // v1 is the first version; when v2 lands, transform v1 rows here.
    return parsed.events.map(function (e) {
      return normalize(e, { migrating: true });
    });
  }

  /* --------------------------------------------------------------- identity */

  /* A small, stable, non-reversible-in-practice hash. This is a pseudonymity
   * measure for on-device keys, not a security control — there is nothing
   * secret to protect here because the data never leaves the device on its own. */
  function shortHash(input) {
    var str = String(input || "");
    var h1 = 0x811c9dc5;
    var h2 = 0x01000193;
    for (var i = 0; i < str.length; i++) {
      h1 = (h1 ^ str.charCodeAt(i)) >>> 0;
      h1 = (h1 * 16777619) >>> 0;
      h2 = (h2 + str.charCodeAt(i) * (i + 7)) >>> 0;
    }
    return (h1.toString(36) + h2.toString(36)).slice(0, 10);
  }

  function readJson(key, fallback) {
    var raw = lsGet(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw);
    } catch (_e) {
      return fallback;
    }
  }

  /**
   * Pseudonymous learner id for this device.
   *
   * Preference order deliberately favours identifiers that are ALREADY
   * pseudonymous: an explicit override, then the save/resume resume code, then
   * a hash of whatever initials/section the student typed. The raw name is
   * hashed, never stored.
   */
  function learnerId() {
    if (synthetic) return synthetic.learnerId;

    var stored = readJson(LEARNER_KEY, null);
    if (stored && stored.learnerId) return stored.learnerId;

    var derived = "";
    // 1. The resume code is already a pseudonym (e.g. "MATH-7KQ2").
    var nsr = readJson("nsr:identity", null);
    if (nsr && nsr.code) derived = "code:" + String(nsr.code).toUpperCase();
    // 2. Otherwise hash the initials + section the student entered.
    if (!derived && nsr && nsr.name) derived = "id:" + shortHash(nsr.name + "|" + (nsr.section || ""));
    // 3. Fall back to any existing on-device handle, hashed the same way.
    if (!derived) {
      var handle = lsGet("nt_student_ref") || lsGet("edupulse_student_name") || "";
      if (handle) derived = "id:" + shortHash(handle);
    }
    if (!derived) derived = "anon:" + shortHash(String(Date.now()) + Math.random());

    lsSet(LEARNER_KEY, JSON.stringify({ v: SCHEMA_VERSION, learnerId: derived, classId: classId() }));
    return derived;
  }

  function classId() {
    if (synthetic) return synthetic.classId;
    var stored = readJson(LEARNER_KEY, null);
    if (stored && stored.classId) return stored.classId;
    var nsr = readJson("nsr:identity", null);
    if (nsr && nsr.section) return String(nsr.section);
    var ep = lsGet("edupulse_class_period");
    return ep ? String(ep) : null;
  }

  function setLearner(opts) {
    opts = opts || {};
    if (synthetic) return;
    var current = readJson(LEARNER_KEY, {}) || {};
    lsSet(
      LEARNER_KEY,
      JSON.stringify({
        v: SCHEMA_VERSION,
        learnerId: opts.learnerId || current.learnerId || learnerId(),
        classId: opts.classId != null ? opts.classId : current.classId || null,
      }),
    );
  }

  /* ------------------------------------------------------------ normalizing */

  function num(value) {
    if (value == null || value === "") return null;
    var n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  function strArray(value) {
    if (value == null) return [];
    var arr = Array.isArray(value) ? value : [value];
    return arr
      .map(function (v) {
        return String(v).trim();
      })
      .filter(Boolean);
  }

  function oneOf(value, allowed, fallback) {
    var v = value == null ? null : String(value);
    return allowed.indexOf(v) !== -1 ? v : fallback;
  }

  function eventId() {
    try {
      if (global.crypto && typeof global.crypto.randomUUID === "function") {
        return global.crypto.randomUUID();
      }
    } catch (_e) {
      /* fall through */
    }
    return "ev-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  /**
   * Normalize an arbitrary caller-supplied object into the v1 evidence shape.
   *
   * Every field except eventType is optional by design: an activity that only
   * knows "the student finished this" should be able to say exactly that
   * without inventing a score, a confidence rating, or a mastery level.
   */
  function normalize(raw, opts) {
    opts = opts || {};
    raw = raw || {};
    var type = String(raw.eventType || raw.type || "").trim();
    if (EVENT_TYPES.indexOf(type) === -1) return null;

    return {
      v: SCHEMA_VERSION,
      eventId: raw.eventId || eventId(),
      timestamp: raw.timestamp || new Date().toISOString(),
      synthetic: Boolean(synthetic || raw.synthetic),

      learnerId: raw.learnerId || (opts.migrating ? raw.learnerId || null : learnerId()),
      classId: raw.classId != null ? String(raw.classId) : opts.migrating ? null : classId(),

      productId: raw.productId ? String(raw.productId) : null,
      activityId: raw.activityId ? String(raw.activityId) : null,
      lessonId: raw.lessonId ? String(raw.lessonId) : null,
      unitId: raw.unitId ? String(raw.unitId) : null,
      standardIds: strArray(raw.standardIds || raw.standard),

      eventType: type,
      completionStatus: oneOf(raw.completionStatus, COMPLETION_STATUSES, null),
      score: num(raw.score),
      maxScore: num(raw.maxScore),
      masteryLevel: oneOf(raw.masteryLevel, MASTERY_LEVELS, null),
      attemptCount: num(raw.attemptCount),
      hintCount: num(raw.hintCount),
      answerRevisions: num(raw.answerRevisions),
      confidenceBefore: num(raw.confidenceBefore),
      confidenceAfter: num(raw.confidenceAfter),
      writtenExplanation: raw.writtenExplanation ? String(raw.writtenExplanation) : null,
      misconceptionCodes: strArray(raw.misconceptionCodes || raw.misconceptionTag),

      supportLevel: raw.supportLevel ? String(raw.supportLevel) : null,
      languageSetting: raw.languageSetting ? String(raw.languageSetting) : null,
      readAloudUsed: raw.readAloudUsed == null ? null : Boolean(raw.readAloudUsed),
      vocabularySupportUsed:
        raw.vocabularySupportUsed == null ? null : Boolean(raw.vocabularySupportUsed),

      durationMs: num(raw.durationMs),
      projectArtifactRef: raw.projectArtifactRef ? String(raw.projectArtifactRef) : null,
      portfolioRef: raw.portfolioRef ? String(raw.portfolioRef) : null,

      recommendationSource: raw.recommendationSource ? String(raw.recommendationSource) : null,
      recommendedNextActivity: raw.recommendedNextActivity
        ? String(raw.recommendedNextActivity)
        : null,
      interventionResult: raw.interventionResult ? String(raw.interventionResult) : null,
      exportStatus: raw.exportStatus ? String(raw.exportStatus) : null,

      source: raw.source ? String(raw.source) : "direct",
    };
  }

  /* ------------------------------------------------------------------ write */

  /**
   * Record one event. Returns the normalized event, or null when the payload
   * did not name a known eventType (silently dropped — a mis-wired activity
   * must never break a lesson for a student).
   */
  function record(raw) {
    var event = normalize(raw);
    if (!event) return null;
    var events = readStore();
    // Idempotent on eventId, so an adapter can re-run without duplicating.
    for (var i = 0; i < events.length; i++) {
      if (events[i].eventId === event.eventId) return events[i];
    }
    events.push(event);
    writeStore(events);
    try {
      global.dispatchEvent(new CustomEvent("ewl:evidence", { detail: event }));
    } catch (_e) {
      /* CustomEvent unavailable — recording still succeeded */
    }
    return event;
  }

  /* ------------------------------------------------------------------- read */

  function matches(event, filter) {
    if (!filter) return true;
    if (filter.productId && event.productId !== filter.productId) return false;
    if (filter.lessonId && event.lessonId !== filter.lessonId) return false;
    if (filter.unitId && event.unitId !== filter.unitId) return false;
    if (filter.activityId && event.activityId !== filter.activityId) return false;
    if (filter.eventType && event.eventType !== filter.eventType) return false;
    if (filter.standardId && event.standardIds.indexOf(filter.standardId) === -1) return false;
    if (filter.since && event.timestamp < filter.since) return false;
    return true;
  }

  function all(filter) {
    return readStore().filter(function (e) {
      return matches(e, filter);
    });
  }

  /** Aggregate rollup used by progress surfaces and the recommendation rules. */
  function summary(filter) {
    var events = all(filter);
    var scored = events.filter(function (e) {
      return e.score != null && e.maxScore != null && e.maxScore > 0;
    });
    var totalScore = 0;
    var totalMax = 0;
    scored.forEach(function (e) {
      totalScore += e.score;
      totalMax += e.maxScore;
    });

    var confidencePairs = events.filter(function (e) {
      return e.confidenceBefore != null && e.confidenceAfter != null;
    });
    var confidenceDelta = null;
    if (confidencePairs.length) {
      var sum = 0;
      confidencePairs.forEach(function (e) {
        sum += e.confidenceAfter - e.confidenceBefore;
      });
      confidenceDelta = sum / confidencePairs.length;
    }

    var misconceptions = {};
    events.forEach(function (e) {
      e.misconceptionCodes.forEach(function (code) {
        misconceptions[code] = (misconceptions[code] || 0) + 1;
      });
    });

    return {
      events: events.length,
      completed: events.filter(function (e) {
        return e.completionStatus === "completed";
      }).length,
      percent: totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : null,
      totalScore: totalMax > 0 ? totalScore : null,
      totalMax: totalMax > 0 ? totalMax : null,
      hints: events.reduce(function (n, e) {
        return n + (e.hintCount || 0);
      }, 0),
      attempts: events.reduce(function (n, e) {
        return n + (e.attemptCount || 0);
      }, 0),
      explanations: events.filter(function (e) {
        return Boolean(e.writtenExplanation);
      }).length,
      confidenceDelta: confidenceDelta,
      misconceptions: misconceptions,
      supportsUsed: events.filter(function (e) {
        return e.eventType === "support_used";
      }).length,
      lastActivity: events.length ? events[events.length - 1].timestamp : null,
      synthetic: Boolean(synthetic),
    };
  }

  /** Per-standard rollup — the shape My Math Progress and Insight Brief want. */
  function byStandard() {
    var out = {};
    readStore().forEach(function (event) {
      event.standardIds.forEach(function (std) {
        if (!out[std]) {
          out[std] = {
            standard: std,
            events: 0,
            score: 0,
            maxScore: 0,
            hints: 0,
            attempts: 0,
            masteryLevel: null,
            lastActivity: null,
          };
        }
        var row = out[std];
        row.events += 1;
        if (event.score != null && event.maxScore != null) {
          row.score += event.score;
          row.maxScore += event.maxScore;
        }
        row.hints += event.hintCount || 0;
        row.attempts += event.attemptCount || 0;
        if (event.masteryLevel) row.masteryLevel = event.masteryLevel;
        row.lastActivity = event.timestamp;
      });
    });
    Object.keys(out).forEach(function (std) {
      var row = out[std];
      row.percent = row.maxScore > 0 ? Math.round((row.score / row.maxScore) * 100) : null;
    });
    return out;
  }

  /* --------------------------------------------------------------- adapters */

  var adapters = {};

  /**
   * Register a read-only adapter over an existing store.
   * `fn` returns an array of raw event-ish objects; they are normalized and
   * recorded like any other event. An adapter that throws is skipped — one
   * broken adapter must never stop the others.
   */
  function registerAdapter(name, fn) {
    if (typeof fn === "function") adapters[String(name)] = fn;
  }

  /**
   * Run every adapter once and record whatever is new.
   *
   * Returns only the events that were GENUINELY new. record() returns the
   * existing event for a duplicate eventId, so a caller cannot use its return
   * value to tell "recorded" from "already had it" — and adapters are designed
   * to be re-run, which makes that distinction the whole point of sync().
   */
  function sync() {
    var known = {};
    readStore().forEach(function (e) {
      known[e.eventId] = true;
    });

    var recorded = [];
    Object.keys(adapters).forEach(function (name) {
      var raw;
      try {
        raw = adapters[name]() || [];
      } catch (_e) {
        return;
      }
      (Array.isArray(raw) ? raw : [raw]).forEach(function (item) {
        if (!item) return;
        if (!item.source) item.source = name;
        if (item.eventId && known[item.eventId]) return;
        var saved = record(item);
        if (saved) {
          known[saved.eventId] = true;
          recorded.push(saved);
        }
      });
    });
    return recorded;
  }

  /* ---------------------------------------------------------------- exports */

  function exportJSON() {
    return JSON.stringify({ v: SCHEMA_VERSION, exportedAt: new Date().toISOString(), events: readStore() }, null, 2);
  }

  var CSV_COLUMNS = [
    "timestamp",
    "learnerId",
    "classId",
    "productId",
    "unitId",
    "lessonId",
    "activityId",
    "standardIds",
    "eventType",
    "completionStatus",
    "score",
    "maxScore",
    "masteryLevel",
    "attemptCount",
    "hintCount",
    "confidenceBefore",
    "confidenceAfter",
    "misconceptionCodes",
    "supportLevel",
    "languageSetting",
    "synthetic",
  ];

  function csvCell(value) {
    if (Array.isArray(value)) value = value.join(" ");
    var s = value == null ? "" : String(value);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function exportCSV() {
    var rows = [CSV_COLUMNS.join(",")];
    readStore().forEach(function (event) {
      rows.push(
        CSV_COLUMNS.map(function (col) {
          return csvCell(event[col]);
        }).join(","),
      );
    });
    return rows.join("\n");
  }

  /* ----------------------------------------------------------- judge / demo */

  /**
   * Swap in a synthetic dataset. Nothing written while synthetic mode is on
   * ever reaches localStorage, and nothing already in localStorage is readable
   * through this API — the two are completely separated.
   */
  function useSynthetic(dataset) {
    dataset = dataset || {};
    synthetic = {
      learnerId: dataset.learnerId || "demo:synthetic-learner",
      classId: dataset.classId || "demo-section",
      events: [],
    };
    (dataset.events || []).forEach(function (raw) {
      var event = normalize(raw);
      if (event) synthetic.events.push(event);
    });
    return synthetic.events.length;
  }

  function clearSynthetic() {
    synthetic = null;
  }

  function isSynthetic() {
    return Boolean(synthetic);
  }

  function clear() {
    if (synthetic) {
      synthetic.events = [];
      return;
    }
    try {
      global.localStorage.removeItem(STORE_KEY);
    } catch (_e) {
      /* nothing to remove */
    }
  }

  global.EWLEvidence = {
    SCHEMA_VERSION: SCHEMA_VERSION,
    EVENT_TYPES: EVENT_TYPES,
    MASTERY_LEVELS: MASTERY_LEVELS,
    COMPLETION_STATUSES: COMPLETION_STATUSES,
    record: record,
    all: all,
    summary: summary,
    byStandard: byStandard,
    learnerId: learnerId,
    classId: classId,
    setLearner: setLearner,
    registerAdapter: registerAdapter,
    sync: sync,
    exportJSON: exportJSON,
    exportCSV: exportCSV,
    useSynthetic: useSynthetic,
    clearSynthetic: clearSynthetic,
    isSynthetic: isSynthetic,
    clear: clear,
    // Exposed for tests and adapters; not part of the activity-facing surface.
    _normalize: normalize,
    _migrate: migrate,
  };
})(typeof window !== "undefined" ? window : globalThis);
