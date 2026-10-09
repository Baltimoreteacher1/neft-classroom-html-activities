#!/usr/bin/env node
/**
 * validate-lesson-labels.mjs — a student-visible lesson number names the lesson
 * the page belongs to, in the course's CURRENT (Reveal TOC) numbering.
 *
 * WHY. On 2026-08-10 every lesson was renumbered to the publisher's TOC
 * (data/toc-migration.json). Directories moved; several labels did not. The
 * 2026-10-08 audit found all 64 Get Ready pages still announcing the OLD number
 * ("Get Ready · Lesson 8-1 … Unit 8 · Lesson 1" at /lessons/2-1/readiness/),
 * 45 of them under another lesson's title; Lesson 2-3's second Reveal document
 * set headed "Lesson 2-6 · Warm-Up"; and the bilingual study guides numbered
 * Statistics as Unit 8 and listed a Unit 10 that is not taught. Every one of
 * those pages built, parsed and served 200, so no existing gate could see it.
 *
 * Three surfaces, one rule — the label must agree with
 * data/curriculum-launch-manifest.json:
 *
 *   1. lessons/<id>/readiness/index.html — every "Lesson X-Y" in the visible
 *      text and <title> is <id>; "Unit N · Lesson M" is the manifest's unit and
 *      lesson; the <h1> carries the manifest title; the Warm-Up hand-off posts
 *      its own id.
 *   2. lessons/<id>/downloads/reveal/**.docx — a paragraph that STARTS with
 *      "Lesson X-Y" (the document heading / footer) names <id>. Paragraphs that
 *      merely mention another lesson ("From Lesson 2-2 Session 1") are not
 *      headings and are not checked.
 *   3. esol/reveal-math-guides/ — every index card's lessons exist and sit in
 *      the unit section that lists them; every guide's "Unit N: … Lesson(s) …"
 *      line names lessons of unit N; no Unit 10 section (Unit 10 is not taught).
 *
 * Self-tests its detectors against known-bad fixtures BEFORE sweeping.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";
import { CORE_ID_RE, LESSONS_DIR, listLessonDirs } from "./lib/curriculum-source.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(
  readFileSync(join(ROOT, "data/curriculum-launch-manifest.json"), "utf8"),
);
const LESSONS = new Map(manifest.lessons.map((l) => [l.id, l]));

const decode = (s) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&middot;/g, "·")
    .replace(/&bull;/g, "•")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));

/** Visible text: no scripts, styles or comments; tags become spaces. */
function visibleText(html) {
  return decode(
    html
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  ).replace(/\s+/g, " ");
}

/* ── detectors ───────────────────────────────────────────────────────────── */

