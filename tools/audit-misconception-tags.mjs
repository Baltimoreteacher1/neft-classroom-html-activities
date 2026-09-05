// Misconception-tag audit — is every authored `misconceptionTags` array one
// the engine can act on? A tag is what `detectMisconception()` trusts FIRST,
// and the taxonomy's `student` line is shown to the student the moment it
// fires, so a tag that is misspelt, on the wrong slot, or not in the taxonomy
// is a silent no-op at best and a wrong diagnosis at worst. Reports tagged
// coverage of multiple-choice items per lesson family; `--strict` fails on any
// malformed array; `--floor N` fails when the number of small-group / catch-up
// items carrying a usable tag falls below N (pinned by
// tools/misconception-tags.test.mjs).
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveAuthoredTag } from "@eduwonderlab/engine/core/misconceptions.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS = join(ROOT, "lessons");
const argv = process.argv.slice(2);
const STRICT = argv.includes("--strict");
const floorArg = argv.indexOf("--floor");
const FLOOR = floorArg >= 0 ? Number(argv[floorArg + 1]) : 0;

/** Every id the ENGINE will act on: taxonomy ids plus the short aliases
 *  resolveAuthoredTag() maps into them ("place-value" → "decimal-place-value").
 *  Validating against the taxonomy file alone flagged 227 live "place-value"
 *  tags that the engine resolves perfectly well. */
export function taxonomyIds() {
  const raw = JSON.parse(readFileSync(join(ROOT, "data", "misconception-taxonomy.json"), "utf8"));
  const tax = raw.taxonomy ?? raw;
  const ids = new Set(Array.isArray(tax) ? tax.map((t) => t.id) : Object.keys(tax));
  return {
    size: ids.size,
    has: (tag) => ids.has(tag) || resolveAuthoredTag(tag) !== null,
  };
}

/** Problems with one item's tags; [] = clean. "untagged" = nothing authored. */
export function auditItem(item, correct, ids) {
  const tags = item.misconceptionTags;
  const single = item.misconceptionTag;
  if (tags === undefined && single === undefined) return ["untagged"];
  const problems = [];
  if (single !== undefined && !ids.has(String(single)))
    problems.push(`misconceptionTag "${single}" is not in the taxonomy`);
  if (tags !== undefined) {
    if (!Array.isArray(tags)) return ["misconceptionTags is not an array"];
    if (tags.length !== item.choices.length)
      problems.push(`length ${tags.length} != ${item.choices.length} choices`);
    let live = 0;
    tags.forEach((tag, i) => {
      if (tag === null || tag === undefined || tag === "") return;
      if (typeof tag !== "string") {
        problems.push(`slot ${i} is not a string`);
        return;
      }
      if (!ids.has(tag)) problems.push(`slot ${i} "${tag}" is not in the taxonomy`);
      if (i === correct) problems.push(`slot ${i} is the correct choice but carries a tag`);
      live++;
    });
    // An array of nulls names nothing: not malformed, just not authored yet.
    if (!live && !single && !problems.length) return ["untagged"];
  }
  return problems;
}

export function collect(cfg) {
  const out = [];
  const correctOf = (it) => {
    const c = Number(
      it.correctIndex ??
        it.answerIndex ??
        it.correct ??
        (typeof it.answer === "number" ? it.answer : NaN),
    );
    return Number.isInteger(c) ? c : -1;
  };
  for (const tier of ["approaching", "onLevel", "extending", "optional"]) {
    (cfg.practice?.[tier] || []).forEach((item, i) => {
      if (item && Array.isArray(item.choices) && item.choices.length >= 2)
        out.push({ loc: `practice.${tier}[${i}]`, item, correct: correctOf(item) });
    });
  }
  return out;
}

export function audit() {
  const ids = taxonomyIds();
  const rows = [];
  for (const id of readdirSync(LESSONS).sort()) {
    const family = /-(group1|group2|catchup)$/.test(id)
      ? "small-group"
      : /^\d+-\d+$/.test(id)
        ? "core"
        : null;
    if (!family) continue;
    let cfg;
    try {
      cfg = JSON.parse(readFileSync(join(LESSONS, id, "config.json"), "utf8"));
    } catch {
      continue;
    }
    for (const entry of collect(cfg))
      rows.push({ id, family, ...entry, problems: auditItem(entry.item, entry.correct, ids) });
  }
  return rows;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const rows = audit();
  const summary = (family) => {
    const mine = rows.filter((r) => r.family === family);
    const clean = mine.filter((r) => r.problems.length === 0).length;
    return `${family}: ${clean}/${mine.length} multiple-choice items carry a usable tag`;
  };
  const broken = rows.filter((r) => r.problems.length && r.problems[0] !== "untagged");
  console.log(
    `misconception-tags: ${summary("core")}; ${summary("small-group")}; ${broken.length} malformed`,
  );
  for (const r of broken.slice(0, 40))
    console.log(`  ✗ ${r.id} ${r.loc}: ${r.problems.join("; ")}`);
  if (broken.length > 40) console.log(`  … ${broken.length - 40} more`);
  const sgClean = rows.filter((r) => r.family === "small-group" && r.problems.length === 0).length;
  let fail = false;
  if (STRICT && broken.length) fail = true;
  if (FLOOR && sgClean < FLOOR) {
    console.log(`  ✗ small-group tagged items ${sgClean} is below the pinned floor ${FLOOR}`);
    fail = true;
  }
  process.exit(fail ? 1 : 0);
}
