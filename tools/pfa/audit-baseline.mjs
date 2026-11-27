#!/usr/bin/env node
// Phase 1 baseline audit for the Practice / Family / Assignments (PFA) upgrade.
//
// Writes docs/audit/pfa-url-inventory.json and docs/audit/pfa-baseline-data.json. The
// narrative lives in docs/audit/practice-family-assignments-BASELINE.md, which cites these
// numbers. Read-only against the site: GET requests only.
//
//   node tools/pfa/audit-baseline.mjs [--live https://eduwonderlab.com] [--no-axe] [--no-http]
//
// What it measures, per core lesson (84, from data/curriculum-launch-manifest.json):
//   - every in-scope URL (homework page, family page, assignment sheet + answer key,
//     homework PDF, family take-home sheet EN/ES), HTTP status on the live site,
//     the generator that writes it, and whether the page names its own lesson
//   - Spanish coverage of the page text (share of visible text nodes in a lang="es" scope)
//   - axe (WCAG 2.x A/AA) on one homework, family and assignment page per unit, live

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const LIVE = (
  args.includes("--live") ? args[args.indexOf("--live") + 1] : "https://eduwonderlab.com"
).replace(/\/$/, "");
const DO_AXE = !args.includes("--no-axe");
const DO_HTTP = !args.includes("--no-http");

const manifest = JSON.parse(
  readFileSync(join(ROOT, "data/curriculum-launch-manifest.json"), "utf8"),
);
const lessons = manifest.lessons;

const GENERATORS = {
  homework: "scripts/generate-homework-html.mjs",
  family: "scripts/generate-lesson-support-pages.mjs",
  assignment: "scripts/generate-worksheets.mjs",
  "assignment-key": "scripts/generate-worksheets.mjs",
  "homework-pdf": "scripts/generate-homework-pdf.mjs (publisher homework docx -> pdf)",
  "family-sheet": "scripts/generate-family-takehome.mjs",
  "family-sheet-es": "scripts/generate-family-takehome.mjs",
};

function pagesFor(id) {
  return [
    { kind: "homework", url: `/lessons/${id}/homework`, file: `lessons/${id}/homework.html` },
    { kind: "family", url: `/lessons/${id}/family/`, file: `lessons/${id}/family/index.html` },
    {
      kind: "assignment",
      url: `/lessons/${id}/worksheet.html`,
      file: `lessons/${id}/worksheet.html`,
    },
    {
      kind: "assignment-key",
      url: `/lessons/${id}/worksheet-answer-key.html`,
      file: `lessons/${id}/worksheet-answer-key.html`,
    },
    {
      kind: "homework-pdf",
      url: `/lessons/${id}/downloads/${id}-homework.pdf`,
      file: `lessons/${id}/downloads/${id}-homework.pdf`,
    },
    {
      kind: "family-sheet",
      url: `/lessons/${id}/downloads/${id}-family-sheet.pdf`,
      file: `lessons/${id}/downloads/${id}-family-sheet.pdf`,
    },
    {
      kind: "family-sheet-es",
      url: `/lessons/${id}/downloads/${id}-family-sheet-es.pdf`,
      file: `lessons/${id}/downloads/${id}-family-sheet-es.pdf`,
    },
  ];
}

const strip = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

// Does the page name its own lesson? Title words or "6-6"/"6.6"/"Lesson 6-6".
function namesOwnLesson(html, lesson) {
  const text = strip(html).toLowerCase();
  const [u, n] = lesson.id.split("-");
  const numberHit = new RegExp(`\\b${u}[.\\-]${n}\\b`).test(text);
  const words = lesson.title
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((w) => w.length > 4);
  const titleHit = words.length
    ? words.filter((w) => text.includes(w)).length / words.length >= 0.6
    : false;
  // A FOREIGN lesson number in the <title> or <h1> is the stale-mapping signature.
  const head = `${(html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || ""} ${(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || ""}`;
  const foreign = [...strip(head).matchAll(/\b(?:lesson\s*)?(\d{1,2})[.\-](\d{1,2})\b/gi)]
    .map((m) => `${m[1]}-${m[2]}`)
    .filter((x) => x !== lesson.id);
  return { numberHit, titleHit, foreign: [...new Set(foreign)] };
}

// Spanish coverage: count of distinct Spanish-marked text runs vs English runs.
function spanishCoverage(html) {
  const esBlocks = (html.match(/lang=["']es["'][^>]*>([^<]{3,})/gi) || []).length;
  const esData = (html.match(/data-(?:es|lang-es|text-es)=["'][^"']{3,}/gi) || []).length;
  const esJson = (html.match(/"(?:[a-zA-Z]+Es|es)"\s*:\s*"[^"]{3,}/g) || []).length;
  const words = strip(html).split(" ").length;
  return { esMarkers: esBlocks + esData + esJson, visibleWords: words };
}

async function head(url) {
  try {
    const r = await fetch(url, { method: "GET", redirect: "manual" });
    let final = r.status;
    let location = r.headers.get("location") || null;
    if (r.status >= 300 && r.status < 400 && location) {
      const r2 = await fetch(new URL(location, url), { method: "GET", redirect: "manual" });
      final = r2.status;
      await r2.body?.cancel();
    }
    await r.body?.cancel();
    return { status: r.status, final, location };
  } catch (e) {
    return { status: 0, final: 0, error: String(e.message || e) };
  }
}

async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) {
        const k = i++;
        out[k] = await fn(items[k], k);
      }
    }),
  );
  return out;
}

