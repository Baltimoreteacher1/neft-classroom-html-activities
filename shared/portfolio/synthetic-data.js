/*
 * EduWonderLab — deterministic synthetic demonstration data.
 * =============================================================================
 * The ONLY data any judge-mode or public demonstration surface is allowed to
 * show. Three invented learners with invented work, fixed timestamps, and no
 * randomness anywhere.
 *
 * RULES THIS FILE EXISTS TO ENFORCE
 *   1. No real student ever appears in a demo. These learners do not exist.
 *   2. The demo is reproducible. Same page, same clicks, same numbers, every
 *      time — no Math.random(), no Date.now(), no network, no chance of a
 *      random failure mid-demonstration.
 *   3. The data is clearly labelled. Every learner id starts with "demo:",
 *      every event carries `synthetic: true`, and every surface that shows it
 *      is required to display the simulated-data banner.
 *   4. It never touches real storage. EWLEvidence.useSynthetic() holds these
 *      events in memory only; localStorage is neither read nor written while
 *      synthetic mode is on.
 *
 * The numbers below are illustrative of the SHAPE of the system's output. They
 * are not classroom results, not a study, and not evidence of efficacy.
 * =============================================================================
 */
(function (global) {
  "use strict";
  if (global.EWLSyntheticData) return;

  /* Fixed clock. Everything is derived from this constant so the demo reads
   * identically on every run. */
  var DAY = 86400000;
  var T0 = Date.parse("2026-05-04T13:15:00.000Z");
  function at(dayOffset, minuteOffset) {
    return new Date(T0 + dayOffset * DAY + (minuteOffset || 0) * 60000).toISOString();
  }

  /* --- The three demonstration learners ---------------------------------- */

  var LEARNERS = [
    {
      learnerId: "demo:jordan",
      displayName: "Demo Learner A",
      classId: "demo-section",
      note: "Confident and mostly accurate; ready for enrichment on ratios.",
    },
    {
      learnerId: "demo:priya",
      displayName: "Demo Learner B",
      classId: "demo-section",
      note: "Correct work, low confidence — the pattern a score alone hides.",
    },
    {
      learnerId: "demo:sam",
      displayName: "Demo Learner C",
      classId: "demo-section",
      note: "Multilingual learner; the barrier is the wording, not the ratio reasoning.",
    },
  ];

  /* --- Number Realm: one representative campaign ------------------------- */

  var NUMBER_REALM_EVENTS = [
    {
      eventId: "demo:nr:start",
      timestamp: at(0),
      learnerId: "demo:sam",
      classId: "demo-section",
      productId: "number-realm",
      activityId: "number-realm-unit-3",
      unitId: "unit-3",
      eventType: "activity_started",
      completionStatus: "in_progress",
      source: "synthetic",
    },
    {
      eventId: "demo:nr:item-1",
      timestamp: at(0, 3),
      learnerId: "demo:sam",
      classId: "demo-section",
      productId: "number-realm",
      activityId: "number-realm-unit-3",
      unitId: "unit-3",
      lessonId: "lesson-3-2",
      standardIds: ["6.AT.3"],
      eventType: "item_attempted",
      score: 0,
      maxScore: 1,
      attemptCount: 1,
      misconceptionCodes: ["ratio-table-additive"],
      supportLevel: "tier-2",
      languageSetting: "es",
      source: "synthetic",
    },
    {
      eventId: "demo:nr:hint-1",
      timestamp: at(0, 4),
      learnerId: "demo:sam",
      classId: "demo-section",
      productId: "number-realm",
      activityId: "number-realm-unit-3",
      unitId: "unit-3",
      standardIds: ["6.AT.3"],
      eventType: "hint_requested",
      hintCount: 1,
      source: "synthetic",
    },
    {
      eventId: "demo:nr:item-2",
      timestamp: at(0, 6),
      learnerId: "demo:sam",
      classId: "demo-section",
      productId: "number-realm",
      activityId: "number-realm-unit-3",
      unitId: "unit-3",
      lessonId: "lesson-3-2",
      standardIds: ["6.AT.3"],
      eventType: "item_attempted",
      score: 1,
      maxScore: 1,
      attemptCount: 2,
      answerRevisions: 1,
      source: "synthetic",
    },
    {
      eventId: "demo:nr:mastery",
      timestamp: at(0, 9),
      learnerId: "demo:sam",
      classId: "demo-section",
      productId: "number-realm",
      activityId: "number-realm-campaign",
      standardIds: ["6.AT.3"],
      eventType: "mastery_updated",
      score: 5,
      maxScore: 7,
      masteryLevel: "developing",
      attemptCount: 7,
      source: "synthetic",
    },
    {
      eventId: "demo:nr:badge",
      timestamp: at(0, 10),
      learnerId: "demo:sam",
      classId: "demo-section",
      productId: "number-realm",
      activityId: "number-realm-campaign",
      eventType: "badge_earned",
      completionStatus: "completed",
      source: "synthetic",
    },
  ];

  /* --- Language Bridge: support use, and movement toward independence ---- */

  var LANGUAGE_BRIDGE_EVENTS = [
    {
      eventId: "demo:lb:support",
      timestamp: at(0, 2),
      learnerId: "demo:sam",
      classId: "demo-section",
      productId: "language-bridge",
      activityId: "scaffold-ladder",
      lessonId: "lesson-3-2",
      standardIds: ["6.AT.3"],
      eventType: "support_used",
      supportLevel: "tier-2",
      languageSetting: "es",
      readAloudUsed: true,
      vocabularySupportUsed: true,
      source: "synthetic",
    },
    {
      eventId: "demo:lb:explanation-1",
      timestamp: at(0, 12),
      learnerId: "demo:sam",
      classId: "demo-section",
      productId: "language-bridge",
      activityId: "scaffold-ladder",
      lessonId: "lesson-3-2",
      standardIds: ["6.AT.3"],
      eventType: "explanation_written",
      supportLevel: "tier-2",
      writtenExplanation:
        "The ratio table works because I multiplied both numbers by 3, so 4 cups to 6 cups stays the same ratio.",
      source: "synthetic",
    },
    {
      eventId: "demo:lb:explanation-2",
      timestamp: at(9, 12),
      learnerId: "demo:sam",
      classId: "demo-section",
      productId: "language-bridge",
      activityId: "scaffold-ladder",
      lessonId: "lesson-3-4",
      standardIds: ["6.AT.3"],
      eventType: "explanation_written",
      supportLevel: "tier-1",
      writtenExplanation:
        "I used a unit rate instead of a table this time. One cup of mix needs 1.5 cups of water, so 8 cups of mix needs 12.",
      source: "synthetic",
    },
  ];

  /* --- Design Studio: a project with a real revision ---------------------- */

  var DESIGN_STUDIO_EVENTS = [
    {
      eventId: "demo:ds:checkpoint-1",
      timestamp: at(2, 20),
      learnerId: "demo:jordan",
      classId: "demo-section",
      productId: "design-studio",
      activityId: "unit-5-area-architects",
      unitId: "unit-5",
      standardIds: ["6.GR.1"],
      eventType: "project_checkpoint",
      completionStatus: "in_progress",
      projectArtifactRef: "demo-project-a:plan-v1",
      source: "synthetic",
    },
    {
      eventId: "demo:ds:checkpoint-2",
      timestamp: at(3, 25),
      learnerId: "demo:jordan",
      classId: "demo-section",
      productId: "design-studio",
      activityId: "unit-5-area-architects",
      unitId: "unit-5",
      standardIds: ["6.GR.1"],
      eventType: "project_checkpoint",
      completionStatus: "in_progress",
      answerRevisions: 1,
      projectArtifactRef: "demo-project-a:plan-v2",
      writtenExplanation:
        "My first floor plan was 3 square metres over budget, so I shortened the storage wall from 4 m to 2.5 m and recomputed the area.",
      source: "synthetic",
    },
    {
      eventId: "demo:ds:submitted",
      timestamp: at(4, 30),
      learnerId: "demo:jordan",
      classId: "demo-section",
      productId: "design-studio",
      activityId: "unit-5-area-architects",
      unitId: "unit-5",
      standardIds: ["6.GR.1"],
      eventType: "project_submitted",
      completionStatus: "completed",
      score: 17,
      maxScore: 20,
      answerRevisions: 2,
      portfolioRef: "demo-portfolio:entry-1",
      source: "synthetic",
    },
    {
      eventId: "demo:ds:portfolio",
      timestamp: at(4, 31),
      learnerId: "demo:jordan",
      classId: "demo-section",
      productId: "design-studio",
      activityId: "unit-5-area-architects",
      unitId: "unit-5",
      eventType: "portfolio_saved",
      completionStatus: "completed",
      portfolioRef: "demo-portfolio:entry-1",
      exportStatus: "saved",
      source: "synthetic",
    },
  ];

  /* --- Personalized Math Path: confidence, work, recommendation, follow-up */

  var MATH_PATH_EVENTS = [
    {
      eventId: "demo:pmp:confidence",
      timestamp: at(1, 1),
      learnerId: "demo:priya",
      classId: "demo-section",
      productId: "personalized-math-path",
      activityId: "confidence-check-unit-3",
      unitId: "unit-3",
      standardIds: ["6.AT.3"],
      eventType: "confidence_rated",
      confidenceBefore: 2,
      source: "synthetic",
    },
    {
      eventId: "demo:pmp:scored",
      timestamp: at(1, 15),
      learnerId: "demo:priya",
      classId: "demo-section",
      productId: "personalized-math-path",
      activityId: "exit-ticket-3-2",
      unitId: "unit-3",
      lessonId: "lesson-3-2",
      standardIds: ["6.AT.3"],
      eventType: "assessment_scored",
      completionStatus: "completed",
      score: 4,
      maxScore: 5,
      attemptCount: 5,
      hintCount: 0,
      confidenceBefore: 2,
      confidenceAfter: 2,
      source: "synthetic",
    },
    {
      eventId: "demo:pmp:recommendation",
      timestamp: at(1, 16),
      learnerId: "demo:priya",
      classId: "demo-section",
      productId: "personalized-math-path",
      activityId: "recommendation",
      unitId: "unit-3",
      standardIds: ["6.AT.3"],
      eventType: "recommendation_shown",
      recommendationSource: "confidence-vs-performance",
      recommendedNextActivity: "/lessons/3-3/",
      source: "synthetic",
    },
    {
      eventId: "demo:pmp:followup",
      timestamp: at(8, 15),
      learnerId: "demo:priya",
      classId: "demo-section",
      productId: "personalized-math-path",
      activityId: "exit-ticket-3-3",
      unitId: "unit-3",
      lessonId: "lesson-3-3",
      standardIds: ["6.AT.3"],
      eventType: "intervention_result",
      completionStatus: "completed",
      score: 5,
      maxScore: 5,
      confidenceBefore: 2,
      confidenceAfter: 4,
      interventionResult: "improved",
      source: "synthetic",
    },
  ];

  var ALL_EVENTS = []
    .concat(NUMBER_REALM_EVENTS)
    .concat(LANGUAGE_BRIDGE_EVENTS)
    .concat(DESIGN_STUDIO_EVENTS)
    .concat(MATH_PATH_EVENTS);

  /**
   * The dataset for a product, or the whole portfolio when productId is
   * omitted. Shaped for EWLEvidence.useSynthetic().
   */
  function dataset(productId) {
    var events = productId
      ? ALL_EVENTS.filter(function (e) {
          return e.productId === productId;
        })
      : ALL_EVENTS;
    return {
      learnerId: "demo:synthetic-learner",
      classId: "demo-section",
      events: events.map(function (e) {
        var copy = {};
        Object.keys(e).forEach(function (k) {
          copy[k] = e[k];
        });
        copy.synthetic = true;
        return copy;
      }),
    };
  }

  global.EWLSyntheticData = {
    LEARNERS: LEARNERS,
    dataset: dataset,
    all: function () {
      return dataset();
    },
    /* Every id in this file is prefixed so a stray demo record is instantly
     * identifiable anywhere it turns up. Asserted by the tests. */
    ID_PREFIX: "demo:",
  };
})(typeof window !== "undefined" ? window : globalThis);
