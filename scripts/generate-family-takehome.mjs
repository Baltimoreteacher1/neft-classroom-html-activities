#!/usr/bin/env node
/**
 * Family Take-Home Sheet: PDF + Word for every family homework lesson, English and Spanish.
 *
 *   node scripts/generate-family-takehome.mjs              # all 166 lessons
 *   node scripts/generate-family-takehome.mjs 4-5 3-1      # these lessons
 *   node scripts/generate-family-takehome.mjs --force      # ignore the hash manifest
 *
 * Per lesson, in lessons/<id>/downloads/:
 *   <id>-family-sheet.pdf    <id>-family-sheet-es.pdf     the take-home sheet (max 2 pages, Letter)
 *   <id>-family-guide.pdf    <id>-family-guide-es.pdf     the grown-up page: answers and talk notes (1 page)
 *   <id>-family-sheet.docx   <id>-family-sheet-es.docx    both, editable (real headings, alt text, numbered lists)
 *
 * PDFs come from the same markup the web "Print this plan" shows (scripts/lib/family-takehome-html.mjs), printed by
 * the repo's pinned Chromium (Playwright) with tagging on: no network (fonts are embedded as data URIs), no LibreOffice.
 * Without a browser the script says so and exits 0, like the notes PDF generator; validate:family-print then fails the
 * missing files. The Word files need no browser.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { lessonPath } from "../tools/lib/curriculum-source.mjs";
import { skipExit } from "../tools/lib/skip-exit.mjs";
import { buildTakeHome, LANGS, MAX_ITEMS, MIN_ITEMS } from "./lib/family-takehome-data.mjs";
import { buildDocx } from "./lib/family-takehome-docx.mjs";
import { listFamilyIds, outputPaths } from "./lib/family-takehome-files.mjs";
import { renderGuide, renderSheet, standaloneDocument } from "./lib/family-takehome-html.mjs";
import { readManifest, sha256, writeManifest } from "./lib/student-pdf.mjs";

const GENERATOR_VERSION = "family-takehome-1";
const CONCURRENCY = 4;

const args = process.argv.slice(2);
const force = args.includes("--force");
const only = args.filter((a) => !a.startsWith("--"));
const ids = listFamilyIds().filter((id) => !only.length || only.includes(id));
if (only.length && ids.length !== only.length) {
  console.error(`generate-family-takehome: unknown lesson id in ${only.join(", ")}`);
  process.exit(1);
}

const manifest = readManifest();

let browser = null;
async function openBrowser() {
  if (browser) return browser;
  try {
    browser = await chromium.launch();
  } catch (error) {
    process.exit(
      skipExit(
        "no Chromium for Playwright",
        `install it (npx playwright install chromium) to build the PDFs: ${error.message.split("\n")[0]}`,
      ),
    );
  }
  return browser;
}

const footerOf = (data) => `${data.label} · ${data.standard} · Family Math Studio`;
const pageCount = (buffer) =>
  (buffer.toString("latin1").match(/\/Type\s*\/Page(?![s\w])/g) ?? []).length;

// Letter minus margins (0.55in sides, 0.55in top, 0.65in bottom), in CSS px
const CONTENT_WIDTH_PX = 710;
const CONTENT_HEIGHT_PX = 940;

/**
 * Two-page sheets whose second page would carry only a few lines get a deliberate break before "Talk about it", so
 * page 2 is a real page (talk, mission, stuck box, QR) instead of an orphan. Measured, not guessed.
 */
async function renderBuffer(page, data, body) {
  const doc = (b) =>
    standaloneDocument({
      title: `${data.label}: ${data.title}`,
      lang: data.lang,
      body: b,
      footerLeft: footerOf(data),
    });
  await page.setViewportSize({ width: CONTENT_WIDTH_PX, height: CONTENT_HEIGHT_PX });
  await page.emulateMedia({ media: "print" });
  await page.setContent(doc(body));
  const height = await page.evaluate(
    () => document.querySelector("article").getBoundingClientRect().height,
  );
  if (
    body.includes('class="fm-th ') &&
    height > CONTENT_HEIGHT_PX &&
    height < CONTENT_HEIGHT_PX * 1.45
  ) {
    await page.setContent(doc(body.replace('class="fm-th ', 'class="fm-th fm-th-split ')));
  }
  return page.pdf({
    format: "Letter",
    tagged: true,
    outline: false,
    preferCSSPageSize: true,
    printBackground: true,
  });
}

