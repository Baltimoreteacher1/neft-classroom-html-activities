// Studio X: the component registry (access-practice-lab/src/studio/x/components*.js).
//   node --test tools/studio-x-components.test.mjs
// Pins: every format the studio can add has a component and the one it cannot (hotspot) says why; things the engine
// cannot do (maps, simulations, animation, flip cards, branching, recording) are listed unavailable with a plain
// bilingual reason, never faked; every available component has the full descriptor; every build() output passes
// normalizeActivity + validateActivity in every kind it claims, on a blank and on a rich activity; derived components
// use ONLY the teacher's own words; recommend() is short, relevant and never offers what does not fit; adding a
// component through the editor store is one undoable step; game styles change delivery without touching questions.
import assert from "node:assert/strict";
import test from "node:test";
import { allFormats } from "../access-practice-lab/src/studio/core/fixtures.js";
import {
  BLOCK_TYPES,
  DIAGRAM_KINDS,
  FORMATS,
  normalizeActivity,
  questionsOf,
} from "../access-practice-lab/src/studio/core/schema.js";
import { validateActivity } from "../access-practice-lab/src/studio/core/validate.js";
import { createStore } from "../access-practice-lab/src/studio/editor/store.js";
import {
  applyComponent,
  applyToDraft,
  buildComponent,
  COMPONENTS,
  fits,
  getComponent,
  recommend,
} from "../access-practice-lab/src/studio/x/components.js";

const AVAILABLE = COMPONENTS.filter((c) => c.available);
const bilingual = (t, what) => {
  assert.ok(t && typeof t.en === "string" && t.en.trim(), `${what}: English`);
  assert.ok(typeof t.es === "string" && t.es.trim(), `${what}: Spanish`);
  assert.notEqual(t.es, t.en, `${what}: Spanish is not the English copied`);
};
const errorsOf = (a) => validateActivity(a).errors.map((e) => `${e.code}: ${e.message}`);

/** An activity with real vocabulary, a passage and one of every format, in any kind. */
function rich(kind = "interactive") {
  const a = allFormats(kind);
  a.blocks.unshift({
    id: "vocab-rich",
    type: "vocab",
    items: [
      { id: "w1", term: "habitat", def: "the place where an animal lives" },
      { id: "w2", term: "predator", def: "an animal that hunts other animals" },
      { id: "w3", term: "producer", def: "a living thing that makes its own food" },
    ],
  });
  return normalizeActivity(a);
}
const blank = (kind = "interactive") => normalizeActivity({ kind, title: "My activity" });
const oneQuestion = (kind = "interactive") =>
  normalizeActivity({
    kind,
    title: "My activity",
    blocks: [
      {
        type: "question",
        format: "choice",
        prompt: "Which is a fruit?",
        options: [
          { id: "a", text: "Apple" },
          { id: "b", text: "Carrot" },
        ],
        answer: "a",
      },
    ],
  });

test("every format has a component; hotspot is listed unavailable with a reason", () => {
  for (const f of FORMATS) {
    const c = getComponent(`q-${f}`);
    assert.ok(c, `a component for ${f}`);
    if (f === "hotspot") {
      assert.equal(c.available, false);
      assert.match(c.reason.en, /picture/i);
    } else assert.equal(c.available, true, f);
  }
});

test("what the engine cannot do is listed unavailable with a plain bilingual reason", () => {
  const ids = ["map", "simulation", "animation", "flip-cards", "branching", "voice-recording"];
  for (const id of ids) {
    const c = getComponent(id);
    assert.ok(c, id);
    assert.equal(c.available, false, id);
    assert.equal(c.preview, null, `${id} has no fake preview`);
    bilingual(c.reason, `${id} reason`);
    assert.deepEqual(c.build({ blocks: [] }, {}), [], `${id} builds nothing`);
    assert.throws(() => buildComponent(id, blank()), /not available/);
  }
  if (!BLOCK_TYPES.includes("diagram")) assert.equal(getComponent("diagram")?.available, false);
  else
    for (const kind of DIAGRAM_KINDS) {
      const c = getComponent(`diagram-${kind}`);
      assert.equal(c?.available, true, `diagram blocks exist, so ${kind} is offered`);
      const [block] = buildComponent(c.id, oneQuestion());
      assert.equal(block.type, "diagram");
      assert.equal(block.spec.kind, kind);
    }
  assert.equal(getComponent("timer"), undefined, "timers are never offered");
});

