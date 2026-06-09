#!/usr/bin/env node
/**
 * generate-editable-slides-page.mjs
 *
 * Generates a teacher-facing "Editable Slides" launcher page for every lesson at
 *   lessons/<id>/editable-slides.html
 *
 * The page gives teachers three clearly distinguished ways to use the lesson deck:
 *   1. Edit in PowerPoint  → download the generated lessons/<id>/slides.pptx
 *   2. Edit in Google Slides → download the .pptx, then upload to Google Slides
 *      (Drive → New → File upload → Open with Google Slides auto-converts).
 *   3. Present in browser  → open the interactive (non-editable) lessons/<id>/slides.html
 *
 * IMPORTANT — why the Google Slides path is "download then upload":
 * The live site (eduwonderlab.com) is behind HTTP Basic Auth, so external
 * services (Google Slides import-by-URL, Office Online) cannot fetch the hosted
 * .pptx — they would 401. The only reliable path is to download the .pptx and
 * upload it to Google Slides, which this page walks the teacher through.
 *
 * Pulls title / standard / objectives straight from each lesson's config.json.
 * Run: npm run generate-editable-slides
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const lessonsDir = path.join(root, "lessons");

// Matches core lessons ("3-2") and flagship lessons ("3-2-flagship").
const LESSON_DIR_RE = /^(\d+)-(\d+)(-flagship)?$/;

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const PALETTE = `
:root{
  --navy:#12355b; --teal:#0f766e; --teal-700:#0c5e57; --teal-light:#dff2ee;
  --amber:#f2c15b; --amber-light:#fef0d8; --cream:#f7f4ec; --ink:#21313f;
  --muted:#5f6f80; --line:#d7e2ed; --ppt:#c43e1c; --gslides:#f6b40a;
}
*{box-sizing:border-box}
body{margin:0;background:var(--cream);color:var(--ink);
  font-family:Calibri,"Segoe UI",system-ui,sans-serif;line-height:1.6;font-size:18px;}
.wrap{max-width:880px;margin:0 auto;padding:24px 18px 72px;}
a{color:var(--navy);}
.crumbs{font-size:15px;margin:0 0 18px;}
.crumbs a{color:var(--teal);text-decoration:none;font-weight:600;}
.crumbs a:hover{text-decoration:underline;}
.crumbs span{color:var(--muted);}
.eyebrow{color:var(--teal);font-weight:700;letter-spacing:.05em;text-transform:uppercase;
  font-size:13px;margin:0;}
h1{font-family:Outfit,system-ui,sans-serif;color:var(--navy);margin:6px 0 6px;font-size:30px;line-height:1.2;}
.sub{color:var(--muted);margin:0 0 18px;font-size:16px;}
.std{display:inline-block;background:var(--teal-light);color:var(--teal);border:1px solid var(--teal);
  border-radius:999px;font-size:13px;font-weight:700;padding:3px 12px;margin-left:8px;vertical-align:middle;}
.obj{background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px 18px;margin:0 0 22px;}
.obj p{margin:0 0 8px;}
.obj p:last-child{margin:0;}
.obj .lbl{display:inline-block;min-width:172px;color:var(--teal);font-weight:700;font-size:14px;
  text-transform:uppercase;letter-spacing:.03em;}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px;margin:0 0 8px;}
.card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:20px 20px 22px;
  display:flex;flex-direction:column;}
.card .ico{font-size:34px;line-height:1;margin:0 0 8px;}
.card h2{font-family:Outfit,system-ui,sans-serif;color:var(--navy);font-size:21px;margin:0 0 6px;}
.card .tag{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;
  color:var(--muted);margin:0 0 10px;}
.card p{margin:0 0 14px;font-size:15.5px;color:var(--ink);}
.card ol{margin:0 0 16px;padding-left:20px;font-size:15px;color:var(--ink);}
.card ol li{margin:0 0 6px;}
.card .btn{margin-top:auto;}
.btn{display:inline-flex;align-items:center;gap:8px;justify-content:center;
  background:var(--teal);color:#fff;text-decoration:none;font-weight:700;font-size:16px;
  border:2px solid var(--teal);border-radius:10px;padding:12px 18px;cursor:pointer;
  transition:background .15s,transform .05s;}
.btn:hover{background:var(--teal-700);border-color:var(--teal-700);}
.btn:active{transform:translateY(1px);}
.btn:focus-visible{outline:3px solid var(--amber);outline-offset:2px;}
.btn.ppt{background:var(--ppt);border-color:var(--ppt);}
.btn.ppt:hover{background:#a8330f;border-color:#a8330f;}
.btn.ghost{background:#fff;color:var(--navy);border-color:var(--navy);}
.btn.ghost:hover{background:var(--navy);color:#fff;}
.note{background:var(--amber-light);border:1px solid var(--amber);border-radius:10px;
  padding:14px 16px;font-size:15px;margin:18px 0 0;}
.note strong{color:var(--navy);}
footer{color:var(--muted);font-size:14px;text-align:center;margin-top:32px;}
@media (max-width:560px){h1{font-size:25px;}.obj .lbl{min-width:0;display:block;}}
@media print{
  .crumbs,footer,.btn{}
  body{background:#fff;}
  .card,.obj{break-inside:avoid;border-color:#bbb;}
}
`.trim();

function page({ id, unit, lesson, title, standard, contentObjective, languageObjective }) {
  const lessonNum = `Unit ${unit}, Lesson ${lesson}`;
  const stdBadge = standard ? `<span class="std">${esc(standard)}</span>` : "";
  const co = contentObjective
    ? `<p><span class="lbl">Content objective</span> ${esc(contentObjective)}</p>`
    : "";
  const lo = languageObjective
    ? `<p><span class="lbl">Language objective</span> ${esc(languageObjective)}</p>`
    : "";
  const objBlock = co || lo
    ? `<div class="obj">
      <p style="margin:0 0 10px;font-weight:700;color:var(--navy);">Confirm this is the right deck</p>
      ${co}
      ${lo}
    </div>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>Editable Slides — ${esc(lessonNum)}: ${esc(title)}</title>
<!-- generated:editable-slides lesson=${esc(id)} — regenerate: npm run generate-editable-slides -->
<link rel="stylesheet" href="/assets/shared.css" />
<style>${PALETTE}</style>
</head>
<body>
<div class="wrap">
<nav class="crumbs">
  <a href="/">Home</a> <span>/</span>
  <a href="/curriculum/">Math</a> <span>/</span>
  <a href="/lessons/${esc(id)}/">${esc(lessonNum)}</a> <span>/</span>
  <span>Editable Slides</span>
</nav>

<p class="eyebrow">Editable Slides</p>
<h1>${esc(title)}${stdBadge}</h1>
<p class="sub">${esc(lessonNum)} · Open this lesson's deck in PowerPoint or Google Slides, or present it live in the browser.</p>

${objBlock}

<div class="grid">

  <div class="card">
    <div class="ico" aria-hidden="true">📊</div>
    <h2>Edit in PowerPoint</h2>
    <p class="tag">Microsoft · .pptx download</p>
    <p>Download the fully editable deck — it includes a title slide, a Content &amp; Language Objectives slide, and a Turn &amp; Talk discussion slide for each phase.</p>
    <a class="btn ppt" href="/lessons/${esc(id)}/slides.pptx" download>
      ⬇ Download .pptx
    </a>
  </div>

  <div class="card">
    <div class="ico" aria-hidden="true">🟡</div>
    <h2>Edit in Google Slides</h2>
    <p class="tag">Google · upload to convert</p>
    <ol>
      <li><strong>Download the .pptx</strong> using the button below.</li>
      <li>In Google Drive, click <strong>New → File upload</strong> and choose the file.</li>
      <li>Right-click it → <strong>Open with → Google Slides</strong> (it converts automatically).</li>
    </ol>
    <a class="btn ghost" href="/lessons/${esc(id)}/slides.pptx" download style="margin-bottom:8px;">
      ⬇ Download .pptx first
    </a>
    <a class="btn" href="https://drive.google.com/" target="_blank" rel="noopener">
      Open Google Drive ↗
    </a>
  </div>

  <div class="card">
    <div class="ico" aria-hidden="true">🖥️</div>
    <h2>Present in browser</h2>
    <p class="tag">Live · projector view</p>
    <p>Open the interactive lesson deck full-screen for projecting in class. This view is for presenting, not editing.</p>
    <a class="btn ghost" href="/lessons/${esc(id)}/slides.html">
      ▶ Present in browser
    </a>
  </div>

</div>

<div class="note">
  <strong>Why upload instead of "import by link"?</strong>
  Our class site is password-protected, so Google Slides and Office Online can't open the deck from a web link.
  Downloading the <code>.pptx</code> and uploading it to Google Slides always works — it's the same deck, fully editable.
</div>

<footer>Neft Teacher · Grade 6 Math · auto-generated from the lesson plan — regenerate with <code>npm run generate-editable-slides</code>.</footer>
</div>
</body>
</html>`;
}

function main() {
  console.log("Generating editable-slides.html launcher pages...");
  const lessons = fs
    .readdirSync(lessonsDir)
    .filter((d) => LESSON_DIR_RE.test(d))
    .filter((d) => fs.existsSync(path.join(lessonsDir, d, "config.json")));

  let count = 0;
  let skipped = [];
  for (const id of lessons) {
    try {
      const cfg = JSON.parse(
        fs.readFileSync(path.join(lessonsDir, id, "config.json"), "utf8")
      );
      const m = id.match(LESSON_DIR_RE);
      const unit = cfg.unit ?? (m ? Number(m[1]) : "");
      const lesson = cfg.lesson ?? (m ? Number(m[2]) : "");
      const html = page({
        id,
        unit,
        lesson,
        title: cfg.title || id,
        standard: cfg.standard || "",
        contentObjective: cfg.contentObjective || "",
        languageObjective: cfg.languageObjective || "",
      });
      fs.writeFileSync(
        path.join(lessonsDir, id, "editable-slides.html"),
        html,
        "utf8"
      );
      count++;
    } catch (e) {
      skipped.push(id);
      console.error(`Failed to generate editable-slides for ${id}:`, e.message);
    }
  }

  console.log(`Successfully generated editable-slides.html for ${count} lessons.`);
  if (skipped.length) console.warn(`Skipped: ${skipped.join(", ")}`);
}

main();
