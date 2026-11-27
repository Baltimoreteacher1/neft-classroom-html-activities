// Academic Language Support Builder: wording in both languages (same blanks, same placeholders, short lines), supports built
// only from the activity's own context, nothing generic when the topic is unknown, existing questions untouched, every
// addition marked and valid, and the editor panel (jsdom) adding and undoing with the store.
//   node --test tools/studio-x-language.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { FRAME_BANK } from "../access-practice-lab/src/studio/core/differentiate-frames.js";
import { generateMath } from "../access-practice-lab/src/studio/core/mathgen.js";
import { normalizeActivity, questionsOf } from "../access-practice-lab/src/studio/core/schema.js";
import { validateActivity } from "../access-practice-lab/src/studio/core/validate.js";
import { createStore } from "../access-practice-lab/src/studio/editor/store.js";
import {
  addLanguageSupport,
  languageSupportOptions,
  OPTION_IDS,
} from "../access-practice-lab/src/studio/x/language-support.js";
import {
  BLANK,
  FRAME_KEYS,
  SLOTS,
  TEXT,
} from "../access-practice-lab/src/studio/x/language-support-text.js";

const deepFreeze = (o) => {
  for (const v of Object.values(o)) if (v && typeof v === "object") deepFreeze(v);
  return Object.freeze(o);
};
const count = (s, re) => (String(s).match(re) || []).length;
const slots = (s) => [...String(s).matchAll(SLOTS)].map((m) => m[1]).sort();

// ── fixtures ────────────────────────────────────────────────────────────────

const vocab = {
  id: "v1",
  type: "vocab",
  items: [
    {
      id: "w1",
      term: "ratio",
      def: "A comparison of two amounts.",
      es: "razón",
      example: "The ratio of cats to dogs is 2 to 3.",
    },
    { id: "w2", term: "unit rate", def: "An amount for one.", es: "tasa unitaria", example: "" },
  ],
};
const mathActivity = () =>
  normalizeActivity({
    id: "s0123456789",
    title: "Percent practice",
    kind: "worksheet",
    context: { grade: "6", subject: "Math" },
    supports: { spanish: false },
    blocks: [
      { id: "d1", type: "text", role: "directions", text: "Solve each problem." },
      vocab,
      ...generateMath({ topic: "percent", grade: 6, count: 4, seed: 3 }),
      { id: "n1", type: "note", text: "Teacher note." },
    ],
  });
const bareActivity = () =>
  normalizeActivity({
    id: "s0000000001",
    title: "Quick check",
    kind: "check",
    context: { grade: "6", subject: "Math" },
    blocks: [
      { id: "d1", type: "text", role: "directions", text: "Pick one." },
      {
        id: "q1",
        type: "question",
        format: "choice",
        prompt: "Which is bigger?",
        options: [
          { id: "a", text: "Seven" },
          { id: "b", text: "Four" },
        ],
        answer: "a",
      },
    ],
  });

// ── wording ─────────────────────────────────────────────────────────────────

function* templates(node, path = "TEXT") {
  if (typeof node?.en === "string" && typeof node?.es === "string") yield [path, node];
  else for (const [k, v] of Object.entries(node || {})) yield* templates(v, `${path}.${k}`);
}

test("every template has English and Spanish with the same blanks and the same placeholders", () => {
  const all = [...templates(TEXT)];
  assert.ok(all.length >= 40, `found ${all.length} templates`);
  for (const [path, { en, es }] of all) {
    assert.ok(en.trim() && es.trim(), `${path}: both languages written`);
    assert.notEqual(en, es, `${path}: Spanish is not a copy of the English`);
    assert.equal(
      count(es, BLANK),
      count(en, BLANK),
      `${path}: blank count differs (${en} | ${es})`,
    );
    assert.deepEqual(slots(es), slots(en), `${path}: placeholders differ`);
    for (const line of [en, es].flatMap((t) => t.split("\n")))
      assert.ok(line.trim().split(/\s+/).length <= 24, `${path}: a line is too long: ${line}`);
  }
});

test("sentence frames reuse the engine's frame families and every one has Spanish with the same blanks", async () => {
  const { frameOf } = await import("../access-practice-lab/src/studio/x/language-support-text.js");
  assert.deepEqual(
    [...FRAME_KEYS].sort(),
    Object.keys(FRAME_BANK).sort(),
    "one Spanish frame per engine family",
  );
  for (const key of FRAME_KEYS) {
    const { en, es } = frameOf(key);
    assert.equal(en, FRAME_BANK[key].full, `${key}: English is the engine's own frame`);
    assert.ok(count(en, BLANK) >= 1, `${key}: has a blank`);
    assert.equal(count(es, BLANK), count(en, BLANK), `${key}: blank counts match`);
    assert.ok(/[.!?]$/.test(es), `${key}: ends like a sentence`);
    assert.ok(en.length <= 70 && es.length <= 80, `${key}: short`);
  }
});

