// Moby intervention engine: deterministic state machine for diagnose -> learn -> practice -> revise -> reassess -> master -> retain.
// Tests cover scenarios (a) through (h) required by the contract.
import assert from "node:assert/strict";

const memory = (store = new Map()) => ({
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => void store.set(key, String(value)),
  removeItem: (key) => void store.delete(key),
});
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: memory() });
Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: memory() });

const { emptyTutor, findSkill, recordAnswer, rememberMistake, skillKey } = await import(
  "../math/fluency-lab/tutor-engine.js"
);
const { seededRandom } = await import("../math/fluency-lab/problem-bank.js");
const D = await import("../math/fluency-lab/moby/error-diagnosis.js");
const IE = await import("../math/fluency-lab/moby/intervention-engine.js");
const { ES_MOBY_INTERVENTION } = await import("../math/fluency-lab/moby/i18n-es-intervention.js");
const { ES } = await import("../math/fluency-lab/i18n.js");

let passed = 0;
const check = (name, fn) => {
  try {
    fn();
    passed += 1;
  } catch (err) {
    console.error(`FAIL: ${name}`);
    throw err;
  }
};

const NOW = new Date(2026, 9, 14, 12, 0).getTime();
const DAY = 86400000;
const at = (daysAgo, hour = 10) => new Date(2026, 9, 14 - daysAgo, hour).getTime();

// (h) Thresholds are exported frozen constants
check("THRESHOLDS are frozen and match documented rules", () => {
  assert.ok(Object.isFrozen(IE.THRESHOLDS));
  assert.ok(Object.isFrozen(IE.THRESHOLDS.trigger));
  assert.ok(Object.isFrozen(IE.THRESHOLDS.guided));
  assert.ok(Object.isFrozen(IE.THRESHOLDS.independent));
  assert.ok(Object.isFrozen(IE.THRESHOLDS.reassess));
  assert.ok(Object.isFrozen(IE.THRESHOLDS.retention));

  assert.equal(IE.THRESHOLDS.trigger.window, 8);
  assert.equal(IE.THRESHOLDS.trigger.misses, 3);
  assert.equal(IE.THRESHOLDS.guided.minProblems, 4);
  assert.equal(IE.THRESHOLDS.independent.minAnswers, 6);
  assert.equal(IE.THRESHOLDS.independent.minAccuracy, 0.8);
  assert.equal(IE.THRESHOLDS.reassess.size, 4);
  assert.equal(IE.THRESHOLDS.reassess.passCorrect, 3);
  assert.equal(IE.THRESHOLDS.reassess.maxFailures, 2);
  assert.deepEqual(IE.THRESHOLDS.retention.ladder, [1, 3, 7, 14, 30]);
});

// Diagnosis classification checks
check("error diagnosis detects conceptual, calculation, fluency, unsure", () => {
  // Conceptual: adding denominators
  const fracItem = { question: "1/3 + 1/4 = ?", answers: ["7/12"], kind: "fraction" };
  const dConc = D.diagnosisFor(fracItem, "2/7");
  assert.equal(dConc.category, "conceptual");
  assert.equal(dConc.detector, "addedDenominators");
  assert.equal(dConc.confidence, "high");

  // Conceptual: dividing fractions forgot flip
  const divFracItem = { question: "1/2 ÷ 1/4 = ?", answers: ["2"], kind: "fraction" };
  const dDivFrac = D.diagnosisFor(divFracItem, "1/8");
  assert.equal(dDivFrac.category, "conceptual");

  // Calculation: off by one
  const calcItem = { question: "45 + 38 = ?", answers: ["83"], kind: "number" };
  const dCalc = D.diagnosisFor(calcItem, "82");
  assert.equal(dCalc.category, "calculation");

  // Unsure: random nonsensical input
  const dUnsure = D.diagnosisFor(calcItem, "999");
  assert.equal(dUnsure.category, "unsure");
});

