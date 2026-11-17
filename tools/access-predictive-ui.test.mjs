// WIDA Data Intelligence Studio logic (access-teacher/predictive/*): the import pipeline (wide and long
// tables, mapping, validation, apply, undo), canonical records and composites, the comparability rules
// (scale reset, 2026 cut scores, assessment families), scenarios, the MODEL-to-ACCESS refusal, the Research
// Analyst's intents, the Language Bottleneck rules, data quality, and the gate that keeps numbers off the
// screen unless a model is validated.
import assert from "node:assert/strict";
import test from "node:test";
import { answer, INTENTS, matchIntent } from "../access-teacher/predictive/analyst.js";
import {
  detectBottlenecks,
  domainEvidence,
  planFromFinding,
} from "../access-teacher/predictive/bottleneck.js";
import { concordanceFor, NO_PREDICTION } from "../access-teacher/predictive/concordance.js";
import { demoClass, demoTrainingCohort } from "../access-teacher/predictive/demo.js";
import { scoresFromReportText } from "../access-teacher/predictive/file-readers.js";
import {
  forecastFor,
  transitionsByKey,
  trendOf,
  validateAll,
} from "../access-teacher/predictive/forecast.js";
import {
  applyImport,
  autoMap,
  draftsFromTable,
  parseCSV,
  parseTable,
  undoImport,
  validateDrafts,
} from "../access-teacher/predictive/import.js";
import { comparableSteps, domainProfile } from "../access-teacher/predictive/interpret.js";
import { findingsFor } from "../access-teacher/predictive/planner.js";
import { qualityReport } from "../access-teacher/predictive/quality.js";
import { fromStored, recordsOf, validateDraft } from "../access-teacher/predictive/records.js";
import { levelVersionOf, scaleVersionOf } from "../access-teacher/predictive/rules.js";
import { applyScenario } from "../access-teacher/predictive/scenario.js";
import { studentsFromStores } from "../access-teacher/predictive/store.js";

const TODAY = new Date("2026-11-05T12:00:00Z");
const roster = [{ id: "P1|Ana|6-8", name: "Ana" }];
const EMPTY = () => ({ official: {}, interim: {} });
const preview = (text, stores = EMPTY()) => {
  const t = parseTable(text);
  return validateDrafts(draftsFromTable(t, autoMap(t[0]), { assessment: "ACCESS" }), {
    roster,
    stores,
    today: TODAY,
  });
};

test("CSV parser handles quotes, doubled quotes, CRLF and blank lines; pasted cells are tab-separated", () => {
  assert.deepEqual(parseCSV('a,b\r\n"x, y","he said ""hi"""\n\n'), [
    ["a", "b"],
    ["x, y", 'he said "hi"'],
  ]);
  assert.deepEqual(parseTable("a\tb\n1\t2"), [
    ["a", "b"],
    ["1", "2"],
  ]);
});

test("column mapping recognises WIDA-style headers", () => {
  assert.deepEqual(
    autoMap([
      "Student Name",
      "Listening Scale Score",
      "Listening Proficiency Level",
      "Overall Composite PL",
      "Literacy SS",
      "Notes",
    ]),
    ["student", "Listening:scale", "Listening:level", "Overall:level", "Literacy:scale", ""],
  );
});

test("wide import: ranges, years, duplicates, future years, roster matching, MODEL routing", () => {
  const p = preview(
    [
      "student,assessment,year,listening_level,listening_scale,overall_level",
      "Ana,ACCESS,2023-24,3.4,331,3.1",
      "Ana,ACCESS,2023-24,3.4,331,3.1",
      "Ana,ACCESS,2023,3.0,,",
      "Ana,ACCESS,2022-23,6.5,,",
      "Ana,ACCESS,2022-23,3.25,,",
      "Ana,ACCESS,2021-22,3.0,700,",
      "Ben,MODEL Online,2025-2026,3.0,,",
      "Cy,ACCESS,2030-31,2.6,,",
      "Dee,ACCESS,2024-25,,,",
    ].join("\n"),
  );
  const at = (line) => p.rows.find((r) => r.line === line);
  assert.equal(at(2).status, "new");
  assert.equal(at(2).studentId, "P1|Ana|6-8");
  assert.equal(at(3).status, "duplicate");
  assert.match(at(4).errors.join(), /2025-26/);
  assert.match(at(5).errors.join(), /1\.0 to 6\.0/);
  assert.match(at(6).errors.join(), /one decimal/);
  assert.match(at(7).errors.join(), /100-600/);
  assert.equal(at(8).row.assessment, "MODEL_ONLINE");
  assert.equal(at(8).row.year, "2025-26");
  assert.equal(at(8).studentId, "import|Ben");
  assert.match(at(9).errors.join(), /future/);
  assert.match(at(10).errors.join(), /at least one/);
});

