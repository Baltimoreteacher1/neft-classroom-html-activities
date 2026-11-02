// Unit tests for the plain-language definition rules and their wiring.
// The sweep over the whole curriculum is tools/validate-family-plain-definitions.mjs;
// this file pins each rule on its own so a regression names the rule that broke.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  baseLessonId,
  parsePlainDefinitions,
  plainFor,
  senseFor,
  vocabKey,
  withPlainDefinitions,
} from "../scripts/lib/family-plain-definitions.mjs";
import {
  checkSense,
  enStem,
  evaluate,
  findJargon,
  fkGrade,
  isCircularEn,
  isCircularEs,
  LIMITS,
  listMismatches,
  loadSources,
  numeralsOf,
  percentLists,
  sentenceCount,
  syllables,
  termVariants,
  wordCount,
} from "./lib/family-plain-definitions.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(readFileSync(join(ROOT, "data", "family-glossary.json"), "utf8"));
const map = parsePlainDefinitions(data);

test("vocabKey is the generator's key: lowercase, final s dropped", () => {
  assert.equal(vocabKey("Ratios"), "ratio");
  assert.equal(vocabKey("  Unit Rate "), "unit rate");
  assert.equal(vocabKey("x-axis"), "x-axi");
  assert.equal(map.get(vocabKey("x-axis")).name, "x-axis");
});

test("baseLessonId maps every variant to its core lesson", () => {
  for (const id of ["4-3", "4-3-group1", "4-3-group2", "4-3-part2", "4-3-catchup"])
    assert.equal(baseLessonId(id), "4-3");
  assert.equal(baseLessonId("10-2-group1"), "10-2");
});

test("words are counted without stand-alone symbols", () => {
  assert.equal(wordCount("Add 0 or multiply by 1."), 6);
  assert.equal(wordCount("x − 3 = 7 → x = 10"), 5);
  assert.equal(wordCount("   "), 0);
});

test("sentences split on terminal punctuation, never on a decimal point", () => {
  assert.equal(sentenceCount("It is 0.5. It is half."), 2);
  assert.equal(sentenceCount("One sentence with 3.14 inside"), 1);
});

test("syllable counts are right for the words definitions use", () => {
  const expected = {
    the: 1,
    whole: 1,
    rule: 1,
    table: 2,
    number: 2,
    estimate: 3,
    equation: 3,
    added: 2,
    places: 2,
    denominator: 5,
    something: 2,
    "50%": 1,
  };
  for (const [w, n] of Object.entries(expected)) assert.equal(syllables(w), n, w);
});

test("Flesch-Kincaid grade separates plain from dense text", () => {
  assert.ok(fkGrade("The cat sat on the mat.") < 1);
  assert.ok(fkGrade("Split a total into equal groups.") <= LIMITS.maxGrade);
  assert.ok(
    fkGrade(
      "A reasoned answer that is close enough to be useful, found without exact computation.",
    ) > 8,
  );
});

test("a term may not appear in its own English definition, in any inflection", () => {
  assert.ok(isCircularEn(["estimate"], "To estimate is to guess."));
  assert.ok(isCircularEn(["estimate"], "Estimating is guessing."));
  assert.ok(isCircularEn(["unit rate"], "A unit rates idea."));
  assert.ok(!isCircularEn(["unit rate"], "A rate for just 1 of something."));
  assert.ok(isCircularEn(["at least / at most"], "Say at most 5."));
  assert.ok(!isCircularEn(["parallelogram"], "Opposite sides are parallel."));
});

test("a term may not appear in its own Spanish definition, plural or verb form", () => {
  assert.ok(isCircularEs(["razón"], "Dos razones iguales."));
  assert.ok(isCircularEs(["Dividendo"], "El número que se divide."));
  assert.ok(!isCircularEs(["Paralelogramo"], "Los lados opuestos son paralelos."));
  assert.ok(
    !isCircularEs(["Por"], "Por cada uno."),
    "a three-letter function word is not a giveaway",
  );
});

test("term variants split on slashes and drop parenthetical notes", () => {
  assert.deepEqual(termVariants("At least / At most"), ["At least", "At most"]);
  assert.deepEqual(termVariants("Base 1 (b1)"), ["Base 1"]);
});

test("numerals compare by value, across separators and superscripts", () => {
  assert.deepEqual([...numeralsOf("1,344 and 78.50 and 2³")].sort(), ["1344", "2", "3", "78.5"]);
});

test("findJargon flags an undefined grade-6 word and passes familiar and defined ones", () => {
  const jargon = [["ratio"], ["unit", "rat"], ["number"], ["solv"]];
  assert.equal(findJargon("A ratio is close.", jargon, new Set()), "ratio");
  assert.equal(findJargon("A ratio is close.", jargon, new Set(["ratio"])), null);
  assert.equal(findJargon("Any number you solve.", jargon, new Set()), null);
  assert.equal(
    findJargon("It means the same.", [["mean"]], new Set()),
    null,
    '"means" is a verb, not the mean',
  );
});

