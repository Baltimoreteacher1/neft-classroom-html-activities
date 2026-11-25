#!/usr/bin/env node
// Reviewer-facing Spanish export: CSV of EN | ES | flags per unit. Read-only: it never rewrites content.
//   node tools/content/spanish-review-export.mjs --unit g6-math-u2            CSV to stdout
//   node tools/content/spanish-review-export.mjs --terms                      the shared term bank to stdout
//   node tools/content/spanish-review-export.mjs --all --out <directory>      one CSV per unit plus terms.csv
// Every row is a "draft translation" until a fluent reviewer signs off (a human review_status on the term, or a human
// reviewer recorded on the lesson). The flags column lists the spanish.mjs and cognate.mjs codes for that pair so the CSV and
// the verifiers agree. Cells that start with = + - @ are prefixed with an apostrophe so a spreadsheet never runs them.

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { EXIT, pairsOf } from "./verifiers/b-common.mjs";
import { classifyPair } from "./verifiers/cognate.mjs";
import { flagsFor } from "./verifiers/spanish.mjs";
import { loadSubjects } from "./verifiers-b.mjs";

export const HEADER = [
  "subject",
  "source",
  "path",
  "EN",
  "ES",
  "author_mark",
  "cognate_guess",
  "status",
  "flags",
];
const REVIEWED = ["human", "reviewed"];

export const cell = (v) => {
  const s = String(v ?? "");
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export function rowsFor(subject) {
  return pairsOf(subject).map((p) => {
    const guess = classifyPair(p.en, p.es);
    return [
      subject.id,
      p.source,
      p.path,
      p.en,
      p.es,
      p.mark,
      `${guess.kind} ${guess.confidence}`,
      REVIEWED.includes(p.reviewStatus) ? "reviewed" : "draft translation",
      flagsFor(p).join(" "),
    ];
  });
}

export const toCsv = (rows) =>
  `${[HEADER, ...rows].map((r) => r.map(cell).join(",")).join("\n")}\n`;

async function main(argv) {
  const subjects = await loadSubjects();
  const arg = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : null);
  if (argv.includes("--all")) {
    const dir = arg("--out");
    if (!dir) throw new Error("--all needs --out <directory>");
    mkdirSync(dir, { recursive: true });
    for (const s of subjects.filter((x) => x.kind === "unit"))
      writeFileSync(path.join(dir, `${s.id}.csv`), toCsv(rowsFor(s)));
    writeFileSync(
      path.join(dir, "terms.csv"),
      toCsv(subjects.filter((x) => x.kind === "term").flatMap(rowsFor)),
    );
    return EXIT.OK;
  }
  if (argv.includes("--terms")) {
    process.stdout.write(toCsv(subjects.filter((x) => x.kind === "term").flatMap(rowsFor)));
    return EXIT.OK;
  }
  const id = arg("--unit");
  const s = subjects.find((x) => x.kind === "unit" && x.id === id);
  if (!s)
    throw new Error(
      `usage: --unit <unitId> | --terms | --all --out <dir> (unit "${id}" not found)`,
    );
  process.stdout.write(toCsv(rowsFor(s)));
  return EXIT.OK;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then(
    (c) => process.exit(c),
    (e) => {
      console.error(`ERROR ${e?.stack ?? e}`);
      process.exit(EXIT.ERROR);
    },
  );
}
