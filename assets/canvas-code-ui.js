/**
 * canvas-code-ui.js — the shared "Canvas completion code" modal.
 *
 * ONE renderer, used by BOTH:
 *   - the lesson engine (engine/core/canvas-code.js), and
 *   - the EduPulse bridge (assets/edupulse-bridge.js, for games & bespoke
 *     activities that report a score).
 * Keeping a single UI guarantees every graded math activity shows the SAME
 * completion-code experience — no drift, no double-display.
 *
 *   window.NeftCanvasCodeUI.show(payload)
 *     payload = { studentName, classPeriod, activityId, activityTitle,
 *                 score, maxScore, percent, stars }
 *
 * Guarantees:
 *   - Idempotent: at most one modal (#nt-canvas-code) per page completion.
 *   - SCORM-safe: inside a `?lms=scorm` launch it relays the score to the parent
 *     frame (auto-grading) and SKIPS the manual code modal.
 *   - Always posts the score to a parent frame (embeds / SCORM launchers).
 *   - Fire-and-forget: never throws into the activity flow.
 *   - Accessible: role=dialog + aria-modal, Esc to close, focus is moved into
 *     the dialog on open and restored to the trigger on close, Tab is trapped.
 */
(function (global) {
  "use strict";

  var CODEC_SRC = "/assets/canvas-code-codec.js";
  var MODAL_ID = "nt-canvas-code";

  /** Load the shared codec once; resolve when window.NeftCanvasCodec is ready. */
  function ensureCodec() {
    if (typeof global === "undefined" || typeof document === "undefined") {
      return Promise.resolve(null);
    }
    if (global.NeftCanvasCodec) return Promise.resolve(global.NeftCanvasCodec);
    return new Promise(function (resolve) {
      var s = document.querySelector('script[src="' + CODEC_SRC + '"]');
      if (!s) {
        s = document.createElement("script");
        s.src = CODEC_SRC;
        document.body.appendChild(s);
      }
      s.addEventListener(
        "load",
        function () {
          resolve(global.NeftCanvasCodec || null);
        },
        { once: true },
      );
      s.addEventListener("error", function () {
        resolve(null);
      }, { once: true });
      if (global.NeftCanvasCodec) resolve(global.NeftCanvasCodec);
    });
  }

  /** True when launched inside a SCORM package (?lms=scorm). */
  function isScormLaunch() {
    try {
      return /(?:^|[?&])lms=scorm(?:&|$)/.test(global.location.search);
    } catch (e) {
      return false;
    }
  }

  /**
   * Relay the score to a parent frame (SCORM launcher / any embedder). The
   * SCORM launcher forwards this to Canvas's gradebook automatically — no codes.
   */
  function reportToParent(payload) {
    try {
      if (global.parent && global.parent !== global) {
        global.parent.postMessage(
          {
            source: "neft-lesson",
            type: "score",
            percent: payload.percent,
            score: payload.score,
            max: payload.maxScore,
            lessonId: payload.activityId,
            title: payload.activityTitle,
          },
          "*",
        );
      }
    } catch (e) {
      /* never break the activity */
    }
  }

  function escapeAttr(v) {
    return String(v == null ? "" : v).replace(/"/g, "&quot;");
  }

  function render(code, payload) {
    if (document.getElementById(MODAL_ID)) return; // once per completion

    var previouslyFocused =
      document.activeElement && document.activeElement.focus
        ? document.activeElement
        : null;

    var card = document.createElement("div");
    card.id = MODAL_ID;
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");
    card.setAttribute("aria-label", "Canvas completion code");
    card.style.cssText =
      "position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;" +
      "justify-content:center;background:rgba(18,53,91,0.55);backdrop-filter:blur(4px);" +
      "padding:20px;font-family:system-ui,Segoe UI,sans-serif;";

    var needName = !String(payload.n || "").trim();
    var nameNote = needName
      ? '<p style="margin:0 0 12px;color:#b54708;font-weight:600;font-size:14px;">' +
        "⚠ Add your name first (so your teacher can match this to you), then copy the code." +
        "</p>"
      : "";

    card.innerHTML =
      '<div style="background:#fff;border-radius:18px;max-width:440px;width:100%;' +
      'box-shadow:0 24px 60px rgba(0,0,0,0.35);overflow:hidden;">' +
      '<div style="background:#387F84;color:#fff;padding:18px 22px;">' +
      '<div style="font-size:13px;letter-spacing:.5px;opacity:.9;">CANVAS SUBMISSION</div>' +
      '<div style="font-size:20px;font-weight:800;">Your completion code 🎉</div>' +
      "</div>" +
      '<div style="padding:22px;">' +
      nameNote +
      '<p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.5;">' +
      "Your code is <strong>copied</strong> — just paste it into the " +
      "<strong>Canvas assignment</strong> for this activity. (Tap Copy if you need it again.)" +
      "</p>" +
      '<div style="display:flex;gap:8px;align-items:stretch;">' +
      '<input id="nt-cc-input" readonly aria-label="Canvas completion code" value="' +
      escapeAttr(code) +
      '" style="flex:1;font:600 14px ui-monospace,Menlo,monospace;padding:12px;' +
      "border:2px solid #cbd5e1;border-radius:10px;color:#0f172a;" +
      'background:#f8fafc;overflow-x:auto;" />' +
      '<button id="nt-cc-copy" type="button"' +
      ' style="background:#F2A93B;color:#12355b;font-weight:800;border:0;' +
      'border-radius:10px;padding:0 16px;cursor:pointer;font-size:14px;">Copy</button>' +
      "</div>" +
      '<ol style="margin:14px 0 0;padding-left:20px;color:#334155;font-size:13px;line-height:1.7;">' +
      "<li>Go back to the <strong>Canvas assignment</strong> for this activity.</li>" +
      "<li><strong>Paste</strong> the code into the text box (it's already copied).</li>" +
      "<li>Click <strong>Submit Assignment</strong>.</li>" +
      "</ol>" +
      '<p style="margin:10px 0 0;color:#64748b;font-size:13px;">' +
      "Score recorded: <strong>" +
      payload.s +
      "/" +
      payload.m +
      "</strong> (" +
      payload.pc +
      "%)." +
      "</p>" +
      '<div style="text-align:right;margin-top:18px;">' +
      '<button id="nt-cc-close" type="button"' +
      ' style="background:transparent;color:#475569;border:0;cursor:pointer;' +
      'font-size:14px;font-weight:600;">Close</button>' +
      "</div></div></div>";

    document.body.appendChild(card);

    var input = card.querySelector("#nt-cc-input");
    var copyBtn = card.querySelector("#nt-cc-copy");
    var closeBtn = card.querySelector("#nt-cc-close");

    var flagCopied = function () {
      copyBtn.textContent = "Copied ✓";
      setTimeout(function () {
        copyBtn.textContent = "Copy";
      }, 1600);
    };
    var doCopy = function () {
      var done = function () {
        flagCopied();
      };
      if (global.navigator && global.navigator.clipboard) {
        return global.navigator.clipboard
          .writeText(code)
          .then(done)
          .catch(function () {
            try {
              input.select();
              document.execCommand("copy");
            } catch (e) {}
            done();
          });
      }
      try {
        input.select();
        document.execCommand("copy");
      } catch (e) {}
      done();
      return Promise.resolve();
    };

    var close = function () {
      document.removeEventListener("keydown", onKeydown, true);
      card.remove();
      try {
        if (previouslyFocused && document.contains(previouslyFocused)) {
          previouslyFocused.focus();
        }
      } catch (e) {}
    };

    function focusables() {
      return [copyBtn, input, closeBtn].filter(Boolean);
    }
    function onKeydown(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === "Tab") {
        // Trap focus inside the dialog.
        var items = focusables();
        if (!items.length) return;
        var first = items[0];
        var last = items[items.length - 1];
        var active = document.activeElement;
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        } else if (items.indexOf(active) === -1) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    copyBtn.addEventListener("click", function () {
      doCopy();
    });
    closeBtn.addEventListener("click", close);
    card.addEventListener("click", function (e) {
      if (e.target === card) close();
    });
    document.addEventListener("keydown", onKeydown, true);

    // Move focus into the dialog for keyboard/screen-reader users.
    try {
      copyBtn.focus();
    } catch (e) {}

    // Auto-copy on completion so the student only has to paste into Canvas.
    // The finish event usually follows a click, so the clipboard gesture is
    // honored; if blocked, the Copy button still works.
    doCopy();
  }

  /**
   * Show the completion code for a graded result. Safe to call more than once
   * (idempotent) and from either the engine or the bridge.
   */
  function show(payload) {
    try {
      payload = payload || {};
      // Normalize to the codec's input shape.
      var norm = {
        studentName: payload.studentName || "",
        classPeriod: payload.classPeriod || "",
        activityId: payload.activityId || "activity",
        activityTitle: payload.activityTitle || payload.activityId || "Activity",
        score: payload.score,
        maxScore: payload.maxScore,
        percent: payload.percent,
        stars: payload.stars,
      };
      // Always tell a parent frame the score (SCORM auto-grading / embeds).
      reportToParent(norm);
      // Inside a SCORM package the grade is automatic — skip the manual UI.
      if (isScormLaunch()) return;
      if (global.NT_DISABLE_CANVAS_CODE) return;
      if (document.getElementById(MODAL_ID)) return; // already shown
      // Defer to the standalone canvas-bridge popup if it already rendered one,
      // so an activity that wires both systems never stacks two code modals.
      if (document.getElementById("nt-canvas-bridge-code")) return;
      ensureCodec().then(function (codec) {
        if (!codec) return;
        var code = codec.encode(norm);
        render(code, codec.decode(code).payload || {});
      });
    } catch (e) {
      /* never break the activity */
    }
  }

  var api = { show: show, isScormLaunch: isScormLaunch, MODAL_ID: MODAL_ID };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.NeftCanvasCodeUI = api;
})(typeof window !== "undefined" ? window : this);
