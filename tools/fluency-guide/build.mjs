#!/usr/bin/env node
/**
 * Build the self-contained guide.
 *
 *   src/data/curriculum.core.json   lesson titles, components, prerequisite skills,
 *                                   quick check A, answer, diagnostic, fallback, spine links
 *   src/data/enrich-unit-*.json     standard, vocabulary, quick checks B and C, error table,
 *                                   reteach script, sentence frame, extension
 *   src/data/enrich-spine.json      grade progression and a six-item drill per spine skill
 *
 * The merged dataset, the stylesheet, and the app are inlined into one HTML file so the
 * guide opens from a Desktop, a USB stick, or Google Drive with no server and no network.
 *
 *   node build.mjs            build index.html
 *   node build.mjs --check    validate the data only, write nothing
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { withCurriculumShell } from "../lib/curriculum-shell.mjs";
import { validateWorkshops, workshops } from "./workshop-bank.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(root, "../..");
const target = join(siteRoot, "curriculum/fluency");
const read = (p) => readFileSync(join(root, p), "utf8");
const readJSON = (p) => JSON.parse(read(p));

const UNITS = [2, 3, 4, 5, 6, 7, 8, 9];
const REQUIRED_LESSON_KEYS = [
  "standard",
  "vocabulary",
  "variants",
  "errors",
  "reteach",
  "frame",
  "extension",
];

const problems = [];
const fail = (msg) => problems.push(msg);

/* ------------------------------------------------------------------ merge */
const core = readJSON("src/data/curriculum.core.json");
validateWorkshops(core.units.flatMap((u) => u.lessons.map((l) => l.id))).forEach(fail);
core.studentPath = "../";
core.pdfPath = "printables/";
const practice = readJSON("src/data/practice.json");
const spineEnrich = readJSON("src/data/enrich-spine.json");
const lessonEnrich = Object.assign(
  {},
  ...UNITS.map((n) => readJSON(`src/data/enrich-unit-${n}.json`)),
);

core.units.forEach((unit) => {
  unit.lessons.forEach((lesson) => {
    lesson.practice = practice[lesson.id];
    lesson.workshop = workshops[lesson.id];
    if (!Array.isArray(lesson.practice) || lesson.practice.length !== 4)
      fail(`lesson ${lesson.id}: expected 4 prerequisite practice tasks`);
    (lesson.practice || []).forEach((p, i) => {
      if (
        p.skill !== i + 1 ||
        !p.prompt ||
        !p.answer ||
        !p.explanation ||
        !["number", "review"].includes(p.mode)
      )
        fail(`lesson ${lesson.id}: invalid practice task ${i + 1}`);
    });
    const extra = lessonEnrich[lesson.id];
    if (!extra) {
      fail(`lesson ${lesson.id}: no enrichment entry`);
      return;
    }

    // The core dataset calls the fallback pointer "reteach"; the enrichment layer uses
    // "reteach" for the scripted mini-lesson. Rename the core field before merging.
    lesson.reteach_source = lesson.reteach;
    delete lesson.reteach;
    Object.assign(lesson, extra);

    REQUIRED_LESSON_KEYS.forEach((key) => {
      if (lesson[key] == null) fail(`lesson ${lesson.id}: missing "${key}"`);
    });
    if (lesson.skills.length !== 4)
      fail(`lesson ${lesson.id}: expected 4 prerequisite skills, found ${lesson.skills.length}`);
    if ((lesson.variants || []).length !== 2)
      fail(`lesson ${lesson.id}: expected quick check versions B and C`);
    (lesson.variants || []).forEach((v) => {
      if (!v.prompt || !v.answer)
        fail(`lesson ${lesson.id} version ${v.form}: prompt or answer is empty`);
    });
    if (!/^6\.(RP|NS|EE|G|SP)\./.test(lesson.standard.code))
      fail(`lesson ${lesson.id}: "${lesson.standard.code}" is not a Grade 6 standard code`);
    if ((lesson.vocabulary || []).length < 3)
      fail(`lesson ${lesson.id}: fewer than 3 vocabulary terms`);
    if ((lesson.errors || []).length < 2)
      fail(`lesson ${lesson.id}: fewer than 2 error-analysis rows`);
    if ((lesson.reteach.steps || []).length < 3)
      fail(`lesson ${lesson.id}: reteach script has fewer than 3 steps`);
    if (!lesson.extension.answer) fail(`lesson ${lesson.id}: extension has no answer`);
    lesson.spine_links.forEach((link) => {
      if (!core.spine.some((s) => s.rank === link.rank))
        fail(`lesson ${lesson.id}: spine #${link.rank} does not exist`);
    });
  });
});