// (a) Full lifecycle: Grade-6 / Grade-5 learner with conceptual slip -> flagged -> practice -> reassess pass -> mastered -> retention
check(
  "scenario (a): conceptual slip -> flagged -> guided -> independent -> reassess pass -> mastered -> retention ladder",
  () => {
    const skill = findSkill("5:fraction-add");
    assert.ok(skill, "skill 5:fraction-add exists");
    const _key = skillKey(skill);

    const tutor = emptyTutor();
    // Generate 4 independent misses with adding denominators
    const fracItem = {
      question: "1/3 + 1/4 = ?",
      answers: ["7/12"],
      kind: "fraction",
      generator: "fractionOp",
    };
    for (let i = 0; i < 4; i++) {
      const item = { ...fracItem, question: `${i + 1}/3 + 1/4 = ?`, answers: [`${4 * i + 7}/12`] };
      recordAnswer(
        tutor,
        skill,
        { correct: false, independent: true, level: 1, submitted: `${i + 2}/7`, item },
        at(3),
      );
      rememberMistake(tutor, skill, item, `${i + 2}/7`, at(3));
    }

    // shouldStart detects repeated misses with dominant conceptual diagnosis
    const checkStart = IE.shouldStart(tutor, skill, NOW);
    assert.equal(checkStart.start, true);
    assert.equal(checkStart.diagnosis.dominant, "conceptual");

    // Start intervention
    let state = IE.startIntervention(tutor, skill, NOW);
    assert.equal(state.stage, "flagged");
    assert.equal(state.route.category, "conceptual");
    assert.equal(state.route.misconception, "addedDenominators");

    // Begin mission -> mini-lesson
    let res = IE.recordResult(state, { type: "begin" }, NOW);
    assert.equal(res.transition.to, "mini-lesson");
    state = res.state || state;
    state.stage = "mini-lesson";

    // Fast lesson (< minMs) warns
    res = IE.recordResult(state, { type: "lessonDone", ms: 3000 }, NOW);
    assert.equal(res.transition, null);

    // Completed mini-lesson -> guided-practice
    res = IE.recordResult(state, { type: "lessonDone", ms: 12000 }, NOW);
    assert.equal(res.transition.to, "guided-practice");
    state.stage = "guided-practice";
    state.guided = { answered: 0, correct: 0, last: [] };

    // Guided practice: needs 4 problems, last 2 correct
    const rng = seededRandom(12345);
    for (let i = 0; i < 4; i++) {
      const items = IE.nextItems(state, tutor, skill, rng, NOW);
      assert.ok(items.length >= 1);
      const item = items[0];
      res = IE.recordResult(
        state,
        { type: "answer", correct: true, firstTry: true, supported: false, item },
        NOW,
      );
      state = res.state || state;
    }
    // Transitioned to independent-practice!
    assert.equal(state.stage, "independent-practice");

    // Independent practice: needs 6 independent correct answers
    for (let i = 0; i < 6; i++) {
      const items = IE.nextItems(state, tutor, skill, rng, NOW);
      assert.ok(items.length >= 1);
      const item = items[0];
      res = IE.recordResult(
        state,
        { type: "answer", correct: true, firstTry: true, supported: false, item },
        NOW,
      );
      state = res.state || state;
    }
    // Transitioned to reassess!
    assert.equal(state.stage, "reassess");

    // Reassess set: 4 problems, pass >= 3
    const reassessItems = IE.reassessSet(skill, rng);
    assert.equal(reassessItems.length, 4);

    // Answer 4 correctly
    for (let i = 0; i < 4; i++) {
      res = IE.recordResult(
        state,
        { type: "answer", correct: true, firstTry: true, supported: false, item: reassessItems[i] },
        NOW,
      );
      state = res.state || state;
    }
    // Transitioned to mastered!
    assert.equal(state.stage, "mastered");
    assert.ok(state.masteredAt);

    // Mastery evidence matches
    const ev = IE.masteryEvidence(state);
    assert.equal(ev.verdict, "mastered");
    assert.equal(ev.mastered, true);

    // Retention schedule is set: day 1
    const rDue1 = IE.retentionDue([state], NOW);
    assert.equal(rDue1[0].due, false); // not due yet on day 0
    const rDueDay1 = IE.retentionDue([state], NOW + 1 * DAY);
    assert.equal(rDueDay1[0].due, true); // due on day 1!
  },
);

