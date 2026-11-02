#!/usr/bin/env node
/**
 * validate-family-print: the Family Take-Home Sheet is a print document a family can use, not a web page that was
 * printed. For every family lesson (166) in English and Spanish it reads lessons/<id>/downloads/<id>-family-sheet[-es].pdf
 * and -family-guide[-es].pdf, and the Word file, and fails on:
 *   MISSING    a PDF or Word file is absent (a sweep of zero files FAILS)
 *   PAGES      the sheet runs past 2 pages, or the grown-up page past 1
 *   ORPHAN     a page below the first is mostly white (the last page must carry real content)
 *   TYPE       any shown text under 11pt (read from the PDF's own content streams)
 *   TAGGED     no structure tree / not marked / no /Lang / language is not the file's language / no title
 *   FONTS      a font that is not embedded
 *   QR         the sheet has no link to the lesson's interactive page, or the page is missing, or the short link is not printed
 *   GRADING    "earn 1 point", "Period:", "check your mathematics", score or grade words
 *   ANSWERS    the sheet does not have exactly one "My answer" line per practice item
 *   PARITY     English and Spanish differ in page count, practice items or answer lines
 *   STANDARD   the sheet does not print the lesson's own standard code (the all-surfaces check is validate:family-standards)
 * Needs poppler (pdfinfo, pdffonts, pdftotext, pdftoppm). Every detector self-tests on a synthetic bad case first.
 *
 *   node tools/validate-family-print.mjs            all lessons
 *   node tools/validate-family-print.mjs 4-5 3-1    only these ids
 */
import { execFile } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { deflateSync } from "node:zlib";
import { buildTakeHome, SHEET_UI } from "../scripts/lib/family-takehome-data.mjs";
import {
  fittedItemCount,
  listFamilyIds,
  outputPaths,
} from "../scripts/lib/family-takehome-files.mjs";
import { webSheets } from "../scripts/lib/homework-print-plan.mjs";
import { interactiveUrl, lessonStandard, shortLink } from "../scripts/lib/lesson-identity.mjs";
import { minTextSize } from "../scripts/lib/pdf-text-sizes.mjs";
import { lessonPath, REPO_ROOT } from "./lib/curriculum-source.mjs";

const run = promisify(execFile);
const BIG = { maxBuffer: 64 * 1024 * 1024 };

export const MAX_SHEET_PAGES = 2;
export const MAX_GUIDE_PAGES = 1;
export const MIN_TYPE_PT = 10.95; // 11pt, allowing Chrome's own rounding
export const MIN_FILL = 0.25; // a page after the first must reach 25% of the live area
const DPI = 30;
const INK_BELOW = 230;
const LIVE_TOP_IN = 0.55;
const LIVE_BOTTOM_IN = 10.3; // the running footer sits in the margin below this line

/**
 * The grading scaffolding the brief bans on a take-home ("earn 1 point", Period line, "check your mathematics").
 * Deliberately NOT bare words: lesson stories use "score", "points", "earned" and "calificaciones" as mathematics
 * (a board game score of -58, "5 dollars earned"), and a gate that flags them would be turned off.
 */
export const GRADING = [
  /\bearn(s|ed)? (a |an |one |\d+ )?(points?|stars?|badges?|credit)\b/i,
  /\b(\d+|one|two|three) points? (for|each|per)\b/i,
  /\bworth \d+ points?\b/i,
  /\b(score|grade)\s*:\s*(_|\d+\s*(\/|of|de)\b)/i,
  /\bgrad(ed|ing)\b/i,
  /\bperiod\s*[:_]/i,
  /\bclass period\b/i,
  /check your mathematics/i,
  /\bgrade yourself\b/i,
  /\b(calificaci[oó]n|puntuaci[oó]n|per[ií]odo)\s*[:_]/i,
  /\bgana(s|r)? (un |1 )punto\b/i,
];

/** Findings in `text` that read as grading, not helping. Pure. */
export const gradingFindings = (text) =>
  GRADING.filter((re) => re.test(text)).map((re) => `grading language ${re}`);

/** The fraction of the live area, from the top, that the lowest ink reaches. Pure; `pgm` = { w, h, data }. */
export function pageFill({ w, h, data }) {
  const top = Math.round(LIVE_TOP_IN * DPI);
  const bottom = Math.min(h, Math.round(LIVE_BOTTOM_IN * DPI));
  for (let y = bottom - 1; y >= top; y--) {
    for (let x = 0; x < w; x++)
      if (data[y * w + x] < INK_BELOW) return (y - top + 1) / (bottom - top);
  }
  return 0;
}

