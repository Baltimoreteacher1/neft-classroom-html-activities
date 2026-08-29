// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
/* Neft Teacher — Lesson Telemetry (additive, deploy-safe, offline-first).
 *
 * Part of the shared "lesson platform" layer (see
 * docs/superpowers/specs/INTEGRATION-CONTRACT.md). Captures lightweight,
 * privacy-minimal learning telemetry from self-contained math lessons and
 * batches it to the existing /api/progress D1 Pages Function. It is built to be
 * completely safe to drop onto any lesson:
 *
 *   - Offline-first: every event is queued in localStorage first, then flushed.
 *     If the network or D1 is unavailable (the Function returns 503 with no DB),
 *     the queue is preserved and retried later with exponential backoff. It
 *     SILENTLY no-ops on any failure — it must never break a lesson.
 *   - No PII beyond the student name the page already stores. It reads the
 *     existing localStorage["nt_student"] {name, section} written by
 *     nt-page-enhance.js; it never collects anything new.
 *   - Idempotent: loads at most once per page (window sentinel).
 *   - Respects window.NT_MUTED only insofar as it never makes noise; telemetry
 *     itself is invisible. Honors prefers-reduced-motion implicitly (no UI).
 *
 * Public API (window.NTtelemetry):
 *   track(event, props)  -> enqueue a normalized event (debounced auto-flush)
 *   flush()              -> Promise; attempt to send all queued batches now
 *   getQueue()           -> array copy of pending events (debug)
 *
 * Captured event names of interest:
 *   item_attempt, hint_used, mastery_reached, time_on_task, lesson_complete
 *
 * Page overrides (optional, set before this script runs):
 *   window.NT_TELEMETRY_CONFIG = {
 *     lessonSlug: "math-unit-1-1-1-math-is-mine",  // else derived from path
 *     standard:   "6.NOS.A.1",                       // else from .standard-badge
 *     activityTitle: "Lesson 1-1: Math is Mine",    // else document.title
 *     endpoint:   "/api/progress",                  // base path
 *     enabled:    true                              // hard off-switch
 *   };
 */
