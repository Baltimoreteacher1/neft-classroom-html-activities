// Unit 4's hand-built studios, held to the same wrong-answer contract as the generated ones.
//
// Every multiple-choice item on the ten pages (see tools/lib/u4-mc-items.mjs for how they are read) must:
//   - carry `tags`: one entry per choice, null at the right answer, every other entry a misconception id
//     (data/practice-studio/misconceptions.json, plus any data/practice-studio-u4/traps-*.json still waiting to be folded in)
//   - carry one help line per wrong choice, in English AND Spanish (`why[i]`, `choices[i].why`, `feedback[i]` as {en, es}, or `feedback[i]`+`feedbackEs[i]`)
//   - never print the right answer in that help (quoted answer, named letter, duplicate lines: tools/audit-distractor-feedback.mjs)
// and every page that has such items must hand a wrong click to `U4Studio.miss(` so the help is shown and the miss is recorded.
//
//   node tools/unit4-mc-contract.test.mjs                 whole contract
//   node tools/unit4-mc-contract.test.mjs --page 4-3-practice-studio    only this page (authoring loop)
//   node tools/unit4-mc-contract.test.mjs --report        counts only, never fails
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { MISCONCEPTIONS } from "@eduwonderlab/engine/core/misconceptions.js";
import { taxonomyProblems } from "../scripts/lib/practice-studio-content.mjs";
import { auditItem } from "./audit-distractor-feedback.mjs";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";
import { U4_PAGES, u4McItems } from "./lib/u4-mc-items.mjs";

const argv = process.argv.slice(2);
const REPORT = argv.includes("--report");
const only = argv.includes("--page") ? argv[argv.indexOf("--page") + 1] : null;
const pages = only ? [only] : U4_PAGES;

const read = (/** @type {string} */ rel) => readFileSync(join(REPO_ROOT, rel), "utf8");
const traps = { ...JSON.parse(read("data/practice-studio/misconceptions.json")).traps };
const pending = join(REPO_ROOT, "data/practice-studio-u4");
const pendingTraps = {};
for (const f of existsSync(pending) ? readdirSync(pending).sort() : [])
  if (/^traps-.*\.json$/.test(f))
    for (const [id, t] of Object.entries(
      JSON.parse(readFileSync(join(pending, f), "utf8")).traps,
    )) {
      assert.ok(!pendingTraps[id], `${f}: trap "${id}" is also defined in another traps-*.json`);
      pendingTraps[id] = t;
    }
for (const id of Object.keys(pendingTraps))
  assert.ok(!traps[id], `data/practice-studio-u4 trap "${id}" is already in misconceptions.json`);
Object.assign(traps, pendingTraps);
const taxonomy = taxonomyProblems(pendingTraps, new Set(Object.keys(MISCONCEPTIONS)), [4]);
assert.equal(taxonomy.length, 0, taxonomy.join("\n"));

/** The help line for choice i in whichever of the three shapes the item uses. @returns {{en: string, es: string} | null} */
function helpOf(/** @type {any} */ item, /** @type {number} */ i) {
  const w = item.why?.[i] ?? item.choices?.[i]?.why ?? null;
  if (w) return typeof w === "string" ? { en: w, es: "" } : { en: w.en || "", es: w.es || "" };
  const f = item.feedback?.[i];
  if (f)
    return typeof f === "string"
      ? { en: f, es: item.feedbackEs?.[i] || "" }
      : { en: f.en || "", es: f.es || "" };
  return null;
}

const problems = /** @type {string[]} */ ([]);
let items = 0;
let distractors = 0;
let named = 0;
let helped = 0;
for (const page of pages) {
  const found = u4McItems(page);
  const html = read(`math/unit-4/${page}/index.html`);
  for (const { list, index, item, texts, correct } of found) {
    items += 1;
    const where = `${page} ${list}[${index}]${item.id ? ` (${item.id})` : ""}`;
    const bad = (/** @type {string} */ m) => problems.push(`${where}: ${m}`);
    if (!Array.isArray(item.tags)) bad("no tags[]");
    else if (item.tags.length !== texts.length)
      bad(`tags[] has ${item.tags.length} entries for ${texts.length} choices`);
    const lines = texts.map(() => "");
    texts.forEach((_t, i) => {
      if (i === correct) {
        if (item.tags?.[i] != null) bad(`the right choice (${i}) carries a tag`);
        return;
      }
      distractors += 1;
      const tag = item.tags?.[i];
      if (tag) named += 1;
      if (!tag) bad(`wrong choice ${i} has no tag`);
      else if (!traps[tag])
        bad(`wrong choice ${i} names "${tag}", which is not a misconception id`);
      const h = helpOf(item, i);
      if (h?.en?.trim() && h?.es?.trim()) helped += 1;
      if (!h?.en?.trim()) bad(`wrong choice ${i} has no English help`);
      else if (!h.es?.trim()) bad(`wrong choice ${i} has no Spanish help`);
      else if (h.es.trim() === h.en.trim())
        bad(`wrong choice ${i}: Spanish help is the English copied over`);
      lines[i] = h?.en ?? "";
    });
    for (const m of auditItem({ item: { choices: texts, choiceFeedback: lines }, correct }))
      if (!/^slot \d+ empty$/.test(m)) bad(m);
  }
  if (found.length && !/U4Studio\.miss\(/.test(html))
    problems.push(
      `${page}: has ${found.length} multiple-choice items but never calls U4Studio.miss(`,
    );
}

console.log(
  `unit 4 multiple choice: ${items} items, ${distractors} wrong choices — ${named} tagged, ${helped} with bilingual help, ${problems.length} problem(s).`,
);
if (REPORT) process.exit(0);
assert.equal(
  problems.length,
  0,
  `${problems.length} problem(s):\n  ${problems.slice(0, 60).join("\n  ")}${problems.length > 60 ? `\n  … ${problems.length - 60} more` : ""}`,
);
