#!/usr/bin/env node
/**
 * generate-vocab-academy-pdfs: Vocabulary Academy printables as tagged US-Letter PDFs, rendered by Playwright from the SAME
 * unit JSON and the SAME renderers the print route uses (access-practice-lab/src/vocab-academy/print/render.js).
 *
 *   node tools/generate-vocab-academy-pdfs.mjs --grade 6 --unit 1 --kind workbook
 *   node tools/generate-vocab-academy-pdfs.mjs --grade K --unit all --kind all --out /some/dir
 *   node tools/generate-vocab-academy-pdfs.mjs --grade 4 --bundle            per-grade student workbook + teacher guide bundles
 *   node tools/generate-vocab-academy-pdfs.mjs --grade 2 --unit 3 --kind words --supports glossaryEs,frames
 *
 * Options: --grade G (K,1..8; default all shipped)  --unit N|all  --kind workbook|teacher|review|assessment|assessment-key|words|all
 *          --out DIR (default /private/tmp/claude-501/va-print)  --bundle  --supports a,b,c  --ref (use docs reference unit for 6-1)
 * Print routes are the product: PDFs are generated on demand, only a small sample set is committed (see docs/vocab-academy/print.md).
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";
import { PRINT_KINDS, SHIPPED_GRADES } from "../access-practice-lab/src/vocab-academy/contract.js";
import {
  documentShell,
  documentTitle,
  KIND_TITLE,
  pageCss,
  parseSupports,
  renderBody,
} from "../access-practice-lab/src/vocab-academy/print/render.js";
import { bandInfo, gradeLabel } from "../access-practice-lab/src/vocab-academy/print/shared.js";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const CONTENT = join(ROOT, "access-practice-lab/content/vocab-academy");
export const DEFAULT_OUT = "/private/tmp/claude-501/va-print";
const CSS_FILE = join(ROOT, "access-practice-lab/vocab-academy-print.css");
const DS_FILE = join(ROOT, "access-practice-lab/ds.css");
const FONT_DIR = join(ROOT, "public/assets/fonts");

export const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
const two = (n) => String(n).padStart(2, "0");

/** Every published unit file on disk: [{ grade, n, file }]. */
export function listUnits() {
  const out = [];
  for (const g of SHIPPED_GRADES) {
    const dir = join(CONTENT, `g${g}`);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      const m = /^u(\d+)\.json$/.exec(f);
      if (m) out.push({ grade: g, n: Number(m[1]), file: join(dir, f) });
    }
  }
  return out.sort(
    (a, b) => SHIPPED_GRADES.indexOf(a.grade) - SHIPPED_GRADES.indexOf(b.grade) || a.n - b.n,
  );
}

let wordMap;
/** word id -> word record, across every unit on disk (a review packet resolves unit.review through it). */
export function wordsById() {
  if (!wordMap) {
    wordMap = new Map();
    for (const u of listUnits()) for (const w of readJson(u.file).words ?? []) wordMap.set(w.id, w);
  }
  return wordMap;
}
export const reviewWordsOf = (unit) =>
  (unit.review ?? []).map((id) => wordsById().get(id)).filter(Boolean);

/** A unit by grade and number: the content file, or (grade 6 unit 1 only, before its file ships) the reference unit. */
export function loadUnit(grade, n) {
  const file = join(CONTENT, `g${grade}/u${two(n)}.json`);
  if (existsSync(file)) return readJson(file);
  const ref = join(ROOT, "docs/vocab-academy/reference-unit.json");
  if (String(grade) === "6" && Number(n) === 1 && existsSync(ref)) return readJson(ref);
  return null;
}

// ---- fonts: ds.css @font-face blocks with URLs pointed at the repo's own files (no network) --------------------------
let fontCache;
export function fontCss() {
  if (fontCache) return fontCache;
  const ds = readFileSync(DS_FILE, "utf8");
  const blocks = [...ds.matchAll(/@font-face\s*\{[^}]*\}/g)]
    .map((m) => m[0])
    .filter((b) => /Atkinson Hyperlegible|Fraunces/.test(b) && !/Mono/i.test(b));
  fontCache = blocks
    .map((b) =>
      b.replace(
        /url\(\/assets\/fonts\/([^)]+)\)/g,
        (_m, f) => `url(${pathToFileURL(join(FONT_DIR, f)).href})`,
      ),
    )
    .join("\n");
  return fontCache;
}
export const printCss = () => readFileSync(CSS_FILE, "utf8");

let numberLinesSrc;
const linesScript = () =>
  (numberLinesSrc ??= readFileSync(
    join(ROOT, "access-practice-lab/src/vocab-academy/print/lines.js"),
    "utf8",
  ).replaceAll("export function", "function"));

// ---- browser --------------------------------------------------------------------------------------------------------
export async function openBrowser() {
  return chromium.launch();
}

