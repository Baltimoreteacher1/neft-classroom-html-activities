#!/usr/bin/env node
/**
 * Easy-read tooling for the Axiom City graphic novels.
 *
 *   node tools/gn-extract-text.mjs <book.html>                 JSON list of {id, kind, key, html} on stdout
 *   node tools/gn-extract-text.mjs --all <outDir>              one <slug>.json per book plus a count table
 *   node tools/gn-extract-text.mjs --verify <easy.json> [book] check an authored easy file (book is inferred
 *                                                              from the file name when omitted)
 *
 * `key` is exactly what the browser layer computes (graphic-novels/_shared/gn-layer.js normalizeKey over the
 * text leaf, less its speaker label), so an easy file is simply { "v": 1, "map": { "<key>": "<easy html>" } }.
 * Easy html may use only b, i, em, strong, span, code, sup, sub, u, br. Numbers, math, names and vocabulary
 * never change; see --verify.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { verifyEasy } from "./lib/gn-easy-verify.mjs";
import { extractBook } from "./lib/gn-extract.mjs";
import { listBooks, NOVEL_DIR } from "./lib/gn-layer.mjs";

const [flag, a, b] = process.argv.slice(2);
if (flag === "--all") {
  mkdirSync(a, { recursive: true });
  for (const book of listBooks()) {
    const { items, stats } = extractBook(book.file);
    writeFileSync(join(a, `${book.slug}.json`), `${JSON.stringify(items, null, 1)}\n`);
    console.log(
      `${book.slug.padEnd(52)} ${String(stats.total).padStart(4)}  ${JSON.stringify(stats.byKind)}`,
    );
  }
} else if (flag === "--verify") {
  const slug = basename(a, ".json");
  const book = b || listBooks().find((x) => x.slug === slug)?.file;
  if (!book) throw new Error(`no book named ${slug}`);
  const { errors, report, checked } = verifyEasy(book, a);
  for (const r of report) console.log(`note   ${r}`);
  for (const e of errors) console.error(`ERROR  ${e}`);
  console.log(
    `${checked} easy strings checked, ${errors.length} errors, ${report.length} grade notes`,
  );
  process.exit(errors.length ? 1 : 0);
} else if (flag) {
  const file = flag.includes("/")
    ? flag
    : join(
        NOVEL_DIR,
        flag.startsWith("axiom-city-u") && !flag.includes("vol") ? `episodes/${flag}` : flag,
      );
  console.log(JSON.stringify(extractBook(file).items, null, 1));
} else {
  console.error(
    "usage: gn-extract-text.mjs <book.html> | --all <outDir> | --verify <easy.json> [book.html]",
  );
  process.exit(2);
}
