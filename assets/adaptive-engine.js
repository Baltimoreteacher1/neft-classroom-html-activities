/*!
 * adaptive-engine.js — Neft Lesson Platform · Layer 1: Adaptive Mastery Engine.
 *
 * Additive, dependency-free, deploy-safe overlay for self-contained math
 * lesson HTML pages (see docs/superpowers/specs/INTEGRATION-CONTRACT.md).
 *
 * What it does (without ever touching the lesson's own grading logic):
 *   - Scans the lesson for gradeable items (.q-card[data-q] with a .check-btn
 *     and/or input.fill-input[data-answer]) and groups them into "skills"
 *     (by section: Warm-Up / Practice / Challenge, or by data-q prefix).
 *   - Observes the LESSON'S OWN result classes (.q-card.correct/.incorrect,
 *     .mc-btn.is-correct/.is-wrong, .fill-input.is-correct/.is-wrong) via a
 *     MutationObserver. It NEVER re-grades — the lesson stays the source of
 *     truth — it only reacts to outcomes the lesson already decided.
 *   - On a wrong answer: injects an inline, accessible, targeted re-teach
 *     micro-block plus a Socratic hint ladder (escalating hints that NEVER
 *     reveal the answer) and offers a fresh attempt at a similar item.
 *   - On a correct answer: advances the per-skill mastery state machine.
 *   - Mastery: advance after a threshold (default 2 consecutive correct OR
 *     >=80% accuracy). Reads optional window.NT_MISCONCEPTIONS (item -> tag)
 *     and window.NT_LESSON_LEVEL (0/1/2) for difficulty laddering. Degrades
 *     gracefully when those are absent.
 *   - Emits telemetry via window.NTtelemetry?.track(event) if present
 *     (item_attempt, hint_used, mastery_reached) — never a hard dependency.
 *   - Spaced retrieval: if window.NT_PRIOR_ITEMS exists, renders 1-2 review
 *     items at the top of the lesson.
 *
 * Hard rules: never throws into the host lesson (everything guarded + wrapped
 * in try/catch, every DOM lookup guarded), idempotent (window sentinel),
 * respects prefers-reduced-motion and window.NT_MUTED, reuses window.GameFX and
 * shared CSS tokens, all platform classes/ids namespaced `lp-`. Pairs with
 * adaptive-engine.css.
 *
 * Public API: window.NTAdaptive = { init, getState, version }.
 */
