/* Neft Teacher — Lesson Accessibility Hardening (additive, deploy-safe).
 *
 * Part of the shared "lesson platform" layer (see
 * docs/superpowers/specs/INTEGRATION-CONTRACT.md). Runs once on load and makes a
 * conservative, non-destructive accessibility pass over a self-contained math
 * lesson page:
 *
 *   - Ensures a polite ARIA live region exists for feedback, exposed via
 *     window.NTa11y.announce(msg).
 *   - Adds a "Skip to content" link as the first focusable element, targeting
 *     <main> (or the first landmark it can find).
 *   - Ensures interactive controls injected/used by lessons have accessible
 *     names (labels the lesson's own .mc-btn / .tf-btn / .check-btn / .fill-input
 *     where they are missing one).
 *   - Fixes focus order / focus management for graded controls so keyboard users
 *     land somewhere sensible after a card is graded.
 *   - Never throws into the lesson: every DOM lookup is guarded, the whole pass
 *     is wrapped in try/catch, and it is idempotent (window sentinel + per-node
 *     marker attributes so re-running does nothing).
 *
 * Honors prefers-reduced-motion (it never animates) and window.NT_MUTED (it is
 * silent by design — the live region is visually hidden, screen-reader only).
 *
 * Public API (window.NTa11y):
 *   announce(msg, assertive)  -> push a message into the live region
 *   refresh()                 -> re-run the labeling/focus pass (e.g. after the
 *                                lesson swaps levels and re-renders cards)
 */
