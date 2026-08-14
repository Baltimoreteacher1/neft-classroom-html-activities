/**
 * scorm.js — generate a SCORM 1.2 package (manifest + SCO) for a Neft activity,
 * entirely in memory, with a zero-dependency stored-ZIP writer.
 *
 * Used by the on-demand endpoint functions/api/scorm.js so teachers can download
 * a ready-to-upload package from the site. Mirrors tools/scorm/ (the CLI batch
 * builder); the wrapper iframes the LIVE activity, so editing a lesson never
 * requires re-downloading the package.
 *
 *   Canvas auto-grade mode (default): launches with ?lms=scorm&embed=1 — the
 *     activity relays its score to the Canvas gradebook and hides the code popup.
 *   Save-codes mode (codes:true):     launches with ?embed=1 — the save-code
 *     prompt shows, so roster + grades flow into the Google Sheets gradebook.
 *
 * Web-runtime only: TextEncoder / Uint8Array / DataView (Workers + Node 18+).
 */

import { isTeacherSurface } from "./teacher-surface.js";

/**
 * Thrown when a caller asks for a package of a teacher-only surface. A distinct
 * type so the endpoints can answer 403 rather than 400 without string-matching
 * an error message. The message is deliberately plain: it tells a teacher what
 * happened and nothing about how the gate decides.
 */
export class TeacherSurfaceError extends Error {
  constructor() {
    super("That page is teacher-only, so it can't be packaged as a student activity.");
    this.name = "TeacherSurfaceError";
    this.status = 403;
  }
}

const SITE_DEFAULT = "https://eduwonderlab.com";
// Only generate wrappers for our own site, so the endpoint can't be abused to
// package arbitrary third-party origins as SCORM.
const ALLOWED_HOSTS = ["eduwonderlab.com", "www.eduwonderlab.com"];

// Learning-supports profile keys that may be baked into a personalized package.
// Whitelisted so the launch query can only ever carry known, safe support keys.
const SUPPORT_KEYS = [
  "read-understand",
  "focus-organize",
  "build-math",
  "express-thinking",
  "language-support",
  "challenge-extend",
  // À-la-carte math tools (mirror TOOL_KEYS in learning-supports.js): a
  // personalized package may bake in individual tools without the full bundle.
  "model",
  "multchart",
  "numberline",
  "placevalue",
  "calculator",
];
const SUPPORT_LANGS = ["en", "es", "vi", "ar"];

/** Keep only recognized support keys from a comma list; returns "" if none. */
function sanitizeSupports(raw) {
  if (!raw) return "";
  return String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter((s) => SUPPORT_KEYS.includes(s))
    .join(",");
}

function sanitizeLang(raw) {
  const c = String(raw || "")
    .trim()
    .toLowerCase();
  return SUPPORT_LANGS.includes(c) && c !== "en" ? c : "";
}

function xmlEsc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Safe slug for SCORM identifiers + the download filename. */
function slug(s) {
  return (
    String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "activity"
  );
}

/**
 * Resolve a target into the live activity URL + a stable id.
 *   - "1-3"      → SITE/lessons/6-12/      (bare lesson id)
 *   - "/x/"      → SITE/x/                 (site-relative path)
 *   - full URL   → used as-is (must be on an allowed host)
 */
