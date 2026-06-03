/**
 * edupulse-bridge.js — wires graded Neft activities into the EduPulse gradebook.
 *
 * WHAT IT DOES
 *   1. Ships the EWLScoreBridge client (POSTs score events to the deployed
 *      Cloudflare Worker at EDUPULSE_CONFIG.apiBase, header x-ingest-key).
 *   2. Auto-wraps the two shared assessment kits so any activity built on either
 *      reports a gradebook event with NO per-activity scoring changes:
 *        - window.NTResults.finish()  (teacher-tools/nt-results.js)
 *        - window.NTKit.grade()       (assets/nt-activity-kit.js)
 *   3. Exposes window.EduPulse.{identify,record} so bespoke (non-kit) games and
 *      quizzes can opt in with a single line on their final-score event.
 *
 * GUARANTEES
 *   - NEVER blocks or breaks an activity: all reporting is fire-and-forget and
 *     wrapped in try/catch. If the key is unset or the network fails, the
 *     activity behaves exactly as before.
 *   - Inert until configured: with the placeholder ingest key the bridge is a
 *     no-op (the Worker would 401, so we skip the call entirely).
 *   - Duplicate-safe: identical final submissions collapse to one stable eventId
 *     per student/activity/score/day, so the Worker's INSERT OR IGNORE dedupes
 *     repeated submits. Different real attempts (different score) still record.
 *   - studentId is always non-empty (the Worker requires it): derived from the
 *     typed student name, else a persisted per-device anonymous id.
 *   - Co-exists with nt-sync.js: both wrap the kits independently and chain
 *     through to the original. Different backends, no conflict.
 *
 * The ADMIN_KEY is never referenced here. Only the write-only ingest key is used.
 */
(function (global) {
  "use strict";

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
      if (!this.apiBase || !configured(this.ingestKey)) {
        return { queued: false, error: "Score bridge not configured." };
      }
      const event = {
        eventId: activity.eventId || uuid(),
        timestamp: activity.timestamp || new Date().toISOString(),
        studentId: this.student.studentId || activity.studentId || "",
        studentName: this.student.studentName || activity.studentName || "",
        classPeriod: this.student.classPeriod || activity.classPeriod || "",
        activityId: activity.activityId || "",
        activityTitle: activity.activityTitle || "",
        standard: activity.standard || "",
        score: numberOrNull(activity.score),
        maxScore: numberOrNull(activity.maxScore),
        percent:
          activity.percent != null
            ? activity.percent
            : calculatePercent(activity.score, activity.maxScore),
        stars: numberOrNull(activity.stars),
        problemsCorrect: numberOrNull(activity.problemsCorrect),
        problemsAttempted: numberOrNull(activity.problemsAttempted),
        misconceptions: activity.misconceptions || [],
        durationSec: numberOrNull(activity.durationSec),
        deviceId: this.deviceId,
      };
      const response = await global.fetch(this.apiBase + "/api/scores", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-ingest-key": this.ingestKey,
        },
        body: JSON.stringify({ events: [event] }),
        keepalive: true,
      });
      const data = await response.json().catch(function () {
        return {};
      });
      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Score upload failed " + response.status,
        );
      }
      return data;
    }
  }

  /* -------------------- helpers -------------------- */
  function configured(key) {
    return !!key && key !== "PASTE_INGEST_KEY_HERE";
  }
  function calculatePercent(score, maxScore) {
    var s = Number(score),
      m = Number(maxScore);
    if (!isFinite(s) || !isFinite(m) || m <= 0) return null;
    return Math.round((s / m) * 1000) / 10;
  }
  function numberOrNull(v) {
    if (v === undefined || v === null || v === "") return null;
    var n = Number(v);
    return isFinite(n) ? n : null;
  }
  function uuid() {
    if (global.crypto && global.crypto.randomUUID)
      return global.crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        var r = (Math.random() * 16) | 0,
          v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
  }
  function persist(key, makeVal) {
    try {
      var v = localStorage.getItem(key);
      if (v) return v;
      v = makeVal();
      localStorage.setItem(key, v);
      return v;
    } catch (e) {
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
    var name = (typedName || storedName() || "").trim();
    var period = (typedPeriod || storedPeriod() || "").trim();
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
    } catch (e) {
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
    } catch (e) {
      return "";
    }
  }
  /* NTKit stores {alias, section} under "nt_student". */
  function ntStudent() {
    try {
      return JSON.parse(localStorage.getItem("nt_student") || "{}") || {};
    } catch (e) {
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
    } catch (e) {
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

  /* Core send used by the auto-wraps and the public API. */
  function send(payload) {
    try {
      if (!configured(bridge.ingestKey)) return; // inert until key pasted
      payload = payload || {};
      var id = resolveIdentity(payload.studentName, payload.classPeriod);
      var aId = payload.activityId || activityId();
      var score =
        payload.score != null ? payload.score : payload.problemsCorrect;
      var maxScore =
        payload.maxScore != null ? payload.maxScore : payload.problemsAttempted;
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
      if (sentHashes[dedupeKey]) return; // don't spam within this page session
      sentHashes[dedupeKey] = true;
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
          problemsCorrect:
            payload.problemsCorrect != null ? payload.problemsCorrect : score,
          problemsAttempted:
            payload.problemsAttempted != null
              ? payload.problemsAttempted
              : maxScore,
          misconceptions:
            payload.misconceptions || payload.misconception_tags || [],
          durationSec:
            payload.durationSec != null
              ? payload.durationSec
              : Math.round((Date.now() - startedAt) / 1000),
        })
        .catch(function () {
          /* fire-and-forget: never surface to the student */
        });
    } catch (e) {
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
      } catch (e) {}
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
      } catch (e) {}
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
          var stu =
            typeof K.getStudent === "function" ? K.getStudent() || {} : {};
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
            problemsAttempted: perItem.length
              ? perItem.length
              : result.possible,
          });
        }
      } catch (e) {}
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
        if (student.studentName)
          localStorage.setItem("edupulse_student_name", student.studentName);
        if (student.classPeriod)
          localStorage.setItem("edupulse_class_period", student.classPeriod);
      } catch (e) {}
      return this;
    },
    /** Report a graded result. Call on submit / finish / win / final score. */
    record: send,
    /** Re-run the kit auto-wraps (e.g. after dynamically loading a kit). */
    rewrap: wrapAll,
    bridge: bridge,
    _configured: function () {
      return configured(bridge.ingestKey);
    },
  };

  global.EWLScoreBridge = EWLScoreBridge;
})(window);
