#!/usr/bin/env node
/**
 * validate-family-plain-definitions.mjs — families read the short definition first.
 *
 * THE DEFECT THIS ENDS. 215 of the 396 vocabulary terms carried a definition of
 * more than twelve words written for the student ("A reasoned answer that is
 * close enough to be useful, found without exact computation."). Families — nearly
 * all of them reading English as a second language — met that sentence on the
 * Words flashcards, in every glossary popup and in the family guide. This gate
 * holds `data/family-plain-definitions.json`, the short version, to the rules
 * that make it plain:
 *
 *   - every vocabulary term (every lesson config, the vocab bank, the shared
 *     glossary) has one; an entry that matches no term is stale
 *   - English: 3-12 words (the target is 6-10), Flesch-Kincaid grade 5 or lower
 *   - Spanish: 14 words or fewer, present, never a copy of the English
 *   - neither language may contain the term it defines
 *   - no grade-6 vocabulary word unless the lesson itself defines it
 *   - every number in the English definition is a number the lesson's own
 *     wording states (a plain version is a simplification, never a new claim)
 *   - an example has numbers, both languages and fits on a line
 *   - a term with different meanings in different lessons names its senses, no
 *     lesson sits in two, and lessons that share an authored definition share a sense
 *   - family text never restates a lesson's list of percents differently from the
 *     lesson (the 4-3 "like 10%, 25%, 50%, 75%" against the glossary's six)
 *
 * It self-tests first: every rule has a fixture it must reject, and the real file
 * is mutated (a term deleted, a definition lengthened, the Spanish removed) to
 * prove the sweep itself still fires. A gate that stops firing reports a clean
 * curriculum.
 *
 *   node tools/validate-family-plain-definitions.mjs [--report]
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  PLAIN_DEFINITIONS_PATH,
  parsePlainDefinitions,
  plainFor,
  withPlainDefinitions,
} from "../scripts/lib/family-plain-definitions.mjs";
import {
  checkEntry,
  evaluate,
  fkGrade,
  listMismatches,
  loadSidecarLists,
  loadSources,
  percentLists,
  wordCount,
} from "./lib/family-plain-definitions.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPORT = process.argv.includes("--report");

/* ---------------------------------------------------------------- self-tests */

const failures = [];
const expect = (cond, label) => {
  if (!cond) failures.push(`SELF-TEST: ${label}`);
};

const ctx = () => ({
  names: ["estimate"],
  namesEs: ["estimar", "estimación"],
  authored: new Set(["10", "100"]),
  jargon: [["ratio"], ["unit", "rat"]],
  allowed: new Set(),
});
const good = {
  en: "An answer that is close, found without exact work.",
  es: "Una respuesta cercana, sin hacer el cálculo exacto.",
};
const run = (entry, lessonExists) => checkEntry("estimate", entry, () => ctx(), lessonExists);
const hits = (entry, word, lessonExists) => run(entry, lessonExists).some((p) => p.includes(word));

