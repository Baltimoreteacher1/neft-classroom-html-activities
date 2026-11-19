#!/usr/bin/env node
// Class intelligence (access-teacher/intel/): the pure aggregation (model.js) and the panel rendered in JSDOM with
// empty, partial and full class data, English and Spanish. Pins the rules of LANGUAGE-INTELLIGENCE.md on what a
// teacher reads: counts and verbatim quotes only (no score, level, percent, timer or proficiency label), one next move
// per domain, an empty state that says what to do next, and one-click assign through the existing class API.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";
import { validateSettings } from "../shared/class-platform/contract.js";

const dom = new JSDOM("<!doctype html><body></body>", {
  url: "https://lab.test/access-teacher/?task=analyze",
});
for (const k of ["window", "document", "localStorage", "location", "history"])
  globalThis[k] = dom.window[k];

const index = readFileSync(new URL("../access-practice-lab/content/index.json", import.meta.url));
const settings = { assignments: [] };
let members = [];
let down = false;
globalThis.fetch = async (url, init = {}) => {
  const u = String(url);
  if (u.includes("content/index.json")) return new Response(index);
  if (down) throw new TypeError("offline");
  if (u.includes("/roster")) return Response.json({ ok: true, settings, students: members });
  if (u.endsWith("/settings")) {
    const body = JSON.parse(init.body).settings;
    const v = validateSettings(body, "language");
    if (!v.ok) return Response.json({ ok: false, error: v.error }, { status: 400 });
    settings.assignments = body.assignments;
    return Response.json({ ok: true });
  }
  return Response.json({ ok: false }, { status: 404 });
};

const { buildInsight, DOMAINS, IDLE_DAYS } = await import("../access-teacher/intel/model.js");
const { SAMPLE_NOW } = await import("../access-teacher/intel/data.js");
const { mountClassIntelligence } = await import("../access-teacher/intel/panel.js");
const { ROSTER_KEY } = await import("../access-teacher/roster-store.js");
const { demoClass } = await import("../access-practice-lab/src/lang/teacher.js");

const NOW = Date.parse("2026-11-18T12:00:00Z");
const DAY = 864e5;
const iso = (daysAgo) => new Date(NOW - daysAgo * DAY).toISOString();

const TEXT =
  "Plants need light because they make food from sunlight. For example, the seedlings near the window grew taller, but the seedlings in the closet stayed small. This shows that light matters.";
const entry = (i, daysAgo, over = {}) => ({
  id: `e${i}-${over.use}-${daysAgo}`,
  t: iso(daysAgo),
  src: "writing",
  task: "t1",
  band: "6-8",
  domain: "Writing",
  use: "Argue",
  stage: "independent",
  kind: "first",
  supports: {},
  m: { words: 40, cites: 0 },
  ...over,
});
const result = (skill, ok, daysAgo = 2) => ({ skill, ok, supportUsed: false, date: iso(daysAgo) });
const student = (alias, extra = {}) => ({
  alias,
  band: "6-8",
  section: "P3",
  ledger: { entries: [] },
  records: {},
  studio: { writing: {}, speaking: {} },
  ...extra,
});

/** Two Argue writers who never cite, one with a quotable response; two readers who miss Inference, hit Main idea. */
const fullRoster = () => [
  student("Ana", {
    ledger: { entries: [entry(1, 3), entry(2, 2)] },
    studio: { writing: { t1: { stage: "independent", versions: [{ text: TEXT }] } }, speaking: {} },
    records: {
      r1: {
        band: "6-8",
        domain: "Reading",
        level: "A",
        results: {
          a: result("Main idea", true),
          b: result("Main idea", true),
          c: result("Main idea", true),
          d: result("Inference", false),
          e: result("Inference", false),
        },
      },
    },
  }),
  student("Ben", {
    ledger: { entries: [entry(3, 4), entry(4, 1)] },
    records: {
      r1: {
        band: "6-8",
        domain: "Reading",
        level: "A",
        results: {
          a: result("Main idea", true),
          b: result("Inference", false),
          c: result("Inference", false),
        },
      },
    },
  }),
  student("Cai", {
    ledger: { entries: [entry(5, 40, { use: "Explain", m: { words: 30, link: 2 } })] },
  }),
];

const textOf = (root) => root.textContent.replace(/\s+/g, " ");
const outsideFine = (root) => {
  const clone = root.cloneNode(true);
  for (const n of clone.querySelectorAll(".ti-fine, .ti-deeper, .ti-quote")) n.remove();
  return clone.textContent;
};
const fresh = () => {
  const root = document.createElement("div");
  document.body.append(root);
  return root;
};
const click = (root, sel) =>
  root.querySelector(sel).dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
