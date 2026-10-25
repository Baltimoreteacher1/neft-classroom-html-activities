#!/usr/bin/env node
// Teacher insights and station cards (src/lang/teacher.js):
//  * conference groups come only from imported first attempts, need 2+ students who each missed the same
//    observable target 2+ times, carry a 10-minute script, and launch links hold a task id + band only;
//  * the supported-vs-independent gap rule (untested / gap) and its thresholds;
//  * the SYNTHETIC DEMO class is labelled everywhere and never reads as a real learner;
//  * station cards: content from the source files, one renderer shared by the Launch Studio and
//    tools/generate-access-studio-printables.mjs (the generated sheet must equal the page's sheet).
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const CONTENT = join(ROOT, "access-practice-lab", "content");
const readJson = (rel) => JSON.parse(readFileSync(join(CONTENT, rel), "utf8"));

const {
  CONFERENCE_NEEDS,
  DEMO_LABEL,
  QR_NOTE,
  conferencePlans,
  demoClass,
  needEvidence,
  stationCard,
  stationCardHTML,
  stationOptions,
  supportGaps,
} = await import("../access-practice-lab/src/lang/teacher.js");
const { SCORE_CLAIM } = await import("./lib/access-studio-rules.mjs");

const speaking = readJson("studio/speaking.json").tasks;
const writing = readJson("studio/writing.json").tasks;
const exemplars = [
  ...readJson("studio/exemplars-speaking.json").exemplars,
  ...readJson("studio/exemplars-writing.json").exemplars,
];
const tasks = [
  ...speaking.map((t) => ({ ...t, modality: "speaking" })),
  ...writing.map((t) => ({ ...t, modality: "writing" })),
];
const data = {
  band: "6-8",
  worlds: readJson("worlds.json").worlds,
  speaking,
  writing,
  exemplars,
  standards: readJson("blueprints.json").standards,
};

let seq = 0;
const entry = (use, stage, m = {}, extra = {}) => ({
  id: `e${++seq}`,
  t: `2026-02-${String((seq % 27) + 1).padStart(2, "0")}T10:00:00.000Z`,
  src: "writing",
  task: `task-${seq}`,
  band: "6-8",
  use,
  stage,
  kind: "first",
  supports: stage === "independent" ? {} : { bank: true },
  m: { words: 50, link: 2, cites: 1, complex: 1, academic: 2, errs: {}, moves: {}, ...m },
  ...extra,
});
const student = (alias, entries, band = "6-8") => ({
  alias,
  section: "P1",
  band,
  ledger: { entries },
  studio: {},
  records: {},
});

test("needs are observable, one per Key Language Use, each with a 10-minute script", () => {
  assert.deepEqual(CONFERENCE_NEEDS.map((n) => n.use).sort(), [
    "Argue",
    "Explain",
    "Inform",
    "Narrate",
  ]);
  for (const n of CONFERENCE_NEEDS) {
    assert.equal(
      n.script.reduce((a, s) => a + s.minutes, 0),
      10,
      n.id,
    );
    assert.ok(
      !SCORE_CLAIM.test(`${n.label} ${n.target} ${n.script.map((s) => s.say).join(" ")}`),
      n.id,
    );
  }
});

