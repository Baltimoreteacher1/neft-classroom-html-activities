/*
 * EduWonderLab — Thinking Trails evidence adapter
 * =============================================================================
 * READ-ONLY normalization of captured student thinking into evidence events.
 * This is the richest evidence in the system: per-attempt results, hint use,
 * misconception tags, and written explanations.
 *
 * shared/evidence/evidence-layer.js keeps its sessions exactly as it always
 * has — IndexedDB ("neft-thinking-trails" / store "sessions"), falling back to
 * localStorage["neft-evidence-sessions-v1"] when IndexedDB is unavailable. A
 * session looks like:
 *
 *   { sessionId, studentNameOrCode, lessonId, activityId, activityTitle,
 *     standard, skillFocus, languageSupport, startedAt, endedAt,
 *     attempts: [ { problemId, skill, prompt, studentAnswer, correctAnswer,
 *                   result, hintUsed, attempts, explanation,
 *                   misconceptionTag, explanationScore, timestamp } ] }
 *
 * This adapter opens that database READ-ONLY and never writes to either store.
 * Remove it and Thinking Trails is unaffected.
 *
 * ASYNC BY NECESSITY
 *   IndexedDB cannot be read synchronously, which is why the evidence layer's
 *   adapter contract accepts a Promise. Both stores are read and merged by
 *   sessionId, so a device that has used either path is covered.
 *
 * PRIVACY
 *   `studentNameOrCode` is student-entered and may be a real name. It is never
 *   copied into an evidence event — the evidence layer derives its own
 *   pseudonymous learner id. `prompt`, `studentAnswer`, and `correctAnswer` are
 *   also left behind: they are item content, not evidence about the learner,
 *   and copying them would duplicate the question bank into a progress store.
 *   Only the written EXPLANATION crosses over, because a student's reasoning is
 *   the thing a teacher needs to read.
 *
 * Load order on a page:
 *   learning-evidence.js -> this
 * =============================================================================
 */