test("every available component has the full descriptor, in both languages", () => {
  assert.ok(AVAILABLE.length >= 30, `${AVAILABLE.length} available components`);
  const seen = new Set();
  for (const c of AVAILABLE) {
    assert.ok(!seen.has(c.id), `${c.id} is unique`);
    seen.add(c.id);
    bilingual(c.label, `${c.id} label`);
    bilingual(c.purpose, `${c.id} purpose`);
    bilingual(c.accessibility, `${c.id} accessibility`);
    bilingual(c.printable.note, `${c.id} printable note`);
    assert.ok(["native", "table", "none"].includes(c.printable.alternative), c.id);
    assert.ok(c.category && c.tags.length, `${c.id} category and tags`);
    assert.ok(
      c.compatibility.kinds.length &&
        c.compatibility.kinds.every((k) =>
          ["interactive", "worksheet", "game", "check"].includes(k),
        ),
    );
    assert.equal(typeof c.build, "function");
    assert.ok(Array.isArray(c.configurable));
    for (const opt of c.configurable) bilingual(opt.label, `${c.id} option`);
    assert.equal(c.preview.schema, "lp-activity/1");
  }
});

test("every preview is a valid activity", () => {
  for (const c of AVAILABLE) {
    const a = c.preview;
    assert.deepEqual(errorsOf(a), [], `${c.id} preview`);
    assert.deepEqual(
      normalizeActivity(a),
      a,
      `${c.id} preview is a fixed point of normalizeActivity`,
    );
  }
});

test("every build() passes normalize + validate in every kind it claims, on blank and rich activities", () => {
  for (const c of AVAILABLE.filter((x) => !x.change)) {
    for (const kind of c.compatibility.kinds) {
      for (const [name, base] of [
        ["blank", blank(kind)],
        ["one question", oneQuestion(kind)],
        ["rich", rich(kind)],
      ]) {
        const before = JSON.stringify(base);
        const blocks = buildComponent(c.id, base);
        assert.equal(JSON.stringify(base), before, `${c.id} does not mutate the activity`);
        const draft = structuredClone(base);
        const { added } = applyToDraft(draft, c.id);
        assert.equal(added.length, blocks.length);
        const next = normalizeActivity(draft);
        // a game needs three questions; every other rule is the shared validator's
        const errs = errorsOf(next).filter((e) => !(kind === "game" && /^few-questions/.test(e)));
        assert.deepEqual(errs, [], `${c.id} in ${kind} on ${name}`);
        const ids = next.blocks.map((b) => b.id);
        assert.equal(new Set(ids).size, ids.length, `${c.id}: block ids stay unique`);
        for (const id of added)
          assert.ok(ids.includes(id), `${c.id}: added id survives normalization`);
      }
    }
  }
});

test("adding the same component twice never collides", () => {
  const once = applyComponent(oneQuestion(), "q-match").activity;
  const twice = applyComponent(once, "q-match").activity;
  assert.equal(twice.blocks.length, once.blocks.length + 2, "question plus teacher note");
  assert.equal(new Set(twice.blocks.map((b) => b.id)).size, twice.blocks.length);
  assert.deepEqual(validateActivity(twice).errors, []);
});

test("example-based components carry a teacher-only starter note; derived ones carry none", () => {
  const withNote = buildComponent("q-choice", blank());
  assert.equal(withNote.at(-1).type, "note");
  assert.match(withNote.at(-1).text, /Starter example/);
  const derived = buildComponent("vocab-match", rich());
  assert.ok(!derived.some((b) => b.type === "note"));
  const es = buildComponent("q-choice", blank(), { lang: "es" }).at(-1);
  assert.match(es.text, /Ejemplo inicial/);
});

