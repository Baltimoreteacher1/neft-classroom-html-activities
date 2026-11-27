// Parallel differentiation workspace: the version cards come from the engine (tiers, change records, rigor, comparison),
// each saves as its OWN draft with lineage, variants show their seed and are never claimed equivalent, and the panel
// (jsdom) lays cards out, loads previews lazily, and offers Open / Duplicate / Discard.
//   node --test tools/studio-x-compare.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { generateMath } from "../access-practice-lab/src/studio/core/mathgen.js";
import {
  normalizeActivity,
  questionsOf,
  TIERS,
} from "../access-practice-lab/src/studio/core/schema.js";
import { createStore } from "../access-practice-lab/src/studio/editor/store.js";

// A device-storage stand-in: drafts.js reads and writes localStorage.
const data = new Map();
globalThis.localStorage = {
  getItem: (k) => (data.has(k) ? data.get(k) : null),
  setItem: (k, v) => void data.set(k, String(v)),
  removeItem: (k) => void data.delete(k),
  get length() {
    return data.size;
  },
  key: (i) => [...data.keys()][i] ?? null,
};
Object.defineProperty(globalThis.localStorage, "__keys", { value: () => [...data.keys()] });

const { makeCards, fadingOf, variantCard, stayedSame } = await import(
  "../access-practice-lab/src/studio/editor/compare-model.js"
);
const { asDraft, duplicateCard, saveCard } = await import(
  "../access-practice-lab/src/studio/editor/compare-save.js"
);
const { getLocal, loadAll, ID_RE } = await import("../access-practice-lab/src/studio/drafts.js");

const deepFreeze = (o) => {
  for (const v of Object.values(o)) if (v && typeof v === "object") deepFreeze(v);
  return Object.freeze(o);
};
const PASSAGE =
  "Maya mixed paint for the school mural. She used two cups of blue paint for every three cups of yellow paint. The colors blended into a bright green. Her friends asked how much blue she would need for a bigger wall.";
const activity = () =>
  normalizeActivity({
    id: "s0a1b2c3d4",
    title: "Mural paint",
    kind: "worksheet",
    context: { grade: "6", subject: "Math", objective: "Use ratios to mix paint." },
    blocks: [
      {
        id: "d1",
        type: "text",
        role: "directions",
        text: "Read the passage. Then answer each question. Show your thinking.",
      },
      {
        id: "v1",
        type: "vocab",
        items: [
          {
            id: "w1",
            term: "ratio",
            def: "A comparison of two amounts.",
            es: "razón",
            example: "The ratio of blue to yellow is 2 to 3.",
          },
          { id: "w2", term: "unit rate", def: "An amount for one.", es: "tasa unitaria" },
        ],
      },
      { id: "p1", type: "passage", title: "Mural", text: PASSAGE },
      {
        id: "qc",
        type: "question",
        format: "choice",
        prompt: "What color did the paints make?",
        options: [
          { id: "a", text: "Green" },
          { id: "b", text: "Red" },
          { id: "c", text: "Black" },
        ],
        answer: "a",
        hint: "Think about blue and yellow.",
        explanation: "Blue and yellow make green.",
      },
      {
        id: "qb",
        type: "question",
        format: "blank",
        prompt: "Fill in the word.",
        text: "Two to three is a [[ratio]].",
      },
      {
        id: "qs",
        type: "question",
        format: "short",
        kind: "explain",
        prompt: "Explain how much blue Maya needs for six cups of yellow.",
      },
      ...generateMath({ topic: "percent", grade: 6, count: 3, seed: 5 }),
      { id: "n1", type: "note", text: "Teacher note." },
    ],
  });

// ── the model ───────────────────────────────────────────────────────────────

