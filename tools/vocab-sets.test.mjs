// Vocabulary sets (access-practice-lab/src/vocab-sets/model.js): parsing, cleaning, practice rounds, share links.
// Run by `npm test` (tools/run-tests.mjs walks *.test.mjs).

import assert from "node:assert/strict";
import test from "node:test";

import {
  cleanSet,
  clozeRounds,
  decodeShare,
  encodeShare,
  itemsToText,
  LIMITS,
  matchRound,
  mulberry32,
  parseWordList,
  quizRounds,
  sameAnswer,
  shuffle,
} from "../access-practice-lab/src/vocab-sets/model.js";

const WORDS = [
  {
    id: "a",
    term: "habitat",
    definition: "the place where a plant or animal lives",
    example: "A pond is a habitat for frogs.",
    translation: "hábitat",
  },
  {
    id: "b",
    term: "predator",
    definition: "an animal that hunts other animals",
    example: "The owl is a predator.",
    translation: "depredador",
  },
  {
    id: "c",
    term: "adapt",
    definition: "to change to fit a new place",
    example: "Some birds adapted to the cold.",
    translation: "adaptarse",
  },
  {
    id: "d",
    term: "prey",
    definition: "an animal that is hunted",
    example: "",
    translation: "presa",
  },
  {
    id: "e",
    term: "survive",
    definition: "to stay alive",
    example: "Plants need water to survive.",
    translation: "sobrevivir",
  },
];

test("parseWordList reads pipe lines and spreadsheet tabs, skips a header and blank lines", () => {
  const text =
    "Word | Definition | Example | Translation\n\nhabitat | where it lives | A pond is a habitat. | hábitat\nprey\tan animal that is hunted\t\tpresa\n";
  const { items, errors } = parseWordList(text);
  assert.deepEqual(errors, []);
  assert.equal(items.length, 2);
  assert.deepEqual(items[0], {
    term: "habitat",
    definition: "where it lives",
    example: "A pond is a habitat.",
    translation: "hábitat",
  });
  assert.deepEqual(items[1], {
    term: "prey",
    definition: "an animal that is hunted",
    example: "",
    translation: "presa",
  });
});

test("parseWordList reports problems by line and keeps the good rows", () => {
  const long = "x".repeat(LIMITS.term + 1);
  const { items, errors } = parseWordList(
    `habitat | a place\n | no term here\nHabitat | again\n${long} | too long\nprey | hunted`,
  );
  assert.deepEqual(
    items.map((i) => i.term),
    ["habitat", "prey"],
  );
  assert.deepEqual(errors, [
    { line: 2, key: "term_missing" },
    { line: 3, key: "duplicate" },
    { line: 4, key: "too_long" },
  ]);
});

test("parseWordList caps the set size instead of silently dropping the rest", () => {
  const text = Array.from({ length: LIMITS.items + 3 }, (_, i) => `word${i} | def`).join("\n");
  const { items, errors } = parseWordList(text);
  assert.equal(items.length, LIMITS.items);
  assert.equal(errors.length, 3);
  assert.ok(errors.every((e) => e.key === "too_many"));
});

test("itemsToText round-trips through parseWordList", () => {
  const back = parseWordList(itemsToText(WORDS)).items;
  assert.deepEqual(
    back,
    WORDS.map(({ id, ...rest }) => rest),
  );
});

test("cleanSet normalizes, drops duplicates and refuses an unusable set", () => {
  const set = cleanSet({
    title: "  Animals  ",
    band: "9-12",
    items: [...WORDS, { term: "HABITAT", definition: "dup" }, { term: "", definition: "x" }],
  });
  assert.equal(set.title, "Animals");
  assert.equal(set.band, "all", "unknown band falls back");
  assert.equal(set.items.length, WORDS.length);
  assert.equal(cleanSet({ title: "Empty", items: [] }), null);
  assert.equal(cleanSet({ title: "", items: WORDS }), null);
  assert.equal(cleanSet("nope"), null);
  assert.ok(
    /^[\w-]+$/.test(cleanSet({ title: "T", id: "bad id!", items: WORDS }).id),
    "an unsafe id is replaced",
  );
});