const pick = async (root, id) => {
  const select = root.querySelector("#tiSource");
  select.value = id;
  select.dispatchEvent(new window.Event("change", { bubbles: true }));
  await tick();
};
const tick = () => new Promise((r) => setTimeout(r, 30));

test("model: empty input has four domains, no top move and no check-ins", () => {
  const r = buildInsight({ now: NOW });
  assert.equal(r.students, 0);
  assert.deepEqual(
    r.domains.map((d) => d.domain),
    [...DOMAINS],
  );
  assert.equal(r.top, null);
  assert.deepEqual(r.checkIns, []);
});

test("model: live class counts only gives counts, a nudge per domain and honest check-in reasons", () => {
  const live = [
    {
      alias: "Ana",
      summary: { domains: { speaking: 5, writing: 2 }, weekEvidence: 3, lastActivity: NOW - DAY },
    },
    {
      alias: "Ben",
      summary: {
        domains: { speaking: 1 },
        weekEvidence: 0,
        lastActivity: NOW - (IDLE_DAYS + 3) * DAY,
      },
    },
    { alias: "Cai", summary: {} },
  ];
  const r = buildInsight({ members: live, now: NOW });
  const by = Object.fromEntries(r.domains.map((d) => [d.domain, d]));
  assert.equal(r.students, 3);
  assert.equal(by.Speaking.items, 6);
  assert.equal(by.Speaking.practised, 2);
  assert.equal(by.Listening.move.kind, "start", "no practice yet is a start, not a failure");
  assert.equal(by.Writing.strength, null, "no strength without the student's own work");
  assert.equal(r.weekActive, 1);
  assert.deepEqual(
    r.checkIns.map((c) => [c.alias, c.reason.id]),
    [
      ["Cai", "quiet"],
      ["Ben", "idle"],
    ],
  );
  assert.equal(r.checkIns[1].reason.days, IDLE_DAYS + 3);
});

test("model: shared work gives a verbatim strength, a class move and a skill to re-teach", () => {
  const r = buildInsight({ roster: fullRoster(), band: "6-8", now: NOW });
  const by = Object.fromEntries(r.domains.map((d) => [d.domain, d]));
  assert.equal(by.Writing.strength.kind, "words");
  assert.ok(
    TEXT.includes(by.Writing.strength.example.quote),
    "the quote is a verbatim substring of the student's words",
  );
  assert.equal(by.Writing.strength.example.alias, "Ana");
  assert.equal(by.Writing.move.kind, "need");
  assert.equal(by.Writing.move.need, "evidence-argue");
  assert.deepEqual(by.Writing.move.members.sort(), ["Ana", "Ben"]);
  assert.equal(by.Reading.strength.skill, "Main idea");
  assert.equal(by.Reading.move.kind, "skill");
  assert.equal(by.Reading.move.skill, "Inference");
  assert.equal(r.top.move.members.length, 2);
  assert.equal(r.checkIns.find((c) => c.alias === "Cai").reason.id, "idle");
  assert.equal(
    by.Writing.own,
    5,
    "independent first tries are counted, never combined into a rate",
  );
  const json = JSON.stringify(r);
  assert.ok(
    !/percent|score|level|proficien/i.test(JSON.stringify(Object.keys(r.domains[0]))),
    "no rating fields",
  );
  assert.ok(json.length > 0);
});

test("model: the grade band filters Passport students and picks the assign band", () => {
  const roster = [...fullRoster(), student("Dee", { band: "2-3" })];
  assert.equal(buildInsight({ roster, band: "6-8", now: NOW }).students, 3);
  const early = buildInsight({ roster, band: "2-3", now: NOW });
  assert.equal(early.students, 1);
  assert.equal(early.domains[0].assign.band, "2-3");
});

test("model: the sample class has evidence and nobody looks idle", () => {
  const r = buildInsight({ roster: demoClass(), band: null, now: SAMPLE_NOW });
  assert.equal(r.students, 5);
  assert.ok(!r.checkIns.some((c) => c.reason.id === "idle"));
  assert.ok(r.domains.find((d) => d.domain === "Writing").items > 0);
});

