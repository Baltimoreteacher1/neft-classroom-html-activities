#!/usr/bin/env node
/**
 * Gate for Vocabulary Academy companion readings (docs/vocab-academy/readings-spec.md).
 *
 *   node tools/validate-vocab-academy-readings.mjs                 every reading that exists
 *   node tools/validate-vocab-academy-readings.mjs --grade 4       one grade
 *   node tools/validate-vocab-academy-readings.mjs --complete      every K-8 lesson must have its reading
 *   --warnings  print every WARN   --json  machine-readable   --root <dir>  a throwaway content tree   --selftest
 *
 * Self-tests run first: ~25 in-memory mutations of the committed exemplar (g4/readings/u01.json) must each be caught,
 * and the untouched exemplar must pass. A sweep that finds zero readings fails (unless --selftest). Passing means
 * "auto-checked" only: facts, tone and Spanish need a person.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SHIPPED_GRADES } from "../access-practice-lab/src/vocab-academy/contract.js";
import { loadReadability } from "./lib/vocab-academy-lexical.mjs";
import { checkReading } from "./lib/vocab-academy-readings.mjs";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : null);
const ROOT = opt("--root") ?? REPO;
const CONTENT = "access-practice-lab/content/vocab-academy";
const json = flag("--json");
const out = (s) => !json && console.log(s);
const read = (p) => JSON.parse(readFileSync(p, "utf8"));
const fk = await loadReadability();

// ── self-tests ───────────────────────────────────────────────────────────────
const exemplarUnit = read(join(REPO, CONTENT, "g4/u01.json"));
const exemplar = read(join(REPO, CONTENT, "g4/readings/u01.json"));
const clone = (x) => JSON.parse(JSON.stringify(x));
const MUTATIONS = [
  [
    "schema name",
    (f) => {
      f.schema = "x";
    },
    "reading-shape",
  ],
  [
    "wrong unit",
    (f) => {
      f.unit = "g4-u02";
    },
    "reading-shape",
  ],
  [
    "wrong id",
    (f) => {
      f.reading.id = "g4-u01-r2";
    },
    "reading-id",
  ],
  [
    "bad genre",
    (f) => {
      f.reading.genre = "novel";
    },
    "reading-fields",
  ],
  [
    "no title",
    (f) => {
      f.reading.title = "";
    },
    "reading-fields",
  ],
  [
    "no purpose",
    (f) => {
      delete f.reading.purpose;
    },
    "reading-fields",
  ],
  [
    "listenOnly true in grade 4",
    (f) => {
      f.reading.listenOnly = true;
    },
    "reading-fields",
  ],
  [
    "too short",
    (f) => {
      f.reading.paras = f.reading.paras.slice(0, 2);
    },
    "reading-length",
  ],
  [
    "words left out",
    (f) => {
      f.reading.paras = f.reading.paras.map((p) =>
        p.replace(/ambitious|industrious|dependable|outgoing|adventurous|sensible/g, "kind"),
      );
    },
    "reading-coverage",
  ],
  [
    "unknown word id",
    (f) => {
      f.reading.words.push("va.nope.adj");
    },
    "reading-words",
  ],
  [
    "copied passage",
    (f, u) => {
      f.reading.paras = clone(u.passage.paras);
    },
    "reading-overlap",
  ],
  [
    "too few questions",
    (f) => {
      f.reading.qs = f.reading.qs.slice(0, 2);
    },
    "reading-qs",
  ],
  [
    "answer index out of range",
    (f) => {
      f.reading.qs[0].a = 9;
    },
    "reading-qs",
  ],
  [
    "duplicate choices",
    (f) => {
      f.reading.qs[0].choices[1] = f.reading.qs[0].choices[0];
    },
    "reading-qs",
  ],
  [
    "no why",
    (f) => {
      f.reading.qs[2].why = "";
    },
    "reading-qs",
  ],
  [
    "no para on a question",
    (f) => {
      delete f.reading.qs[0].para;
    },
    "reading-qs",
  ],
  [
    "evidence text not in the paragraph",
    (f) => {
      f.reading.qs[1].ev.text = "Not a real sentence.";
    },
    "reading-qs",
  ],
  [
    "evidence answer is not the ev sentence",
    (f) => {
      f.reading.qs[1].a = 0;
    },
    "reading-qs",
  ],
  [
    "no word-meaning question",
    (f) => {
      f.reading.qs[0].skill = "context";
    },
    "reading-qs",
  ],
  [
    "too few clues",
    (f) => {
      f.reading.clues = f.reading.clues.slice(0, 1);
    },
    "reading-clues",
  ],
  [
    "clue text not in the paragraph",
    (f) => {
      f.reading.clues[0].text = "made up words";
    },
    "reading-clues",
  ],
  [
    "clue word not listed",
    (f) => {
      f.reading.clues[0].word = "va.nope.adj";
    },
    "reading-clues",
  ],
  [
    "clue names its own word",
    (f) => {
      f.reading.clues[0].text = "which means industrious people work hard";
      f.reading.paras[1] = f.reading.paras[1].replace(
        "which means they work hard and steadily",
        "which means industrious people work hard",
      );
    },
    "reading-clues",
  ],
  [
    "bad clue type",
    (f) => {
      f.reading.clues[0].type = "vibe";
    },
    "reading-clues",
  ],
  [
    "retell frame without a blank",
    (f) => {
      f.reading.retellFrame = "Retell it.";
    },
    "reading-fields",
  ],
  [
    "placeholder text",
    (f) => {
      f.reading.title = "TODO title";
    },
    "reading-text",
  ],
];
const failed = [];
const base = checkReading(exemplar, exemplarUnit, { fk });
if (base.issues.some((i) => i.sev === "ERROR"))
  failed.push(
    `the exemplar is not clean: ${base.issues
      .filter((i) => i.sev === "ERROR")
      .map((i) => i.msg)
      .join("; ")}`,
  );
for (const [name, mutate, code] of MUTATIONS) {
  const f = clone(exemplar);
  const u = clone(exemplarUnit);
  mutate(f, u);
  const res = checkReading(f, u, { fk });
  if (!res.issues.some((i) => i.sev === "ERROR" && i.code === code))
    failed.push(`mutation "${name}" was not caught as ${code}`);
}
if (failed.length) {
  for (const f of failed) console.error(`SELF-TEST FAIL  ${f}`);
  console.error(
    `validate-vocab-academy-readings: ${failed.length} self-tests failed; the detectors cannot be trusted.`,
  );
  process.exit(1);
}
out(
  `self-tests: ${MUTATIONS.length + 1} passed (every detector caught its mutation; the exemplar is clean)`,
);
if (flag("--selftest")) process.exit(0);

// ── sweep ────────────────────────────────────────────────────────────────────
const grade = opt("--grade");
const complete = flag("--complete");
const issues = [];
let readings = 0;
let lessons = 0;
let missing = 0;
const stats = { words: 0, used: 0, total: 0 };
for (const g of SHIPPED_GRADES) {
  if (grade && String(g) !== String(grade)) continue;
  const dir = join(ROOT, CONTENT, `g${g}`);
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir)
    .filter((x) => /^u\d+\.json$/.test(x))
    .sort()) {
    lessons += 1;
    const unit = read(join(dir, f));
    const rf = join(dir, "readings", f);
    if (!existsSync(rf)) {
      missing += 1;
      if (complete)
        issues.push({
          sev: "ERROR",
          code: "reading-missing",
          file: `g${g}/${f}`,
          loc: `lesson ${unit.id}`,
          msg: "no companion reading",
        });
      continue;
    }
    readings += 1;
    let data;
    try {
      data = read(rf);
    } catch (e) {
      issues.push({
        sev: "ERROR",
        code: "reading-shape",
        file: `g${g}/readings/${f}`,
        loc: "",
        msg: `not valid JSON: ${e.message}`,
      });
      continue;
    }
    const { issues: found, info } = checkReading(data, unit, { fk });
    stats.words += info.words;
    stats.used += info.used;
    stats.total += info.total;
    for (const i of found) issues.push({ ...i, file: `g${g}/readings/${f}` });
  }
}
if (!lessons) {
  console.error("validate-vocab-academy-readings: swept zero lessons; nothing was checked.");
  process.exit(1);
}
const errors = issues.filter((i) => i.sev === "ERROR");
const warns = issues.filter((i) => i.sev === "WARN");
if (json) console.log(JSON.stringify({ lessons, readings, missing, errors, warns }, null, 2));
else {
  for (const i of errors) console.log(`ERROR  ${i.file}  ${i.code}  ${i.loc}  ${i.msg}`);
  if (flag("--warnings"))
    for (const i of warns) console.log(`WARN   ${i.file}  ${i.code}  ${i.loc}  ${i.msg}`);
  else if (warns.length) {
    const by = {};
    for (const w of warns) by[w.code] = (by[w.code] || 0) + 1;
    console.log(
      `warnings: ${Object.entries(by)
        .map(([k, v]) => `${k} ${v}`)
        .join(", ")} (use --warnings to list)`,
    );
  }
  console.log(
    `readings: ${readings} of ${lessons} lessons have a companion reading${missing && !complete ? ` (${missing} not written yet)` : ""}; ${stats.words} words; ${errors.length} errors, ${warns.length} warnings`,
  );
  console.log(
    errors.length
      ? "validate-vocab-academy-readings: FAIL"
      : "validate-vocab-academy-readings: PASS",
  );
}
process.exit(errors.length ? 1 : 0);