test("makeCards: the standard activity plus one card per engine tier, from the engine's own records", () => {
  const a = deepFreeze(activity());
  const { cards } = makeCards(a);
  assert.deepEqual(
    cards.slice(0, 5).map((c) => c.key),
    ["standard", ...TIERS],
  );
  assert.equal(cards[0].activity, a, "the standard card is the activity itself");
  const ids = new Set(cards.map((c) => c.activity.id));
  assert.equal(ids.size, cards.length, "every version has its own id");
  for (const c of cards.slice(1)) {
    assert.match(c.activity.id, ID_RE, `${c.key}: a draft id`);
    assert.equal(c.activity.lineage.variantOf, a.id, `${c.key}: lineage names the parent`);
    assert.ok(c.title.en && c.title.es);
  }
  for (const c of cards.filter((x) => x.kind === "tier")) {
    assert.equal(c.rigor.ok, true, `${c.key}: rigor ${JSON.stringify(c.rigor.problems)}`);
    assert.equal(c.activity.lineage.tier, c.key);
    assert.ok(c.about.en && c.about.es, `${c.key}: says who it is for`);
    assert.ok(c.same.length >= 3, `${c.key}: lists what stayed the same`);
    assert.ok(c.same.every((s) => s.en && s.es));
  }
  const emerging = cards.find((c) => c.key === "emerging");
  assert.ok(emerging.changes.length > 0, "Emerging lists what changed");
  assert.ok(emerging.changes.every((x) => x.en && x.es));
});

test("what stayed the same is computed, so a change is never listed as unchanged", () => {
  const a = activity();
  const { cards } = makeCards(a);
  const emerging = cards.find((c) => c.key === "emerging");
  const lines = emerging.same.map((s) => s.en);
  assert.ok(lines.some((l) => /original questions are still there/.test(l)));
  assert.ok(lines.some((l) => /answer keys are the same/.test(l)));
  assert.ok(lines.some((l) => /reading passage is the same/.test(l)));
  assert.ok(
    !lines.some((l) => /directions are worded the same/.test(l)),
    "directions were split into steps, so they are not 'the same'",
  );
  const prompt = structuredClone(emerging.activity);
  questionsOf(prompt)[0].prompt = "Changed wording";
  const rigor = { problems: [{ code: "prompt" }, { code: "key" }] };
  const s = stayedSame(a, prompt, rigor).map((x) => x.en);
  assert.ok(!s.some((l) => /worded the same|answer keys are the same/.test(l)));
});

test("shorter practice is offered only where the engine can shorten, and the rigor warning is kept", () => {
  const { cards, notes } = makeCards(activity());
  const shorter = cards.find((c) => c.key === "shorter");
  if (!shorter) return assert.ok(notes.length > 0, "if not offered, the engine's reason is kept");
  assert.equal(shorter.rigor.ok, false, "removing questions is flagged");
  assert.ok(shorter.rigor.problems.some((p) => p.code === "dropped"));
  assert.ok(!shorter.same.some((s) => /original questions are still there/.test(s.en)));
  assert.equal(shorter.activity.lineage.variantOf, "s0a1b2c3d4");
  assert.ok(questionsOf(shorter.activity).length < questionsOf(activity()).length);
  const one = normalizeActivity({
    ...activity(),
    blocks: [{ id: "q1", type: "question", format: "short", prompt: "Say it." }],
  });
  const small = makeCards(one);
  assert.equal(
    small.cards.find((c) => c.key === "shorter"),
    undefined,
    "nothing to remove, no card",
  );
  assert.ok(small.notes.every((n) => n.en && n.es));
});

test("scaffold fading is reported from the engine's counts and only when support really falls", () => {
  const { cards, fading } = makeCards(activity());
  assert.ok(fading, "frames fade across the tiers for this activity");
  const counts = fading.frames.map((f) => f.count);
  assert.deepEqual(
    counts,
    [...counts].sort((x, y) => y - x),
    "never rises",
  );
  assert.ok(counts[0] > counts.at(-1));
  assert.equal(fadingOf(cards.filter((c) => c.kind !== "tier")), null);
  const flat = cards.map((c) =>
    c.kind === "tier" ? { ...c, support: { ...c.support, frameCount: 2 } } : c,
  );
  assert.equal(fadingOf(flat), null, "no fading claimed when the counts do not fall");
});

