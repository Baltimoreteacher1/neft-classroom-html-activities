#!/usr/bin/env node
/**
 * validate-notes-pdf-layout.mjs — the Notes Packet PDFs must be real print
 * documents, not screenshots of a web page.
 *
 * Fails on, for every lessons/<id>/downloads/<id>-notes[-teacher][-lN].pdf:
 *   - a page that is mostly white (content fills < MIN_FILL of the live page
 *     area) and is not the last page — the "header-only page 1" defect;
 *   - printed web placeholder text ("Type your name", "Today's date",
 *     "Class period") — Name/Date/Period must print as ruled lines;
 *   - more than MAX_PAGES pages.
 *
 * "Fill" is how far down the live page area the lowest ink reaches (0..1),
 * measured from a low-resolution pdftoppm render. Ink-pixel density would be
 * useless: a full page of text is only a few percent black.
 *
 * Needs poppler (pdfinfo, pdftoppm, pdftotext). The detector self-tests on a
 * synthetic bad PDF first, so it cannot go silently green.
 *
 * Usage:
 *   node tools/validate-notes-pdf-layout.mjs            # every notes PDF
 *   node tools/validate-notes-pdf-layout.mjs 4-3 6-7    # only these lessons
 *   node tools/validate-notes-pdf-layout.mjs --report   # + before/after stats
 */
import { execFile } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { lessonPath, listLessonDirs } from "./lib/curriculum-source.mjs";

const run = promisify(execFile);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

