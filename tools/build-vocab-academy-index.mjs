#!/usr/bin/env node
// Regenerate access-practice-lab/content/vocab-academy/index.json from the authored files
// (g<G>/grade.json and g<G>/u<NN>.json; _fixture and other "_" folders are ignored). SPEC §10.
// Grades K-8 only (SPEC §11, SHIPPED_GRADES): 9-12 files, if any exist, are never indexed.
// Deterministic: grades in curriculum order, units by n, words in unit order, no timestamps.
//   node tools/build-vocab-academy-index.mjs          write the index
//   node tools/build-vocab-academy-index.mjs --check  exit 1 when the committed index is stale
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SHIPPED_GRADES, unitFile } from "../access-practice-lab/src/vocab-academy/contract.js";
import { loadCorpus, VA_DIR } from "./lib/vocab-academy-scope.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const INDEX_PATH = join(ROOT, VA_DIR, "index.json");
const rootArg = process.argv.indexOf("--root");
const RUN_ROOT = rootArg > 0 ? process.argv[rootArg + 1] : ROOT; // --root <dir>: a throwaway content tree (tests)

/** Build the index object from a loaded corpus. Throws on an unreadable authored file (a bad index is worse than none). */
export function buildIndex(corpus) {
  const bad = [...corpus.grades.values(), ...corpus.units].filter((f) => f.parseError);
  if (bad.length)
    throw new Error(
      `unreadable authored file(s): ${bad.map((f) => `${f.file} (${f.parseError})`).join("; ")}`,
    );
  const grades = {};
  const words = {};
  let units = 0;
  let wordTotal = 0;
  for (const g of SHIPPED_GRADES) {
    const mine = corpus.units.filter((u) => u.g === g);
    const entries = mine.map((u) => {
      const d = u.data;
      const ws = Array.isArray(d.words) ? d.words : [];
      for (const w of ws)
        words[w.id] = { unit: d.id, grade: g, hw: w.hw, pos: w.pos, tier: w.tier };
      return {
        id: d.id,
        n: d.n,
        title: d.title,
        theme: d.theme,
        strand: d.strand,
        file: unitFile(g, u.nn),
        wordIds: ws.map((w) => w.id),
        words: ws.map((w) => ({ id: w.id, hw: w.hw, pos: w.pos })),
      };
    });
    entries.sort((a, b) => a.n - b.n);
    const wc = entries.reduce((n, e) => n + e.wordIds.length, 0);
    grades[g] = { unitCount: entries.length, wordCount: wc, units: entries };
    units += entries.length;
    wordTotal += wc;
  }
  const populated = SHIPPED_GRADES.filter((g) => grades[g].unitCount > 0).length;
  return { schema: 1, totals: { grades: populated, units, words: wordTotal }, grades, words };
}

export const indexText = (index) => `${JSON.stringify(index, null, 1)}\n`;

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const check = process.argv.includes("--check");
  let next;
  try {
    next = indexText(buildIndex(loadCorpus(RUN_ROOT)));
  } catch (e) {
    console.error(`build-vocab-academy-index: ${e.message}`);
    process.exit(1);
  }
  let current = "";
  try {
    current = readFileSync(join(RUN_ROOT, VA_DIR, "index.json"), "utf8");
  } catch {}
  const label = `${VA_DIR}/index.json`;
  if (check) {
    if (current !== next) {
      console.error(
        `build-vocab-academy-index: ${label} is stale; run \`npm run build:vocab-academy-index\`.`,
      );
      process.exit(1);
    }
    console.log(`build-vocab-academy-index: ${label} is current.`);
  } else if (current !== next) {
    writeFileSync(join(RUN_ROOT, VA_DIR, "index.json"), next);
    console.log(`build-vocab-academy-index: wrote ${label}.`);
  } else console.log(`build-vocab-academy-index: ${label} already current.`);
}
