// Statistical invariants of the Predictive Intelligence engine, proved on synthetic cohorts whose generating
// process is known. The engine must find a real signal, refuse to "beat" a random walk, keep held-out students
// out of training, withhold numbers when data are thin or cross the 2025-26 scale reset, and reproduce exactly.
import assert from "node:assert/strict";
import test from "node:test";
import { transitionsFromSeries } from "../access-practice-lab/src/predict/models.js";
import { meetsCriterion, policyFor } from "../access-practice-lab/src/predict/policy.js";
import { normalCdf, normalInv, ols, ridge } from "../access-practice-lab/src/predict/stats.js";
import { syntheticCohort } from "../access-practice-lab/src/predict/synthetic.js";
import {
  forecastNext,
  splitTransitions,
  VALIDATION_CONFIG,
  validateEra,
} from "../access-practice-lab/src/predict/validate.js";

const PRE = "pre-2025-reset";
const transitionsOf = (cohort) =>
  cohort.flatMap((s) => transitionsFromSeries(s.student, s.domain, s.series, s.formativeByYear));
const close = (a, b, eps) => assert.ok(Math.abs(a - b) <= eps, `${a} is not within ${eps} of ${b}`);

test("normal CDF and its inverse agree; OLS and ridge recover known coefficients", () => {
  close(normalCdf(0), 0.5, 1e-7);
  close(normalCdf(1.959964), 0.975, 1e-6);
  for (const x of [-2.5, -1, 0.3, 1.7]) close(normalInv(normalCdf(x)), x, 1e-5);
  const xs = [0, 1, 2, 3, 4, 5];
  const fit = ols(
    xs,
    xs.map((x) => 2 + 0.5 * x),
  );
  close(fit.slope, 0.5, 1e-12);
  close(fit.intercept, 2, 1e-12);
  const r = ridge(
    xs.map((x) => [x]),
    xs.map((x) => 2 + 0.5 * x),
    1e-9,
  );
  close(r.predict([10]), 7, 1e-6);
});

test("a cohort with real level-dependent growth validates, beats persistence, and its 80% interval covers ~80%", () => {
  const v = validateEra(transitionsOf(syntheticCohort({ seed: 11, students: 1500 })), PRE);
  assert.equal(v.status, "validated", v.reasons.join(" "));
  assert.equal(v.temporal, true);
  assert.notEqual(v.selected, "persistence");
  const m = v.models[v.selected];
  assert.ok(m.mae <= v.models.persistence.mae * (1 - VALIDATION_CONFIG.minGainOverBaseline));
  assert.ok(m.coverage >= 0.74 && m.coverage <= 0.86, `coverage ${m.coverage}`);
  assert.ok(m.calibrationError < 0.05, `calibration error ${m.calibrationError}`);
});

test("held-out students never appear in training, and test outcomes are later than training outcomes", () => {
  const {
    train,
    test: held,
    temporal,
  } = splitTransitions(transitionsOf(syntheticCohort({ seed: 3, students: 800 })), PRE);
  assert.equal(temporal, true);
  const trainStudents = new Set(train.map((t) => t.student));
  assert.ok(held.every((t) => !trainStudents.has(t.student)));
  const latestTrain = train
    .map((t) => t.to.year)
    .sort()
    .at(-1);
  assert.ok(held.every((t) => t.to.year > latestTrain));
});

test("a pure random walk: nothing may claim to beat persistence without a 3% held-out gain", () => {
  const v = validateEra(
    transitionsOf(
      syntheticCohort({
        seed: 5,
        students: 1500,
        growth: 0,
        pull: 0,
        start: 3.5,
        startSd: 0.4,
        noise: 0.3,
      }),
    ),
    PRE,
  );
  if (v.selected && v.selected !== "persistence")
    assert.ok(v.models[v.selected].mae <= v.models.persistence.mae * 0.97);
  assert.ok(
    v.models["level-adjusted-growth"].mae > v.models.persistence.mae * 0.97,
    "no level effect exists, so no material gain is possible",
  );
});

test("a real formative effect is used by ridge and earns the selection", () => {
  const v = validateEra(
    transitionsOf(syntheticCohort({ seed: 9, students: 1500, formativeEffect: 1.2 })),
    PRE,
  );
  assert.equal(v.status, "validated", v.reasons.join(" "));
  assert.equal(v.selected, "ridge");
});