export const MIN_FILL = 0.25;
export const MAX_PAGES = 5;
export const PLACEHOLDERS = [/Type your name/i, /Today[’']s date/i, /Class period/i];

const DPI = 30;
const INK_BELOW = 230; // 0..255 grey level counted as ink
// Letter page, 0.6in top margin, footer band starts 0.8in above the bottom.
const TOP_IN = 0.6;
const BOTTOM_IN = 11 - 0.8;

const NOTES_PDF_RE = /-notes(-teacher)?(-l[123])?\.pdf$/;

/** Parse a binary PGM (P5) into { w, h, data }. */
function parsePgm(buf) {
  let pos = 0;
  const token = () => {
    while (/\s/.test(String.fromCharCode(buf[pos]))) pos++;
    let s = "";
    while (!/\s/.test(String.fromCharCode(buf[pos]))) s += String.fromCharCode(buf[pos++]);
    return s;
  };
  if (token() !== "P5") throw new Error("not a P5 pgm");
  const w = Number(token());
  const h = Number(token());
  token(); // maxval
  pos++; // single whitespace after maxval
  return { w, h, data: buf.subarray(pos) };
}

/** 0..1: how far down the live area the lowest ink reaches. */
export function pageFill({ w, h, data }) {
  const top = Math.round(TOP_IN * DPI);
  const bottom = Math.min(h, Math.round(BOTTOM_IN * DPI));
  let lowest = -1;
  for (let y = bottom - 1; y >= top && lowest < 0; y--) {
    for (let x = 0; x < w; x++) {
      if (data[y * w + x] < INK_BELOW) {
        lowest = y;
        break;
      }
    }
  }
  return lowest < 0 ? 0 : (lowest - top + 1) / (bottom - top);
}

/** Pure detector: analysis = { pages, fills[], text } -> problem strings. */
export function detect({ pages, fills, text }) {
  const problems = [];
  if (pages > MAX_PAGES) problems.push(`${pages} pages (max ${MAX_PAGES})`);
  fills.forEach((fill, i) => {
    if (i < fills.length - 1 && fill < MIN_FILL) {
      problems.push(`page ${i + 1} is ${Math.round(fill * 100)}% filled (min ${MIN_FILL * 100}%)`);
    }
  });
  for (const re of PLACEHOLDERS) {
    const m = text.match(re);
    if (m) problems.push(`printed placeholder text "${m[0]}"`);
  }
  return problems;
}

export async function analyzePdf(pdf) {
  const dir = mkdtempSync(join(tmpdir(), "notes-pdf-layout-"));
  try {
    await run("pdftoppm", ["-r", String(DPI), "-gray", pdf, join(dir, "p")]);
    const { stdout: text } = await run("pdftotext", ["-layout", pdf, "-"], {
      maxBuffer: 32 * 1024 * 1024,
    });
    const fills = readdirSync(dir)
      .filter((f) => f.endsWith(".pgm"))
      .sort()
      .map((f) => pageFill(parsePgm(readFileSync(join(dir, f)))));
    return { pages: fills.length, fills, text };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Minimal 2-page PDF: page 1 has one line of text near the top, page 2 is full. */
function syntheticPdf() {
  const page1 = "BT /F1 18 Tf 72 700 Td (Type your name) Tj ET";
  const lines = [];
  for (let y = 720; y > 90; y -= 24) lines.push(`BT /F1 12 Tf 72 ${y} Td (filler line) Tj ET`);
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R 5 0 R] /Count 2 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 7 0 R >> >> >>",
    `<< /Length ${page1.length} >>\nstream\n${page1}\nendstream`,
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 6 0 R /Resources << /Font << /F1 7 0 R >> >> >>",
    `<< /Length ${lines.join("\n").length} >>\nstream\n${lines.join("\n")}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let out = "%PDF-1.4\n";
  const offsets = [];
  objs.forEach((o, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (const o of offsets) out += `${String(o).padStart(10, "0")} 00000 n \n`;
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return out;
}

async function selfTest() {
  const bad = detect({ pages: 6, fills: [0.1, 0.9, 0.9, 0.9, 0.9, 0.2], text: "Class period" });
  if (bad.length !== 3) throw new Error(`detector missed a synthetic bad case: ${bad.join("; ")}`);
  const good = detect({ pages: 3, fills: [0.9, 0.8, 0.1], text: "Name ________" });
  if (good.length) throw new Error(`detector flagged a synthetic good case: ${good.join("; ")}`);

  const dir = mkdtempSync(join(tmpdir(), "notes-pdf-selftest-"));
  try {
    const pdf = join(dir, "synthetic.pdf");
    writeFileSync(pdf, syntheticPdf());
    const found = detect(await analyzePdf(pdf));
    const hasSparse = found.some((p) => p.startsWith("page 1 is"));
    const hasPlaceholder = found.some((p) => p.includes("Type your name"));
    if (!hasSparse || !hasPlaceholder) {
      throw new Error(`pdf self-test did not flag the synthetic PDF (got: ${found.join("; ")})`);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function notesPdfs(filter) {
  const out = [];
  for (const id of listLessonDirs()) {
    if (filter.length && !filter.includes(id)) continue;
    const dir = lessonPath(id, "downloads");
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) if (NOTES_PDF_RE.test(f)) out.push(join(dir, f));
  }
  return out.sort();
}

async function pool(items, size, fn) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i]);
      }
    }),
  );
  return results;
}

async function main() {
  const args = process.argv.slice(2);
  const report = args.includes("--report");
  const filter = args.filter((a) => !a.startsWith("--"));

  try {
    await selfTest();
  } catch (e) {
    console.error(`validate-notes-pdf-layout: SELF-TEST FAILED — ${e.message}`);
    process.exit(2);
  }

  const pdfs = notesPdfs(filter);
  if (!pdfs.length) {
    console.error("validate-notes-pdf-layout: no notes PDFs found");
    process.exit(1);
  }
  const analyses = await pool(pdfs, 8, analyzePdf);

  const failures = [];
  pdfs.forEach((pdf, i) => {
    const problems = detect(analyses[i]);
    if (problems.length) failures.push({ pdf: pdf.replace(`${ROOT}/`, ""), problems });
  });

  if (report) {
    const defaults = pdfs
      .map((p, i) => ({ p, a: analyses[i] }))
      .filter(({ p }) => /-notes\.pdf$/.test(p));
    const pages = defaults.reduce((s, { a }) => s + a.pages, 0);
    const sparse = defaults.reduce(
      (s, { a }) => s + a.fills.filter((f, k) => k < a.fills.length - 1 && f < MIN_FILL).length,
      0,
    );
    console.log(
      `default PDFs: ${defaults.length}, avg pages ${(pages / defaults.length).toFixed(2)}, ` +
        `sparse non-last pages ${sparse}, PDFs with placeholders ${defaults.filter(({ a }) => PLACEHOLDERS.some((re) => re.test(a.text))).length}`,
    );
  }

  if (failures.length) {
    console.error(`validate-notes-pdf-layout: FAIL — ${failures.length} of ${pdfs.length} PDFs`);
    for (const f of failures.slice(0, 25)) console.error(`  ${f.pdf}: ${f.problems.join("; ")}`);
    if (failures.length > 25) console.error(`  ... and ${failures.length - 25} more`);
    process.exit(1);
  }
  console.log(`validate-notes-pdf-layout: PASS — ${pdfs.length} notes PDFs laid out as documents.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
