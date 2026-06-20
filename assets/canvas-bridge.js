/**
 * canvas-bridge.js — give ANY standalone activity the same Canvas grading
 * powers the 74 engine lessons already have, with one <script> tag.
 *
 * The lesson engine (engine/core/canvas-code.js) shows a verifiable completion
 * code AND reports a SCORM score to a parent frame. Standalone activities use
 * the save/resume engine instead and had neither. This bridge closes that gap
 * by reusing the EXACT same two contracts, so nothing downstream changes:
 *
 *   1. Completion code — minted with the shared codec (assets/canvas-code-codec.js,
 *      window.NeftCanvasCodec). The same teacher tool (teacher-tools/canvas-grades/)
 *      that decodes lesson codes decodes these. One grading currency, everywhere.
 *
 *   2. SCORM score — postMessage({source:"neft-lesson", type:"score", percent})
 *      to window.parent. The SCORM SCO (tools/scorm/template) already listens for
 *      exactly this, so a SCORM-wrapped activity reports to the Canvas gradebook
 *      with ZERO changes to the SCO.
 *
 * Adoption (drop ONE line into an activity, after save-resume-engine.js):
 *   <script src="/assets/canvas-bridge.js" defer></script>
 *
 * Behavior:
 *   - Identity + progress are read from window.NeftSaveResume.getTeacherSummary()
 *     when present (name, section, percentComplete). No save/resume? It still
 *     works — you just call NeftCanvasBridge.complete(percent) yourself.
 *   - Auto-fires once when progress reaches the threshold (default 100%).
 *   - Inside a SCORM launch (?lms=scorm) it reports the score silently (no popup).
 *     Otherwise it shows the copy-paste completion code, like the lessons do.
 *
 * Config (optional, set BEFORE this script loads):
 *   window.NeftCanvasBridgeConfig = {
 *     activityId:   "ratio-color-mixer",   // defaults to the URL path slug
 *     activityTitle:"Ratio Color Mixer",   // defaults to document.title
 *     threshold:    100,                    // auto-complete at this percent
 *     auto:         true,                   // watch save/resume progress
 *     manual:       false,                  // true = never auto-fire; call complete()
 *   };
 *
 * Public API (window.NeftCanvasBridge):
 *   .complete(percent, opts?)  — mint code + report score (idempotent per load)
 *   .reportScore(percent)      — SCORM postMessage only, no popup (repeatable)
 *   .isScormLaunch()           — true when embedded in a SCORM package
 *   .reset()                   — allow a fresh completion (e.g. retake)
 *
 * Defensive by contract: every public path is wrapped so a failure here can
 * never break the host activity.
 */