function selfTestRules() {
  expect(run(good).length === 0, "a clean entry passes");
  expect(
    hits(
      {
        ...good,
        en: "A reasoned answer that is close enough to be useful, found without exact work.",
      },
      "words",
    ),
    "an English definition over 12 words is rejected",
  );
  expect(
    hits({ ...good, en: "To estimate is to guess." }, "uses the term itself"),
    "a definition that uses its term is rejected",
  );
  expect(
    hits({ ...good, en: "To estimating is to guess" }, "uses the term itself"),
    "inflections of the term count as the term",
  );
  expect(
    hits({ ...good, es: "Una estimación cercana." }, "Spanish definition uses the term"),
    "a Spanish definition that uses the term is rejected",
  );
  expect(hits({ en: good.en }, "missing Spanish"), "a missing Spanish definition is rejected");
  expect(hits({ es: good.es }, "missing English"), "a missing English definition is rejected");
  expect(
    hits({ ...good, es: good.en }, "copy of the English"),
    "a Spanish copy of the English is rejected",
  );
  expect(
    hits(
      {
        ...good,
        es: "Una respuesta muy cercana al resultado que se busca, sin hacer el cálculo exacto de todo.",
      },
      "Spanish is",
    ),
    "Spanish over 14 words is rejected",
  );
  expect(
    hits(
      { ...good, en: "Approximating quantities necessitates considerable multiplication." },
      "reading grade",
    ),
    "a hard-to-read definition is rejected",
  );
  expect(
    hits({ ...good, en: "A close answer, 12 off at most." }, "never says"),
    "a number the lesson never states is rejected",
  );
  expect(
    !hits({ ...good, en: "A close answer, 10 off at most." }, "never says"),
    "a number the lesson states is accepted",
  );
  expect(
    hits({ ...good, en: "A ratio that is close." }, "grade-6 vocabulary"),
    "an undefined grade-6 word is rejected",
  );
  expect(
    hits({ ...good, en: "A unit rate that is close." }, "grade-6 vocabulary"),
    "an undefined grade-6 phrase is rejected",
  );
  expect(
    checkEntry("estimate", good, () => ({ ...ctx(), allowed: new Set(["ratio"]) })).length === 0 &&
      checkEntry("estimate", { ...good, en: "A close ratio, found fast." }, () => ({
        ...ctx(),
        allowed: new Set(["ratio"]),
      })).length === 0,
    "a grade-6 word the lesson defines is accepted",
  );
  expect(
    hits(
      {
        ...good,
        example: {
          en: "About 20 for 18.576, found by rounding it, and then checking it again.",
          es: "18.576 es casi 20",
        },
      },
      "English example is",
    ),
    "an English example over 10 words is rejected",
  );
  expect(
    hits(
      { ...good, example: { en: "A close answer", es: "Una respuesta cercana" } },
      "no real numbers",
    ),
    "an example without numbers is rejected",
  );
  expect(
    hits({ ...good, example: { en: "18.576 is about 20" } }, "needs both"),
    "an example without Spanish is rejected",
  );
  expect(
    run({ ...good, example: { en: "18.576 is about 20", es: "18.576 es casi 20" } }).length === 0,
    "a short numeric example passes",
  );
  expect(
    hits(
      {
        ...good,
        senses: [
          { lessons: ["2-1"], ...good },
          { lessons: ["2-1"], ...good },
        ],
      },
      "also claimed",
    ),
    "a lesson in two senses is rejected",
  );
  expect(
    hits(
      { ...good, senses: [{ lessons: ["9-9"], ...good }] },
      "does not exist",
      (id) => id !== "9-9",
    ),
    "a sense for a lesson that does not exist is rejected",
  );
  expect(
    hits({ ...good, senses: [{ ...good }] }, "non-empty lessons"),
    "a sense with no lessons is rejected",
  );

  // readability and counting
  expect(fkGrade("The cat sat on the mat.") < 1, "FK: a first-grade sentence scores below 1");
  expect(
    fkGrade("Approximating quantities necessitates considerable multiplication.") > 12,
    "FK: dense text scores above 12",
  );
  expect(wordCount("x − 3 = 7 → x = 10") === 5, "word count ignores stand-alone symbols");
  expect(wordCount("") === 0, "word count of nothing is zero");

  // the list rule
  const lessons = (en, es = "") => [
    {
      id: "4-3",
      vocab: [
        {
          term: "benchmark percent",
          definition: "A friendly percent — 1%, 10%, 25%, 50%, 75%, 100% — used as a landmark.",
          definitionEs: "",
        },
      ],
      sidecar: { learningTonight: { en, es } },
    },
  ];
  expect(
    percentLists("like 10%, 25 %, and 75%").length === 1,
    "percentLists finds a list of three",
  );
  expect(percentLists("10% or 20%").length === 0, "percentLists ignores a pair");
  expect(
    listMismatches(lessons("benchmark percents like 10%, 25%, 50%, and 75%.")).length === 1,
    "a partial restatement of a defined list is rejected",
  );
  expect(
    listMismatches(lessons("benchmark percents like 1%, 10%, 25%, 50%, 75%, and 100%.")).length ===
      0,
    "the full list passes",
  );
  expect(
    listMismatches(lessons("Estimate 5%, 8% and 12%.")).length === 0,
    "an unrelated list is not a mismatch",
  );
}

