#!/usr/bin/env node
// Share codes, backup merging of the new ledger/studio documents, teacher-side analysis, word bridges.
// Pins the privacy and honesty rules: alias-only bundles, hostile input handled, spreadsheet injection
// neutralised, a recommendation always names its evidence, and no screen/export invents a score.
import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM('<p id="labLive"></p>', { url: "https://lab.test/" });
for (const k of ["window", "document", "localStorage"]) globalThis[k] = dom.window[k];

const { PREFIX, importCode, exportCode } = await import("../access-practice-lab/src/store.js");
const { appendEntry, loadLedger, saveLedger, LEDGER_KEY } = await import(
  "../access-practice-lab/src/lang/ledger.js"
);
const { loadStudio, saveStudio, STUDIO_KEY, writingState, addVersion } = await import(
  "../access-practice-lab/src/lang/studio.js"
);
const { buildShare, encodeShare, decodeShare, normalize } = await import(
  "../access-practice-lab/src/lang/share.js"
);
const { classSummary, groupSuggestions, interventionsFor, samplesFor, toCSV } = await import(
  "../access-practice-lab/src/lang/teacher.js"
);
const { bridgesFor, wordParts } = await import("../access-practice-lab/src/lang/scaffolds.js");
const { recommendTasks, showStretch } = await import("../access-practice-lab/src/lang/adapt.js");

const seedStudent = (alias, { errs = {}, stage = "supported", n = 4 } = {}) => {
  const ledger = { entries: [] };
  for (let i = 0; i < n; i++)
    appendEntry(ledger, {
      src: "writing",
      task: `t${i}`,
      use: "Explain",
      stage,
      kind: "first",
      supports: stage === "independent" ? {} : { bank: true },
      m: { words: 50, link: 1, cites: 0, complex: 0, academic: 1, errs, moves: { cause: 0 } },
    });
  return {
    alias,
    band: "6-8",
    created: "",
    ledger,
    studio: { writing: {}, speaking: {}, missions: {}, detective: {} },
    records: {},
  };
};

test("share: bundle carries an alias, never contact details, and round-trips through its code", () => {
  localStorage.clear();
  const ledger = loadLedger();
  appendEntry(ledger, {
    src: "writing",
    task: "t",
    use: "Argue",
    stage: "independent",
    kind: "first",
    m: { words: 40 },
  });
  saveLedger(ledger);
  const studio = loadStudio();
  addVersion(writingState(studio, "t"), "My first draft about recycling.");
  saveStudio(studio);
  const bundle = buildShare({ alias: "  River 7  ", band: "6-8" });
  assert.equal(bundle.alias, "River 7");
  const json = JSON.stringify(bundle);
  assert.ok(
    !/@|email|phone|address|schoolId|deviceId/i.test(json.replace(/recycling/g, "")),
    "no contact or device identifiers",
  );
  const back = decodeShare(encodeShare(bundle));
  assert.equal(back.alias, "River 7");
  assert.equal(back.ledger.entries.length, 1);
  assert.equal(samplesFor(back)[0].first, "My first draft about recycling.");
});

test("share: postcards require explicit input, and imported media is limited to safe JPEG data", () => {
  const defaultShare = buildShare({ alias: "River", band: "6-8" });
  assert.deepEqual(defaultShare.postcards, []);
  const photo = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2Q==";
  const bundle = buildShare({
    alias: "River",
    band: "6-8",
    postcards: Array.from({ length: 7 }, (_, i) => ({
      id: `p${i}`,
      alt: "A plant near the window.",
      image: photo,
    })),
  });
  assert.equal(bundle.postcards.length, 6);
  const imported = decodeShare(encodeShare(bundle));
  assert.equal(imported.postcards.length, 6);
  assert.equal(imported.postcards[0].alt, "A plant near the window.");
  const unsafe = normalize({
    ...bundle,
    postcards: [
      { alt: "unsafe", image: "data:text/html;base64,PHNjcmlwdD4=" },
      { alt: "oversized", image: `data:image/jpeg;base64,${"A".repeat(610_000)}` },
      { alt: "valid", image: photo },
    ],
  });
  assert.deepEqual(
    unsafe.postcards.map(({ alt }) => alt),
    ["valid"],
  );
});