test("long import is pivoted to one result per student assessment", () => {
  const p = preview(
    "student,year,domain,level,scale_score\nAna,2023-24,Listening,3.4,331\nAna,2023-24,Overall,3.1,\nAna,2023-24,Oops,3.1,",
  );
  assert.equal(p.rows.length, 1);
  assert.match(p.rows[0].errors.join(), /Unknown domain/);
  const ok = preview(
    "student,year,domain,level\nAna,2023-24,Listening,3.4\nAna,2023-24,Overall,3.1",
  );
  assert.equal(ok.rows[0].row.levels.Listening, 3.4);
  assert.equal(ok.rows[0].row.overall, 3.1);
});

test("import never overwrites silently; apply records provenance; undo restores the prior state", () => {
  const stores = {
    official: { "P1|Ana|6-8": [{ year: "2023-24", levels: { Listening: 3.0 }, overall: null }] },
    interim: {},
  };
  const p = preview(
    "student,year,listening_level\nAna,2023-24,3.4\nAna,2022-23,2.4\nAna,2024-25,2.9",
    stores,
  );
  assert.deepEqual(
    p.rows.map((r) => r.status),
    ["conflict", "new", "new"],
  );
  const kept = applyImport(stores, p, { importId: "i1", at: "t", fileName: "f.csv" });
  const list = kept.stores.official["P1|Ana|6-8"];
  assert.equal(
    list.find((r) => r.year === "2023-24").levels.Listening,
    3.0,
    "conflict skipped by default",
  );
  assert.equal(list.length, 3);
  assert.equal(list.find((r) => r.year === "2022-23").provenance.record.line, 3);
  assert.equal(stores.official["P1|Ana|6-8"].length, 1, "input is not mutated");
  const replaced = applyImport(stores, p, { replaceConflicts: true, importId: "i2", at: "t" });
  assert.equal(
    replaced.stores.official["P1|Ana|6-8"].find((r) => r.year === "2023-24").levels.Listening,
    3.4,
  );
  assert.deepEqual(undoImport(replaced.stores, replaced.log), stores);
});

test("records: reported vs calculated composites, never a calculated level; pre-schema rows read as ACCESS", () => {
  const rec = fromStored(
    {
      year: "2023-24",
      levels: { Listening: 3, Speaking: 3, Reading: 4, Writing: 4 },
      overall: null,
      scale: { Listening: 300, Speaking: 320, Reading: 340, Writing: 360 },
    },
    "s",
  );
  assert.equal(rec.assessmentType, "ACCESS");
  assert.equal(
    rec.composites.Overall.calculatedScale,
    Math.round(0.15 * 300 + 0.15 * 320 + 0.35 * 340 + 0.35 * 360),
  );
  assert.equal(rec.composites.Overall.status, "calculated");
  assert.equal(rec.composites.Overall.level, null, "no composite level is ever calculated");
  assert.equal(rec.composites.Comprehension.calculatedScale, Math.round(0.3 * 300 + 0.7 * 340));
  const post = fromStored(
    {
      year: "2025-26",
      levels: {},
      overall: null,
      scale: { Listening: 300, Speaking: 320, Reading: 340, Writing: 360 },
    },
    "s",
  );
  assert.equal(
    post.composites.Overall.calculatedScale,
    undefined,
    "no verified weights on the reset scale",
  );
  assert.equal(
    validateDraft(
      { assessment: "ACCESS", year: "2025-26", scores: { Listening: { scale: "700" } } },
      { today: TODAY },
    ).ok,
    true,
    "reset scale has no documented range",
  );
});

