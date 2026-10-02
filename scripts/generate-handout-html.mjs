#!/usr/bin/env node
/**
 * Generate a printable student handout per lesson.
 * Linked from the lesson welcome/cover screen.
 *
 * Run: node scripts/generate-handout-html.mjs
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { LESSONS_DIR as lessonsDir } from "../tools/lib/curriculum-source.mjs";
import { EDITORIAL_FONT_IMPORT, EDITORIAL_OVERRIDES } from "./lib/editorial-print.mjs";
import { inScope, lessonScope } from "./lib/lesson-scope.mjs";
import { isGeneratedFresh, writeGenerated } from "./lib/preserve-injected.mjs";
import { renderItem, STUDENT_TASK_CSS } from "./lib/student-print-tasks.mjs";

const LESSON_DIR_RE = /^(\d+)-(\d+)(-flagship)?$/;

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function vocabRows(config) {
  return (config.vocabulary || [])
    .slice(0, 6)
    .map(
      (v) =>
        `<tr><td><strong>${esc(v.term)}</strong>${v.termEs ? `<br><span lang="es">${esc(v.termEs)}</span>` : ""}</td><td>${esc(v.definition)}${v.definitionEs ? `<br><span lang="es">${esc(v.definitionEs)}</span>` : ""}</td></tr>`,
    )
    .join("");
}

function practicePreview(config) {
  const practice = config.practice || {};
  const items = [
    ...(practice.approaching || []).slice(0, 1),
    ...(practice.onLevel || []).slice(0, 2),
    ...(practice.extending || []).slice(0, 1),
  ].filter(Boolean);

  return items
    .slice(0, 4)
    .map((p, i) => renderItem(p, i))
    .join("");
}

function buildHandout(config) {
  const idea =
    config.launch?.conceptIntro?.keyIdea ||
    config.practice?.commonMistake ||
    config.contentObjective ||
    "";
  const notice = (config.launch?.noticePrompts || []).slice(0, 2);
  const wonder = (config.launch?.wonderPrompts || []).slice(0, 1);

  return `<!doctype html>
<html lang="en" data-ewl-supports-lesson="${esc(config.lessonId)}" data-support-audience="student">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(config.title)} — Student Handout</title>
  <style>
    ${EDITORIAL_FONT_IMPORT}
    @import url('/assets/fonts/outfit-hanken-grotesk-e0dfae.css');
    * { box-sizing: border-box; }
    body { font-family: 'Hanken Grotesk', system-ui, sans-serif; color: #264653; margin: 0; padding: 24px; background: #fff; font-size: 17px; line-height: 1.55; }
    main { max-width: 900px; margin: 0 auto; }
    .resource-toolbar { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 18px; }
    .resource-toolbar a { color: #155f67; font-weight: 650; padding: 10px 0; }
    .resource-toolbar button { min-height: 44px; border: 0; border-radius: 6px; background: #155f67; color: white; padding: 10px 16px; font: inherit; font-weight: 700; cursor: pointer; }
    :focus-visible { outline: 3px solid #a9471a; outline-offset: 4px; }
    h1, h2 { font-family: Outfit, system-ui, sans-serif; margin: 0 0 8px; }
    .header { border-bottom: 3px solid #387F84; padding-bottom: 12px; margin-bottom: 16px; }
    .meta { color: #5a6b75; font-size: 0.9rem; }
    .bilingual { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .box { border: 1px solid #e4ddc9; border-radius: 8px; padding: 12px; margin-bottom: 12px; background: #fdf6ec; }
    table { width: 100%; border-collapse: collapse; font-size: 1rem; }
    th, td { border: 1px solid #e4ddc9; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #dff2ee; }
    .vocabulary-table { table-layout: fixed; overflow-wrap: break-word; }
    .vocabulary-table th:first-child { width: 34%; }
    .work-space { border-bottom: 1px dashed #c5bdb0; min-height: 48px; margin-top: 8px; }
    .notice-wonder { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .footer { margin-top: 16px; font-size: 0.78rem; color: #5a6b75; text-align: center; }
    .name-line { border-bottom: 1px solid #264653; display: inline-block; min-width: 200px; margin-left: 8px; }
    .practice-box { background: #fff; }
    .practice-box > h2 { margin-bottom: 16px; }
    @media (max-width: 600px) { body { padding: 16px; } .bilingual, .notice-wonder { grid-template-columns: 1fr; } .name-line { min-width: 140px; } }
    @page { size: Letter; margin: .55in; }
    @media print {
      body { padding: 0; font-size: 11.5pt; }
      .no-print { display: none; }
      .box { break-inside: avoid; }
      .practice-box { break-inside: auto; border: 0; padding: 0; }
      h1, h2, h3 { break-after: avoid; }
      p { orphans: 3; widows: 3; }
      .bilingual { display: block; }
    }
    ${STUDENT_TASK_CSS}
    ${EDITORIAL_OVERRIDES}
  </style>
</head>
<body>
<main>
  <nav class="no-print resource-toolbar" aria-label="Handout actions">
    <a href="/lessons/${esc(config.lessonId)}/">← Back to lesson</a>
    <button type="button" onclick="window.print()">Print / Save PDF</button>
  </nav>
  <header class="header">
    <h1>${esc(config.title)}</h1>
    <div class="meta">${esc(config.standard)} · Unit ${config.unit} · Lesson ${config.lesson ?? ""}</div>
    <p style="margin-top:12px;">Name <span class="name-line"></span> &nbsp; Period <span class="name-line" style="min-width:60px"></span></p>
  </header>

  <div class="bilingual">
    <div class="box">
      <h2>Objectives / Objetivos</h2>
      ${config.contentObjective ? `<p lang="en"><strong>Content Objective:</strong> ${esc(config.contentObjective)}</p>` : ""}
      ${config.contentObjectiveEs ? `<p lang="es">${esc(config.contentObjectiveEs)}</p>` : ""}
      ${config.languageObjective ? `<p lang="en"><strong>Language Objective:</strong> ${esc(config.languageObjective)}</p>` : ""}
    </div>
    <div class="box">
      <h2>Key Idea / Idea clave</h2>
      <p>${esc(idea)}</p>
    </div>
  </div>

  ${
    notice.length || wonder.length
      ? `<div class="notice-wonder">
    <div class="box"><h2>I Notice / Observo</h2><ul>${notice.map((n) => `<li>${esc(n)}</li>`).join("")}</ul></div>
    <div class="box"><h2>I Wonder / Me pregunto</h2><ul>${wonder.map((w) => `<li>${esc(w)}</li>`).join("")}</ul></div>
  </div>`
      : ""
  }

  <div class="box" data-support-slot="vocabulary">
    <h2>Vocabulary / Vocabulario</h2>
    <table class="vocabulary-table">
      <thead><tr><th scope="col">Term / Término</th><th scope="col">Definition / Definición</th></tr></thead>
      <tbody>${vocabRows(config)}</tbody>
    </table>
  </div>

  <div class="box practice-box" data-support-slot="practice">
    <h2>Practice Preview / Vista previa de práctica</h2>
    <p>Read each task. Show your work in the spaces provided and explain how you know.</p>
    ${practicePreview(config)}
  </div>

  <div class="box" data-support-slot="response">
    <h2>Reflection / Reflexión</h2>
    <p>One thing I learned today / Una cosa que aprendí hoy:</p>
    <div class="work-space" style="min-height:64px"></div>
  </div>

  <footer class="footer">Neft Teacher · ${esc(config.lessonId)} · Printable student handout</footer>
</main>
  <!-- Same effective support configuration as the interactive lesson; see
       shared/supports/print-supports.js. Inert until supports are configured. -->
  <script src="/shared/supports/print-supports.js" defer></script>
</body>
</html>`.replace(/[ \t]+$/gm, "");
}

const lessonIds = readdirSync(lessonsDir)
  .filter(
    (d) =>
      LESSON_DIR_RE.test(d) &&
      inScope(d, lessonScope()) &&
      existsSync(join(lessonsDir, d, "config.json")),
  )
  .sort();

const CHECK = process.argv.includes("--check");
const STALE = [];
let count = 0;
for (const id of lessonIds) {
  const config = JSON.parse(readFileSync(join(lessonsDir, id, "config.json"), "utf8"));
  // handout.html is an injected surface (Save/Resume, mobile a11y, enterprise
  // head) — a plain overwrite deletes those layers. See scripts/lib/preserve-injected.mjs.
  const file = join(lessonsDir, id, "handout.html");
  const html = buildHandout(config);
  if (CHECK) {
    if (!isGeneratedFresh(file, html)) STALE.push(`lessons/${id}/handout.html`);
    continue;
  }
  writeGenerated(file, html);
  count++;
}

if (CHECK) {
  if (STALE.length) {
    console.error(
      `${STALE.length} handout page(s) are STALE — the committed HTML no longer matches its config.json:\n  ${STALE.slice(0, 15).join("\n  ")}\n\nFix: node scripts/generate-handout-html.mjs`,
    );
    process.exit(1);
  }
  console.log(`Handouts up to date (${lessonIds.length} lessons).`);
} else {
  console.log(`Generated ${count} student handouts.`);
}