test("grouping: 2+ students who each missed the same target 2+ times; one miss is not a group", () => {
  const cls = [
    student("Ana", [
      entry("Explain", "supported", { link: 1 }),
      entry("Explain", "independent", { link: 0 }),
    ]),
    student("Bo", [
      entry("Explain", "independent", { link: 1 }),
      entry("Explain", "supported", { link: 1 }),
      entry("Explain", "supported", { link: 3 }),
    ]),
    student("Cy", [
      entry("Explain", "independent", { link: 1 }),
      entry("Explain", "independent", { link: 2 }),
    ]), // only one miss
    student("Di", [
      entry("Narrate", "independent", { errs: { "past-marker": 1 } }),
      entry("Narrate", "supported", { errs: { "irregular-ed": 2 } }),
    ]),
  ];
  const plans = conferencePlans(cls, tasks);
  assert.equal(plans.length, 1, "Narrate has one student, so no group");
  const [p] = plans;
  assert.equal(p.label, "Discourse cohesion in Explain");
  assert.deepEqual(
    p.members.map((m) => m.alias),
    ["Ana", "Bo"],
  );
  assert.match(p.members[1].why, /^2 of 3 Explain first attempts/);
  assert.equal(p.minutes, 10);
  assert.ok(
    p.launches.length >= 2 &&
      p.launches.every((l) => tasks.some((t) => t.id === l.id && t.keyUse === "Explain")),
  );
  assert.ok(
    new Set(p.launches.map((l) => l.modality)).size === 2,
    "both writing and speaking tasks offered",
  );
  for (const l of p.launches) {
    const u = new URL(l.url, "https://x.test");
    assert.match(u.pathname, /^\/access-practice-lab\/(speak|write)\/[a-z0-9-]+$/);
    assert.deepEqual(
      [...u.searchParams.keys()],
      ["grades"],
      "launch URL carries the band only, no learner data",
    );
    for (const m of cls) assert.ok(!l.url.includes(m.alias));
  }
});

test("grouping ignores revisions, non-matching uses, unmeasured entries, other bands and broken files", () => {
  const cls = [
    student("Rev", [
      entry("Argue", "supported", { cites: 0 }, { kind: "revision" }),
      entry("Argue", "supported", { cites: 0 }, { kind: "revision" }),
    ]),
    student("Other", [
      entry("Inform", "supported", { cites: 0 }),
      entry("Inform", "supported", { cites: 0 }),
    ]),
    student("NoMeasure", [
      entry("Argue", "supported", { cites: undefined }),
      entry("Argue", "supported", { cites: undefined }),
    ]),
    student(
      "Y35",
      [entry("Argue", "supported", { cites: 0 }), entry("Argue", "supported", { cites: 0 })],
      "3-5",
    ),
    student("Y68", [
      entry("Argue", "supported", { cites: 0 }),
      entry("Argue", "supported", { cites: 0 }),
    ]),
    { alias: "Broken", ledger: null },
  ];
  assert.deepEqual(conferencePlans(cls, tasks), []);
  assert.equal(conferencePlans([], tasks).length, 0, "no codes → no plans");
});

test("tense need reads the past-marker / irregular-ed detectors only", () => {
  const tense = CONFERENCE_NEEDS.find((n) => n.id === "tense-narrate");
  const s = student("T", [
    entry("Narrate", "supported", { errs: { "article-a-an": 3 } }),
    entry("Narrate", "supported", { errs: { "irregular-ed": 1 } }),
  ]);
  assert.deepEqual(needEvidence(s, tense), {
    supported: { n: 2, met: 1 },
    independent: { n: 0, met: 0 },
    notMet: 1,
    total: 2,
  });
});

