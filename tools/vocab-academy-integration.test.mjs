// Vocabulary Academy — integration surfaces. Run: node --test tools/vocab-academy-integration.test.mjs
// Family view and projection (whitelist, leak-free, labels), Resource Studio sheets (key kept apart), Lesson Planner steps,
// progress digest honesty, offline pack URLs, home resume, and the shared registries (K–8 wording, custom-unit routes).
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

const mem = new Map();
globalThis.localStorage = new Proxy(
  {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => void mem.set(k, String(v)),
    removeItem: (k) => void mem.delete(k),
  },
  {
    get: (t, k) => (k in t ? t[k] : mem.get(k)),
    ownKeys: () => [...mem.keys()],
    getOwnPropertyDescriptor: (t, k) =>
      mem.has(k) ? { value: mem.get(k), enumerable: true, configurable: true } : undefined,
    has: (t, k) => k in t || mem.has(k),
  },
);

const ROOT = new URL("../", import.meta.url);
const LAB = new URL("access-practice-lab/src/", ROOT);
const fam = await import(new URL("vocab-academy/integrations/family-project.js", LAB));
const famView = await import(new URL("vocab-academy/integrations/family-view.js", LAB));
const rs = await import(new URL("vocab-academy/integrations/resource-studio.js", LAB));
const planner = await import(new URL("vocab-academy/integrations/planner.js", LAB));
const progressInt = await import(new URL("vocab-academy/integrations/progress.js", LAB));
const offline = await import(new URL("vocab-academy/integrations/offline.js", LAB));
const home = await import(new URL("vocab-academy/integrations/home.js", LAB));
const data = await import(new URL("vocab-academy/data.js", LAB));
const router = await import(new URL("vocab-academy/router.js", LAB));
const contract = await import(new URL("vocab-academy/contract.js", LAB));
const { findLeaks } = await import(new URL("vocab-academy/print/render.js", LAB));
const { toHtml } = await import(new URL("util.js", LAB));

const reference = JSON.parse(
  readFileSync(new URL("docs/vocab-academy/reference-unit.json", ROOT), "utf8"),
);
const I = { T: (en, es) => `${en} / ${es}`, S: (en) => en };
const CONTENT = "/access-practice-lab/content/vocab-academy/";
const serve = (url) => {
  const rel = String(url).split("?")[0];
  const file = new URL(`access-practice-lab${rel.replace("/access-practice-lab", "")}`, ROOT);
  if (!rel.startsWith(CONTENT) || !existsSync(file))
    return { ok: false, status: 404, json: async () => null };
  return {
    ok: true,
    status: 200,
    headers: new Map([["content-type", "application/json"]]),
    json: async () => JSON.parse(readFileSync(file, "utf8")),
  };
};
data.configureData({ fetchImpl: async (url) => serve(url) });

test("family projection is a whitelist and carries no teacher or answer text", () => {
  const view = fam.familyUnit(reference);
  const talk = fam.talkAboutIt(reference);
  const text = JSON.stringify({ view, talk });
  assert.deepEqual(findLeaks(reference, text), []);
  assert.deepEqual(Object.keys(view).sort(), [
    "grade",
    "id",
    "n",
    "objectives",
    "theme",
    "title",
    "words",
  ]);
  for (const w of view.words) {
    assert.ok(!("misuse" in w) && !("cloze" in w) && !("src" in w) && !("note" in w));
  }
});

test("talk prompts are 3 to 5, bilingual, stable, and built from student-facing fields", () => {
  const a = fam.talkAboutIt(reference);
  assert.ok(a.length >= 3 && a.length <= 5, `${a.length}`);
  assert.deepEqual(a, fam.talkAboutIt(reference));
  for (const t of a) assert.ok(t.en && t.es);
});

test("the family label is honest and an assignment names only the teacher's title", () => {
  assert.match(fam.FAMILY_LABEL.optional.en, /not assigned by your teacher/i);
  assert.match(fam.FAMILY_LABEL.assigned.en, /Assigned by your teacher/);
  const list = [
    { id: "x", title: "Unit 1 words", path: "vocabulary-academy/grade/6/lesson/1?grades=6-8" },
    { id: "y", title: "Other", path: "vocabulary-academy/grade/6/lesson/2" },
  ];
  assert.deepEqual(fam.assignedUnit(list, "6", 1), { title: "Unit 1 words" });
  assert.equal(fam.assignedUnit(list, "6", 3), null);
  assert.equal(fam.assignedUnit(null, "6", 1), null);
  assert.equal(fam.gradeForBand("6-8"), "6");
});

