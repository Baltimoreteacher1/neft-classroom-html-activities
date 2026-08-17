// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
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
 *     finishButton: true,                   // false = host owns completion (engine lessons)
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
    } catch (_e) {
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
        existing.addEventListener(
          "load",
          function () {
            resolve(global.NeftCanvasCodec || null);
          },
          { once: true },
        );
        existing.addEventListener(
          "error",
          function () {
            resolve(null);
          },
          { once: true },
        );
        if (global.NeftCanvasCodec) resolve(global.NeftCanvasCodec);
        return;
      }
      var s = document.createElement("script");
      s.src = CODEC_SRC;
      s.addEventListener(
        "load",
        function () {
          resolve(global.NeftCanvasCodec || null);
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
      // completionOnly gates HERE, not only in complete(). This is the single
      // choke point every score post passes through, and the other caller is
      // not complete() at all: shared/projects/projects-publisher.js calls
      // NeftCanvasBridge.reportScore() directly on forward step transitions,
      // posting a step-progress percent (capped at 65). Guarding complete()
      // alone left unit projects still posting 17, 33, … to the Canvas
      // gradebook — a progress figure presented as a grade on work a teacher
      // marks by rubric. Caught by browser probe; inheritance was not enough.
      if (cfg.completionOnly) return;
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

  // --- SCORM resume relay ----------------------------------------------------
  // The SCO can only persist what the activity hands it. Without this the sole
  // resume store is this browser's localStorage, so a student who switches to a
  // Chromebook, a lab machine or a second profile restarts the assignment with
  // no warning — and the LMS, which is the one place their identity is stable,
  // holds nothing.
  //
  // Contract (both directions are origin-checked by the SCO):
  //   lesson → SCO  {source:"neft-lesson", type:"ready"}
  //   lesson → SCO  {source:"neft-lesson", type:"state", state, location}
  //   SCO → lesson  {source:"neft-sco",    type:"restore", state, location}
  var lastSent = null;
  // What counts as "the student did something worth persisting".
  var ACTIVITY_EVENTS = ["input", "change", "click", "keyup"];

  function toParent(msg) {
    safe(function () {
      if (!global.parent || global.parent === global) return;
      global.parent.postMessage(msg, "*");
    });
  }

  // SCORM 1.2 caps cmi.suspend_data at 4096 characters — not bytes of intent,
  // characters — and a full save/resume capture (every field, navigation, drag
  // targets, provider payloads) routinely exceeds that on a long lesson. The SCO
  // refuses an oversize write rather than truncating, so the trimming decision
  // has to be made HERE, where it is possible to know what matters least.
  var SUSPEND_BUDGET = 4000; // headroom under 4096 for the SCO's own accounting
  // Growth alarm, well below the cliff. Homework 1-1 already serializes 2,542
  // chars (62% of the SCORM 1.2 cap) and homework is the type most likely to
  // grow, so the failure mode to avoid is a payload crossing 4,096 unnoticed
  // and silently degrading to a pointer. Warn only — never fails anything.
  var SUSPEND_WARN = 3000;

  /** Drop the least resume-critical slices until the payload fits, in order. */
  function compactForScorm(state) {
    var trimmed = {
      fields: state.fields,
      navigation: state.navigation,
      dragDrop: state.dragDrop,
      custom: state.custom,
      progressPercent: state.progressPercent,
    };
    var order = ["custom", "dragDrop", "navigation"];
    var out = JSON.stringify(trimmed);
    for (var i = 0; i < order.length && out.length > SUSPEND_BUDGET; i++) {
      delete trimmed[order[i]];
      out = JSON.stringify(trimmed);
    }
    if (out.length <= SUSPEND_BUDGET) {
      if (out.length > SUSPEND_WARN) {
        safe(function () {
          console.warn(
            "[nt-canvas-bridge] suspend_data " +
              out.length +
              " chars is over the " +
              SUSPEND_WARN +
              "-char warn threshold (cap " +
              SUSPEND_BUDGET +
              "). Still written in full; this pathway is approaching the point where it degrades to a resume pointer.",
          );
        });
      }
      return out;
    }

    // --- POINTER FALLBACK ---------------------------------------------------
    // Measured on production: a small-group, catch-up or unit-project pathway
    // serializes 7,700–12,300 characters with ZERO fields filled — the bulk is
    // structural (the save/resume engine captures every field key on the page,
    // not just answered ones), so student input moves it by ~150 chars across
    // 80 fields. Dropping slices cannot get these under 4,096; returning ""
    // meant those 214 pathways persisted NOTHING, ever, at any level of
    // activity. Resume was silently impossible for them.
    //
    // So instead of a truncated record (which restores as wrong answers) or no
    // record at all, write a POINTER: enough for the LMS to identify the
    // attempt and put the student back in the right place, with the
    // authoritative answers staying in the NeftSaveResume layer that already
    // holds them. Reconciled on load by applyRestore(), which only ever fills
    // an empty session.
    var pointer = safe(function () {
      var sum =
        global.NeftSaveResume && global.NeftSaveResume.getTeacherSummary
          ? global.NeftSaveResume.getTeacherSummary()
          : null;
      return JSON.stringify({
        v: 2,
        ref: "local",
        id: activityId(),
        phase: (sum && sum.phase) || "",
        pct: Math.round((state && state.progressPercent) || (sum && sum.percentComplete) || 0),
      });
    }, "");
    if (pointer && pointer.length <= SUSPEND_BUDGET) {
      // Never silent: a pointer is a REDUCED record and the log says so, with
      // the size that forced it.
      safe(function () {
        console.info(
          "[nt-canvas-bridge] suspend_data " +
            out.length +
            " chars exceeds the SCORM 1.2 budget of " +
            SUSPEND_BUDGET +
            " — writing a resume pointer; answers stay in local save/resume.",
        );
      });
      return pointer;
    }
    // A pointer that does not fit is not a situation that can arise from
    // content; refuse rather than truncate.
    return "";
  }

  /** Serialize the activity's own save/resume state, or "" when unavailable. */
  function snapshotState() {
    return safe(function () {
      var sr = global.NeftSaveResume;
      if (!sr) return "";
      // Live capture when available: getState() returns the last SAVED record,
      // which under a SCORM launch may never exist (the save-code prompt that
      // starts a session is hidden by ?lms=scorm).
      var st =
        typeof sr._captureState === "function"
          ? sr._captureState()
          : typeof sr.getState === "function"
            ? sr.getState()
            : null;
      return st ? compactForScorm(st) : "";
    }, "");
  }

  function currentLocation() {
    return safe(function () {
      var sr = global.NeftSaveResume;
      var sum = sr && sr.getTeacherSummary ? sr.getTeacherSummary() : null;
      // A bookmark the LMS can show and a human can read. Deliberately NOT an
      // internal index — lesson_location survives content edits, indices do not.
      return sum && sum.phase ? String(sum.phase) : "";
    }, "");
  }

  /** Push state to the SCO. Cheap and idempotent: unchanged state is skipped. */
  function syncScormState() {
    if (!isScormLaunch()) return;
    var state = snapshotState();
    if (!state || state === lastSent) return;
    lastSent = state;
    toParent({
      source: "neft-lesson",
      type: "state",
      state: state,
      location: currentLocation(),
    });
  }

  function applyRestore(payload) {
    safe(function () {
      var sr = global.NeftSaveResume;
      if (!sr || !payload || !payload.state) return;
      var st = JSON.parse(payload.state);
      // A POINTER is not a state record. compactForScorm() writes one when the
      // real payload cannot fit SCORM 1.2's 4,096-char ceiling, and it carries
      // only an id/phase/percent — handing it to _restoreState() would replace
      // a student's session with a shape that has no `fields` at all. The
      // authoritative answers are in the local save/resume layer, which has
      // already loaded them; the pointer's job is done by simply not clobbering
      // that. Reconcile, do not restore.
      if (st && st.ref === "local") return;
      // Only ever ADD to an empty session. If this browser already holds local
      // work, that work is newer than whatever the LMS was last told, and
      // overwriting it would destroy answers the student can see on screen.
      var existing = safe(function () {
        return sr._captureState ? sr._captureState() : null;
      }, null);
      var hasLocalWork = !!(
        existing &&
        ((existing.fields && Object.keys(existing.fields).length) ||
          (existing.progressPercent || 0) > 0)
      );
      if (hasLocalWork) return;
      if (typeof sr._restoreState === "function") sr._restoreState(st);
    });
  }

  if (isScormLaunch()) {
    global.addEventListener("message", function (e) {
      var d = e && e.data;
      if (!d || d.source !== "neft-sco" || d.type !== "restore") return;
      applyRestore(d);
    });
    // Announce readiness once the page can receive a restore, then mirror state
    // as the student works. The SCO coalesces and rate-limits the writes.
    safe(function () {
      // The handshake. `protocol` is additive: a Runtime v1 wrapper reads the
      // type and ignores the field, a v2 wrapper records which protocol the
      // lesson speaks so a mismatch is diagnosable rather than mysterious.
      toParent({ source: "neft-lesson", type: "ready", protocol: 2 });
      global.addEventListener("pagehide", syncScormState);
      global.addEventListener("beforeunload", syncScormState);
      document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "hidden") syncScormState();
      });
      // Driven by student activity, NOT by a standing interval. A setInterval
      // here would never be cleared: it keeps a timer alive for the whole
      // lesson (and pins the event loop open in any headless harness) to ask a
      // question that only has a new answer after the student does something.
      // The debounce collapses a burst of typing into one sync.
      var idle = null;
      var onActivity = function () {
        if (idle) clearTimeout(idle);
        idle = setTimeout(function () {
          idle = null;
          syncScormState();
          // Proof of life for the Runtime v2 shell, on a timer that already
          // exists and is already cleared. A v1 wrapper ignores the type.
          if (typeof beat === "function") beat();
        }, 5000);
      };
      for (var i = 0; i < ACTIVITY_EVENTS.length; i++)
        document.addEventListener(ACTIVITY_EVENTS[i], onActivity, { passive: true });

      // --- SCORM Runtime v2 protocol additions --------------------------
      // Everything below is LIVE-SIDE, so an ALREADY-UPLOADED Canvas package
      // receives it without a re-upload: a Runtime v1 wrapper switches on the
      // message types it knows and ignores the rest. See docs/scorm-runtime.md.
      // Heartbeat. A v2 wrapper treats this as proof the lesson is alive, which
      // is what stops a lesson that renders slowly — or one whose ready message
      // was missed — from being replaced by an error card the student cannot
      // act on.
      //
      // Deliberately NOT a setInterval, for the reason the comment above this
      // block already gives about state syncing: a standing interval is never
      // cleared, so it keeps a timer alive for the whole lesson and pins the
      // event loop open in any headless harness. (Written as an interval first;
      // it hung `npm test` at this exact file.) Instead: one bounded timeout to
      // cover the window before the student has done anything, and then a beat
      // that rides the activity debounce, which is already running.
      function beat() {
        toParent({ source: "neft-lesson", type: "heartbeat", protocol: 2 });
      }
      setTimeout(beat, 4000);

      // Height. Reported only when it CHANGES by more than a threshold, so an
      // ordinary scroll or a font swap does not become a message storm. The
      // wrapper validates and bounds the value; nothing here is trusted there.
      var lastHeight = 0;
      function reportHeight() {
        safe(function () {
          var el = document.documentElement;
          var h = Math.max(el.scrollHeight, document.body ? document.body.scrollHeight : 0);
          if (!h || Math.abs(h - lastHeight) < 40) return;
          lastHeight = h;
          toParent({ source: "neft-lesson", type: "height", protocol: 2, px: h });
        });
      }
      reportHeight();
      if (typeof ResizeObserver === "function") {
        safe(function () {
          new ResizeObserver(reportHeight).observe(document.documentElement);
        });
      } else {
        global.addEventListener("resize", reportHeight);
      }
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
      '<input id="nt-cb-input" readonly value="' +
      String(code).replace(/"/g, "&quot;") +
      '" ' +
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
      setTimeout(function () {
        copyBtn.textContent = "Copy";
      }, 1600);
    }
    function doCopy() {
      return (navigator.clipboard ? navigator.clipboard.writeText(code) : Promise.reject()).then(
        flag,
        function () {
          safe(function () {
            input.select();
            document.execCommand("copy");
            flag();
          });
        },
      );
    }
    copyBtn.addEventListener("click", doCopy);
    doCopy().catch(function () {});
    function close() {
      card.remove();
    }
    card.querySelector("#nt-cb-close").addEventListener("click", close);
    card.addEventListener("click", function (e) {
      if (e.target === card) close();
    });
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
    // completionOnly — the pathway has NO scoreable terminus, so there is no
    // percent it could honestly report. Small-group, catch-up and unit-project
    // pathways never reach engine/core/app.js's phase-completion fire (they do
    // not route through createApp at all), and a unit project is multi-day
    // rubric work a teacher grades. Reporting a number here would be inventing
    // one — and the number this function would otherwise use is a hardcoded
    // 100. Relay resume state and stop; never post a score.
    if (cfg.completionOnly) {
      setFinishedUI();
      syncScormState();
      return;
    }
    var id = identity();
    var studentName = opts && opts.studentName != null ? opts.studentName : id.studentName;
    var classPeriod = opts && opts.classPeriod != null ? opts.classPeriod : id.classPeriod;
    var pct = typeof percent === "number" ? percent : id.percent;
    if (typeof pct !== "number") pct = 100; // an explicit complete() with no data = done
    pct = Math.max(0, Math.min(100, Math.round(pct)));

    reportScore(pct);
    setFinishedUI();
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

  /**
   * Universal "I'm finished" button — shown ONLY inside a SCORM launch. Open-
   * ended activities (sandboxes, labs) never drive save/resume to 100%, so they
   * would never auto-post. This gives every activity a guaranteed way to send
   * completion to the Canvas gradebook. Activities that DO reach 100% auto-fire
   * first; this button then just reads "Sent ✓".
   */
  function scormFinishUI() {
    if (!isScormLaunch()) return;
    // finishButton:false — for hosts that already have their own instructional
    // completion contract. The engine lessons do: app.js fires exactly once when
    // EVERY phase reaches "completed", and reports the real percent
    // (totalCorrect/totalAttempts). This button posts a hardcoded 100, so on
    // such a host it would both cover the lesson UI and let a student send a
    // perfect score without doing the work. Defaults to ON, so every standalone
    // activity and homework page keeps the behaviour it has today.
    if (cfg.finishButton === false) return;
    if (!document.body || document.getElementById("nt-cb-finish")) return;
    var b = document.createElement("button");
    b.id = "nt-cb-finish";
    b.type = "button";
    b.textContent = "✓ I'm finished";
    b.setAttribute("aria-label", "Mark this activity finished and send my completion to Canvas");
    b.style.cssText =
      "position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:2147483646;" +
      "background:#1c8c8c;color:#fff;border:0;border-radius:999px;padding:14px 22px;" +
      "font:700 16px system-ui,Segoe UI,sans-serif;box-shadow:0 8px 24px rgba(15,23,42,.32);" +
      "cursor:pointer;min-height:48px;";
    b.addEventListener("click", function () {
      complete(100);
    });
    document.body.appendChild(b);
  }

  /** Flip the finish button to a confirmed state after a completion fires. */
  function setFinishedUI() {
    var b = document.getElementById("nt-cb-finish");
    if (!b) return;
    b.textContent = "✓ Sent to Canvas";
    b.disabled = true;
    b.style.background = "#2e9e5b";
    b.style.cursor = "default";
  }

  /** Watch save/resume progress and auto-complete once at the threshold. */
  function startAutoWatch() {
    if (cfg.manual || cfg.auto === false) return;
    var threshold = typeof cfg.threshold === "number" ? cfg.threshold : 100;
    var timer = setInterval(function () {
      if (fired) {
        clearInterval(timer);
        return;
      }
      var pct = identity().percent;
      if (typeof pct === "number" && pct >= threshold) {
        clearInterval(timer);
        complete(pct);
      }
    }, 1500);
    // Stop watching if the page is unloaded.
    global.addEventListener(
      "pagehide",
      function () {
        clearInterval(timer);
      },
      { once: true },
    );
  }

  global.NeftCanvasBridge = {
    complete: function (percent, opts) {
      return safe(function () {
        return complete(percent, opts);
      });
    },
    reportScore: function (percent) {
      return safe(function () {
        return reportScore(percent);
      });
    },
    isScormLaunch: isScormLaunch,
    reset: function () {
      fired = false;
    },
    __loaded: true,
  };

  // On DOM ready: start the progress auto-watcher, and (in a SCORM launch only)
  // show the universal "I'm finished" button so any activity can post completion.
  function init() {
    startAutoWatch();
    scormFinishUI();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})(typeof window !== "undefined" ? window : this);