export function resolveTarget(target, site = SITE_DEFAULT) {
  site = site.replace(/\/$/, "");
  target = String(target || "").trim();
  if (!target) throw new Error("missing activity");
  const isUrl = /^https?:\/\//i.test(target);
  const isLessonId = !isUrl && !target.includes("/");
  let lessonUrl = isUrl
    ? target
    : isLessonId
      ? `${site}/lessons/${target}/`
      : `${site}/${target.replace(/^\/+/, "")}`;
  const u = new URL(lessonUrl);
  if (!ALLOWED_HOSTS.includes(u.hostname)) {
    throw new Error("activity must be on eduwonderlab.com");
  }
  // A student SCORM package may only ever be built from a student surface.
  // Packaging a teacher route was never a content leak — the launch URL still
  // 401s — but a teacher who uploads that package gives a class an assignment
  // that opens a password prompt, and the endpoint should not manufacture one.
  // The check runs on the PARSED, normalized path, so encoded, doubled-slash
  // and traversal spellings are judged the same as the plain one.
  if (isTeacherSurface(u.pathname)) {
    throw new TeacherSurfaceError();
  }

  // Use the PARSED href, never the caller's raw string. The raw form is echoed
  // into an HTML attribute in the SCO, so a target carrying a quote (or any
  // markup) would break out of it — `new URL()` percent-encodes those away.
  lessonUrl = u.href;
  // Build the id from the WHOLE path, not just its last segment. Every lesson's
  // homework lives at /lessons/<id>/homework.html, so a last-segment id made all
  // ~120 of them "homework-html": one SCORM identifier and one zip filename
  // shared by every homework package on the site. A teacher downloading Unit 3
  // and Unit 5 homework got two identically-named files, and an LMS that keys
  // content by manifest identifier treats them as the same activity.
  let id = slug(target);
  if (!isLessonId) {
    const segs = u.pathname.split("/").filter(Boolean);
    if (segs[segs.length - 1] === "index.html") segs.pop();
    if (segs[0] === "lessons") segs.shift(); // implied by context, and noise in a filename
    const last = segs.pop() || "activity";
    segs.push(last.replace(/\.html?$/i, ""));
    id = slug(segs.join("-"));
  }
  // Fold the recognizable query params into the id so assignables that share
  // a path (practice-arcade/?unit=1 vs ?lesson=1-3) get distinct zip
  // filenames + SCORM manifest identifiers instead of colliding.
  const qLesson = u.searchParams.get("lesson");
  const qUnit = u.searchParams.get("unit");
  if (qLesson) id = slug(id + "-lesson-" + qLesson);
  else if (qUnit) id = slug(id + "-unit-" + qUnit);
  // Auto-router package (?route=auto sends each student to their assigned
  // variant): distinct id so it never collides with the plain package's
  // zip filename or SCORM manifest identifier.
  if (u.searchParams.get("route") === "auto") id = slug(id + "-auto");
  return { lessonUrl, id, origin: u.origin };
}

// SCORM 1.2 data-model limits (CMIString4096 / CMIString255). Writing past
// these is undefined behaviour: some LMS truncate silently, some reject the
// SetValue outright, so the SCO refuses rather than gambling.
export const SUSPEND_DATA_LIMIT = 4096;
export const LESSON_LOCATION_LIMIT = 255;
export const MASTERY_SCORE = 70;

function manifest(id, title) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="NEFT-${id}" version="1.0"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="ORG-${id}">
    <organization identifier="ORG-${id}">
      <title>${title}</title>
      <item identifier="ITEM-${id}" identifierref="RES-${id}" isvisible="true">
        <title>${title}</title>
        <adlcp:masteryscore>70</adlcp:masteryscore>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="RES-${id}" type="webcontent" adlcp:scormtype="sco" href="index.html">
      <file href="index.html"/>
    </resource>
  </resources>
