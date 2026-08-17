/**
 * scorm-sco.js — the EduWonderLab SCORM Runtime v2 shell.
 *
 * This is the single implementation of the SCO that ships inside every Canvas
 * SCORM package (/api/scorm and the CLI builders both call `sco()`), split out
 * of scorm.js because it grew from a passive iframe into an actual runtime.
 *
 * WHAT THIS FILE OWNS (the "wrapper" half of the contract):
 *   LMS discovery + initialization, an event queue that survives a late-arriving
 *   Canvas API, the loading state, launching the LIVE lesson, the versioned
 *   lesson-ready handshake, bounded retries, failure classification (including
 *   Cloudflare Access), progress/score/completion forwarding, resume, iframe
 *   sizing, diagnostics and safe shutdown.
 *
 * WHAT THE LESSON OWNS: the mathematics, the instructional sequence, the
 *   interactions, feedback, scaffolds and completion criteria. The wrapper never
 *   decides whether a student is done; it translates what the lesson says into
 *   SCORM 1.2 fields.
 *
 * ARCHITECTURE: the package holds NO lesson content. It iframes the live lesson
 * on eduwonderlab.com, so improving a lesson reaches every already-uploaded
 * Canvas assignment without a re-upload. See docs/scorm-runtime.md.
 *
 * Web-runtime only (Workers + Node 18+): no Node APIs here.
 */

/**
 * The runtime shell's own version. Bump when the SHELL changes in a way a
 * teacher would have to re-download a package to receive.
 */
export const SCORM_RUNTIME_VERSION = 2;

/**
 * The lesson ↔ wrapper message protocol version. Bump only on a change to the
 * message SHAPES below. Kept separate from the runtime version because the
 * runtime can improve without the protocol moving, and a v2 wrapper must keep
 * talking to a lesson that still speaks v1.
 *
 * COMPATIBILITY CONTRACT (docs/scorm-runtime.md):
 *   - A message with no `protocol` field is protocol 1. Runtime v2 accepts it
 *     in full: `ready`, `score` and `state` are unchanged from v1.
 *   - A v1 wrapper receiving a v2-only message (`height`, `heartbeat`,
 *     `progress`, `error`) ignores it — its handler switches on known types and
 *     falls through. So live-side protocol additions are safe to deploy ahead
 *     of the packages that understand them.
 *   - A message whose `protocol` is GREATER than this runtime understands is
 *     handled on its v1 subset and recorded in diagnostics, never dropped
 *     wholesale: a newer lesson must not break an older uploaded package.
 */
export const SCORM_PROTOCOL_VERSION = 2;

// SCORM 1.2 data-model limits (CMIString4096 / CMIString255). Writing past these
// is undefined behaviour — some LMS truncate silently, some reject the SetValue
// outright — so the SCO refuses rather than gambling.
export const SUSPEND_DATA_LIMIT = 4096;
export const LESSON_LOCATION_LIMIT = 255;
export const MASTERY_SCORE = 70;

/**
 * Student-facing reference codes. A student never troubleshoots; the code exists
 * so a teacher can tell Joel WHICH failure happened without reading a console.
 */
export const ERROR_CODES = {
  ACCESS: "EWL-SCORM-ACCESS", // origin reachable, content gated (Cloudflare Access)
  LOAD: "EWL-SCORM-LOAD", // network/HTTP failure reaching the lesson
  TIMEOUT: "EWL-SCORM-TIMEOUT", // origin healthy, lesson never rendered in time
  LMS: "EWL-SCORM-LMS", // LMS refused the SCORM session (diagnostic only)
};

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Build the SCO document.
 *
 * @param {string} lessonUrl   absolute live lesson URL (already normalized)
 * @param {string} launchQuery query string appended at launch (?lms=scorm&embed=1)
 * @param {string} origin      the lesson's origin — the ONLY origin whose
 *                             messages are trusted, and the only one we post to
 * @param {string} title       canonical, human-readable activity title
 * @param {object} [meta]      non-sensitive package metadata, embedded as a
 *                             <meta> block so a package can be diagnosed later
 */
