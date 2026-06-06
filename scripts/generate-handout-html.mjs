#!/usr/bin/env node
/**
 * Generate a single-page printable student handout per lesson.
 * Linked from the lesson welcome/cover screen.
 *
 * Run: node scripts/generate-handout-html.mjs
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const lessonsDir = join(root, "lessons");
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
    .map((p, i) => {
      const stem = p.stem || p.instructions || p.title || p.label || `Problem ${i + 1}`;
      let extra = "";
      if (p.type === "multiple-choice" && Array.isArray(p.choices)) {
        extra = `<ol type="A" style="margin:8px 0 0 1.2rem; font-size:0.88rem;">${p.choices
          .map((c) => `<li>${esc(c)}</li>`)
          .join("")}</ol>`;
      } else if (p.type === "matching" && Array.isArray(p.pairs)) {
        extra = `<ul style="margin:8px 0 0 1.2rem; font-size:0.88rem;">${p.pairs
          .slice(0, 3)
          .map((pair) => `<li>${esc(pair.left || pair.term || "")} → ___</li>`)
          .join("")}</ul>`;
      }
      return `<li>${esc(stem)}${extra}<div class="work-space"></div></li>`;
    })
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
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(config.title)} — Student Handout</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@600;700&family=Hanken+Grotesk:wght@400;600&display=swap');
    * { box-sizing: border-box; }
    body { font-family: 'Hanken Grotesk', system-ui, sans-serif; color: #264653; margin: 0; padding: 24px; background: #fff; }
    h1, h2 { font-family: Outfit, system-ui, sans-serif; margin: 0 0 8px; }
    .header { border-bottom: 3px solid #387F84; padding-bottom: 12px; margin-bottom: 16px; }
    .meta { color: #5a6b75; font-size: 0.9rem; }
    .bilingual { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .box { border: 1px solid #e4ddc9; border-radius: 8px; padding: 12px; margin-bottom: 12px; background: #fdf6ec; }
    table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
    th, td { border: 1px solid #e4ddc9; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #dff2ee; }
    .work-space { border-bottom: 1px dashed #c5bdb0; min-height: 48px; margin-top: 8px; }
    .notice-wonder { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .footer { margin-top: 16px; font-size: 0.78rem; color: #5a6b75; text-align: center; }
    .name-line { border-bottom: 1px solid #264653; display: inline-block; min-width: 200px; margin-left: 8px; }
    @media print {
      body { padding: 12px; }
      .no-print { display: none; }
      .box { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="text-align:right; margin-bottom:12px;">
    <button onclick="window.print()" style="padding:8px 16px; font-weight:700; cursor:pointer;">🖨️ Print / Imprimir</button>
  </div>
  <header class="header">
    <h1>${esc(config.title)}</h1>
    <div class="meta">${esc(config.standard)} · Unit ${config.unit} · Lesson ${config.lesson ?? ""}</div>
    <p style="margin-top:12px;">Name <span class="name-line"></span> &nbsp; Period <span class="name-line" style="min-width:60px"></span></p>
  </header>

  <div class="bilingual">
    <div class="box">
      <h2>Today's Goal / Meta de hoy</h2>
      <p lang="en">${esc(config.contentObjective || "")}</p>
      ${config.contentObjectiveEs ? `<p lang="es">${esc(config.contentObjectiveEs)}</p>` : ""}
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

  <div class="box">
    <h2>Vocabulary / Vocabulario</h2>
    <table>
      <thead><tr><th>Term / Término</th><th>Definition / Definición</th></tr></thead>
      <tbody>${vocabRows(config)}</tbody>
    </table>
  </div>

  <div class="box">
    <h2>Practice Preview / Vista previa de práctica</h2>
    <ol>${practicePreview(config)}</ol>
  </div>

  <div class="box">
    <h2>Reflection / Reflexión</h2>
    <p>One thing I learned today / Una cosa que aprendí hoy:</p>
    <div class="work-space" style="min-height:64px"></div>
  </div>

  <footer class="footer">Neft Teacher · ${esc(config.lessonId)} · Printable student handout</footer>
</body>
</html>`;
}

const lessonIds = readdirSync(lessonsDir)
  .filter((d) => LESSON_DIR_RE.test(d) && existsSync(join(lessonsDir, d, "config.json")))
  .sort();

let count = 0;
for (const id of lessonIds) {
  const config = JSON.parse(readFileSync(join(lessonsDir, id, "config.json"), "utf8"));
  writeFileSync(join(lessonsDir, id, "handout.html"), buildHandout(config), "utf8");
  count++;
}

console.log(`Generated ${count} student handouts.`);