test("the family view renders a real unit, labels it optional, and leaks nothing", async () => {
  const unit = JSON.parse(
    readFileSync(new URL("access-practice-lab/content/vocab-academy/g4/u01.json", ROOT), "utf8"),
  );
  const va = (q) => ({ I, route: { path: ["family"], q }, progress: { last: null }, params: {} });
  const out = await famView.render({ band: "3-5" }, va({ grade: "4", unit: "1" }));
  const markup = toHtml(out.html);
  assert.match(markup, /Optional home practice/);
  assert.doesNotMatch(markup, /Assigned by your teacher/);
  for (const w of unit.words)
    assert.ok(markup.includes(`>${w.hw}<`) || markup.includes(w.hw), w.hw);
  assert.deepEqual(findLeaks(unit, markup), []);
  assert.match(markup, /vocabulary-academy\/print\/4\/1\/words/);
  const assigned = toHtml(
    (await famView.render({ band: "3-5" }, va({ grade: "4", unit: "1", assigned: "1" }))).html,
  );
  assert.match(assigned, /Assigned by your teacher/);
  const none = toHtml((await famView.render({ band: "" }, va({}))).html);
  assert.match(none, /Choose your child/);
  const missing = toHtml((await famView.render({ band: "" }, va({ grade: "8", unit: "99" }))).html);
  assert.match(missing, /still being written/);
});

test("pickUnit prefers the query, then the last unit, then the band", () => {
  assert.deepEqual(famView.pickUnit({ q: { grade: "5", unit: "2" } }), { grade: "5", n: 2 });
  assert.deepEqual(famView.pickUnit({ progress: { last: { unit: "g3-u04" } } }), {
    grade: "3",
    n: 4,
  });
  assert.deepEqual(famView.pickUnit({ band: "K" }), { grade: "K", n: 1 });
  assert.deepEqual(famView.pickUnit({ q: { grade: "11", unit: "1" } }), { grade: "", n: 0 });
});

test("Resource Studio sheets keep the answer key apart from the student markup", () => {
  for (const kind of ["exit", "reading", "writing", "differentiated"]) {
    const sheet = rs.resourceSheet(kind, reference);
    if (!sheet) continue;
    const student = toHtml(rs.resourceHTML(sheet, { unit: reference, withKey: false }));
    for (const k of sheet.key || [])
      assert.ok(
        !student.includes(k) || sheet.sections.some((s) => JSON.stringify(s).includes(k)),
        `${kind} key leaked`,
      );
    assert.deepEqual(findLeaks(reference, student), [], kind);
  }
  assert.equal(rs.RESOURCE_KINDS.length, 6);
  assert.match(rs.printHref(reference, "workbook"), /vocabulary-academy\/print\/6\/1\/workbook$/);
});

test("Lesson Planner steps are labelled links added once to a phase or a day", () => {
  const step = planner.planStep(reference, "b");
  assert.ok(step?.href.includes("vocabulary-academy/grade/6/lesson/1/b"));
  const lesson = { phases: [{ key: "launch", teacher: "Say hello." }] };
  assert.deepEqual(planner.addStepToPhase(lesson, "launch", step, { origin: "https://x.test" }), {
    ok: true,
    added: true,
  });
  assert.deepEqual(planner.addStepToPhase(lesson, "launch", step, { origin: "https://x.test" }), {
    ok: true,
    added: false,
  });
  assert.equal(planner.addStepToPhase(lesson, "nope", step).ok, false);
  const week = { days: [{}, {}] };
  assert.equal(planner.addStepToDay(week, 1, step).added, true);
  assert.equal(planner.addStepToDay(week, 1, step).added, false);
  assert.equal(planner.addStepToDay(week, 9, step).ok, false);
});

