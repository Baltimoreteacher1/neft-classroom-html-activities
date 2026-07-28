/*
 * EduWonderLab — Instructional Need classifier (transparent, rules-based)
 * =============================================================================
 * Turns shared evidence events into a NAMED instructional need plus a plain
 * explanation of why that name was chosen — one sentence a sixth grader can
 * read, and one a teacher can act on.
 *
 * This complements assets/brain/recommend-engine.js. That engine answers "what
 * should this student do next?" from per-standard mastery. This module answers
 * the prior question — "what kind of problem is this?" — because "missed two
 * questions" and "got them right but has no confidence" call for completely
 * different responses, and a single 'struggling' flag hides the difference.
 *
 * DELIBERATELY RULES-BASED
 *   Every decision below is an inspectable threshold. There is no model, no
 *   endpoint, and no opaque score. classify() returns the exact signals it
 *   used, so a teacher who disagrees can see precisely which number produced
 *   the conclusion. An opaque recommender would be easier to build and
 *   impossible to argue with, which is the wrong trade for a classroom.
 *
 * THE NINE NEEDS
 *   prerequisite-gap          Earlier standard in the same cluster is weak.
 *   current-lesson-gap        This standard is weak; prerequisites are fine.
 *   calculation-error         Right method, wrong arithmetic (late-attempt flips).
 *   vocabulary-barrier        Vocabulary support used heavily on missed items.
 *   representation-difficulty Misconceptions cluster on models/diagrams.
 *   explanation-difficulty    Work is correct; the written explanation is thin.
 *   low-confidence-correct    Correct work, low self-rating.
 *   high-confidence-incorrect Wrong work, high self-rating.
 *   enrichment-ready          Accurate, confident, low support use.
 *
 * PUBLIC API (window.EWLInstructionalNeed)
 *   classify({ standardId, unitId, events, prerequisiteStandards })
 *      -> { need, label, studentReason, teacherReason, signals, confidence }
 *   NEEDS
 *   describe(need) -> { label, teacherGuidance }
 * =============================================================================
 */