test("validation is reproducible: the same data give the same numbers", () => {
  const t = transitionsOf(syntheticCohort({ seed: 21, students: 900 }));
  assert.deepEqual(validateEra(t, PRE), validateEra(t, PRE));
});

test("a small cohort is insufficient and no forecast numbers are produced", () => {
  const cohort = syntheticCohort({ seed: 1, students: 60 });
  const transitions = transitionsOf(cohort);
  const v = validateEra(transitions, PRE);
  assert.equal(v.status, "insufficient-data");
  const f = forecastNext({
    series: cohort[0].series,
    target: { year: "2025-26", threshold: 3.5 },
    validation: v,
    transitions,
  });
  assert.equal(f.numbers, null);
});

test("one outcome year cannot be time-validated, so it is never 'validated'", () => {
  const v = validateEra(
    transitionsOf(syntheticCohort({ seed: 2, students: 2000, years: ["2023-24", "2024-25"] })),
    PRE,
  );
  assert.equal(v.temporal, false);
  assert.notEqual(v.status, "validated");
});

test("transitions across the 2025-26 reset are excluded, and a forecast across it is withheld", () => {
  const cohort = syntheticCohort({
    seed: 4,
    students: 1500,
    years: ["2021-22", "2022-23", "2023-24", "2024-25", "2025-26"],
  });
  const transitions = transitionsOf(cohort);
  const v = validateEra(transitions, PRE);
  assert.ok(v.excludedCrossReset >= 1400, `excluded ${v.excludedCrossReset}`);
  const preOnly = cohort[0].series.filter((p) => p.year < "2025-26");
  const f = forecastNext({
    series: preOnly,
    target: { year: "2025-26", threshold: 3.5 },
    validation: v,
    transitions,
  });
  assert.equal(f.numbers, null);
  assert.ok(f.reasons.some((r) => /reset/.test(r)));
});

test("today's reality: one post-reset year gives no post-reset validation and no forecast for 2026-27", () => {
  const cohort = syntheticCohort({ seed: 6, students: 1500, years: ["2025-26"] });
  const transitions = transitionsOf(cohort);
  const v = validateEra(transitions, "post-2025-reset");
  assert.equal(v.status, "insufficient-data");
  const f = forecastNext({
    series: cohort[0].series,
    target: { year: "2026-27", threshold: 4.5 },
    validation: v,
    transitions,
  });
  assert.equal(f.numbers, null);
});

test("a validated forecast is internally consistent: interval holds the expected value, probabilities fall as the target rises", () => {
  const cohort = syntheticCohort({ seed: 11, students: 1500 });
  const transitions = transitionsOf(cohort);
  const v = validateEra(transitions, PRE);
  const series = [
    { year: "2022-23", level: 2.4 },
    { year: "2023-24", level: 2.9 },
    { year: "2024-25", level: 3.1 },
  ];
  const at = (threshold) =>
    forecastNext({
      series,
      target: { year: "2025-26", threshold },
      validation: { ...v, era: PRE },
      transitions: transitions.concat(),
    });
  // Target year 2025-26 is post-reset, so even a validated pre-reset model must refuse it.
  assert.equal(at(3.5).numbers, null);
  const inEra = (threshold) =>
    forecastNext({
      series: series.slice(0, 2),
      target: { year: "2024-25", threshold },
      validation: v,
      transitions,
    });
  const a = inEra(3.0);
  const b = inEra(3.5);
  assert.equal(a.production, true);
  assert.ok(
    a.numbers.interval80[0] <= a.numbers.expected && a.numbers.expected <= a.numbers.interval80[1],
  );
  assert.ok(a.numbers.probabilityAtLeastTarget >= b.numbers.probabilityAtLeastTarget);
  assert.ok(a.numbers.probabilityAtLeastTarget >= 0 && a.numbers.probabilityAtLeastTarget <= 1);
  assert.equal(a.model.id, v.selected);
});

test("exit criterion registry: Maryland regular ACCESS is overall 4.5, and nothing is applied elsewhere", () => {
  const md = policyFor({ jurisdiction: "Maryland", year: "2025-26" });
  assert.equal(md.threshold, 4.5);
  assert.match(md.calculation, /never builds a composite by averaging/);
  assert.equal(meetsCriterion(md, 4.5), true);
  assert.equal(meetsCriterion(md, 4.4), false);
  assert.equal(policyFor({ jurisdiction: "Virginia", year: "2025-26" }), null);
  assert.equal(
    policyFor({ jurisdiction: "Maryland", assessment: "alternate", year: "2025-26" }),
    null,
  );
});