(function () {
  "use strict";
  if (window.NTtelemetry) return;

  var CFG = window.NT_TELEMETRY_CONFIG || {};

  // A driven browser is not a student. `night-shift/modules/06-lesson-render.mjs`
  // boots every live lesson on eduwonderlab.com headlessly at 2am, and the
  // Playwright gates (validate:flow-walk, validate:visibility,
  // validate:lesson-boot) each open lessons too. Every one of those page loads
  // used to write a `time_on_task` row into the production student database, so
  // `report:usage` counted robots as classes: 1,469 events and 343 phantom
  // "sessions" in the 06:00-08:00Z window, and lessons nobody had taught
  // appeared in "most-used". `navigator.webdriver` is set by every automation
  // protocol (CDP, WebDriver BiDi, Selenium) and by nothing else, so it is the
  // one honest place to draw the line. Checked once, at the enable gate, rather
  // than at each call site — one door, not eleven.
  var AUTOMATED = false;
  try {
    AUTOMATED = navigator.webdriver === true;
  } catch (_e) {
    /* ancient browser — treat as human */
  }
  var ENABLED = CFG.enabled !== false && !AUTOMATED;
  var ENDPOINT = (CFG.endpoint || "/api/progress").replace(/\/+$/, "");
  var LS_QUEUE = "nt_telemetry_q_v1"; // distinct from nsr:/nt_/gfx namespaces
  var LS_STUDENT = "nt_student"; // shared with nt-page-enhance.js (read-only)
  var MAX_QUEUE = 500; // hard cap so a stuck queue can't grow unbounded
  var BATCH_MAX = 50; // events per POST batch
  var FLUSH_DEBOUNCE = 4000; // ms; coalesce bursts of track() calls
  var BACKOFF_BASE = 5000; // ms; first retry delay
  var BACKOFF_MAX = 5 * 60 * 1000; // ms; cap retry delay at 5 min

  // ---- safe storage helpers ------------------------------------------------
  function lsGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (_e) {
      return null;
    }
  }
  function lsSet(key, val) {
    try {
      localStorage.setItem(key, val);
      return true;
    } catch (_e) {
      return false;
    }
  }

  function readQueue() {
    try {
      var raw = lsGet(LS_QUEUE);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (_e) {
      return [];
    }
  }
  function writeQueue(arr) {
    try {
      // Trim from the front (oldest) if we somehow exceed the cap.
      if (arr.length > MAX_QUEUE) arr = arr.slice(arr.length - MAX_QUEUE);
      lsSet(LS_QUEUE, JSON.stringify(arr));
    } catch (_e) {
      /* quota / serialization issue — drop silently, never throw */
    }
  }

  // ---- identity (no new PII) ----------------------------------------------
  // The shared "nt_student" record is written as { alias, section } by
  // edupulse-bridge.js, and most readers (nt-activity-kit, the curriculum
  // progress bridge) use `alias`. This module historically read `name`, so it
  // always saw undefined and every telemetry row landed with an empty
  // student_name — which is why per-student reporting had nothing to group.
  // Accept either spelling; prefer `alias` since that is what is written.
  function student() {
    try {
      var s = JSON.parse(lsGet(LS_STUDENT) || "{}");
      if (!s || typeof s !== "object") return {};
      return { name: s.alias || s.name || "", section: s.section || "" };
    } catch (_e) {
      return {};
    }
  }

  // ---- lesson identity -----------------------------------------------------
  function deriveSlug() {
    if (CFG.lessonSlug) return String(CFG.lessonSlug);
    try {
      var p = location.pathname.replace(/index\.html?$/i, "").replace(/^\/+|\/+$/g, "");
      return p ? p.replace(/[^A-Za-z0-9._/-]+/g, "-").replace(/\//g, "-") : "lesson";
    } catch (_e) {
      return "lesson";
    }
  }
  /* Normalize a standard to the canonical key used by data/ccss-standards.json
     and lessons/<id>/config.json — "6.AT.3a", "6.NOS.4", "6.GR.1".
     Page badges carry the cluster letter ("6.AT.A.3a") and the registry does
     not, so the cluster letter is dropped. Legacy CCSS codes keep their domain
     (translating RP/NS/EE -> AT/NOS needs the crosswalk table, which is not
     available client-side); only the shape is normalized. */
  function normalizeStandard(raw) {
    var s = String(raw || "").trim();
    if (!s) return "";
    // First standard-looking code in the string: 6.<DOMAIN>[.<CLUSTER>].<n><suffix>
    var m = s.match(/\b(\d)\.([A-Z]{1,3})(?:\.([A-Z]))?\.(\d+[a-z]?)\b/i);
    if (!m) return "";
    return m[1] + "." + m[2].toUpperCase() + "." + m[4].toLowerCase();
  }

  /* The stored standard is a JOIN KEY: functions/api/progress builds the teacher
     standards matrix by grouping lesson_telemetry AND game_scores into the same
     per-standard cell. This used to return raw badge TEXT, which the API then
     clamped to 20 chars — so rows landed under keys like "6.AT.C.8 · 6.AT.C.8 "
     and "6.AT · 6.DS" that matched neither game_scores ("6.GR.1") nor the
     standards registry. One standard fragmented across several cells and never
     aggregated. Prefer the explicit sources, then extract a code from the badge. */
  function deriveStandard() {
    if (CFG.standard) return normalizeStandard(CFG.standard) || String(CFG.standard).slice(0, 20);
    try {
      // The lesson platform config writes the exact code here (see
      // scripts/generate-lesson-platform-config.mjs) — the most reliable source.
      var fromGlobal = normalizeStandard(window.NT_LESSON_STANDARD);
      if (fromGlobal) return fromGlobal;

      // Runtime-rendered lessons (/lessons/<id>/) are a bare SPA shell with no
      // standard anywhere in their static HTML — engine/core/app.js sets it from
      // the lesson's config.json, already in canonical form, just before it
      // lazy-loads this module.
      var fromMeta = normalizeStandard(window.__ntLessonMeta && window.__ntLessonMeta.standard);
      if (fromMeta) return fromMeta;

      var el = document.querySelector(".standard-badge, [data-standard]");
      if (!el) return "";
      var attr = el.getAttribute && el.getAttribute("data-standard");
      return normalizeStandard(attr || el.textContent || "");
    } catch (_e) {
      return "";
    }
  }
  function deriveTitle() {
    if (CFG.activityTitle) return String(CFG.activityTitle);
    try {
      return (document.title || deriveSlug()).slice(0, 200);
    } catch (_e) {
      return deriveSlug();
    }
  }

  var SLUG = deriveSlug();
  var STANDARD = deriveStandard();
  var TITLE = deriveTitle();
  var SESSION_ID = (function () {
    try {
      return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
    } catch (_e) {
      return "s0";
    }
  })();

  // ---- core: track + enqueue ----------------------------------------------
  var flushTimer = null;
  var flushing = false;
  var backoff = 0; // current retry delay; 0 = healthy
  var retryTimer = null;

  function track(event, props) {
    if (!ENABLED || !event) return;
    try {
      var rec = {
        id: SESSION_ID + ":" + Date.now() + ":" + Math.random().toString(36).slice(2, 6),
        event: String(event).slice(0, 60),
        lessonSlug: SLUG,
        standard: STANDARD,
        session: SESSION_ID,
        ts: new Date().toISOString(),
        props: sanitizeProps(props),
      };
      var q = readQueue();
      q.push(rec);
      writeQueue(q);
      scheduleFlush();
    } catch (_e) {
      /* never throw into the lesson */
    }
  }

  // Keep props small + JSON-safe; strip anything that looks like a string
  // longer than a short answer to avoid accidental free-text PII leakage.
  function sanitizeProps(props) {
    var out = {};
    if (!props || typeof props !== "object") return out;
    try {
      var keys = Object.keys(props).slice(0, 12);
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        var v = props[k];
        if (v == null) continue;
        if (typeof v === "number" || typeof v === "boolean") {
          out[k] = v;
        } else {
          out[k] = String(v).slice(0, 120);
        }
      }
    } catch (_e) {
      /* ignore */
    }
    return out;
  }

  function scheduleFlush() {
    if (flushTimer) return;
    flushTimer = setTimeout(function () {
      flushTimer = null;
      flush();
    }, FLUSH_DEBOUNCE);
  }

  // ---- network: batched POST with offline fallback + backoff ---------------
  function online() {
    try {
      return navigator.onLine !== false;
    } catch (_e) {
      return true;
    }
  }

  function buildPayload(batch) {
    var stu = student();
    return {
      // Mirrors the /api/progress POST contract shape; telemetry rides in state.
      activityId: SLUG,
      activityTitle: TITLE,
      studentName: (stu.name || "").slice(0, 60),
      section: (stu.section || "").slice(0, 40),
      standard: STANDARD,
      kind: "telemetry",
      events: batch,
      createdAt: new Date().toISOString(),
    };
  }

  function postBatch(batch) {
    // Returns a Promise<boolean> — true on durable accept (2xx).
    if (!online() || typeof fetch !== "function") return Promise.resolve(false);
    var url = ENDPOINT + "/telemetry";
    var body;
    try {
      body = JSON.stringify(buildPayload(batch));
    } catch (_e) {
      // Unserializable batch — drop it rather than wedge the queue forever.
      return Promise.resolve(true);
    }
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body,
      keepalive: true,
      credentials: "omit",
    })
      .then(function (res) {
        // 2xx = accepted. 503 (no D1) or other 5xx = retry later. 4xx = drop
        // (bad payload won't get better) to avoid an unflushable queue.
        if (res && res.ok) return true;
        if (res && res.status >= 400 && res.status < 500) return true;
        return false;
      })
      .catch(function () {
        return false; // offline / blocked — keep for retry
      });
  }

  function scheduleRetry() {
    if (retryTimer) return;
    backoff = backoff ? Math.min(backoff * 2, BACKOFF_MAX) : BACKOFF_BASE;
    retryTimer = setTimeout(function () {
      retryTimer = null;
      flush();
    }, backoff);
  }

  function flush() {
    if (!ENABLED || flushing) return Promise.resolve();
    flushing = true;
    var q = readQueue();
    if (!q.length) {
      flushing = false;
      backoff = 0;
      return Promise.resolve();
    }
    var batch = q.slice(0, BATCH_MAX);
    return postBatch(batch)
      .then(function (ok) {
        flushing = false;
        if (ok) {
          // Remove the sent ids from whatever is currently queued.
          var sent = {};
          batch.forEach(function (r) {
            sent[r.id] = 1;
          });
          var remaining = readQueue().filter(function (r) {
            return !sent[r.id];
          });
          writeQueue(remaining);
          backoff = 0;
          if (remaining.length) return flush(); // drain the rest
        } else {
          scheduleRetry();
        }
      })
      .catch(function () {
        flushing = false;
        scheduleRetry();
      });
  }

  // ---- auto-capture wiring (best-effort, all guarded) ----------------------
  // `startTs` is page load and stays that way: `lesson_complete.time_seconds`
  // means "how long from opening the lesson to finishing it", which is elapsed
  // time, not attention.
  var startTs = Date.now();
  // `segmentTs` is the start of the CURRENT visible stretch, and it is what
  // time-on-task is measured from. Two separate bugs made the old reading
  // (which measured from `startTs` every time) untrue:
  //
  //   1. It never reset, so each hide re-reported the whole session. A student
  //      who glanced away at 5, 10 and 15 minutes contributed 5+10+15 = 30
  //      minutes of "time on task" for a 15-minute lesson, and the report SUMs.
  //   2. `pagehide` and `visibilitychange`->hidden both fire on a real tab
  //      close, so most stretches were written twice. Measured over the live
  //      table: only 2,322 of ~7,700 (session, seconds, lesson) groups were
  //      singletons; 4,705 were exact pairs and the tail ran to 27 copies.
  //
  // Resetting on emit fixes both — the second writer of a pair now measures a
  // ~0-second stretch and MIN_SEGMENT_S drops it. Time spent hidden is not time
  // on task, so returning to the tab restarts the clock rather than resuming it.
  var segmentTs = Date.now();
  // Below this, a "visit" is a page that opened and closed without a reader:
  // a prerender, a bounced tab, or the second half of a duplicate pair. Writing
  // it buys a row that can only dilute a median.
  var MIN_SEGMENT_S = 2;
  var completeSent = false;

  function emitTimeOnTask() {
    var now = Date.now();
    var dt = Math.round((now - segmentTs) / 1000);
    segmentTs = now;
    if (dt < MIN_SEGMENT_S) return false;
    track("time_on_task", { seconds: dt });
    return true;
  }

  function gradedCardsTotal() {
    try {
      return document.querySelectorAll("article.q-card[data-q]").length;
    } catch (_e) {
      return 0;
    }
  }
  function gradedCardsCorrect() {
    try {
      return document.querySelectorAll("article.q-card.correct").length;
    } catch (_e) {
      return 0;
    }
  }

  function maybeMasteryOrComplete() {
    try {
      var total = gradedCardsTotal();
      if (!total) return;
      var correct = gradedCardsCorrect();
      var pct = Math.round((correct / total) * 100);
      if (!completeSent && correct >= total) {
        completeSent = true;
        track("mastery_reached", {
          correct: correct,
          total: total,
          percent: pct,
        });
        track("lesson_complete", {
          percent: pct,
          time_seconds: Math.round((Date.now() - startTs) / 1000),
        });
        flush();
        postHubCompletion();
      }
    } catch (_e) {
      /* ignore */
    }
  }

  // ---- curriculum hub auto-complete -----------------------------------------
  // When a core lesson is finished, mirror the completion into the curriculum
  // progress store (the same one the hub's manual "Mark complete" checkmarks
  // use) so the hub auto-checks the Interactive Lesson row on its next
  // hydrate — no teacher click needed. Reuses the canonical bridge
  // (assets/curriculum-progress-bridge.js) rather than duplicating its POST
  // contract; the bridge is lazy-loaded here because lesson pages don't
  // normally ship it. Best-effort: any failure is silent.
  function coreLessonId() {
    try {
      var m = /^\/lessons\/([A-Za-z0-9._-]+)\/(?:index\.html?)?$/.exec(location.pathname);
      return m ? m[1] : "";
    } catch (_e) {
      return "";
    }
  }

  function withProgressBridge(fn) {
    if (window.CurriculumProgressBridge) {
      fn(window.CurriculumProgressBridge);
      return;
    }
    try {
      var s = document.createElement("script");
      s.src = "/assets/curriculum-progress-bridge.js";
      s.async = true;
      s.onload = function () {
        if (window.CurriculumProgressBridge) fn(window.CurriculumProgressBridge);
      };
      document.head.appendChild(s);
    } catch (_e) {
      /* never break a lesson over progress sync */
    }
  }

  function postHubCompletion() {
    var id = coreLessonId();
    if (!id) return; // not a core /lessons/<id>/ page — nothing to auto-check
    withProgressBridge(function (bridge) {
      try {
        bridge.syncToggle(id, "/lessons/" + id + "/", true);
      } catch (_e) {
        /* silent — telemetry already captured the completion */
      }
    });
  }

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  ready(function () {
    if (!ENABLED || !document.body) return;
    try {
      // Watch q-cards for graded outcome classes -> item_attempt + completion.
      if (window.MutationObserver) {
        var obs = new MutationObserver(function (muts) {
          for (var i = 0; i < muts.length; i++) {
            var t = muts[i].target;
            if (!t || t.nodeType !== 1 || typeof t.className !== "string") continue;
            if (!/\bq-card\b/.test(t.className)) continue;
            if (/\bcorrect\b/.test(t.className)) {
              track("item_attempt", {
                item: (t.getAttribute("data-q") || "").slice(0, 20),
                result: "correct",
              });
              maybeMasteryOrComplete();
            } else if (/\bincorrect\b/.test(t.className)) {
              track("item_attempt", {
                item: (t.getAttribute("data-q") || "").slice(0, 20),
                result: "incorrect",
              });
            }
          }
        });
        obs.observe(document.body, {
          subtree: true,
          attributes: true,
          attributeFilter: ["class"],
        });
      }
    } catch (_e) {
      /* observer unsupported — manual track() still works */
    }

    // Flush opportunistically on lifecycle + connectivity changes.
    try {
      window.addEventListener("online", function () {
        backoff = 0;
        flush();
      });
      var pageHide = function () {
        try {
          emitTimeOnTask();
        } catch (_e) {}
        flush();
      };
      window.addEventListener("pagehide", pageHide);
      document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "hidden") {
          pageHide();
        } else {
          // Back on the page: start a fresh stretch. Without this the minutes
          // a lesson sat behind another tab would be billed as attention.
          segmentTs = Date.now();
        }
      });
    } catch (_e) {
      /* ignore */
    }

    // Try to drain anything left from a previous (offline) session.
    flush();
  });

  window.NTtelemetry = {
    track: track,
    flush: flush,
    getQueue: function () {
      return readQueue();
    },
    version: "1.0.0",
  };
})();
