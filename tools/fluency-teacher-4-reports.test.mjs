// Teacher tools 4.0: class analysis, grouping, trouble spots, trends and exports on a fixture class.
// Expected counts are worked out here from the raw answer strings, not by calling the analysis code.
import assert from "node:assert/strict";
import { answers, DAY, keyOf, mistake, NOW, tutorWith } from "./lib/teacher-4-fixtures.mjs";

const lab = "../math/fluency-lab/";
const teacher = await import(`${lab}reports-teacher.js`);
const rowsMod = await import(`${lab}reports-rows.js`);
const exportsMod = await import(`${lab}reports-export.js`);
const teacherViews = await import(`${lab}teacher-4-views.js`);
const { createClassState } = await import(`${lab}teacher-4-class.js`);
const { masteryScore } = await import(`${lab}mastery-model.js`);
const { validateAssignment } = await import(`${lab}school-tools.js`);
const { mistakeCategoryLabel } = await import(`${lab}mistake-notes.js`);

let passed = 0;
const check = (name, fn) => {
  try {
    fn();
  } catch (error) {
    error.message = `[${name}] ${error.message}`;
    throw error;
  }
  passed += 1;
};

const ADD = keyOf("add-20");
const RATIOS = "6:ratios";
const PROPORTIONS = "7:proportions";
const learner = (id, label, records, mistakes = [], extra = {}) => ({
  id,
  label,
  tutor: tutorWith(records, mistakes, extra),
  growth: { version: 1, snapshots: [] },
  exportedAt: NOW,
  grade: null,
});
const spread = (pattern, options = {}) =>
  answers(pattern, { start: NOW - (pattern.length - 1) * DAY, ...options });
const mastered = spread("cccccccccc");

const fixture = () => [
  learner(
    "L1",
    "Learner 1",
    { [ADD]: spread("cwww"), [RATIOS]: spread("wwcw"), [PROPORTIONS]: spread("wwc") },
    [
      mistake(ADD, "subtractInsteadOfAdding", { n: 0 }),
      mistake(ADD, "subtractInsteadOfAdding", { n: 1 }),
    ],
  ),
  learner(
    "L2",
    "Learner 2",
    { [ADD]: spread("www"), [RATIOS]: spread("wcw"), [PROPORTIONS]: spread("ww") },
    [
      mistake(ADD, "subtractInsteadOfAdding", { n: 2 }),
      mistake(ADD, "omittedAddend", { resolved: true, n: 3 }),
    ],
  ),
  learner("L3", "Learner 3", { [ADD]: spread("cccc"), [RATIOS]: mastered }, [], {
    [RATIOS]: { dueAt: NOW - 2 * DAY, interval: 7 },
  }),
  learner("L4", "Learner 4", { [ADD]: spread("cw") }, [mistake(ADD, "omittedAddend", { n: 4 })]),
  learner(
    "L5",
    "Learner 5",
    {
      [ADD]: [...spread("w"), ...answers("ww", { independent: false, start: NOW - 5 * DAY })],
      [RATIOS]: mastered,
    },
    [],
    { [RATIOS]: { dueAt: NOW - 10 * DAY, interval: 30 } },
  ),
  learner("L6", "Learner 6", {}),
];
const analyze = (learners = fixture(), options = {}) =>
  teacher.analyzeClass(learners, { now: NOW, ...options });

check("trouble spots match counts worked out from the raw answers", () => {
  const result = analyze();
  assert.equal(result.totals.learners, 5, "a learner with no evidence is left out");
  const spot = (key) => result.troubleSpots.find((item) => item.key === key);
  // add-20: learners with 2+ independent answers are L1(4) L2(3) L3(4) L4(2); under 60% correct: L1 1/4, L2 0/3, L4 1/2.
  const add = spot(ADD);
  assert.deepEqual([add.checkedLearners, add.lowLearners], [4, 3]);
  assert.deepEqual(
    [add.independentAnswers, add.independentWrong],
    [14, 8],
    "L5's single independent miss still counts as an observed answer",
  );
  assert.equal(add.supportedAnswers, 2);
  const ratios = spot(RATIOS);
  assert.deepEqual(
    [
      ratios.checkedLearners,
      ratios.lowLearners,
      ratios.independentAnswers,
      ratios.independentWrong,
    ],
    [4, 2, 27, 5],
  );
  assert.deepEqual([spot(PROPORTIONS).checkedLearners, spot(PROPORTIONS).lowLearners], [2, 2]);
  assert.deepEqual(
    result.troubleSpots.map((item) => item.key),
    [ADD, RATIOS, PROPORTIONS],
    "ordered by learners needing help, then wrong answers",
  );
  assert.ok(add.intervention && add.intervention.practice.keys.includes(ADD));
  assert.ok(result.skills.length === 3 && result.skills.every((item) => item.avgScore !== null));
});

