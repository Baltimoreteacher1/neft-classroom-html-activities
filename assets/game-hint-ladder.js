/* =============================================================================
 * Neft Game Hint Ladder — Socratic, escalating hints for math games.
 * -----------------------------------------------------------------------------
 * Reuses the deployed AI tutor endpoint (POST /api/tutor, mode:"hint") which
 * runs a Socratic system prompt that NEVER reveals the final answer. This
 * module turns that single-hint endpoint into an escalating LADDER:
 *
 *   Rung 1  — Notice: a question that points at what matters.
 *   Rung 2  — Strategy: name the method / relationship to use.
 *   Rung 3  — Set up the step: walk the setup, stop before the final answer.
 *   (then)  — "Explain the idea" (mode:"explain") for the concept.
 *
 * KEY-GATED + FAIL-SAFE. Live AI is used only when the endpoint has a backend
 * (ANTHROPIC_API_KEY or a Workers AI binding). For EVERY failure — not
 * configured (503), rate-limited (429), timeout, network/CORS error, empty
 * reply — the ladder silently falls back to authored static hints for that
 * rung, so the feature is never broken and never blocks gameplay.
 *
 * A game opts in by loading this script + game-hint-ladder.css and calling:
 *   NeftHintLadder.setProblem({
 *     itemText: "A recipe uses 2 cups flour to 3 cups sugar. ...",
 *     standard: "6.RP.3",
 *     staticHints: ["...rung1...", "...rung2...", "...rung3..."], // 1-3 strings
 *   });
 * Call setProblem() again whenever a new problem appears; the ladder resets.
 *
 * No PII is sent. No answer is ever displayed. Honors calm mode / reduced
 * motion via CSS only. Pairs with game-access.js but is independent of it.
 * ========================================================================== */