</manifest>
`;
}

function sco(lessonUrl, launchQuery, origin, title) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      html, body { margin: 0; height: 100%; background: #fff; }
      #lesson { border: 0; width: 100%; height: 100vh; display: block; }
    </style>
  </head>
  <body>
    <!-- SCORM 1.2 SCO wrapper for a Neft activity. Plays the LIVE activity, so
         edits never require re-uploading. ?lms=scorm relays the score to Canvas
         and hides the code popup; ?embed=1 alone keeps the save-code prompt. -->
    <iframe id="lesson" data-src="${lessonUrl}${launchQuery}" allow="fullscreen; clipboard-write" title="${title}"></iframe>
    <noscript><p style="padding:1rem;font-family:system-ui,-apple-system,sans-serif">This activity needs JavaScript enabled. <a href="${lessonUrl}">Open the activity directly</a>.</p></noscript>
    <script>
      (function () {
        "use strict";
        var LESSON_ORIGIN = "${origin}";
        var MASTERY = ${MASTERY_SCORE};
        var SUSPEND_LIMIT = ${SUSPEND_DATA_LIMIT};
        var LOCATION_LIMIT = ${LESSON_LOCATION_LIMIT};
        // Developer-only diagnostics. Never rendered for students: the panel is
        // opt-in per launch (?scormdebug=1 on the SCO URL) and the object is
        // read-only state, never a channel for anything the LMS gave us that a
        // student should not see.
        var DEBUG = /(?:^|[?&])scormdebug=1(?:&|$)/.test(location.search);
        var diag = {
          apiFound: false, initialized: false, status: "", score: null,
          suspendBytes: 0, location: "", lastCommit: null, lastError: "", writes: 0, failures: 0,
        };
        function log(msg) { if (DEBUG) { try { console.info("[neft-scorm] " + msg); } catch (e) {} } }
        // Locate the SCORM 1.2 API by walking parent frames then the opener.
        // Every window access is wrapped: in Canvas the SCO is commonly framed
        // cross-origin, where reading win.API / win.parent throws SecurityError.
        // An uncaught throw here would abort the wrapper before launchUrl() runs
        // — leaving a blank frame and no grade — so guard each access.
        function findAPI(win) {
          var tries = 0;
          while (win && tries++ < 12) {
            try { if (win.API != null) return win.API; } catch (e) { break; }
            try {
              if (!win.parent || win.parent === win) break;
              win = win.parent;
            } catch (e) { break; }
          }
          return null;
        }
        var API = null;
        try { API = findAPI(window); } catch (e) {}
        if (!API) { try { if (window.opener) API = findAPI(window.opener); } catch (e) {} }
        diag.apiFound = !!API;
        if (!API) {
          // Launched outside an LMS (direct open, preview, plain web hosting).
          // This is a supported mode, not a failure: the activity still runs and
          // saves locally, so say so once, calmly, and never again.
          try { console.info("[neft-scorm] No SCORM API found in any parent frame or opener. Running the activity without LMS reporting — progress saves locally only."); } catch (e) {}
        }
        var started = false, finished = false, startedAt = 0;

        // Every LMS call goes through here. SCORM 1.2 signals failure by RETURN
        // VALUE ("false"), not by throwing, so an unchecked call looks identical
        // to a successful one — which is how a lesson can appear to save all
        // period and land nothing in the gradebook.
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
        function call(op, fn) {
          if (!API) return false;
          var ok = false;
          try { ok = String(fn()) === "true"; } catch (e) { diag.lastError = op + ": threw " + (e && e.message ? e.message : e); }
          if (!ok) {
            var err = lastError();
            if (err) diag.lastError = op + ": " + err;
            diag.failures++;
            log("FAIL " + op + " — " + (diag.lastError || "no error code reported"));
            noteFailure();
          } else {
            diag.writes++;
            log("ok " + op);
          }
          return ok;
        }
        function setValue(key, val) { return call("LMSSetValue " + key, function () { return API.LMSSetValue(key, String(val)); }); }
        function commit() {
          var ok = call("LMSCommit", function () { return API.LMSCommit(""); });
          if (ok) { diag.lastCommit = new Date().toISOString(); failStreak = 0; renderDebug(); }
          return ok;
        }

        function start() {
          if (!API || started) return started;
          // A refused LMSInitialize is final. SCORM 1.2 has no "already
          // initialized" code to forgive (101 is the general exception), and
          // this is the only place Initialize is ever called — the started
          // flag guarantees it — so a "false" here means the LMS will reject
          // every subsequent call too. Pressing on would produce a stream of
          // failed writes and, worse, a lesson that looks like it is reporting.
          if (!call("LMSInitialize", function () { return API.LMSInitialize(""); })) {
            log("LMSInitialize refused — no data will be written this session");
            return false;
          }
          started = true;
          diag.initialized = true;
          startedAt = Date.now();
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
        // SCORM 1.2 CMITimespan (HHHH:MM:SS) so the LMS records time-on-task.
        function sessionTime() {
          var s = Math.max(0, Math.round((Date.now() - (startedAt || Date.now())) / 1000));
          function p(n) { return (n < 10 ? "0" : "") + n; }
          return p(Math.floor(s / 3600)) + ":" + p(Math.floor((s % 3600) / 60)) + ":" + p(s % 60);
        }
        // Canvas identity → live activity: read the LMS-provided student name/id
        // and hand them to the lesson so the student is auto-identified inside
        // Canvas (no name-entry screen, resume keyed to the Canvas roster).
        // SCORM 1.2 returns the name as "Last, First"; normalize to "First Last".
        function lmsGet(key) { try { return API ? String(API.LMSGetValue(key) || "") : ""; } catch (e) { return ""; } }
        function normalizeName(raw) {
          raw = (raw || "").trim();
          if (!raw) return "";
          var c = raw.indexOf(",");
          if (c > -1) return (raw.slice(c + 1).trim() + " " + raw.slice(0, c).trim()).trim();
          return raw;
        }
        function launchUrl() {
          var iframe = document.getElementById("lesson");
          var base = iframe.getAttribute("data-src");
          start();
          var name = normalizeName(lmsGet("cmi.core.student_name"));
          var sid = lmsGet("cmi.core.student_id");
          var sep = base.indexOf("?") > -1 ? "&" : "?";
          var q = "";
          if (name) q += sep + "sn=" + encodeURIComponent(name);
          if (sid) q += (q ? "&" : sep) + "si=" + encodeURIComponent(sid);
          iframe.src = base + q;
        }
        function report(pct) {
          // Never write after LMSFinish (illegal in SCORM 1.2) or before a
          // successful LMSInitialize — some LMS runtimes throw on either.
          if (!API || finished) return;
          if (!start()) return;
          var raw = Math.max(0, Math.min(100, Math.round(pct)));
          // High-water mark. A student who reviews a finished lesson, or who
          // reopens it and answers one question, otherwise overwrites a 100 with
          // whatever this session happens to total.
          var prev = Number(lmsGet("cmi.core.score.raw"));
          if (isFinite(prev) && lmsGet("cmi.core.score.raw") !== "" && prev > raw) raw = prev;
          setValue("cmi.core.score.min", "0");
          setValue("cmi.core.score.max", "100");
          setValue("cmi.core.score.raw", String(raw));
          // "passed" is a stronger claim than "completed" and must never be
          // downgraded — SCORM 1.2 has no ordering rule, so the LMS keeps
          // whatever was written last.
          var status = raw >= MASTERY ? "passed" : "completed";
          if (lmsGet("cmi.core.lesson_status") !== "passed" || status === "passed") {
            setValue("cmi.core.lesson_status", status);
            diag.status = status;
          }
          diag.score = raw;
          commit();
          renderDebug();
        }

        // --- suspend_data: resume that follows the STUDENT, not the browser ---
        // Without this the only resume state is the activity's own localStorage,
        // so a student who moves to a Chromebook, a lab machine, or a second
        // browser profile starts the assignment over with no warning.
        var pendingState = null, saveTimer = null;
        function persistState(state, location) {
          if (!API || finished) return false;
          if (!start()) return false;
          var s = String(state == null ? "" : state);
          if (s.length > SUSPEND_LIMIT) {
            // Refuse rather than truncate: half a JSON payload restores as
            // garbage, and a lesson that resumes wrong is worse than one that
            // resumes empty.
            log("suspend_data " + s.length + " chars exceeds the SCORM 1.2 limit of " + SUSPEND_LIMIT + " — not written");
            diag.lastError = "suspend_data too large (" + s.length + " > " + SUSPEND_LIMIT + ")";
            diag.failures++;
            return false;
          }
          setValue("cmi.suspend_data", s);
          diag.suspendBytes = s.length;
          if (location != null) {
            var loc = String(location).slice(0, LOCATION_LIMIT);
            setValue("cmi.core.lesson_location", loc);
            diag.location = loc;
          }
          commit();
          renderDebug();
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
        // Hand any stored state back to the activity as soon as it says it is
        // listening, so the student lands where they left off.
        var lessonReady = false;
        function restoreFromLms() {
          if (!lessonReady || !started) return;
          var s = lmsGet("cmi.suspend_data");
          var loc = lmsGet("cmi.core.lesson_location");
          diag.suspendBytes = s.length;
          diag.location = loc;
          if (!s && !loc) return;
          try {
            document.getElementById("lesson").contentWindow.postMessage(
              { source: "neft-sco", type: "restore", state: s, location: loc },
              LESSON_ORIGIN,
            );
            log("sent restore (" + s.length + " chars, location " + (loc || "-") + ")");
          } catch (e) {}
        }

        function finish() {
          if (!API || !started || finished) return;
          flushState();
          setValue("cmi.core.session_time", sessionTime());
          commit();
          call("LMSFinish", function () { return API.LMSFinish(""); });
          finished = true;
          renderDebug();
        }

        // --- student-facing failure notice ---------------------------------
        // A 7th grader must never read "LMSSetValue error 351". They do need to
        // know their work may not be reaching the course, so they can tell the
        // teacher instead of assuming it saved.
        var failStreak = 0, noticeShown = false;
        function noteFailure() {
          if (++failStreak < 3 || noticeShown) return;
          noticeShown = true;
          try {
            var n = document.createElement("div");
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
            var el = document.getElementById("nt-scorm-debug");
            if (!el) {
              el = document.createElement("pre");
              el.id = "nt-scorm-debug";
              el.style.cssText = "position:fixed;right:8px;bottom:8px;z-index:2147483647;margin:0;" +
                "max-width:22rem;background:rgba(17,24,39,.92);color:#d1fae5;padding:8px 10px;" +
                "border-radius:8px;font:12px/1.45 ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap;";
              (document.body || document.documentElement).appendChild(el);
            }
            el.textContent = "SCORM 1.2 diagnostics\\n" +
              "api found   : " + diag.apiFound + "\\n" +
              "initialized : " + diag.initialized + "\\n" +
              "status      : " + (diag.status || "-") + "\\n" +
              "score.raw   : " + (diag.score == null ? "-" : diag.score) + "\\n" +
              "suspend     : " + diag.suspendBytes + "/" + SUSPEND_LIMIT + " chars\\n" +
              "location    : " + (diag.location || "-") + "\\n" +
              "last commit : " + (diag.lastCommit || "-") + "\\n" +
              "writes/fail : " + diag.writes + "/" + diag.failures + "\\n" +
              "last error  : " + (diag.lastError || "-");
          } catch (e) {}
        }
        window.NeftScormDiagnostics = function () { return diag; };
        // Register the score listener BEFORE loading the activity so no early
        // completion message is missed, then launch with the Canvas identity.
        window.addEventListener("message", function (e) {
          if (LESSON_ORIGIN && e.origin !== LESSON_ORIGIN) return;
          var d = e.data || {};
          if (d.source !== "neft-lesson") return;
          if (d.type === "score" && typeof d.percent === "number") report(d.percent);
          else if (d.type === "ready") { lessonReady = true; start(); restoreFromLms(); }
          else if (d.type === "state") queueState(d.state, d.location);
        });
        // unload is unreliable (bfcache, mobile task-switching, LMS frame swaps),
        // so it is the LAST line of defence, not the strategy: pagehide and the
        // hidden transition both flush first, and state is committed as it
        // arrives rather than only at the end.
        document.addEventListener("visibilitychange", function () {
          if (document.visibilityState === "hidden") { flushState(); if (started && !finished) commit(); }
        });
        window.addEventListener("pagehide", finish);
        window.addEventListener("unload", finish);
        launchUrl();
        renderDebug();
      })();
    </script>
  </body>
</html>
`;
}

