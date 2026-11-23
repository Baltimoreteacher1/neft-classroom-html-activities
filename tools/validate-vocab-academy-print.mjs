#!/usr/bin/env node
/**
 * validate-vocab-academy-print: the Vocabulary Academy printables.
 *
 *   node tools/validate-vocab-academy-print.mjs            HTML sweep of EVERY unit file on disk x EVERY print kind (no browser)
 *   node tools/validate-vocab-academy-print.mjs --pdf      also renders one sample unit per grade band to PDF and checks the PDFs
 *   node tools/validate-vocab-academy-print.mjs --pdf --grade 4 --unit 1     sample a specific unit
 *
 * HTML sweep fails on:
 *   RENDER   a kind throws or produces no sheet for a real unit
 *   LEAK     a student kind (workbook, review, assessment, words) contains any teacher-only or answer string of its unit
 *            (checked in visible text AND raw markup); the sweep also proves the check fires on an injected leak
 *   EMPTY    the sweep found zero unit files (a sweep of nothing is a failure)
 * PDF checks (needs poppler: pdfinfo, pdffonts, pdftoppm; and Playwright's Chromium):
 *   PAGES    more than 40 pages, or none
 *   ORPHAN   a page below the first with almost nothing on it (mostly white)
 *   TYPE     any shown text under 10pt (read from the PDF's own content streams)
 *   TAGGED   not a tagged PDF, or no document title
 *   FONTS    a font that is not embedded
 *   LEAK     a student PDF whose extracted text contains a teacher-only or answer string
 * Passing means "auto-checked": a person still has to open the printables (docs/vocab-academy/content-qa.md).
 */
import { execFile } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { PRINT_KINDS } from "../access-practice-lab/src/vocab-academy/contract.js";
import { findLeaks, renderBody } from "../access-practice-lab/src/vocab-academy/print/render.js";
import { isTeacherKind } from "../access-practice-lab/src/vocab-academy/print/shared.js";
import { minTextSize } from "../scripts/lib/pdf-text-sizes.mjs";
import {
  listUnits,
  openBrowser,
  readJson,
  renderUnitPdf,
  reviewWordsOf,
} from "./generate-vocab-academy-pdfs.mjs";

const run = promisify(execFile);
const BIG = { maxBuffer: 64 * 1024 * 1024 };
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : null);
const MAX_PAGES = 40;
const MIN_PT = 10;
const SAMPLE = [
  ["K", 1],
  ["2", 1],
  ["4", 1],
  ["6", 1],
  ["8", 1],
];

const failures = [];
const fail = (where, code, msg) => failures.push(`${where}  ${code}: ${msg}`);

// ---- pure detectors (self-tested below) ------------------------------------------------------------------------------
/** Pages (after the first) whose ink covers too little of the page: a near-empty orphan page. */
export function orphanPages(pgms, { minInk = 0.03 } = {}) {
  const bad = [];
  pgms.forEach((p, i) => {
    if (i === 0) return;
    const top = Math.floor(p.height * 0.1);
    const bottom = Math.floor(p.height * 0.9);
    let rows = 0;
    for (let y = top; y < bottom; y++)
      for (let x = 0; x < p.width; x++)
        if (p.data[y * p.width + x] < 200) {
          rows++;
          break;
        }
    if (rows / (bottom - top) < minInk) bad.push(i + 1);
  });
  return bad;
}

