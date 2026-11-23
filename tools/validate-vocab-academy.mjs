#!/usr/bin/env node
/**
 * Gate for Vocabulary Academy content (docs/vocab-academy/SPEC.md §3, content-qa.md §2).
 *
 *   node tools/validate-vocab-academy.mjs                 whatever exists: every grade.json + every unit file
 *   node tools/validate-vocab-academy.mjs --grade 6       one grade (cross-grade rules still read the others)
 *   node tools/validate-vocab-academy.mjs --complete      K-8 must be FINISHED: every planned unit and word,
 *                                                         every unit file equal to its grade.json entry,
 *                                                         index.json current, no 9-12 files
 *   --warnings   print every WARN (default: a summary by code)   --json   machine-readable result
 *   --selftest   run only the self-tests
 *
 * SELF-TESTS RUN FIRST: ~100 in-memory mutations of docs/vocab-academy/reference-unit.json, one per
 * detector, each of which must be caught, and the untouched reference unit must pass. A sweep that
 * finds zero scope files fails. Passing every gate means "auto-checked" and nothing more: accuracy of
 * definitions, sense match, etymology, facts and Spanish need a person (content-qa.md).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SHIPPED_GRADES } from "../access-practice-lab/src/vocab-academy/contract.js";
import { loadReadability } from "./lib/vocab-academy-lexical.mjs";
import { corpusStats, validateCorpus } from "./lib/vocab-academy-run.mjs";
import { loadCorpus } from "./lib/vocab-academy-scope.mjs";
import { runSelfTests } from "./lib/vocab-academy-selftest.mjs";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : null;
};
const ROOT = opt("--root") ?? REPO; // --root <dir>: a throwaway content tree (tests)
const complete = flag("--complete");
const onlyGrade = opt("--grade");
const json = flag("--json");
const out = (s) => !json && console.log(s);

// ── self-tests (first) ───────────────────────────────────────────────────────
const ref = JSON.parse(readFileSync(join(REPO, "docs/vocab-academy/reference-unit.json"), "utf8"));
const tests = runSelfTests(ref);
const failed = tests.filter((t) => !t.ok);
if (failed.length) {
  for (const f of failed)
    console.error(`SELF-TEST FAIL  ${f.name}${f.detail ? `\n    ${f.detail}` : ""}`);
  console.error(
    `validate-vocab-academy: ${failed.length} of ${tests.length} self-tests failed; the detectors cannot be trusted, so the content was not swept.`,
  );
  process.exit(1);
}
out(
  `self-tests: ${tests.length} passed (every detector caught its mutation; the reference unit is clean)`,
);
if (flag("--selftest")) process.exit(0);

// ── sweep ────────────────────────────────────────────────────────────────────
const corpus = loadCorpus(ROOT);
const fk = await loadReadability();
const res = validateCorpus(corpus, { complete, onlyGrade, fk, root: ROOT });
const stats = res.stats;

if (res.fatal) {
  console.error(`validate-vocab-academy: FAIL ${res.fatal}`);
  process.exit(1);
}

const errors = res.issues.filter((i) => i.sev === "ERROR");
const warns = res.issues.filter((i) => i.sev === "WARN");

if (json) {
  console.log(
    JSON.stringify(
      {
        ok: errors.length === 0,
        complete,
        onlyGrade,
        selfTests: tests.length,
        stats,
        errors,
        warnings: warns,
        missingMorphParts: [...res.missingParts],
      },
      null,
      1,
    ),
  );
  process.exit(errors.length ? 1 : 0);
}

const where = (i) => `${i.file ?? "?"}${i.loc ? `  [${i.loc}]` : ""}`;
const byFile = new Map();
for (const e of errors) {
  if (!byFile.has(e.file)) byFile.set(e.file, []);
  byFile.get(e.file).push(e);
}
let shown = 0;
const CAP = flag("--all") ? Infinity : 120;
for (const [file, list] of byFile) {
  if (shown >= CAP) break;
  console.log(`\nFAIL ${file} (${list.length})`);
  for (const e of list) {
    if (shown++ >= CAP) break;
    console.log(`  ${e.code.padEnd(18)} ${e.loc}\n    ${e.msg}`);
  }
}
if (errors.length > shown) console.log(`\n... ${errors.length - shown} more errors (use --all)`);

if (warns.length) {
  const byCode = new Map();
  for (const w of warns) {
    if (!byCode.has(w.code)) byCode.set(w.code, []);
    byCode.get(w.code).push(w);
  }
  console.log(
    `\nWARN ${warns.length} warning(s) in ${byCode.size} categor${byCode.size === 1 ? "y" : "ies"} (warnings never fail the gate; --warnings lists all):`,
  );
  for (const [code, list] of [...byCode].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${code.padEnd(20)} ${String(list.length).padStart(4)}`);
    for (const w of flag("--warnings") ? list : list.slice(0, 2))
      console.log(`      ${where(w)}\n        ${w.msg}`);
  }
}
if (res.missingParts.size) {
  const parts = [...res.missingParts].sort((a, b) => b[1] - a[1]);
  console.log(
    `\nWARN word parts used by units but absent from content/vocab-academy/morphology.json (${parts.length}): ${parts.map(([p, n]) => `${p} x${n}`).join(", ")}`,
  );
}

// ── summary ──────────────────────────────────────────────────────────────────
const T = stats.total;
console.log(
  `\nscope : ${T.grades} of ${SHIPPED_GRADES.length} shipped grades have a grade.json with units`,
);
console.log(
  `units : ${T.units} written, ${T.words} words, ${T.passages} passages, ${T.questions} questions, ${T.constructed} constructed tasks`,
);
const rows = SHIPPED_GRADES.filter((g) => !onlyGrade || g === onlyGrade).map((g) => {
  const p = stats.per[g];
  return `  grade ${g.padEnd(2)} units ${String(p.units).padStart(2)}/${String(p.planUnits).padEnd(2)}  words ${String(p.words).padStart(3)}/${String(p.planWords).padEnd(3)}  scope ${p.scopeUnits}/${p.planUnits} units, ${p.scopeWords}/${p.planWords} words`;
});
console.log(rows.join("\n"));
const mode = `${complete ? "complete" : "default"}${onlyGrade ? ` grade ${onlyGrade}` : ""}`;
if (errors.length) {
  console.error(
    `\nvalidate-vocab-academy: FAIL (${mode}) ${errors.length} error(s), ${warns.length} warning(s)`,
  );
  process.exit(1);
}
console.log(
  `\nvalidate-vocab-academy: PASS (${mode}) 0 errors, ${warns.length} warning(s). Auto-checked only: no content is human-reviewed by this gate.`,
);