// ── what is offered ─────────────────────────────────────────────────────────

test("an activity with a known topic and its own words is offered every support that fits", () => {
  const opts = languageSupportOptions(mathActivity());
  assert.deepEqual(
    opts.map((o) => o.id),
    [...OPTION_IDS],
  );
  const on = Object.fromEntries(opts.map((o) => [o.id, o.available]));
  for (const id of [
    "language-objective",
    "sentence-frames",
    "because-but-so",
    "sentence-expansion",
    "oral-rehearsal",
    "discussion-prompts",
    "comparison-structures",
    "explanation-task",
  ])
    assert.equal(on[id], true, id);
  // No pictures, no short answer and no reading here: those say why.
  for (const id of [
    "visual-vocabulary",
    "claim-evidence-reasoning",
    "paragraph-organizer",
    "writing-revision",
  ]) {
    assert.equal(on[id], false, id);
    const o = opts.find((x) => x.id === id);
    assert.ok(o.reason.en && o.reason.es, `${id}: reason in both languages`);
  }
});

test("with no topic and no vocabulary only the options that need no topic language are offered, and the rest say why", () => {
  const a = bareActivity();
  const opts = languageSupportOptions(a);
  const on = opts.filter((o) => o.available).map((o) => o.id);
  assert.deepEqual(on.sort(), ["explanation-task", "oral-rehearsal", "sentence-frames"]);
  for (const id of ["language-objective", "because-but-so", "discussion-prompts"]) {
    const o = opts.find((x) => x.id === id);
    assert.equal(o.available, false);
    assert.match(o.reason.en, /vocabulary word or a known math topic/);
    assert.match(o.reason.es, /palabra de vocabulario o un tema/);
    const r = addLanguageSupport(a, id);
    assert.equal(r.ok, false);
    assert.equal(r.added.length, 0);
    assert.deepEqual(r.activity.blocks, a.blocks, "an unavailable option changes nothing");
    assert.ok(r.review[0].en && r.review[0].es);
  }
});

test("a generic activity gets structure only: no topic or content word is written", () => {
  const a = bareActivity();
  const text = [];
  for (const id of ["sentence-frames", "oral-rehearsal", "explanation-task"]) {
    const r = addLanguageSupport(a, id, { bilingual: true });
    assert.equal(r.ok, true, id);
    text.push(JSON.stringify(r.activity.blocks.find((b) => b.id === r.added[0].id)));
  }
  const all = text.join(" ").toLowerCase();
  for (const word of [
    "percent",
    "ratio",
    "fraction",
    "equation",
    "porcentaje",
    "razón",
    "seven",
    "bigger",
  ])
    assert.ok(!all.includes(word), `no "${word}" in generic supports`);
});

test("topic language comes from the topic the activity records, in both languages", () => {
  const a = mathActivity();
  const r = addLanguageSupport(a, "language-objective", { bilingual: true });
  const block = r.activity.blocks.find((b) => b.id === "ls-language-objective");
  assert.match(block.text, /Topic: percent\./);
  assert.match(block.text, /Tema: porcentaje\./);
  assert.match(block.text, /“ratio”, “unit rate”/);
  assert.match(block.text, /«ratio», «unit rate»/);
  // A topic can also come from the unit's own standards when no question records one.
  const byStandard = normalizeActivity({
    ...mathActivity(),
    blocks: [{ id: "d1", type: "text", role: "directions", text: "Go." }],
    context: {
      grade: "6",
      subject: "Mathematics",
      standards: [{ code: "6.RP.A.2", origin: "curriculum" }],
    },
  });
  const o = addLanguageSupport(byStandard, "language-objective");
  assert.match(o.activity.blocks.find((b) => b.id === o.added[0].id).text, /Topic: unit rate\./);
});

// ── adding ──────────────────────────────────────────────────────────────────

const questionJson = (a) => JSON.stringify(questionsOf(a));

