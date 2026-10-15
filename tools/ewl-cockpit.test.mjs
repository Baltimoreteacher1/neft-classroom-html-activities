// Curriculum 2.0 cockpit: Today's Mission, the Check Yourself router and the Pocket Reference.
//   node tools/ewl-cockpit.test.mjs            run the tests
//   node tools/ewl-cockpit.test.mjs --write    rebuild data/ewl/pocket-reference.json from the lessons' own vocabulary, then test
//
// The data builder and validators live in tools/lib/ewl-cockpit-data.mjs (reusable by a build gate); the jsdom tests in
// tools/lib/ewl-cockpit-dom.mjs.
import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import vm from "node:vm";
import {
  buildReference,
  CHECK_PATH,
  EWL_CORE,
  MANIFEST,
  norm,
  REF_PATH,
  readJson,
  referenceContext,
  rel,
  taught,
  validateCheckConfig,
  validateReference,
  workbenchPresets,
} from "./lib/ewl-cockpit-data.mjs";
import { domTests } from "./lib/ewl-cockpit-dom.mjs";
import { loadEwl } from "./lib/ewl-vm.mjs";
import { loadStudio } from "./lib/studio-vm.mjs";

// objects built inside node:vm contexts have another realm's prototypes; compare them as plain JSON
const plain = (x) => JSON.parse(JSON.stringify(x));
const deq = (a, b, m) => assert.deepStrictEqual(plain(a), plain(b), m);
const ndeq = (a, b, m) => assert.notDeepStrictEqual(plain(a), plain(b), m);
async function runTests() {
  const ctx = loadEwl({ only: EWL_CORE });
  const { EWL } = ctx;
  const C = EWL.Cockpit;
  const R = EWL.Reference;
  const memStore = () =>
    EWL.Store.create({
      storage: { getItem: () => null, setItem() {}, removeItem() {} },
      now: () => 1,
    });

  /* ---- lesson switcher data: exactly the taught lessons, no Unit 10 ---- */
  const lessons = C.taughtLessons(MANIFEST);
  assert.equal(lessons.length, MANIFEST.lessons.filter((l) => l.unit <= 9).length);
  assert.ok(
    lessons.every((l) => l.unit >= 1 && l.unit <= 9 && !l.id.startsWith("10-")),
    "Unit 10 leaked",
  );
  deq(lessons.map((l) => l.id).sort(), taught.map((l) => l.id).sort());
  assert.equal(
    C.taughtLessons({ lessons: [{ id: "10-1", unit: 10, lesson: 1, resources: {} }] }).length,
    0,
  );
  assert.equal(
    C.taughtLessons({ lessons: [{ id: "3-1", unit: 4, lesson: 1, resources: {} }] }).length,
    0,
    "id/unit mismatch refused",
  );
  assert.equal(C.unitsOf(lessons).length, 9);

  /* ---- default lesson: stored > pacing plan > first ---- */
  const plan = {
    days: [
      ["2026-10-14", 3, "Core Lesson", "3-4", null],
      ["2026-10-15", 3, "Review", null, "Review"],
      ["2026-10-16", 3, "Core Lesson", "3-5-catchup", null],
      ["2026-10-19", 3, "Core Lesson", "10-2", null],
    ],
  };
  assert.equal(C.pacingLesson(plan, "2026-10-15"), "3-5");
  assert.equal(C.pacingLesson(plan, "2026-10-14"), "3-4");
  assert.equal(C.pacingLesson(plan, "2027-01-01"), null);
  assert.equal(C.defaultLesson({ lessons, stored: null, plan, today: "2026-10-15" }), "3-5");
  assert.equal(C.defaultLesson({ lessons, stored: "6-2", plan, today: "2026-10-15" }), "6-2");
  assert.equal(
    C.defaultLesson({ lessons, stored: "10-1", plan, today: "2026-10-15" }),
    "3-5",
    "stored Unit 10 ignored",
  );
  assert.equal(
    C.defaultLesson({
      lessons,
      stored: null,
      plan: { days: [["2026-10-19", 10, "Core Lesson", "10-2", null]] },
      today: "2026-10-15",
    }),
    lessons[0].id,
    "paced Unit 10 ignored",
  );

  /* ---- stage state machine ---- */
  const s = memStore();
  deq(
    C.stageStates(s, "3-1", "curious").map((x) => x.done),
    [false, false, false, false],
  );
  s.markStage("3-1", "notes");
  s.markStage("3-1", "notes");
  const st = C.stageStates(s, "3-1", "notes");
  deq(
    st.map((x) => x.done),
    [false, true, false, false],
  );
  assert.equal(st.filter((x) => x.current).length, 1);
  assert.throws(
    () => s.markStage("3-1", "bogus"),
    (e) => e.name === "RangeError",
  );
  assert.throws(
    () => s.markStage("../x", "lab"),
    (e) => e.name === "RangeError",
  );
  deq(C.STAGES, ["curious", "notes", "lab", "check"]);

  /* ---- stage links: every taught lesson resolves to files that exist ---- */
  for (const l of lessons) {
    const L = C.stageLinks(l, null);
    for (const stage of C.STAGES) assert.ok(L[stage].length >= 1, `${l.id} ${stage} has no link`);
    for (const stage of ["curious", "notes", "lab", "check"])
      for (const k of L[stage]) {
        assert.ok(/^\/[^/]/.test(k.href) && k.href.includes("student=1"), `${l.id} link ${k.href}`);
        const path = k.href.split(/[?#]/)[0];
        const target = rel(path.endsWith("/") ? `${path}index.html` : path);
        assert.ok(existsSync(target), `${l.id} ${stage} link ${k.href} does not resolve on disk`);
      }
  }
  const integ = {
    lessons: {
      "3-1": {
        canvas: ["ratio-tape"],
        lab: ["discount"],
        learningLab: "recipe-remix",
        notesStudio: true,
      },
    },
  };
  const L31 = C.stageLinks(
    lessons.find((l) => l.id === "3-1"),
    integ,
  );
  assert.ok(
    L31.lab.some((k) => k.href.startsWith("/curriculum/math-canvas/?scene=ratio-tape&lesson=3-1")),
  );
  assert.ok(
    L31.lab.some((k) => k.href.startsWith("/curriculum/reality-lab/?inv=discount&lesson=3-1")),
  );
  assert.ok(L31.notes.some((k) => k.href.startsWith("/curriculum/notes-studio/?lesson=3-1")));
  const evil = C.stageLinks(
    lessons.find((l) => l.id === "3-1"),
    { lessons: { "3-1": { canvas: ["x y<script>"], lab: ["../../x"], learningLab: "../evil" } } },
  );
  assert.equal(evil.lab.length, 1, "malformed integration values are ignored");

  /* ---- Check Yourself: seeded, reproducible, verified ---- */
  const cfg = readJson(CHECK_PATH);
  const registry = {};
  for (const f of new Set(Object.values(cfg.genFiles))) {
    const c = {};
    c.window = c;
    c.console = console;
    vm.createContext(c);
    for (const file of ["core", f])
      vm.runInContext(readFileSync(rel(`assets/studio-gen/${file}.js`), "utf8"), c);
    registry[f] = c.StudioGen.ids();
  }
  deq(validateCheckConfig(cfg, registry), []);
  const bad = structuredClone(cfg);
  bad.studio.pop();
  assert.ok(validateCheckConfig(bad, registry).length, "negative: dropped studio lesson is caught");
  const bad2 = structuredClone(cfg);
  bad2.genFiles.ratioWrite = "stats";
  assert.ok(validateCheckConfig(bad2, registry).length, "negative: wrong generator file is caught");

  const G = loadStudio().StudioGen;
  const studioLessons = cfg.studio;
  const tags = new Set();
  let items = 0;
  for (const id of studioLessons) {
    const gens = C.studioGenIds(readJson(`data/practice-studio/${id}.json`));
    if (!gens.length) continue;
    for (const code of ["1000", "4821", "9999", "7"]) {
      const a = C.checkPlan({ lesson: id, genIds: gens, code, levels: cfg.levels });
      deq(
        a,
        C.checkPlan({ lesson: id, genIds: gens, code, levels: cfg.levels }),
        "same code, same plan",
      );
      assert.equal(a.length, 3);
      const built = C.buildItems(G, a);
      assert.ok(built.length >= 2, `${id}/${code}: only ${built.length} items`);
      assert.equal(JSON.stringify(built), JSON.stringify(C.buildItems(G, a)), "items reproducible");
      assert.equal(new Set(built.map((i) => i.q)).size, built.length, "no duplicate questions");
      for (const item of built) {
        assert.equal(G.verify(item), true, `${id}: key disagrees with independent check`);
        items++;
        if (item.k === "num") assert.ok(C.grade(G, item, item.a).ok, "typed answer accepted");
        else {
          assert.ok(C.grade(G, item, item.a).ok);
          item.c.forEach((_, k) => {
            if (k !== item.a) {
              const g = C.grade(G, item, k);
              assert.equal(g.ok, false);
              if (g.tag) tags.add(g.tag);
            }
          });
        }
      }
    }
    ndeq(
      C.checkPlan({ lesson: id, genIds: gens, code: "1000" }),
      C.checkPlan({ lesson: id, genIds: gens, code: "1001" }),
      "different codes differ",
    );
  }
  assert.ok(items > 500 && tags.size > 20, `sampled ${items} items, ${tags.size} tags`);
  // every tag the generators can emit, not only the ones one lesson showed
  for (const id of G.ids())
    for (let level = 1; level <= 4; level++)
      for (let n = 0; n < 40; n++) {
        const it = G.make(id, level, `t${n}`);
        (it.tag || []).forEach((x) => x && tags.add(x));
        (it.fw || []).forEach((w) => w.tag && tags.add(w.tag));
      }
  // negative controls: a corrupted key is caught by the independent check; a failing check drops the item
  const probe = G.make("ratioWrite", 1, "neg");
  probe.a = (probe.a + 1) % probe.c.length;
  assert.notEqual(G.verify(probe), true, "corrupted key must fail the independent check");
  deq(
    C.buildItems({ make: () => G.make("ratioWrite", 1, "neg"), verify: () => "key disagrees" }, [
      { gen: "ratioWrite", level: 1, seed: "x" },
    ]),
    [],
  );
  deq(
    C.checkPlan({ lesson: "1-1", genIds: [], code: "1" }),
    [],
    "no generator, no plan (self-rating is shown)",
  );
  assert.equal(C.grade(G, probe, "").blank, true);

  // answering: first try / retry / reveal, and the reveal is withheld until two misses
  const fake = { k: "mc", c: ["a", "b", "c"], a: 1, tag: ["flip", "", "slip-x"] };
  const run = C.newRun([fake, fake, fake]);
  C.answer(run, 0, C.grade(G, fake, 1));
  C.answer(run, 1, C.grade(G, fake, 0));
  assert.equal(C.canReveal(run, 1), false, "no checked result after one miss");
  C.answer(run, 1, C.grade(G, fake, 2));
  assert.equal(C.canReveal(run, 1), true);
  assert.equal(C.reveal(run, 2), false, "cannot reveal an unattempted item");
  assert.ok(C.reveal(run, 1));
  C.answer(run, 1, C.grade(G, fake, 1));
  assert.equal(run.state[1].status, "revealed", "a revealed item stays revealed");
  assert.equal(run.state[2].status, "open");
  C.answer(run, 2, C.grade(G, fake, 1));
  deq(
    C.summarize(run),
    { status: "repair", repairTag: "flip", counts: { clean: 2, retried: 0, revealed: 1, open: 0 } },
    "one reveal makes the check a repair",
  );
  const clean = C.newRun([fake, fake]);
  clean.items.forEach((_, i) => C.answer(clean, i, C.grade(G, fake, 1)));
  assert.equal(C.summarize(clean).status, "ok");
  assert.equal(C.summarize(clean).repairTag, null);
  const shaky = C.newRun([fake]);
  C.answer(shaky, 0, C.grade(G, fake, 0));
  C.answer(shaky, 0, C.grade(G, fake, 1));
  deq([C.summarize(shaky).status, C.summarize(shaky).repairTag], ["unsure", "flip"]);

  /* ---- router: every tag resolves to existing help ---- */
  const ref = readJson(REF_PATH);
  const helpHtml = readFileSync(rel("curriculum/extra-help/index.html"), "utf8");
  const exists = (p) => existsSync(rel(p.endsWith("/") ? `${p}index.html` : p));
  const sampleIntegration = { lessons: { "3-1": { canvas: ["s1"], lab: ["i1"] } } };
  const withTerms = new Set(ref.entries.flatMap((e) => e.lessons));
  let chipsChecked = 0;
  for (const l of lessons) {
    const hasStudio = cfg.studio.includes(l.id);
    for (const tag of hasStudio ? [...tags] : ["", "slip"]) {
      const chips = C.repairChips({
        id: l.id,
        tag,
        integ: sampleIntegration,
        hasReference: withTerms.has(l.id),
        hasStudio,
        hasHelp: true,
        labPath: l.resources.learningLab,
      });
      assert.ok(chips.length >= 2, `${l.id}/${tag}: only ${chips.length} repair links`);
      for (const c of chips) {
        chipsChecked++;
        if (c.kind === "help")
          assert.ok(
            helpHtml.includes(`id="lesson-${l.id}"`),
            `${l.id}: Extra Help has no #lesson-${l.id}`,
          );
        else if (c.kind === "practice") assert.ok(exists(c.href), `${l.id}: ${c.href}`);
        else if (c.kind === "lab") assert.ok(exists(c.href.split("?")[0]), `${l.id}: ${c.href}`);
        else if (c.kind === "reference")
          assert.ok(withTerms.has(l.id), `${l.id}: no Pocket Reference words`);
        else assert.match(c.href, /^\/curriculum\/(math-canvas|reality-lab)\/\?/);
      }
    }
  }
  for (const l of lessons.filter((x) => cfg.studio.includes(x.id)))
    assert.ok(
      withTerms.has(l.id),
      `lesson ${l.id} has a Check Yourself but no Pocket Reference words`,
    );
  assert.equal(
    C.repairChips({
      id: "3-1",
      tag: "added-instead",
      integ: sampleIntegration,
      hasReference: true,
      hasStudio: true,
      hasHelp: true,
      labPath: "/curriculum/learning-labs/recipe-remix/",
    })[0].kind,
    "help",
  );
  assert.equal(
    C.repairChips({
      id: "3-1",
      tag: "misread-graph",
      integ: sampleIntegration,
      hasReference: true,
      hasStudio: true,
      hasHelp: true,
    })[0].kind,
    "canvas",
    "visual slips go to the picture tools first",
  );

  /* ---- Pocket Reference data: validator, counts, negative controls ---- */
  const rctx = referenceContext({ ewl: EWL });
  deq(
    validateReference(ref, rctx),
    [],
    "pocket-reference.json fails validation (rebuild with --write)",
  );
  deq(
    buildReference().entries,
    ref.entries,
    "pocket-reference.json is stale: run node tools/ewl-cockpit.test.mjs --write",
  );
  assert.ok(ref.entries.length >= 120, `${ref.entries.length} terms`);
  assert.ok(
    ref.entries.some((e) => e.lessons.length > 1),
    "terms taught in several lessons are merged and list every lesson",
  );
  assert.ok(
    !ref.entries.some((e) => e.lessons.some((l) => l.startsWith("10-") || l.startsWith("1-"))),
    "no Unit 1 or Unit 10 lessons",
  );
  assert.equal(new Set(ref.entries.map((e) => norm(e.term))).size, ref.entries.length, "deduped");
  const mutate = (fn) => {
    const d = structuredClone(ref);
    fn(d.entries[5], d);
    return validateReference(d, rctx);
  };
  assert.ok(mutate((e) => (e.definition += " (invented)")).length, "negative: edited definition");
  assert.ok(mutate((e) => (e.source.lesson = "3-1")).length, "negative: wrong source lesson");
  assert.ok(mutate((e) => (e.lessons = ["10-1"])).length, "negative: Unit 10 lesson");
  assert.ok(
    mutate((e) => (e.term = "Zebra Factor")).length,
    "negative: term the lessons never teach",
  );
  assert.ok(mutate((e) => (e.example = "made-up example")).length, "negative: invented example");
  assert.ok(mutate((e) => (e.termEs = "")).length, "negative: missing Spanish");
  assert.ok(mutate((e) => (e.icon = "nope")).length, "negative: unknown icon");
  assert.ok(
    mutate((e) => (e.sandbox.preset = "no-such-preset")).length,
    "negative: preset the Workbench lacks",
  );
  assert.ok(mutate((e) => (e.frame.es = "sin espacio")).length, "negative: frame without a blank");
  assert.ok(mutate((e, d) => (d.entries[6].id = e.id)).length, "negative: duplicate id");
  assert.ok(
    validateReference({ ...ref, entries: ref.entries.slice(0, 50) }, rctx).length,
    "negative: too few terms",
  );
  assert.ok(validateReference({ v: 2, entries: [] }, rctx).length, "negative: wrong version");
  const handUsed = new Set(ref.entries.map((e) => e.icon).filter((k) => R.ICONS[k].hand));
  assert.ok(handUsed.size >= 12, `${handUsed.size} hand-drawn pictures in use`);
  assert.ok(
    R.search(ref.entries, { q: "razon" }).some((e) => e.term === "Ratio"),
    "Spanish search without accent",
  );
  assert.equal(
    R.search(ref.entries, { q: "ratio" })[0].term.toLowerCase().startsWith("ratio"),
    true,
    "best match first",
  );
  assert.ok(R.search(ref.entries, { lesson: "3-1" }).every((e) => e.lessons.includes("3-1")));
  deq(R.search(ref.entries, { q: "qqqqzzzz" }), []);

  /* ---- the DOM: cockpit, drawer, teacher mode (jsdom) ---- */
  await domTests(ref, plan, cfg, G, C);

  console.log(
    `ewl-cockpit: ${lessons.length} lessons, ${items} generated items verified, ${tags.size} misconception tags routed (${chipsChecked} repair links resolved), ${ref.entries.length} reference terms (${handUsed.size} hand-drawn pictures), DOM ok.`,
  );
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  if (process.argv.includes("--write")) {
    writeFileSync(rel(REF_PATH), `${JSON.stringify(buildReference(), null, 1)}\n`);
    console.log(`wrote ${REF_PATH}`);
  }
  await runTests();
}