test("comparability: scale reset, 2026 cut scores, assessment families", () => {
  assert.equal(scaleVersionOf("ACCESS", "2024-25"), "access-2016-scale");
  assert.equal(scaleVersionOf("ACCESS", "2025-26"), "access-2025-scale");
  assert.equal(levelVersionOf("ACCESS", "2025-26"), "2016-cuts");
  assert.equal(levelVersionOf("ACCESS", "2025-26", "2026-cuts"), "2026-cuts");
  assert.equal(levelVersionOf("ACCESS", "2026-27"), "2026-cuts");
  const st = {
    id: "s",
    official: [
      { year: "2023-24", levels: { Reading: 3 }, overall: 3 },
      { year: "2024-25", levels: { Reading: 3.4 }, overall: 3.3 },
      { year: "2025-26", levels: { Reading: 3.9 }, overall: 3.6 },
    ],
    interim: [
      {
        assessment: "MODEL_ONLINE",
        year: "2024-25",
        date: "2024-10-01",
        levels: { Reading: 3.2 },
        overall: 3.1,
      },
    ],
  };
  const steps = comparableSteps(st);
  const annual = steps.filter((s) => s.to.assessmentType === "ACCESS");
  assert.equal(annual[0].levelsComparable, true);
  assert.equal(annual[0].rows.find((r) => r.key === "Reading").levelChange, 0.4);
  assert.equal(annual[1].levelsComparable, false, "no level change across the reset");
  assert.match(annual[1].why, /reset/);
  assert.ok(
    steps.every(
      (s) => !(s.from.assessmentType === "ACCESS" && s.to.assessmentType.startsWith("MODEL")),
    ),
    "MODEL is never compared with ACCESS",
  );
  assert.equal(recordsOf(st).length, 4);
});

test("forecasts: a result on the 2016 cuts cannot feed a 2026-27 forecast", () => {
  const st = {
    id: "s",
    official: [
      { year: "2024-25", levels: { Reading: 3 }, overall: 3 },
      { year: "2025-26", levels: { Reading: 3.4 }, overall: 3.3 },
    ],
  };
  const f = forecastFor({ student: st, key: "Reading", validations: {}, byKey: {}, today: TODAY });
  assert.equal(f.status, "insufficient");
  assert.equal(f.numbers, null);
  assert.match(f.plain, /cut scores/);
});

test("scenario: hypothetical changes clamp, composites illustrated only with verified weights", () => {
  const rec = fromStored(
    {
      year: "2023-24",
      levels: { Listening: 5.8, Speaking: 3, Reading: 3, Writing: 3 },
      overall: 3.2,
      scale: { Listening: 400, Speaking: 320, Reading: 340, Writing: 360 },
    },
    "s",
  );
  const r = applyScenario(rec, { Listening: { level: 1, scale: 10 }, Reading: { scale: 20 } });
  assert.equal(r.domains.Listening.level, 6);
  assert.equal(r.composites.Overall.change, Math.round(0.15 * 10 + 0.35 * 20));
  assert.equal(
    applyScenario(rec, { Reading: { scale: 999 } }).domains.Reading.scaleChange,
    60,
    "limit holds",
  );
  const post = fromStored(
    { year: "2025-26", levels: { Reading: 3 }, overall: 3, scale: { Reading: 400 } },
    "s",
  );
  assert.equal(applyScenario(post, {}).composites.Overall.status, "no-rule");
});

test("MODEL to ACCESS: no number without a loaded, version-matched table", () => {
  const model = fromStored(
    { assessment: "MODEL_ONLINE", year: "2025-26", levels: { Reading: 3 }, overall: 3 },
    "s",
    "interim",
  );
  for (const y of ["2025-26", "2026-27"]) {
    const c = concordanceFor(model, { targetYear: y });
    assert.equal(c.status, "unavailable");
    assert.ok(c.reason.startsWith(NO_PREDICTION));
    assert.match(c.source, /wida\.wisc\.edu/);
  }
});