(function (global) {
  "use strict";
  if (!global || global.NeftCanvasBridge) return;

  var CODEC_SRC = "/assets/canvas-code-codec.js";
  var cfg = global.NeftCanvasBridgeConfig || {};
  var fired = false;

  function safe(fn, fallback) {
    try {
      return fn();
    } catch (e) {
      return fallback;
    }
  }

  function slugFromPath() {
    return safe(function () {
      var parts = global.location.pathname.split("/").filter(Boolean);
      return parts[parts.length - 1] || parts[parts.length - 2] || "activity";
    }, "activity");
  }

  function isScormLaunch() {
    return safe(function () {
      return /(?:^|[?&])lms=scorm(?:&|$)/.test(global.location.search);
    }, false);
  }

  /** Load the shared codec once; resolve(codec|null). */
  function ensureCodec() {
    if (global.NeftCanvasCodec) return Promise.resolve(global.NeftCanvasCodec);
    return new Promise(function (resolve) {
      var existing = document.querySelector('script[src="' + CODEC_SRC + '"]');
      if (existing) {
        existing.addEventListener("load", function () { resolve(global.NeftCanvasCodec || null); }, { once: true });
        existing.addEventListener("error", function () { resolve(null); }, { once: true });
        if (global.NeftCanvasCodec) resolve(global.NeftCanvasCodec);
        return;
      }
      var s = document.createElement("script");
      s.src = CODEC_SRC;
      s.addEventListener("load", function () { resolve(global.NeftCanvasCodec || null); }, { once: true });
      s.addEventListener("error", function () { resolve(null); }, { once: true });
      (document.body || document.documentElement).appendChild(s);
    });
  }

  /** Pull name / section / progress from save/resume when available. */
  function identity() {
    var sum = safe(function () {
      return global.NeftSaveResume && global.NeftSaveResume.getTeacherSummary
        ? global.NeftSaveResume.getTeacherSummary()
        : null;
    }, null);
    return {
      studentName: (sum && (sum.studentName || sum.name)) || "",
      classPeriod: (sum && (sum.section || sum.classPeriod)) || "",
      percent: sum && typeof sum.percentComplete === "number" ? sum.percentComplete : null,
    };
  }

  function activityId() {
    return String(cfg.activityId || slugFromPath());
  }
  function activityTitle() {
    return String(cfg.activityTitle || (document && document.title) || activityId());
  }

  /** SCORM passback — the SCO relays this to the Canvas gradebook. */
  function reportScore(percent) {
    safe(function () {
      if (!global.parent || global.parent === global) return;
      var pct = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));
      global.parent.postMessage(
        {
          source: "neft-lesson",
          type: "score",
          percent: pct,
          score: pct,
          max: 100,
          lessonId: activityId(),
          title: activityTitle(),
        },
        "*",
      );
    });
  }

  /** Minimal styled popup with the completion code + copy button. */
  function renderCode(code, needName) {
    if (document.getElementById("nt-canvas-bridge-code")) return;
    var card = document.createElement("div");
    card.id = "nt-canvas-bridge-code";
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-label", "Canvas completion code");
    card.style.cssText =
      "position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;" +
      "justify-content:center;background:rgba(18,53,91,0.55);backdrop-filter:blur(4px);" +
      "padding:20px;font-family:system-ui,Segoe UI,sans-serif;";
    var warn = needName
      ? '<p style="margin:0 0 12px;color:#b54708;font-weight:600;font-size:14px;">' +
        "⚠ Add your name first so your teacher can match this to you, then copy the code.</p>"
      : "";
    card.innerHTML =
      '<div style="background:#fff;border-radius:18px;max-width:440px;width:100%;padding:26px 24px;box-shadow:0 20px 60px rgba(15,23,42,.35);">' +
      '<h2 style="margin:0 0 6px;font-size:20px;color:#12355b;">🎉 You finished!</h2>' +
      '<p style="margin:0 0 14px;color:#475569;font-size:14px;">Paste this completion code into the matching Canvas assignment.</p>' +
      warn +
      '<div style="display:flex;gap:8px;">' +
      '<input id="nt-cb-input" readonly value="' + String(code).replace(/"/g, "&quot;") + '" ' +
      'style="flex:1;font-family:ui-monospace,Menlo,monospace;font-size:13px;padding:11px 12px;border:1px solid #cbd5e1;border-radius:10px;background:#f8fafc;color:#0f172a;" />' +
      '<button id="nt-cb-copy" style="background:#12355b;color:#fff;border:0;border-radius:10px;padding:0 16px;font-weight:700;cursor:pointer;">Copy</button>' +
      "</div>" +
      '<button id="nt-cb-close" style="margin-top:16px;background:none;border:0;color:#64748b;font-size:13px;cursor:pointer;text-decoration:underline;">Close</button>' +
      "</div>";
    (document.body || document.documentElement).appendChild(card);

    var input = card.querySelector("#nt-cb-input");
    var copyBtn = card.querySelector("#nt-cb-copy");
    function flag() {
      copyBtn.textContent = "Copied ✓";
      setTimeout(function () { copyBtn.textContent = "Copy"; }, 1600);
    }
    function doCopy() {
      return (navigator.clipboard
        ? navigator.clipboard.writeText(code)
        : Promise.reject()
      ).then(flag, function () {
        safe(function () { input.select(); document.execCommand("copy"); flag(); });
      });
    }
    copyBtn.addEventListener("click", doCopy);
    doCopy().catch(function () {});
    function close() { card.remove(); }
    card.querySelector("#nt-cb-close").addEventListener("click", close);
    card.addEventListener("click", function (e) { if (e.target === card) close(); });
  }

  /**
   * Fire a completion: report the SCORM score and (outside SCORM) show the code.
   * Idempotent per page load unless reset() (or opts.force) is used.
   *
   * @param {number} [percent]  0–100; falls back to save/resume progress, then 100.
   * @param {object} [opts]     { studentName, classPeriod, force }. studentName /
   *                            classPeriod override what save/resume reports, so an
   *                            activity with its own name field can pass it directly.
   */
  function complete(percent, opts) {
    if (fired && !(opts && opts.force)) return;
    fired = true;
    var id = identity();
    var studentName = opts && opts.studentName != null ? opts.studentName : id.studentName;
    var classPeriod = opts && opts.classPeriod != null ? opts.classPeriod : id.classPeriod;
    var pct = typeof percent === "number" ? percent : id.percent;
    if (typeof pct !== "number") pct = 100; // an explicit complete() with no data = done
    pct = Math.max(0, Math.min(100, Math.round(pct)));

    reportScore(pct);
    if (isScormLaunch()) return; // SCORM relays the score; no popup needed

    ensureCodec().then(function (codec) {
      if (!codec) return;
      var code = safe(function () {
        return codec.encode({
          studentName: studentName,
          classPeriod: classPeriod,
          activityId: activityId(),
          activityTitle: activityTitle(),
          score: pct,
          maxScore: 100,
          percent: pct,
          stars: 0,
        });
      }, null);
      if (code) renderCode(code, !String(studentName || "").trim());
    });
  }

  /** Watch save/resume progress and auto-complete once at the threshold. */
  function startAutoWatch() {
    if (cfg.manual || cfg.auto === false) return;
    var threshold = typeof cfg.threshold === "number" ? cfg.threshold : 100;
    var timer = setInterval(function () {
      if (fired) { clearInterval(timer); return; }
      var pct = identity().percent;
      if (typeof pct === "number" && pct >= threshold) {
        clearInterval(timer);
        complete(pct);
      }
    }, 1500);
    // Stop watching if the page is unloaded.
    global.addEventListener("pagehide", function () { clearInterval(timer); }, { once: true });
  }

  global.NeftCanvasBridge = {
    complete: function (percent, opts) { return safe(function () { return complete(percent, opts); }); },
    reportScore: function (percent) { return safe(function () { return reportScore(percent); }); },
    isScormLaunch: isScormLaunch,
    reset: function () { fired = false; },
    __loaded: true,
  };

  // Kick off the auto-watcher once the DOM is ready.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startAutoWatch, { once: true });
  } else {
    startAutoWatch();
  }
})(typeof window !== "undefined" ? window : this);