check("answer patterns: counts, learners, corrected, and the reteach move", () => {
  const { byPattern, byCategory } = analyze().misconceptions;
  const find = (key, category) =>
    byPattern.find((item) => item.key === key && item.category === category);
  const sub = find(ADD, "subtractInsteadOfAdding");
  assert.deepEqual(
    [sub.recorded, sub.open, sub.corrected, sub.learners],
    [3, 3, 0, ["Learner 1", "Learner 2"]],
  );
  const omit = find(ADD, "omittedAddend");
  assert.deepEqual(
    [omit.recorded, omit.open, omit.corrected, omit.learners],
    [2, 1, 1, ["Learner 2", "Learner 4"]],
  );
  assert.ok(
    sub.reteach.length > 20 && sub.label === mistakeCategoryLabel("subtractInsteadOfAdding"),
  );
  assert.deepEqual(
    byCategory.map((item) => [item.category, item.recorded, item.learners]),
    [
      ["subtractInsteadOfAdding", 3, 2],
      ["omittedAddend", 2, 2],
    ],
  );
});

check("flexible groups: shared pattern, gap, review, extend; singletons are individual", () => {
  const result = analyze();
  const brief = (group) => [group.basis, group.skillKey, group.category, group.learners];
  assert.deepEqual(result.groups.map(brief), [
    ["misconception", ADD, "subtractInsteadOfAdding", ["Learner 1", "Learner 2"]],
    ["gap", RATIOS, null, ["Learner 1", "Learner 2"]],
    ["review", RATIOS, null, ["Learner 3", "Learner 5"]],
    ["extend", RATIOS, null, ["Learner 3", "Learner 5"]],
  ]);
  assert.deepEqual(
    result.individual.map(brief),
    [["misconception", ADD, "omittedAddend", ["Learner 4"]]],
    "an open pattern on one learner is not a group",
  );
  const gap = result.groups[1].intervention;
  assert.equal(gap.prerequisiteMeasured, true);
  assert.equal(gap.focus, RATIOS);
  for (const group of result.groups) {
    const plan = {
      version: 1,
      grade: group.skill.grade,
      count: group.intervention.practice.count,
      mode: group.intervention.practice.mode,
      ...group.intervention.practice,
    };
    const clean = validateAssignment(plan);
    assert.ok(clean, `${group.id}: the suggested practice is a valid assignment`);
    assert.deepEqual(
      [clean.tiers, clean.target],
      [group.intervention.practice.tiers, group.intervention.practice.target],
    );
  }
  assert.deepEqual(
    result.groups.find((g) => g.basis === "extend").intervention.practice.tiers,
    [4, 5],
  );
});

check("grouping is stable when learners arrive in any order", () => {
  const base = analyze();
  const view = (result) =>
    JSON.stringify([
      result.groups.map((g) => [g.id, g.learners]),
      result.individual.map((g) => g.id),
      result.troubleSpots.map((s) => s.key),
      result.misconceptions.byPattern.map((p) => [p.key, p.category]),
      result.learners.map((l) => l.label),
    ]);
  const learners = fixture();
  let seed = 7;
  const random = () => (seed = (seed * 48271) % 2147483647) / 2147483647;
  for (let round = 0; round < 8; round += 1) {
    const shuffled = [...learners].sort(() => random() - 0.5);
    assert.equal(view(analyze(shuffled)), view(base));
  }
  assert.equal(view(analyze([...learners].reverse())), view(base));
});

