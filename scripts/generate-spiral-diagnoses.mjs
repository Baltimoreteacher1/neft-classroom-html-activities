#!/usr/bin/env node
/**
 * Precompute misconception diagnoses for the Spiral Review bank.
 *
 * Spiral Review (`spiral-review/app.js`) is a classic script. On a wrong pick it
 * used to say only "Not quite" and reveal the answer, and none of its 5,509
 * wrong-choice slots carries authored feedback. The shared detector in
 * engine/core/misconceptions.js already names specific errors on lesson items;
 * this script runs that same detector over the committed bank at build time,
 * so the page can name the student's thinking before the reveal with no extra
 * runtime module, network call or AWS dependency.
 *
 * Output: spiral-review/diagnoses.json
 *   { meta, tags: { <id>: { label, student } }, items: { <questionId>: [tag|null per choice] } }
 * Choice positions are those in bank.json; app.js carries them through its
 * per-session shuffle.
 *
 * Generated — do not hand-edit. `--check` exits 1 when the committed file is
 * stale (tools/spiral-diagnoses-fresh.test.mjs runs it in `npm test`).
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { diagnoseChoice, MISCONCEPTIONS } from "@eduwonderlab/engine/core/misconceptions.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BANK = join(ROOT, "spiral-review/bank.json");
const OUT = join(ROOT, "spiral-review/diagnoses.json");

export function buildDiagnoses(bank) {
  const questions = Array.isArray(bank) ? bank : bank.questions || [];
  const items = {};
  const used = new Set();
  for (const q of questions) {
    if (!q?.id || !Array.isArray(q.choices) || !Number.isInteger(q.correctIndex)) continue;
    // Authored per-choice feedback would outrank a diagnosis (the rule the
    // lesson renderer uses), so such items are left alone.
    if (Array.isArray(q.choiceFeedback) && q.choiceFeedback.some(Boolean)) continue;
    const tags = q.choices.map((_, i) =>
      i === q.correctIndex ? null : diagnoseChoice(q, i)?.id || null,
    );
    if (!tags.some(Boolean)) continue;
    items[q.id] = tags;
    for (const t of tags) if (t) used.add(t);
  }
  const tags = {};
  for (const id of [...used].sort()) {
    const { label, student } = MISCONCEPTIONS[id];
    tags[id] = { label, student };
  }
  return {
    meta: {
      generator: "scripts/generate-spiral-diagnoses.mjs",
      source: "spiral-review/bank.json + engine/core/misconceptions.js",
      items: Object.keys(items).length,
      slots: Object.values(items).reduce((n, t) => n + t.filter(Boolean).length, 0),
    },
    tags,
    items,
  };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const next = `${JSON.stringify(buildDiagnoses(JSON.parse(readFileSync(BANK, "utf8"))), null, 2)}\n`;
  if (process.argv.includes("--check")) {
    let current = "";
    try {
      current = readFileSync(OUT, "utf8");
    } catch {}
    if (current !== next) {
      console.error(
        "spiral-review/diagnoses.json is stale — run: node scripts/generate-spiral-diagnoses.mjs",
      );
      process.exit(1);
    }
    console.log("spiral-review/diagnoses.json is current.");
  } else {
    writeFileSync(OUT, next, "utf8");
    const { meta } = JSON.parse(next);
    console.log(
      `spiral diagnoses: ${meta.items} questions, ${meta.slots} diagnosed wrong choices.`,
    );
  }
}