test("panel, empty: says what to do next, then opens a labelled sample class", async () => {
  localStorage.clear();
  const root = fresh();
  await mountClassIntelligence(root, { band: "6-8" });
  assert.match(textOf(root), /Start with one of these/);
  for (const href of ["#liveClass", "#classEvidence"])
    assert.ok(root.querySelector(`a[href="${href}"]`));
  click(root, '[data-ti="sample"]');
  await tick();
  assert.match(textOf(root), /Sample class\. These are made-up students\./);
  assert.equal(root.querySelectorAll(".ti-card").length, 4);
  assert.ok(root.querySelector(".ti-hero"), "one move to start with");
  assert.ok(root.querySelector("a[data-open], [data-assign]"), "and one way to act on it");
  assert.equal(
    root.querySelector('[role="status"][aria-live="polite"]').textContent.includes("5 students"),
    true,
  );
  click(root, '[data-ti="leave-sample"]');
  await tick();
  assert.match(textOf(root), /Start with one of these/);
});

test("panel, partial: one student with little evidence still renders four useful cards", async () => {
  localStorage.setItem(
    ROSTER_KEY,
    JSON.stringify([student("Ana", { ledger: { entries: [entry(1, 1)] } })]),
  );
  const root = fresh();
  await mountClassIntelligence(root, { band: "6-8" });
  assert.equal(root.querySelectorAll(".ti-card").length, 4);
  assert.match(textOf(root), /A strength appears here once a student shares their own work/);
  const wrongBand = fresh();
  await mountClassIntelligence(wrongBand, { band: "K", onBand: () => {} });
  assert.match(
    textOf(wrongBand),
    /No students in this grade band yet\. Students shared here are in: 6-8/,
  );
  assert.ok(
    wrongBand.querySelector('[data-ti-band="6-8"]'),
    "a button switches to the band that has students",
  );
});

test("panel, full: quotes, plain wording, no rating words, Spanish, one-click assign", async () => {
  localStorage.setItem(ROSTER_KEY, JSON.stringify(fullRoster()));
  localStorage.setItem(
    "accessPracticeLabClass:v1:teacher-classes",
    JSON.stringify([{ code: "ABCD12", passcode: "pass-1", title: "Period 3" }]),
  );
  members = [
    {
      studentId: "s1",
      alias: "Ana",
      lastSeen: 1,
      docs: { language: { summary: { domains: { writing: 2, reading: 5 }, weekEvidence: 4 } } },
    },
    {
      studentId: "s2",
      alias: "Ben",
      lastSeen: 1,
      docs: { language: { summary: { domains: { writing: 2, reading: 3 }, weekEvidence: 2 } } },
    },
  ];
  const root = fresh();
  await mountClassIntelligence(root, { band: "6-8" });
  await pick(root, "live:ABCD12");
  const quote = root.querySelector(".ti-quote p").textContent.replace(/[“”]/g, "");
  assert.ok(TEXT.includes(quote), "the quote shown is verbatim");
  const plain = outsideFine(root);
  assert.ok(
    !/%|\btimer\b|proficien|\bscore|\blevel/i.test(plain),
    `no rating words: ${plain.slice(0, 200)}`,
  );
  assert.equal(root.querySelectorAll(".ti-card").length, 4);
  for (const b of root.querySelectorAll("button, a.btn, select"))
    assert.ok(b.textContent.trim() || b.getAttribute("aria-label") || b.id);

  const before = settings.assignments.length;
  const target = root.querySelector("[data-assign]");
  assert.ok(target, "a live class shows an assign button");
  target.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  await tick();
  await tick();
  assert.equal(
    settings.assignments.length,
    before + 2,
    "two activities added through the class API",
  );
  assert.match(textOf(root), /Added to Period 3/);

  click(root, '[data-ti-lang="es"]');
  await tick();
  assert.equal(root.lang, "es");
  assert.match(textOf(root), /Inteligencia de la clase/);
  assert.ok(
    !/Teach this next|Check in with/.test(textOf(root)),
    "no English chrome on the Spanish screen",
  );
  click(root, '[data-ti-lang="en"]');
  await tick();
});

test("panel: a class that cannot be reached still shows what is on this device, and says so", async () => {
  localStorage.setItem(ROSTER_KEY, JSON.stringify(fullRoster()));
  localStorage.setItem(
    "accessPracticeLabClass:v1:teacher-classes",
    JSON.stringify([{ code: "ZZZZ99", passcode: "pass-2", title: "Period 5" }]),
  );
  down = true;
  const root = fresh();
  await mountClassIntelligence(root, { band: "6-8" });
  await pick(root, "live:ZZZZ99");
  down = false;
  assert.match(textOf(root), /Could not reach the class right now/);
  assert.equal(root.querySelectorAll(".ti-card").length, 4);
});