/**
 * Teacher-readable, filesystem-safe download name.
 *
 * `neft-3-4.zip` tells a teacher nothing once twelve of them are sitting in a
 * Downloads folder, and Canvas shows the uploaded file name in its SCORM list.
 * The stable SCORM identifier is unchanged — only the file name is friendly, so
 * renaming a download can never re-key an existing Canvas assignment.
 */
export function packageFileName(id, codes) {
  const suffix = codes ? "_SaveCodes" : "_Interactive";
  // The mode already lives in the id (…-codes) so the SCORM identifier is
  // distinct; strip it here so the name still reads Unit-1_Lesson-1-1_SaveCodes
  // rather than falling through to the opaque fallback form.
  const base = codes ? String(id).replace(/-codes$/, "") : String(id);
  const m = /^(\d+)-(\d+)$/.exec(base);
  const name = m
    ? `Unit-${m[1]}_Lesson-${m[1]}-${m[2]}${suffix}_SCORM`
    : `Neft_${base.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "")}${suffix}_SCORM`;
  return `${name.slice(0, 120)}.zip`;
}

/** Build the two package files. Returns { id, lessonUrl, files }. */
export function buildScormFiles(
  { target, title, codes, supports, lang, id: idOverride },
  site = SITE_DEFAULT,
) {
  const { lessonUrl, id: derivedId, origin } = resolveTarget(target, site);
  /*
   * An explicit id wins over the path-derived one. The Canvas packages page
   * (tools/scorm/build-canvas-scorm-page.mjs) names its own packages —
   * "homework-1-1" rather than the path-derived "1-1-homework" — and passes that
   * name to the CLI builder, then copies the file it expects by name.
   *
   * The CLI rewrite dropped this third argument, so every homework and activity
   * package was written under a name the caller did not expect and the copy
   * failed with ENOENT for all 84 homework packages. Restored, and routed
   * through slug() so a caller cannot inject a path or an XML-unsafe identifier.
   */
  const id = idOverride ? slug(idOverride) : derivedId;
  const t = xmlEsc(title && String(title).trim() ? title.trim() : `Activity ${id}`);
  // Joined with "&" when the target already carries a query (?unit=3 etc.) —
  // mirrors tools/scorm/build-scorm.mjs so both builders stay in lockstep.
  let launchQuery =
    (lessonUrl.includes("?") ? "&" : "?") + (codes ? "embed=1" : "lms=scorm&embed=1");

  // Personalized package: bake the selected learning supports (and optional
  // language) into the launch query so they activate for the student on load.
  const safeSupports = sanitizeSupports(supports);
  const safeLang = sanitizeLang(lang);
  // Save-codes mode is a DIFFERENT package (different launch query, different
  // grade path), so it needs a different SCORM identity. It used to differ only
  // in the zip filename: a teacher who posted both the interactive and the
  // save-codes variant of one lesson uploaded two packages that declared the
  // same manifest identifier, which an LMS keying content by identifier treats
  // as the same activity.
  let personalId = codes ? slug(`${id}-codes`) : id;
  if (safeSupports) {
    launchQuery += `&supports=${safeSupports}`;
    if (safeLang) launchQuery += `&lang=${safeLang}`;
    // Distinct id/filename so a personalized package doesn't collide with the
    // standard one (e.g. neft-1-1-supports-... .zip).
    personalId = slug(`${personalId}-supports-${safeSupports}${safeLang ? "-" + safeLang : ""}`);
  }

  return {
    id: personalId,
    lessonUrl,
    codes: !!codes,
    files: {
      "imsmanifest.xml": manifest(personalId, t),
      "index.html": sco(lessonUrl, launchQuery, origin, t),
    },
  };
}

// The stored-ZIP writer lives in assets/lib/zip-store.js so the browser-side
// bulk downloader emits byte-identical archives from the same code.
export { zipStore } from "../../assets/lib/zip-store.js";