(function (global) {
  "use strict";
  if (global.EWLInstructionalNeed) return;

  /* Thresholds, all in one place so they can be argued with and tuned. */
  var T = {
    lowAccuracy: 0.6, // below this, the standard counts as weak
    strongAccuracy: 0.85, // at or above, counts as accurate
    lowConfidence: 2, // on the 1–5 scale the confidence checks use
    highConfidence: 4,
    heavySupport: 2, // support-use events on this standard
    thinExplanation: 40, // characters; below this an explanation is "thin"
    minEvidence: 2, // fewer event rows than this and we decline to classify…
    minItems: 5, // …unless a single rollup record covers at least this many items
  };

  var NEEDS = {
    "prerequisite-gap": {
      label: "Prerequisite gap",
      teacherGuidance:
        "Reteach the earlier standard before spending more time on the current one. Practice on the current lesson will keep failing while the foundation is missing.",
    },
    "current-lesson-gap": {
      label: "Current lesson gap",
      teacherGuidance:
        "The foundation is in place; this specific standard has not landed yet. A targeted reteach or a second model of this concept is the right move.",
    },
    "calculation-error": {
      label: "Calculation error",
      teacherGuidance:
        "The method is right and the arithmetic is slipping. Do not reteach the concept — build in a check step or a computation warm-up.",
    },
    "vocabulary-barrier": {
      label: "Vocabulary barrier",
      teacherGuidance:
        "The mathematics may be fine; the wording is in the way. Preview the vocabulary and offer the task with language support before concluding anything about the maths.",
    },
    "representation-difficulty": {
      label: "Representation difficulty",
      teacherGuidance:
        "Errors cluster on the model or diagram rather than the computation. Work between representations — table, tape diagram, double number line, equation.",
    },
    "explanation-difficulty": {
      label: "Explanation difficulty",
      teacherGuidance:
        "The work is right but the reasoning is not making it onto the page. A sentence frame from the scaffold ladder addresses this without changing the maths.",
    },
    "low-confidence-correct": {
      label: "Low confidence despite correct work",
      teacherGuidance:
        "Do not assign more of the same practice. Show this student their own correct work and name what they did well — the gap is belief, not skill.",
    },
    "high-confidence-incorrect": {
      label: "High confidence despite incorrect work",
      teacherGuidance:
        "A confident misconception is the hardest to shift. Use a counter-example that the current thinking cannot explain before reteaching.",
    },
    "enrichment-ready": {
      label: "Ready for enrichment",
      teacherGuidance:
        "Accurate, confident, and working without support. Offer depth — a harder context or an open-ended design challenge — rather than more of the same.",
    },
    "insufficient-evidence": {
      label: "Not enough evidence yet",
      teacherGuidance:
        "Too little has been recorded on this standard to say anything useful. Any recommendation now would be a guess.",
    },
  };

  /* ------------------------------------------------------------- aggregation */

  function eventsFor(events, standardId) {
    return (events || []).filter(function (e) {
      return e && e.standardIds && e.standardIds.indexOf(standardId) !== -1;
    });
  }

  /**
   * Reduce a standard's events into the handful of numbers the rules read.
   * Everything returned here is echoed back to the caller in `signals`, so the
   * explanation and the decision can never be based on different numbers.
   */
  function signalsFor(events) {
    var scored = events.filter(function (e) {
      return e.score != null && e.maxScore != null && e.maxScore > 0;
    });
    var totalScore = 0;
    var totalMax = 0;
    scored.forEach(function (e) {
      totalScore += e.score;
      totalMax += e.maxScore;
    });

    var confidenceBefore = null;
    var confidenceAfter = null;
    events.forEach(function (e) {
      if (e.confidenceBefore != null) confidenceBefore = e.confidenceBefore;
      if (e.confidenceAfter != null) confidenceAfter = e.confidenceAfter;
    });

    var misconceptions = {};
    events.forEach(function (e) {
      (e.misconceptionCodes || []).forEach(function (code) {
        misconceptions[code] = (misconceptions[code] || 0) + 1;
      });
    });

    var explanations = events
      .map(function (e) {
        return e.writtenExplanation;
      })
      .filter(Boolean);

    /* A "late flip" is an item answered wrong first and right on a later
     * attempt with no hint — the fingerprint of an arithmetic slip rather than
     * a missing concept. */
    var lateFlips = events.filter(function (e) {
      return e.score === e.maxScore && (e.attemptCount || 0) > 1 && !(e.hintCount > 0);
    }).length;

    return {
      itemsScored: scored.length,
      correct: totalScore,
      possible: totalMax,
      accuracy: totalMax > 0 ? totalScore / totalMax : null,
      missed: totalMax > 0 ? totalMax - totalScore : 0,
      hints: events.reduce(function (n, e) {
        return n + (e.hintCount || 0);
      }, 0),
      attempts: events.reduce(function (n, e) {
        return n + (e.attemptCount || 0);
      }, 0),
      revisions: events.reduce(function (n, e) {
        return n + (e.answerRevisions || 0);
      }, 0),
      lateFlips: lateFlips,
      supportUses: events.filter(function (e) {
        return e.eventType === "support_used";
      }).length,
      vocabularySupport: events.filter(function (e) {
        return e.vocabularySupportUsed === true;
      }).length,
      confidenceBefore: confidenceBefore,
      confidenceAfter: confidenceAfter,
      misconceptions: misconceptions,
      explanations: explanations.length,
      longestExplanation: explanations.reduce(function (n, s) {
        return Math.max(n, s.length);
      }, 0),
      eventCount: events.length,
    };
  }

  /* Misconception codes whose shape points at a representation problem rather
   * than an arithmetic one. Matched by substring so the taxonomy can grow. */
  var REPRESENTATION_MARKERS = ["table", "diagram", "model", "graph", "plot", "number-line", "tape"];

  function looksRepresentational(misconceptions) {
    return Object.keys(misconceptions).some(function (code) {
      var lower = code.toLowerCase();
      return REPRESENTATION_MARKERS.some(function (marker) {
        return lower.indexOf(marker) !== -1;
      });
    });
  }

  /* ------------------------------------------------------------------- rules */

  /**
   * Classify the instructional need for one standard.
   *
   * Order matters: the checks run from the most specific, most actionable
   * pattern to the most general. The first rule that fires wins, and the rule
   * that fired is what the explanation describes.
   */
  function classify(input) {
    input = input || {};
    var standardId = input.standardId;
    var all = input.events || (global.EWLEvidence ? global.EWLEvidence.all() : []);
    var events = eventsFor(all, standardId);
    var s = signalsFor(events);

    function result(need, studentReason, teacherReason, confidence) {
      return {
        need: need,
        label: NEEDS[need].label,
        teacherGuidance: NEEDS[need].teacherGuidance,
        studentReason: studentReason,
        teacherReason: teacherReason,
        signals: s,
        standardId: standardId,
        unitId: input.unitId || null,
        confidence: confidence || "moderate",
        rulesVersion: 1,
      };
    }

    /* "Enough evidence" is about how many QUESTIONS are behind the record, not
     * how many rows there are. A single rollup event summarising seven attempts
     * (which is what the Number Realm adapter emits) is a stronger signal than
     * two one-item rows, so either path qualifies. */
    var enoughRows = s.eventCount >= T.minEvidence;
    var enoughItems = s.possible >= T.minItems;
    if (s.possible === 0 || (!enoughRows && !enoughItems)) {
      return result(
        "insufficient-evidence",
        "There is not enough of your work on this skill yet for a useful suggestion.",
        "Only " +
          s.eventCount +
          " record(s) covering " +
          s.possible +
          " item(s) on this standard — below the " +
          T.minEvidence +
          "-record / " +
          T.minItems +
          "-item floor. No recommendation is offered rather than guessing.",
        "low",
      );
    }

    var accuratePct = Math.round(s.accuracy * 100);

    /* 1. Prerequisite gap — the earlier standard is the actual problem. */
    var prereqs = input.prerequisiteStandards || [];
    for (var i = 0; i < prereqs.length; i++) {
      var prereqSignals = signalsFor(eventsFor(all, prereqs[i]));
      if (prereqSignals.possible > 0 && prereqSignals.accuracy < T.lowAccuracy) {
        return result(
          "prerequisite-gap",
          "This was picked because " +
            prereqs[i] +
            " — the skill this one builds on — is still shaky, so we will go back to that first.",
          "Prerequisite " +
            prereqs[i] +
            " is at " +
            Math.round(prereqSignals.accuracy * 100) +
            "% (" +
            prereqSignals.correct +
            "/" +
            prereqSignals.possible +
            ") while " +
            standardId +
            " is at " +
            accuratePct +
            "%. Reteach the prerequisite first.",
          "high",
        );
      }
    }

    /* 2. Vocabulary barrier — heavy language support around missed items. */
    if (s.accuracy < T.strongAccuracy && s.vocabularySupport >= T.heavySupport) {
      return result(
        "vocabulary-barrier",
        "This was picked because you used the word help several times on these questions — the wording may be what is in the way, not the maths.",
        "Vocabulary support used on " +
          s.vocabularySupport +
          " records at " +
          accuratePct +
          "% accuracy. Preview vocabulary and re-offer with language support before drawing a conclusion about the mathematics.",
        "moderate",
      );
    }

    /* 3. Representation difficulty — errors cluster on the model. */
    if (s.accuracy < T.strongAccuracy && looksRepresentational(s.misconceptions)) {
      return result(
        "representation-difficulty",
        "This was picked because the mix-ups showed up in the table or diagram rather than in the arithmetic.",
        "Misconception codes on this standard point at representation: " +
          Object.keys(s.misconceptions).join(", ") +
          ". Work between representations rather than reteaching computation.",
        "moderate",
      );
    }

    /* 4. Calculation error — right method, arithmetic slipping. */
    if (s.accuracy >= T.lowAccuracy && s.accuracy < T.strongAccuracy && s.lateFlips >= 1 && s.hints === 0) {
      return result(
        "calculation-error",
        "This was picked because you got these right on a second try without help — the method is there, the arithmetic slipped.",
        s.lateFlips +
          " item(s) corrected on a later attempt with no hints, at " +
          accuratePct +
          "% overall. Add a check step rather than reteaching the concept.",
        "moderate",
      );
    }

    /* 5. High confidence, incorrect work. */
    if (s.confidenceBefore != null && s.confidenceBefore >= T.highConfidence && s.accuracy < T.lowAccuracy) {
      return result(
        "high-confidence-incorrect",
        "This was picked because you felt sure about this skill but the questions did not go the way you expected — worth a second look together.",
        "Self-rated " +
          s.confidenceBefore +
          "/5 with " +
          accuratePct +
          "% accuracy (" +
          s.correct +
          "/" +
          s.possible +
          "). A confident misconception — lead with a counter-example.",
        "high",
      );
    }

    /* 6. Low confidence, correct work. */
    if (
      s.accuracy >= T.strongAccuracy &&
      s.confidenceBefore != null &&
      s.confidenceBefore <= T.lowConfidence
    ) {
      return result(
        "low-confidence-correct",
        "This was picked because you marked this skill as shaky even though you got " +
          s.correct +
          " out of " +
          s.possible +
          " right. You know more than you think.",
        "Self-rated " +
          s.confidenceBefore +
          "/5 with " +
          accuratePct +
          "% accuracy and " +
          s.hints +
          " hint(s). Do not assign more practice — show them their own correct work.",
        "high",
      );
    }

    /* 7. Explanation difficulty — the work is right, the writing is not there. */
    if (s.accuracy >= T.strongAccuracy && s.explanations > 0 && s.longestExplanation < T.thinExplanation) {
      return result(
        "explanation-difficulty",
        "This was picked because your answers are right and your written explanation is still short — a sentence frame will help you say what you already know.",
        "Accuracy " +
          accuratePct +
          "% but the longest written explanation is " +
          s.longestExplanation +
          " characters. Offer a scaffold-ladder frame; the mathematical target does not change.",
        "moderate",
      );
    }

    /* 8. Enrichment readiness. */
    if (
      s.accuracy >= T.strongAccuracy &&
      s.supportUses === 0 &&
      (s.confidenceBefore == null || s.confidenceBefore >= T.highConfidence)
    ) {
      return result(
        "enrichment-ready",
        "This was picked because you are getting these right on your own — time for something that goes further.",
        "Accuracy " +
          accuratePct +
          "% (" +
          s.correct +
          "/" +
          s.possible +
          ") with no support use. Offer depth rather than more practice.",
        "moderate",
      );
    }

    /* 9. Default: the current standard itself has not landed. */
    return result(
      "current-lesson-gap",
      "This was picked because you missed " +
        s.missed +
        " question" +
        (s.missed === 1 ? "" : "s") +
        " on this skill" +
        (s.hints > 0 ? " and used " + s.hints + " hint" + (s.hints === 1 ? "" : "s") : "") +
        ".",
      accuratePct +
        "% on " +
        standardId +
        " (" +
        s.correct +
        "/" +
        s.possible +
        "), " +
        s.hints +
        " hint(s), " +
        s.attempts +
        " attempt(s). Prerequisites are not implicated — reteach this standard.",
      "moderate",
    );
  }

  /**
   * Did a recommendation work? Compares the evidence before and after a
   * recommendation timestamp on the same standard.
   *
   * Returns "improved" | "unchanged" | "declined" | "no-followup". The
   * follow-up check is what makes this a closed loop rather than a suggestion
   * engine that never learns whether it was right.
   */
  function interventionResult(input) {
    input = input || {};
    var all = input.events || (global.EWLEvidence ? global.EWLEvidence.all() : []);
    var events = eventsFor(all, input.standardId);
    var cutoff = input.since;
    if (!cutoff) return { result: "no-followup", before: null, after: null };

    var before = signalsFor(
      events.filter(function (e) {
        return e.timestamp < cutoff;
      }),
    );
    var after = signalsFor(
      events.filter(function (e) {
        return e.timestamp > cutoff;
      }),
    );

    if (after.possible === 0) return { result: "no-followup", before: before, after: after };
    if (before.possible === 0) return { result: "no-baseline", before: before, after: after };

    var delta = after.accuracy - before.accuracy;
    var result = delta >= 0.1 ? "improved" : delta <= -0.1 ? "declined" : "unchanged";
    return { result: result, delta: delta, before: before, after: after };
  }

  function describe(need) {
    return NEEDS[need] || null;
  }

  global.EWLInstructionalNeed = {
    NEEDS: NEEDS,
    THRESHOLDS: T,
    classify: classify,
    interventionResult: interventionResult,
    describe: describe,
    _signalsFor: signalsFor,
  };
})(typeof window !== "undefined" ? window : globalThis);