core.spine.forEach((skill) => {
  const extra = spineEnrich[String(skill.rank)];
  if (!extra) {
    fail(`spine #${skill.rank}: no enrichment entry`);
    return;
  }
  Object.assign(skill, extra);
  if ((skill.drill.items || []).length !== 6)
    fail(`spine #${skill.rank}: drill needs exactly 6 items`);
  if (skill.lessons_list.length !== skill.count)
    fail(
      `spine #${skill.rank}: count ${skill.count} does not match ${skill.lessons_list.length} listed lessons`,
    );
  skill.lessons_list.forEach((id) => {
    const lesson = core.units.flatMap((u) => u.lessons).find((l) => l.id === id);
    if (!lesson) {
      fail(`spine #${skill.rank}: lesson ${id} does not exist`);
      return;
    }
    if (!lesson.spine_links.some((l) => l.rank === skill.rank)) {
      fail(`spine #${skill.rank} lists lesson ${id}, but lesson ${id} does not link back`);
    }
  });
});

/* -------------------------------------------------------------- summarise */
const lessons = core.units.flatMap((u) => u.lessons);
core.grade_origin_counts = {};
lessons
  .flatMap((l) => l.skills)
  .forEach((skill) => {
    const match = skill.source.match(/^Gr\s*(\d)/);
    const key = match ? "Gr " + match[1] : "In-Year Spiral";
    core.grade_origin_counts[key] = (core.grade_origin_counts[key] || 0) + 1;
  });
const stats = {
  units: core.units.length,
  lessons: lessons.length,
  prerequisites: lessons.reduce((n, l) => n + l.skills.length, 0),
  quickChecks: lessons.reduce((n, l) => n + 1 + l.variants.length, 0),
  errorRows: lessons.reduce((n, l) => n + l.errors.length, 0),
  reteachSteps: lessons.reduce((n, l) => n + l.reteach.steps.length, 0),
  vocabulary: new Set(lessons.flatMap((l) => l.vocabulary.map((v) => v.term))).size,
  standards: new Set(lessons.map((l) => l.standard.code)).size,
  spineSkills: core.spine.length,
  practiceItems: lessons.reduce((n, l) => n + (l.practice || []).length, 0),
  drillItems: core.spine.reduce((n, s) => n + s.drill.items.length, 0),
  workshops: lessons.filter((l) => l.workshop).length,
  workshopTasks: lessons.reduce((n, l) => n + l.workshop.tasks.length, 0),
};

if (problems.length) {
  console.error(`\n✗ ${problems.length} data problem(s):\n`);
  problems.forEach((p) => console.error("  · " + p));
  process.exit(1);
}
console.log("✓ data validated");
Object.entries(stats).forEach(([k, v]) => console.log(`    ${k.padEnd(14)} ${v}`));

if (process.argv.includes("--check")) process.exit(0);

/* ---------------------------------------------------------------- inline */
// Both editions use the same practice engine; the data allowlist below
// controls which lesson fields are available in public practice.
const studio = read("src/studio.js");
const styles = ["styles.css", "studio.css", "labs.css", "workshop.css"]
  .map((file) => read(`src/${file}`))
  .join("\n");
const html = read("src/template.html.template")
  .replace(
    "<!--__ORIGIN__-->",
    () =>
      '<div class="origin"><div class="origin-head"><span>Where the 216 prerequisite skills come from</span></div><p>' +
      Object.entries(core.grade_origin_counts)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => k + ": " + v)
        .join(" · ") +
      "</p><small>Source ranges are counted under their first listed grade.</small></div>",
  )
  .replace("/*__STYLES__*/", () => styles)
  .replace("/*__TEACHER_STYLES__*/", () => read("src/teacher.css"))
  .replace("/*__DATA__*/", () => JSON.stringify(core).replace(/<\/script/gi, "<\\/script"))
  .replace("/*__STUDIO__*/", () => studio)
  .replace("/*__MODELS__*/", () => read("src/models.js"))
  .replace("/*__APP__*/", () => read("src/app.js"));

mkdirSync(join(target, "teacher"), { recursive: true });
writeFileSync(join(target, "teacher/index.html"), html);
const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
console.log(`\n✓ index.html written — ${kb} KB, self-contained`);

