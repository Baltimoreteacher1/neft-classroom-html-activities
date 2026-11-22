// Book Studio support editions (access-practice-lab/src/book/editions.js): an edition keeps the story exactly and
// carries only the supports its level would be given. Run by `npm test`.

import assert from "node:assert/strict";
import test from "node:test";

import {
  compareEditions,
  createEdition,
  EDITION_KIND,
  editionLevel,
  isEdition,
  sameStory,
  storyFingerprint,
  supportsForPlan,
} from "../access-practice-lab/src/book/editions.js";
import { planForLevel } from "../access-practice-lab/src/book/lang/profiles.js";
import { makeSupport } from "../access-practice-lab/src/book/lang/supports.js";
import {
  cloneWithNewIds,
  makeElement,
  newBook,
  normalizeBook,
} from "../access-practice-lab/src/book/model.js";

function sampleBook() {
  const base = newBook({ kind: "blank", title: "The Fox", author: "Mr. Neft" });
  const pages = base.pages.slice(0, 2);
  while (pages.length < 2) pages.push(JSON.parse(JSON.stringify(pages[0])));
  pages[0].elements = [makeElement("text", { html: "<p>The fox ran to the cave.</p>" })];
  pages[1].elements = [
    makeElement("text", { html: "<p>It was dark inside.</p>" }),
    makeElement("text", { html: "<p>The fox was brave.</p>" }),
  ];
  const S = (title, props) =>
    makeSupport("frame", "starter", { title, content: { frames: [`${title} ___`] }, ...props });
  const supports = [
    S("heavy-L1", {
      levels: [1],
      intensity: "heavy",
      target: { scope: "page", pageId: pages[0].id },
    }),
    S("moderate-L3", { levels: [3], intensity: "moderate" }),
    S("minimal-L5", { levels: [5], intensity: "minimal" }),
    S("required-any", {
      levels: [],
      intensity: "minimal",
      required: true,
      target: { scope: "element", pageId: pages[1].id, elementId: pages[1].elements[0].id },
    }),
    S("heavy-any", { levels: [], intensity: "heavy" }),
    S("teacher-note", { levels: [], intensity: "minimal", authoringOnly: true }),
  ];
  return normalizeBook({ ...base, pages, supports });
}
const titles = (book) => book.supports.map((s) => s.title).sort();

test("the story fingerprint ignores ids and supports but notices any change to the words or their order", () => {
  const book = sampleBook();
  assert.equal(
    storyFingerprint(book).hash,
    storyFingerprint(cloneWithNewIds(book)).hash,
    "new ids, same story",
  );
  assert.equal(
    storyFingerprint(book).hash,
    storyFingerprint({ ...book, supports: [] }).hash,
    "supports are not the story",
  );
  const edited = cloneWithNewIds(book);
  edited.pages[0].elements[0].html = "<p>The fox ran to the barn.</p>";
  assert.notEqual(storyFingerprint(book).hash, storyFingerprint(edited).hash, "one word changed");
  const swapped = cloneWithNewIds(book);
  swapped.pages.reverse();
  assert.notEqual(
    storyFingerprint(book).hash,
    storyFingerprint(swapped).hash,
    "page order matters",
  );
  const spaced = cloneWithNewIds(book);
  spaced.pages[0].elements[0].html = "<p>The   fox ran  to the cave.</p>";
  assert.ok(sameStory(book, spaced), "extra spaces are not a change");
  assert.equal(storyFingerprint(book).words, 14);
});

test("each level gets only the supports it would be given", () => {
  const book = sampleBook();
  const kept = (n) => titles(createEdition(book, { level: n }).book);
  assert.deepEqual(kept(1), ["heavy-L1", "heavy-any", "required-any"]);
  assert.deepEqual(
    kept(3),
    ["moderate-L3", "required-any"],
    "a moderate plan drops a heavy support",
  );
  assert.deepEqual(kept(5), ["minimal-L5", "required-any"]);
  assert.deepEqual(
    kept(6),
    ["heavy-any", "required-any"],
    "help on demand keeps what is for any level, not level-specific ones",
  );
  for (const n of [1, 2, 3, 4, 5, 6])
    assert.ok(
      !kept(n).includes("teacher-note"),
      `authoring-only notes never reach a student edition (level ${n})`,
    );
});

test("an edition is a new book with the same story, its own plan, and its supports marked as published", () => {
  const book = sampleBook();
  const before = JSON.stringify(book);
  const {
    book: ed,
    kept,
    left,
    level,
  } = createEdition(book, { level: 1, label: "Starting support" });
  assert.equal(JSON.stringify(book), before, "the original is not changed");
  assert.notEqual(ed.id, book.id);
  assert.equal(ed.title, "The Fox · Starting support");
  assert.deepEqual(ed.source, { kind: EDITION_KIND, id: book.id, label: "The Fox" });
  assert.ok(isEdition(ed) && !isEdition(book));
  assert.equal(editionLevel(ed), 1);
  assert.equal(editionLevel(book), 0);
  assert.equal(ed.plan.profile, 1);
  assert.equal(ed.plan.intensity, "heavy");
  assert.ok(ed.supports.every((s) => s.inPublished === true));
  assert.deepEqual([kept, left, level], [3, 3, 1]);
  assert.ok(sameStory(book, ed));
  assert.equal(ed.status, "draft");
});