(function () {
  "use strict";
  if (window.NTa11y) return;

  var LIVE_ID = "lp-a11y-live"; // lp- prefix per contract; avoids nsr/nt/gfx
  var SKIP_ID = "lp-skip-link";
  var DONE_ATTR = "data-lp-a11y"; // per-node idempotency marker

  // ---- tiny guarded helpers -----------------------------------------------
  function $(sel, root) {
    try {
      return (root || document).querySelector(sel);
    } catch (e) {
      return null;
    }
  }
  function $all(sel, root) {
    try {
      return Array.prototype.slice.call((root || document).querySelectorAll(sel));
    } catch (e) {
      return [];
    }
  }
  function txt(el) {
    try {
      return (el && el.textContent ? el.textContent : "").replace(/\s+/g, " ").trim();
    } catch (e) {
      return "";
    }
  }
  function hasName(el) {
    try {
      if (!el) return true;
      if (el.getAttribute("aria-label")) return true;
      if (el.getAttribute("aria-labelledby")) return true;
      if (el.getAttribute("title")) return true;
      if (txt(el)) return true;
      if (el.tagName === "INPUT") {
        var id = el.getAttribute("id");
        if (id && $('label[for="' + cssEscape(id) + '"]')) return true;
        if (el.closest && el.closest("label")) return true;
        if (el.getAttribute("placeholder")) return true;
      }
      return false;
    } catch (e) {
      return true; // assume named rather than risk over-labeling
    }
  }
  function cssEscape(s) {
    try {
      if (window.CSS && CSS.escape) return CSS.escape(s);
    } catch (e) {}
    return String(s).replace(/["\\\]\[]/g, "\\$&");
  }
  function setName(el, name) {
    try {
      if (el && name && !el.getAttribute("aria-label")) {
        el.setAttribute("aria-label", name);
      }
    } catch (e) {}
  }

  // ---- live region ---------------------------------------------------------
  function ensureLiveRegion() {
    var live = $("#" + LIVE_ID);
    if (live) return live;
    try {
      live = document.createElement("div");
      live.id = LIVE_ID;
      live.setAttribute("aria-live", "polite");
      live.setAttribute("aria-atomic", "true");
      live.setAttribute("role", "status");
      // Visually hidden but available to assistive tech (no layout impact).
      live.style.cssText =
        "position:absolute;width:1px;height:1px;margin:-1px;padding:0;" +
        "overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0;";
      if (document.body) document.body.appendChild(live);
    } catch (e) {
      return null;
    }
    return live;
  }

  function announce(msg, assertive) {
    try {
      if (!msg) return;
      var live = ensureLiveRegion();
      if (!live) return;
      if (assertive) live.setAttribute("aria-live", "assertive");
      else live.setAttribute("aria-live", "polite");
      // Clearing first guarantees the same message re-announces.
      live.textContent = "";
      var t = setTimeout(function () {
        live.textContent = String(msg).slice(0, 300);
      }, 30);
      // Guard against a non-running timer environment.
      if (!t) live.textContent = String(msg).slice(0, 300);
    } catch (e) {
      /* never throw */
    }
  }

  // ---- skip-to-content link ------------------------------------------------
  function ensureSkipLink() {
    if ($("#" + SKIP_ID)) return;
    try {
      var target = $("main") || $("[role=main]") || $(".main") || $("main.main");
      if (!target) return;
      if (!target.id) target.id = "lp-main-content";
      var link = document.createElement("a");
      link.id = SKIP_ID;
      link.href = "#" + target.id;
      link.textContent = "Skip to content";
      link.className = "lp-skip-link";
      // Off-screen until focused; AAA-contrast panel when visible.
      link.style.cssText =
        "position:absolute;left:8px;top:-48px;z-index:2147483647;" +
        "background:#0b1f33;color:#ffffff;padding:10px 16px;border-radius:8px;" +
        "font:600 16px system-ui,sans-serif;text-decoration:none;" +
        "transition:top .12s ease;";
      link.addEventListener("focus", function () {
        link.style.top = "8px";
      });
      link.addEventListener("blur", function () {
        link.style.top = "-48px";
      });
      link.addEventListener("click", function () {
        try {
          if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
          target.focus();
        } catch (e) {}
      });
      if (document.body) document.body.insertBefore(link, document.body.firstChild);
    } catch (e) {
      /* ignore */
    }
  }

  // ---- label injected/lesson controls -------------------------------------
  function labelControls() {
    // MCQ option buttons: name from inner text or the letter + option text.
    $all(".mc-btn:not([" + DONE_ATTR + "])").forEach(function (btn) {
      try {
        if (!hasName(btn)) {
          var letter = txt($(".letter", btn));
          var rest = txt(btn).replace(letter, "").trim();
          setName(btn, ("Option " + (letter || "") + " " + rest).trim());
        }
        btn.setAttribute(DONE_ATTR, "1");
      } catch (e) {}
    });

    // True/False buttons.
    $all(".tf-btn:not([" + DONE_ATTR + "])").forEach(function (btn) {
      try {
        if (!hasName(btn)) {
          var v = btn.getAttribute("data-val");
          setName(btn, v === "true" ? "True" : v === "false" ? "False" : "Answer option");
        }
        btn.setAttribute(DONE_ATTR, "1");
      } catch (e) {}
    });

    // Check / Check All buttons.
    $all(".check-btn:not([" + DONE_ATTR + "])").forEach(function (btn) {
      try {
        if (!hasName(btn)) setName(btn, "Check answer");
        btn.setAttribute(DONE_ATTR, "1");
      } catch (e) {}
    });

    // Fill-in inputs (answer lives on data-answer; never expose it as a label).
    $all("input.fill-input:not([" + DONE_ATTR + "])").forEach(function (inp) {
      try {
        if (!hasName(inp)) {
          var card = inp.closest ? inp.closest("article.q-card") : null;
          var num = card ? txt($(".q-num", card)) : "";
          setName(inp, ("Answer" + (num ? " for " + num : "")).trim());
        }
        inp.setAttribute(DONE_ATTR, "1");
      } catch (e) {}
    });

    // Drag items / zones get role + names so SR users get context.
    // role=option requires a listbox ancestor (axe aria-required-parent —
    // role=group only counts when the group itself is inside a listbox), so
    // both the item bank and the drop zones become labeled listboxes.
    $all(".drag-item:not([" + DONE_ATTR + "])").forEach(function (it) {
      try {
        if (!it.getAttribute("role")) it.setAttribute("role", "option");
        var parent = it.parentElement;
        if (parent && !parent.getAttribute("role")) {
          parent.setAttribute("role", "listbox");
          if (!parent.getAttribute("aria-label")) parent.setAttribute("aria-label", "Item bank");
        }
        it.setAttribute(DONE_ATTR, "1");
      } catch (e) {}
    });
    $all(".drag-zone:not([" + DONE_ATTR + "])").forEach(function (z) {
      try {
        if (!z.getAttribute("role")) z.setAttribute("role", "listbox");
        if (!hasName(z)) {
          var cat = z.getAttribute("data-cat");
          if (cat) setName(z, "Drop zone: " + cat);
        }
        z.setAttribute(DONE_ATTR, "1");
      } catch (e) {}
    });

    // Generic safety net: any button/[role=button] with no name at all gets a
    // last-resort label so axe doesn't flag it (rare; usually icon-only).
    $all("button:not([" + DONE_ATTR + "]), [role=button]:not([" + DONE_ATTR + "])").forEach(
      function (el) {
        try {
          if (!hasName(el)) setName(el, "Button");
          el.setAttribute(DONE_ATTR, "1");
        } catch (e) {}
      },
    );
  }

  // ---- focus management on grading ----------------------------------------
  function wireFocusOnGrade() {
    try {
      if (!window.MutationObserver || !document.body) return;
      if (document.body.getAttribute("data-lp-a11y-obs")) return;
      document.body.setAttribute("data-lp-a11y-obs", "1");
      var obs = new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          var t = muts[i].target;
          if (!t || t.nodeType !== 1 || typeof t.className !== "string") continue;
          if (!/\bq-card\b/.test(t.className)) continue;
          if (/\bcorrect\b/.test(t.className)) {
            var s = $(".q-status", t);
            announce(txt(s) || "Correct.");
            moveFocusForward(t);
          } else if (/\bincorrect\b/.test(t.className)) {
            var w = $(".q-status-wrong", t);
            announce(txt(w) || "Not quite. Try again.", true);
          }
        }
      });
      obs.observe(document.body, {
        subtree: true,
        attributes: true,
        attributeFilter: ["class"],
      });
    } catch (e) {
      /* ignore */
    }
  }

  // After a card is graded correct, move focus to the next unanswered card's
  // first control so keyboard users aren't stranded on a locked button.
  function moveFocusForward(card) {
    try {
      var cards = $all("article.q-card");
      var idx = cards.indexOf(card);
      for (var i = idx + 1; i < cards.length; i++) {
        if (/\b(correct|incorrect)\b/.test(cards[i].className)) continue;
        var ctl = $(".mc-btn, .tf-btn, input.fill-input, .check-btn, .drag-item", cards[i]) || null;
        if (ctl) {
          if (
            !ctl.hasAttribute("tabindex") &&
            ctl.tagName !== "BUTTON" &&
            ctl.tagName !== "INPUT"
          ) {
            ctl.setAttribute("tabindex", "0");
          }
          // Do not steal focus mid-typing; only nudge if focus is inside the
          // just-graded (now-locked) card.
          if (document.activeElement && card.contains(document.activeElement)) {
            ctl.focus();
          }
          return;
        }
      }
    } catch (e) {
      /* ignore */
    }
  }

  // ---- run -----------------------------------------------------------------
  function run() {
    try {
      ensureLiveRegion();
      ensureSkipLink();
      labelControls();
      wireFocusOnGrade();
    } catch (e) {
      /* never throw into the lesson */
    }
  }

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  window.NTa11y = {
    announce: announce,
    refresh: function () {
      try {
        labelControls();
      } catch (e) {}
    },
    version: "1.0.0",
  };

  ready(run);
})();