export function pdfFindings({ pages, info, fonts, size, text, leaks, orphans }) {
  const f = [];
  if (!(pages > 0 && pages <= MAX_PAGES))
    f.push(`PAGES: ${pages} pages (1 to ${MAX_PAGES} expected)`);
  if (orphans.length) f.push(`ORPHAN: page(s) ${orphans.join(", ")} are almost empty`);
  if (size !== null && size < MIN_PT)
    f.push(`TYPE: smallest shown text is ${size.toFixed(1)}pt (minimum ${MIN_PT}pt)`);
  if (!/Tagged:\s+yes/i.test(info)) f.push("TAGGED: not a tagged PDF");
  if (!/Title:\s+\S/.test(info)) f.push("TAGGED: no document title");
  const bad = fonts
    .split("\n")
    .slice(2)
    .filter((l) => l.trim() && !/\syes\s+(yes|no)\s+(yes|no)\s+\d+/.test(l));
  if (bad.length)
    f.push(`FONTS: not embedded: ${bad.map((l) => l.trim().split(/\s+/)[0]).join(", ")}`);
  for (const s of leaks) f.push(`LEAK: "${s.slice(0, 60)}"`);
  return f;
}

// ---- self-tests ------------------------------------------------------------------------------------------------------
function selfTest(unit) {
  const must = (ok, msg) => {
    if (!ok) {
      console.error(
        `validate-vocab-academy-print: SELF-TEST FAIL, ${msg}. The detectors cannot be trusted.`,
      );
      process.exit(1);
    }
  };
  const secret = unit.teacher?.notes && Object.values(unit.teacher.notes)[0];
  const note = typeof secret === "string" ? secret : JSON.stringify(secret);
  must(note && note.length > 20, "the reference unit has no teacher note to inject");
  const clean = renderBody(unit, "workbook", {}).html;
  must(findLeaks(unit, clean).length === 0, "the untouched reference workbook reported a leak");
  must(
    findLeaks(unit, `${clean}<p>${note}</p>`).length > 0,
    "an injected teacher note was not detected",
  );
  must(
    findLeaks(unit, `${clean}<span aria-label="${note}"></span>`).length > 0,
    "a leak inside an attribute was not detected",
  );
  const white = { width: 10, height: 100, data: new Uint8Array(1000).fill(255) };
  const inked = { width: 10, height: 100, data: new Uint8Array(1000).fill(0) };
  must(
    orphanPages([inked, white, inked]).join() === "2",
    "a blank page was not reported as an orphan",
  );
  must(orphanPages([white, inked]).length === 0, "the first page must not count as an orphan");
  const ok = {
    pages: 5,
    info: "Tagged: yes\nTitle: x",
    fonts: "name type\n----\nA TrueType yes yes yes 4",
    size: 11,
    leaks: [],
    orphans: [],
  };
  must(pdfFindings(ok).length === 0, "a clean PDF record reported findings");
  must(
    pdfFindings({ ...ok, pages: 99 }).some((x) => x.startsWith("PAGES")),
    "PAGES did not fire",
  );
  must(
    pdfFindings({ ...ok, size: 8 }).some((x) => x.startsWith("TYPE")),
    "TYPE did not fire",
  );
  must(
    pdfFindings({ ...ok, info: "Tagged: no\nTitle: x" }).some((x) => x.startsWith("TAGGED")),
    "TAGGED did not fire",
  );
  must(
    pdfFindings({ ...ok, fonts: "n\n-\nB TrueType no no no 4" }).some((x) => x.startsWith("FONTS")),
    "FONTS did not fire",
  );
  must(
    pdfFindings({ ...ok, leaks: ["x"] }).some((x) => x.startsWith("LEAK")),
    "PDF LEAK did not fire",
  );
}

// ---- HTML sweep ------------------------------------------------------------------------------------------------------
function htmlSweep() {
  const files = listUnits();
  if (!files.length) {
    fail("sweep", "EMPTY", "no unit files found under access-practice-lab/content/vocab-academy");
    return 0;
  }
  let renders = 0;
  for (const u of files) {
    const unit = readJson(u.file);
    for (const kind of PRINT_KINDS) {
      const where = `g${u.grade}-u${String(u.n).padStart(2, "0")} ${kind}`;
      try {
        const out = renderBody(unit, kind, { reviewWords: reviewWordsOf(unit) });
        if (!out.count || !out.html.trim()) fail(where, "RENDER", "no sheets");
        renders++;
        if (!isTeacherKind(kind)) {
          for (const s of findLeaks(unit, out.html)) fail(where, "LEAK", `"${s.slice(0, 60)}"`);
        }
      } catch (error) {
        fail(where, "RENDER", error.message);
      }
    }
  }
  console.log(
    `html sweep: ${files.length} units x ${PRINT_KINDS.length} kinds = ${renders} renders`,
  );
  return files.length;
}