function parsePgm(buf) {
  let pos = 0;
  const token = () => {
    while (buf[pos] <= 32) pos++;
    let s = "";
    while (buf[pos] > 32) s += String.fromCharCode(buf[pos++]);
    return s;
  };
  if (token() !== "P5") throw new Error("not a P5 pgm");
  const w = Number(token());
  const h = Number(token());
  token();
  pos++;
  return { w, h, data: buf.subarray(pos) };
}

/** Pure: findings for one analyzed PDF. `a` = { pages, fills, minType, fontsEmbedded, tagged, lang, title, text, uris }. */
export function pdfFindings(a, { maxPages, lang, expectedUrl }) {
  const f = [];
  if (a.pages > maxPages) f.push(`PAGES: ${a.pages} pages (max ${maxPages})`);
  a.fills.forEach((fill, i) => {
    if (i > 0 && fill < MIN_FILL)
      f.push(`ORPHAN: page ${i + 1} is only ${Math.round(fill * 100)}% filled`);
  });
  if (a.minType === null) f.push("TYPE: no text found");
  else if (a.minType < MIN_TYPE_PT) f.push(`TYPE: text as small as ${a.minType}pt (min 11pt)`);
  if (!a.fontsEmbedded) f.push("FONTS: a font is not embedded");
  if (!a.tagged) f.push("TAGGED: no structure tree or not marked");
  if (!a.lang?.toLowerCase().startsWith(lang))
    f.push(`TAGGED: language is "${a.lang ?? "none"}", expected ${lang}`);
  if (!a.title?.trim()) f.push("TAGGED: no document title");
  if (expectedUrl !== undefined && !a.uris.includes(expectedUrl))
    f.push(`QR: no link to ${expectedUrl}`);
  for (const g of gradingFindings(a.text)) f.push(`GRADING: ${g}`);
  return f;
}

const count = (text, needle) => text.split(needle).length - 1;

/** Pure: sheet-only findings (answer lines, standard code, printed short link). */
export function sheetFindings({ text, items, ui, standard, link }) {
  const f = [];
  const lines = count(text, ui.answer) + count(text, ui.thinking);
  if (lines !== items) f.push(`ANSWERS: ${lines} answer lines for ${items} practice items`);
  if (!text.includes(standard)) f.push(`STANDARD: the sheet does not print ${standard}`);
  if (!text.replace(/\s+/g, "").includes(link)) f.push(`QR: short link ${link} is not printed`);
  return f;
}

