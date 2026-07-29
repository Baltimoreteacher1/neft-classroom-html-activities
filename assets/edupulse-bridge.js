/**
 * edupulse-bridge.js — wires graded Neft activities into the classroom gradebook.
 *
 * DESTINATION CHANGED 2026-07-29. This used to POST to a separate Cloudflare
 * Worker (edupulse-gradebook-api) with an x-ingest-key. That Worker's secret and
 * the key shipped in assets/edupulse-config.js had drifted apart, so every write
 * 401'd: 37 graded activities — every game on the site wired to report — recorded
 * NOTHING, silently, for weeks. The audit that found it is
 * `npm run audit:scores`.
 *
 * Rather than rotate the key and keep two score backends, this now writes to the
 * same-origin /api/scores, i.e. `game_scores` in neft-student-progress — the
 * table engine3d games and the Practice Arcade already use, and the one every
 * reader (npm run brief, usage-report, insight engine) actually reads. The old
 * Worker held 4 rows from 2 test students, last written 2026-06-11; it was never
 * used in production. See [[project_game_score_wiring_gap]].
 *
 * The public API is UNCHANGED, so none of the 37 pages needed an edit.
 *
 * WHAT IT DOES
 *   1. Ships the EWLScoreBridge client (POSTs score events to same-origin
 *      /api/scores; no key, no cross-origin request, no preflight).
 *   2. Auto-wraps the two shared assessment kits so any activity built on either
 *      reports a gradebook event with NO per-activity scoring changes:
 *        - window.NTResults.finish()  (assets/nt-results.js)
 *        - window.NTKit.grade()       (assets/nt-activity-kit.js)
 *   3. Exposes window.EduPulse.{identify,record} so bespoke (non-kit) games and
 *      quizzes can opt in with a single line on their final-score event.
 *
 * GUARANTEES
 *   - NEVER blocks or breaks an activity: all reporting is fire-and-forget and
 *     wrapped in try/catch. If the network fails, the activity behaves exactly
 *     as before.
 *   - Always on: there is no key and nothing to configure. If D1 is unbound the
 *     endpoint answers 503 and the failure is swallowed here.
 *   - Duplicate-safe ACROSS RELOADS: identical final submissions collapse to one
 *     record per student/activity/score/day. /api/scores does a plain INSERT, so
 *     this is enforced client-side (see alreadySent/markSent) rather than by the
 *     server as it was on the old Worker. Different real attempts still record.
 *   - No student identity leaves the page: name, studentId and class period are
 *     used locally for Canvas codes and roster autofill but are NOT sent.
 *     `game_scores` has no name column and this must not add one.
 *   - Co-exists with nt-sync.js: both wrap the kits independently and chain
 *     through to the original.
 */