test("the progress digest counts words, never scores, and the share shape is closed", () => {
  const d = progressInt.progressDigest({
    words: {
      total: 12,
      byState: { secure: 3, applying: 4, learning: 2, developing: 1, "review-needed": 2 },
    },
    units: { started: 2, completed: 1 },
    due: 5,
    lastActive: "2026-11-20T10:00:00.000Z",
  });
  assert.deepEqual(Object.keys(d).sort(), [
    "applying",
    "due",
    "growing",
    "lastActive",
    "review",
    "secure",
    "seen",
    "started",
    "unitsCompleted",
    "unitsStarted",
  ]);
  assert.equal(d.growing, 3);
  assert.ok(!JSON.stringify(d).match(/percent|score|level|wida|access/i));
  assert.deepEqual(Object.keys(progressInt.shareDigest(d)).sort(), [
    "applying",
    "growing",
    "lastActive",
    "review",
    "secure",
    "unitsCompleted",
  ]);
  assert.equal(progressInt.cleanShareDigest("junk"), null);
  assert.equal(progressInt.cleanShareDigest([1]), null);
  assert.equal(progressInt.loadDigest(), null);
});

test("offline packs name one unit or one grade and always include the index", () => {
  assert.equal(offline.unitPackName("K", 3), "va-gk-u03");
  assert.equal(offline.gradePackName("6"), "va-g6-all");
  assert.ok(offline.unitPackUrls("6", 1).includes(`${contract.CONTENT_BASE}/g6/u01.json`));
  const g = offline.gradePackUrls("2", [1, 2]);
  assert.ok(g[0].endsWith("/g2/grade.json") && g.at(-1).endsWith("/index.json") && g.length === 4);
});

test("home resume points into the lesson, or the unit once the lesson is done, or the front door", () => {
  const rec = (extra) => JSON.stringify({ v: 1, units: {}, ...extra });
  const read = (v) => (k) => (k === contract.VA_KEY ? v : null);
  assert.equal(home.vocabAcademyResume(read(null)), null);
  assert.equal(home.vocabAcademyResume(read("not json")), null);
  const open = home.vocabAcademyResume(
    read(rec({ last: { unit: "g6-u03", lesson: "c", at: "2026-11-20T10:00:00.000Z" } })),
  );
  assert.match(open.path, /grade\/6\/lesson\/3\/c$/);
  const done = home.vocabAcademyResume(
    read(
      rec({
        last: { unit: "g6-u03", lesson: "c" },
        units: { "g6-u03": { lessons: { c: { done: true } } } },
      }),
    ),
  );
  assert.match(done.path, /grade\/6\/lesson\/3$/);
  assert.equal(
    home.vocabAcademyResume(read(rec({ lastActive: "2026-11-20T10:00:00.000Z" }))).id,
    "start",
  );
});

test("shared registries say Kindergarten to Grade 8 and the Academy is reachable", () => {
  const registry = readFileSync(new URL("home-registry.js", LAB), "utf8");
  const card = registry.slice(
    registry.indexOf('id: "vocabulary-academy"'),
    registry.indexOf('id: "subject-reading"'),
  );
  assert.match(card, /grade 8/);
  assert.doesNotMatch(card, /grade 12|12\.º/);
  const sitemap = readFileSync(new URL("sitemap.js", LAB), "utf8");
  assert.match(sitemap, /vocabulary-academy/);
  assert.doesNotMatch(
    sitemap.slice(
      sitemap.indexOf('id: "vocabulary-academy"'),
      sitemap.indexOf('id: "vocabulary-academy"') + 900,
    ),
    /grade 12|K.12|9.12/,
  );
});

test("custom units travel as cu_<slug> in the grade, present and print routes", async () => {
  const unit = router.resolve(["grade", "6", "lesson", "cu_reading-a1b2", "c"]);
  assert.equal(unit.name, "lesson");
  assert.deepEqual(unit.params, { grade: "6", n: "cu.reading-a1b2", letter: "c" });
  assert.equal(router.resolve(["present", "6", "cu_reading-a1b2"]).params.n, "cu.reading-a1b2");
  assert.equal(router.resolve(["grade", "6", "lesson", "7"]).params.n, 7);
  assert.equal(router.resolve(["grade", "6", "lesson", "cu_bad slug"]).name, "notfound");
  assert.equal(contract.unitId("6", "cu.reading-a1b2"), "cu.reading-a1b2");
  assert.equal(contract.unitId("6", 3), "g6-u03");
  assert.equal(data.parseUnitId("cu.reading-a1b2").custom, true);
  assert.equal(data.parseUnitId("g6-u01").grade, "6");
  assert.equal(await data.getUnit("cu.not-saved"), null);
});