async function analyze(pdf) {
  const dir = mkdtempSync(join(tmpdir(), "family-print-"));
  try {
    const [info, fonts, text] = await Promise.all([
      run("pdfinfo", [pdf], BIG),
      run("pdffonts", [pdf], BIG),
      run("pdftotext", [pdf, "-"], BIG),
      run("pdftoppm", ["-r", String(DPI), "-gray", pdf, join(dir, "p")], BIG),
    ]).then(([i, f, t]) => [i.stdout, f.stdout, t.stdout]);
    const bytes = readFileSync(pdf);
    const raw = bytes.toString("latin1");
    const fontRows = fonts.split("\n").slice(2).filter(Boolean);
    return {
      pages: Number(/Pages:\s+(\d+)/.exec(info)?.[1] ?? 0),
      title: /Title:\s*(.*)/.exec(info)?.[1],
      tagged: /\/StructTreeRoot/.test(raw) && /\/Marked\s+true/.test(raw),
      lang: /\/Lang\s*\(([^)]*)\)/.exec(raw)?.[1],
      uris: [...raw.matchAll(/\/URI\s*\(([^)]*)\)/g)].map((m) => m[1]),
      fontsEmbedded:
        fontRows.length > 0 &&
        fontRows.every((r) => /\byes\b/.test(r.slice(r.search(/\s(yes|no)\s/)))),
      minType: minTextSize(bytes),
      fills: readdirSync(dir)
        .filter((n) => n.endsWith(".pgm"))
        .sort()
        .map((n) => pageFill(parsePgm(readFileSync(join(dir, n))))),
      text,
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// ---------- self-test: every detector must fire on a synthetic bad case, stay quiet on a good one ----------

function flate(content) {
  return deflateSync(Buffer.from(content, "latin1"));
}

function uiFindings() {
  return ["en", "es"].flatMap((lang) =>
    Object.values(SHEET_UI[lang])
      .flat()
      .flatMap((text) => gradingFindings(String(text)).map((x) => `UI string "${text}": ${x}`)),
  );
}

function selfTest() {
  const must = (cond, msg) => {
    if (!cond) throw new Error(`self-test: ${msg}`);
  };
  must(
    gradingFindings("Exercises 1-12 earn 1 point for a correct response").length > 0,
    "grading: 'earn 1 point' not caught",
  );
  must(
    gradingFindings("Name ____ Date ____ Period ____").length > 0,
    "grading: Period line not caught",
  );
  must(
    gradingFindings("Check your mathematics before you move on").length > 0,
    "grading: 'check your mathematics' not caught",
  );
  must(
    gradingFindings(
      "Plot 2 points. In a game your score is -58; 5 dollars earned; compare dos calificaciones.",
    ).length === 0,
    "grading: lesson words (points, score, earned, calificaciones) must pass",
  );
  must(
    gradingFindings("Score: 4 of 6").length > 0 && gradingFindings("Score: ____").length > 0,
    "grading: 'Score:' label not caught",
  );
  must(
    gradingFindings("Un sueter cuesta $42 despues de una oferta.").length === 0,
    "grading: clean Spanish flagged",
  );

  const stream = (size) =>
    Buffer.concat([
      Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nstream\n", "latin1"),
      flate(`q 1 0 0 1 0 0 cm BT /F1 ${size} Tf 1 0 0 1 10 10 Tm (Hello) Tj ET Q`),
      Buffer.from("\nendstream\n", "latin1"),
    ]);
  must(minTextSize(stream(9)) === 9, "type: 9pt text not measured");
  must(
    minTextSize(
      Buffer.concat([
        Buffer.from("%PDF-1.4\nstream\n"),
        flate("q 0.5 0 0 0.5 0 0 cm BT /F1 20 Tf 1 0 0 1 0 0 Tm <0001> Tj ET Q"),
        Buffer.from("\nendstream"),
      ]),
    ) === 10,
    "type: the current transform must scale the size",
  );
  must(
    minTextSize(Buffer.from("%PDF-1.4\n")) === null,
    "type: a PDF with no text must report null",
  );

  const sparse = { w: 4, h: 330, data: new Uint8Array(4 * 330).fill(255) };
  must(pageFill(sparse) === 0, "orphan: a blank page must fill 0");
  const full = { w: 4, h: 330, data: new Uint8Array(4 * 330).fill(255) };
  full.data[4 * 300] = 0;
  must(pageFill(full) > 0.9, "orphan: ink near the bottom must fill > 90%");

  const base = {
    pages: 2,
    fills: [0.9, 0.6],
    minType: 11,
    fontsEmbedded: true,
    tagged: true,
    lang: "en",
    title: "T",
    text: "ok",
    uris: ["u"],
  };
  const opts = { maxPages: 2, lang: "en", expectedUrl: "u" };
  must(pdfFindings(base, opts).length === 0, "the clean fixture was flagged");
  const kinds = (patch, o = opts) =>
    pdfFindings({ ...base, ...patch }, o).map((x) => x.split(":")[0]);
  must(kinds({ pages: 3 }).includes("PAGES"), "PAGES did not fire");
  must(kinds({ fills: [0.9, 0.1] }).includes("ORPHAN"), "ORPHAN did not fire");
  must(kinds({ minType: 9 }).includes("TYPE"), "TYPE did not fire");
  must(kinds({ fontsEmbedded: false }).includes("FONTS"), "FONTS did not fire");
  must(kinds({ tagged: false }).includes("TAGGED"), "TAGGED (tree) did not fire");
  must(kinds({ lang: "es" }).includes("TAGGED"), "TAGGED (language) did not fire");
  must(kinds({ title: " " }).includes("TAGGED"), "TAGGED (title) did not fire");
  must(kinds({ uris: [] }).includes("QR"), "QR did not fire");
  must(kinds({ text: "earn 1 point" }).includes("GRADING"), "GRADING did not fire");
  const ui = SHEET_UI.en;
  must(
    sheetFindings({
      text: `${ui.answer} ${ui.answer} 6.AT.4 a.b/c`,
      items: 3,
      ui,
      standard: "6.AT.4",
      link: "a.b/c",
    }).some((x) => x.startsWith("ANSWERS")),
    "ANSWERS did not fire",
  );
  must(
    sheetFindings({
      text: `${ui.answer} a.b/c`,
      items: 1,
      ui,
      standard: "6.AT.4",
      link: "a.b/c",
    }).some((x) => x.startsWith("STANDARD")),
    "STANDARD did not fire",
  );
  must(
    webFindings("<html></html>", "4-5", "en", "<article/>", /nope/).length === 3,
    "WEB did not fire on a page with no sheet, button or print css",
  );
  must(
    webFindings(
      "<article/><button data-print-plan>x</button>body.fm-print-plan",
      "4-5",
      "en",
      "<article/>",
      /body\.fm-print-plan/,
    ).length === 0,
    "WEB flagged a good page",
  );
  must(
    sheetFindings({
      text: `${ui.answer} 6.AT.4`,
      items: 1,
      ui,
      standard: "6.AT.4",
      link: "a.b/c",
    }).some((x) => x.startsWith("QR")),
    "short-link detector did not fire",
  );
}

// ---------- sweep ----------

async function pool(items, size, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      for (let i = next++; i < items.length; i = next++) out[i] = await fn(items[i]);
    }),
  );
  return out;
}

