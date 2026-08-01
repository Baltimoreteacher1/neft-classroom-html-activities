// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
/*
 * Learning Supports v2.3 — auto-adaptations engine.
 *
 * Turns assigned accommodation checkboxes (supports-schema.js keys) into live,
 * automatic lesson behavior. Loaded on demand by learning-supports.js (same
 * dynamic pattern as supports-schema.js, cache token carried by the loader).
 *
 * Invariants (release-blocking):
 *   - Additive & reversible: apply(keys) can be called repeatedly; turning a
 *     key off fully removes its effect. Nothing here mutates lesson content.
 *   - Answer-safe: never reveals, removes, or rewrites problems or answers.
 *   - Generic UDL vocabulary on screen — never "IEP"/"ESOL" wording, so a
 *     student's screen never discloses their plan to a shoulder-surfer.
 *   - Fail-soft: every hook is wrapped so a missing engine feature degrades to
 *     "no effect", never a broken lesson.
 *
 * Engine handshake: window.EWLAdapt = { extendedTime, reducedWorkload } is read
 * by engine/core/adaptive.js (practice set sizing) and available to any timer.
 */
(function () {
  "use strict";
  if (window.EWLSupportsAdaptations) return;

  // Keys → behavior modes. A mode turns on when ANY of its keys is assigned.
  var MODE_KEYS = {
    extendedTime: ["time", "iep-extra-time", "esol-extended-time"],
    chunk: ["iep-chunk-text", "iep-chunk-repeat-verbal"],
    reducedWorkload: ["fewer", "esol-selected-portion"],
    praise: ["iep-positive-praise", "iep-immediate-feedback"],
    checkinNudge: ["iep-check-understanding", "esol-frequent-checks"],
    movementNudge: ["iep-movement"],
  };

  var state = {
    active: {}, // mode -> true
    timers: [], // interval/timeout ids for nudges
    observer: null, // praise MutationObserver
    lastPraiseAt: 0,
    praiseShown: 0,
    checkinShown: 0,
    movementShown: 0,
    highlightOn: false,
  };

  window.EWLAdapt = window.EWLAdapt || { extendedTime: false, reducedWorkload: false };

  function lessonId() {
    return document.documentElement.getAttribute("data-ewl-supports-lesson") || location.pathname;
  }

  // ---- toast region (polite, auto-dismissing, one at a time) ---------------
  var toastRegion = null;
  function ensureToastRegion() {
    if (toastRegion && document.body.contains(toastRegion)) return toastRegion;
    toastRegion = document.createElement("div");
    toastRegion.className = "ewl-adapt-toast-region";
    toastRegion.setAttribute("aria-live", "polite");
    document.body.appendChild(toastRegion);
    return toastRegion;
  }
  function toast(text, actionLabel, onAction) {
    try {
      var region = ensureToastRegion();
      region.textContent = "";
      var t = document.createElement("div");
      t.className = "ewl-adapt-toast";
      var span = document.createElement("span");
      span.textContent = text;
      t.appendChild(span);
      if (actionLabel && onAction) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "ewl-adapt-toast-btn";
        b.textContent = actionLabel;
        b.addEventListener("click", function () {
          t.remove();
          onAction();
        });
        t.appendChild(b);
      }
      var x = document.createElement("button");
      x.type = "button";
      x.className = "ewl-adapt-toast-close";
      x.setAttribute("aria-label", "Dismiss");
      x.textContent = "✕";
      x.addEventListener("click", function () {
        t.remove();
      });
      t.appendChild(x);
      region.appendChild(t);
      setTimeout(function () {
        if (t.parentNode) t.remove();
      }, 9000);
    } catch (_e) {
      /* fail-soft */
    }
  }

  function clickDockTool(tool) {
    var b = document.querySelector('[data-ewl-supports-tools] [data-tool="' + tool + '"]');
    if (b) b.click();
  }

  // ---- mode: extended time --------------------------------------------------
  var timePill = null;
  function setExtendedTime(on) {
    window.EWLAdapt.extendedTime = on;
    document.body.classList.toggle("ewl-adapt-extended-time", on);
    if (on && !timePill) {
      timePill = document.createElement("div");
      timePill.className = "ewl-adapt-time-pill";
      timePill.textContent = "⏳ Take your time — no rush";
      document.body.appendChild(timePill);
    } else if (!on && timePill) {
      timePill.remove();
      timePill = null;
    }
  }

  // ---- mode: chunking (one thing at a time) ----------------------------------
  // CSS-only: cards outside the one being worked on soften; hover/focus restores.
  function setChunk(on) {
    document.body.classList.toggle("ewl-adapt-chunk", on);
  }

  // ---- mode: adjusted workload ------------------------------------------------
  // engine/core/adaptive.js reads the flag when the Practice phase mounts and
  // caps the served practice set (never below 3 problems).
  var workloadPill = null;
  function setReducedWorkload(on) {
    window.EWLAdapt.reducedWorkload = on;
    document.body.classList.toggle("ewl-adapt-reduced-workload", on);
    if (on && !workloadPill) {
      workloadPill = document.createElement("div");
      workloadPill.className = "ewl-adapt-workload-pill";
      workloadPill.textContent = "🎯 Shorter practice set — quality over quantity";
      document.body.appendChild(workloadPill);
    } else if (!on && workloadPill) {
      workloadPill.remove();
      workloadPill = null;
    }
  }

  // ---- mode: praise / immediate feedback --------------------------------------
  // Watches the engine's own feedback DOM (.problem-check-result.is-correct,
  // .sp-reveal) — no engine coupling beyond public class names; throttled so it
  // encourages rather than nags.
  var PRAISE = [
    "🌟 Nice work — that effort is paying off!",
    "💪 You solved that one. Keep going!",
    "🎉 Great thinking — on to the next!",
    "🚀 You're building real skill here.",
    "👏 Excellent — your steps made that clear.",
  ];
  function maybePraise() {
    var now = Date.now();
    if (now - state.lastPraiseAt < 20000) return;
    state.lastPraiseAt = now;
    toast(PRAISE[state.praiseShown % PRAISE.length]);
    state.praiseShown++;
  }
  function setPraise(on) {
    if (on && !state.observer) {
      try {
        state.observer = new MutationObserver(function (muts) {
          for (var i = 0; i < muts.length; i++) {
            var m = muts[i];
            var node = m.type === "attributes" ? m.target : null;
            var added = m.addedNodes || [];
            for (var j = 0; j < added.length; j++) {
              var n = added[j];
              if (n && n.nodeType === 1) {
                if (
                  (n.matches && n.matches(".problem-check-result.is-correct")) ||
                  (n.querySelector && n.querySelector(".problem-check-result.is-correct"))
                ) {
                  maybePraise();
                  return;
                }
              }
            }
            if (
              node &&
              node.nodeType === 1 &&
              node.matches &&
              node.matches(".problem-check-result.visible.is-correct")
            ) {
              maybePraise();
              return;
            }
          }
        });
        state.observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ["class"],
        });
      } catch (_e) {
        state.observer = null;
      }
    } else if (!on && state.observer) {
      state.observer.disconnect();
      state.observer = null;
    }
  }

  // ---- mode: check-in / movement nudges ----------------------------------------
  function scheduleNudges(on) {
    // clear all timers; re-arm the active nudges
    state.timers.forEach(clearInterval);
    state.timers = [];
    if (on.checkinNudge) {
      state.timers.push(
        setInterval(function () {
          if (document.hidden || state.checkinShown >= 3) return;
          state.checkinShown++;
          toast("❤️ Quick check: how is it going?", "Check in", function () {
            clickDockTool("checkin");
          });
        }, 420000), // every 7 min
      );
    }
    if (on.movementNudge) {
      state.timers.push(
        setInterval(function () {
          if (document.hidden || state.movementShown >= 2) return;
          state.movementShown++;
          toast("🌿 Time for a quick stretch?", "Take a break", function () {
            clickDockTool("break");
          });
        }, 720000), // every 12 min
      );
    }
  }

  // ============================================================================
  // Dock tools (directions / highlighter / organizer). learning-supports.js owns
  // the buttons; it delegates clicks here via toggleTool(name, btn).
  // ============================================================================
  var panel = null;
  function closePanel() {
    if (panel) {
      panel.remove();
      panel = null;
    }
  }
  function openPanel(title, build) {
    closePanel();
    panel = document.createElement("div");
    panel.className = "ewl-adapt-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", title);
    var head = document.createElement("div");
    head.className = "ewl-adapt-panel-head";
    var h = document.createElement("h3");
    h.textContent = title;
    var close = document.createElement("button");
    close.type = "button";
    close.className = "ewl-adapt-panel-close";
    close.setAttribute("aria-label", "Close");
    close.textContent = "✕";
    close.addEventListener("click", closePanel);
    head.appendChild(h);
    head.appendChild(close);
    panel.appendChild(head);
    var body = document.createElement("div");
    body.className = "ewl-adapt-panel-body";
    panel.appendChild(body);
    build(body);
    document.body.appendChild(panel);
    close.focus();
  }

  // ---- tool: directions helper ------------------------------------------------
  // Harvests the CURRENT visible section heading + instruction callouts and
  // re-presents them as short numbered steps with a read-aloud button. Never
  // touches problem stems or answers.
  function harvestDirections() {
    var out = { heading: "", steps: [] };
    try {
      var main = document.querySelector("main") || document.body;
      var headings = Array.prototype.filter.call(
        main.querySelectorAll("h1, h2, h3"),
        function (el) {
          return el.offsetParent !== null && el.textContent.trim();
        },
      );
      if (headings.length) out.heading = headings[headings.length - 1].textContent.trim();
      var callouts = Array.prototype.filter.call(
        main.querySelectorAll(
          ".instruction-callout, .callout, .phase-intro, .sp-intro, .directions, .lesson-directions",
        ),
        function (el) {
          return el.offsetParent !== null && el.textContent.trim();
        },
      );
      var text = callouts
        .map(function (el) {
          return el.textContent.replace(/\s+/g, " ").trim();
        })
        .join(" ");
      if (!text && headings.length) {
        // Fall back to the first paragraph after the visible heading.
        var sib = headings[headings.length - 1].nextElementSibling;
        while (sib && !text) {
          if (sib.matches && sib.matches("p")) text = sib.textContent.replace(/\s+/g, " ").trim();
          sib = sib.nextElementSibling;
        }
      }
      // Split into short sentence steps (max 6).
      out.steps = (text.match(/[^.!?]+[.!?]?/g) || [])
        .map(function (s) {
          return s.trim();
        })
        .filter(function (s) {
          return s.length > 2;
        })
        .slice(0, 6);
    } catch (_e) {
      /* fail-soft */
    }
    return out;
  }
  function speak(text) {
    try {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    } catch (_e) {
      /* fail-soft */
    }
  }
  function toggleDirections() {
    if (panel && panel.getAttribute("aria-label") === "Directions, step by step") {
      closePanel();
      return;
    }
    var d = harvestDirections();
    openPanel("Directions, step by step", function (body) {
      if (d.heading) {
        var h = document.createElement("p");
        h.className = "ewl-adapt-dir-heading";
        h.textContent = "📍 " + d.heading;
        body.appendChild(h);
      }
      if (d.steps.length) {
        var ol = document.createElement("ol");
        ol.className = "ewl-adapt-dir-steps";
        d.steps.forEach(function (s) {
          var li = document.createElement("li");
          li.textContent = s;
          ol.appendChild(li);
        });
        body.appendChild(ol);
      } else {
        var p = document.createElement("p");
        p.textContent =
          "No written directions found on this part. Ask your teacher, or tap 🔊 Listen to hear the page.";
        body.appendChild(p);
      }
      var row = document.createElement("div");
      row.className = "ewl-adapt-dir-row";
      var read = document.createElement("button");
      read.type = "button";
      read.className = "ewl-adapt-toast-btn";
      read.textContent = "🔊 Read to me";
      read.addEventListener("click", function () {
        speak((d.heading ? d.heading + ". " : "") + d.steps.join(" "));
      });
      var refresh = document.createElement("button");
      refresh.type = "button";
      refresh.className = "ewl-adapt-toast-btn";
      refresh.textContent = "🔁 Refresh";
      refresh.addEventListener("click", toggleDirections);
      row.appendChild(read);
      row.appendChild(refresh);
      body.appendChild(row);
    });
  }

  // ---- tool: highlighter --------------------------------------------------------
  // While on, selecting text wraps it in <mark>. Clicking a mark removes it.
  // Session-only (never persisted), skips form fields, fails soft on complex
  // selections that cross element boundaries.
  function onHighlightMouseUp() {
    try {
      var sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) return;
      var range = sel.getRangeAt(0);
      var container = range.commonAncestorContainer;
      var el = container.nodeType === 1 ? container : container.parentElement;
      if (!el || el.closest("input, textarea, [contenteditable], .ewl-adapt-panel")) return;
      var mark = document.createElement("mark");
      mark.className = "ewl-adapt-mark";
      mark.title = "Tap to remove highlight";
      try {
        range.surroundContents(mark);
      } catch (_e) {
        return; // selection crosses element boundaries — skip quietly
      }
      sel.removeAllRanges();
    } catch (_e) {
      /* fail-soft */
    }
  }
  function onMarkClick(e) {
    var m = e.target && e.target.closest && e.target.closest("mark.ewl-adapt-mark");
    if (!m) return;
    var parent = m.parentNode;
    while (m.firstChild) parent.insertBefore(m.firstChild, m);
    m.remove();
    parent.normalize();
  }
  function setHighlighter(on, btn) {
    state.highlightOn = on;
    document.body.classList.toggle("ewl-adapt-highlighting", on);
    if (btn) {
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    }
    if (on) {
      document.addEventListener("mouseup", onHighlightMouseUp);
      document.addEventListener("click", onMarkClick);
      toast("🖍 Highlighter on — select any text to highlight it. Tap a highlight to remove it.");
    } else {
      document.removeEventListener("mouseup", onHighlightMouseUp);
      document.removeEventListener("click", onMarkClick);
    }
  }

  // ---- tool: graphic organizer ---------------------------------------------------
  // Four-square problem-solving organizer, persisted per lesson on this device.
  var ORGANIZER_SQUARES = [
    { id: "know", label: "1 · What do I know?" },
    { id: "find", label: "2 · What do I need to find?" },
    { id: "plan", label: "3 · My plan" },
    { id: "work", label: "4 · My work & answer" },
  ];
  function organizerKey() {
    return "ewl-adapt-organizer:" + lessonId();
  }
  function toggleOrganizer() {
    if (panel && panel.getAttribute("aria-label") === "Graphic organizer") {
      closePanel();
      return;
    }
    var saved = {};
    try {
      saved = JSON.parse(localStorage.getItem(organizerKey()) || "{}") || {};
    } catch (_e) {
      saved = {};
    }
    openPanel("Graphic organizer", function (body) {
      var grid = document.createElement("div");
      grid.className = "ewl-adapt-organizer";
      ORGANIZER_SQUARES.forEach(function (sq) {
        var cell = document.createElement("label");
        cell.className = "ewl-adapt-organizer-cell";
        var cap = document.createElement("span");
        cap.textContent = sq.label;
        var ta = document.createElement("textarea");
        ta.rows = 3;
        ta.value = saved[sq.id] || "";
        ta.addEventListener("input", function () {
          saved[sq.id] = ta.value;
          try {
            localStorage.setItem(organizerKey(), JSON.stringify(saved));
          } catch (_e) {
            /* private mode */
          }
        });
        cell.appendChild(cap);
        cell.appendChild(ta);
        grid.appendChild(cell);
      });
      body.appendChild(grid);
      var hint = document.createElement("p");
      hint.className = "ewl-adapt-organizer-hint";
      hint.textContent = "Saved on this device — it will be here when you come back.";
      body.appendChild(hint);
    });
  }

  function toggleTool(name, btn) {
    if (name === "directions") toggleDirections();
    else if (name === "organizer") toggleOrganizer();
    else if (name === "highlighter") setHighlighter(!state.highlightOn, btn);
  }

  // ============================================================================
  // apply(keys): diff active modes against the assigned key set. Idempotent.
  // ============================================================================
  function apply(keys) {
    var set = Object.create(null);
    (keys || []).forEach(function (k) {
      set[k] = true;
    });
    var on = {};
    Object.keys(MODE_KEYS).forEach(function (mode) {
      on[mode] = MODE_KEYS[mode].some(function (k) {
        return set[k];
      });
    });
    setExtendedTime(!!on.extendedTime);
    setChunk(!!on.chunk);
    setReducedWorkload(!!on.reducedWorkload);
    setPraise(!!on.praise);
    scheduleNudges(on);
    state.active = on;
  }

  window.EWLSupportsAdaptations = {
    version: "2.3.0",
    apply: apply,
    toggleTool: toggleTool,
    modeKeys: MODE_KEYS,
    // test hooks
    _toast: toast,
    _harvestDirections: harvestDirections,
  };
})();