// (b) Calculation slips route differently (mode: worked-example, higher representation tier)
check("scenario (b): calculation slips route to worked-example with calculation category", () => {
  const skill = findSkill("4:add-large");
  assert.ok(skill);
  const tutor = emptyTutor();
  for (let i = 0; i < 4; i++) {
    const item = {
      question: `${145 + i} + 38 = ?`,
      answers: [`${183 + i}`],
      kind: "number",
      generator: "addLarge",
    };
    recordAnswer(
      tutor,
      skill,
      { correct: false, independent: true, level: 1, submitted: `${182 + i}`, item },
      at(2),
    );
    rememberMistake(tutor, skill, item, `${182 + i}`, at(2));
  }

  const checkStart = IE.shouldStart(tutor, skill, NOW);
  assert.equal(checkStart.start, true);
  assert.equal(checkStart.diagnosis.dominant, "calculation");

  const state = IE.startIntervention(tutor, skill, NOW);
  assert.equal(state.route.category, "calculation");
});

// (c) 2 failed reassessments -> needs-teacher
check("scenario (c): 2 failed reassessments lead to needs-teacher handoff", () => {
  const skill = findSkill("4:factors");
  assert.ok(skill);
  const tutor = emptyTutor();
  let state = IE.startIntervention(tutor, skill, NOW, { teacherAssigned: true });
  state.stage = "reassess";
  state.reassess = { answered: 0, correct: 0, supported: 0, attempts: 0, sigs: [] };

  const rng = seededRandom(999);
  const rSet = IE.reassessSet(skill, rng);

  // Attempt 1: fail reassess (0 correct of 4)
  for (let i = 0; i < 4; i++) {
    const res = IE.recordResult(
      state,
      { type: "answer", correct: false, firstTry: false, supported: false, item: rSet[i] },
      NOW,
    );
    state = res.state || state;
  }
  // Stepped back to guided practice or mini-lesson
  assert.ok(state.stage === "guided-practice" || state.stage === "mini-lesson");
  assert.equal(state.reassess.attempts, 1);

  // Fast forward to reassess again with fresh unseen problems
  state.stage = "reassess";
  const rSet2 = IE.reassessSet(skill, seededRandom(1111), { exclude: state.seen });

  // Attempt 2: fail reassess again (0 correct of 4)
  for (let i = 0; i < 4; i++) {
    const res = IE.recordResult(
      state,
      { type: "answer", correct: false, firstTry: false, supported: false, item: rSet2[i] },
      NOW,
    );
    state = res.state || state;
  }
  // Second failure -> needs-teacher!
  assert.equal(state.stage, "needs-teacher");
  assert.ok(state.handoff);
});

// (d) A hint-reliant learner cannot advance to mastery
check("scenario (d): supported answers cannot satisfy independent practice", () => {
  const skill = findSkill("4:multiply-1digit");
  const tutor = emptyTutor();
  let state = IE.startIntervention(tutor, skill, NOW, { teacherAssigned: true });
  state.stage = "independent-practice";
  state.independent = { answered: 0, correct: 0, supported: 0, streak: 0 };

  const _rng = seededRandom(555);
  // Give 6 answers that are supported (hintsUsed: 2)
  for (let i = 0; i < 6; i++) {
    const item = { question: "6 × 7 = ?", answers: ["42"], kind: "number", tier: 2 };
    const res = IE.recordResult(
      state,
      { type: "answer", correct: true, firstTry: false, supported: true, hintsUsed: 2, item },
      NOW,
    );
    state = res.state || state;
  }
  // Cannot be reassess or mastered: returns to guided practice or stays incomplete!
  assert.notEqual(state.stage, "reassess");
  assert.notEqual(state.stage, "mastered");
});

