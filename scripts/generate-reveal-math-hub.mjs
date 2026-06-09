#!/usr/bin/env node
/**
 * generate-reveal-math-hub.mjs
 *
 * Generates the "Reveal Math" hub at reveal-math/index.html — a single,
 * teacher-facing landing page that, for every lesson, links to BOTH:
 *   1. 📝 Editable Slides  → /lessons/<id>/editable-slides.html
 *      (the existing launcher: Edit in PowerPoint / Google Slides / Present).
 *   2. 🌐 Open Lesson (HTML) → /lessons/<id>/
 *      (the client-rendered, updated lesson page).
 *
 * Source of truth: each lessons/<id>/config.json (lessonId, title, standard,
 * unit, lesson). Lessons without an editable-slides.html are skipped.
 * Lessons are grouped by Unit and laid out in a responsive card grid that
 * matches the site palette (teal #0f766e) and shared.css.
 *
 * reveal-math/ is a top-level directory, so vite.config.js copyStandaloneHtml()
 * copies it into dist/ automatically — no vite config change is needed.
 *
 * Run: npm run generate-reveal-math-hub
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const lessonsDir = path.join(root, "lessons");
const outDir = path.join(root, "reveal-math");

// Matches core lessons ("3-2") and flagship lessons ("3-2-flagship").
const LESSON_DIR_RE = /^(\d+)-(\d+)(-flagship)?$/;

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const STYLES = `
:root{
  --navy:#12355b; --teal:#0f766e; --teal-700:#0c5e57; --teal-light:#dff2ee;
  --amber:#f2c15b; --amber-light:#fef0d8; --cream:#f7f4ec; --ink:#21313f;
  --muted:#5f6f80; --line:#d7e2ed;
}
*{box-sizing:border-box}
body{margin:0;background:var(--cream);color:var(--ink);
  font-family:Calibri,"Segoe UI",system-ui,sans-serif;line-height:1.6;font-size:18px;}
.wrap{max-width:1120px;margin:0 auto;padding:24px 18px 72px;}
a{color:var(--navy);}
.crumbs{font-size:15px;margin:0 0 18px;}
.crumbs a{color:var(--teal);text-decoration:none;font-weight:600;}
.crumbs a:hover{text-decoration:underline;}
.crumbs span{color:var(--muted);}
.hero{background:linear-gradient(135deg,var(--teal),var(--teal-700));color:#fff;
  border-radius:18px;padding:28px 28px 26px;margin:0 0 28px;}
.eyebrow{color:var(--amber);font-weight:700;letter-spacing:.06em;text-transform:uppercase;
  font-size:13px;margin:0;}
.hero h1{font-family:Outfit,system-ui,sans-serif;margin:6px 0 8px;font-size:34px;line-height:1.15;}
.hero p{margin:0;font-size:17px;max-width:760px;color:#eaf6f3;}
.unit{margin:30px 0 0;}
.unit-head{display:flex;align-items:baseline;gap:12px;margin:0 0 14px;
  border-bottom:2px solid var(--line);padding-bottom:8px;}
.unit-head h2{font-family:Outfit,system-ui,sans-serif;color:var(--navy);font-size:24px;margin:0;}
.unit-head .count{color:var(--muted);font-size:14px;font-weight:600;}
.activity-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:18px;}
.activity-card{background:#fff;border:1px solid var(--line);border-radius:14px;
  padding:20px 20px 22px;display:flex;flex-direction:column;}
.activity-card .lnum{font-size:13px;font-weight:700;text-transform:uppercase;
  letter-spacing:.04em;color:var(--teal);margin:0 0 4px;}
.activity-card h3{font-family:Outfit,system-ui,sans-serif;color:var(--navy);
  font-size:20px;line-height:1.25;margin:0 0 8px;}
.activity-card .std{display:inline-block;align-self:flex-start;background:var(--teal-light);
  color:var(--teal);border:1px solid var(--teal);border-radius:999px;font-size:12px;
  font-weight:700;padding:2px 11px;margin:0 0 16px;}
.activity-card .btns{margin-top:auto;display:flex;flex-direction:column;gap:10px;}
.btn{display:inline-flex;align-items:center;gap:8px;justify-content:center;
  text-decoration:none;font-weight:700;font-size:15.5px;border-radius:10px;
  padding:12px 16px;cursor:pointer;transition:background .15s,transform .05s;}
.btn:active{transform:translateY(1px);}
.btn:focus-visible{outline:3px solid var(--amber);outline-offset:2px;}
.btn.slides{background:var(--amber);color:var(--navy);border:2px solid var(--amber);}
.btn.slides:hover{background:#eab23f;border-color:#eab23f;}
.btn.lesson{background:var(--teal);color:#fff;border:2px solid var(--teal);}
.btn.lesson:hover{background:var(--teal-700);border-color:var(--teal-700);}
footer{color:var(--muted);font-size:14px;text-align:center;margin-top:40px;}
@media (max-width:560px){.hero h1{font-size:27px;}}
@media print{
  body{background:#fff;}
  .hero{background:#fff;color:var(--ink);border:1px solid var(--line);}
  .hero h1,.hero p,.eyebrow{color:var(--ink);}
  .activity-card{break-inside:avoid;border-color:#bbb;}
}
`.trim();

function card({ id, unit, lesson, title, standard }) {
  const lnum = `Unit ${esc(unit)} · Lesson ${esc(lesson)}`;
  const std = standard
    ? `<span class="std">${esc(standard)}</span>`
    : "";
  return `      <div class="activity-card">
        <p class="lnum">${lnum}</p>
        <h3>${esc(title)}</h3>
        ${std}
        <div class="btns">
          <a class="btn slides" href="/lessons/${esc(id)}/editable-slides.html">📝 Editable Slides (Google Slides + PowerPoint)</a>
          <a class="btn lesson" href="/lessons/${esc(id)}/">🌐 Open Lesson (HTML)</a>
        </div>
      </div>`;
}

function unitSection(unit, lessons) {
  const cards = lessons.map(card).join("\n");
  const n = lessons.length;
  return `    <section class="unit">
      <div class="unit-head">
        <h2>Unit ${esc(unit)}</h2>
        <span class="count">${n} lesson${n === 1 ? "" : "s"}</span>
      </div>
      <div class="activity-grid">
${cards}
      </div>
    </section>`;
}

function page(unitsSorted, total) {
  const sections = unitsSorted
    .map(([unit, lessons]) => unitSection(unit, lessons))
    .join("\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Reveal Math — Editable Slides &amp; Lessons</title>
<meta name="description" content="Every Reveal Math lesson: open the editable Google Slides / PowerPoint deck or the updated HTML lesson." />
<!-- generated:reveal-math-hub — regenerate: npm run generate-reveal-math-hub -->
<link rel="stylesheet" href="/assets/shared.css" />
<style>${STYLES}</style>
</head>
<body>
<div class="wrap">
  <nav class="crumbs">
    <a href="/">Home</a> <span>/</span>
    <span>Reveal Math</span>
  </nav>

  <header class="hero">
    <p class="eyebrow">Reveal Math</p>
    <h1>Editable Slides &amp; Updated Lessons</h1>
    <p>Every lesson, two ways to teach it. Open the <strong>editable deck</strong>
      in Google Slides or PowerPoint, or jump straight into the <strong>updated
      HTML lesson</strong> with Notice &amp; Wonder and word problems. ${total} lessons below, grouped by unit.</p>
  </header>

${sections}

  <footer>Reveal Math hub · ${total} lessons · generated from lesson configs.</footer>
</div>
</body>
</html>
`;
}

function main() {
  const ids = fs
    .readdirSync(lessonsDir)
    .filter((d) => LESSON_DIR_RE.test(d))
    .filter((d) => fs.existsSync(path.join(lessonsDir, d, "config.json")))
    // Only include lessons that actually have an editable-slides launcher.
    .filter((d) => fs.existsSync(path.join(lessonsDir, d, "editable-slides.html")));

  const byUnit = new Map();
  let total = 0;
  for (const id of ids) {
    let cfg;
    try {
      cfg = JSON.parse(
        fs.readFileSync(path.join(lessonsDir, id, "config.json"), "utf8")
      );
    } catch (e) {
      console.error(`Skipping ${id}: bad config.json (${e.message})`);
      continue;
    }
    const m = id.match(LESSON_DIR_RE);
    const unit = cfg.unit ?? (m ? Number(m[1]) : 0);
    const lesson = cfg.lesson ?? (m ? Number(m[2]) : 0);
    const entry = {
      id,
      unit,
      lesson,
      title: cfg.title || id,
      standard: cfg.standard || "",
    };
    if (!byUnit.has(unit)) byUnit.set(unit, []);
    byUnit.get(unit).push(entry);
    total++;
  }

  // Sort lessons within a unit, then units ascending.
  for (const lessons of byUnit.values()) {
    lessons.sort((a, b) => a.lesson - b.lesson || a.id.localeCompare(b.id));
  }
  const unitsSorted = [...byUnit.entries()].sort(
    (a, b) => Number(a[0]) - Number(b[0])
  );

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), page(unitsSorted, total), "utf8");

  console.log(
    `Generated reveal-math/index.html — ${total} lessons across ${unitsSorted.length} units.`
  );
}

main();