(function (global) {
  "use strict";

  /* ==========================================================================
   * NeftIdentity — ONE student identity shared by every sync on the site.
   *
   * Hosted here because edupulse-bridge.js loads on every graded page, so a
   * name + class typed ONCE anywhere (a lesson cover screen, a Save/Resume
   * panel, an activity kit) is written through to every legacy store. Then:
   *   - grade sync (EduPulse)            picks up the real name/section,
   *   - the save-code gradebook roster   auto-fills (no teacher re-typing),
   *   - curriculum lesson-progress sync  gets a stable student key.
   *
   * Reads merge across all known stores, so identity set in one place is found
   * in every other. Idempotent + fail-safe: if localStorage is unavailable it
   * degrades to today's behavior. Privacy is unchanged — this only consolidates
   * the same name/section the gradebook already receives; it never invents data.
   * Other scripts use it as an optional enhancement (window.NeftIdentity?.set),
   * so nothing breaks on the rare page where this file is absent.
   * ======================================================================== */
  if (!global.NeftIdentity) {
    (function () {
      var ANON_KEY = "nt_anon_id";
      function lsGet(k) {
        try {
          return localStorage.getItem(k) || "";
        } catch (_e) {
          return "";
        }
      }
      function lsSet(k, v) {
        try {
          // Allow "" so a name/section can be explicitly cleared, not just set.
          if (v != null) localStorage.setItem(k, v);
        } catch (_e) {}
      }
      function jGet(k) {
        try {
          var r = localStorage.getItem(k);
          return r ? JSON.parse(r) : null;
        } catch (_e) {
          return null;
        }
      }
      function jSet(k, o) {
        try {
          localStorage.setItem(k, JSON.stringify(o));
        } catch (_e) {}
      }
      function clean(s, n) {
        return String(s == null ? "" : s)
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, n || 80);
      }
      function get() {
        var nt = jGet("nt_student") || {};
        var nsr = jGet("nsr:identity") || {};
        var name = clean(
          nt.alias ||
            nsr.name ||
            lsGet("edupulse_student_name") ||
            lsGet("nt_student_name") ||
            lsGet("ewl_student_name") ||
            lsGet("nt_student_ref"),
          60,
        );
        var section = clean(
          nt.section ||
            nsr.section ||
            lsGet("edupulse_class_period") ||
            lsGet("nt_class") ||
            lsGet("nt_class_code"),
          40,
        );
        return { name: name, section: section };
      }
      function set(info) {
        info = info || {};
        var cur = get();
        var name = info.name != null ? clean(info.name, 60) : cur.name;
        var section = info.section != null ? clean(info.section, 40) : cur.section;
        // Write through to every store a reader anywhere on the site consults.
        jSet("nt_student", { alias: name, section: section });
        jSet("nsr:identity", { name: name, section: section });
        lsSet("edupulse_student_name", name);
        lsSet("edupulse_class_period", section);
        lsSet("nt_student_ref", name);
        try {
          if (typeof CustomEvent === "function") {
            global.dispatchEvent(
              new CustomEvent("nt-identity-change", {
                detail: { name: name, section: section },
              }),
            );
          }
        } catch (_e) {}
        return { name: name, section: section };
      }
      function studentId() {
        var name = get().name;
        var id = name
          ? name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, "")
              .slice(0, 40)
          : "";
        if (id) return id;
        var anon = lsGet(ANON_KEY);
        if (!anon) {
          anon = "anon-" + Math.random().toString(36).slice(2, 10);
          lsSet(ANON_KEY, anon);
        }
        return anon;
      }
      global.NeftIdentity = { get: get, set: set, studentId: studentId };
    })();
  }

  /**
   * Same-origin classroom endpoint. Writes to `game_scores` in the
   * neft-student-progress D1 — the SAME table engine3d games and the Practice
   * Arcade already use, and the one `npm run brief`, scripts/usage-report.mjs
   * and the insight engine read. One score backend, not two.
   */
  const SCORES_URL = "/api/scores";

  /* -------------------- EWLScoreBridge (ported, unchanged contract) -------- */
  class EWLScoreBridge {
    constructor({ apiBase, ingestKey, deviceId } = {}) {
      this.apiBase = String(apiBase || "").replace(/\/$/, "");
      this.ingestKey = ingestKey || "";
      this.deviceId = deviceId || getDeviceId();
      this.student = {};
    }

    identify(student) {
      this.student = {
        studentId: (student && student.studentId) || "",
        studentName: (student && student.studentName) || "",
        classPeriod: (student && student.classPeriod) || "",
      };
      return this;
    }

    async record(activity) {
      activity = activity || {};
      // Same-origin now: no key to check, and nothing to be "unconfigured".
      // The endpoint degrades to 503 on its own if D1 is unbound, and the
      // caller below already swallows failures.
      const event = toGameScore(activity, this.student);
      if (!event.gameId) return { queued: false, error: "No activityId on the score event." };

      const response = await global.fetch(SCORES_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(event),
        keepalive: true,
      });
      const data = await response.json().catch(function () {
        return {};
      });
      if (!response.ok) {
        throw new Error(data.message || data.error || "Score upload failed " + response.status);
      }
      return data;
    }
  }

  /**
   * Translate a bridge score event into the classroom /api/scores contract.
   *
   * `total` is ATTEMPTS, not a score out of something — that column has been
   * misread before and the endpoint normalises on the same assumption. Map
   * problemsAttempted to it and let `points` carry the raw score, so a game
   * reporting "8 points, 6 of 10 correct" does not land as 8/10.
   *
   * Student identity is deliberately DROPPED. EduPulse stored student_name,
   * student_id and class_period; game_scores has no name column by design, and
   * this consolidation is not an excuse to add one. Only save_code (which the
   * student chooses) ties a row to a person.
   */
  function toGameScore(activity, student) {
    const attempted = numberOrNull(activity.problemsAttempted);
    const correct = numberOrNull(activity.problemsCorrect);
    const misconceptions = activity.misconceptions || [];

    return {
      gameId: String(activity.activityId || "").slice(0, 120),
      standard: String(activity.standard || "").slice(0, 120),
      level: numberOrNull(activity.level) || 1,
      points: numberOrNull(activity.score) || 0,
      correct: correct == null ? 0 : correct,
      // Fall back to maxScore only when the activity reports no item counts at
      // all; 1 keeps the endpoint's Math.max(1, …) from inventing a denominator.
      total: attempted != null ? attempted : numberOrNull(activity.maxScore) || 1,
      steps: numberOrNull(activity.durationSec) || 0,
      misconceptionTag:
        (Array.isArray(misconceptions) ? misconceptions[0] : misconceptions) || null,
      saveCode: (student && student.saveCode) || null,
      ts: activity.timestamp || new Date().toISOString(),
    };
  }

  /* -------------------- helpers -------------------- */
  function numberOrNull(v) {
    if (v === undefined || v === null || v === "") return null;
    var n = Number(v);
    return isFinite(n) ? n : null;
  }
  function uuid() {
    if (global.crypto && global.crypto.randomUUID) return global.crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0,
        v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
  function persist(key, makeVal) {
    try {
      var v = localStorage.getItem(key);
      if (v) return v;
      v = makeVal();
      localStorage.setItem(key, v);
      return v;
    } catch (_e) {
      return makeVal();
    }
  }
  function getDeviceId() {
    return persist("ewl-score-device-id", uuid);
  }
  function slug(s) {
    return String(s || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  /* tiny stable string hash for deterministic eventIds */
  function hash(s) {
    var h = 5381;
    s = String(s);
    for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }
  function dayBucket() {
    return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  }

  /* -------------------- identity -------------------- */
  /* studentId is REQUIRED by the Worker. Prefer the typed name (so the same
   * student groups in the gradebook); fall back to a persisted device id. */
  function resolveIdentity(typedName, typedPeriod) {
    var shared = (global.NeftIdentity && global.NeftIdentity.get()) || { name: "", section: "" };
    var name = (typedName || shared.name || storedName() || "").trim();
    var period = (typedPeriod || shared.section || storedPeriod() || "").trim();
    var id = slug(name) || persist("edupulse_student_id", uuid);
    return { studentId: id, studentName: name, classPeriod: period };
  }
  function storedName() {
    try {
      return (
        localStorage.getItem("edupulse_student_name") ||
        localStorage.getItem("nt_student_name") ||
        localStorage.getItem("ewl_student_name") ||
        aliasFromNtStudent() ||
        ""
      );
    } catch (_e) {
      return "";
    }
  }
  function storedPeriod() {
    try {
      return (
        localStorage.getItem("edupulse_class_period") ||
        localStorage.getItem("nt_class") ||
        localStorage.getItem("nt_class_code") ||
        sectionFromNtStudent() ||
        ""
      );
    } catch (_e) {
      return "";
    }
  }
  /* NTKit stores {alias, section} under "nt_student". */
  function ntStudent() {
    try {
      return JSON.parse(localStorage.getItem("nt_student") || "{}") || {};
    } catch (_e) {
      return {};
    }
  }
  function aliasFromNtStudent() {
    return ntStudent().alias || "";
  }
  function sectionFromNtStudent() {
    return ntStudent().section || "";
  }

  /* -------------------- activity identity (from page) -------------------- */
  function activityId() {
    try {
      var p = global.location.pathname.replace(/\/index\.html?$/i, "");
      p = p.replace(/\.html?$/i, "").replace(/^\/+|\/+$/g, "");
      return slug(p) || "root";
    } catch (_e) {
      return "activity";
    }
  }
  function activityTitle(fallback) {
    if (fallback) return String(fallback);
    var h1 = document.querySelector("h1");
    if (h1 && h1.textContent.trim()) return h1.textContent.trim();
    return (document.title || "Activity").trim();
  }

  /* -------------------- bridge singleton + duration timer -------------------- */
  var cfg = global.EDUPULSE_CONFIG || {};
  var bridge = new EWLScoreBridge({
    apiBase: cfg.apiBase,
    ingestKey: cfg.ingestKey,
  });
  var startedAt = Date.now();
  var sentHashes = {};

  /**
   * Cross-reload submission dedupe.
   *
   * The old Worker deduped server-side (INSERT OR IGNORE on a stable eventId),
   * so `sentHashes` only ever had to stop double-sends inside one page session.
   * The classroom /api/scores does a plain INSERT with no unique constraint, so
   * moving there without this would turn every reload-and-resubmit into a
   * duplicate row — silently inflating attempt counts in the one table used to
   * judge what students actually do.
   *
   * The key already carries a day bucket, so this reproduces the Worker's
   * semantics exactly: identical submission, same student, same day = once.
   * Storage failures fall back to the in-memory set (a possible duplicate beats
   * a dropped score).
   */
  var SENT_PREFIX = "nt-score-sent:";

  function alreadySent(key) {
    if (sentHashes[key]) return true;
    try {
      return localStorage.getItem(SENT_PREFIX + hash(key)) !== null;
    } catch (_e) {
      return false;
    }
  }

  function markSent(key) {
    sentHashes[key] = true;
    try {
      localStorage.setItem(SENT_PREFIX + hash(key), "1");
      pruneSentKeys();
    } catch (_e) {
      /* in-memory set still applies for this page session */
    }
  }

  /** Keep the key set bounded — a year of daily play must not fill storage. */
  function pruneSentKeys() {
    try {
      var keys = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(SENT_PREFIX) === 0) keys.push(k);
      }
      if (keys.length <= 400) return;
      keys.sort();
      for (var j = 0; j < keys.length - 300; j++) localStorage.removeItem(keys[j]);
    } catch (_e) {
      /* pruning is best-effort */
    }
  }

  /* -------------------- Canvas completion code (math only) -------------------- */
  /* The student-facing completion code is the same one the lesson engine shows.
   * It is computed entirely client-side, so — unlike the gradebook POST below —
   * it works on the public site even when no ingest key is configured. We only
   * surface it for MATH activities (the ones with matching Canvas assignments),
   * detected by a math CCSS standard on the score event or a math URL root. */
  var CANVAS_CODE_UI_SRC = "/assets/canvas-code-ui.js";
  function ensureCanvasCodeUI() {
    if (global.NeftCanvasCodeUI) return Promise.resolve(global.NeftCanvasCodeUI);
    return new Promise(function (resolve) {
      var s = document.querySelector('script[src="' + CANVAS_CODE_UI_SRC + '"]');
      if (!s) {
        s = document.createElement("script");
        s.src = CANVAS_CODE_UI_SRC;
        document.body.appendChild(s);
      }
      s.addEventListener(
        "load",
        function () {
          resolve(global.NeftCanvasCodeUI || null);
        },
        { once: true },
      );
      s.addEventListener(
        "error",
        function () {
          resolve(null);
        },
        { once: true },
      );
      if (global.NeftCanvasCodeUI) resolve(global.NeftCanvasCodeUI);
    });
  }
  function isMathContext(payload) {
    try {
      var std = String((payload && payload.standard) || "");
      if (/^\s*\d\.(NS|RP|EE|G|SP|NF|OA|MD)\b/i.test(std)) return true;
      var p = String(global.location.pathname || "");
      return /(^|\/)(math|games|math-lab-missions)(\/|$)/i.test(p);
    } catch (_e) {
      return false;
    }
  }
  function maybeShowCanvasCode(payload) {
    try {
      if (global.NT_DISABLE_CANVAS_CODE) return;
      if (!isMathContext(payload)) return;
      // Idempotent: the engine (lessons) may have already shown the same modal.
      if (document.getElementById("nt-canvas-code")) return;
      var p = payload || {};
      var id = resolveIdentity(p.studentName, p.classPeriod);
      var score = p.score != null ? p.score : p.problemsCorrect;
      var maxScore = p.maxScore != null ? p.maxScore : p.problemsAttempted;
      var data = {
        studentName: id.studentName,
        classPeriod: id.classPeriod,
        activityId: p.activityId || activityId(),
        activityTitle: activityTitle(p.activityTitle),
        score: score,
        maxScore: maxScore,
        percent: p.percent,
        stars: p.stars,
      };
      ensureCanvasCodeUI().then(function (ui) {
        if (ui && typeof ui.show === "function") ui.show(data);
      });
    } catch (_e) {
      /* never break the activity */
    }
  }

  /* Core send used by the auto-wraps and the public API. */
  function send(payload) {
    try {
      payload = payload || {};
      // Show the student their Canvas code regardless of gradebook config.
      maybeShowCanvasCode(payload);
      // No configuration gate any more: the destination is same-origin
      // /api/scores, which needs no key. The old gate gave a WRONG ingest key
      // the same shape as an absent one — the bridge looked "configured",
      // POSTed, and the Worker 401'd every time. 37 games reported nothing for
      // weeks and no gate could see it, because a silent write failure and an
      // unused feature are indistinguishable from the client.
      var id = resolveIdentity(payload.studentName, payload.classPeriod);
      var aId = payload.activityId || activityId();
      var score = payload.score != null ? payload.score : payload.problemsCorrect;
      var maxScore = payload.maxScore != null ? payload.maxScore : payload.problemsAttempted;
      var dedupeKey =
        aId +
        "|" +
        id.studentId +
        "|" +
        score +
        "|" +
        maxScore +
        "|" +
        (payload.stars != null ? payload.stars : "") +
        "|" +
        dayBucket();
      if (alreadySent(dedupeKey)) return;
      markSent(dedupeKey);
      var eventId = payload.eventId || "ev-" + hash(dedupeKey);

      bridge.identify(id);
      bridge
        .record({
          eventId: eventId,
          activityId: aId,
          activityTitle: activityTitle(payload.activityTitle),
          standard: payload.standard || "",
          score: score,
          maxScore: maxScore,
          stars: payload.stars,
          problemsCorrect: payload.problemsCorrect != null ? payload.problemsCorrect : score,
          problemsAttempted:
            payload.problemsAttempted != null ? payload.problemsAttempted : maxScore,
          misconceptions: payload.misconceptions || payload.misconception_tags || [],
          durationSec:
            payload.durationSec != null
              ? payload.durationSec
              : Math.round((Date.now() - startedAt) / 1000),
        })
        .catch(function () {
          /* fire-and-forget: never surface to the student */
        });
    } catch (_e) {
      /* swallow — reporting must never break an activity */
    }
  }

  /* -------------------- auto-wrap NTResults.finish -------------------- */
  function wrapNTResults() {
    var NT = global.NTResults;
    if (!NT || NT.__edupulseWrapped) return;
    var orig = NT.finish;
    NT.finish = function (opts) {
      try {
        orig && orig.apply(NT, arguments);
      } catch (_e) {}
      try {
        opts = opts || {};
        var sections = Array.isArray(opts.sections) ? opts.sections : [];
        var correct =
          opts.correct != null
            ? opts.correct
            : sections.reduce(function (a, s) {
                return a + (s.correct || 0);
              }, 0);
        var total =
          opts.total != null
            ? opts.total
            : sections.reduce(function (a, s) {
                return a + (s.total || 0);
              }, 0);
        send({
          studentName: opts.student,
          activityTitle: opts.assessment,
          standard: opts.standard,
          score: correct,
          maxScore: total,
          problemsCorrect: correct,
          problemsAttempted: total,
          misconceptions: opts.misconception_tags || opts.misconceptions || [],
        });
      } catch (_e) {}
    };
    NT.__edupulseWrapped = true;
  }

  /* -------------------- auto-wrap NTKit.grade -------------------- */
  function wrapNTKit() {
    var K = global.NTKit;
    if (!K || K.__edupulseWrapped || typeof K.grade !== "function") return;
    var orig = K.grade;
    K.grade = function () {
      var result = orig.apply(K, arguments);
      try {
        if (result) {
          var perItem = Array.isArray(result.perItem) ? result.perItem : [];
          var correctCount = perItem.filter(function (it) {
            return it && it.correct;
          }).length;
          var stu = typeof K.getStudent === "function" ? K.getStudent() || {} : {};
          send({
            studentName: stu.alias,
            classPeriod: stu.section,
            activityId: result.activityId,
            activityTitle: result.activityTitle,
            standard: result.standard,
            score: result.earned,
            maxScore: result.possible,
            percent: result.scorePercent,
            problemsCorrect: perItem.length ? correctCount : result.earned,
            problemsAttempted: perItem.length ? perItem.length : result.possible,
          });
        }
      } catch (_e) {}
      return result;
    };
    K.__edupulseWrapped = true;
  }

  function wrapAll() {
    wrapNTResults();
    wrapNTKit();
  }

  /* Re-attempt wraps at several lifecycle points (kits may load late). */
  wrapAll();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wrapAll);
  }
  global.addEventListener("load", wrapAll);

  /* -------------------- public API for bespoke activities -------------------- */
  global.EduPulse = {
    /** Optionally set/override identity (persists name + class period). */
    identify: function (student) {
      student = student || {};
      try {
        // Propagate to the shared identity so the same name/section reaches the
        // save-code gradebook and curriculum progress sync, not just EduPulse.
        if (global.NeftIdentity && (student.studentName || student.classPeriod)) {
          global.NeftIdentity.set({
            name: student.studentName,
            section: student.classPeriod,
          });
        }
        if (student.studentName) localStorage.setItem("edupulse_student_name", student.studentName);
        if (student.classPeriod) localStorage.setItem("edupulse_class_period", student.classPeriod);
      } catch (_e) {}
      return this;
    },
    /** Report a graded result. Call on submit / finish / win / final score. */
    record: send,
    /** Re-run the kit auto-wraps (e.g. after dynamically loading a kit). */
    rewrap: wrapAll,
    bridge: bridge,
    /** Kept for callers that probed it; same-origin reporting is always on. */
    _configured: function () {
      return true;
    },
  };

  global.EWLScoreBridge = EWLScoreBridge;
})(window);