check("every diagnosis labels what was observed and what is only possible", () => {
  const result = analyze();
  const all = [
    ...result.troubleSpots,
    ...result.misconceptions.byPattern,
    ...result.groups,
    ...result.individual,
  ];
  assert.ok(all.length >= 8);
  for (const item of all) {
    assert.ok(
      item.observed?.text && /\d/.test(item.observed.text),
      "observed text counts something",
    );
    assert.equal(item.inferred?.certainty, "possible");
    assert.match(item.inferred.text, /possible/i);
    assert.doesNotMatch(
      item.inferred.text,
      /\b(definitely|certainly|proves?|is caused by|has a misconception)\b/i,
    );
    assert.doesNotMatch(
      item.observed.text,
      /possible|may |might /i,
      "observed lines make no guesses",
    );
  }
  const html = exportsMod.classReportHtml(result, { title: "Period 3", now: NOW });
  assert.match(html, /<b>Observed:<\/b> /);
  assert.ok(/Possible reason \(inferred\)/.test(html));
  assert.doesNotMatch(html, /[\u{1F300}-\u{1FAFF}☀-➿]/u, "no emoji in the printout");
});

check("by-level grouping on one skill uses current scores only", () => {
  const result = analyze();
  const byLevel = result.levelGroupsFor(ADD);
  const scores = Object.fromEntries(
    fixture()
      .filter((l) => l.tutor.records[ADD])
      .map((l) => [l.label, masteryScore(l.tutor.records[ADD], NOW)]),
  );
  const expected = (test) =>
    Object.keys(scores)
      .filter((name) => test(scores[name]))
      .sort();
  assert.deepEqual(
    byLevel.bands.map((band) => band.learners),
    [expected((s) => s < 40), expected((s) => s >= 40 && s < 70), expected((s) => s >= 70)],
  );
  assert.equal(byLevel.bands.flatMap((band) => band.learners).length, 5);
  assert.equal(byLevel.inferred.certainty, "possible");
  assert.equal(result.levelGroupsFor("9:nope"), null);
});

check("retention, independent versus supported work, strands and growth", () => {
  const result = analyze();
  assert.deepEqual(
    [result.retention.scheduled, result.retention.due, result.retention.overdue],
    [2, 2, 1],
  );
  assert.deepEqual(
    result.retention.ladder,
    [0, 0, 1, 0, 1],
    "interval 7 is rung 3 of 5 and 30 is rung 5",
  );
  assert.deepEqual(result.retention.mostOverdue, [{ key: RATIOS, count: 1 }]);
  assert.deepEqual(
    [
      result.totals.independentAnswers,
      result.totals.supportedAnswers,
      result.totals.independentShare,
    ],
    [46, 2, 96],
  );
  const l5 = result.learners.find((item) => item.label === "Learner 5");
  assert.deepEqual([l5.independentAnswers, l5.supportedAnswers, l5.independentShare], [11, 2, 85]);
  assert.deepEqual(Object.keys(l5.strands).sort(), ["Addition", "Ratios"].sort());
  assert.ok(result.strands.every((entry) => entry.learners > 0 && entry.avgScore >= 0));
  const withGrowth = fixture();
  const snap = (daysAgo, score) => ({
    key: RATIOS,
    at: NOW - daysAgo * DAY,
    score,
    state: "developing",
    independent: 4,
    ladderStep: 0,
  });
  withGrowth[2].growth = { version: 1, snapshots: [snap(14, 30), snap(7, 50), snap(0, 70)] };
  const grown = analyze(withGrowth);
  assert.deepEqual(
    grown.growth.weekly.map((point) => point.avgScore),
    [30, 50, 70],
  );
  assert.deepEqual(
    [grown.growth.learners, grown.growth.avgDelta, grown.growth.improved, grown.growth.declined],
    [1, 40, 1, 0],
  );
  assert.deepEqual(grown.learners.find((item) => item.label === "Learner 3").growthDelta, 40);
});

check("class trend across uploaded snapshot sets", () => {
  const earlier = [
    learner("a", "Learner 1", { [ADD]: spread("wwww") }),
    learner("b", "Learner 2", { [ADD]: spread("wcww") }),
  ];
  const later = [
    learner("a", "Learner 1", { [ADD]: spread("wwcccccc") }),
    learner("b", "Learner 2", { [ADD]: spread("wcccccc") }),
  ];
  const trend = teacher.compareSnapshotSets([
    { label: "Nov", at: NOW, learners: later },
    { label: "Oct", at: NOW - 30 * DAY, learners: earlier },
  ]);
  assert.deepEqual(
    trend.points.map((point) => point.label),
    ["Oct", "Nov"],
    "sets sort by date",
  );
  assert.ok(trend.points[1].avgScore > trend.points[0].avgScore);
  assert.equal(
    trend.points[1].change,
    +(trend.points[1].avgScore - trend.points[0].avgScore).toFixed(1),
  );
  assert.equal(trend.points[0].change, null);
  assert.deepEqual(
    trend.improved,
    [{ key: ADD, was: 2, now: 0 }],
    "both learners were stuck on add-20 and no longer are",
  );
  assert.deepEqual([trend.stillStuck, trend.newlyStuck], [[], []]);
  assert.deepEqual(
    teacher.compareSnapshotSets([{ label: "Only", at: NOW, learners: later }]).improved,
    [],
  );
});

