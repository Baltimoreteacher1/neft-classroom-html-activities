#!/usr/bin/env node
/**
 * Writes the native-speaker review sheet for the family homework Spanish (reports/family-spanish-review.csv):
 * one row per authored EN/ES pair in every lesson's sidecar (the v3 block and the older grown-up and student prose:
 * watch-fors, corner, bridge, try-together, steps, say / don't say). Reviewer fills the last column.
 * Nothing here claims the Spanish is native-reviewed; it only makes the review possible.
 *
 *   node scripts/export-family-spanish-review.mjs [--out=<file>]
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { REPO_ROOT } from "../tools/lib/curriculum-source.mjs";
import { biPairs } from "../tools/lib/family-v3.mjs";

const NOTES = join(REPO_ROOT, "data", "family-homework-notes");
const out =
  process.argv.find((a) => a.startsWith("--out="))?.slice(6) ||
  join(REPO_ROOT, "reports", "family-spanish-review.csv");
const cell = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;

const rows = [
  ["lesson", "field", "english", "spanish", "context", "reviewer_notes"].map(cell).join(","),
];
for (const f of readdirSync(NOTES)
  .filter((n) => n.endsWith(".json"))
  .sort()) {
  const id = f.replace(/\.json$/, "");
  const note = JSON.parse(readFileSync(join(NOTES, f), "utf8"));
  if (!note.v3) continue;
  const { v3, ...older } = note;
  const adult = /^(watchFor|bridge|tryTogether|corner\.(mission|watchOut|question))/;
  const pairs = [
    ...biPairs(older, "").map((p) => ({ ...p, path: p.path.replace(/^\./, "") })),
    ...biPairs(v3),
  ];
  for (const { path, en, es } of pairs) {
    const context = path.startsWith("v3.confused")
      ? "adult coaching line"
      : path.startsWith("v3.vocab")
        ? "vocabulary"
        : adult.test(path)
          ? "grown-up line (ustedes)"
          : path.startsWith("v3")
            ? "family page"
            : "student line (tú)";
    rows.push([id, path, en, es, context, ""].map(cell).join(","));
  }
}
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `${rows.join("\n")}\n`);
console.log(`wrote ${rows.length - 1} rows to ${out}`);