test("share: reading/listening includes only answer outcome, skill tag, support and date", () => {
  const bundle = buildShare(
    { alias: "River", band: "6-8" },
    { entries: [] },
    { writing: {}, speaking: {}, missions: {}, detective: {}, portfolio: { picks: [] } },
    [
      {
        band: "6-8",
        domain: "Reading",
        level: "A",
        record: {
          results: {
            item1: {
              ok: true,
              skill: "Main idea",
              supportUsed: false,
              date: "2026-10-22T10:00:00Z",
              response: "private",
            },
          },
        },
      },
      {
        band: "6-8",
        domain: "Writing",
        level: "A",
        record: { results: { item2: { ok: true, skill: "Evidence" } } },
      },
    ],
  );
  assert.deepEqual(Object.keys(bundle.records), ["Reading:A"]);
  assert.deepEqual(bundle.records["Reading:A"].results.item1, {
    skill: "Main idea",
    ok: true,
    supportUsed: false,
    date: "2026-10-22T10:00:00Z",
  });
  assert.ok(!JSON.stringify(bundle).includes("private"));
  const safe = normalize({
    ...bundle,
    records: {
      ...bundle.records,
      "Listening:B": {
        domain: "Listening",
        results: { x: { ok: true, skill: "Sequence", answer: "private" } },
      },
      "Writing:A": { domain: "Writing", results: { x: { ok: true } } },
    },
  });
  assert.ok(safe.records["Listening:B"]);
  assert.equal(safe.records["Writing:A"], undefined);
  assert.ok(!JSON.stringify(safe).includes("private"));
});

test("share: the full ACCESS1 progress code is also readable by the teacher dashboard", () => {
  const code = exportCode();
  const s = decodeShare(code);
  assert.equal(s.ledger.entries.length, 1);
  assert.ok(Object.keys(s.studio.writing).includes("t"));
  const photo = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2Q==";
  const envelope = {
    v: 1,
    data: {},
    postcards: [{ id: "p1", alt: "A plant by a window.", image: photo }],
  };
  const extended = `ACCESS1.${btoa(unescape(encodeURIComponent(JSON.stringify(envelope))))}`;
  assert.equal(decodeShare(extended).postcards[0].alt, "A plant by a window.");
});

test("share: hostile or malformed input is rejected with a plain message, never executed", () => {
  for (const bad of [
    "",
    "ACCESST1.@@@",
    "{not json",
    "ACCESS1.AAAA",
    '{"hello":1}',
    "<script>alert(1)</script>",
  ])
    assert.throws(() => decodeShare(bad), /code|file|Paste|student/i, bad);
  const evil = decodeShare(
    JSON.stringify({
      kind: "share",
      alias: "<img src=x onerror=1>".repeat(5),
      band: "99",
      ledger: { entries: [{ t: "x", src: "writing" }, null, 7] },
      studio: "nope",
    }),
  );
  assert.ok(evil.alias.length <= 40);
  assert.equal(evil.band, "6-8");
  assert.equal(evil.ledger.entries.length, 1);
  assert.deepEqual(evil.studio.writing, {});
});