test("checkSense accepts a good definition and names the broken rule otherwise", () => {
  const ctx = {
    names: ["estimate"],
    namesEs: ["estimar"],
    authored: new Set(["20"]),
    jargon: [],
    allowed: new Set(),
  };
  const good = {
    en: "An answer that is close, found without exact work.",
    es: "Una respuesta cercana, sin hacer el cálculo exacto.",
  };
  assert.deepEqual(checkSense("t", good, ctx), []);
  const broken = (patch, re) =>
    assert.ok(
      checkSense("t", { ...good, ...patch }, ctx).some((p) => re.test(p)),
      JSON.stringify(patch),
    );
  broken(
    { en: "one two three four five six seven eight nine ten eleven twelve thirteen" },
    /words \(max 12\)/,
  );
  broken({ en: "Estimate it." }, /uses the term/);
  broken({ es: "" }, /missing Spanish/);
  broken({ en: "Quantification necessitates approximations." }, /reading grade/);
  broken({ en: "About 99 at most." }, /never says/);
  broken({ example: { en: "no digits here", es: "sin números" } }, /no real numbers/);
});

test("the real file passes every rule against every vocabulary term", async () => {
  const sources = await loadSources(ROOT);
  assert.ok(sources.records.length > 2000, "the sweep must see the curriculum");
  const { problems, stats } = evaluate(data, sources);
  assert.deepEqual(problems, []);
  assert.ok(stats.terms >= 396, `terms ${stats.terms}`);
  assert.ok(stats.maxWords <= LIMITS.enMaxWords, `max words ${stats.maxWords}`);
  assert.ok(stats.maxGrade <= LIMITS.maxGrade, `max grade ${stats.maxGrade}`);
});

test("evaluate fails when the file is emptied", async () => {
  const sources = await loadSources(ROOT);
  const { problems } = evaluate({ terms: {} }, sources);
  assert.ok(problems.length > 300, "every term should be reported missing");
});

test("senses: the entry's own wording is the default, a sense wins for its lessons", () => {
  const base = map.get(vocabKey("base"));
  assert.equal(senseFor(base, "4-4"), base);
  assert.notEqual(senseFor(base, "5-1"), base);
  assert.equal(senseFor(base, "5-1-part2"), senseFor(base, "5-1"));
  assert.equal(
    senseFor(base, "5-3-catchup"),
    senseFor(base, "5-1"),
    "a catch-up that reuses 5-1's wording shares its sense",
  );
  assert.equal(senseFor(base, ""), base);
  assert.equal(senseFor(undefined, "5-1"), null);
});

test("withPlainDefinitions puts the plain text first and keeps the authored text", () => {
  const authored = {
    term: "Estimate",
    termEs: "estimación",
    definition:
      "A reasoned answer that is close enough to be useful, found without exact computation.",
    definitionEs: "Una respuesta razonada, lo bastante cercana para ser útil.",
    visual: "8.6% of 216 ≈ 20",
  };
  const [out] = withPlainDefinitions([authored], "4-3", map);
  assert.equal(out.definition, plainFor("estimate", "4-3", map).en);
  assert.equal(out.definitionEs, plainFor("estimate", "4-3", map).es);
  assert.equal(out.formal, authored.definition);
  assert.equal(out.formalEs, authored.definitionEs);
  assert.equal(out.visual, authored.visual, "other fields are untouched");
  assert.ok(out.plain);
  assert.equal(withPlainDefinitions([out], "4-3", map)[0], out, "idempotent");
  assert.equal(authored.definition.startsWith("A reasoned"), true, "the input is not mutated");
});

test("withPlainDefinitions leaves unknown terms and bad input alone", () => {
  const item = { term: "no such term", definition: "x" };
  assert.deepEqual(withPlainDefinitions([item], "4-3", map), [item]);
  assert.deepEqual(withPlainDefinitions(undefined, "4-3", map), []);
  assert.deepEqual(withPlainDefinitions([null], "4-3", map), [null]);
});

test("formal is empty when the authored text already is the plain text", () => {
  const plain = plainFor("estimate", "", map);
  const [out] = withPlainDefinitions(
    [{ term: "estimate", definition: plain.en, definitionEs: plain.es }],
    "",
    map,
  );
  assert.equal(out.formal, "");
  assert.equal(out.formalEs, "");
});

test("the homework generator uses the shared module, not its own copy", () => {
  const gen = readFileSync(join(ROOT, "scripts", "generate-homework-html.mjs"), "utf8");
  assert.match(gen, /from "\.\/lib\/family-plain-definitions\.mjs"/);
  assert.ok(
    (gen.match(/withPlainDefinitions\(/g) || []).length >= 3,
    "lesson list, shared glossary and page",
  );
  assert.doesNotMatch(gen, /const vocabKey = /, "one vocabKey, in the shared module");
  assert.match(gen, /buildVocabGlossary\(vocab, lessonId\)/);
});

test("percent lists: the benchmark-percent restatement is caught, the full list is not", () => {
  assert.equal(percentLists("like 10%, 25%, 50%, and 75%.").length, 1);
  const lesson = (en) => [
    {
      id: "4-3",
      vocab: [
        {
          term: "benchmark percent",
          definition: "A friendly percent — 1%, 10%, 25%, 50%, 75%, 100% — used as a landmark.",
          definitionEs: "",
        },
      ],
      sidecar: {
        learningTonight: { en, es: "" },
        watchFor: [{ en: "Listen — 10%, 25%, 50%, 75%, 100%.", es: "" }],
      },
    },
  ];
  const found = listMismatches(lesson("benchmark percents like 1%, 10%, 25%, 50%, 75%, and 100%."));
  assert.equal(found.length, 1, "the watchFor list omits 1%");
  assert.match(found[0], /watchFor\[0\]\.en/);
  assert.equal(enStem("estimating"), enStem("estimate"));
});