export function sco(lessonUrl, launchQuery, origin, title, meta = {}) {
  const t = esc(title);
  const metaTags = Object.entries({
    "ewl:runtime": String(SCORM_RUNTIME_VERSION),
    "ewl:protocol": String(SCORM_PROTOCOL_VERSION),
    "ewl:activity-id": meta.id || "",
    "ewl:target": lessonUrl,
    "ewl:generated": meta.generatedAt || "",
    "ewl:generator": meta.generator || "",
  })
    .filter(([, v]) => v)
    .map(([n, v]) => `    <meta name="${esc(n)}" content="${esc(v)}" />`)
    .join("\n");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="robots" content="noindex" />
${metaTags}
    <title>${t}</title>
    <style>
      /* Chromebook-first: dvh so a mobile/tablet browser toolbar cannot crop the
         lesson, with vh as the fallback for older Chromebook builds. */
      html, body { margin: 0; height: 100%; background: #fff; }
      body { font: 16px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: #1f2933; }
      #ewl-frame { position: relative; height: 100vh; height: 100dvh; }
      #lesson { border: 0; width: 100%; height: 100%; display: block; background: #fff; }
      /* The lesson is revealed only on a completed handshake (or a proven
         render), so a half-painted page never flashes at a student. */
      #lesson[data-state="pending"] { visibility: hidden; }
      .ewl-panel {
        position: absolute; inset: 0; display: grid; place-items: center;
        padding: 1.5rem; background: #f4f7f7; text-align: center;
      }
      .ewl-panel[hidden] { display: none; }
      .ewl-card { max-width: 26rem; }
      .ewl-spinner {
        width: 44px; height: 44px; margin: 0 auto 1rem; border-radius: 50%;
        border: 4px solid #cfe0df; border-top-color: #0d7a76;
        animation: ewl-spin 900ms linear infinite;
      }
      @keyframes ewl-spin { to { transform: rotate(360deg); } }
      @media (prefers-reduced-motion: reduce) {
        .ewl-spinner { animation: none; border-top-color: #0d7a76; opacity: 0.85; }
      }
      .ewl-title { margin: 0 0 0.35rem; font-size: 1.15rem; font-weight: 700; }
      .ewl-sub { margin: 0.35rem 0 0; color: #52606d; font-size: 0.95rem; }
      .ewl-sub[hidden] { display: none; }
      .ewl-btn {
        margin-top: 1.1rem; min-height: 44px; padding: 0.6rem 1.5rem;
        font: inherit; font-weight: 700; color: #fff; background: #0d7a76;
        border: 0; border-radius: 8px; cursor: pointer;
      }
      .ewl-btn:hover { background: #0a615e; }
      .ewl-btn:focus-visible { outline: 3px solid #7c2d12; outline-offset: 3px; }
      .ewl-code { margin-top: 0.9rem; color: #7b8794; font-size: 0.8rem; letter-spacing: 0.03em; }
      @media (prefers-color-scheme: dark) {
        html, body, #lesson { background: #12181a; }
        body { color: #e6eceb; }
        .ewl-panel { background: #12181a; }
        .ewl-sub { color: #9aa5b1; }
      }
    </style>
  </head>
  <body>
    <div id="ewl-frame">
      <!-- SCORM 1.2 Runtime v2 shell. Plays the LIVE lesson, so a lesson edit
           reaches this package without a re-upload. ?lms=scorm relays the score
           to Canvas and hides the code popup; ?embed=1 alone keeps the prompt. -->
      <iframe id="lesson" data-state="pending" data-src="${esc(lessonUrl)}${esc(launchQuery)}"
              allow="fullscreen; clipboard-write" title="${t}"></iframe>

      <div class="ewl-panel" id="ewl-loading" role="status" aria-live="polite">
        <div class="ewl-card">
          <div class="ewl-spinner" aria-hidden="true"></div>
          <p class="ewl-title">Loading your math lesson…</p>
          <p class="ewl-sub" id="ewl-loading-more" hidden>Still loading. This can take a few seconds.</p>
        </div>
      </div>

      <div class="ewl-panel" id="ewl-failed" role="alert" hidden>
        <div class="ewl-card">
          <p class="ewl-title">We couldn't load your lesson.</p>
          <p class="ewl-sub">Check your internet connection, then try again. If it keeps happening, tell your teacher.</p>
          <button type="button" class="ewl-btn" id="ewl-retry">Try Again</button>
          <p class="ewl-code" id="ewl-code"></p>
        </div>
      </div>
    </div>

    <noscript><p style="padding:1rem">This activity needs JavaScript enabled.
      <a href="${esc(lessonUrl)}">Open the activity directly</a>.</p></noscript>

    <script>
      (function () {
        "use strict";
        var RUNTIME = ${SCORM_RUNTIME_VERSION};
        var PROTOCOL = ${SCORM_PROTOCOL_VERSION};
        var LESSON_ORIGIN = "${esc(origin)}";
        var MASTERY = ${MASTERY_SCORE};
        var SUSPEND_LIMIT = ${SUSPEND_DATA_LIMIT};
        var LOCATION_LIMIT = ${LESSON_LOCATION_LIMIT};
        var CODES = ${JSON.stringify(ERROR_CODES)};

        // Timing. Every one of these is a bound, not a delay: nothing waits for
        // a timer before doing work it could do now.
        // ?ewlfast=1 compresses every wait to 1/100th. It exists so the runtime
        // scenario suite can drive real timeouts in about a second instead of
        // forty, testing the SHIPPED code rather than a re-implementation of it.
        // Same class of opt-in affordance as ?scormdebug=1: it is never on for a
        // student, it reveals nothing, and the only thing it can do is make the
        // shell give up sooner.
        var FAST = /(?:^|[?&])ewlfast=1(?:&|$)/.test(location.search) ? 100 : 1;
        var SLOW_HINT_MS = 6000 / FAST;   // "Still loading" secondary line
        var HANDSHAKE_MS = 12000 / FAST;  // lesson rendered but never said it was ready
        var LOAD_MS = 20000 / FAST;       // iframe never fired load at all
        var RETRY_DELAYS = [2000 / FAST, 6000 / FAST]; // bounded: two, then recovery UI

        var DEBUG = /(?:^|[?&])scormdebug=1(?:&|$)/.test(location.search);
        var diag = {
          runtime: RUNTIME, protocol: PROTOCOL, lessonProtocol: 0,
          state: "boot", apiFound: false, initialized: false, attempts: 0,
          status: "", score: null, suspendBytes: 0, location: "",
          lastCommit: null, lastError: "", errorCode: "", writes: 0, failures: 0,
          queued: 0, height: 0, lastHeartbeat: null, events: [],
        };
        function log(kind, detail) {
          diag.events.push({ t: Date.now(), kind: kind, detail: detail || "" });
          if (diag.events.length > 200) diag.events.shift();
          if (DEBUG) { try { console.info("[ewl-scorm] " + kind + (detail ? " — " + detail : "")); } catch (e) {} }
        }
        window.EduWonderLabScorm = function () { return diag; };
        // Kept for anything already reading the v1 handle.
        window.NeftScormDiagnostics = window.EduWonderLabScorm;
        log("runtime started", "v" + RUNTIME + " protocol " + PROTOCOL);

        // ---------------------------------------------------------------
        // LMS discovery + initialization
        // ---------------------------------------------------------------
        // Canvas does not always have window.API in place when the SCO's first
        // script runs. A one-shot search at boot is how a lesson reports a
        // perfect score into nothing — so the search RETRIES on a bounded
        // backoff, and everything the lesson says meanwhile is queued.
        var API = null, started = false, finished = false, startedAt = 0;
        var API_RETRIES = [0, 250, 750, 1500, 3000, 6000];

        function findAPI(win) {
          var tries = 0;
          while (win && tries++ < 12) {
            // Every window access is wrapped: in Canvas the SCO is commonly
            // framed cross-origin, where reading win.API or win.parent throws
            // SecurityError. An uncaught throw here would abort the runtime.
            try { if (win.API != null) return win.API; } catch (e) { break; }
            try {
              if (!win.parent || win.parent === win) break;
              win = win.parent;
            } catch (e) { break; }
          }
          return null;
        }
        function lookForApi() {
          if (API) return API;
          var found = null;
          try { found = findAPI(window); } catch (e) {}
          if (!found) { try { if (window.opener) found = findAPI(window.opener); } catch (e) {} }
          if (found) {
            API = found;
            diag.apiFound = true;
            log("LMS found");
          }
          return API;
        }
        function scheduleApiSearch(i) {
          if (i >= API_RETRIES.length) {
            if (!API) {
              // Launched outside an LMS (direct open, preview, plain hosting).
              // A SUPPORTED mode, not a failure: the lesson still runs and saves
              // locally. Say so once, calmly, and never again.
              log("no LMS API", "running without LMS reporting — progress saves locally only");
              try { console.info("[ewl-scorm] No SCORM API found. Running the activity without LMS reporting — progress saves locally only."); } catch (e) {}
            }
            return;
          }
          setTimeout(function () {
            if (lookForApi()) { start(); flushQueue(); return; }
            scheduleApiSearch(i + 1);
          }, API_RETRIES[i]);
        }

        function lastError() {
          try {
            var c = String(API.LMSGetLastError() || "0");
            if (c === "0") return "";
            var s = "", d = "";
            try { s = String(API.LMSGetErrorString(c) || ""); } catch (e) {}
            try { d = String(API.LMSGetDiagnostic(c) || ""); } catch (e) {}
            return c + (s ? " " + s : "") + (d ? " (" + d + ")" : "");
          } catch (e) { return ""; }
        }
        // SCORM 1.2 signals failure by RETURN VALUE ("false"), not by throwing,
        // so an unchecked call looks identical to a successful one — which is
        // how a lesson appears to save all period and lands nothing.
        function call(op, fn) {
          if (!API) return false;
          var ok = false;
          try { ok = String(fn()) === "true"; } catch (e) { diag.lastError = op + ": threw " + (e && e.message ? e.message : e); }
          if (!ok) {
            var err = lastError();
            if (err) diag.lastError = op + ": " + err;
            diag.failures++;
            log("LMS call failed", op + " — " + (diag.lastError || "no error code reported"));
            noteFailure();
          } else {
            diag.writes++;
          }
          return ok;
        }
        function lmsGet(key) { try { return API ? String(API.LMSGetValue(key) || "") : ""; } catch (e) { return ""; } }
        function setValue(key, val) { return call("LMSSetValue " + key, function () { return API.LMSSetValue(key, String(val)); }); }
        function commit() {
          var ok = call("LMSCommit", function () { return API.LMSCommit(""); });
          if (ok) { diag.lastCommit = new Date().toISOString(); failStreak = 0; log("LMS commit ok"); renderDebug(); }
          return ok;
        }

        function start() {
          if (!API || started) return started;
          // A refused LMSInitialize is final. SCORM 1.2 has no "already
          // initialized" code to forgive (101 is the general exception), and
          // this is the only place Initialize is ever called — the started flag
          // guarantees it — so "false" means every later call is refused too.
          if (!call("LMSInitialize", function () { return API.LMSInitialize(""); })) {
            diag.errorCode = CODES.LMS;
            log("LMS init refused", "no data will be written this session");
            return false;
          }
          started = true;
          diag.initialized = true;
          startedAt = Date.now();
          log("LMS initialized");
          // Read BEFORE writing. Blindly stamping "incomplete" on every launch
          // erases a completed/passed attempt the moment a student reopens the
          // assignment to review it — the gradebook silently loses the grade.
          var current = lmsGet("cmi.core.lesson_status");
          diag.status = current;
          if (!current || current === "not attempted" || current === "" || current === "browsed") {
            setValue("cmi.core.lesson_status", "incomplete");
            diag.status = "incomplete";
            commit();
          }
          restoreFromLms();
          renderDebug();
          return true;
        }

        // ---------------------------------------------------------------
        // Event queue — the lesson may finish before Canvas is ready
        // ---------------------------------------------------------------
        // Keyed by kind and LAST-WINS, so a burst of progress or a repeated
        // completion flushes as one write rather than a stream of duplicates.
        var queue = Object.create(null);
        function enqueue(kind, fn) {
          queue[kind] = fn;
          diag.queued = Object.keys(queue).length;
          log("queued", kind + " (LMS not ready)");
        }
        function flushQueue() {
          if (!started) return;
          var keys = Object.keys(queue);
          if (!keys.length) return;
          // Order matters: state before score before completion, so the final
          // committed record is the one the student ended on.
          keys.sort(function (a, b) {
            var w = { state: 0, score: 1, complete: 2 };
            return (w[a] == null ? 9 : w[a]) - (w[b] == null ? 9 : w[b]);
          });
          for (var i = 0; i < keys.length; i++) {
            var fn = queue[keys[i]];
            delete queue[keys[i]];
            try { fn(); } catch (e) {}
          }
          diag.queued = 0;
          log("queue flushed", keys.join(", "));
        }
        /** Run now if the LMS session is live, otherwise queue it. */
        function whenReady(kind, fn) {
          if (finished) return;
          if (!API) lookForApi();
          if (API && start()) { fn(); flushQueue(); return; }
          enqueue(kind, fn);
        }

        // ---------------------------------------------------------------
        // Score / completion
        // ---------------------------------------------------------------
        function sessionTime() {
          var s = Math.max(0, Math.round((Date.now() - (startedAt || Date.now())) / 1000));
          function p(n) { return (n < 10 ? "0" : "") + n; }
          return p(Math.floor(s / 3600)) + ":" + p(Math.floor((s % 3600) / 60)) + ":" + p(s % 60);
        }
        var lastReportedScore = null;
        function report(pct) {
          var raw = Math.max(0, Math.min(100, Math.round(pct)));
          whenReady("score", function () {
            // High-water mark. A student who reviews a finished lesson, or
            // reopens it and answers one question, otherwise overwrites a 100
            // with whatever this session happens to total.
            var prevStr = lmsGet("cmi.core.score.raw");
            var prev = Number(prevStr);
            var value = raw;
            if (prevStr !== "" && isFinite(prev) && prev > value) value = prev;
            // Duplicate completion must not spam the LMS: an unchanged score
            // with an unchanged status is a no-op, not another commit.
            var status = value >= MASTERY ? "passed" : "completed";
            var currentStatus = lmsGet("cmi.core.lesson_status");
            if (lastReportedScore === value && currentStatus === status) {
              log("duplicate completion ignored", "score " + value + " status " + status);
              return;
            }
            setValue("cmi.core.score.min", "0");
            setValue("cmi.core.score.max", "100");
            setValue("cmi.core.score.raw", String(value));
            // "passed" is a stronger claim than "completed" and must never be
            // downgraded — SCORM 1.2 has no ordering rule, so the LMS keeps
            // whatever was written last.
            if (currentStatus !== "passed" || status === "passed") {
              setValue("cmi.core.lesson_status", status);
              diag.status = status;
            }
            lastReportedScore = value;
            diag.score = value;
            commit();
            log("completion sent", "score " + value + " status " + status);
            renderDebug();
          });
        }

        // ---------------------------------------------------------------
        // Resume: suspend_data + lesson_location
        // ---------------------------------------------------------------
        var pendingState = null, saveTimer = null;
        function persistState(state, location) {
          var s = String(state == null ? "" : state);
          if (s.length > SUSPEND_LIMIT) {
            // Refuse rather than truncate: half a JSON payload restores as
            // garbage, and a lesson that resumes WRONG is worse than one that
            // resumes empty. The lesson-side compactor keeps payloads under
            // budget; this is the backstop, and it is never silent.
            log("suspend_data refused", s.length + " chars exceeds the SCORM 1.2 limit of " + SUSPEND_LIMIT);
            diag.lastError = "suspend_data too large (" + s.length + " > " + SUSPEND_LIMIT + ")";
            diag.failures++;
            return false;
          }
          whenReady("state", function () {
            setValue("cmi.suspend_data", s);
            diag.suspendBytes = s.length;
            if (location != null) {
              var loc = String(location).slice(0, LOCATION_LIMIT);
              setValue("cmi.core.lesson_location", loc);
              diag.location = loc;
            }
            commit();
            renderDebug();
          });
          return true;
        }
        // Coalesce: a lesson emits state on every answered item, and hammering
        // LMSCommit per keystroke is what makes an LMS throttle or stall.
        function queueState(state, location) {
          pendingState = { state: state, location: location };
          if (saveTimer) return;
          saveTimer = setTimeout(function () {
            saveTimer = null;
            var p = pendingState; pendingState = null;
            if (p) persistState(p.state, p.location);
          }, 3000);
        }
        function flushState() {
          if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
          var p = pendingState; pendingState = null;
          if (p) persistState(p.state, p.location);
        }
        var lessonReady = false;
        function restoreFromLms() {
          if (!lessonReady || !started) return;
          var s = lmsGet("cmi.suspend_data");
          var loc = lmsGet("cmi.core.lesson_location");
          diag.suspendBytes = s.length;
          diag.location = loc;
          if (!s && !loc) return;
          post({ source: "neft-sco", type: "restore", protocol: PROTOCOL, runtime: RUNTIME, state: s, location: loc });
          log("resume sent", s.length + " chars, location " + (loc || "-"));
        }
        function post(msg) {
          try {
            var f = document.getElementById("lesson");
            if (f && f.contentWindow) f.contentWindow.postMessage(msg, LESSON_ORIGIN);
          } catch (e) {}
        }

        function finish() {
          if (!API || !started || finished) return;
          flushState();
          flushQueue();
          setValue("cmi.core.session_time", sessionTime());
          commit();
          call("LMSFinish", function () { return API.LMSFinish(""); });
          finished = true;
          log("LMS finished");
          renderDebug();
        }

        // ---------------------------------------------------------------
        // Loading, launch, handshake, retry, failure
        // ---------------------------------------------------------------
        var loadingEl = document.getElementById("ewl-loading");
        var slowEl = document.getElementById("ewl-loading-more");
        var failedEl = document.getElementById("ewl-failed");
        var codeEl = document.getElementById("ewl-code");
        var frame = document.getElementById("lesson");
        var slowTimer = null, handshakeTimer = null, loadTimer = null;
        var iframeLoaded = false, attempt = 0, settled = false;

        function clearTimers() {
          [slowTimer, handshakeTimer, loadTimer].forEach(function (t) { if (t) clearTimeout(t); });
          slowTimer = handshakeTimer = loadTimer = null;
        }
        function showLoading() {
          diag.state = "loading";
          settled = false;
          failedEl.hidden = true;
          loadingEl.hidden = false;
          slowEl.hidden = true;
          frame.setAttribute("data-state", "pending");
        }
        function showLesson(why) {
          if (settled) return;
          settled = true;
          clearTimers();
          diag.state = "ready";
          loadingEl.hidden = true;
          failedEl.hidden = true;
          frame.setAttribute("data-state", "ready");
          log("lesson ready", why);
        }
        function showFailure(code, why) {
          if (settled && diag.state === "ready") return; // never yank a working lesson
          settled = true;
          clearTimers();
          diag.state = "failed";
          diag.errorCode = code;
          loadingEl.hidden = true;
          failedEl.hidden = false;
          codeEl.textContent = "Reference: " + code;
          frame.setAttribute("data-state", "pending");
          log("lesson failed", code + " — " + (why || ""));
          try { document.getElementById("ewl-retry").focus(); } catch (e) {}
        }

        /**
         * Classify a launch that did not complete. Cloudflare Access is called
         * out specifically: a hostname-wide Access app once broke every Canvas
         * SCORM assignment in production, and "the lesson didn't load" is not a
         * diagnosis anyone can act on.
         *
         * The probe is a public JSON endpoint with permissive CORS. If it
         * answers, the origin is up AND ungated. If it does not, a no-cors
         * request tells apart "host unreachable" (throws) from "host reachable
         * but the response was intercepted" (resolves, commonly as an opaque
         * redirect toward *.cloudflareaccess.com).
         */
        function classifyFailure(done) {
          var probe = LESSON_ORIGIN + "/api/scorm-probe";
          var timer = setTimeout(function () { finishWith(CODES.TIMEOUT, "probe timed out"); }, 6000);
          var settledProbe = false;
          function finishWith(code, why) {
            if (settledProbe) return;
            settledProbe = true;
            clearTimeout(timer);
            done(code, why);
          }
          try {
            fetch(probe, { cache: "no-store", credentials: "omit" })
              .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error("probe HTTP " + r.status)); })
              .then(function (j) {
                // Origin is public and healthy — so this was the lesson itself
                // being slow or failing to render, not an access problem.
                if (j && j.ok) finishWith(CODES.TIMEOUT, "origin healthy, lesson never rendered");
                else finishWith(CODES.ACCESS, "probe answered but not with the runtime contract");
              })
              .catch(function (e) {
                // The probe was blocked or rewritten. Is the HOST reachable?
                fetch(LESSON_ORIGIN + "/", { mode: "no-cors", redirect: "manual", cache: "no-store", credentials: "omit" })
                  .then(function (r) {
                    // Reachable but intercepted. An opaqueredirect is the
                    // Access sign-in bounce; an opaque 200 whose JSON contract
                    // vanished is the Access interstitial served in place.
                    finishWith(CODES.ACCESS, "origin reachable but gated (" + (r && r.type) + ") after " + (e && e.message));
                  })
                  .catch(function () { finishWith(CODES.LOAD, "origin unreachable: " + (e && e.message)); });
              });
          } catch (e) { finishWith(CODES.LOAD, "probe threw: " + (e && e.message)); }
        }

        function giveUp() {
          classifyFailure(function (code, why) { showFailure(code, why); });
        }

        function onHandshakeTimeout() {
          // The lesson RENDERED but never spoke. Two causes, and they need
          // opposite responses: a page that predates the canvas bridge (or a
          // standalone activity without it) is working perfectly and must NOT be
          // replaced with an error card; a blank/blocked frame must be retried.
          // The iframe load event is the discriminator we have cross-origin.
          if (iframeLoaded) {
            diag.lastError = "handshake timeout — lesson rendered without announcing LESSON_READY";
            showLesson("degraded: rendered, no handshake (resume relay unavailable)");
            log("handshake timeout", "degraded mode — score/resume relay depends on the lesson");
            return;
          }
          retryOrFail("handshake timed out with no iframe load");
        }

        function retryOrFail(why) {
          if (attempt - 1 < RETRY_DELAYS.length) {
            var delay = RETRY_DELAYS[attempt - 1];
            log("retry scheduled", "attempt " + (attempt + 1) + " in " + delay + "ms — " + why);
            clearTimers();
            setTimeout(launch, delay);
            return;
          }
          log("retries exhausted", why);
          giveUp();
        }

        function launch() {
          attempt++;
          diag.attempts = attempt;
          iframeLoaded = false;
          showLoading();
          // Start the LMS session and the lesson request together. Neither waits
          // on the other: the queue covers a late API, and the loading panel is
          // already painted, so nothing is delayed merely to show a spinner.
          if (!API) lookForApi();
          start();
          var base = frame.getAttribute("data-src");
          var name = normalizeName(lmsGet("cmi.core.student_name"));
          var sid = lmsGet("cmi.core.student_id");
          var sep = base.indexOf("?") > -1 ? "&" : "?";
          var q = "";
          // Canvas identity → live lesson, so the student is auto-identified
          // inside Canvas: no name-entry screen, resume keyed to the roster.
          if (name) q += sep + "sn=" + encodeURIComponent(name);
          if (sid) q += (q ? "&" : sep) + "si=" + encodeURIComponent(sid);
          // Cache-bust retries only. The first attempt must be cacheable.
          if (attempt > 1) q += (q ? "&" : sep) + "ewlretry=" + attempt;
          log("lesson requested", "attempt " + attempt);
          frame.src = base + q;

          slowTimer = setTimeout(function () { slowEl.hidden = false; }, SLOW_HINT_MS);
          handshakeTimer = setTimeout(onHandshakeTimeout, HANDSHAKE_MS);
          loadTimer = setTimeout(function () {
            if (!iframeLoaded && !settled) retryOrFail("iframe never loaded");
          }, LOAD_MS);
        }

        // SCORM 1.2 returns the name as "Last, First"; normalize to "First Last".
        function normalizeName(raw) {
          raw = (raw || "").trim();
          if (!raw) return "";
          var c = raw.indexOf(",");
          if (c > -1) return (raw.slice(c + 1).trim() + " " + raw.slice(0, c).trim()).trim();
          return raw;
        }

        frame.addEventListener("load", function () {
          iframeLoaded = true;
          log("iframe load", "attempt " + attempt);
        });
        document.getElementById("ewl-retry").addEventListener("click", function () {
          attempt = 0;
          log("student retried");
          launch();
        });

        // ---------------------------------------------------------------
        // The lesson ↔ wrapper protocol
        // ---------------------------------------------------------------
        var ALLOWED = { ready: 1, score: 1, state: 1, progress: 1, location: 1, height: 1, heartbeat: 1, error: 1 };
        window.addEventListener("message", function (e) {
          // Origin first, always. Anything else is an untrusted frame that
          // happens to be able to reach this window, and it must never be able
          // to write a grade.
          if (!LESSON_ORIGIN || e.origin !== LESSON_ORIGIN) return;
          var d = e.data;
          if (!d || typeof d !== "object") return;
          if (d.source !== "neft-lesson") return;
          var type = String(d.type || "");
          if (!ALLOWED[type]) { log("message ignored", "unknown type " + type); return; }
          // Protocol 1 messages carry no version field and are fully supported.
          var p = Number(d.protocol) || 1;
          if (p > diag.lessonProtocol) diag.lessonProtocol = p;

          if (type === "ready") {
            lessonReady = true;
            showLesson("handshake complete (lesson protocol " + p + ")");
            start();
            restoreFromLms();
            post({ source: "neft-sco", type: "hello", protocol: PROTOCOL, runtime: RUNTIME });
          } else if (type === "score") {
            if (typeof d.percent !== "number" || !isFinite(d.percent)) { log("message ignored", "score without a finite percent"); return; }
            report(d.percent);
          } else if (type === "progress") {
            if (typeof d.percent !== "number" || !isFinite(d.percent)) return;
            diag.score = Math.max(0, Math.min(100, Math.round(d.percent)));
          } else if (type === "state") {
            if (d.state != null && typeof d.state !== "string") return;
            queueState(d.state, d.location);
          } else if (type === "location") {
            if (typeof d.location !== "string") return;
            queueState(pendingState ? pendingState.state : lmsGet("cmi.suspend_data"), d.location);
          } else if (type === "height") {
            applyHeight(d.px);
          } else if (type === "heartbeat") {
            diag.lastHeartbeat = new Date().toISOString();
            // A heartbeat proves the lesson is alive even if it never handshook.
            if (!settled) showLesson("heartbeat");
          } else if (type === "error") {
            log("lesson reported an error", String(d.detail || "").slice(0, 200));
          }
        });

        /**
         * Height reporting. Inside Canvas the SCO's own frame is a fixed size
         * the page cannot change, and filling it is correct — growing the inner
         * iframe there only creates a second scrollbar. So the reported height
         * is validated and recorded always, and APPLIED only when this document
         * is the top-level window (direct launch / preview), where the body can
         * actually grow.
         */
        function applyHeight(px) {
          var n = Number(px);
          if (!isFinite(n)) return;
          n = Math.round(n);
          if (n < 200 || n > 20000) { log("height ignored", "out of bounds: " + n); return; }
          diag.height = n;
          var top = false;
          try { top = window.self === window.top; } catch (e) { top = false; }
          if (!top) return;
          document.getElementById("ewl-frame").style.height = n + "px";
        }

        // ---------------------------------------------------------------
        // Student-facing save warning (distinct from a load failure)
        // ---------------------------------------------------------------
        // A 7th grader must never read "LMSSetValue error 351". They do need to
        // know their work may not be reaching the course, so they can tell the
        // teacher instead of assuming it saved.
        var failStreak = 0, noticeShown = false;
        function noteFailure() {
          if (++failStreak < 3 || noticeShown) return;
          noticeShown = true;
          try {
            var n = document.createElement("div");
            // Id unchanged from Runtime v1 on purpose: it is the handle the
            // lifecycle test and any support doc reach for, and renaming it
            // would be churn that silently unpins a check.
            n.id = "nt-scorm-notice";
            n.setAttribute("role", "status");
            n.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:2147483647;" +
              "background:#fff4e5;border-top:2px solid #d97706;color:#7c2d12;padding:10px 14px;" +
              "font:600 14px/1.4 system-ui,-apple-system,Segoe UI,sans-serif;text-align:center;";
            n.textContent = "Your lesson is still open and you can keep working — but your progress may not be saving to the course right now. Let your teacher know.";
            (document.body || document.documentElement).appendChild(n);
          } catch (e) {}
        }

        function renderDebug() {
          if (!DEBUG) return;
          try {
            var el = document.getElementById("ewl-scorm-debug");
            if (!el) {
              el = document.createElement("pre");
              el.id = "ewl-scorm-debug";
              el.style.cssText = "position:fixed;right:8px;bottom:8px;z-index:2147483647;margin:0;" +
                "max-width:22rem;background:rgba(17,24,39,.92);color:#d1fae5;padding:8px 10px;" +
                "border-radius:8px;font:12px/1.45 ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap;";
              (document.body || document.documentElement).appendChild(el);
            }
            el.textContent = "EduWonderLab SCORM Runtime v" + RUNTIME + "\\n" +
              "state       : " + diag.state + (diag.errorCode ? " (" + diag.errorCode + ")" : "") + "\\n" +
              "attempts    : " + diag.attempts + "\\n" +
              "lesson proto: " + (diag.lessonProtocol || "-") + "\\n" +
              "api found   : " + diag.apiFound + "\\n" +
              "initialized : " + diag.initialized + "\\n" +
              "queued      : " + diag.queued + "\\n" +
              "status      : " + (diag.status || "-") + "\\n" +
              "score.raw   : " + (diag.score == null ? "-" : diag.score) + "\\n" +
              "suspend     : " + diag.suspendBytes + "/" + SUSPEND_LIMIT + " chars\\n" +
              "location    : " + (diag.location || "-") + "\\n" +
              "last commit : " + (diag.lastCommit || "-") + "\\n" +
              "writes/fail : " + diag.writes + "/" + diag.failures + "\\n" +
              "last error  : " + (diag.lastError || "-");
          } catch (e) {}
        }

        // unload is unreliable (bfcache, mobile task-switching, LMS frame swaps),
        // so it is the LAST line of defence, not the strategy: pagehide and the
        // hidden transition both flush first, and state is committed as it
        // arrives rather than only at the end.
        document.addEventListener("visibilitychange", function () {
          if (document.visibilityState === "hidden") { flushState(); if (started && !finished) commit(); }
        });
        window.addEventListener("pagehide", finish);
        window.addEventListener("unload", finish);

        // A brief network drop must not destroy a lesson that already loaded.
        window.addEventListener("online", function () { log("network online"); flushQueue(); });
        window.addEventListener("offline", function () { log("network offline"); });

        scheduleApiSearch(0);
        launch();
        renderDebug();
      })();
    </script>
  </body>
</html>
`;
}