test("backup import merges ledger and studio instead of overwriting, and rejects malformed documents without writing", () => {
  localStorage.clear();
  const local = loadLedger();
  appendEntry(local, { id: "a", src: "writing", task: "x", stage: "supported", m: { words: 10 } });
  saveLedger(local);
  const code = (data) =>
    `ACCESS1.${Buffer.from(JSON.stringify({ v: 1, data })).toString("base64")}`;
  const incoming = {
    entries: [
      { id: "a", t: "2026-01-01", src: "writing", task: "x" },
      { id: "b", t: "2026-01-02", src: "writing", task: "y" },
    ],
  };
  importCode(code({ [LEDGER_KEY]: JSON.stringify(incoming) }));
  assert.deepEqual(
    loadLedger()
      .entries.map((e) => e.id)
      .sort(),
    ["a", "b"],
  );
  const before = localStorage.getItem(STUDIO_KEY);
  assert.throws(
    () => importCode(code({ [STUDIO_KEY]: JSON.stringify({ writing: [] }) })),
    /invalid/i,
  );
  assert.throws(
    () => importCode(code({ [LEDGER_KEY]: JSON.stringify({ entries: "no" }) })),
    /invalid/i,
  );
  assert.equal(
    localStorage.getItem(STUDIO_KEY),
    before,
    "nothing written when a document is malformed",
  );
  importCode(
    code({
      [`${PREFIX}:somethingElse`]: "x",
      [STUDIO_KEY]: JSON.stringify({
        v: 1,
        writing: { w: { versions: [{ id: "v1", t: "1", text: "hi" }] } },
      }),
    }),
  );
  assert.equal(loadStudio().writing.w.versions[0].text, "hi");
  assert.equal(localStorage.getItem(`${PREFIX}:somethingElse`), null, "unrelated keys are ignored");
});

test("teacher: class summary never reports a level; a thin file says it needs more evidence", () => {
  const rows = classSummary([seedStudent("A", { n: 1 }), seedStudent("B", { n: 4 })]);
  assert.equal(rows[0].enoughEvidence, false);
  assert.equal(rows[1].enoughEvidence, true);
  assert.ok(!/level|score|proficiency|rating/i.test(JSON.stringify(Object.keys(rows[0]))));
  assert.ok(interventionsFor(rows[0]).some((i) => /Collect more evidence/.test(i.what)));
});

test("teacher: small groups form from shared, recurring patterns and name their evidence", () => {
  const students = ["A", "B", "C"].map((a) => seedStudent(a, { errs: { "sv-agree-3sg": 2 } }));
  students.push(seedStudent("D", { errs: {} }));
  const groups = groupSuggestions(students, {
    "sv-agree-3sg": {
      name: "He/she/it + verb",
      lesson: { rule: "Add -s.", wrong: "She go.", right: "She goes." },
    },
  });
  const g = groups.find((x) => x.kind === "pattern");
  assert.deepEqual(g.members.sort(), ["A", "B", "C"]);
  assert.match(g.why, /recent pieces/);
  assert.match(g.suggestion.plan, /Add -s/);
  assert.equal(groupSuggestions([students[0]], {}).length, 0, "one student is not a group");
});

test("teacher: CSV neutralises spreadsheet formulas in student-controlled text", () => {
  const rows = classSummary([seedStudent('=HYPERLINK("http://x")')]);
  const csv = toCSV(rows);
  assert.ok(
    csv.split("\n")[1].startsWith("'=HYPERLINK") || csv.split("\n")[1].startsWith("\"'=HYPERLINK"),
    csv.split("\n")[1],
  );
});

test("adapt: new tasks and untried Key Language Uses are recommended first; stretch needs independent success", () => {
  const tasks = [
    { id: "a", keyUse: "Explain", dimensions: [] },
    { id: "b", keyUse: "Argue", dimensions: [] },
  ];
  const entries = [];
  const ledger = { entries };
  for (let i = 0; i < 3; i++)
    appendEntry(ledger, {
      src: "writing",
      task: "a",
      use: "Explain",
      stage: "independent",
      kind: "first",
      m: { words: 30 },
    });
  assert.equal(recommendTasks(tasks, entries)[0].task.id, "b");
  assert.equal(showStretch(entries, "inference"), false);
  appendEntry(ledger, {
    src: "mission",
    task: "m:p1",
    stage: "independent",
    m: {
      questions: [
        { skill: "inference", ok: true },
        { skill: "inference", ok: true },
      ],
    },
  });
  assert.equal(showStretch(entries, "inference"), true);
  appendEntry(ledger, {
    src: "mission",
    task: "m:p2",
    stage: "supported",
    supports: { transcript: true },
    m: {
      questions: [
        { skill: "detail", ok: true },
        { skill: "detail", ok: true },
      ],
    },
  });
  assert.equal(showStretch(entries, "detail"), false, "supported success does not unlock stretch");
});