const inventory = [];
for (const lesson of lessons) {
  for (const p of pagesFor(lesson.id)) {
    const onDisk = existsSync(join(ROOT, p.file));
    let mapping = null;
    let spanish = null;
    let handEdited = false;
    if (onDisk && p.file.endsWith(".html")) {
      const html = readFileSync(join(ROOT, p.file), "utf8");
      mapping = namesOwnLesson(html, lesson);
      spanish = spanishCoverage(html);
      handEdited = html.includes("<!-- hand-edited -->");
    }
    inventory.push({
      lesson: lesson.id,
      unit: lesson.unit,
      title: lesson.title,
      standard: lesson.standard,
      kind: p.kind,
      url: p.url,
      sourceFile: p.file,
      onDisk,
      origin: handEdited ? "hand-edited (generator skips it)" : `generated: ${GENERATORS[p.kind]}`,
      mapping,
      spanish,
    });
  }
}

if (DO_HTTP) {
  // Downloads are R2-backed; a 200 there is what students get.
  const results = await pool(inventory, 8, (row) => head(LIVE + row.url));
  results.forEach((r, k) => {
    inventory[k].http = r;
  });
}

// Hub catalogue mapping: what /curriculum/units/ offers per lesson row.
const hubFile = readFileSync(join(ROOT, "assets/curriculum-hub-search.js"), "utf8");
const hubHomework = (() => {
  const m = hubFile.match(/LESSON_FAMILY_HOMEWORK\s*=\s*(\{[\s\S]*?\n\s*\});/);
  if (!m) return null;
  try {
    return Function(`return ${m[1]}`)();
  } catch {
    return null;
  }
})();
const hubMismatches = [];
if (hubHomework) {
  for (const [key, val] of Object.entries(hubHomework)) {
    const urls = JSON.stringify(val).match(/\/lessons\/([0-9]+-[0-9a-z-]+)\//g) || [];
    for (const u of urls) {
      const id = u.split("/")[2];
      if (id !== key && !id.startsWith(`${key}-`)) hubMismatches.push({ key, linksTo: id });
    }
  }
}

let axe = [];
if (DO_AXE) {
  const { chromium } = await import(join(ROOT, "node_modules/playwright/index.mjs"));
  const axeSource = readFileSync(join(ROOT, "node_modules/axe-core/axe.min.js"), "utf8");
  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROMIUM_PATH || "/opt/pw-browsers/chromium",
  });
  const sample = [];
  for (let unit = 1; unit <= 10; unit++) {
    const first = lessons.find((l) => l.unit === unit && l.id !== "6-6");
    if (!first) continue;
    sample.push({ lesson: first.id, kind: "family", url: `/lessons/${first.id}/family/` });
    sample.push({
      lesson: first.id,
      kind: "assignment",
      url: `/lessons/${first.id}/worksheet.html`,
    });
  }
  sample.unshift({ lesson: "6-6", kind: "homework", url: "/lessons/6-6/homework" });
  sample.unshift({ lesson: "6-6", kind: "family", url: "/lessons/6-6/family/" });
  sample.unshift({ lesson: "6-6", kind: "assignment", url: "/lessons/6-6/worksheet.html" });
  axe = await pool(sample, 3, async (s) => {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    try {
      await page.goto(LIVE + s.url, { waitUntil: "load", timeout: 60000 });
      await page.waitForTimeout(1200);
      await page.addScriptTag({ content: axeSource });
      const res = await page.evaluate(async () =>
        axe.run(document, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] },
        }),
      );
      const v = res.violations.map((x) => ({ id: x.id, impact: x.impact, nodes: x.nodes.length }));
      return {
        ...s,
        serious: v.filter((x) => x.impact === "serious").length,
        critical: v.filter((x) => x.impact === "critical").length,
        violations: v,
      };
    } catch (e) {
      return { ...s, error: String(e.message || e) };
    } finally {
      await page.close();
    }
  });
  await browser.close();
}

mkdirSync(join(ROOT, "docs/audit"), { recursive: true });
writeFileSync(
  join(ROOT, "docs/audit/pfa-url-inventory.json"),
  `${JSON.stringify(inventory, null, 1)}\n`,
);

const byKind = {};
for (const row of inventory) {
  const k = (byKind[row.kind] ||= {
    total: 0,
    onDisk: 0,
    live200: 0,
    nonOk: [],
    foreignNumber: [],
    noOwnName: [],
  });
  k.total++;
  if (row.onDisk) k.onDisk++;
  if (row.http?.final === 200) k.live200++;
  else if (row.http) k.nonOk.push(`${row.url} ${row.http.status}->${row.http.final}`);
  if (row.mapping?.foreign?.length)
    k.foreignNumber.push(`${row.lesson}: ${row.mapping.foreign.join(",")}`);
  if (row.mapping && !row.mapping.numberHit && !row.mapping.titleHit) k.noOwnName.push(row.lesson);
}
const spanishByUnit = {};
for (const row of inventory.filter((r) => r.spanish)) {
  const u = (spanishByUnit[`${row.kind}:${row.unit}`] ||= { pages: 0, withSpanish: 0 });
  u.pages++;
  if (row.spanish.esMarkers > 5) u.withSpanish++;
}
const summary = {
  live: LIVE,
  at: new Date().toISOString(),
  lessons: lessons.length,
  byKind,
  spanishByUnit,
  hubMismatches,
  axe,
};
writeFileSync(
  join(ROOT, "docs/audit/pfa-baseline-data.json"),
  `${JSON.stringify(summary, null, 1)}\n`,
);
for (const [k, v] of Object.entries(byKind)) {
  console.log(
    `${k.padEnd(16)} total ${v.total} onDisk ${v.onDisk} live200 ${v.live200} foreign# ${v.foreignNumber.length} unnamed ${v.noOwnName.length}`,
  );
}
console.log("hub mismatches", hubMismatches.length);
for (const a of axe)
  console.log("axe", a.kind, a.url, a.error || `serious ${a.serious} critical ${a.critical}`);