// ---- PDF sample ------------------------------------------------------------------------------------------------------
function readPgm(buf) {
  const m = /^P5\s+(\d+)\s+(\d+)\s+255\s/.exec(buf.subarray(0, 32).toString("latin1"));
  return { width: Number(m[1]), height: Number(m[2]), data: buf.subarray(m[0].length) };
}

async function checkPdf(browser, unit, kind) {
  const r = await renderUnitPdf(browser, unit, kind);
  const dir = mkdtempSync(join(tmpdir(), "va-print-"));
  try {
    const file = join(dir, "x.pdf");
    writeFileSync(file, r.pdf);
    const [info, fonts, text] = await Promise.all([
      run("pdfinfo", [file], BIG),
      run("pdffonts", [file], BIG),
      run("pdftotext", [file, "-"], BIG),
    ]);
    const pages = Number(/Pages:\s+(\d+)/.exec(info.stdout)?.[1] ?? 0);
    await run("pdftoppm", ["-r", "30", "-gray", file, join(dir, "p")], BIG);
    const { stdout } = await run("ls", [dir]);
    const pgms = stdout
      .split("\n")
      .filter((n) => n.endsWith(".pgm"))
      .sort()
      .map((n) => readPgm(readFileSync(join(dir, n))));
    const leaks = isTeacherKind(kind) ? [] : findLeaks(unit, text.stdout);
    return pdfFindings({
      pages,
      info: info.stdout,
      fonts: fonts.stdout,
      size: minTextSize(r.pdf),
      text: text.stdout,
      leaks,
      orphans: orphanPages(pgms),
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

async function pdfSample() {
  const want = opt("--grade")
    ? [[opt("--grade").toUpperCase(), Number(opt("--unit") || 1)]]
    : SAMPLE;
  const have = new Set(listUnits().map((u) => `${u.grade}-${u.n}`));
  const browser = await openBrowser();
  let n = 0;
  try {
    for (const [g, num] of want) {
      if (!have.has(`${g}-${num}`)) continue;
      const unit = readJson(listUnits().find((u) => u.grade === g && u.n === num).file);
      for (const kind of PRINT_KINDS) {
        const found = await checkPdf(browser, unit, kind);
        n++;
        for (const x of found)
          fail(
            `g${g}-u${String(num).padStart(2, "0")} ${kind} (pdf)`,
            x.split(":")[0],
            x.replace(/^[A-Z]+: /, ""),
          );
      }
    }
  } finally {
    await browser.close();
  }
  console.log(`pdf sample: ${n} documents checked`);
  return n;
}

// ---- main ------------------------------------------------------------------------------------------------------------
const ref = JSON.parse(
  readFileSync(new URL("../docs/vocab-academy/reference-unit.json", import.meta.url), "utf8"),
);
selfTest(ref);
console.log(
  "self-tests: passed (leak, attribute leak, orphan, and every PDF detector fired on its synthetic case)",
);
htmlSweep();
if (flag("--pdf")) {
  const n = await pdfSample();
  if (!n) fail("pdf", "EMPTY", "no sample unit exists for the requested grades");
}
if (failures.length) {
  for (const f of failures.slice(0, 60)) console.error(`FAIL ${f}`);
  if (failures.length > 60) console.error(`... and ${failures.length - 60} more`);
  console.error(`validate-vocab-academy-print: ${failures.length} problem(s)`);
  process.exit(1);
}
console.log(
  "validate-vocab-academy-print: PASS (auto-checked only: a person must still open the printables)",
);