async function selfTestSweep(data, sources) {
  const clone = () => JSON.parse(JSON.stringify(data));
  const base = evaluate(clone(), sources).problems;
  expect(base.length === 0, `the real file is clean before mutation (${base.length} problems)`);

  const key = "estimate";
  const mutate = (fn) => {
    const d = clone();
    fn(d.terms);
    return evaluate(d, sources).problems;
  };
  expect(
    mutate((t) => delete t[key]).some((p) => /no plain definition/.test(p)),
    "SWEEP: deleting a term is caught",
  );
  expect(
    mutate((t) => {
      t[key].en =
        "A reasoned answer that is close enough to be useful and found without any exact computation at all.";
    }).some((p) => /words \(max 12\)/.test(p)),
    "SWEEP: lengthening a definition is caught",
  );
  expect(
    mutate((t) => delete t[key].es).some((p) => /missing Spanish/.test(p)),
    "SWEEP: removing the Spanish is caught",
  );
  expect(
    mutate((t) => {
      t[key].en = "To estimate means to guess close.";
    }).some((p) => /uses the term itself/.test(p)),
    "SWEEP: a circular definition is caught",
  );
  expect(
    mutate((t) => {
      t["not a term anywhere"] = { en: "Nothing at all.", es: "Nada de nada." };
    }).some((p) => /not a vocabulary term/.test(p)),
    "SWEEP: an entry for no term is caught",
  );
  expect(
    mutate((t) => {
      const sense = t.base.senses.find((x) => x.lessons.includes("5-3-catchup"));
      sense.lessons = sense.lessons.filter((id) => id !== "5-3-catchup");
    }).some((p) => /different plain senses/.test(p)),
    "SWEEP: leaving a lesson out of its sense (one authored wording split across two) is caught",
  );
  expect(
    mutate((t) => {
      t.base.allow = ["zebra"];
    }).some((p) => /allow "zebra" is not used/.test(p)),
    "SWEEP: an allow nothing needs is caught",
  );
  expect(
    evaluate({ terms: {} }, { records: [], extras: [], lessonIds: new Set() }).stats.terms === 0,
    "an empty file has zero terms",
  );

  // the wiring: plain first, formal kept, senses by lesson
  const map = parsePlainDefinitions(data);
  const item = {
    term: "estimate",
    definition:
      "A reasoned answer that is close enough to be useful, found without exact computation.",
    definitionEs: "formal es",
  };
  const [converted] = withPlainDefinitions([item], "4-3", map);
  expect(
    converted.definition === data.terms.estimate.en &&
      converted.formal === item.definition &&
      converted.plain,
    "WIRING: plain replaces the definition and the formal one is kept",
  );
  expect(
    withPlainDefinitions([converted], "4-3", map)[0] === converted,
    "WIRING: applying it twice changes nothing",
  );
  expect(
    withPlainDefinitions([{ term: "no such term", definition: "x" }], "4-3", map)[0].definition ===
      "x",
    "WIRING: an unknown term is left alone",
  );
  expect(
    plainFor("base", "5-1", map).en !== plainFor("base", "4-4", map).en,
    "WIRING: a sense is chosen by lesson",
  );
  expect(
    plainFor("base", "5-1-group1", map).en === plainFor("base", "5-1", map).en,
    "WIRING: a variant lesson takes its base lesson's sense",
  );
  expect(
    plainFor("base", "", map).en === plainFor("base", "4-4", map).en,
    "WIRING: no lesson takes the default sense",
  );
}

/* ---------------------------------------------------------------------- sweep */

selfTestRules();
const data = JSON.parse(readFileSync(PLAIN_DEFINITIONS_PATH, "utf8"));
const sources = await loadSources(ROOT);
if (!sources.records.length) failures.push("the sweep found no lesson vocabulary at all");
await selfTestSweep(data, sources);

const { problems, stats } = evaluate(data, sources);
const listProblems = listMismatches(loadSidecarLists(ROOT));
failures.push(...problems, ...listProblems);

// How many authored definitions the plain layer replaces, for the record.
const longFormal = new Set(
  sources.records
    .filter((r) => wordCount(r.definition) > 12)
    .map((r) => r.term.toLowerCase().replace(/s$/, "").trim()),
).size;

if (REPORT) {
  const terms = data.terms;
  for (const [name, e] of Object.entries(terms)) {
    for (const s of [e, ...(e.senses || [])]) {
      const n = wordCount(s.en);
      if (n < 6 || n > 10) console.log(`${String(n).padStart(2)} words  ${name}: ${s.en}`);
    }
  }
}

if (failures.length) {
  for (const f of failures) console.error(f);
  console.error(`\n${failures.length} problem(s).`);
  process.exit(1);
}
console.log(
  `family plain definitions: ${stats.terms} terms (${stats.senses} extra senses, ${stats.examples} examples); ` +
    `${longFormal} long authored terms now have a short one; ` +
    `English max ${stats.maxWords} words (${stats.maxWordsTerm}), max grade ${stats.maxGrade} (${stats.maxGradeTerm}); ` +
    `Spanish max ${stats.maxEs} words; ${stats.outsideTarget} definitions outside the 6-10 word target.`,
);