test("variantCard: seed and mode shown, same seed same bytes, never claimed equivalent, original untouched", () => {
  const a = deepFreeze(activity());
  const v = variantCard(a, { seed: 7, mode: "numbers" });
  assert.equal(v.seed, 7);
  assert.equal(v.mode, "numbers");
  assert.ok(v.note.en && v.note.es);
  assert.match(v.note.en, /not a copy of the same test/);
  assert.deepEqual(variantCard(a, { seed: 7, mode: "numbers" }).activity, v.activity);
  assert.notDeepEqual(
    questionsOf(variantCard(a, { seed: 8, mode: "numbers" }).activity),
    questionsOf(v.activity),
  );
  assert.ok(v.changes.length > 0 && v.changes.every((c) => c.en && c.es));
  assert.ok(
    !v.same.some((s) => /answer keys are the same/.test(s.en)),
    "answers changed, so not 'the same'",
  );
  assert.equal(v.rigor.ok, true, "no rigor alert: differences are the point");
  assert.throws(() => variantCard(a, { seed: 1.5, mode: "numbers" }), TypeError);
  assert.throws(() => variantCard(a, { seed: 1, mode: "nope" }), RangeError);
  assert.equal(variantCard(a, { seed: 2, mode: "reorder" }).mode, "reorder");
});

// ── saving ──────────────────────────────────────────────────────────────────

test("Open saves a version as its OWN draft with lineage; editing one never changes another", () => {
  data.clear();
  const a = activity();
  const { cards } = makeCards(a);
  const [, emerging, , expanding] = cards;
  const id1 = saveCard(emerging, a);
  const id2 = saveCard(expanding, a);
  assert.notEqual(id1, id2);
  assert.match(id1, ID_RE);
  assert.equal(saveCard(emerging, a), id1, "saving the same card twice reuses its draft");
  assert.deepEqual(
    Object.keys(loadAll()).sort(),
    [id1, id2].sort(),
    "the parent was not written over",
  );
  assert.equal(getLocal(a.id), null);
  const saved = getLocal(id1).activity;
  assert.equal(saved.lineage.variantOf, a.id);
  assert.equal(saved.lineage.tier, "emerging");
  const other = JSON.stringify(getLocal(id2).activity);
  expanding.activity = { ...expanding.activity };
  assert.equal(JSON.stringify(getLocal(id2).activity), other, "drafts are independent records");
  const v = variantCard(a, { seed: 3, mode: "reorder" });
  const vid = saveCard(v, a);
  assert.equal(
    getLocal(vid).activity.lineage.variantOf,
    a.id,
    "a variant of an activity with no lineage still records its parent",
  );
  assert.match(vid, ID_RE, "the variant's deterministic id is replaced by a draft id");
  const copy = duplicateCard(v, "Copy of");
  assert.notEqual(copy.id, vid);
  assert.match(getLocal(copy.id).activity.title, /^Copy of /);
  assert.equal(getLocal(copy.id).activity.lineage.variantOf, a.id);
});

test("asDraft never reuses an id that is already saved", () => {
  data.clear();
  const a = activity();
  const { cards } = makeCards(a);
  const d = asDraft(cards[1].activity, a);
  assert.notEqual(d.id, cards[1].activity.id);
  assert.equal(d.rev, 0);
});

// ── the panel ───────────────────────────────────────────────────────────────