test("vocab-match uses ONLY the teacher's own words and meanings", () => {
  const a = normalizeActivity({
    kind: "interactive",
    title: "Moon words",
    blocks: [
      {
        type: "vocab",
        items: [
          { id: "a", term: "orbit", def: "the path around a planet" },
          { id: "b", term: "crater", def: "a bowl-shaped hole" },
          { id: "c", term: "orbit", def: "duplicate word" },
          { id: "d", term: "phase", def: "" },
        ],
      },
    ],
  });
  assert.equal(fits(getComponent("vocab-match"), a).ok, true);
  const [q] = buildComponent("vocab-match", a);
  assert.equal(q.format, "match");
  assert.deepEqual(
    q.pairs.map((p) => [p.left, p.right]),
    [
      ["orbit", "the path around a planet"],
      ["crater", "a bowl-shaped hole"],
    ],
    "no invented words, a duplicate word and a word without a meaning are left out",
  );
  assert.ok(!JSON.stringify(q).match(/habitat|predator/), "no sample words leak in");
  const rest = errorsOf(applyComponent(a, "vocab-match").activity);
  assert.deepEqual(
    rest.filter((e) => !e.startsWith("vocab-empty")),
    [],
    "the match question itself is valid (the teacher's own empty meaning is still theirs to fix)",
  );
});

test("read-aloud reads the teacher's own passage, not a sample", () => {
  const text =
    "The moon circles the Earth. It takes about a month. The moon has no light of its own.";
  const a = normalizeActivity({
    kind: "interactive",
    title: "Moon",
    blocks: [
      { type: "passage", title: "The Moon", text },
      { type: "question", format: "number", prompt: "1 + 1?", answer: "2" },
    ],
  });
  const [audio] = buildComponent("read-aloud", a);
  assert.equal(audio.type, "audio");
  assert.equal(audio.label, "The Moon");
  assert.ok(text.startsWith(audio.say.slice(0, 20)) && text.includes(audio.say));
  assert.equal(fits(getComponent("read-aloud"), blank()).ok, false);
});

test("fits explains plainly why a component cannot be added", () => {
  const no = fits(getComponent("vocab-match"), oneQuestion());
  assert.equal(no.ok, false);
  bilingual(no.reason, "needs vocabulary");
  assert.equal(fits(getComponent("game-quest"), oneQuestion()).ok, false);
  assert.equal(fits(getComponent("game-quest"), rich()).ok, true);
  const wrongKind = fits(getComponent("organizer-kwl"), rich("game"));
  assert.equal(wrongKind.ok, false);
  bilingual(wrongKind.reason, "wrong kind");
  const hot = fits(getComponent("q-hotspot"), rich());
  assert.equal(hot.ok, false);
  assert.match(hot.reason.en, /picture/i);
});

test("game styles change delivery only: same questions, same answers, still valid", () => {
  const base = rich();
  for (const style of ["quest", "match", "puzzle", "strategy"]) {
    const { activity, added, validation } = applyComponent(base, `game-${style}`);
    assert.equal(activity.kind, "game");
    assert.equal(activity.template, style);
    assert.deepEqual(added, []);
    assert.deepEqual(validation.errors, []);
    assert.deepEqual(
      questionsOf(activity).map((q) => [q.id, q.prompt, q.answer ?? null]),
      questionsOf(base).map((q) => [q.id, q.prompt, q.answer ?? null]),
    );
    assert.equal(activity.options.timer, false, "never a timer");
  }
});

test("recommend returns a short, relevant, fitting list", () => {
  const available = AVAILABLE.length;
  const cases = [
    ["blank", blank()],
    ["one question", oneQuestion()],
    ["rich", rich()],
    [
      "math",
      normalizeActivity({
        ...oneQuestion(),
        context: { subject: "Math", standards: [{ code: "6.RP.A.3" }] },
      }),
    ],
  ];
  for (const [name, a] of cases) {
    const rec = recommend(a);
    assert.ok(rec.length >= 1 && rec.length <= 6, `${name}: ${rec.length} recommendations`);
    assert.ok(rec.length < available / 2, `${name}: short compared with ${available}`);
    for (const r of rec) {
      assert.equal(r.component.available, true);
      assert.equal(fits(r.component, a).ok, true, `${name}: ${r.component.id} fits`);
      bilingual(r.reason, `${name}: ${r.component.id} reason`);
    }
    assert.equal(new Set(rec.map((r) => r.component.id)).size, rec.length, "no repeats");
    assert.ok(
      rec.filter((r) => r.component.category === "game").length <= 1,
      "at most one game style",
    );
  }
});