check(
  "learner files: only Fluency Lab backups, labels typed by the teacher, nothing else read",
  () => {
    const backup = (extra = {}) => ({
      app: "EduWonderLab Fluency Lab",
      version: 2,
      exportedAt: "2026-10-14T12:00:00Z",
      grade: 1,
      progress: {},
      tutor: tutorWith({ [ADD]: spread("cc") }),
      settings: {},
      ...extra,
    });
    const plain = rowsMod.parseLearnerFile(backup(), 2);
    assert.equal(plain.label, "Learner 3");
    assert.equal(plain.exportedAt, Date.parse("2026-10-14T12:00:00Z"));
    assert.equal(
      rowsMod.parseLearnerFile(backup({ label: "  Period 3 <b>Ana</b>\u0007  " }), 0).label,
      "Period 3 bAna/b",
    );
    assert.equal(rowsMod.parseLearnerFile(backup({ label: "x".repeat(90) }), 0).label.length, 40);
    for (const bad of [
      null,
      "text",
      {},
      backup({ app: "Other" }),
      backup({ version: 1 }),
      backup({ tutor: { version: 1 } }),
    ])
      assert.equal(rowsMod.parseLearnerFile(bad, 0), null);
    const noPlay = rowsMod.parseLearnerFile(
      backup({ play: { growth: { version: 1, snapshots: [{ key: "x", at: 1 }] } } }),
      0,
    );
    assert.deepEqual(noPlay.growth.snapshots, [], "growth logs are sanitized on import");
    const withStudio = rowsMod.parseLearnerFile(
      backup({
        play: {
          studio: {
            skills: {
              [RATIOS]: [
                {
                  kind: "explore",
                  ok: true,
                  supported: true,
                  tag: "ratioTape",
                  response: "private text",
                },
                { kind: "try", ok: true, supported: false },
                { kind: "try", ok: false, supported: true },
              ],
            },
          },
        },
      }),
      0,
    );
    assert.deepEqual(
      withStudio.studio.skills[RATIOS],
      [
        { kind: "explore", ok: true, supported: true, tag: "ratioTape" },
        { kind: "try", ok: true, supported: false, tag: null },
        { kind: "try", ok: false, supported: true, tag: null },
      ],
      "Studio exports retain bounded action evidence and discard unrecognized response text",
    );
  },
);

check("Studio model use and independent transfer stay separate from mastery evidence", () => {
  const student = learner("S1", "Learner 1", { [RATIOS]: mastered });
  student.studio = {
    skills: {
      [RATIOS]: [
        { kind: "explore", ok: true, supported: true, tag: "ratioTape" },
        { kind: "try", ok: true, supported: false, tag: null },
        { kind: "try", ok: false, supported: true, tag: null },
      ],
    },
    badges: {},
  };
  const result = analyze([student], { grade: 6 });
  assert.deepEqual(
    [
      result.studio.explorations,
      result.studio.independentAttempts,
      result.studio.independentCorrect,
      result.studio.supportedAttempts,
    ],
    [1, 1, 1, 1],
  );
  const json = exportsMod.reportJson(result, NOW);
  assert.equal(json.studio.independentCorrect, 1);
  assert.doesNotMatch(JSON.stringify(json.studio), /private text|response/);
  assert.match(teacherViews.progressHtml(result), /Math Discovery Studio evidence/);
});