(function (global) {
  "use strict";

  var PRODUCT_ID = "grade6-curriculum-system";
  var ADAPTER = "thinking-trails";
  var DB_NAME = "neft-thinking-trails";
  var STORE = "sessions";
  var LS_KEY = "neft-evidence-sessions-v1";

  /** Read every session out of IndexedDB. Resolves to [] on any problem. */
  function readIndexedDb() {
    return new Promise(function (resolve) {
      if (!global.indexedDB) {
        resolve([]);
        return;
      }
      var request;
      try {
        // No version argument: this must never trigger an upgrade. If the
        // database does not exist yet, we get an empty store and move on
        // rather than creating one the owning layer did not ask for.
        request = global.indexedDB.open(DB_NAME);
      } catch (_e) {
        resolve([]);
        return;
      }
      request.onerror = function () {
        resolve([]);
      };
      request.onsuccess = function () {
        var db = request.result;
        var sessions = [];
        try {
          if (!db.objectStoreNames.contains(STORE)) {
            db.close();
            resolve([]);
            return;
          }
          var tx = db.transaction(STORE, "readonly");
          var all = tx.objectStore(STORE).getAll();
          all.onsuccess = function () {
            sessions = all.result || [];
          };
          tx.oncomplete = function () {
            db.close();
            resolve(sessions);
          };
          tx.onerror = function () {
            db.close();
            resolve([]);
          };
        } catch (_e) {
          try {
            db.close();
          } catch (_err) {
            /* already closed */
          }
          resolve([]);
        }
      };
      // A blocked upgrade from another tab must not hang sync() forever.
      request.onblocked = function () {
        resolve([]);
      };
    });
  }

  function readLocalStorage() {
    try {
      var raw = global.localStorage.getItem(LS_KEY);
      var parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed)) return parsed;
      // The fallback store is keyed by sessionId in some versions.
      if (parsed && typeof parsed === "object") {
        return Object.keys(parsed).map(function (k) {
          return parsed[k];
        });
      }
      return [];
    } catch (_e) {
      return [];
    }
  }

  /** Merge both stores, preferring whichever copy has more attempts. */
  function mergeSessions(a, b) {
    var byId = {};
    a.concat(b).forEach(function (session) {
      if (!session || !session.sessionId) return;
      var prev = byId[session.sessionId];
      var count = (session.attempts || []).length;
      if (!prev || count > (prev.attempts || []).length) byId[session.sessionId] = session;
    });
    return Object.keys(byId).map(function (k) {
      return byId[k];
    });
  }

  /** Resolve a session's standard through the registry when it is available. */
  function canonicalStandard(code) {
    if (!code) return null;
    if (global.EWLRegistry && global.EWLRegistry.isLoaded()) {
      var resolved = global.EWLRegistry.resolve(code);
      if (resolved) return resolved;
    }
    return String(code);
  }

  function eventsForSession(session) {
    var events = [];
    var attempts = session.attempts || [];
    if (!attempts.length) return events;

    var standard = canonicalStandard(session.standard);
    var standardIds = standard ? [standard] : [];
    var lessonId = session.lessonId ? "lesson-" + String(session.lessonId).replace(/^lesson-/, "") : null;
    var base = {
      productId: PRODUCT_ID,
      activityId: session.activityId || session.activityTitle || "thinking-trails",
      lessonId: lessonId,
      standardIds: standardIds,
      languageSetting: session.languageSupport || null,
      source: ADAPTER,
    };
    var sid = session.sessionId;

    var correct = 0;
    var hints = 0;

    attempts.forEach(function (attempt, i) {
      var isCorrect = String(attempt.result || "").toLowerCase() === "correct";
      if (isCorrect) correct += 1;
      if (attempt.hintUsed) hints += 1;

      events.push(
        Object.assign({}, base, {
          eventId: "tt:item:" + sid + ":" + i,
          timestamp: attempt.timestamp || session.startedAt,
          eventType: "item_attempted",
          score: isCorrect ? 1 : 0,
          maxScore: 1,
          attemptCount: typeof attempt.attempts === "number" ? attempt.attempts : 1,
          hintCount: attempt.hintUsed ? 1 : 0,
          misconceptionCodes: attempt.misconceptionTag ? [attempt.misconceptionTag] : [],
        }),
      );

      if (attempt.hintUsed) {
        events.push(
          Object.assign({}, base, {
            eventId: "tt:hint:" + sid + ":" + i,
            timestamp: attempt.timestamp || session.startedAt,
            eventType: "hint_requested",
            hintCount: 1,
          }),
        );
      }

      var explanation = String(attempt.explanation || "").trim();
      if (explanation) {
        events.push(
          Object.assign({}, base, {
            eventId: "tt:explain:" + sid + ":" + i + ":" + explanation.length,
            timestamp: attempt.timestamp || session.startedAt,
            eventType: "explanation_written",
            writtenExplanation: explanation,
          }),
        );
      }
    });

    // One roll-up per finished session, so a progress view can show the session
    // without re-aggregating every attempt.
    if (session.endedAt) {
      events.push(
        Object.assign({}, base, {
          eventId: "tt:done:" + sid + ":" + correct + "/" + attempts.length,
          timestamp: session.endedAt,
          eventType: "activity_completed",
          completionStatus: "completed",
          score: correct,
          maxScore: attempts.length,
          attemptCount: attempts.length,
          hintCount: hints,
        }),
      );
    }

    return events;
  }

  function collect() {
    return Promise.all([readIndexedDb(), readLocalStorage()]).then(function (stores) {
      var sessions = mergeSessions(stores[0] || [], stores[1] || []);
      var events = [];
      sessions.forEach(function (session) {
        events = events.concat(eventsForSession(session));
      });
      return events;
    });
  }

  if (global.EWLEvidence && typeof global.EWLEvidence.registerAdapter === "function") {
    global.EWLEvidence.registerAdapter(ADAPTER, collect);
  }

  global.EWLThinkingTrailsAdapter = {
    collect: collect,
    eventsForSession: eventsForSession,
    mergeSessions: mergeSessions,
    PRODUCT_ID: PRODUCT_ID,
  };
})(typeof window !== "undefined" ? window : globalThis);