const escapeHTML = (s) =>
  String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function renderLessonsIndex(units) {
  return units
    .map((u) => {
      const lessonCards = u.lessons
        .map((l) => {
          const domain = l.standard ? l.standard.code.slice(0, 4) : "";
          const hasElem = l.skills.some((s) => /^Gr\s*[2-5]/.test(s.source));
          const hasSpiral = l.skills.some((s) => !/^Gr\s*[2-5]/.test(s.source));
          const originType = [hasElem ? "elem" : "", hasSpiral ? "spiral" : ""]
            .filter(Boolean)
            .join(" ");
          const searchTerms = [
            l.id,
            l.title,
            l.subtopics,
            l.standard?.code,
            l.standard?.text,
            ...l.skills.map((s) => s.text + " " + s.source),
            l.quick_check,
          ]
            .join(" ")
            .replace(/"/g, "&quot;");

          const skillItems = l.skills
            .map(
              (s, idx) => `
                <div class="skill-item">
                  <span class="skill-number">${idx + 1}</span>
                  <span class="skill-text-content">${escapeHTML(s.text)}</span>
                  <span class="origin-badge ${/^Gr\s*[2-5]/.test(s.source) ? "elem" : "spiral"}">${escapeHTML(s.source)}</span>
                </div>`,
            )
            .join("");

          const practiceItems = (l.practice || [])
            .map(
              (p, idx) => `
                <div class="practice-mini-card">
                  <div class="practice-mini-prompt"><strong>Task ${idx + 1}:</strong> ${escapeHTML(p.prompt)}</div>
                  <div class="practice-mini-answer">✓ Answer: ${escapeHTML(p.answer)}</div>
                </div>`,
            )
            .join("");

          return `
            <article class="fluency-lesson-card" id="lesson-${l.id}" data-id="${l.id}" data-unit="${u.number}" data-domain="${domain}" data-origin="${originType}" data-search="${searchTerms}">
              <header class="fluency-lesson-header">
                <div>
                  <span class="lesson-badge-id">Lesson ${l.id}</span>
                  <h3>${escapeHTML(l.title)}</h3>
                  <div class="lesson-subtopics">${escapeHTML(l.subtopics || "")}</div>
                </div>
                <div class="lesson-chips">
                  <span class="standard-badge" title="${escapeHTML(l.standard?.text || "")}">${escapeHTML(l.standard?.code || "")}</span>
                </div>
              </header>
              <div class="fluency-lesson-body">
                <div class="lesson-col-skills">
                  <div class="col-heading">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                    Fluency Needed First · ${l.skills.length} Prerequisite Skills
                  </div>
                  <div class="skills-list">
                    ${skillItems}
                  </div>
                </div>
                <div class="lesson-col-check">
                  <div class="col-heading">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    2-Minute Quick Check
                  </div>
                  <div class="qc-card-box">
                    <div class="qc-card-prompt">${escapeHTML(l.quick_check)}</div>
                  </div>
                  <div class="lesson-card-actions">
                    <a href="#view=studio&lesson=${l.id}&mode=practice&level=workshop" class="btn btn-primary btn-sm" title="Launch interactive practice studio for this lesson">
                      Practice Studio ↗
                    </a>
                    <a href="/lessons/${l.id}/" class="btn btn-sm" title="Open complete curriculum lesson page">
                      Lesson Page ↗
                    </a>
                    <button type="button" class="btn btn-sm" data-toggle="practice" data-id="${l.id}" aria-expanded="false">
                      Prerequisite Practice
                    </button>
                  </div>
                </div>
              </div>
              <div class="practice-drawer" id="practice-drawer-${l.id}">
                <div class="practice-drawer-title">4 Worked Prerequisite Practice Tasks (Foundation Review)</div>
                <div class="practice-grid">
                  ${practiceItems}
                </div>
              </div>
            </article>`;
        })
        .join("\n");

      return `
        <section class="unit-block" id="unit-${u.number}" data-unit="${u.number}">
          <div class="unit-banner">
            <div class="unit-banner-meta">
              <span class="unit-badge-tag">Unit ${u.number}</span>
              <span class="unit-count-pill">${u.lessons.length} lessons</span>
            </div>
            <h2>Unit ${u.number}: ${escapeHTML(u.title)}</h2>
            <p class="unit-premise-text">${escapeHTML(u.premise || "")}</p>
          </div>
          <div class="unit-lessons-grid">
            ${lessonCards}
          </div>
        </section>`;
    })
    .join("\n");
}

// The public practice edition excludes diagnostics, teaching scripts, class tallies, and teacher-key controls.
const studentData = {
  spine: [],
  units: core.units.map((u) => ({
    number: u.number,
    title: u.title,
    lessons: u.lessons.map((l) =>
      Object.fromEntries(
        [
          "id",
          "title",
          "standard",
          "skills",
          "practice",
          "quick_check",
          "solution",
          "variants",
          "extension",
          "vocabulary",
          "frame",
          "workshop",
        ].map((k) => [k, l[k]]),
      ),
    ),
  })),
};

const lessonsIndexHTML = renderLessonsIndex(core.units);
const studentHTML = read("src/student-template.html.template")
  .replace("<!--__LESSONS_INDEX__-->", () => lessonsIndexHTML)
  .replace("/*__STYLES__*/", () => styles)
  .replace("/*__DATA__*/", () => JSON.stringify(studentData).replace(/<\/script/gi, "<\\/script"))
  .replace("/*__STUDIO__*/", () => studio);
const studentWithModels = studentHTML.replace("/*__MODELS__*/", () => read("src/models.js"));
const studentFinal = withCurriculumShell(studentWithModels, "fluency");
writeFileSync(join(target, "index.html"), studentFinal);
console.log("✓ index.html written — 54-lesson Reveal Math fluency index and practice studio");