check("Studio evidence survives the teacher's explicit save and restore of a local class", () => {
  const storageKey = "ewl-fluency-teacher-class-v1";
  localStorage.removeItem(storageKey);
  const source = createClassState({
    deviceLearners: () => [
      {
        id: "device-0",
        label: "Synthetic learner",
        tutor: {
          version: 2,
          records: {},
          mistakes: [],
          diagnostics: {},
          sessions: [],
          rescues: [],
        },
        studio: {
          skills: { [RATIOS]: [{ kind: "explore", ok: true, supported: true, tag: "ratioTape" }] },
          badges: {},
        },
      },
    ],
  });
  assert.equal(source.useDevice(), 1, "Studio-only practice is discoverable on this device");
  assert.equal(source.save(), true, "the teacher explicitly saves the class evidence");
  const restored = createClassState({ deviceLearners: () => [] });
  restored.openSaved();
  assert.equal(restored.learners()[0].studio.skills[RATIOS][0].kind, "explore");
  assert.equal(analyze(restored.learners(), { grade: 6 }).studio.explorations, 1);
  localStorage.removeItem(storageKey);
});

// A small RFC 4180 reader, written here so the export is checked by something other than the code that wrote it.
function parseCsv(text) {
  const out = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\r") {
      /* skip */
    } else if (char === "\n") {
      row.push(cell);
      out.push(row);
      row = [];
      cell = "";
    } else cell += char;
  }
  row.push(cell);
  out.push(row);
  return out;
}

check("CSV exports escape quotes and formulas and hold only imported labels and counts", () => {
  const learners = fixture();
  learners[0].label = 'Ana "A", Jr.';
  learners[1].label = '=HYPERLINK("x")';
  const result = analyze(learners);
  const perLearner = parseCsv(exportsMod.learnerCsv(result));
  assert.equal(perLearner.length, 1 + 5);
  assert.ok(perLearner.every((row) => row.length === perLearner[0].length));
  assert.ok(
    perLearner.some((row) => row[0] === 'Ana "A", Jr.'),
    "quotes and commas survive the round trip",
  );
  assert.ok(
    perLearner.some((row) => row[0] === '\'=HYPERLINK("x")'),
    "a leading = is neutralised",
  );
  const l3 = perLearner.find((row) => row[0] === "Learner 3");
  assert.deepEqual(
    [l3[1], l3[4], l3[5], l3[6]],
    ["2", "14", "0", "100"],
    "Learner 3: two skills, 4 + 10 independent answers",
  );
  const perSkill = parseCsv(exportsMod.skillCsv(result));
  const records = learners.reduce((sum, l) => sum + Object.keys(l.tutor.records).length, 0);
  assert.equal(perSkill.length, 1 + records);
  const header = perSkill[0];
  assert.ok(
    header.includes("Possible pattern (inferred)") &&
      header.includes("Saved wrong answers matching a pattern (observed)"),
  );
  const l1 = perSkill.find(
    (row) =>
      row[0] === 'Ana "A", Jr.' && row[2] === result.rows.find((r) => r.key === ADD).skill.title,
  );
  assert.equal(l1[header.indexOf("Saved wrong answers matching a pattern (observed)")], "2");
  assert.equal(
    l1[header.indexOf("Possible pattern (inferred)")],
    mistakeCategoryLabel("subtractInsteadOfAdding"),
  );
  const allowed = new Set(learners.map((l) => l.label));
  for (const row of [...perLearner.slice(1), ...perSkill.slice(1)])
    assert.ok(
      allowed.has(row[0]) || allowed.has(row[0].slice(1)),
      "first column is an imported label",
    );
  const text = exportsMod.learnerCsv(result) + exportsMod.skillCsv(result);
  assert.doesNotMatch(text, /@|https?:|\bq\d\b/, "no emails, links or answer text");
  const json = exportsMod.reportJson(result, NOW);
  assert.equal(json.kind, "class-report");
  assert.equal(json.troubleSpots[0].skill.key, ADD);
  assert.equal(JSON.stringify(json).includes("miniLesson"), false);
});

check("printable report hides labels on request and states the privacy rule", () => {
  const result = analyze();
  const named = exportsMod.classReportHtml(result, { showLabels: true, now: NOW });
  const counts = exportsMod.classReportHtml(result, { showLabels: false, now: NOW });
  assert.match(named, /Learner 1, Learner 2/);
  assert.doesNotMatch(counts, /Learner \d/);
  assert.match(counts, /stays on this device/);
  assert.match(counts, /never a diagnosis/);
});

console.log(`fluency teacher 4.0 (reports): ${passed} checks passed`);
