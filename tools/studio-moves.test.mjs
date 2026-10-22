// "Which move?" (docs/specs/studio-v3-w3.md, W3c): every lesson in Units 2-9 carries one Practice and one Challenge item that shows
// the work so far and asks for the best next move. Shape and tags come from scripts/lib/practice-studio-data.mjs (moveProblems);
// this adds what only a whole-fleet check can see: the help never names the best move, Spanish is real, positions are balanced.
//
//   node tools/studio-moves.test.mjs                  every lesson, strict
//   node tools/studio-moves.test.mjs --lesson 6-3     only these lessons (comma separated), for the authoring loop
//   node tools/studio-moves.test.mjs --report         counts only, never fails
//
// Traps a lesson's author has not folded into data/practice-studio/misconceptions.json yet may sit in
// data/practice-studio-moves/traps-*.json (same entry shape); both are read.
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { MISCONCEPTIONS } from "@eduwonderlab/engine/core/misconceptions.js";
import { taxonomyProblems } from "../scripts/lib/practice-studio-content.mjs";
import { moveProblems } from "../scripts/lib/practice-studio-data.mjs";
import { auditItem } from "./audit-distractor-feedback.mjs";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";

const argv = process.argv.slice(2);
const REPORT = argv.includes("--report");
const only = argv.includes("--lesson")
  ? new Set(argv[argv.indexOf("--lesson") + 1].split(","))
  : null;

const read = (/** @type {string} */ rel) => readFileSync(join(REPO_ROOT, rel), "utf8");
const traps = { ...JSON.parse(read("data/practice-studio/misconceptions.json")).traps };
const dir = join(REPO_ROOT, "data/practice-studio-moves");
const pending = /** @type {Record<string, any>} */ ({});
for (const f of existsSync(dir) ? readdirSync(dir).sort() : [])
  if (/^traps-.*\.json$/.test(f))
    for (const [id, t] of Object.entries(JSON.parse(readFileSync(join(dir, f), "utf8")).traps)) {
      assert.ok(!pending[id], `${f}: trap "${id}" is also defined in another traps file`);
      assert.ok(!traps[id], `${f}: trap "${id}" is already in misconceptions.json`);
      pending[id] = t;
    }
const taxonomy = taxonomyProblems(
  pending,
  new Set(Object.keys(MISCONCEPTIONS)),
  [2, 3, 5, 6, 7, 8, 9],
);
assert.equal(taxonomy.length, 0, taxonomy.join("\n"));
Object.assign(traps, pending);

const lessons = readdirSync(join(REPO_ROOT, "data/practice-studio"))
  .filter((f) => /^\d+-\d+\.json$/.test(f))
  .map((f) => f.replace(".json", ""))
  .filter((id) => !only || only.has(id))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

const problems = /** @type {string[]} */ ([]);
const positions = [0, 0, 0, 0];
let items = 0;
let missing = 0;
for (const id of lessons) {
  const ld = JSON.parse(read(`data/practice-studio/${id}.json`));
  if (!ld.moves) {
    missing += 1;
    problems.push(`${id}: no moves block`);
    continue;
  }
  problems.push(...moveProblems(id, ld.moves));
  for (const mode of ["practice", "challenge"]) {
    const it = ld.moves[mode];
    if (!it) continue;
    items += 1;
    const where = `${id}.moves.${mode}`;
    positions[it.a] += 1;
    for (const t of it.tag || [])
      if (t && !traps[t]) problems.push(`${where}: "${t}" is not a misconception id`);
    // the help for a wrong move may not name or quote the best move, nor a letter
    for (const m of auditItem({ item: { choices: it.c, choiceFeedback: it.f }, correct: it.a }))
      problems.push(`${where}: ${m}`);
    // the Spanish is not the English copied over
    for (const [en, es, what] of [
      [it.q, it.qEs, "q"],
      [it.x, it.xEs, "x"],
    ])
      if (String(en).trim() === String(es).trim())
        problems.push(`${where}: ${what}Es is the English copied over`);
    (it.f || []).forEach((f, i) => {
      if (i !== it.a && it.fEs?.[i] && String(f).trim() === String(it.fEs[i]).trim())
        problems.push(`${where}: fEs[${i}] is the English copied over`);
      if (i !== it.a && !String(it.fEs?.[i] ?? "").trim())
        problems.push(`${where}: fEs[${i}] is empty`);
    });
    if (!Array.isArray(it.cEs) || it.cEs.length !== it.c.length)
      problems.push(`${where}: cEs[] must align with c[]`);
    else
      it.c.forEach(
        (c, i) =>
          c.trim() === it.cEs[i].trim() &&
          /[a-z]{4,}/i.test(c) &&
          problems.push(`${where}: cEs[${i}] is the English copied over`),
      );
    // a hint may not give away the best move's wording
    const best = String(it.c[it.a])
      .toLowerCase()
      .replace(/[.!?]+$/, "");
    if (best.length >= 8 && (it.h || []).some((h) => String(h).toLowerCase().includes(best)))
      problems.push(`${where}: a hint quotes the best move`);
  }
}

const total = positions.reduce((a, b) => a + b, 0);
console.log(
  `studio moves: ${lessons.length} lessons, ${items} items (${missing} lessons missing), best-move positions A/B/C/D = ${positions.join("/")}, ${problems.length} problem(s).`,
);
if (REPORT) process.exit(0);
assert.equal(
  problems.length,
  0,
  `${problems.length} problem(s):\n  ${problems.slice(0, 50).join("\n  ")}${problems.length > 50 ? `\n  … ${problems.length - 50} more` : ""}`,
);
if (!only) {
  // the best move may not sit in one place: each position holds 18-32% of the fleet
  positions.forEach((n, i) =>
    assert.ok(
      n / total >= 0.18 && n / total <= 0.32,
      `best move is at position ${"ABCD"[i]} in ${Math.round((100 * n) / total)}% of items`,
    ),
  );
}