/** Pure: the web "Print this plan" must carry the same sheet the PDF is made from, a button, and the print stylesheet. */
export function webFindings(
  html,
  id,
  lang,
  expectedSheet = webSheets(id)[lang === "en" ? 0 : 1],
  printCss = SHARED_CSS,
) {
  const f = [];
  if (!html.includes(expectedSheet))
    f.push(
      `WEB: homework.html does not embed the current ${lang} take-home sheet (run generate-homework-html)`,
    );
  if (!/<button[^>]*data-print-plan/.test(html)) f.push("WEB: no Print this plan button");
  if (!/body\.fm-print-plan/.test(html) && !printCss.test(linkedCss(html)))
    f.push("WEB: the page loads no @media print sheet for the plan");
  return f;
}

function linkedCss(html) {
  return [...html.matchAll(/href="\/(assets\/homework\/[\w.-]+\.css)"/g)]
    .map((m) => readFileSync(join(REPO_ROOT, m[1]), "utf8"))
    .join("\n");
}
const SHARED_CSS = /body\.fm-print-plan/;

async function main() {
  selfTest();
  const uiBad = uiFindings();
  if (uiBad.length) {
    console.error(uiBad.join("\n"));
    process.exit(1);
  }
  const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const ids = listFamilyIds().filter((id) => !only.length || only.includes(id));
  const failures = [];
  let checked = 0;
  const jobs = ids.flatMap((id) => ["en", "es"].map((lang) => ({ id, lang })));
  const results = await pool(jobs, 6, async ({ id, lang }) => {
    const found = [];
    const files = outputPaths(id, lang);
    const ui = SHEET_UI[lang];
    const homepage = existsSync(lessonPath(id, "homework.html"));
    if (!homepage) found.push("QR: the interactive page lessons/<id>/homework.html does not exist");
    else
      for (const x of webFindings(readFileSync(lessonPath(id, "homework.html"), "utf8"), id, lang))
        found.push(x);
    const stats = {};
    for (const [kind, file, max] of [
      ["sheet", files.sheetPdf, MAX_SHEET_PAGES],
      ["guide", files.guidePdf, MAX_GUIDE_PAGES],
    ]) {
      if (!existsSync(file)) {
        found.push(`MISSING: ${kind} PDF`);
        continue;
      }
      checked++;
      const a = await analyze(file);
      stats[kind] = a;
      for (const x of pdfFindings(a, {
        maxPages: max,
        lang,
        expectedUrl: kind === "sheet" ? interactiveUrl(id) : undefined,
      }))
        found.push(`${kind}: ${x}`);
    }
    if (!existsSync(files.docx)) found.push("MISSING: Word file");
    else checked++;
    if (stats.sheet) {
      const items = buildTakeHome(id, lang, { items: fittedItemCount(id) }).items.length;
      stats.items = items;
      for (const x of sheetFindings({
        text: stats.sheet.text,
        items,
        ui,
        standard: lessonStandard(id),
        link: shortLink(id),
      }))
        found.push(`sheet: ${x}`);
    }
    return { id, lang, found, stats };
  });
  for (const r of results) for (const x of r.found) failures.push(`${r.id} ${r.lang}: ${x}`);
  for (const id of ids) {
    const en = results.find((r) => r.id === id && r.lang === "en");
    const es = results.find((r) => r.id === id && r.lang === "es");
    for (const kind of ["sheet", "guide"]) {
      if (en.stats[kind] && es.stats[kind] && en.stats[kind].pages !== es.stats[kind].pages)
        failures.push(
          `${id}: PARITY: ${kind} is ${en.stats[kind].pages} page(s) in English and ${es.stats[kind].pages} in Spanish`,
        );
    }
    if (en.stats.items !== es.stats.items)
      failures.push(
        `${id}: PARITY: ${en.stats.items} practice items in English, ${es.stats.items} in Spanish`,
      );
  }
  if (!checked) {
    console.error(
      "validate-family-print: FAIL - no take-home files found; a sweep of zero verifies nothing.",
    );
    process.exit(1);
  }
  if (failures.length) {
    console.error(failures.slice(0, 60).join("\n"));
    console.error(
      `validate-family-print: FAIL - ${failures.length} finding(s) across ${checked} files.`,
    );
    process.exit(1);
  }
  console.log(
    `validate-family-print: PASS - ${checked} files for ${ids.length} lessons (EN + ES): <= 2-page sheets, 1-page grown-up pages, no orphan page, nothing under 11pt, tagged with title and language, QR links resolve, no grading language, EN/ES parity.`,
  );
}

main().catch((error) => {
  console.error(`validate-family-print: ${error.stack ?? error}`);
  process.exit(1);
});