test("profile and planner: relative wording, measurement error, findings link real resources", () => {
  const rec = fromStored(
    {
      year: "2023-24",
      levels: { Listening: 4, Speaking: 2.5, Reading: 3.5, Writing: 3 },
      overall: 3.2,
      scale: { Listening: 400, Speaking: 390 },
      sem: { Listening: 15, Speaking: 18 },
    },
    "s",
  );
  const prof = domainProfile(rec);
  assert.equal(prof.strength, "Listening");
  assert.equal(prof.need, "Speaking");
  assert.equal(prof.clear, false, "10 points is inside 1.96 x combined error");
  const f = findingsFor(rec);
  assert.equal(f[0].domain, "Speaking");
  assert.ok(f[0].resources.includes("speak"));
});

test("report text: labelled scores are read, nothing is guessed", () => {
  const got = scoresFromReportText(
    "ACCESS for ELLs 2024-2025\nGrade: 6\nListening 331 3.4\nSpeaking 312 2.8\nOverall Score 322 3.0",
  );
  assert.equal(got.year, "2024-25");
  assert.equal(got.grade, "6");
  assert.deepEqual(got.scores.Listening, { scale: "331", level: "3.4" });
  assert.equal(got.scores.Reading, undefined);
});

const entry = (domain, i, stage, extra) => ({
  id: `${domain}${i}`,
  t: "2026-10-01T00:00:00Z",
  task: `${domain}-task-${i}`,
  domain,
  kind: "first",
  stage,
  supports: stage === "independent" ? {} : { frames: true },
  use: "Explain",
  ...extra,
});
const listen = (i, ok) =>
  entry("Listening", i, "independent", {
    m: { questions: ["main idea", "detail", "sequence"].map((skill) => ({ skill, ok })) },
  });
const speak = (i, stage, q) =>
  entry("Speaking", i, stage, {
    m: {
      words: 30,
      link: q * 3,
      cites: q * 2,
      complex: q * 2,
      academic: q * 3,
      moves: { claim: q },
    },
  });

test("bottleneck rules: strong listening / weaker speaking, support dependence, no independent evidence", () => {
  const st = {
    id: "s1",
    name: "Ana",
    official: [],
    entries: [
      listen(1, true),
      listen(2, true),
      listen(3, true),
      speak(1, "independent", 0),
      speak(2, "independent", 0),
      speak(3, "supported", 1),
      speak(4, "supported", 1),
    ],
  };
  const now = Date.parse("2026-11-01");
  const f = detectBottlenecks(st, { now });
  const rules = f.map((x) => `${x.rule}:${x.domain}`);
  assert.ok(rules.includes("receptive-productive:Speaking"), rules.join());
  assert.ok(rules.includes("support-dependence:Speaking"), rules.join());
  for (const x of f)
    for (const k of ["observed", "hypothesis", "recommendation", "assessment"])
      assert.ok(x[k].length > 10);
  const onlySupported = {
    id: "s2",
    name: "Bo",
    official: [],
    entries: [1, 2, 3].map((i) => speak(i, "supported", 1)),
  };
  assert.ok(detectBottlenecks(onlySupported, { now }).some((x) => x.rule === "no-independent"));
  const plan = planFromFinding(f[0], { today: new Date("2026-11-01") });
  assert.equal(plan.checkpoint, "2026-11-15");
  assert.equal(
    detectBottlenecks({ id: "s3", name: "C", official: [], entries: [] }, { now }).length,
    0,
    "no evidence, no findings",
  );
});

test("analyst: supported intents are matched and answered with every explanation field; others are refused", () => {
  for (const i of INTENTS) assert.equal(matchIntent(i.example)?.id, i.id, i.example);
  assert.equal(matchIntent("What is the weather tomorrow?"), null);
  const students = [
    {
      id: "s1",
      name: "Ana",
      official: [
        { year: "2023-24", levels: { Speaking: 2.5 }, overall: 3 },
        { year: "2024-25", levels: { Speaking: 3.1 }, overall: 3.4 },
      ],
      entries: [
        listen(1, true),
        listen(2, true),
        listen(3, true),
        speak(1, "independent", 0),
        speak(2, "independent", 0),
        speak(3, "independent", 0),
      ],
    },
  ];
  const ctx = {
    students,
    evidence: (s) => domainEvidence(s, { now: Date.parse("2026-11-01") }),
    forecast: () => ({ status: "insufficient", numbers: null, series: [] }),
    targets: { Speaking: 3.5 },
    snapshots: {},
  };
  for (const i of INTENTS) {
    const a = answer(i.example, ctx);
    assert.equal(a.supported, true);
    for (const k of [
      "interpretation",
      "dataUsed",
      "timeRange",
      "computation",
      "uncertainty",
      "action",
    ])
      assert.ok(a[k], `${i.id}.${k}`);
    assert.ok(Array.isArray(a.rows));
  }
  assert.deepEqual(
    answer("Who has strong listening but weaker speaking?", ctx).rows[0].slice(0, 1),
    ["Ana"],
  );
  assert.equal(answer("Who shows the strongest speaking growth evidence?", ctx).rows[0][1], "+0.6");
  assert.deepEqual(answer("Who is approaching a target in speaking?", ctx).rows[0].slice(0, 2), [
    "Ana",
    "Speaking",
  ]);
  assert.equal(answer("Who is struggling with independent speaking?", ctx).rows[0][0], "Ana");
  const no = answer("Write my report card comments", ctx);
  assert.equal(no.supported, false);
  assert.equal(no.examples.length, INTENTS.length);
});