test("every available support adds a marked, valid block and touches no existing question", () => {
  for (const bilingual of [false, true]) {
    const a = deepFreeze(mathActivity());
    const before = questionJson(a);
    for (const o of languageSupportOptions(a).filter((x) => x.available)) {
      const r = addLanguageSupport(a, o.id, { bilingual });
      assert.equal(r.ok, true, o.id);
      assert.equal(r.optionId, o.id);
      assert.ok(validateActivity(r.activity).ok, `${o.id}: still valid`);
      for (const item of r.added) {
        assert.ok(item.id.startsWith("ls-"), `${o.id}: marked by its id`);
        assert.ok(
          r.activity.blocks.some((b) => b.id === item.id),
          `${o.id}: the block exists`,
        );
        assert.ok(r.activity.lineage.added.includes(item.id), `${o.id}: listed in lineage.added`);
        assert.ok(
          r.review.some((x) => x.id === item.id),
          `${o.id}: named for review`,
        );
      }
      assert.ok(
        r.review.every((x) => x.en && x.es),
        `${o.id}: review text in both languages`,
      );
      // Existing questions are byte-identical, in place; only whole new blocks appear.
      const kept = questionsOf(r.activity).filter((q) => !q.id.startsWith("ls-"));
      assert.equal(JSON.stringify(kept), before, `${o.id}: existing questions untouched`);
      const originals = r.activity.blocks.filter((b) => a.blocks.some((x) => x.id === b.id));
      assert.deepEqual(
        originals,
        a.blocks,
        `${o.id}: every original block is unchanged and in order`,
      );
      const added = JSON.stringify(r.activity.blocks.filter((b) => b.id.startsWith("ls-")));
      assert.ok(!/\{\w+\}/.test(added), `${o.id}: no placeholder left over`);
      assert.equal(
        /porque|Primero|Elige|Dilo|Marcos|¿|Afirmación|Oración|Revisa|Alarga|Meta de|Hablemos/.test(
          added,
        ),
        bilingual,
        `${o.id}: Spanish only when asked`,
      );
    }
  }
});

test("English and Spanish halves of each added block have the same number of blanks", () => {
  const a = mathActivity();
  for (const o of languageSupportOptions(a).filter((x) => x.available)) {
    const en = addLanguageSupport(a, o.id, { bilingual: false });
    const both = addLanguageSupport(a, o.id, { bilingual: true });
    const strings = (r) => {
      const b = r.activity.blocks.find((x) => x.id === r.added[0].id);
      return JSON.stringify([b.text, b.prompts, b.prompt, b.frame, b.hint]);
    };
    assert.equal(
      count(strings(both), BLANK),
      2 * count(strings(en), BLANK),
      `${o.id}: blanks double with Spanish`,
    );
  }
});

test("blocks are placed where students meet them and never between existing questions", () => {
  const a = mathActivity();
  const at = (id) => addLanguageSupport(a, id).activity.blocks.map((b) => b.id);
  const original = a.blocks.map((b) => b.id);
  const firstQ = original.indexOf(questionsOf(a)[0].id);
  const lastQ = original.lastIndexOf(questionsOf(a).at(-1).id);
  assert.equal(
    at("language-objective").indexOf("ls-language-objective"),
    original.indexOf("v1"),
    "objective sits before the first non-text block",
  );
  assert.equal(
    at("sentence-frames").indexOf("ls-sentence-frames"),
    firstQ,
    "frames sit just before the first question",
  );
  assert.equal(
    at("explanation-task").indexOf("ls-explanation-task"),
    lastQ + 1,
    "tasks follow the last question",
  );
  assert.equal(at("explanation-task").at(-1), "n1", "the teacher note stays last");
});

test("supports are one-time, deterministic, never mutate the input, and respect the block limit", () => {
  const a = deepFreeze(mathActivity());
  const one = addLanguageSupport(a, "sentence-frames");
  assert.deepEqual(addLanguageSupport(a, "sentence-frames"), one, "same input, same output");
  const again = languageSupportOptions(one.activity).find((o) => o.id === "sentence-frames");
  assert.equal(again.done, true);
  assert.equal(again.available, false);
  assert.equal(
    addLanguageSupport(one.activity, "sentence-frames").ok,
    false,
    "a second copy is refused",
  );
  assert.throws(() => addLanguageSupport(a, "nope"), RangeError);
  const full = normalizeActivity({
    ...mathActivity(),
    blocks: Array.from({ length: 80 }, (_, i) => ({
      id: `t${i}`,
      type: "text",
      text: "x",
    })).concat(),
  });
  const refused = languageSupportOptions(full).find((o) => o.id === "oral-rehearsal");
  assert.equal(refused.available, false);
});