test("the panel: Make versions, lazy previews, Open / Duplicate / Discard, another version with its seed", async () => {
  data.clear();
  const dom = new JSDOM('<!doctype html><body><div id="st-live"></div></body>');
  const watchers = [];
  globalThis.IntersectionObserver = class {
    constructor(cb) {
      this.cb = cb;
      watchers.push(this);
    }
    observe(el) {
      this.el = el;
    }
    disconnect() {
      this.done = true;
    }
  };
  Object.assign(globalThis, { document: dom.window.document, Node: dom.window.Node });
  globalThis.fetch = async () => ({ ok: true, text: async () => "/* stub */" });
  const { createComparePanel } = await import(
    "../access-practice-lab/src/studio/editor/compare-panel.js"
  );
  const store = createStore(activity());
  const opened = [];
  const panel = createComparePanel(store, {
    S: (en) => en,
    lang: "en",
    onOpen: (id) => opened.push(id),
  });
  document.body.append(panel.el);
  panel.render();
  assert.equal(panel.el.querySelector(".st-cmp-card"), null, "nothing until the button is pressed");
  const before = JSON.stringify(store.get());
  panel.el.querySelector('button[data-act="make"]').click();
  const cards = [...panel.el.querySelectorAll(".st-cmp-card")];
  assert.ok(cards.length >= 5, `standard + four tiers (+ shorter): ${cards.length}`);
  assert.equal(JSON.stringify(store.get()), before, "making versions never changes the activity");
  assert.equal(Object.keys(loadAll()).length, 0, "nothing saved until Open");
  assert.equal(panel.el.querySelector(".st-cmp-grid").getAttribute("role"), "region");
  assert.equal(panel.el.querySelectorAll("iframe").length, 0, "previews are lazy");
  const waiting = watchers.filter((w) => !w.done);
  assert.equal(waiting.length, cards.length);
  waiting[1].cb([{ isIntersecting: true }]);
  await new Promise((r) => setTimeout(r, 50));
  const frames = panel.el.querySelectorAll("iframe");
  assert.equal(frames.length, 1, "only the visible card loaded");
  assert.match(frames[0].getAttribute("sandbox"), /allow-scripts/);
  assert.ok(
    !/allow-same-origin/.test(frames[0].getAttribute("sandbox")),
    "sandboxed from this site",
  );
  assert.ok(
    frames[0].srcdoc.includes("<html") || frames[0].srcdoc.length > 100,
    "a real student page",
  );
  const emerging = panel.el.querySelector('[data-card="emerging"]');
  assert.match(emerging.textContent, /What changed/);
  assert.match(emerging.textContent, /What stayed the same/);
  assert.match(emerging.textContent, /More language support/);
  assert.ok(emerging.querySelector('button[data-act="open"]'));
  assert.ok(emerging.querySelector('button[data-act="duplicate"]'));
  assert.ok(emerging.querySelector('button[data-act="discard"]'));
  const shorter = panel.el.querySelector('[data-card="shorter"]');
  if (shorter) assert.ok(shorter.querySelector('[role="alert"]'), "the rigor warning is shown");
  assert.equal(
    panel.el.querySelector('[data-card="emerging"] [role="alert"]'),
    null,
    "no warning when rigor holds",
  );
  assert.equal(panel.el.querySelector('[data-card="standard"] button[data-act="open"]'), null);

  // Discard removes an unsaved card; Open saves its own draft and navigates.
  const count = cards.length;
  panel.el.querySelector('[data-card="expanding"] button[data-act="discard"]').click();
  assert.equal(panel.el.querySelectorAll(".st-cmp-card").length, count - 1);
  panel.el.querySelector('[data-card="emerging"] button[data-act="open"]').click();
  assert.equal(opened.length, 1);
  const draft = getLocal(opened[0]).activity;
  assert.equal(draft.lineage.variantOf, store.get().id);
  assert.equal(draft.lineage.tier, "emerging");
  assert.equal(panel.el.querySelector('[data-card="emerging"]').dataset.saved, "true");
  assert.equal(
    panel.el.querySelector('[data-card="emerging"] button[data-act="discard"]'),
    null,
    "a saved draft is not discarded from here",
  );
  panel.el.querySelector('[data-card="developing"] button[data-act="duplicate"]').click();
  assert.equal(Object.keys(loadAll()).length, 2, "the duplicate is its own saved draft");

  // Another version of this: seed shown, not claimed equivalent.
  const seed = panel.el.querySelector('input[type="number"]');
  seed.value = "7";
  seed.dispatchEvent(new dom.window.Event("input"));
  panel.el.querySelector('button[data-act="variant"]').click();
  const variant = [...panel.el.querySelectorAll(".st-cmp-card")].find((c) =>
    /Seed 7/.test(c.textContent),
  );
  assert.ok(variant, "the variant card shows its seed");
  assert.match(variant.textContent, /Not claimed equivalent/);
  assert.match(variant.textContent, /New numbers/);
  panel.destroy();
});