test("scaffolds: word parts and cognates are conservative and bilingual", () => {
  const parts = wordParts(["transport", "predictable", "cat", "runoff"]);
  assert.deepEqual(
    parts.map((p) => p.word),
    ["transport", "predictable"],
  );
  const { cognates, warnings } = bridgesFor(["analyze the evidence", "embarrassed"]);
  assert.ok(cognates.some((c) => c.es === "analizar"));
  assert.ok(warnings.some((w) => w.en === "embarrassed"));
});

test("teacher: large groups are split evenly with every name shown; stale and thin evidence is triaged", async () => {
  const { triage } = await import("../access-practice-lab/src/lang/teacher.js");
  const students = Array.from({ length: 7 }, (_, i) =>
    seedStudent(`S${i}`, { errs: { "be-agree": 2 } }),
  );
  const g = groupSuggestions(students, {}).find((x) => x.kind === "pattern");
  assert.equal(g.members.length, 7, "no member is hidden");
  assert.deepEqual(
    g.chunks.map((c) => c.length),
    [4, 3],
  );
  const rows = classSummary([seedStudent("Old", { n: 4 }), seedStudent("Thin", { n: 1 })]);
  rows[0].lastActive = "2020-01-01T00:00:00Z";
  const t = triage(rows, { now: Date.parse("2026-10-22") });
  assert.deepEqual(
    t.stale.map((r) => r.alias),
    ["Old"],
  );
  assert.deepEqual(
    t.thin.map((r) => r.alias),
    ["Thin"],
  );
});

test("teacher: one malformed student file cannot break the class summary", () => {
  const rows = classSummary([seedStudent("Fine"), { alias: "Bad", band: "6-8", ledger: null }]);
  assert.equal(rows.length, 2);
  assert.equal(rows[1].broken, true);
  assert.equal(rows[0].broken, undefined);
});

test("teacher: pattern ids from untrusted files cannot reach object prototype properties", () => {
  const students = ["A", "B"].map((a) => seedStudent(a, { errs: { constructor: 2 } }));
  assert.doesNotThrow(() => groupSuggestions(students, {}));
  assert.doesNotThrow(() => interventionsFor(classSummary(students)[0], {}));
});

test("studio: mission decisions add to the later task only on the path the learner chose", async () => {
  const {
    choiceEffects,
    loadStudio: load,
    missionState,
  } = await import("../access-practice-lab/src/lang/studio.js");
  const studio = load(() => null);
  const mission = { id: "m1" };
  const task = {
    byFlag: {
      a: {
        promptAdd: "Bring in the drain reading.",
        plannerHint: { claim: "Start with the drain." },
        revisionPrompt: "Where is the drain data?",
      },
      b: { promptAdd: "Bring in the lawn survey.", revisionPrompt: "Where is the survey?" },
    },
  };
  assert.deepEqual(choiceEffects(task, mission, studio).promptAdd, []);
  missionState(studio, "m1").flags.push("a");
  const fx = choiceEffects(task, mission, studio);
  assert.deepEqual(fx.promptAdd, ["Bring in the drain reading."]);
  assert.equal(fx.hints.claim, "Start with the drain.");
  assert.deepEqual(fx.revise, ["Where is the drain data?"]);
  assert.deepEqual(
    choiceEffects({}, mission, studio).promptAdd,
    [],
    "tasks without byFlag are unaffected",
  );
});
