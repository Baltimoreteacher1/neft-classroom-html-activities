/* Neft Teacher — NTUsage: anonymous page-usage + field-error beacon.
 *
 * The instrument the site was missing. Every page that loads this reports two
 * things and nothing else:
 *   1. that this path was opened (once per page load, on hide)
 *   2. that this path threw a JS error (deduped per page load)
 *
 * It is the network-facing counterpart to assets/nt-signal.js (which is
 * device-local and never phones home). Read that file's header first: the
 * privacy posture here is the same, extended to a server that only ever stores
 * daily counters — see migrations/0004_usage_signal.sql.
 *
 * WHAT IS SENT
 *   { path, dwellMs, device }            -> POST /api/signal/view
 *   { path, message, source, line }      -> POST /api/signal/error
 * No names, no save codes, no roster ids, no cookies, no storage writes, no
 * query strings, no referrer, no user-agent string, no stack traces. `device`
 * is a 3-value width bucket. There is no client-generated id of any kind, so
 * two views from one device are indistinguishable from two devices.
 *
 * WHAT IS DELIBERATELY NOT COUNTED
 *   * Teacher-mode sessions. The question this data exists to answer is "what
 *     do STUDENTS open" — counting my own authoring passes would swamp it and
 *     make every page I edited look popular. Checked at send time, not load
 *     time, so toggling mode mid-session is honoured.
 *   * localhost / 127.0.0.1 / file: — dev traffic is not usage.
 *   * Sessions that opted out via Do Not Track.
 *
 * FAILURE POSTURE: the whole module is wrapped so it can never break a page.
 * A failed beacon is dropped, never retried, never surfaced. Uses sendBeacon
 * so it survives navigation without delaying it; there is no fetch fallback
 * on unload because a fetch there would be cancelled anyway.
 */
