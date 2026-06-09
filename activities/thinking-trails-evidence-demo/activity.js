/*
 * Thinking Trails demo activity controller.
 * Drives a 10-problem mean/median/mode/range set and logs every attempt to the
 * shared Evidence Layer (window.Evidence). Local-only; no network calls.
 */
(function () {
  "use strict";

  var LESSON_ID = "stats-mmmr-demo";
  var ACTIVITY_ID = "thinking-trails-evidence-demo";
  var STANDARD = "6.SP.B.5";

  // Each problem: data shown, the correct answer, the skill, a plain-language
  // hint, and "traps" — known wrong answers mapped to a misconception tag.
  var PROBLEMS = [
    {
      skill: "mean",
      prompt: "Find the mean (average).",
      data: "4, 6, 10, 8",
      answer: 7,
      hint: "Add: 4 + 6 + 10 + 8 = 28. Then divide by how many numbers there are (4).",
      traps: [
        { value: 28, tag: "mean_divides_by_wrong_count" },
        { value: 9.3, tag: "mean_divides_by_wrong_count" },
        { value: 9, tag: "mean_addition_error" },
      ],
    },
    {
      skill: "mean",
      prompt: "Find the mean (average) of these quiz scores.",
      data: "5, 5, 8, 2",
      answer: 5,
      hint: "Add: 5 + 5 + 8 + 2 = 20. Divide by 4.",
      traps: [
        { value: 20, tag: "mean_divides_by_wrong_count" },
        { value: 6, tag: "mean_addition_error" },
      ],
    },
    {
      skill: "median",
      prompt: "Find the median (middle number).",
      data: "5, 2, 9, 4, 7",
      answer: 5,
      hint: "First put them in order: 2, 4, 5, 7, 9. The middle one is the median.",
      traps: [
        { value: 9, tag: "median_did_not_order" },
        { value: 4, tag: "median_picks_wrong_middle" },
        { value: 7, tag: "median_picks_wrong_middle" },
      ],
    },
    {
      skill: "median",
      prompt: "Find the median (middle number).",
      data: "12, 3, 8",
      answer: 8,
      hint: "Order them: 3, 8, 12. The middle number is the median.",
      traps: [
        { value: 12, tag: "median_did_not_order" },
        { value: 3, tag: "median_picks_wrong_middle" },
      ],
    },
    {
      skill: "mode",
      prompt: "Find the mode (the number that appears the most).",
      data: "3, 7, 7, 2, 9",
      answer: 7,
      hint: "Look for the number you see more than once. Which one repeats?",
      traps: [
        { value: 9, tag: "mode_picks_largest" },
        { value: 2, tag: "mode_ignores_repeated_values" },
      ],
    },
    {
      skill: "mode",
      prompt: "Find the mode (the number that appears the most).",
      data: "4, 4, 1, 8, 8, 8",
      answer: 8,
      hint: "Count how many times each number appears. Which appears the most (three times)?",
      traps: [{ value: 4, tag: "mode_ignores_repeated_values" }],
    },
    {
      skill: "range",
      prompt: "Find the range (biggest minus smallest).",
      data: "71, 65, 80, 68",
      answer: 15,
      hint: "Biggest is 80, smallest is 65. Subtract: 80 - 65.",
      traps: [
        { value: 145, tag: "range_adds_instead_of_subtracts" },
        { value: 284, tag: "range_uses_all_numbers" },
      ],
    },
    {
      skill: "range",
      prompt: "Find the range (biggest minus smallest).",
      data: "12, 5, 9, 3",
      answer: 9,
      hint: "Biggest is 12, smallest is 3. Subtract: 12 - 3.",
      traps: [
        { value: 15, tag: "range_adds_instead_of_subtracts" },
        { value: 29, tag: "range_uses_all_numbers" },
      ],
    },
    {
      skill: "mode",
      prompt: "A teacher records shoe sizes. Find the mode.",
      data: "6, 7, 7, 8, 7",
      answer: 7,
      hint: "Which size shows up the most times?",
      traps: [{ value: 8, tag: "mode_picks_largest" }],
    },
    {
      // Mixed review: identify which measure is needed.
      skill: "mixed",
      prompt:
        "Which measure shows the spread from the lowest value to the highest value? Type one: mean, median, mode, or range.",
      data: "mean · median · mode · range",
      answer: "range",
      isText: true,
      hint: "It is biggest minus smallest. That measure is the…",
      traps: [],
    },
  ];

  var els = {};
  var state = { index: 0, attempts: 0, hintUsed: false };

  function $(id) {
    return document.getElementById(id);
  }

  function ready() {
    els = {
      setup: $("tt-setup"),
      name: $("tt-name"),
      start: $("tt-start"),
      activity: $("tt-activity"),
      progress: $("tt-progress"),
      bar: $("tt-bar"),
      skill: $("tt-skill"),
      prompt: $("tt-prompt"),
      data: $("tt-data"),
      answer: $("tt-answer"),
      explain: $("tt-explain"),
      hint: $("tt-hint"),
      check: $("tt-check"),
      next: $("tt-next"),
      feedback: $("tt-feedback"),
      reportSection: $("tt-report-section"),
      reportHost: $("tt-report-host"),
    };

    els.start.addEventListener("click", begin);
    els.name.addEventListener("keydown", function (e) {
      if (e.key === "Enter") begin();
    });
    els.hint.addEventListener("click", showHint);
    els.check.addEventListener("click", check);
    els.next.addEventListener("click", nextProblem);
    els.answer.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !els.check.disabled) check();
    });
  }

  function begin() {
    var name = (els.name.value || "").trim() || "Student";
    window.Evidence.startSession({
      studentNameOrCode: name,
      lessonId: LESSON_ID,
      activityId: ACTIVITY_ID,
      activityTitle: "Thinking Trails: Mean, Median, Mode & Range",
      standard: STANDARD,
      skillFocus: "mean, median, mode, range",
      languageSupport: "ESOL sentence starters",
    });
    els.setup.hidden = true;
    els.activity.hidden = false;
    state.index = 0;
    loadProblem();
    els.answer.focus();
  }

  var SKILL_LABELS = {
    mean: "Mean",
    median: "Median",
    mode: "Mode",
    range: "Range",
    mixed: "Mixed Review",
  };

  function loadProblem() {
    var p = PROBLEMS[state.index];
    state.attempts = 0;
    state.hintUsed = false;
    els.skill.textContent = SKILL_LABELS[p.skill] || "Problem";
    els.prompt.textContent = p.prompt;
    els.data.textContent = p.data;
    els.answer.value = "";
    els.answer.setAttribute("inputmode", p.isText ? "text" : "decimal");
    els.explain.value = "";
    els.feedback.hidden = true;
    els.feedback.className = "tt-feedback";
    els.check.hidden = false;
    els.check.disabled = false;
    els.hint.disabled = false;
    els.next.hidden = true;
    var n = PROBLEMS.length;
    els.progress.textContent = "Problem " + (state.index + 1) + " of " + n;
    els.bar.style.width = Math.round((state.index / n) * 100) + "%";
  }

  function showHint() {
    var p = PROBLEMS[state.index];
    state.hintUsed = true;
    setFeedback("hint", "💡 Hint: " + p.hint);
  }

  function normalize(val, isText) {
    if (isText) return ("" + val).trim().toLowerCase();
    return ("" + val).trim();
  }

  function isCorrect(p, raw) {
    if (p.isText) {
      return normalize(raw, true) === ("" + p.answer).toLowerCase();
    }
    var num = parseFloat(("" + raw).replace(/[^0-9.\-]/g, ""));
    if (isNaN(num)) return false;
    return Math.abs(num - p.answer) < 0.01;
  }

  function matchTrap(p, raw) {
    if (!p.traps || !p.traps.length) return "";
    if (p.isText) return "";
    var num = parseFloat(("" + raw).replace(/[^0-9.\-]/g, ""));
    if (isNaN(num)) return "";
    for (var i = 0; i < p.traps.length; i++) {
      if (Math.abs(num - p.traps[i].value) < 0.01) return p.traps[i].tag;
    }
    return "";
  }

  // Decide a misconception tag for an incorrect/weak attempt.
  function pickTag(p, raw, correct, explanation) {
    if (correct) {
      var score = window.Evidence.scoreExplanation(explanation);
      if (score.level === "missing" || score.level === "too_short") {
        return "explanation_too_short";
      }
      return "";
    }
    var trap = matchTrap(p, raw);
    if (trap) return trap;
    // Skill-based default when the wrong answer is not a known trap.
    var defaults = {
      median: "median_picks_wrong_middle",
      range: "range_adds_instead_of_subtracts",
      mode: "mode_ignores_repeated_values",
      mean: "mean_addition_error",
      mixed: "answer_without_reasoning",
    };
    return defaults[p.skill] || "";
  }

  function check() {
    var p = PROBLEMS[state.index];
    var raw = els.answer.value;
    var explanation = els.explain.value.trim();

    if (!("" + raw).trim()) {
      setFeedback("incorrect", "Type an answer first.");
      return;
    }
    if (!explanation) {
      setFeedback(
        "incorrect",
        "Please explain your thinking before you check. Try a sentence starter.",
      );
      els.explain.focus();
      return;
    }

    state.attempts++;
    var correct = isCorrect(p, raw);

    // Guided hint after the first wrong try; lock in after the 2nd attempt.
    if (!correct && state.attempts < 2) {
      state.hintUsed = true;
      setFeedback("hint", "Not quite — try once more. 💡 " + p.hint);
      return;
    }

    var tag = pickTag(p, raw, correct, explanation);
    window.Evidence.logAttempt({
      problemId: "p" + (state.index + 1),
      skill: p.skill,
      prompt: p.prompt + " [" + p.data + "]",
      studentAnswer: raw,
      correctAnswer: "" + p.answer,
      result: correct ? "correct" : "incorrect",
      hintUsed: state.hintUsed,
      attempts: state.attempts,
      explanation: explanation,
      misconceptionTag: tag,
    });

    if (correct) {
      setFeedback("correct", "✅ Correct! " + explanationNote(explanation));
    } else {
      setFeedback(
        "incorrect",
        "The correct answer is " +
          p.answer +
          ". " +
          p.hint +
          " That is logged so your teacher can help.",
      );
    }
    els.check.disabled = true;
    els.hint.disabled = true;
    els.next.hidden = false;
    els.next.textContent =
      state.index === PROBLEMS.length - 1 ? "See my report" : "Next problem";
    els.next.focus();
  }

  function explanationNote(explanation) {
    var s = window.Evidence.scoreExplanation(explanation);
    if (s.level === "missing" || s.level === "too_short") {
      return "Next time, add one more sentence about how you found it.";
    }
    if (s.level === "strong") return "Great explanation with math words!";
    return "Nice work explaining your steps.";
  }

  function nextProblem() {
    if (state.index === PROBLEMS.length - 1) {
      finish();
      return;
    }
    state.index++;
    loadProblem();
    els.answer.focus();
  }

  function finish() {
    window.Evidence.endSession();
    els.activity.hidden = true;
    els.reportSection.hidden = false;
    els.bar.style.width = "100%";
    var p = window.Evidence.renderReport(els.reportHost);
    if (p && typeof p.then === "function") {
      p.then(function () {
        els.reportHost.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  function setFeedback(kind, msg) {
    els.feedback.hidden = false;
    els.feedback.className = "tt-feedback " + kind;
    els.feedback.textContent = msg;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ready);
  } else {
    ready();
  }
})();