test("clozeRounds blanks the word as written, allows short endings, and counts what it skipped", () => {
  const { rounds, skipped } = clozeRounds(WORDS);
  assert.equal(skipped, 1, "prey has no example");
  const byTerm = Object.fromEntries(rounds.map((r) => [r.term, r]));
  assert.equal(byTerm.habitat.prompt, "A pond is a _____ for frogs.");
  assert.equal(byTerm.habitat.answer, "habitat");
  assert.equal(byTerm.adapt.answer, "adapted", "the ending is part of the answer");
  assert.equal(byTerm.adapt.prompt, "Some birds _____ to the cold.");
  assert.ok(
    rounds.every((r) => !r.prompt.toLowerCase().includes(r.answer.toLowerCase())),
    "the answer never stays in the prompt",
  );
});

test("clozeRounds is safe with regex characters and does not match inside longer words", () => {
  const { rounds, skipped } = clozeRounds([
    {
      id: "x",
      term: "c++",
      definition: "a language",
      example: "She writes c++ daily.",
      translation: "",
    },
    {
      id: "y",
      term: "art",
      definition: "creative work",
      example: "The party started.",
      translation: "",
    },
  ]);
  assert.equal(rounds.length, 1);
  assert.equal(rounds[0].answer, "c++");
  assert.equal(skipped, 1, "'art' inside 'party' must not count");
});

test("sameAnswer ignores case, spacing and a final period only", () => {
  assert.ok(sameAnswer("  Habitat. ", "habitat"));
  assert.ok(!sameAnswer("habitats", "habitat"));
  assert.ok(!sameAnswer("", "habitat"));
});

test("quizRounds: the answer is always an option, options are distinct real terms, and it is repeatable", () => {
  const rng1 = mulberry32(7);
  const rounds = quizRounds(WORDS, rng1);
  assert.equal(rounds.length, WORDS.length);
  const terms = new Set(WORDS.map((w) => w.term));
  for (const r of rounds) {
    assert.ok(r.options.includes(r.answer));
    assert.equal(new Set(r.options).size, r.options.length);
    assert.ok(r.options.every((o) => terms.has(o)));
    assert.equal(r.options.length, 4);
  }
  assert.deepEqual(quizRounds(WORDS, mulberry32(7)), rounds, "same seed, same round");
  const tiny = quizRounds(WORDS.slice(0, 2), mulberry32(1));
  assert.ok(
    tiny.every((r) => r.options.length === 2),
    "a small set offers only what exists",
  );
});

test("matchRound pairs every term with its own definition, in different orders", () => {
  const round = matchRound(WORDS, mulberry32(3), 4);
  assert.equal(round.terms.length, 4);
  assert.equal(round.definitions.length, 4);
  const ids = new Set(round.terms.map((t) => t.id));
  assert.deepEqual([...ids].sort(), round.definitions.map((d) => d.id).sort());
  for (const d of round.definitions) {
    const w = WORDS.find((x) => x.id === d.id);
    assert.equal(d.text, w.definition);
  }
});

test("shuffle keeps every element and does not change the input", () => {
  const input = [1, 2, 3, 4, 5, 6];
  const out = shuffle(input, mulberry32(11));
  assert.deepEqual(input, [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(out.slice().sort(), input);
});

test("share links round-trip accents and Spanish, carry no ids, and refuse oversize sets", () => {
  const set = cleanSet({ title: "Animales / Animals", band: "3-5", items: WORDS });
  const shared = encodeShare(set);
  assert.ok(shared.ok);
  assert.match(shared.encoded, /^[\w-]+$/, "url-safe");
  const back = decodeShare(shared.encoded);
  assert.equal(back.title, "Animales / Animals");
  assert.equal(back.band, "3-5");
  assert.deepEqual(
    back.items.map((i) => [i.term, i.definition, i.example, i.translation]),
    set.items.map((i) => [i.term, i.definition, i.example, i.translation]),
  );
  assert.doesNotMatch(atob(shared.encoded.replace(/-/g, "+").replace(/_/g, "/")), /"id"/);

  const big = cleanSet({
    title: "Big",
    items: Array.from({ length: LIMITS.items }, (_, i) => ({
      term: `word${i}`,
      definition: "d".repeat(LIMITS.definition),
      example: "e".repeat(LIMITS.example),
    })),
  });
  assert.deepEqual(encodeShare(big), { ok: false, error: "too_big" });
});

test("decodeShare returns null for garbage instead of throwing", () => {
  for (const bad of ["", "!!!", "e30", "bm90LWpzb24", null, undefined])
    assert.equal(decodeShare(bad), null, String(bad));
});