export function readinessProblems(id, html, lesson) {
  const out = [];
  if (!lesson) return [`${id}: readiness page for a lesson that is not in the launch manifest`];
  const title = decode((html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || "").trim();
  const text = `${title} ${visibleText(html)}`;
  for (const m of text.matchAll(/\bLesson (\d+-\d+)\b/g)) {
    if (m[1] !== id) out.push(`${id}: shows "Lesson ${m[1]}"`);
  }
  for (const m of text.matchAll(/\bUnit (\d+) · Lesson (\d+)\b/g)) {
    if (Number(m[1]) !== lesson.unit || Number(m[2]) !== lesson.lesson) {
      out.push(
        `${id}: shows "Unit ${m[1]} · Lesson ${m[2]}" (manifest: ${lesson.unit}-${lesson.lesson})`,
      );
    }
  }
  const h1 = visibleText((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || "").trim();
  if (h1 !== `Get Ready: ${lesson.title}`) {
    out.push(`${id}: <h1> is "${h1}", manifest title is "${lesson.title}"`);
  }
  if (!title.startsWith(`Get Ready · Lesson ${id}: ${lesson.title}`)) {
    out.push(`${id}: <title> is "${title}"`);
  }
  for (const m of html.matchAll(/nt-readiness-complete", lessonId: "([^"]*)"/g)) {
    if (m[1] !== id) out.push(`${id}: Warm-Up hand-off posts lessonId "${m[1]}"`);
  }
  return out;
}

/** Paragraph texts of one WordprocessingML part. */
function paragraphs(xml) {
  return xml
    .split("</w:p>")
    .map((p) =>
      decode(
        (p.match(/<w:t(?:\s[^>]*)?>[^<]*<\/w:t>/g) || [])
          .map((t) => t.replace(/<[^>]+>/g, ""))
          .join(""),
      ).trim(),
    );
}

export function docxHeadingProblems(id, where, texts) {
  const out = [];
  for (const t of texts) {
    const m = t.match(/^LESSON\s+(\d+)\s*[-.–]\s*(\d+)\b/i);
    if (m && `${m[1]}-${m[2]}` !== id)
      out.push(`${where}: heading "${t.slice(0, 70)}" — page is Lesson ${id}`);
  }
  return out;
}

const lessonList = (s) =>
  s
    .split(/\s*,\s*/)
    .map((x) => x.trim())
    .filter(Boolean);

export function guideMetaProblems(file, html) {
  const out = [];
  const meta = (html.match(/<div class="guide-meta">([\s\S]*?)<\/div>/) || [])[1];
  if (!meta) return [`${file}: no guide-meta line`];
  const text = visibleText(meta).trim();
  const m = text.match(/^Unit (\d+):.*?• Lessons? ([^•]+?) •/);
  if (!m) return [`${file}: guide-meta "${text}" does not read "Unit N: … • Lesson(s) X-Y, … •"`];
  for (const id of lessonList(m[2])) {
    const l = LESSONS.get(id);
    if (!/^\d+-\d+$/.test(id) || !l) out.push(`${file}: names "${id}", not a course lesson`);
    else if (l.unit !== Number(m[1]))
      out.push(`${file}: says Unit ${m[1]} but Lesson ${id} is in Unit ${l.unit}`);
  }
  return out;
}

export function guideIndexProblems(html) {
  const out = [];
  const sections = html.split(/<div class="unit-section">/).slice(1);
  if (!sections.length) return ["index: no unit sections"];
  for (const sec of sections) {
    const unit = Number((visibleText(sec).match(/Unit (\d+):/) || [])[1]);
    if (!unit) {
      out.push("index: a unit section has no 'Unit N:' title");
      continue;
    }
    if (unit === 10 || !manifest.lessons.some((l) => l.unit === unit)) {
      out.push(`index: lists a Unit ${unit} section`);
    }
    for (const c of sec.matchAll(/<div class="card-id">([^<]*)<\/div>/g)) {
      const m = c[1].trim().match(/^Lessons? (.+)$/);
      if (!m) {
        out.push(`index: Unit ${unit} card labelled "${c[1].trim()}", not "Lesson(s) X-Y"`);
        continue;
      }
      for (const id of lessonList(m[1])) {
        const l = LESSONS.get(id);
        if (!l) out.push(`index: card names "${id}", not a course lesson`);
        else if (l.unit !== unit) out.push(`index: Lesson ${id} listed under Unit ${unit}`);
      }
    }
  }
  return out;
}

/* ── self-test: the detectors must fire ──────────────────────────────────── */

const L21 = { id: "2-1", unit: 2, lesson: 1, title: "Understand Statistical Questions" };
const goodReady =
  "<title>Get Ready · Lesson 2-1: Understand Statistical Questions — Neft Teacher</title>" +
  "<h1>Get Ready: Understand Statistical Questions</h1><span>Unit 2 · Lesson 1</span>" +
  '<a>Start Lesson 2-1</a><script>({ type: "nt-readiness-complete", lessonId: "2-1" })</script>';
const selftests = [
  ["a correct readiness page passes", () => readinessProblems("2-1", goodReady, L21).length === 0],
  [
    "the 2026-10-08 defect (old number + old title) is caught",
    () =>
      readinessProblems(
        "2-1",
        goodReady
          .replace(
            "Lesson 2-1: Understand Statistical Questions",
            "Lesson 8-1: Statistical Questions and Data",
          )
          .replace("Unit 2 · Lesson 1", "Unit 8 · Lesson 1"),
        L21,
      ).length >= 2,
  ],
  [
    "a wrong <h1> title is caught",
    () =>
      readinessProblems(
        "2-1",
        goodReady.replace("<h1>Get Ready: Understand", "<h1>Get Ready: Old"),
        L21,
      ).length === 1,
  ],
  [
    "a hand-off posting the old id is caught",
    () =>
      readinessProblems("2-1", goodReady.replace('lessonId: "2-1"', 'lessonId: "8-1"'), L21)
        .length === 1,
  ],
  [
    "an old number inside a <script> is not visible text",
    () =>
      readinessProblems("2-1", `${goodReady}<script>var x = "Lesson 9-9";</script>`, L21).length ===
      0,
  ],
  [
    "a docx heading naming another lesson is caught",
    () => docxHeadingProblems("2-3", "x", ["Lesson 2-6  ·  Warm-Up"]).length === 1,
  ],
  [
    "an upper-case exit-ticket heading is caught",
    () => docxHeadingProblems("2-3", "x", ["LESSON 2-6"]).length === 1,
  ],
  [
    "a correct docx heading passes",
    () => docxHeadingProblems("2-3", "x", ["Lesson 2-3  ·  Session 1"]).length === 0,
  ],
  [
    "a mention that is not a heading passes",
    () => docxHeadingProblems("2-3", "x", ["From Lesson 2-2 Session 1"]).length === 0,
  ],
  [
    "a guide in the wrong unit is caught",
    () =>
      guideMetaProblems(
        "g",
        '<div class="guide-meta">Unit 8: Statistics &bull; Lesson 2-1 &bull; Standard</div>',
      ).length === 1,
  ],
  [
    "a guide with dotted old-style lesson numbers is caught",
    () =>
      guideMetaProblems(
        "g",
        '<div class="guide-meta">Unit 1: Number Sense &bull; Lessons 1.1&ndash;1.3 &bull; S</div>',
      ).length >= 1,
  ],
  [
    "a correct guide passes",
    () =>
      guideMetaProblems(
        "g",
        '<div class="guide-meta">Unit 2: Statistics &bull; Lessons 2-3, 2-8 &bull; S</div>',
      ).length === 0,
  ],
  [
    "an index Unit 10 section is caught",
    () =>
      guideIndexProblems(
        '<div class="unit-section"><div class="unit-title">Unit 10: Volume</div></div>',
      ).length >= 1,
  ],
  [
    "an index card under the wrong unit is caught",
    () =>
      guideIndexProblems(
        '<div class="unit-section"><div class="unit-title">Unit 8: Stats</div><div class="card-id">Lesson 2-1</div></div>',
      ).length === 1,
  ],
  [
    "an index card with an old sheet code is caught",
    () =>
      guideIndexProblems(
        '<div class="unit-section"><div class="unit-title">Unit 2: Stats</div><div class="card-id">Sheet 8A</div></div>',
      ).length === 1,
  ],
];
const failedSelf = selftests.filter(([, fn]) => !fn()).map(([name]) => name);
if (failedSelf.length) {
  console.error(
    `validate-lesson-labels: SELF-TEST FAILED — a detector is blind:\n  ${failedSelf.join("\n  ")}`,
  );
  process.exit(1);
}

/* ── sweep ───────────────────────────────────────────────────────────────── */

const problems = [];
let readinessPages = 0;
let docxFiles = 0;
const coreIds = listLessonDirs().filter((d) => CORE_ID_RE.test(d));

for (const id of coreIds) {
  const page = join(LESSONS_DIR, id, "readiness", "index.html");
  if (existsSync(page)) {
    readinessPages++;
    problems.push(...readinessProblems(id, readFileSync(page, "utf8"), LESSONS.get(id)));
  }
}

function* docxUnder(dir) {
  if (!existsSync(dir)) return;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* docxUnder(p);
    else if (e.name.endsWith(".docx")) yield p;
  }
}
for (const id of coreIds) {
  for (const file of docxUnder(join(LESSONS_DIR, id, "downloads", "reveal"))) {
    docxFiles++;
    const zip = await JSZip.loadAsync(readFileSync(file));
    for (const part of Object.keys(zip.files).filter((k) =>
      /^word\/(document|header\d*|footer\d*)\.xml$/.test(k),
    )) {
      const xml = await zip.file(part).async("string");
      problems.push(...docxHeadingProblems(id, `${relative(ROOT, file)} ${part}`, paragraphs(xml)));
    }
  }
}

const GUIDES = join(ROOT, "esol", "reveal-math-guides");
const sheets = readdirSync(GUIDES).filter((f) => /^sheet-.*\.html$/.test(f));
for (const f of sheets)
  problems.push(...guideMetaProblems(f, readFileSync(join(GUIDES, f), "utf8")));
problems.push(...guideIndexProblems(readFileSync(join(GUIDES, "index.html"), "utf8")));

if (problems.length) {
  console.error(
    `validate-lesson-labels: ${problems.length} label(s) disagree with data/curriculum-launch-manifest.json:\n  ${problems.join("\n  ")}`,
  );
  process.exit(1);
}
console.log(
  `validate-lesson-labels: ${selftests.length} self-tests; ${readinessPages} readiness pages, ` +
    `${docxFiles} Reveal docx, ${sheets.length} study guides + index — every lesson label matches the launch manifest.`,
);