(function () {
  "use strict";

  if (window.NTAdaptive && window.NTAdaptive.__loaded) return; // idempotent

  var VERSION = "1.0.0";
  var STORE_KEY = "lp:adaptive:";

  /* ----------------------------------------------------------------------- *
   * Small safe helpers (never throw)
   * ----------------------------------------------------------------------- */
  function reduceMotion() {
    try {
      return !!(
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      );
    } catch (e) {
      return false;
    }
  }
  function muted() {
    return !!window.NT_MUTED;
  }
  function $(sel, root) {
    try {
      return (root || document).querySelector(sel);
    } catch (e) {
      return null;
    }
  }
  function $all(sel, root) {
    try {
      return Array.prototype.slice.call(
        (root || document).querySelectorAll(sel),
      );
    } catch (e) {
      return [];
    }
  }
  function txt(el) {
    if (!el) return "";
    try {
      return (el.textContent || "").replace(/\s+/g, " ").trim();
    } catch (e) {
      return "";
    }
  }
  function track(event) {
    try {
      if (
        window.NTtelemetry &&
        typeof window.NTtelemetry.track === "function"
      ) {
        window.NTtelemetry.track(event);
      }
    } catch (e) {
      /* telemetry is best-effort only */
    }
  }
  function celebrate(el) {
    if (muted()) return;
    try {
      if (window.GameFX && typeof window.GameFX.celebrate === "function") {
        window.GameFX.celebrate(el);
      }
    } catch (e) {
      /* fx is optional */
    }
  }
  function lessonLevel() {
    var lvl = window.NT_LESSON_LEVEL;
    if (lvl === 0 || lvl === 1 || lvl === 2) return lvl;
    // Fall back to body class (level-0/level-1/level-2) when global absent.
    try {
      var b = document.body;
      if (b) {
        if (b.classList.contains("level-2")) return 2;
        if (b.classList.contains("level-0")) return 0;
        if (b.classList.contains("level-1")) return 1;
      }
    } catch (e) {
      /* ignore */
    }
    return 1;
  }
  function misconceptionFor(qid) {
    try {
      var m = window.NT_MISCONCEPTIONS;
      if (m && typeof m === "object" && m[qid]) return String(m[qid]);
    } catch (e) {
      /* ignore */
    }
    return null;
  }

  /* ----------------------------------------------------------------------- *
   * Persistence (per-activity, localStorage; degrades to in-memory)
   * ----------------------------------------------------------------------- */
  function activityId() {
    try {
      var slug = (location.pathname || "")
        .replace(/index\.html?$/i, "")
        .replace(/^\/+|\/+$/g, "")
        .replace(/[^a-z0-9]+/gi, "-")
        .toLowerCase();
      return slug || "lesson";
    } catch (e) {
      return "lesson";
    }
  }
  var memFallback = {};
  function loadStore() {
    var key = STORE_KEY + activityId();
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return memFallback[key] || {};
    }
  }
  function saveStore(obj) {
    var key = STORE_KEY + activityId();
    memFallback[key] = obj;
    try {
      window.localStorage.setItem(key, JSON.stringify(obj));
    } catch (e) {
      /* private mode / quota — in-memory copy is enough for the session */
    }
  }

  /* ----------------------------------------------------------------------- *
   * Socratic hint ladders — escalating, NEVER reveal the answer.
   * Selected by misconception tag when available, else by item kind.
   * ----------------------------------------------------------------------- */
  var HINT_LADDERS = {
    default: [
      "Read the question one more time. What is it actually asking you to find?",
      "What information are you given? Underline the numbers and the units in your mind.",
      "Which operation matches the action in the problem — combining, separating, scaling, or comparing?",
      "Try the first step on scratch paper, then check whether your result is reasonable before choosing.",
    ],
    "place-value": [
      "Look carefully at each digit's place. Which column changed?",
      "Line the numbers up by their decimal points before you compare.",
      "Estimate to the nearest whole number first — does your choice land near that estimate?",
    ],
    "operation-choice": [
      "Re-read the action words. Are you putting amounts together or taking them apart?",
      "Sketch the situation. Does the total get bigger or smaller?",
      "Pick the operation that matches the picture, then redo the arithmetic.",
    ],
    "sign-error": [
      "Check each sign carefully. Did a negative slip past you?",
      "Rewrite the expression with the signs in clear view, one term at a time.",
      "Walk a number line: which direction does each step move you?",
    ],
    units: [
      "What units does the answer need to be in?",
      "Did every quantity get converted to the same unit before you combined them?",
      "Re-check: do the units of your result make sense for what was asked?",
    ],
    "ratio-proportion": [
      "What two quantities are being compared, and in what order?",
      "Set up the comparison as a clear part-to-part or part-to-whole relationship.",
      "Scale both sides by the same factor — does the relationship stay equal?",
    ],
    fraction: [
      "Do the parts share the same-size whole? Same denominator?",
      "Rename so both fractions describe equal-size pieces before you combine.",
      "Estimate against one-half — is your choice on the right side of that?",
    ],
  };

  function hintLadderFor(item) {
    var tag = misconceptionFor(item.qid);
    if (tag && HINT_LADDERS[tag]) return { tag: tag, hints: HINT_LADDERS[tag] };
    if (item.kind === "fill")
      return { tag: tag, hints: HINT_LADDERS["place-value"] };
    return { tag: tag, hints: HINT_LADDERS["default"] };
  }

  /* ----------------------------------------------------------------------- *
   * Re-teach micro-blocks — short, plain-language, level-aware.
   * Keyed by misconception tag; falls back to a universal scaffold.
   * ----------------------------------------------------------------------- */
  var RETEACH = {
    default: {
      title: "Quick re-teach",
      steps: [
        "Restate the problem in your own words.",
        "Find the numbers and what they describe.",
        "Choose the operation that matches the action.",
        "Solve one step at a time, then check if the answer is reasonable.",
      ],
    },
    "place-value": {
      title: "Re-teach: place value",
      steps: [
        "Each digit's spot tells its value (ones, tens, tenths…).",
        "Line up decimal points before comparing or adding.",
        "Compare from the largest place first.",
      ],
    },
    "operation-choice": {
      title: "Re-teach: choosing the operation",
      steps: [
        "Combine / join → addition.",
        "Take away / find the difference → subtraction.",
        "Equal groups → multiplication; sharing equally → division.",
      ],
    },
    "ratio-proportion": {
      title: "Re-teach: ratios",
      steps: [
        "A ratio compares two amounts in order (a to b).",
        "Equivalent ratios scale both parts by the same number.",
        "Keep the order consistent the whole way through.",
      ],
    },
    fraction: {
      title: "Re-teach: fractions",
      steps: [
        "Fractions describe equal parts of one whole.",
        "Same denominator = same-size pieces → safe to add or compare.",
        "Rename first when denominators differ.",
      ],
    },
  };
  function reteachFor(item) {
    var tag = misconceptionFor(item.qid);
    return (tag && RETEACH[tag]) || RETEACH["default"];
  }

  /* ----------------------------------------------------------------------- *
   * Mastery state machine (per skill)
   * advance when: consecutiveCorrect >= threshold  OR  accuracy >= 0.80
   * (accuracy gate needs at least `minForPct` attempts to count).
   * ----------------------------------------------------------------------- */
  var THRESHOLD = 2;
  var PCT_GATE = 0.8;
  var MIN_FOR_PCT = 3;

  function freshSkill(id, label) {
    return {
      id: id,
      label: label,
      attempts: 0,
      correct: 0,
      consecutive: 0,
      mastered: false,
    };
  }
  function recordAttempt(skill, isCorrect) {
    skill.attempts += 1;
    if (isCorrect) {
      skill.correct += 1;
      skill.consecutive += 1;
    } else {
      skill.consecutive = 0;
    }
    var byStreak = skill.consecutive >= THRESHOLD;
    var acc = skill.attempts ? skill.correct / skill.attempts : 0;
    var byPct = skill.attempts >= MIN_FOR_PCT && acc >= PCT_GATE;
    var nowMastered = byStreak || byPct;
    var newlyMastered = nowMastered && !skill.mastered;
    skill.mastered = nowMastered;
    return newlyMastered;
  }

  /* ----------------------------------------------------------------------- *
   * Engine instance
   * ----------------------------------------------------------------------- */
  var engine = {
    items: [], // [{qid, kind, card, checkBtn, skillId}]
    skills: {}, // id -> skill state
    handled: null, // WeakSet of cards whose latest outcome was already processed
    observer: null,
    booted: false,
  };

  function skillForCard(card, qid) {
    // Prefer the nearest preceding .section-header label; else data-q prefix.
    var label = null;
    try {
      var el = card.previousElementSibling;
      while (el) {
        if (el.classList && el.classList.contains("section-header")) {
          var h = el.querySelector("h2");
          label = txt(h) || txt(el);
          break;
        }
        el = el.previousElementSibling;
      }
    } catch (e) {
      /* fall through to prefix */
    }
    if (!label) {
      var m = /^([a-z]+)/i.exec(qid || "");
      var prefix = m ? m[1].toLowerCase() : "q";
      label =
        prefix === "w"
          ? "Warm-Up"
          : prefix === "p"
            ? "Practice"
            : prefix === "c"
              ? "Challenge"
              : "Skill";
    }
    var id =
      label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "skill";
    if (!engine.skills[id]) engine.skills[id] = freshSkill(id, label);
    return id;
  }

  function scan() {
    engine.items = [];
    var cards = $all("article.q-card[data-q]");
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      var qid = card.getAttribute("data-q") || "q" + i;
      var hasFill = !!$(".fill-input[data-answer]", card);
      var hasMc = !!$(".mc-btn[data-val]", card);
      var hasTf = !!$(".tf-btn[data-val]", card);
      var hasDrag = !!$(".drag-zone[data-cat]", card);
      var kind = hasFill
        ? "fill"
        : hasMc
          ? "mc"
          : hasTf
            ? "tf"
            : hasDrag
              ? "drag"
              : "other";
      var checkBtn = $(".check-btn", card);
      var skillId = skillForCard(card, qid);
      engine.items.push({
        qid: qid,
        kind: kind,
        card: card,
        checkBtn: checkBtn,
        skillId: skillId,
      });
    }
    return engine.items;
  }

  /* ----------------------------------------------------------------------- *
   * Outcome reading: trust the lesson's own result classes.
   * Returns "correct" | "incorrect" | null (not yet graded).
   * ----------------------------------------------------------------------- */
  function outcomeOf(card) {
    try {
      if (card.classList.contains("correct")) return "correct";
      if (card.classList.contains("incorrect")) return "incorrect";
      // Fall back to inner item states (fill cards mark inputs, not the card).
      if ($(".mc-btn.is-correct, .tf-btn.is-correct", card)) {
        if ($(".mc-btn.is-wrong, .tf-btn.is-wrong", card)) return "incorrect";
        return "correct";
      }
      if ($(".fill-input.is-wrong", card)) return "incorrect";
      var fills = $all(".fill-input.is-correct", card);
      var totalFills = $all(".fill-input[data-answer]", card);
      if (totalFills.length && fills.length === totalFills.length)
        return "correct";
    } catch (e) {
      /* ignore */
    }
    return null;
  }

  function findItemByCard(card) {
    for (var i = 0; i < engine.items.length; i++) {
      if (engine.items[i].card === card) return engine.items[i];
    }
    return null;
  }

  function processOutcome(card) {
    if (!card || !engine.handled) return;
    var outcome = outcomeOf(card);
    if (!outcome) return;
    var lastKey = card.getAttribute("data-lp-outcome");
    if (lastKey === outcome) return; // already processed this exact outcome
    var item = findItemByCard(card);
    if (!item) return;
    card.setAttribute("data-lp-outcome", outcome);

    var skill = engine.skills[item.skillId];
    var isCorrect = outcome === "correct";
    var newlyMastered = recordAttempt(skill, isCorrect);

    track({
      event: "item_attempt",
      activity: activityId(),
      qid: item.qid,
      skill: skill.id,
      kind: item.kind,
      correct: isCorrect,
      level: lessonLevel(),
      misconception: misconceptionFor(item.qid),
      ts: Date.now(),
    });

    if (isCorrect) {
      clearHelp(card);
      celebrate(item.checkBtn || card);
    } else {
      showHelp(item);
    }

    if (newlyMastered) {
      markSkillMastered(skill);
      track({
        event: "mastery_reached",
        activity: activityId(),
        skill: skill.id,
        attempts: skill.attempts,
        correct: skill.correct,
        ts: Date.now(),
      });
    }
    persist();
    refreshSummary();
  }

  function persist() {
    var snap = { v: 1, activity: activityId(), skills: {}, ts: Date.now() };
    for (var id in engine.skills) {
      if (!engine.skills.hasOwnProperty(id)) continue;
      var s = engine.skills[id];
      snap.skills[id] = {
        label: s.label,
        attempts: s.attempts,
        correct: s.correct,
        consecutive: s.consecutive,
        mastered: s.mastered,
      };
    }
    saveStore(snap);
  }

  function hydrate() {
    var snap = loadStore();
    if (!snap || !snap.skills) return;
    for (var id in snap.skills) {
      if (!snap.skills.hasOwnProperty(id)) continue;
      var saved = snap.skills[id];
      var s = engine.skills[id] || freshSkill(id, saved.label || id);
      s.attempts = saved.attempts || 0;
      s.correct = saved.correct || 0;
      s.consecutive = saved.consecutive || 0;
      s.mastered = !!saved.mastered;
      engine.skills[id] = s;
    }
  }

  /* ----------------------------------------------------------------------- *
   * UI: per-card help (re-teach + Socratic hint ladder + try-again)
   * ----------------------------------------------------------------------- */
  function clearHelp(card) {
    try {
      var help = $(".lp-help", card);
      if (help && help.parentNode) help.parentNode.removeChild(help);
    } catch (e) {
      /* ignore */
    }
  }

  function buildList(steps, ordered) {
    var list = document.createElement(ordered ? "ol" : "ul");
    list.className = "lp-help-steps";
    for (var i = 0; i < steps.length; i++) {
      var li = document.createElement("li");
      li.textContent = steps[i];
      list.appendChild(li);
    }
    return list;
  }

  function showHelp(item) {
    var card = item.card;
    if (!card) return;
    clearHelp(card);

    var reduce = reduceMotion();
    var help = document.createElement("aside");
    help.className = "lp-help";
    help.setAttribute("role", "group");
    help.setAttribute(
      "aria-label",
      "Support for this question. Re-teach and hints. The answer is never shown.",
    );

    // Re-teach micro-block ------------------------------------------------
    var reteach = reteachFor(item);
    var rt = document.createElement("div");
    rt.className = "lp-reteach";
    var rtHead = document.createElement("h3");
    rtHead.className = "lp-help-title";
    rtHead.textContent = reteach.title;
    rt.appendChild(rtHead);
    rt.appendChild(buildList(reteach.steps, true));
    help.appendChild(rt);

    // Socratic hint ladder ------------------------------------------------
    var ladder = hintLadderFor(item);
    var hintWrap = document.createElement("div");
    hintWrap.className = "lp-hints";

    var live = document.createElement("div");
    live.className = "lp-hint-live";
    live.setAttribute("aria-live", "polite");
    live.setAttribute("aria-atomic", "true");

    var hintBtn = document.createElement("button");
    hintBtn.type = "button";
    hintBtn.className = "lp-btn lp-hint-btn";
    var step = 0;
    hintBtn.textContent = "Show a hint";

    hintBtn.addEventListener("click", function () {
      try {
        if (step >= ladder.hints.length) return;
        var p = document.createElement("p");
        p.className = "lp-hint";
        p.textContent = "Hint " + (step + 1) + ": " + ladder.hints[step];
        live.appendChild(p);
        if (
          !reduce &&
          window.GameFX &&
          typeof window.GameFX.pop === "function"
        ) {
          try {
            window.GameFX.pop(p);
          } catch (e) {
            /* fx optional */
          }
        }
        track({
          event: "hint_used",
          activity: activityId(),
          qid: item.qid,
          skill: item.skillId,
          level: step + 1,
          misconception: ladder.tag || null,
          ts: Date.now(),
        });
        step += 1;
        if (step >= ladder.hints.length) {
          hintBtn.disabled = true;
          hintBtn.textContent = "That's every hint — you've got this";
        } else {
          hintBtn.textContent = "Show another hint";
        }
      } catch (e) {
        /* never break the lesson */
      }
    });

    hintWrap.appendChild(hintBtn);
    hintWrap.appendChild(live);
    help.appendChild(hintWrap);

    // Fresh attempt at a similar item ------------------------------------
    var retry = document.createElement("button");
    retry.type = "button";
    retry.className = "lp-btn lp-retry-btn";
    retry.textContent = "Try a fresh attempt";
    retry.addEventListener("click", function () {
      resetCardForRetry(item);
      clearHelp(card);
      try {
        var focusTarget =
          $(".mc-btn", card) ||
          $(".tf-btn", card) ||
          $(".fill-input", card) ||
          item.checkBtn;
        if (focusTarget && focusTarget.focus) focusTarget.focus();
      } catch (e) {
        /* ignore */
      }
    });
    help.appendChild(retry);

    card.appendChild(help);

    // Move focus to the help so screen-reader users hear it immediately.
    try {
      help.setAttribute("tabindex", "-1");
      help.focus({ preventScroll: false });
    } catch (e) {
      /* ignore */
    }
  }

  /* Reset a card so the student can re-answer, WITHOUT revealing anything.
   * Only strips outcome state; it does not look at any answer. */
  function resetCardForRetry(item) {
    var card = item.card;
    if (!card) return;
    try {
      card.classList.remove("correct", "incorrect");
      card.removeAttribute("data-lp-outcome");
      $all(".mc-btn, .tf-btn", card).forEach(function (b) {
        b.classList.remove("selected", "is-correct", "is-wrong", "locked");
        if (b.disabled) b.disabled = false;
        b.removeAttribute("aria-pressed");
      });
      $all(".fill-input", card).forEach(function (inp) {
        inp.classList.remove("is-correct", "is-wrong");
        inp.value = "";
        inp.readOnly = false;
      });
      $all(".drag-zone", card).forEach(function (z) {
        z.classList.remove("is-correct", "is-wrong", "over");
      });
      if (item.checkBtn) {
        // MCQ/TF check buttons start disabled until a fresh selection.
        if (item.kind === "mc" || item.kind === "tf")
          item.checkBtn.disabled = true;
      }
    } catch (e) {
      /* never break the lesson */
    }
  }

  /* ----------------------------------------------------------------------- *
   * UI: per-skill mastery badge + footer progress summary
   * ----------------------------------------------------------------------- */
  function markSkillMastered(skill) {
    try {
      var item = null;
      for (var i = 0; i < engine.items.length; i++) {
        if (engine.items[i].skillId === skill.id) {
          item = engine.items[i];
          break;
        }
      }
      if (!item || !item.card) return;
      var header = null;
      var el = item.card.previousElementSibling;
      while (el) {
        if (el.classList && el.classList.contains("section-header")) {
          header = el;
          break;
        }
        el = el.previousElementSibling;
      }
      var host = header || item.card;
      if ($(".lp-mastery-badge", host)) return;
      var badge = document.createElement("span");
      badge.className = "lp-mastery-badge";
      badge.setAttribute("role", "status");
      badge.textContent = "Mastered";
      host.appendChild(badge);
      celebrate(badge);
    } catch (e) {
      /* ignore */
    }
  }

  function ensureSummary() {
    var sum = $("#lp-adaptive-summary");
    if (sum) return sum;
    sum = document.createElement("section");
    sum.id = "lp-adaptive-summary";
    sum.className = "lp-summary";
    sum.setAttribute("aria-live", "polite");
    sum.setAttribute("aria-label", "Your mastery progress");
    var heading = document.createElement("h2");
    heading.className = "lp-summary-title";
    heading.textContent = "Mastery progress";
    sum.appendChild(heading);
    var grid = document.createElement("div");
    grid.className = "lp-summary-grid";
    grid.id = "lp-summary-grid";
    sum.appendChild(grid);

    var anchor = $("footer.score-bar") || $("main.main") || document.body;
    try {
      if (anchor === $("footer.score-bar") && anchor.parentNode) {
        anchor.parentNode.insertBefore(sum, anchor);
      } else if (anchor && anchor.appendChild) {
        anchor.appendChild(sum);
      }
    } catch (e) {
      try {
        document.body.appendChild(sum);
      } catch (e2) {
        return null;
      }
    }
    return sum;
  }

  function refreshSummary() {
    var sum = ensureSummary();
    if (!sum) return;
    var grid = $("#lp-summary-grid", sum);
    if (!grid) return;
    grid.innerHTML = "";
    for (var id in engine.skills) {
      if (!engine.skills.hasOwnProperty(id)) continue;
      var s = engine.skills[id];
      var cell = document.createElement("div");
      cell.className = "lp-summary-cell" + (s.mastered ? " is-mastered" : "");
      var name = document.createElement("span");
      name.className = "lp-summary-skill";
      name.textContent = s.label;
      var stat = document.createElement("span");
      stat.className = "lp-summary-stat";
      var acc = s.attempts ? Math.round((s.correct / s.attempts) * 100) : 0;
      stat.textContent = s.mastered
        ? "Mastered"
        : s.attempts
          ? s.correct + "/" + s.attempts + " (" + acc + "%)"
          : "Not started";
      cell.appendChild(name);
      cell.appendChild(stat);
      grid.appendChild(cell);
    }
  }

  /* ----------------------------------------------------------------------- *
   * Spaced retrieval — optional review items from window.NT_PRIOR_ITEMS.
   * Shape: [{ prompt, choices?:[{label,value}], answer?, hint? }] (max 2).
   * These are platform-owned review cards; they don't touch the lesson grader.
   * ----------------------------------------------------------------------- */
  function renderSpacedRetrieval() {
    var prior = window.NT_PRIOR_ITEMS;
    if (!prior || !prior.length) return;
    if ($("#lp-spaced")) return;
    var items = prior.slice(0, 2);

    var wrap = document.createElement("section");
    wrap.id = "lp-spaced";
    wrap.className = "lp-spaced";
    wrap.setAttribute("aria-label", "Quick review from earlier lessons");
    var h = document.createElement("h2");
    h.className = "lp-spaced-title";
    h.textContent = "Quick review (from earlier work)";
    wrap.appendChild(h);

    items.forEach(function (data, idx) {
      try {
        wrap.appendChild(buildSpacedCard(data, idx));
      } catch (e) {
        /* skip a malformed review item, keep the rest */
      }
    });

    var main = $("main.main") || document.body;
    try {
      if (main.firstChild) main.insertBefore(wrap, main.firstChild);
      else main.appendChild(wrap);
    } catch (e) {
      /* ignore */
    }
  }

  function buildSpacedCard(data, idx) {
    var card = document.createElement("article");
    card.className = "lp-spaced-card";
    var prompt = document.createElement("p");
    prompt.className = "lp-spaced-prompt";
    prompt.textContent = data.prompt || "Review question";
    card.appendChild(prompt);

    var live = document.createElement("div");
    live.className = "lp-spaced-live";
    live.setAttribute("aria-live", "polite");

    function settle(correct) {
      live.textContent = correct
        ? "Correct — nice retrieval!"
        : "Not quite. " +
          (data.hint || "Think back to how you solved this before.");
      track({
        event: "item_attempt",
        activity: activityId(),
        qid: "spaced-" + idx,
        skill: "spaced-review",
        kind: "spaced",
        correct: !!correct,
        ts: Date.now(),
      });
      if (correct) celebrate(card);
    }

    if (data.choices && data.choices.length) {
      var opts = document.createElement("div");
      opts.className = "lp-spaced-opts";
      data.choices.forEach(function (ch) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "lp-btn lp-spaced-opt";
        b.textContent = ch.label != null ? ch.label : ch.value;
        b.addEventListener("click", function () {
          settle(String(ch.value).trim() === String(data.answer).trim());
        });
        opts.appendChild(b);
      });
      card.appendChild(opts);
    } else {
      var inp = document.createElement("input");
      inp.type = "text";
      inp.className = "lp-spaced-input";
      inp.setAttribute("aria-label", "your answer for the review question");
      var go = document.createElement("button");
      go.type = "button";
      go.className = "lp-btn lp-spaced-check";
      go.textContent = "Check";
      go.addEventListener("click", function () {
        settle(
          String(inp.value).trim().toLowerCase() ===
            String(data.answer == null ? "" : data.answer)
              .trim()
              .toLowerCase(),
        );
      });
      card.appendChild(inp);
      card.appendChild(go);
    }
    card.appendChild(live);
    return card;
  }

  /* ----------------------------------------------------------------------- *
   * Boot
   * ----------------------------------------------------------------------- */
  function startObserver() {
    if (engine.observer || !window.MutationObserver) return;
    try {
      engine.observer = new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          var t = muts[i].target;
          if (!t || t.nodeType !== 1) continue;
          var card =
            t.classList && t.classList.contains("q-card")
              ? t
              : t.closest
                ? t.closest("article.q-card[data-q]")
                : null;
          if (card) {
            try {
              processOutcome(card);
            } catch (e) {
              /* one bad card must not stop the rest */
            }
          }
        }
      });
      var scope = $("main.main") || document.body;
      engine.observer.observe(scope, {
        subtree: true,
        attributes: true,
        attributeFilter: ["class"],
      });
    } catch (e) {
      /* no observer — engine still works on hydrate/summary */
    }
  }

  function init() {
    if (engine.booted) return window.NTAdaptive;
    engine.booted = true;
    try {
      engine.handled = typeof WeakSet === "function" ? new WeakSet() : null;
      scan();
      hydrate();
      // Sync any outcomes the lesson already rendered before we attached.
      engine.items.forEach(function (it) {
        try {
          processOutcome(it.card);
        } catch (e) {
          /* ignore pre-existing */
        }
      });
      renderSpacedRetrieval();
      refreshSummary();
      startObserver();
    } catch (e) {
      /* engine must never break the lesson */
    }
    return window.NTAdaptive;
  }

  function getState() {
    var out = { activity: activityId(), level: lessonLevel(), skills: {} };
    try {
      for (var id in engine.skills) {
        if (!engine.skills.hasOwnProperty(id)) continue;
        var s = engine.skills[id];
        out.skills[id] = {
          label: s.label,
          attempts: s.attempts,
          correct: s.correct,
          consecutive: s.consecutive,
          mastered: s.mastered,
        };
      }
    } catch (e) {
      /* ignore */
    }
    return out;
  }

  window.NTAdaptive = {
    __loaded: true,
    version: VERSION,
    init: init,
    getState: getState,
  };

  // Auto-init on ready unless the page opts out.
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }
  if (window.NT_ADAPTIVE_AUTOSTART !== false) {
    ready(function () {
      try {
        init();
      } catch (e) {
        /* never break the lesson */
      }
    });
  }
})();