/** Render one standalone HTML string to a tagged PDF buffer (line numbers measured at the real 7in text width). */
export async function htmlToPdf(browser, doc, { png = false } = {}) {
  const page = await browser.newPage({ viewport: { width: 672, height: 912 } });
  try {
    await page.emulateMedia({ media: "print" });
    await page.setContent(doc, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.addScriptTag({
      content: `${linesScript()}\nwindow.__vapNumber = numberPassageLines; window.__vapFit = fitSheets;`,
    });
    await page.evaluate(() => {
      window.__vapFit(document);
      window.__vapNumber(document);
    });
    return await page.pdf({
      format: "Letter",
      tagged: true,
      outline: false,
      preferCSSPageSize: true,
      printBackground: true,
    });
  } finally {
    await page.close();
  }
}

const bandOf = (unit) => bandInfo(unit.grade).band;
const langOf = () => "en";

/** One unit, one kind -> { pdf: Buffer, html: string, sheets, title }. */
export async function renderUnitPdf(browser, unit, kind, { supports = [] } = {}) {
  const flags = parseSupports(supports);
  const body = renderBody(unit, kind, { reviewWords: reviewWordsOf(unit), supports: flags });
  const title = documentTitle(unit, kind);
  const doc = documentShell({
    title,
    lang: langOf(),
    css: printCss(),
    fontCss: fontCss(),
    body: body.html,
    band: bandOf(unit),
    extraCss: pageCss(unit, kind),
  });
  const pdf = await htmlToPdf(browser, doc);
  return { pdf, html: doc, sheets: body.count, title, ctx: body.ctx };
}

// ---- bundles: one document per grade, one named page per unit so every unit keeps its own running header ------------
export async function renderBundlePdf(browser, grade, kind, { supports = [] } = {}) {
  const units = listUnits().filter((u) => u.grade === String(grade));
  if (!units.length) return null;
  const flags = parseSupports(supports);
  const parts = units.map((u, i) => {
    const unit = readJson(u.file);
    const name = `vu${u.n}`;
    const body = renderBody(unit, kind, { reviewWords: reviewWordsOf(unit), supports: flags });
    return { unit, name, css: pageCss(unit, kind, { name }), body: body.html, i };
  });
  const first = parts[0].unit;
  const label = kind === "teacher" ? "Teacher Guide" : "Student Workbook";
  const toc = `<section class="vap-sheet vap-s-bundle" aria-label="Contents" style="page: vbundle">
    <header class="vap-cover-head"><p class="vap-eyebrow">Vocabulary Academy</p><h1>${gradeLabel(first.grade)}: ${label}</h1>
    <p class="vap-theme">${parts.length} units</p></header>
    <table class="vap-table"><caption>Contents</caption><thead><tr><th scope="col">Unit</th><th scope="col">Title</th><th scope="col">Theme</th></tr></thead>
    <tbody>${parts.map((p) => `<tr><th scope="row">${p.unit.n}</th><td>${p.unit.title}</td><td>${p.unit.theme}</td></tr>`).join("")}</tbody></table></section>`;
  const body =
    toc +
    parts
      .map((p) => `<div class="vap-unitwrap" style="page: ${p.name}">${p.body}</div>`)
      .join("\n");
  const extraCss = `@page vbundle { size: 8.5in 11in; margin: 0.75in; }
.vap-unitwrap { break-before: page; }
.vap-unitwrap > .vap-sheet:first-child { break-before: auto; }
${parts.map((p) => p.css).join("\n")}`;
  const title = `Vocabulary Academy · ${gradeLabel(first.grade)} · ${label}`;
  const doc = documentShell({
    title,
    lang: "en",
    css: printCss(),
    fontCss: fontCss(),
    body,
    band: bandOf(first),
    extraCss,
  });
  return { pdf: await htmlToPdf(browser, doc), title, units: parts.length };
}

// ---- CLI --------------------------------------------------------------------------------------------------------------
function parseArgs(argv) {
  const args = {
    grade: "",
    unit: "all",
    kind: "workbook",
    out: DEFAULT_OUT,
    bundle: false,
    supports: [],
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === "--grade") args.grade = String(next()).toUpperCase();
    else if (a === "--unit") args.unit = next();
    else if (a === "--kind") args.kind = next();
    else if (a === "--out") args.out = next();
    else if (a === "--bundle") args.bundle = true;
    else if (a === "--supports") args.supports = String(next()).split(",");
    else if (a === "--help" || a === "-h") args.help = true;
    else throw new Error(`Unknown option: ${a}`);
  }
  return args;
}

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
const pagesOf = (buf) => (buf.toString("latin1").match(/\/Type\s*\/Page(?![s\w])/g) ?? []).length;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("*/")[0]);
    return;
  }
  mkdirSync(args.out, { recursive: true });
  const grades = args.grade ? [args.grade] : SHIPPED_GRADES;
  const kinds = args.kind === "all" ? PRINT_KINDS : [args.kind];
  for (const k of kinds)
    if (!PRINT_KINDS.includes(k))
      throw new Error(`Unknown kind "${k}" (${PRINT_KINDS.join(", ")})`);
  const browser = await openBrowser();
  let total = 0;
  try {
    if (args.bundle) {
      for (const g of grades) {
        for (const kind of ["workbook", "teacher"]) {
          const r = await renderBundlePdf(browser, g, kind, args);
          if (!r) continue;
          const file = join(
            args.out,
            `g${g}-${kind === "teacher" ? "teacher-guide" : "student-workbook"}-bundle.pdf`,
          );
          writeFileSync(file, r.pdf);
          total += r.pdf.length;
          console.log(`${file}  ${r.units} units  ${pagesOf(r.pdf)} pages  ${kb(r.pdf.length)}`);
        }
      }
    } else {
      for (const g of grades) {
        const units =
          args.unit === "all"
            ? listUnits()
                .filter((u) => u.grade === g)
                .map((u) => u.n)
            : [Number(args.unit)];
        for (const n of units) {
          const unit = loadUnit(g, n);
          if (!unit) {
            console.warn(`g${g} unit ${n}: no unit file, skipped`);
            continue;
          }
          for (const kind of kinds) {
            const r = await renderUnitPdf(browser, unit, kind, args);
            const file = join(args.out, `g${g}-u${two(n)}-${kind}.pdf`);
            writeFileSync(file, r.pdf);
            total += r.pdf.length;
            console.log(
              `${file}  ${KIND_TITLE[kind]}  ${pagesOf(r.pdf)} pages  ${kb(r.pdf.length)}`,
            );
          }
        }
      }
    }
  } finally {
    await browser.close();
  }
  console.log(`total ${(total / 1048576).toFixed(2)} MB`);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
