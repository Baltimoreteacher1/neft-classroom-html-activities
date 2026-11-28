#!/usr/bin/env node
/**
 * generate-math-literacy.mjs — builds teachers/math-literacy/ (pages, Word packets, PDFs) from
 * scripts/lib/math-literacy/{content,gen,build,pages,doc}.mjs. Never hand-edit the output: change the source and rerun.
 *
 *   node scripts/generate-math-literacy.mjs              everything
 *   node scripts/generate-math-literacy.mjs --no-docs    pages only (fast)
 *   node scripts/generate-math-literacy.mjs --grade 3    one grade's files
 *
 * Output is deterministic (seeded) and files are only rewritten when their bytes change. PDFs need Chrome (CHROME_PATH);
 * without it the pages and Word files still build and the PDF step says so.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { findChrome, renderPdf, stampAccessibility } from "./generate-pdf.mjs";
import { ALL } from "./lib/math-literacy/build.mjs";
import { guideDoc, keyDoc, studentDoc, toDocx, toHtml } from "./lib/math-literacy/doc.mjs";
import {
  dlName,
  gradePage,
  hubPage,
  routinesPage,
  scopePage,
  teachersIndex,
} from "./lib/math-literacy/pages.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "teachers", "math-literacy");
const FONTS = join(ROOT, "public", "assets", "fonts");
const args = process.argv.slice(2);
const noDocs = args.includes("--no-docs");
const only = args.includes("--grade") ? args[args.indexOf("--grade") + 1] : null;

function write(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  const buf = Buffer.isBuffer(content) ? content : Buffer.from(content);
  if (existsSync(path) && readFileSync(path).equals(buf)) return false;
  writeFileSync(path, buf);
  return true;
}

let changed = 0;
const note = (_p, c) => {
  if (c) changed++;
};

// pages
note("", write(join(ROOT, "teachers", "index.html"), teachersIndex()));
note("", write(join(OUT, "index.html"), hubPage(ALL)));
note("", write(join(OUT, "routines", "index.html"), routinesPage()));
note("", write(join(OUT, "scope-and-sequence", "index.html"), scopePage(ALL)));
for (const g of ALL) {
  if (only && g.id !== only) continue;
  note("", write(join(OUT, `grade-${g.id}`, "index.html"), gradePage(g)));
}
// the interactive pages import the SAME generator file the build uses
mkdirSync(join(OUT, "assets"), { recursive: true });
copyFileSync(join(ROOT, "scripts/lib/math-literacy/gen.mjs"), join(OUT, "assets", "gen.mjs"));

if (noDocs) {
  console.log(`generate-math-literacy: pages done (${changed} written); docs skipped`);
  process.exit(0);
}

const chrome = findChrome();
if (!chrome)
  console.warn(
    "generate-math-literacy: no Chrome found; set CHROME_PATH to build PDFs. Word files will still build.",
  );
const tmp = join(tmpdir(), `ml-${process.pid}`);
mkdirSync(tmp, { recursive: true });

async function emit(blocks, title, base) {
  const docx = await toDocx(blocks, title);
  note("", write(`${base}.docx`, docx));
  if (!chrome) return;
  const html = join(tmp, `${Math.random().toString(36).slice(2)}.html`);
  writeFileSync(html, toHtml(blocks, title, FONTS));
  const pdf = `${base}.pdf`;
  const staged = join(tmp, "out.pdf");
  const ok = await renderPdf(chrome, html, staged);
  if (!ok) throw new Error(`PDF failed: ${pdf}`);
  stampAccessibility(staged, title);
  const bytes = readFileSync(staged);
  // Chrome stamps a creation date; keep the file when only that differs
  if (existsSync(pdf) && Math.abs(readFileSync(pdf).length - bytes.length) < 64) return;
  note("", write(pdf, bytes));
}

for (const g of ALL) {
  if (only && g.id !== only) continue;
  const dir = join(OUT, `grade-${g.id}`, "downloads");
  const label = g.id === "k" ? "Kindergarten" : `Grade ${g.id}`;
  await emit(
    studentDoc(g),
    `${label} Math Literacy and Fluency, Student Packet`,
    join(dir, dlName(g, "student-packet")),
  );
  await emit(
    keyDoc(g),
    `${label} Math Literacy and Fluency, Answer Key and Teacher Notes`,
    join(dir, dlName(g, "answer-key")),
  );
  console.log(`  grade ${g.id}: packet + key`);
}
if (!only)
  await emit(
    guideDoc(ALL),
    "Math Literacy and Fluency K-8, Program Guide",
    join(OUT, "downloads", "math-literacy-program-guide"),
  );
rmSync(tmp, { recursive: true, force: true });
console.log(`generate-math-literacy: done (${changed} files written)`);