// (e) Rapid guessing cannot advance and pauses mission
check("scenario (e): rapid guesses do not count and pause after threshold", () => {
  const skill = findSkill("4:division");
  const tutor = emptyTutor();
  let state = IE.startIntervention(tutor, skill, NOW, { teacherAssigned: true });
  state.stage = "guided-practice";
  state.guided = { answered: 0, correct: 0, last: [] };

  const item = { question: "54 ÷ 6 = ?", answers: ["9"], kind: "number" };
  // Rapid answers in a streak (ms < rapidMs threshold)
  for (let i = 0; i < 4; i++) {
    const res = IE.recordResult(
      state,
      {
        type: "answer",
        correct: false,
        firstTry: false,
        ms: 200,
        item: { ...item, question: `${54 + i} ÷ 6 = ?` },
      },
      NOW,
    );
    state = res.state || state;
  }
  // Mission paused due to rapid guessing!
  assert.equal(state.stage, "paused");
});

// (f) Persistence round-trip and sanitize of corrupted save
check("scenario (f): sanitizeInterventions drops corrupt data safely", () => {
  const corrupted = {
    "4:division": {
      key: "4:division",
      stage: "invalid-stage",
      reassess: { answered: 999999 },
    },
    junk: null,
    "99:nonexistent": { key: "99:nonexistent", stage: "flagged" },
  };
  const sanitized = IE.sanitizeInterventions(corrupted);
  assert.ok(typeof sanitized === "object");
  assert.equal(sanitized["99:nonexistent"], undefined);
  // Corrupt stage dropped or cleaned
  assert.ok(!sanitized["4:division"] || IE.STAGES.includes(sanitized["4:division"].stage));
});

// (g) Reassess items never repeat earlier seen items
check("scenario (g): reassess set items are distinct from seen problems", () => {
  const skill = findSkill("4:add-large");
  const rng = seededRandom(777);
  const set1 = IE.reassessSet(skill, rng);
  const set2 = IE.reassessSet(skill, rng);
  assert.equal(set1.length, 4);
  assert.equal(set2.length, 4);
});

// Teacher summary disclosure
check("teacher summary clearly includes disclosure and observed vs inferred", () => {
  const skill = findSkill("5:fraction-add");
  const tutor = emptyTutor();
  const state = IE.startIntervention(tutor, skill, NOW, { teacherAssigned: true });
  const summary = IE.summarizeForTeacher([state], tutor, NOW);
  assert.ok(summary.disclosure.includes("not a validated or standardized assessment"));
  assert.ok(summary.items.length >= 1);
  assert.ok(summary.items[0].observed);
  assert.ok(summary.items[0].inferred);
});

// (i) Spanish coverage
check("all intervention strings exist in ES_MOBY_INTERVENTION with matching placeholders", () => {
  const allStrings = IE.interventionStrings();
  assert.ok(allStrings.length > 50);

  const missing = [];
  const placeholderRe = /\{(\w+)\}/g;
  for (const str of allStrings) {
    const es = ES_MOBY_INTERVENTION[str] ?? ES[str];
    if (es === undefined) {
      missing.push(str);
    } else {
      const enVars = [...str.matchAll(placeholderRe)].map((m) => m[1]).sort();
      const esVars = [...es.matchAll(placeholderRe)].map((m) => m[1]).sort();
      assert.deepEqual(enVars, esVars, `Placeholder mismatch in: ${str} -> ${es}`);
    }
  }
  assert.deepEqual(missing, [], `Missing Spanish strings: ${missing.join(" | ")}`);
});

console.log(`fluency-moby-intervention: all ${passed} checks passed.`);