/**
 * How many practice items (6 down to 4) fit the sheet in 2 pages in BOTH languages. English and Spanish always
 * carry the same number of items (parity), so the longer language decides. Cached against the lesson's content.
 */
async function fitItemCount(id, contentHash) {
  const key = `${id}/family-items`;
  const cached = /^(\w+):(\d)$/.exec(manifest[key] ?? "");
  if (!force && cached?.[1] === contentHash) return Number(cached[2]);
  const page = await (await openBrowser()).newPage();
  try {
    for (let n = MAX_ITEMS; n >= MIN_ITEMS; n--) {
      let fits = true;
      for (const lang of LANGS) {
        const data = buildTakeHome(id, lang, { items: n });
        fits &&= pageCount(await renderBuffer(page, data, renderSheet(data))) <= 2;
      }
      if (fits || n === MIN_ITEMS) {
        manifest[key] = `${contentHash}:${n}`;
        if (!fits)
          console.warn(
            `generate-family-takehome: ${id} still exceeds 2 pages with ${MIN_ITEMS} items`,
          );
        return n;
      }
    }
  } finally {
    await page.close();
  }
}

const jobs = [];
for (const id of ids) {
  const contentHash = sha256(
    GENERATOR_VERSION,
    ...LANGS.map((l) => JSON.stringify(buildTakeHome(id, l))),
  ).slice(0, 16);
  const items = await fitItemCount(id, contentHash);
  for (const lang of LANGS) {
    const data = buildTakeHome(id, lang, { items });
    const files = outputPaths(id, lang);
    const parts = [
      { kind: "sheet", file: files.sheetPdf, body: renderSheet(data) },
      { kind: "guide", file: files.guidePdf, body: renderGuide(data) },
    ];
    for (const p of parts) {
      const key = `${id}/family-${p.kind}-${lang}`;
      const hash = sha256(GENERATOR_VERSION, p.body, data.label, data.standard);
      if (!force && manifest[key] === hash && existsSync(p.file)) continue;
      jobs.push({ type: "pdf", key, hash, file: p.file, data, body: p.body, kind: p.kind });
    }
    const key = `${id}/family-docx-${lang}`;
    const hash = sha256(GENERATOR_VERSION, JSON.stringify(data));
    if (force || manifest[key] !== hash || !existsSync(files.docx))
      jobs.push({ type: "docx", key, hash, file: files.docx, data });
  }
}

async function printPdf(page, job) {
  writeFileSync(job.file, await renderBuffer(page, job.data, job.body));
}

let wrote = 0;
const failures = [];
const queue = jobs.slice();
async function worker() {
  const page = jobs.some((j) => j.type === "pdf") ? await (await openBrowser()).newPage() : null;
  for (let job = queue.shift(); job; job = queue.shift()) {
    try {
      mkdirSync(lessonPath(job.data.id, "downloads"), { recursive: true });
      if (job.type === "pdf") await printPdf(page, job);
      else writeFileSync(job.file, await buildDocx(job.data));
      manifest[job.key] = job.hash;
      wrote++;
    } catch (error) {
      delete manifest[job.key];
      failures.push(`${job.key}: ${error.message}`);
    }
  }
  await page?.close();
}
try {
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
} finally {
  await browser?.close();
  writeManifest(manifest);
}
console.log(
  `generate-family-takehome: wrote ${wrote} of ${jobs.length} stale file(s) for ${ids.length} lesson(s).`,
);
if (failures.length) {
  console.error(failures.slice(0, 20).join("\n"));
  process.exit(1);
}