test("gap analysis: untested and gap statuses with stated thresholds", () => {
  const cls = [
    // meets with supports 2/2, no independent → untested
    student("U", [
      entry("Argue", "supported", { cites: 2 }),
      entry("Argue", "guided", { cites: 1 }),
    ]),
    // meets with supports 3/3, on own 1/3 → gap (1/3 ≤ 1 − 1/3)
    student("G", [
      entry("Argue", "supported"),
      entry("Argue", "supported"),
      entry("Argue", "supported"),
      entry("Argue", "independent"),
      entry("Argue", "independent", { cites: 0 }),
      entry("Argue", "independent", { cites: 0 }),
    ]),
    // meets with supports 2/2, on own 1/2 → gap (0.5 ≤ 1 − 1/3)
    student("H", [
      entry("Argue", "supported"),
      entry("Argue", "supported"),
      entry("Argue", "independent"),
      entry("Argue", "independent", { cites: 0 }),
    ]),
    // on own as well as with supports → nothing to flag
    student("OK", [
      entry("Argue", "supported"),
      entry("Argue", "supported"),
      entry("Argue", "independent"),
      entry("Argue", "independent"),
    ]),
    // weak with supports (1/3) → not a supported success, not flagged
    student("W", [
      entry("Argue", "supported", { cites: 0 }),
      entry("Argue", "supported", { cites: 0 }),
      entry("Argue", "supported"),
    ]),
    // only one supported attempt → not enough to call it a success
    student("One", [entry("Argue", "supported")]),
  ];
  const gaps = supportGaps(cls, tasks);
  const by = Object.fromEntries(gaps.map((g) => [g.alias, g]));
  assert.deepEqual(Object.keys(by).sort(), ["G", "H", "U"]);
  assert.equal(by.U.status, "untested");
  assert.equal(by.G.status, "gap");
  assert.deepEqual(
    [by.G.supported, by.G.independent],
    [
      { n: 3, met: 3 },
      { n: 3, met: 1 },
    ],
  );
  assert.match(by.U.next, /On my own/);
  assert.ok(
    by.U.launch && new URL(by.U.launch.url, "https://x.test").searchParams.get("grades") === "6-8",
  );
  for (const g of gaps) assert.ok(!SCORE_CLAIM.test(`${g.why} ${g.next}`));
});

test("SYNTHETIC DEMO class is labelled on every student and produces plans and gaps", () => {
  const demo = demoClass();
  assert.ok(demo.length >= 4);
  for (const s of demo) {
    assert.ok(s.alias.startsWith(DEMO_LABEL), s.alias);
    assert.equal(s.section, DEMO_LABEL);
    assert.equal(s.demo, true);
  }
  assert.equal(DEMO_LABEL, "SYNTHETIC DEMO");
  const plans = conferencePlans(demo, tasks);
  assert.deepEqual(plans.map((p) => p.need).sort(), [
    "cohesion-explain",
    "evidence-argue",
    "tense-narrate",
  ]);
  for (const p of plans) for (const m of p.members) assert.ok(m.alias.startsWith(DEMO_LABEL));
  assert.ok(supportGaps(demo, tasks).length >= 2);
  assert.deepEqual(demoClass(), demo, "deterministic");
});

test("evidence.js keeps the demo in memory, labels it, and shows an empty state with no codes", () => {
  const src = readFileSync(join(ROOT, "access-teacher", "evidence.js"), "utf8");
  assert.match(src, /Load sample demo class \(\$\{DEMO_LABEL\} DATA\)/);
  assert.match(src, /Small-group conference plans\$\{demo \? ` — \$\{DEMO_LABEL\} DATA` : ""\}/);
  assert.match(src, /No student codes are loaded/);
  const slim = src.slice(src.indexOf("const slim"), src.indexOf("const sizeChars"));
  assert.ok(!/demo/i.test(slim), "the demo is never persisted with the roster");
});

test("station options cover every world and the band's studio tasks", () => {
  const opts = stationOptions(data);
  assert.equal(opts.filter((o) => o.kind === "world").length, data.worlds.length);
  assert.equal(
    opts.filter((o) => o.kind === "studio").length,
    tasks.filter((t) => t.band === "6-8").length,
  );
});

test("studio station card: standard, KLU, look-fors, probes and early/building/strong exemplars from source", () => {
  for (const t of writing.filter((x) => x.band === "6-8")) {
    const c = stationCard({ kind: "studio", id: t.id }, data);
    assert.equal(c.path, `/access-practice-lab/write/${t.id}?grades=6-8`);
    assert.deepEqual(
      c.standards.map((s) => s.code),
      t.standards,
    );
    assert.ok(c.standards.every((s) => s.name.startsWith("Language for")));
    assert.deepEqual(c.keyUses, [t.keyUse]);
    assert.deepEqual(c.lookFors, t.teacher.lookFor);
    assert.deepEqual(
      c.probes,
      t.revisionPrompts.slice(0, 3).map((p) => p.prompt),
    );
    assert.deepEqual(
      c.exemplars.map((x) => x.band),
      ["early", "building", "strong"],
    );
    for (const x of c.exemplars)
      assert.equal(
        x.response,
        exemplars.find((e) => e.taskId === t.id && e.practiceBand === x.band).response,
      );
  }
  const sp = speaking.find((x) => x.band === "6-8");
  const c = stationCard({ kind: "studio", id: sp.id }, data);
  assert.equal(c.path, `/access-practice-lab/speak/${sp.id}?grades=6-8`);
  assert.equal(c.probes[0], sp.teacher.followUp);
  assert.deepEqual(c.lookFors, sp.teacher.listenFor);
});

