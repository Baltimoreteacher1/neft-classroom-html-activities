// Predictive Intelligence workspace logic (access-teacher/predictive/*): CSV import validation, apply and
// undo; the Research Analyst's intents; the Language Bottleneck rules; the simulator arithmetic; the
// data-quality checks; and the gate that keeps numbers off the screen unless a model is validated.
import assert from "node:assert/strict";
import test from "node:test";
import { answer, INTENTS, matchIntent } from "../access-teacher/predictive/analyst.js";
import {
  detectBottlenecks,
  domainEvidence,
  planFromFinding,
} from "../access-teacher/predictive/bottleneck.js";
import { demoClass, demoTrainingCohort } from "../access-teacher/predictive/demo.js";
import {
  forecastFor,
  transitionsByKey,
  trendOf,
  validateAll,
} from "../access-teacher/predictive/forecast.js";
import {
  applyImport,
  parseCSV,
  undoImport,
  validateImport,
} from "../access-teacher/predictive/import.js";
import { qualityReport } from "../access-teacher/predictive/quality.js";
import { readAssumptions, sensitivity, simulate } from "../access-teacher/predictive/simulator.js";
import { studentsFromStores } from "../access-teacher/predictive/store.js";

const TODAY = new Date("2026-11-05T12:00:00Z");
const roster = [{ id: "P1|Ana|6-8", name: "Ana" }];

test("CSV parser handles quotes, doubled quotes, CRLF and blank lines", () => {
  assert.deepEqual(parseCSV('a,b\r\n"x, y","he said ""hi"""\n\n'), [
    ["a", "b"],
    ["x, y", 'he said "hi"'],
  ]);
});

test("import validation: year, domain, level, scale, duplicates, missing values, reset flags", () => {
  const csv = [
    "student,year,domain,level,scale_score",
    "Ana,2023-24,Listening,3.4,331",
    "Ana,2023-24,Listening,3.4,331",
    "Ana,2023,Reading,3.0,",
    "Ana,2023-24,Oral,3.0,",
    "Ana,2023-24,Writing,6.5,",
    "Ana,2023-24,Speaking,3.25,",
    "Ana,2023-24,Overall,3.1,700",
    "Ana,2023-24,Reading,,",
    "Ben,2025-2026,Overall,2.8,",
    "Ben,2024-25,Overall,2.6,",
    "Cy,2030-31,Overall,2.6,",
  ].join("\n");
  const p = validateImport(csv, { roster, official: {}, today: TODAY });
  const at = (line) => p.rows.find((r) => r.line === line);
  assert.equal(at(2).status, "new");
  assert.equal(at(2).studentId, "P1|Ana|6-8", "matched to the roster by alias");
  assert.equal(at(3).status, "duplicate");
  assert.match(at(4).errors.join(), /school year/);
  assert.match(at(5).errors.join(), /not Listening/);
  assert.match(at(6).errors.join(), /1\.0 to 6\.0/);
  assert.match(at(7).errors.join(), /one decimal/);
  assert.match(at(8).errors.join(), /100 to 600/);
  assert.match(at(9).errors.join(), /Level is missing/);
  assert.equal(at(10).year, "2025-26", "four-digit second year is normalised");
  assert.equal(at(10).studentId, "import|Ben", "an unmatched student is kept as imported history");
  assert.ok(at(10).flags.some((f) => /Post-reset/.test(f)));
  assert.ok(at(11).flags.some((f) => /both sides of the scale reset/.test(f)));
  assert.match(at(12).errors.join(), /future/);
  assert.equal(validateImport("name,yr\nx,y", { today: TODAY }).headerErrors.length > 0, true);
});

test("import never overwrites silently; apply records provenance; undo restores the prior state", () => {
  const official = {
    "P1|Ana|6-8": [{ year: "2023-24", levels: { Listening: 3.0, Reading: 2.9 }, overall: null }],
  };
  const csv =
    "student,year,domain,level\nAna,2023-24,Listening,3.4\nAna,2023-24,Reading,2.9\nAna,2023-24,Writing,2.5\nAna,2022-23,Overall,2.4";
  const p = validateImport(csv, { roster, official, today: TODAY });
  assert.deepEqual(
    p.rows.map((r) => r.status),
    ["conflict", "unchanged", "new", "new"],
  );
  const kept = applyImport(official, p, { importId: "i1", at: "t", fileName: "f.csv" });
  const y24 = kept.official["P1|Ana|6-8"].find((r) => r.year === "2023-24");
  assert.equal(y24.levels.Listening, 3.0, "conflict skipped by default");
  assert.equal(y24.levels.Writing, 2.5);
  assert.deepEqual(y24.provenance.Writing, {
    kind: "csv-import",
    importId: "i1",
    file: "f.csv",
    line: 4,
    at: "t",
    replaced: false,
  });
  assert.equal(official["P1|Ana|6-8"][0].levels.Writing, undefined, "input is not mutated");
  const replaced = applyImport(official, p, { replaceConflicts: true, importId: "i2", at: "t" });
  assert.equal(
    replaced.official["P1|Ana|6-8"].find((r) => r.year === "2023-24").levels.Listening,
    3.4,
  );
  assert.deepEqual(undoImport(replaced.official, replaced.log), official);
});

test("simulator arithmetic is shown step by step and clamps to the scale", () => {
  const a = readAssumptions({
    sessionsPerWeek: 3,
    minutesPerSession: 20,
    weeks: 12,
    participation: 0.85,
    effectPer10h: 0.05,
  });
  assert.equal(a.ok, true);
  const r = simulate(3.2, a.value);
  assert.equal(r.deliveredHours, 10.2); // 3*20*12*0.85/60
  assert.equal(r.shift, 0.05); // 10.2/10*0.05 = 0.051
  assert.equal(r.level, 3.3);
  assert.equal(r.steps.length, 3);
  assert.equal(simulate(5.9, { ...a.value, effectPer10h: 1 }).level, 6);
  assert.equal(simulate(5.9, { ...a.value, effectPer10h: 1 }).clamped, true);
  assert.equal(simulate(3, { ...a.value, participation: 0 }).level, 3);
  assert.deepEqual(
    sensitivity(3, { ...a.value, effectPer10h: 0.2 }).map((x) => x.shift),
    [0.1, 0.2, 0.31],
  );
  assert.equal(
    readAssumptions({
      sessionsPerWeek: 99,
      minutesPerSession: 20,
      weeks: 1,
      participation: 1,
      effectPer10h: 0,
    }).ok,
    false,
  );
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