(function () {
  "use strict";

  if (window.NeftHintLadder) return; // idempotent
  var doc = document;

  var ENDPOINT = "/api/tutor";
  var FETCH_TIMEOUT_MS = 12000;
  var MAX_RUNGS = 3;

  // Escalation framing appended to the tutor request per rung. The endpoint's
  // system prompt already forbids the final answer; this only shapes altitude.
  var RUNG_FRAMING = [
    "Give the FIRST, gentlest hint: ask one short question that helps me notice what matters. Do not name the method yet.",
    "Give the NEXT hint, a little more concrete: name the strategy or relationship I should use, in 1-2 short sentences. Still do not give the answer.",
    "Give the most concrete hint: walk me through SETTING UP the next step, but STOP before the final calculation and never state the final answer.",
  ];

  var state = {
    problem: null, // { itemText, standard, staticHints }
    rung: 0, // rungs revealed so far (0..MAX_RUNGS)
    history: [], // [{role,text}] shared with the endpoint for continuity
    busy: false,
    backend: null, // null=unknown, true/false after health probe
  };

  var els = {}; // cached DOM nodes

  /* ---------------------------------------------------------------- helpers */
  function clamp(s, n) {
    return (typeof s === "string" ? s : "").slice(0, n);
  }

  function withTimeout(promise, ms) {
    var ctrl = new AbortController();
    var t = setTimeout(function () {
      ctrl.abort();
    }, ms);
    return {
      signal: ctrl.signal,
      done: function () {
        clearTimeout(t);
      },
    };
  }

  // One-time, best-effort backend probe so we can label hints honestly. The
  // ladder still works regardless; this only decides the "AI vs coach" badge.
  function probeBackend() {
    try {
      fetch(ENDPOINT + "/health", { method: "GET" })
        .then(function (r) {
          return r.ok ? r.json() : null;
        })
        .then(function (d) {
          state.backend = !!(d && d.live);
        })
        .catch(function () {
          state.backend = false;
        });
    } catch (e) {
      state.backend = false;
    }
  }

  // Ask the endpoint for a hint at the current rung. Resolves to a string, or
  // null if the AI path is unavailable (caller uses the static fallback).
  function fetchAiHint() {
    var p = state.problem;
    if (!p || !p.itemText) return Promise.resolve(null);
    // state.rung is already incremented to the 1-based rung being requested;
    // RUNG_FRAMING is 0-indexed, so subtract 1 to escalate 0 -> 1 -> 2.
    var framing = RUNG_FRAMING[Math.min(state.rung - 1, RUNG_FRAMING.length - 1)];
    var body = {
      mode: "hint",
      standard: clamp(p.standard, 40),
      itemText: clamp(p.itemText, 1800),
      // We pass the escalation instruction as "studentWork" context; the
      // endpoint folds it into the user turn. Keeps the shared contract intact.
      studentWork: framing,
      history: state.history.slice(-6),
    };
    var to = withTimeout(null, FETCH_TIMEOUT_MS);
    return fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: to.signal,
    })
      .then(function (r) {
        to.done();
        if (!r.ok) return null; // 429/503/500 -> fallback
        return r.json();
      })
      .then(function (d) {
        if (d && d.ok && typeof d.reply === "string" && d.reply.trim()) {
          state.backend = true;
          return d.reply.trim();
        }
        return null;
      })
      .catch(function () {
        to.done();
        return null;
      });
  }

  function staticHint(rungIndex) {
    var hints = (state.problem && state.problem.staticHints) || [];
    if (!hints.length) {
      return "Look at what the problem gives you and what it asks for. What is the one relationship that connects them?";
    }
    // Clamp to the last authored hint if fewer than MAX_RUNGS were supplied.
    return hints[Math.min(rungIndex, hints.length - 1)];
  }

  /* ------------------------------------------------------------------- view */
  function ensureUi() {
    if (els.root) return;
    var root = doc.createElement("div");
    root.className = "nt-hl-root";
    root.innerHTML =
      '<button type="button" class="nt-hl-fab" aria-haspopup="dialog" aria-expanded="false">' +
      "💡 <span>Need a hint?</span></button>" +
      '<div class="nt-hl-panel" role="dialog" aria-label="Hints" hidden>' +
      '  <div class="nt-hl-head">' +
      '    <span class="nt-hl-title">Hints</span>' +
      '    <span class="nt-hl-badge" hidden></span>' +
      '    <button type="button" class="nt-hl-close" aria-label="Close hints">×</button>' +
      "  </div>" +
      '  <div class="nt-hl-steps" aria-live="polite"></div>' +
      '  <button type="button" class="nt-hl-more">Show me a hint</button>' +
      '  <div class="nt-hl-foot">Hints guide your thinking — they never give the final answer.</div>' +
      "</div>";
    doc.body.appendChild(root);

    els.root = root;
    els.fab = root.querySelector(".nt-hl-fab");
    els.panel = root.querySelector(".nt-hl-panel");
    els.steps = root.querySelector(".nt-hl-steps");
    els.more = root.querySelector(".nt-hl-more");
    els.badge = root.querySelector(".nt-hl-badge");
    els.close = root.querySelector(".nt-hl-close");

    els.fab.addEventListener("click", togglePanel);
    els.close.addEventListener("click", function () {
      openPanel(false);
    });
    els.more.addEventListener("click", nextRung);
  }

  function showEmptyState() {
    if (!els.steps) return;
    els.steps.innerHTML =
      '<p class="nt-hl-step-text nt-hl-empty">Start a problem, then tap here and I\'ll help you think it through — one hint at a time.</p>';
    if (els.more) {
      els.more.disabled = true;
      els.more.textContent = "Show me a hint";
    }
    if (els.badge) els.badge.hidden = true;
  }

  function openPanel(open) {
    ensureUi();
    els.panel.hidden = !open;
    els.fab.setAttribute("aria-expanded", open ? "true" : "false");
    if (!open) return;
    // No active problem yet (title/menu/results screen): guide, don't fetch.
    if (!state.problem) {
      showEmptyState();
      return;
    }
    if (state.rung === 0) nextRung(); // reveal rung 1 on first open
  }
  function togglePanel() {
    openPanel(els.panel.hidden);
  }

  function setBadge(isAi) {
    if (!els.badge) return;
    els.badge.hidden = false;
    els.badge.textContent = isAi ? "AI coach" : "coach";
    els.badge.classList.toggle("nt-hl-badge-ai", !!isAi);
  }

  function addStep(text, isAi) {
    var step = doc.createElement("div");
    step.className = "nt-hl-step";
    var n = doc.createElement("span");
    n.className = "nt-hl-step-n";
    n.textContent = state.rung; // 1-based; incremented before addStep
    var body = doc.createElement("p");
    body.className = "nt-hl-step-text";
    body.textContent = text;
    step.appendChild(n);
    step.appendChild(body);
    els.steps.appendChild(step);
    setBadge(isAi);
    // Keep continuity for the AI so later rungs build on earlier ones.
    state.history.push({ role: "assistant", text: clamp(text, 1000) });
  }

  function setBusy(on) {
    state.busy = on;
    if (!els.more) return;
    els.more.disabled = on;
    els.more.textContent = on
      ? "Thinking…"
      : state.rung >= MAX_RUNGS
        ? "Explain the idea"
        : "Show me another hint";
  }

  function nextRung() {
    if (state.busy || !state.problem) return;

    // After the ladder is exhausted, the "more" button switches to concept
    // explanation (still answer-free via the endpoint's explain mode).
    if (state.rung >= MAX_RUNGS) {
      explainConcept();
      return;
    }

    state.rung += 1;
    setBusy(true);
    fetchAiHint().then(function (aiText) {
      var text = aiText || staticHint(state.rung - 1);
      addStep(text, !!aiText);
      setBusy(false);
    });
  }

  function explainConcept() {
    if (state.busy || !state.problem) return;
    setBusy(true);
    var p = state.problem;
    var to = withTimeout(null, FETCH_TIMEOUT_MS);
    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "explain",
        standard: clamp(p.standard, 40),
        itemText: clamp(p.itemText, 1800),
        history: state.history.slice(-6),
      }),
      signal: to.signal,
    })
      .then(function (r) {
        to.done();
        return r.ok ? r.json() : null;
      })
      .then(function (d) {
        var text =
          d && d.ok && d.reply && d.reply.trim()
            ? d.reply.trim()
            : "Think about the big idea: this kind of problem is about a relationship you can scale up or down. Re-read the numbers and ask what stays the same.";
        var step = doc.createElement("div");
        step.className = "nt-hl-step nt-hl-step-explain";
        var body = doc.createElement("p");
        body.className = "nt-hl-step-text";
        body.textContent = text;
        step.appendChild(body);
        els.steps.appendChild(step);
        setBadge(!!(d && d.ok));
        setBusy(false);
        els.more.disabled = true; // ladder + explanation complete
      })
      .catch(function () {
        // Network/timeout must never leave the student with nothing —
        // mirror the non-ok path with the static big-idea fallback.
        to.done();
        var step = doc.createElement("div");
        step.className = "nt-hl-step nt-hl-step-explain";
        var body = doc.createElement("p");
        body.className = "nt-hl-step-text";
        body.textContent =
          "Think about the big idea: this kind of problem is about a relationship you can scale up or down. Re-read the numbers and ask what stays the same.";
        step.appendChild(body);
        els.steps.appendChild(step);
        setBadge(false);
        setBusy(false);
        els.more.disabled = true; // ladder + explanation complete
      });
  }

  /* --------------------------------------------------------------- public API */
  function setProblem(problem) {
    if (!problem || typeof problem !== "object") return;
    state.problem = {
      itemText: clamp(problem.itemText, 1800),
      standard: clamp(problem.standard, 40),
      staticHints: Array.isArray(problem.staticHints)
        ? problem.staticHints
            .map(function (h) {
              return clamp(h, 400);
            })
            .filter(Boolean)
        : [],
    };
    state.rung = 0;
    state.history = [];
    ensureUi();
    if (els.steps) els.steps.innerHTML = "";
    if (els.badge) els.badge.hidden = true;
    setBusy(false);
    // Reset the "more" label; collapse the panel so a new problem starts fresh.
    if (els.more) els.more.textContent = "Show me a hint";
    openPanel(false);
  }

  // Generic driver: watch a DOM element that mirrors the current problem (these
  // Phaser games write the live problem into a screen-reader status region via
  // srSay). On each genuine new problem, publish it to the ladder. This lets a
  // game opt in with zero changes to its closure/game logic — just a selector.
  //
  // opts: { sourceSelector, standard, staticHints }
  function watch(opts) {
    if (!opts || !opts.sourceSelector) return;
    ensureUi();
    var standard = clamp(opts.standard, 40);
    var staticHints = Array.isArray(opts.staticHints) ? opts.staticHints : [];
    // Optional allow-list: when a game's status region also carries non-problem
    // chatter (interaction feedback, intros), pass an `accept` regex source so
    // ONLY genuine problem announcements are ingested. When absent, any
    // non-result text qualifies (fine for single-format games).
    var acceptRe = null;
    if (opts.accept) {
      try {
        acceptRe = new RegExp(opts.accept, "i");
      } catch (e) {
        acceptRe = null;
      }
    }

    // Result/answer announcements must never become itemText — they may contain
    // the solution (games announce "Correct. <why>"). Accept only problem-like
    // statements, and require a real change before resetting the ladder.
    function looksLikeProblem(t) {
      if (!t || t.length < 14) return false;
      if (
        /\b(correct|nice|great job|well done|try again|not quite|oops|incorrect|marker at|placed|equivalent|you got|you win|game over|score|level up)\b/i.test(
          t,
        )
      )
        return false;
      if (/[✓✗]/.test(t)) return false;
      if (acceptRe && !acceptRe.test(t)) return false;
      return true;
    }

    function ingest(raw) {
      var t = (raw || "").replace(/\s+/g, " ").trim();
      if (!looksLikeProblem(t)) return;
      var next = clamp(t, 1800);
      if (state.problem && state.problem.itemText === next) return; // unchanged
      setProblem({
        itemText: next,
        standard: standard,
        staticHints: staticHints,
      });
    }

    var el = doc.querySelector(opts.sourceSelector);
    if (el) {
      ingest(el.textContent);
      try {
        var mo = new MutationObserver(function () {
          ingest(el.textContent);
        });
        mo.observe(el, { childList: true, characterData: true, subtree: true });
      } catch (e) {
        /* MutationObserver unsupported — first-read still works */
      }
    }
    // Fallback: (re-)read the source the moment the student opens the panel, in
    // case no mutation fired (e.g. problem set before the observer attached).
    if (els.fab) {
      els.fab.addEventListener("click", function () {
        if (!state.problem && el) ingest(el.textContent);
      });
    }
  }

  window.NeftHintLadder = {
    setProblem: setProblem,
    watch: watch,
    // Manual controls (optional).
    open: function () {
      openPanel(true);
    },
    reset: function () {
      if (state.problem) setProblem(state.problem);
    },
  };

  // On ready: show the hint button immediately (so students can always find it,
  // even before the first problem renders) and probe the backend (non-blocking).
  function onReady() {
    ensureUi();
    probeBackend();
  }
  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", onReady, { once: true });
  } else {
    onReady();
  }
})();