test("data quality: missing, implausible, jumps, duplicates, stale, cross-reset", () => {
  const q = qualityReport(
    [
      {
        id: "a",
        name: "Ana",
        official: [
          {
            year: "2021-22",
            levels: { Listening: 2.0, Speaking: 2, Reading: 2, Writing: 2 },
            overall: 2,
          },
          {
            year: "2022-23",
            levels: { Listening: 4.0, Speaking: 2, Reading: 2, Writing: 9 },
            overall: 2.1,
          },
        ],
      },
      {
        id: "b",
        name: "ana",
        official: [
          { year: "2024-25", levels: { Listening: 3 }, overall: 3 },
          { year: "2025-26", levels: { Listening: 3 }, overall: 3 },
        ],
      },
      { id: "c", name: "Cy", official: [] },
    ],
    { today: TODAY },
  );
  for (const k of ["missing", "implausible", "jump", "duplicate", "stale", "cross-reset"])
    assert.ok(q.counts[k] > 0, k);
});

test("real mode: a class-sized dataset never produces numbers; overall comes from the reported series", () => {
  const official = {
    s1: [
      { year: "2024-25", levels: { Writing: 2.4 }, overall: 2.8 },
      { year: "2025-26", levels: { Writing: 2.9 }, overall: 3.1 },
    ],
  };
  const students = studentsFromStores([{ id: "s1", alias: "Ana", section: "P1" }], official);
  const byKey = transitionsByKey(students);
  const v = validateAll(byKey);
  for (const k of ["Writing", "Overall"]) {
    const f = forecastFor({
      student: students[0],
      key: k,
      validations: v,
      byKey,
      threshold: 3.5,
      today: TODAY,
    });
    assert.equal(f.status, "insufficient");
    assert.equal(f.numbers, null);
    assert.equal(f.targetYear, "2026-27");
    assert.ok(f.plain.length > 20);
  }
  assert.equal(
    trendOf([
      { year: "2024-25", level: 2.8 },
      { year: "2025-26", level: 3.1 },
    ]).meanChange,
    null,
    "a cross-reset step is not a same-era trend",
  );
});

test("demo mode: synthetic pre-reset cohort validates; interval holds the expected value", () => {
  const byKey = transitionsByKey(demoTrainingCohort());
  const v = validateAll(byKey, { asOf: "2024-05-15" });
  const cls = demoClass();
  assert.ok(cls.every((s) => s.synthetic && s.name.startsWith("SYNTHETIC DEMO")));
  for (const k of ["Listening", "Speaking", "Reading", "Writing", "Overall"]) {
    assert.equal(
      v[k]["pre-2025-reset"].status,
      "validated",
      `${k}: ${v[k]["pre-2025-reset"].reasons}`,
    );
    const f = forecastFor({
      student: cls[0],
      key: k,
      validations: v,
      byKey,
      threshold: 4,
      today: new Date("2024-05-15"),
    });
    assert.equal(f.status, "validated");
    assert.ok(
      f.numbers.interval80[0] <= f.numbers.expected &&
        f.numbers.expected <= f.numbers.interval80[1],
    );
    assert.ok(f.numbers.probabilityAtLeastTarget >= 0 && f.numbers.probabilityAtLeastTarget <= 1);
  }
});