test("visual vocabulary turns on only the pictures that exist", () => {
  const withPicture = normalizeActivity({
    ...mathActivity(),
    blocks: [
      {
        id: "v1",
        type: "vocab",
        items: [
          {
            id: "w1",
            term: "ratio",
            def: "x",
            image: { src: "/access-practice-lab/pictures/ui-icons.svg", alt: "icons" },
          },
        ],
      },
      ...mathActivity().blocks.filter((b) => b.type === "question"),
    ],
  });
  const opt = languageSupportOptions(withPicture).find((o) => o.id === "visual-vocabulary");
  const src = withPicture.blocks[0].items[0].image?.src;
  if (src) {
    assert.equal(opt.available, true);
    const r = addLanguageSupport(withPicture, "visual-vocabulary");
    assert.equal(r.activity.supports.visuals, true);
    assert.equal(
      r.activity.blocks.length,
      withPicture.blocks.length,
      "no block added, only the setting",
    );
    assert.equal(r.added[0].kind, "setting");
    assert.equal(
      languageSupportOptions(r.activity).find((o) => o.id === "visual-vocabulary").available,
      false,
    );
  } else assert.equal(opt.available, false, "no usable picture, no option");
});

test("written-response supports appear only when the activity has a written response or reading", () => {
  const withShort = normalizeActivity({
    ...mathActivity(),
    blocks: [
      ...mathActivity().blocks,
      {
        id: "p1",
        type: "passage",
        title: "Read",
        text: "Maya mixed paint. She used two cups of blue and three cups of yellow.",
      },
      {
        id: "s1",
        type: "question",
        format: "short",
        kind: "explain",
        prompt: "Explain your mixing.",
      },
    ],
  });
  const on = Object.fromEntries(languageSupportOptions(withShort).map((o) => [o.id, o.available]));
  for (const id of ["claim-evidence-reasoning", "paragraph-organizer", "writing-revision"])
    assert.equal(on[id], true, id);
  const cer = addLanguageSupport(withShort, "claim-evidence-reasoning");
  const block = cer.activity.blocks.find((b) => b.id === cer.added[0].id);
  assert.equal(block.kind, "claim-evidence");
  assert.match(
    block.prompts[1],
    /The text says/,
    "evidence frame uses the reading when there is one",
  );
  assert.equal(
    addLanguageSupport(withShort, "sentence-expansion").activity.blocks.some((b) =>
      /Maya|ratio of cats/.test(b.prompt || ""),
    ),
    true,
    "kernel is a sentence from the activity itself",
  );
});

// ── the editor panel (jsdom) ────────────────────────────────────────────────

test("the panel lists this activity's options, adds with one click, and Undo goes through the store", async () => {
  const dom = new JSDOM('<!doctype html><body><div id="st-live"></div></body>');
  Object.assign(globalThis, { document: dom.window.document, Node: dom.window.Node });
  const { createLanguagePanel } = await import(
    "../access-practice-lab/src/studio/editor/language-panel.js"
  );
  const store = createStore(mathActivity());
  const S = (en) => en;
  const panel = createLanguagePanel(store, { S });
  document.body.append(panel.el);
  panel.render();
  const rows = [...panel.el.querySelectorAll("li[data-option]")];
  assert.equal(rows.length, OPTION_IDS.length);
  const unavailable = rows.filter((r) => r.dataset.available === "false");
  assert.ok(unavailable.length > 0);
  for (const r of unavailable) {
    assert.match(r.textContent, /Not available: /, "says why");
    assert.equal(r.querySelector("button"), null, "no button for an unavailable support");
  }
  const before = JSON.stringify(store.get().blocks);
  panel.el.querySelector('button[data-option="because-but-so"]').click();
  assert.ok(
    store.get().blocks.some((b) => b.id === "ls-because-but-so"),
    "added by one click",
  );
  assert.ok(store.get().lineage.added.includes("ls-because-but-so"));
  const row = panel.el.querySelector('li[data-option="because-but-so"]');
  assert.match(row.textContent, /Added/);
  assert.equal(row.querySelector("button"), null);
  assert.match(panel.el.querySelector(".st-lang-result").textContent, /Please review/);
  panel.el.querySelector('button[data-act="lang-undo"]').click();
  assert.equal(JSON.stringify(store.get().blocks), before, "Undo restores exactly what was there");
  assert.equal(panel.el.querySelector(".st-lang-result"), null);
  assert.ok(
    panel.el.querySelector('button[data-option="because-but-so"]'),
    "available again after Undo",
  );
  // Spanish on: the block carries both languages.
  const box = [...panel.el.querySelectorAll("input[type=checkbox]")][0];
  box.checked = true;
  box.dispatchEvent(new dom.window.Event("change"));
  panel.el.querySelector('button[data-option="because-but-so"]').click();
  assert.match(
    store.get().blocks.find((b) => b.id === "ls-because-but-so").text,
    /Porque, pero, así que/,
  );
  panel.destroy();
});