test("recommend follows the activity: vocabulary, subject, standards and what already exists", () => {
  const vocabOnly = normalizeActivity({
    kind: "interactive",
    title: "Words",
    blocks: [
      {
        type: "vocab",
        items: [
          { id: "a", term: "orbit", def: "the path around a planet" },
          { id: "b", term: "crater", def: "a bowl-shaped hole" },
        ],
      },
      { type: "question", format: "number", prompt: "1+1", answer: "2" },
    ],
  });
  assert.equal(
    recommend(vocabOnly)[0].component.id,
    "vocab-match",
    "the obvious next step comes first",
  );
  // once a matching question exists it is no longer suggested
  const matched = applyComponent(vocabOnly, "vocab-match").activity;
  assert.ok(!recommend(matched).some((r) => r.component.id === "vocab-match"));

  const ratio = normalizeActivity({
    ...oneQuestion(),
    context: { subject: "Mathematics", standards: [{ code: "6.RP.A.3" }] },
  });
  const ratioIds = recommend(ratio).map((r) => r.component.id);
  assert.ok(ratioIds.includes("q-fillTable"), `ratio work gets a ratio table: ${ratioIds}`);
  assert.ok(!ratioIds.includes("organizer-kwl"), "no science organizers on a math activity");

  const fractions = normalizeActivity({
    ...oneQuestion(),
    title: "Fractions on a number line",
    context: { subject: "Math" },
  });
  assert.ok(recommend(fractions).some((r) => r.component.id === "q-numberline"));

  const science = normalizeActivity({ ...oneQuestion(), context: { subject: "Science" } });
  assert.ok(recommend(science).some((r) => r.component.id === "organizer-claim-evidence"));

  const hasNumberline = normalizeActivity({
    ...fractions,
    blocks: [
      ...fractions.blocks,
      {
        type: "question",
        format: "numberline",
        prompt: "Place 1/2",
        min: 0,
        max: 1,
        step: 0.5,
        answer: "1/2",
      },
    ],
  });
  assert.ok(
    !recommend(hasNumberline).some((r) => r.component.id === "q-numberline"),
    "not offered again once used",
  );

  const limited = recommend(rich(), { limit: 3 });
  assert.ok(limited.length <= 3);
});

test("adding through the editor store is ONE undoable step", () => {
  const store = createStore(oneQuestion());
  const before = JSON.stringify(store.get());
  let added = [];
  const changed = store.apply(
    (d) => {
      added = applyToDraft(d, "q-match").added;
    },
    { reason: "structure" },
  );
  assert.equal(changed, true);
  assert.ok(store.get().blocks.some((b) => b.id === added[0]));
  assert.deepEqual(store.report().errors, []);
  assert.equal(store.undo(), true);
  assert.equal(JSON.stringify(store.get()), before, "undo restores the exact previous activity");
  assert.equal(store.canUndo(), false, "exactly one step was recorded");
  store.redo();
  assert.ok(store.get().blocks.some((b) => b.id === added[0]));
});

test("insertion position: after a chosen block, otherwise at the end", () => {
  const a = rich();
  const anchor = a.blocks[2].id;
  const { activity, added } = applyComponent(a, "reflection", {}, { after: anchor });
  const ids = activity.blocks.map((b) => b.id);
  assert.equal(ids.indexOf(added[0]), ids.indexOf(anchor) + 1);
  const end = applyComponent(a, "reflection");
  assert.equal(end.activity.blocks.at(-1).id, end.added.at(-1));
});

test("configuration changes the build, and unknown options are ignored", () => {
  const write = buildComponent("q-short", blank(), { kind: "write" })[0];
  assert.equal(write.kind, "write");
  const explain = buildComponent("q-short", blank())[0];
  assert.equal(explain.kind, "explain");
  const noQ = buildComponent("organizer-kwl", oneQuestion());
  assert.deepEqual(
    noQ.map((b) => b.type),
    ["organizer"],
    "content only when the activity already has questions",
  );
  const withQ = buildComponent("organizer-kwl", oneQuestion(), { withQuestion: true });
  assert.equal(withQ.length, 2);
  buildComponent("q-choice", blank(), { nonsense: 1 });
});