test("supports that point at a page or element follow it to the edition's own ids", () => {
  const book = sampleBook();
  const { book: ed } = createEdition(book, { level: 1 });
  const pageSupport = ed.supports.find((s) => s.title === "heavy-L1");
  assert.equal(pageSupport.target.pageId, ed.pages[0].id);
  assert.notEqual(pageSupport.target.pageId, book.pages[0].id);
  const elSupport = ed.supports.find((s) => s.title === "required-any");
  assert.equal(elSupport.target.elementId, ed.pages[1].elements[0].id);
});

test("a blank label falls back to the level's name; an impossible level is refused", () => {
  const book = sampleBook();
  assert.match(createEdition(book, { level: 2 }).book.title, /· Emerging$/);
  for (const bad of [0, 7, -1, 1.5, "x", undefined])
    assert.throws(() => createEdition(book, { level: bad }), /1 to 6/, String(bad));
});

test("compare says whether the story matches and what differs in supports", () => {
  const book = sampleBook();
  const a = createEdition(book, { level: 1 }).book;
  const b = createEdition(book, { level: 5 }).book;
  const cmp = compareEditions(a, b);
  assert.equal(cmp.sameStory, true);
  assert.deepEqual(
    cmp.shared.map((s) => s.title),
    ["required-any"],
  );
  assert.deepEqual(cmp.onlyA.map((s) => s.title).sort(), ["heavy-L1", "heavy-any"]);
  assert.deepEqual(
    cmp.onlyB.map((s) => s.title),
    ["minimal-L5"],
  );
  assert.deepEqual([cmp.a.supports, cmp.b.supports], [3, 2]);
  assert.equal(cmp.a.words, cmp.b.words);
  const orig = compareEditions(book, a);
  assert.equal(orig.sameStory, true);
  assert.ok(
    orig.onlyA.map((s) => s.title).includes("moderate-L3"),
    "the original still carries everything",
  );
});

test("compare notices when an edition's story has drifted from the original", () => {
  const book = sampleBook();
  const { book: ed } = createEdition(book, { level: 3 });
  ed.pages[1].elements[1].html = "<p>The fox was scared.</p>";
  assert.equal(compareEditions(book, ed).sameStory, false);
});

test("the same support in two copies matches even though every id differs, and different pages do not", () => {
  const book = sampleBook();
  const c1 = createEdition(book, { level: 1 }).book;
  const c2 = createEdition(book, { level: 1 }).book;
  assert.deepEqual(compareEditions(c1, c2).onlyA, []);
  c2.supports.find((s) => s.title === "heavy-L1").target.pageId = c2.pages[1].id;
  assert.equal(
    compareEditions(c1, c2).onlyA.length,
    1,
    "the same support moved to another page is a difference",
  );
});

test("supportsForPlan agrees with the plan for each level", () => {
  const supports = sampleBook().supports;
  const names = (n) =>
    supportsForPlan(supports, planForLevel(n))
      .map((s) => s.title)
      .sort();
  assert.deepEqual(
    names(2),
    ["heavy-any", "required-any"],
    "level 2 is heavy but has no level-2 support of its own",
  );
  assert.deepEqual(names(4), ["required-any"]);
});

test("a required support is kept even at a level whose intensity would otherwise drop it", () => {
  const book = sampleBook();
  const required = makeSupport("frame", "starter", {
    title: "required-heavy",
    levels: [],
    intensity: "heavy",
    required: true,
    content: { frames: ["x ___"] },
  });
  const ed = createEdition({ ...book, supports: [...book.supports, required] }, { level: 5 }).book;
  assert.ok(titles(ed).includes("required-heavy"), "required beats the intensity limit");
  assert.ok(
    !titles(ed).includes("heavy-any"),
    "an ordinary heavy support is still dropped at level 5",
  );
});

test("a plan that assigns nothing keeps only required supports and offers nothing on request", () => {
  const supports = sampleBook().supports;
  const none = {
    profile: 3,
    intensity: "none",
    domains: { listening: "none", speaking: "none", reading: "none", writing: "none" },
  };
  assert.deepEqual(
    supportsForPlan(supports, none).map((s) => s.title),
    ["required-any"],
  );
});

test("the wording of a choice is part of the story", () => {
  const book = sampleBook();
  book.pages[0].choices = [
    {
      id: "c1",
      label: "Go into the cave",
      lockedText: "You need a torch first.",
      to: book.pages[1].id,
    },
  ];
  const edited = cloneWithNewIds(book);
  assert.equal(storyFingerprint(book).hash, storyFingerprint(edited).hash);
  edited.pages[0].choices[0].label = "Run away";
  assert.notEqual(storyFingerprint(book).hash, storyFingerprint(edited).hash);
  const locked = cloneWithNewIds(book);
  locked.pages[0].choices[0].lockedText = "Find a torch first.";
  assert.notEqual(
    storyFingerprint(book).hash,
    storyFingerprint(locked).hash,
    "the locked-choice text is story too",
  );
});
