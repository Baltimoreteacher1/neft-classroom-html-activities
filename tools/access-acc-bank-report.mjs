#!/usr/bin/env node
/**
 * Quantitative report on the ACCESS practice item bank, computed from the set files (nothing typed).
 *   node tools/access-acc-bank-report.mjs            prints the report
 *   node tools/access-acc-bank-report.mjs --write    also writes reports/access-bank-report.md
 * Exit 1 if a delivery requirement is unmet: at least 40 items per domain per grade band, original provenance on every set,
 * and no set claiming human review. The report states what has NOT been done (no human review, no psychometric study).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { loadBank } from "./validate-access-bank.mjs";

const sets = loadBank().map((x) => x.set);
const items = sets.flatMap((s) => s.items.map((i) => ({ ...i, grade: s.grade, setId: s.id })));
const tally = (fn) => {
  const m = new Map();
  for (const i of items) {
    const k = fn(i);
    if (k !== undefined && k !== null) m.set(k, (m.get(k) || 0) + 1);
  }
  return [...m.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0])));
};
const table = (head, rows) =>
  `| ${head.join(" | ")} |\n| ${head.map(() => "---").join(" | ")} |\n${rows.map((r) => `| ${r.join(" | ")} |`).join("\n")}`;
const DOMAINS = ["Listening", "Reading", "Speaking", "Writing"];
const GRADES = ["3-5", "6-8"];
const words = (t) => (String(t || "").match(/[\p{L}\p{N}'’-]+/gu) || []).length;
const problems = [];

const perCell = DOMAINS.map((d) => [
  d,
  ...GRADES.map((g) => items.filter((i) => i.grade === g && i.domain === d).length),
]);
for (const [d, a, b] of perCell)
  for (const [g, n] of [
    ["3-5", a],
    ["6-8", b],
  ])
    if (n < 40) problems.push(`${d} grade ${g} has ${n} items (need 40)`);
for (const s of sets) {
  if (s.bank?.provenance?.source !== "original")
    problems.push(`${s.id}: provenance is not original`);
  if (!/automated/.test(s.bank?.reviewStatus || ""))
    problems.push(`${s.id}: reviewStatus must be automated-checks-only`);
}
const lens = { passage: [], audio: [] };
for (const s of sets)
  for (const st of s.stimuli || []) {
    if (st.kind === "passage") lens.passage.push(words((st.paragraphs || []).join(" ")));
    if (st.kind === "audio") lens.audio.push(words((st.turns || []).map((t) => t.text).join(" ")));
  }
const stat = (a) =>
  a.length
    ? `${Math.min(...a)}–${Math.max(...a)} (median ${[...a].sort((x, y) => x - y)[Math.floor(a.length / 2)]})`
    : "none";
const explicit = items.filter((i) => i.meta?.wida?.explicit).length;
const withSupport = items.filter(
  (i) => i.support?.clue && i.support?.frame && i.support?.model,
).length;
const objective = items.filter(
  (i) => !["speaking-response", "constructed-response"].includes(i.type),
);
const wrongIds = (i) =>
  i.options.map((o) => o.id).filter((id) => ![].concat(i.answer).includes(id));
const withDistractor = objective
  .filter((i) => i.options)
  .every((i) => wrongIds(i).every((id) => i.distractors?.[id]));

const out = [
  "# ACCESS practice item bank report",
  "",
  `Generated from ${sets.length} set files and ${items.length} items. Original practice material; not WIDA/DRC content; no item has been human-reviewed (review status: automated-checks-only).`,
  "",
  "## Items per domain and grade band",
  table(["Domain", "Grades 3–5", "Grades 6–8"], perCell),
  "",
  "## Distribution",
  `Key Language Use: ${tally((i) => i.klu)
    .map(([k, n]) => `${k} ${n}`)
    .join(", ")}`,
  "",
  `Academic context: ${tally((i) => i.context)
    .map(([k, n]) => `${k} ${n}`)
    .join(", ")}`,
  "",
  `Practice band: ${tally((i) => i.meta?.band)
    .map(([k, n]) => `${k} ${n}`)
    .join(", ")}`,
  "",
  `Cognitive demand: ${tally((i) => i.meta?.cognitive)
    .map(([k, n]) => `${k} ${n}`)
    .join(", ")}`,
  "",
  `Language demand: ${tally((i) => i.meta?.languageDemand)
    .map(([k, n]) => `${k} ${n}`)
    .join(", ")}`,
  "",
  `Item type: ${tally((i) => i.type)
    .map(([k, n]) => `${k} ${n}`)
    .join(", ")}`,
  "",
  `Language function: ${[...new Set(items.flatMap((i) => i.meta?.functions || []))]
    .sort()
    .map((f) => `${f} ${items.filter((i) => (i.meta?.functions || []).includes(f)).length}`)
    .join(", ")}`,
  "",
  "## Framework alignment",
  `${explicit} items map to a combination the WIDA framework explicitly lists; ${items.length - explicit} are supplementary practice and are labelled so. Standard codes come only from the framework catalog in the repo.`,
  "",
  "## Stimulus length",
  `Passages: ${stat(lens.passage)} words. Listening clips: ${stat(lens.audio)} spoken words (two plays each).`,
  "",
  "## Quality controls",
  `- Items with all three supports (clue, frame, model): ${withSupport} of ${items.length}.`,
  `- Every wrong choice on choice items has an authored reason: ${withDistractor ? "yes" : "NO"}.`,
  `- Misconception tags authored: ${items.reduce((n, i) => n + Object.keys(i.meta?.misconceptions || {}).length, 0)}.`,
  `- Parallel skill groups (same skill, different content): ${new Set(items.map((i) => i.meta?.parallel).filter(Boolean)).size}.`,
  `- Facts recorded for subject review: ${items.reduce((n, i) => n + (i.meta?.facts || []).length, 0)}.`,
  "",
  "## Not done",
  "- No item has been reviewed by a person. Subject facts and wording need an educator's review before relying on them.",
  "- No psychometric study: difficulty bands are authors' estimates, not calibrated values.",
  "- Spanish is interface text only; item content is English.",
  "- Practice results are not WIDA or ACCESS scores and are not proficiency levels.",
  "",
  problems.length
    ? `## Requirement failures\n${problems.map((p) => `- ${p}`).join("\n")}`
    : "## Requirements\nAll delivery requirements met (at least 40 items per domain per band; original provenance; automated-checks-only status).",
  "",
].join("\n");
console.log(out);
if (process.argv.includes("--write")) {
  mkdirSync(new URL("../reports/", import.meta.url), { recursive: true });
  writeFileSync(new URL("../reports/access-bank-report.md", import.meta.url), out);
}
process.exit(problems.length ? 1 : 0);