(function (root) {
  "use strict";
  if (!root || root.NTUsage) return;

  var doc = root.document;
  if (!doc) return;

  var VIEW_URL = "/api/signal/view";
  var ERROR_URL = "/api/signal/error";
  var MAX_ERRORS_PER_PAGE = 3; // a broken render loop must not become a flood
  var MAX_MESSAGE = 300;
  var TEACHER_MODE_KEY = "nt-teacher-mode";
  var DEDUPE_PREFIX = "nt-usage:seen:";
  /** Below this, a second view of the same path is a reload, not a revisit. */
  var REVISIT_WINDOW_MS = 30 * 60 * 1000;

  var sent = false;
  var errorCount = 0;
  var seenErrors = {};
  var visibleSince = 0;
  var dwellMs = 0;

  function isDevHost() {
    var h = root.location && root.location.hostname;
    if (root.location && root.location.protocol === "file:") return true;
    return h === "localhost" || h === "127.0.0.1" || h === "" || h === "0.0.0.0";
  }

  function optedOut() {
    try {
      var nav = root.navigator || {};
      if (nav.doNotTrack === "1" || nav.globalPrivacyControl === true) return true;
    } catch (_) {
      /* a navigator that throws is not consent — fall through to sending */
    }
    return false;
  }

  /**
   * The repo writes this key with several different truthy spellings —
   * game-fx.js and learning-supports.js compare against "1", the curriculum hub
   * stores "true", and projects-solve.js accepts any of four. Matching only one
   * spelling would silently count a whole class of teacher sessions as student
   * traffic, which is the exact bias this data exists to avoid, so accept them
   * all (the tolerant projects-solve contract).
   */
  function teacherMode() {
    try {
      // Force-student wins, mirroring learning-supports.js: there is no URL
      // backdoor INTO teacher mode, only out of it.
      var params = new URLSearchParams(root.location.search || "");
      if (params.get("student") === "1" || params.get("teacher") === "0") return false;

      var v = (root.localStorage.getItem(TEACHER_MODE_KEY) || "").toLowerCase();
      return v === "1" || v === "true" || v === "on" || v === "yes";
    } catch (_) {
      return false; // blocked storage: treat as a student, the common case
    }
  }

  /** Width buckets, not a fingerprint: three values, no UA string. */
  function device() {
    try {
      var w = root.innerWidth || 1024;
      if (w < 640) return "mobile";
      if (w < 1024) return "tablet";
      return "desktop";
    } catch (_) {
      return "desktop";
    }
  }

  function path() {
    try {
      return root.location.pathname || "/";
    } catch (_) {
      return "/";
    }
  }

  function post(url, payload) {
    if (isDevHost() || optedOut() || teacherMode()) return false;
    try {
      var body = JSON.stringify(payload);
      if (root.navigator && typeof root.navigator.sendBeacon === "function") {
        // text/plain keeps this a CORS-simple request: no preflight, which
        // would not survive unload.
        return root.navigator.sendBeacon(url, new Blob([body], { type: "text/plain" }));
      }
      if (typeof root.fetch === "function") {
        root
          .fetch(url, {
            method: "POST",
            body: body,
            keepalive: true,
            headers: { "Content-Type": "text/plain" },
          })
          .catch(function () {});
        return true;
      }
    } catch (_) {
      /* dropped */
    }
    return false;
  }

  /** Accumulate only foreground time, so a tab left open all weekend does not
   *  report a 60-hour dwell that makes the mean meaningless. */
  function accumulate() {
    if (visibleSince) {
      dwellMs += Date.now() - visibleSince;
      visibleSince = 0;
    }
  }

  /**
   * Suppress a repeat view of the same path within REVISIT_WINDOW_MS.
   *
   * The curriculum hub navigates to itself once during startup, so a single
   * student visit creates TWO documents — each with its own module instance and
   * its own `sent` flag — and reported two views. Any counter built on document
   * lifetime inherits that error, and it is the kind of 2x that quietly makes a
   * page look twice as popular as it is.
   *
   * sessionStorage survives the self-reload but not a new tab, so this collapses
   * reload storms while still counting a genuine return visit later in the day.
   * Storage failures fall through to sending: under-counting is a worse failure
   * than the occasional duplicate.
   */
  function recentlyCounted() {
    try {
      var key = DEDUPE_PREFIX + path();
      var last = Number(root.sessionStorage.getItem(key) || 0);
      var now = Date.now();
      if (last && now - last < REVISIT_WINDOW_MS) return true;
      root.sessionStorage.setItem(key, String(now));
    } catch (_) {
      /* blocked storage: count it rather than lose it */
    }
    return false;
  }

  function sendView() {
    if (sent) return;
    sent = true;
    accumulate();
    if (recentlyCounted()) return;
    post(VIEW_URL, { path: path(), dwellMs: dwellMs, device: device() });
  }

  function sendError(message, source, line) {
    if (errorCount >= MAX_ERRORS_PER_PAGE) return;
    var msg = String(message == null ? "" : message).slice(0, MAX_MESSAGE);
    if (!msg) return;
    // Dedupe within the page load: one broken component firing on every frame
    // is one fact, not five hundred.
    if (seenErrors[msg]) return;
    seenErrors[msg] = true;
    errorCount += 1;
    post(ERROR_URL, {
      path: path(),
      message: msg,
      source: String(source || "").slice(0, 200),
      line: line || 0,
    });
  }

  function onVisibility() {
    if (doc.visibilityState === "hidden") {
      sendView();
    } else if (!visibleSince) {
      visibleSince = Date.now();
    }
  }

  try {
    visibleSince = doc.visibilityState === "hidden" ? 0 : Date.now();

    // visibilitychange is the reliable one on mobile (pagehide/unload are not
    // fired consistently when the app is backgrounded); pagehide covers the
    // desktop bfcache path. sendView() is idempotent, so both may fire.
    doc.addEventListener("visibilitychange", onVisibility, { passive: true });
    root.addEventListener("pagehide", sendView, { passive: true });

    root.addEventListener(
      "error",
      function (e) {
        if (!e) return;
        // Resource load failures (img/script 404) surface here with no `message`.
        // They are real breakage, so report them with a synthetic message.
        if (e.target && e.target !== root && e.target.tagName) {
          var src = e.target.currentSrc || e.target.src || e.target.href || "";
          if (src) sendError("resource-failed: " + e.target.tagName.toLowerCase(), src, 0);
          return;
        }
        sendError(e.message, e.filename, e.lineno);
      },
      true,
    );

    root.addEventListener("unhandledrejection", function (e) {
      var r = e && e.reason;
      sendError("unhandled-rejection: " + (r && r.message ? r.message : String(r)), "", 0);
    });

    root.NTUsage = {
      /** Exposed for tests and for pages that unload without a hide event. */
      flush: sendView,
      reportError: sendError,
    };
  } catch (_) {
    /* instrumentation must never break a lesson */
  }
})(typeof window !== "undefined" ? window : null);