test("world and activity cards say plainly what is not authored instead of inventing it", () => {
  const w = stationCard({ kind: "world", id: "storyworks" }, data);
  assert.equal(w.path, "/access-practice-lab/worlds/storyworks?grades=6-8");
  assert.deepEqual(w.exemplars, []);
  assert.match(w.exemplarNote, /No early \/ building \/ strong exemplars/);
  assert.ok(w.probes.length >= 1);
  const d = readJson("g6-8/Speaking.json");
  const a = d.levels.A.activities[0];
  const card = stationCard(
    { kind: "activity", id: a.id, mode: "independent" },
    { ...data, activity: { domain: "Speaking", level: "A", activity: a } },
  );
  assert.equal(card.path, `/access-practice-lab/Speaking/A/${a.id}?grades=6-8&mode=independent`);
  assert.deepEqual(card.exemplars, []);
  assert.equal(stationCard({ kind: "studio", id: "nope" }, data), null);
  assert.equal(stationCard({ kind: "activity", id: a.id }, { ...data, activity: null }), null);
});

test("station HTML: escaped, full URL printed, QR gap stated, no score claims", () => {
  const c = stationCard({ kind: "studio", id: "wrt-mulch-cer" }, data);
  const out = stationCardHTML(c, "https://eduwonderlab.com");
  assert.ok(
    out.includes("https://eduwonderlab.com/access-practice-lab/write/wrt-mulch-cer?grades=6-8"),
  );
  assert.ok(out.includes(QR_NOTE));
  for (const h of [
    "Look-fors",
    "Oral probing questions",
    "Answer key · exemplar responses (practice bands)",
    "Early",
    "Building",
    "Strong",
    "ELD-SC",
  ])
    assert.ok(out.includes(h), h);
  assert.ok(!SCORE_CLAIM.test(out.replace(/<[^>]+>/g, " ")));
  const evil = stationCardHTML({ ...c, title: '<img src=x onerror="alert(1)">' });
  assert.ok(!evil.includes("<img") && evil.includes("&lt;img"));
});

test("the generated printable holds exactly the cards the Launch Studio renders (no drift)", () => {
  const dir = mkdtempSync(join(tmpdir(), "station-"));
  try {
    const only =
      "studio:wrt-mulch-cer,studio:spk-seedlings-retell,world:signal-station,activity:speak-one-sentence";
    execFileSync(
      process.execPath,
      [
        join(ROOT, "tools", "generate-access-studio-printables.mjs"),
        `--only=${only}`,
        join(dir, "s"),
        join(dir, "t"),
      ],
      { stdio: "pipe" },
    );
    const page = readFileSync(join(dir, "t", "station-cards.html"), "utf8");
    const d = readJson("g6-8/Speaking.json");
    let found = null;
    for (const [level, L] of Object.entries(d.levels)) {
      const act = L.activities.find((x) => x.id === "speak-one-sentence");
      if (act) found = { domain: "Speaking", level, activity: act };
    }
    for (const sel of only.split(",")) {
      const [kind, id] = sel.split(":");
      const html = stationCardHTML(
        stationCard({ kind, id }, { ...data, activity: kind === "activity" ? found : null }),
        "https://eduwonderlab.com",
      );
      assert.ok(html.length > 500);
      assert.ok(
        page.includes(html),
        `${sel} differs between the page renderer and the generated printable`,
      );
    }
    assert.match(page, /<meta name="robots" content="noindex">/);
    assert.match(page, /@page\{size:letter/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
